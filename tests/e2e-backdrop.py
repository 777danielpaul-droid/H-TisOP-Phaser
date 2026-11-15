# Browser-Ende-zu-Ende-Test für den eigenen Hintergrund (echtes Chromium): Drag & Drop, Upload-Dialog, Video, Zeilen-Drop, Original/Entfernen, Neuladen (IndexedDB), ungültige Datei.
# Voraussetzungen: pip install playwright && playwright install chromium; ffmpeg; Pillow. Vorher: node tools/build.mjs.   Aufruf: python3 tests/e2e-backdrop.py
import os, subprocess, tempfile, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TMP = pathlib.Path(tempfile.mkdtemp(prefix='hitisop-bg-'))
os.chdir(TMP)
from PIL import Image, ImageDraw
im = Image.new('RGB', (1600, 900)); d = ImageDraw.Draw(im)
for y in range(900): d.line([(0, y), (1600, y)], fill=(int(230 * (1 - y / 900)) + 20, 90, 40 + int(180 * y / 900)))
d.ellipse((1100, 120, 1400, 420), fill=(255, 240, 160)); im.save('bg.png')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=3', '-c:v', 'libvpx', '-b:v', '600k', '-pix_fmt', 'yuv420p', 'bg.webm'], check=True)
import base64, json, sys, time
from playwright.sync_api import sync_playwright
URL=(ROOT/'dist'/'hitisop.html').as_uri()
png=base64.b64encode(open('bg.png','rb').read()).decode()
webm=base64.b64encode(open('bg.webm','rb').read()).decode()
errs=[]
def ok(c,m):
    print(('ok   ' if c else 'FAIL ')+m)
    if not c: globals()['bad']=True
