# Browser-Test Online-Modus: echter Server + zwei Chromium-Fenster. python3 tests/e2e-online.py  (Screenshots in /tmp/e2e-online)
import subprocess,time,os,sys,json
from playwright.sync_api import sync_playwright
PORT=3457;os.makedirs('/tmp/e2e-online',exist_ok=True)
srv=subprocess.Popen(['node','server/server.js'],env={**os.environ,'PORT':str(PORT)},stdout=subprocess.PIPE)
time.sleep(1.5);URL=f'http://127.0.0.1:{PORT}/'
def skip_intro(p):
    p.wait_for_selector('#intro video',timeout=60000);time.sleep(1.5);p.keyboard.press('Enter');time.sleep(2.5)   # Intro läuft sofort (kein Startknopf): ein Enter überspringt es
try:
    with sync_playwright() as pw:
        b=pw.chromium.launch(args=['--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader'])
        A=b.new_page(viewport={'width':1280,'height':720});B=b.new_page(viewport={'width':1280,'height':720})
        errs=[]
        for n,p in(('A',A),('B',B)):p.on('pageerror',lambda e,n=n:errs.append(n+': '+str(e)));p.goto(URL,timeout=120000)
        for p in(A,B):skip_intro(p)
        A.screenshot(path='/tmp/e2e-online/1_title.png')
        for p in(A,B):p.click('[data-mode=online]');time.sleep(.5)
        A.click('[data-k=host]');A.wait_for_selector('.nt-code',timeout=30000);code=A.inner_text('.nt-code');print('Code',code);A.screenshot(path='/tmp/e2e-online/2_host.png')
        B.fill('#nt-code',code);B.click('[data-k=join]')
        for p in(A,B):p.wait_for_selector('.nt-cols',timeout=30000)
        time.sleep(.5)
        A.click('[data-k=pickChar][data-v=tiger]');B.click('[data-k=pickChar][data-v=st3g0]');A.click('[data-k=ready]');B.click('[data-k=ready]')
        A.wait_for_selector('[data-k=start]',timeout=10000);time.sleep(.3);A.screenshot(path='/tmp/e2e-online/3_pick.png');B.screenshot(path='/tmp/e2e-online/3b_pick_guest.png')
        A.click('[data-k=start]')
        for p in(A,B):p.wait_for_function("window.__net()&&window.__net().phase==='play'",timeout=60000)
        print('läuft');
        # beide Spieler drücken Tasten (A: D/J, B: A/K)
        for i in range(60):
            A.keyboard.down('d');B.keyboard.down('a');A.keyboard.press('j');B.keyboard.press('k');time.sleep(.05);A.keyboard.up('d');B.keyboard.up('a')
        time.sleep(1);A.screenshot(path='/tmp/e2e-online/4_fight_A.png');B.screenshot(path='/tmp/e2e-online/4_fight_B.png')
        st=lambda p:p.evaluate("(()=>{const m=window.__net(),g=window.__game;return{fr:m.ls.fr,x:[g.p1.x,g.p2.x].map(v=>Math.round(v*64)),hp:[g.p1.hp,g.p2.hp],ph:g.phase,rtt:m.rtt,delay:m.ls.delay,stall:m.stalledMs}})()")
        sa,sb=st(A),st(B);print(sa,sb)
        # gleicher Frame vergleichen: beide pausieren nicht, daher Hash-Vergleich über Desync-Meldung: es darf keine geben
        for p in(A,B):assert p.evaluate("window.__net()&&window.__net().phase")=='play','Match beendet?'
        assert sa['fr']>200 and sb['fr']>200,'Frames laufen'
        time.sleep(3)
        for p in(A,B):assert p.evaluate("window.__net().ended")is None,'Desync/Ende'
        A.keyboard.press('Escape');time.sleep(.3);A.screenshot(path='/tmp/e2e-online/5_leave_ask.png');A.keyboard.press('Enter')
        B.wait_for_selector('#nt-msg',timeout=10000);time.sleep(.5);print('Gast-Meldung:',B.inner_text('#nt-msg'));B.screenshot(path='/tmp/e2e-online/6_peer_left.png')
        print('JS-Fehler:',errs);assert not errs
        b.close()
    print('E2E OK')
finally:srv.terminate()
