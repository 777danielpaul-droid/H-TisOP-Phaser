import sys, pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent
URL=(ROOT/'dist'/'hitisop.html').as_uri()
OUT=ROOT/'.shots'
with sync_playwright() as p:
    b=p.chromium.launch(channel='chrome')
    pg=b.new_context(viewport={'width':1280,'height':720}).new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.add_init_script("localStorage.setItem('hitisop.loot',JSON.stringify({packs:2,coins:120,cards:{},skins:{},stages:[]}))")
    pg.goto(URL);pg.wait_for_timeout(1200)
    pg.keyboard.press('Enter');pg.wait_for_timeout(1500)
    pg.locator('#start .modes button').first.click();pg.wait_for_timeout(2500)   # Startseite -> Charakterwahl (Arcade)
    pg.screenshot(path=str(OUT/'select_arcade.png'))
    pg.keyboard.press('Tab');pg.keyboard.press('Tab');pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT/'select_2p.png'))
    pg.keyboard.press('Tab');pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT/'select_melee.png'))
    print('errors:',errs)
    b.close()
