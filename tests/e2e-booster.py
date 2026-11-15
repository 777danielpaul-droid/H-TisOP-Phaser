# Browser-Ende-zu-Ende-Test: Booster aufreißen (Päckchen, Aufreißen, Karten einzeln aufdecken, Feuerwerk nach Wert, Übersicht, ESC/Klick). Voraussetzung: playwright + chromium, vorher node tools/build.mjs.   Aufruf: python3 tests/e2e-booster.py
import json, time, sys
from playwright.sync_api import sync_playwright
import pathlib, tempfile, os
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=(ROOT/'dist'/'hitisop.html').as_uri()
os.chdir(tempfile.mkdtemp(prefix='hitisop-booster-'))   # Screenshots (p1_idle.png …) landen hier
print('Screenshots in',os.getcwd())
RW=[{'type':'coins','n':12},
    {'type':'skin','char':'tiger','idx':1,'name':'ROT','col':'#ff4a3a','isNew':True},
    {'type':'card','id':'koenigin','name':'Schwarm-Königin','r':2,'isNew':True}]
bad=False
def ok(c,m):
    global bad
    print(('ok   ' if c else 'FAIL ')+m)
    if not c: bad=True
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_context(viewport={'width':1280,'height':720}).new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.add_init_script("localStorage.setItem('hitisop.loot',JSON.stringify({packs:2,coins:0,cards:{},skins:{},stages:[]}))")
    pg.goto(URL);pg.wait_for_timeout(1200)
    pg.keyboard.press('Enter');pg.wait_for_timeout(900)          # Startseite -> Auswahl
    pg.keyboard.press('KeyB');pg.wait_for_timeout(500)           # Booster-Übersicht
    ok(pg.evaluate("__renderer.lootUi.open&&__renderer.lootUi.mode")=='main','Booster-Übersicht offen')
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)          # Booster öffnen (echt, zufällig)
    st=lambda:pg.evaluate("(()=>{const p=__renderer.lootUi.po;return p?[p.ph,p.pt,p.k]:null})()")
    ok(pg.evaluate("__renderer.lootUi.mode")=='reveal' and st() is not None,'Öffnen startet die Animation: '+str(st()))
    ph0=st()[0]; ok(ph0=='idle','erst schwebt das Päckchen (idle), kein Auto-Aufdecken')
    pg.keyboard.press('Escape');pg.wait_for_timeout(200)         # ESC überspringt
    ok(pg.evaluate("__renderer.lootUi.mode")=='main' and pg.evaluate("__renderer.lootUi.po")is None,'ESC bricht ab -> Übersicht')
    # --- erzwungene Preise ---
    pg.evaluate("__reveal(%s)"%json.dumps(RW))
    def until(f,ms=15000):
        t=time.time()
        while time.time()-t<ms/1000:
            s=st()
            if s and f(*s): return s
            pg.wait_for_timeout(30)
        return None
    pg.wait_for_timeout(1500);pg.screenshot(path='p1_idle.png')
    pg.keyboard.press('Enter');until(lambda ph,pt,k:ph=='tear' and pt>=38);pg.screenshot(path='p2_charge.png')
    until(lambda ph,pt,k:ph=='tear' and pt>=52);pg.screenshot(path='p3_rip.png')
    until(lambda ph,pt,k:ph=='pop' and pt>=60);pg.screenshot(path='p4_pop.png')
    s=until(lambda ph,pt,k:ph=='show' and k==0 and pt>=10);pg.screenshot(path='p5_fly0.png')
    imp0=pg.evaluate("__renderer.lootUi.po.impAt(0)");imp1=pg.evaluate("__renderer.lootUi.po.impAt(1)");imp2=pg.evaluate("__renderer.lootUi.po.impAt(2)")
    ok(imp0<imp1<imp2,'Spannung wächst mit dem Wert (Einschlag-Frames %d < %d < %d)'%(imp0,imp1,imp2))
    until(lambda ph,pt,k:ph=='show' and k==0 and pt>=imp0+8);pg.screenshot(path='p6_prize0_coins.png')
    until(lambda ph,pt,k:ph=='show' and k==0 and pt>=imp0+32)
    pg.keyboard.press('Enter');until(lambda ph,pt,k:ph=='show' and k==1 and pt>=imp1-8);pg.screenshot(path='p7_hold1.png')
    until(lambda ph,pt,k:ph=='show' and k==1 and pt>=imp1+10);pg.screenshot(path='p8_prize1_skin.png')
    until(lambda ph,pt,k:ph=='show' and k==1 and pt>=imp1+32)
    pg.keyboard.press('Enter');until(lambda ph,pt,k:ph=='show' and k==2 and pt>=imp2-6);pg.screenshot(path='p9_hold2.png')
    until(lambda ph,pt,k:ph=='show' and k==2 and pt>=imp2+5);pg.screenshot(path='pa_prize2_jackpot_a.png')
    pg.wait_for_timeout(500);pg.screenshot(path='pb_prize2_jackpot_b.png')
    until(lambda ph,pt,k:ph=='show' and k==2 and pt>=imp2+34)
    pg.keyboard.press('Enter');until(lambda ph,pt,k:ph=='sum' and pt>=40);pg.wait_for_timeout(300);pg.screenshot(path='pc_sum.png')
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)
    ok(pg.evaluate("__renderer.lootUi.mode")=='main','ENTER in der Übersicht -> zurück zur Sammlung')
    # Klick treibt ebenfalls voran
    pg.evaluate("__reveal(%s)"%json.dumps(RW[:1]*3));pg.wait_for_timeout(300)
    box=pg.evaluate("(()=>{const r=document.getElementById('screen').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()")
    pg.mouse.click(box[0],box[1]);pg.wait_for_timeout(200)
    ok(st()[0]=='tear','Mausklick reißt das Päckchen auf')
    print('Fehler:',errs[:5]);ok(not errs,'keine JS-Fehler')
    b.close()
sys.exit(1 if bad else 0)