bad=False
DROP='''async ({b64,name,type,sel,x,y})=>{
 const bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);
 const f=new File([a],name,{type});const dt=new DataTransfer();dt.items.add(f);
 const tgt=sel?document.querySelector(sel):document.body;
 const mk=t=>new DragEvent(t,{dataTransfer:dt,bubbles:true,cancelable:true,clientX:x||50,clientY:y||50});
 tgt.dispatchEvent(mk('dragenter'));tgt.dispatchEvent(mk('dragover'));
 const ovShown=!document.getElementById('bgdrop').classList.contains('hidden');
 tgt.dispatchEvent(mk('drop'));
 await new Promise(r=>setTimeout(r,900));
 return {ovShown};
}'''
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport={'width':1280,'height':720})
    page=ctx.new_page()
    page.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    page.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' else None)
    page.goto(URL); page.wait_for_timeout(1500)
    ok(page.evaluate('!!window.__bgui && !!window.__renderer.bd'),'Backdrop + Panel sind verdrahtet')
    ok(page.evaluate("!document.getElementById('bgbtn').classList.contains('hidden')"),'Knopf "Hintergrund" im Titelmenü sichtbar')
    page.screenshot(path='01_title_default.png')
    # --- Drop PNG irgendwo ins Titelmenü ---
    r=page.evaluate(DROP,{'b64':png,'name':'bg.png','type':'image/png'})
    ok(r['ovShown'],'Drop-Overlay erscheint beim Ziehen')
    ok(page.evaluate("!document.getElementById('bgdrop').classList.contains('hidden')")==False,'Overlay nach Drop wieder weg')
    st=page.evaluate("JSON.stringify(Object.keys(__renderer.bd.items))")
    ok(st=='["all"]','Bild als "Überall" gesetzt: '+st)
    ok(page.evaluate("__renderer.bd.has('title')&&__renderer.bd.has('select')&&__renderer.bd.has('fight')"),'gilt für Titel, Auswahl und Kampf')
    page.wait_for_timeout(500); page.screenshot(path='02_title_png.png')
    # --- weiter zur Auswahl ---
    page.keyboard.press('Enter'); page.wait_for_timeout(1500)
    ok(page.evaluate("__arcade.state")=='select','Auswahlbildschirm erreicht')
    ok(page.evaluate("!document.getElementById('bgbtn').classList.contains('hidden')"),'Knopf auch in der Auswahl sichtbar')
    page.screenshot(path='03_select_png.png')
    # --- in den Kampf ---
    page.keyboard.press('Enter')
    t=time.time()
    while time.time()-t<40 and page.evaluate("__arcade.state")=='select': page.wait_for_timeout(500)
    page.wait_for_timeout(3500)
    ok(page.evaluate("__arcade.state")!='select','Kampf gestartet (state='+page.evaluate("__arcade.state")+')')
    ok(page.evaluate("document.getElementById('bgbtn').classList.contains('hidden')"),'Knopf im Kampf ausgeblendet')
    page.screenshot(path='04_fight_png.png')
    # --- Drop Video im Kampf ---
    page.evaluate(DROP,{'b64':webm,'name':'bg.webm','type':'video/webm'})
    page.wait_for_timeout(800)
    info=page.evaluate("JSON.stringify({k:__renderer.bd.items.all, has:__renderer.bd.has('fight'), paused:__renderer.bd.media.all&&__renderer.bd.media.all.el.paused, t:__renderer.bd.media.all&&__renderer.bd.media.all.el.currentTime})")
    print('video info',info)
    ok('"video"' in info and '"has":true' in info,'Video als Kampf-Hintergrund aktiv')
    page.screenshot(path='05_fight_video_a.png'); page.wait_for_timeout(1200); page.screenshot(path='06_fight_video_b.png')
    t1=page.evaluate("__renderer.bd.media.all.el.currentTime"); ok(t1>0.3,'Video läuft (currentTime=%.2f)'%t1)
    # --- Pausenmenü: Optionen-Zeile + Panel ---
    page.keyboard.press('KeyM'); page.wait_for_timeout(300)
    page.click('button[data-tab=options]'); page.wait_for_timeout(200)
    page.click('#btn-bg'); page.wait_for_timeout(500)
    ok(page.evaluate("__bgui.isOpen"),'Pausenmenü → Optionen → "Verwalten" öffnet das Panel')
    page.screenshot(path='07_panel.png')
    # Upload per Dateiauswahl in Zeile "Titelmenü"
    with page.expect_file_chooser() as fc:
        page.click('.bgrow[data-slot=title] .bgpick')
    fc.value.set_files('bg.png'); page.wait_for_timeout(900)
    ok(page.evaluate("Object.keys(__renderer.bd.items).sort().join()")=='all,title','Upload per Dialog für "Titelmenü"')
    # Drop auf Zeile "Kampf" mit PNG
    page.evaluate(DROP,{'b64':png,'name':'fight.png','type':'image/png','sel':'.bgrow[data-slot=fight]'})
    ok(page.evaluate("__renderer.bd.items.fight&&__renderer.bd.items.fight.name")=='fight.png','Drop auf Zeile setzt nur den Kampf')
    # Original für Auswahl
    page.click('.bgrow[data-slot=select] .bgoff'); page.wait_for_timeout(300)
    ok(page.evaluate("__renderer.bd.has('select')")==False and page.evaluate("__renderer.bd.has('title')"),'"Original" für Auswahl wirkt, Titel behält eigenes')
    page.screenshot(path='08_panel_slots.png')
    # Slider
    page.evaluate("(()=>{const s=document.querySelector('.bgdim');s.value=60;s.dispatchEvent(new Event('input'))})()")
    ok(abs(page.evaluate("__renderer.bd.opts.dim")-.6)<.01,'Abdunkel-Regler wirkt')
    # Taste im Panel darf Spiel nicht beeinflussen; Esc schließt
    page.keyboard.press('KeyM'); ok(page.evaluate("document.getElementById('menu').classList.contains('hidden')")==False,'M im Panel ignoriert (Menü bleibt offen)')
    page.keyboard.press('Escape'); page.wait_for_timeout(200)
    ok(page.evaluate("__bgui.isOpen")==False,'Esc schließt das Panel')
    # --- Persistenz: neu laden ---
    page.reload(); page.wait_for_timeout(2500)
    items=page.evaluate("JSON.stringify(Object.fromEntries(Object.entries(__renderer.bd.items).map(([k,v])=>[k,v.off?'off':v.name])))")
    print('nach Reload:',items)
    ok('bg.webm' in items and 'fight.png' in items and 'bg.png' in items,'Hintergründe überleben Neuladen (IndexedDB)')
    ok(page.evaluate("__renderer.bd.has('title')"),'Titel zeigt nach Reload eigenen Hintergrund')
    page.screenshot(path='09_title_after_reload.png')
    # Entfernen
    page.keyboard.press('KeyH'); page.wait_for_timeout(300)
    ok(page.evaluate("__bgui.isOpen"),'Taste H öffnet Panel im Titelmenü')
    for s in ['title','select','fight','all']:
        page.click(f'.bgrow[data-slot={s}] .bgclr'); page.wait_for_timeout(150)
    ok(page.evaluate("Object.keys(__renderer.bd.items).length")==0,'Alles entfernt -> Standard')
    # ungültige Datei
    page.keyboard.press('Escape')
    page.evaluate(DROP,{'b64':base64.b64encode(b'hello').decode(),'name':'x.txt','type':'text/plain'})
    ok(page.evaluate("document.getElementById('bgtoast').className")=='err','Textdatei wird abgelehnt (Hinweis)')
    ok(page.evaluate("Object.keys(__renderer.bd.items).length")==0,'nichts gesetzt bei ungültiger Datei')
    print('Fehler:',errs[:6])
    ok(len(errs)==0,'keine JS-Fehler')
    b.close()
sys.exit(1 if bad else 0)
