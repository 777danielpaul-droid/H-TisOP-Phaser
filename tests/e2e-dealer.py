# Browser-Ende-zu-Ende-Test: Schwarzmarkthändler KORVUS (Story), Shop-Kauf des Raben, Charakterwahl, Kampf als Rabe.
# Voraussetzung: playwright + chromium, vorher node tools/build.mjs.  Aufruf: python3 tests/e2e-dealer.py   (Screenshots landen im Temp-Ordner)
import json, sys, pathlib, tempfile, os
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=(ROOT/'dist'/'hitisop.html').as_uri()
os.chdir(tempfile.mkdtemp(prefix='hitisop-dealer-'));print('Screenshots in',os.getcwd())
bad=False
def ok(c,m):
    global bad
    print(('ok   ' if c else 'FAIL ')+m)
    if not c: bad=True
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':1280,'height':720});pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.add_init_script("if(!localStorage.getItem('hitisop.loot'))localStorage.setItem('hitisop.loot',JSON.stringify({packs:0,coins:40,cards:{},skins:{},stages:[]}))")
    def boot():
        pg.goto(URL);pg.wait_for_timeout(1500)
        pg.keyboard.press('Enter');pg.wait_for_timeout(900)   # Intro überspringen
        pg.evaluate("document.querySelector('[data-mode=story]').click()");pg.wait_for_timeout(1500)   # Startseite: Story wählen -> Charakterwahl
    boot()
    # --- Story starten ---
    pg.evaluate("__arcade.setMode('story')")
    pg.evaluate("__arcade.startStory('tiger',1)");pg.wait_for_timeout(5500)
    ok(pg.evaluate("__game.phase")=='fight','Story läuft (Kampfphase)')
    ok(pg.evaluate("!!__game.story.dealer")==True,'Händler im Level')
    pg.evaluate("(()=>{const d=__game.story.dealer,p=__game.p1;p.x=d.x-90})()");pg.wait_for_timeout(700)
    pg.screenshot(path='1_npc_prompt.png')
    ok(pg.evaluate("__game.story.dealer.near")==True,'Händler ansprechbar in der Nähe')
    pg.keyboard.press('KeyE');pg.wait_for_timeout(1800)
    ok(pg.evaluate("__game.story.dealer.active")==True,'E öffnet den Dialog')
    pg.screenshot(path='2_dialog_greeting.png')
    pg.keyboard.press('Enter');pg.wait_for_timeout(300)
    pg.keyboard.press('Enter');pg.wait_for_timeout(1500)   # Booster-Knoten
    ok(pg.evaluate("__game.story.dealer.node")=='booster','Booster-Angebot')
    pg.screenshot(path='3_dialog_booster.png')
    x0=pg.evaluate("__game.p1.x");pg.keyboard.down('KeyD');pg.wait_for_timeout(500);pg.keyboard.up('KeyD')
    ok(abs(pg.evaluate("__game.p1.x")-x0)<2,'Spieler steht im Gespräch still')
    pg.keyboard.press('Escape');pg.wait_for_timeout(200)
    pg.keyboard.press('ArrowDown');pg.keyboard.press('Enter');pg.wait_for_timeout(1500)   # Gegenstände
    ok(pg.evaluate("__game.story.dealer.node")=='items','Gegenstände-Angebot')
    pg.screenshot(path='4_dialog_items.png')
    pg.evaluate("__game.p1.hp=__game.p1.maxHp*.4");c0=pg.evaluate("__renderer&&JSON.parse(localStorage.getItem('hitisop.loot')).coins")
    pg.keyboard.press('Enter');pg.wait_for_timeout(500)
    ok(pg.evaluate("JSON.parse(localStorage.getItem('hitisop.loot')).coins")==c0-25,'Energiedrink: 25 Coins abgebucht und gespeichert')
    ok(pg.evaluate("__game.p1.hp/__game.p1.maxHp")>.6,'Energiedrink heilt')
    pg.keyboard.press('Escape');pg.keyboard.press('ArrowDown');pg.keyboard.press('ArrowDown');pg.keyboard.press('Enter');pg.wait_for_timeout(1500)
    ok(pg.evaluate("__game.story.dealer.node")=='hire','Anheuern-Knoten')
    pg.screenshot(path='5_dialog_hire.png')
    # Mausklick auf „ZURÜCK“ (2. Zeile) und Gespräch mit Escape beenden
    pg.keyboard.press('Escape');pg.keyboard.press('Escape');pg.wait_for_timeout(300)
    ok(pg.evaluate("__game.story.dealer.active")==False,'Gespräch beendet')
    # --- Kauf des Raben im Ingame-Shop (Charakterwahl) ---
    pg.evaluate("__arcade.toSelect&&__arcade.toSelect()");pg.wait_for_timeout(1200)
    pg.evaluate("localStorage.setItem('hitisop.loot',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('hitisop.loot')),{coins:25})))")
    boot()
    ok('rabe' not in pg.evaluate("__arcade.constructor.slotIds()"),'Rabe vor dem Kauf nicht wählbar')
    pg.keyboard.press('KeyP');pg.wait_for_timeout(500)
    ok(pg.evaluate("__shopclip.active"),'Transfer-Clip läuft beim Betreten des Shops')
    pg.keyboard.press('Enter');pg.wait_for_timeout(600)   # Clip überspringen
    ok(not pg.evaluate("__shopclip.active"),'Clip übersprungen')
    ok(pg.evaluate("__renderer.lootUi.mode")=='shop','Shop offen')
    pg.screenshot(path='6_shop_before.png')
    for _ in range(3): pg.keyboard.press('ArrowRight')
    pg.wait_for_timeout(200);ok(pg.evaluate("__renderer.lootUi.sel")==3,'Rabe-Karte angewählt')
    pg.keyboard.press('Enter');pg.wait_for_timeout(600)
    pg.screenshot(path='7_shop_bought.png')
    ok(pg.evaluate("JSON.parse(localStorage.getItem('hitisop.loot')).coins")==15,'10 Coins abgebucht (25 -> 15)')
    ok('rabe' in pg.evaluate("JSON.parse(localStorage.getItem('hitisop.unlocks')||'[]')"),'Freischaltung gespeichert')
    pg.keyboard.press('Enter');pg.wait_for_timeout(500)
    ok(pg.evaluate("JSON.parse(localStorage.getItem('hitisop.loot')).coins")==15,'Doppelkauf verhindert (Coins unverändert)')
    # --- Neustart: Rabe bleibt freigeschaltet, in der Charakterwahl wählbar ---
    boot()
    ok('rabe' in pg.evaluate("__arcade.constructor.slotIds()"),'nach Neustart weiterhin wählbar')
    pg.evaluate("__arcade.cursor=__arcade.constructor.slotIds().indexOf('rabe')");pg.wait_for_timeout(1200)
    pg.screenshot(path='8_select_rabe.png')
    # --- Kampf als Rabe (Arcade) ---
    pg.evaluate("__arcade.setMode('arcade');__arcade.start('rabe')");pg.wait_for_timeout(5500)
    ok(pg.evaluate("__game.p1.char.id")=='rabe','Rabe spielbar im Kampf')
    pg.screenshot(path='9_fight_idle.png')
    for k,name in [('KeyJ','punch'),('KeyK','kick'),('KeyL','heavy'),('KeyU','special')]:
        pg.keyboard.press(k);pg.wait_for_timeout(180);pg.screenshot(path='10_fight_%s.png'%name)
        pg.wait_for_timeout(700)
    pg.evaluate("__game.p1.meter=300");pg.keyboard.press('KeyI');pg.wait_for_timeout(900);pg.screenshot(path='11_fight_hyper.png')
    pg.wait_for_timeout(2500)
    pg.keyboard.down('KeyW');pg.wait_for_timeout(250);pg.screenshot(path='12_fight_jump.png');pg.keyboard.up('KeyW')
    ok(len(errs)==0,'keine Konsolenfehler '+str(errs[:3]))
    b.close()
sys.exit(1 if bad else 0)
