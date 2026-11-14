import{Game}from'./core/game.js';
import{Fighter}from'./core/fighter.js';
import{KeyboardInput,VS1_BUTTONS,VS1_DIRS,VS2_BUTTONS,VS2_DIRS}from'./core/input.js';
import{AIController,AI_LEVELS}from'./core/ai.js';
import{PadNav,menuKey,padLabel}from'./core/gamepad.js';
import{Arcade}from'./core/arcade.js';
import{CHARACTERS,ROSTER}from'./core/characters.js';
import{MOVE_LIST,charMoves}from'./core/moves.js';
import{SPEED,GFX,GFX_PRESETS,setGfx}from'./core/config.js';
import{openPack,buyPack,canBuy,LOOT,SHOP,ownsSkin,ownedStages}from'./core/loot.js';
import{NetClient,netServerUrl,connectPatient}from'./core/netclient.js';
import{NetMatch}from'./core/netmatch.js';
import{NetInput,NET,encInput}from'./core/netplay.js';
import{NetUi,netMessage}from'./render/netui.js';
import{skinCount,skinName}from'./render/skins.js';
import{THEMES}from'./render/stage.js';
import{hitShopCard,hitShopBack,hitShopBtn,hitShopSel,shopCardRect,shopBackRect,shopBtnRect,shopSelRect,boosterRect,lootOpenRect,lootCloseRect,inR}from'./render/lootui.js';
import{endBtnRect}from'./render/hover.js';
import{Renderer}from'./render/renderer.js';
import{Sound}from'./render/audio.js';
import{loadFonts}from'./render/fonts.js';
import{hitCar,hitChapter,hitEdit,hitMode,hitStage,hitVsCar,hitMeleeOpt,carRect,editRect,stageRect,vcarRect,MELEE_OPTS,MODE_PILL,CHAPTER_RECT}from'./render/select.js';
import{studioOpen,studioIsOpen,studioLoadSaved}from'./render/customstudio.js';
import{BgPanel}from'./render/bgpanel.js';
import{Intro}from'./render/intro.js';
import{MusicStore,MusicPanel}from'./render/musicpanel.js';
import{PackOpen}from'./render/packopen.js';
// Einstiegspunkt: Vollbild-Canvas, Eingabe, KI, Game-Loop (fester Schritt) und Pause-Menü (M).
console.info('H!TisOP Maus-Update v3 aktiv');loadFonts();   // eingebettete Schriften registrieren (Canvas + Menü)
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};   // Auswahl merken (falls Browser-Speicher verfügbar)
let saved=Math.max(0,Math.min(AI_LEVELS.length-1,+load('tf_difficulty',0)||0));
const kb=new KeyboardInput(window),ai=new AIController(saved);
const kbV1=new KeyboardInput(window,VS1_BUTTONS,VS1_DIRS),kbV2=new KeyboardInput(window,VS2_BUTTONS,VS2_DIRS);   // 2-Spieler-Modus: getrennte Tastaturhälften
const clearInputs=()=>{for(const k of[kb,kbV1,kbV2]){k.keys.clear();k.pend.length=0;k.clear();k.syncPad()}};   // syncPad: gehaltene Controller-Tasten (z. B. ✕ zum Bestätigen) lösen nach dem Menü keinen Schlag aus
const p1=new Fighter({char:CHARACTERS[ROSTER[0]],x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
const game=new Game(p1,p2),canvas=$('screen'),renderer=new Renderer(canvas),arcade=new Arcade(game,p1,p2,ai);arcade.difficulty=saved;
let menuOpen=false,speed=SPEED;
// ---- Eigener Hintergrund (Bild/Video): Drag & Drop ins Fenster, Upload-Panel (Knopf links unten, Taste H, Pausenmenü → Optionen). Zeichnen: render/backdrop.js, Einhängepunkte im Renderer. ----
const bgUi=new BgPanel(renderer.bd,{blocked:()=>studioIsOpen()||musicUi.isOpen,onOpen:()=>clearInputs(),onClose:()=>{clearInputs();canvas.focus()}});bgUi.mount();renderer.bd.init();
// ---- Intro-Video (Spielstart): erst Startknopf (Klick/Enter gibt den Ton frei), dann Video + Menümusik; Enter/Esc/Klick überspringt, danach Titelmenü. Währenddessen steht das Spiel still. ----
const intro=new Intro(()=>{clearInputs();canvas.focus();if(start){start.classList.add('go');startAutoOpen()}if(netPendingRoom)setTimeout(()=>{const c=netPendingRoom;netPendingRoom=null;netOpen('start');netAct('join',c)},350)},()=>{sound.unlock();sound.music('menu')},()=>!!(sound.ctx&&sound.ctx.state==='running'));   // Intro vorbei/übersprungen -> H!TisOP-Schriftzug beginnt sich zu schreiben
// ---- Eigene Musik: Playlist für Menü- und Kampfmusik (Panel: Knopf links unten / Taste N / Pausenmenü → Optionen). Dateien liegen in IndexedDB; Wiedergabe: Sound.setPlaylist ----
const musicStore=new MusicStore();
const applyPl=k=>sound.setPlaylist(k,musicStore.items(k),musicStore.on[k],musicStore.shuf[k]);
const musicUi=new MusicPanel(musicStore,{onOpen:()=>clearInputs(),onClose:()=>{clearInputs();canvas.focus()},onChange:applyPl,now:k=>sound.plNow(k)});musicUi.mount();
musicStore.init().then(()=>{for(const k of['menu','fight'])applyPl(k);musicUi.refresh()});
// ---- Sound: Lautstärke/Stumm gemerkt; Audio startet erst nach der ersten Tasten-/Klick-Geste (Browser-Regel) ----
const sound=new Sound();game.audio=sound;sound.setVolume(+load('tf_volume',.7));sound.setMuted(load('tf_mute','0')==='1');
for(const ev of['keydown','pointerdown'])addEventListener(ev,()=>sound.unlock());
document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.suspend();else sound.resume()});   // Tab im Hintergrund: Ton aus
const musicFor=()=>arcade.state==='select'?'menu':'fight';   // Auswahlmenüs (Charakter/Stage/Editor) = Menü-Track, alles andere (Kampf, Zwischenscreens) = Kampf-Track
// ---- Grafik: 'auto' | 0 Niedrig | 1 Mittel | 2 Hoch (gemerkt in localStorage tf_gfx). Auto startet auf Hoch und schaltet bei dauerhaft niedriger Bildrate herunter. ----
let gfxMode=load('tf_gfx','auto');if(gfxMode!=='auto'&&!(+gfxMode>=0&&+gfxMode<=2))gfxMode='auto';
const applyGfx=()=>{setGfx(gfxMode==='auto'?GFX.level:+gfxMode);renderer.applyGfx();resize()};
// ---- Canvas immer scharf: interne Auflösung folgt der Fenstergröße (max. 3200 px breit) ----
function resize(){const dpr=Math.min(GFX.dpr,window.devicePixelRatio||1);const w=Math.max(960,Math.min(GFX.maxW,Math.round((canvas.clientWidth||1920)*dpr)));
 renderer.resize(w,Math.round(w*9/16))}
window.addEventListener('resize',resize);if(gfxMode!=='auto')setGfx(+gfxMode);renderer.applyGfx();resize();
// ---- Menü ----
const menu=$('menu'),tabs=[...document.querySelectorAll('.tabs button')],names=tabs.map(b=>b.dataset.tab);let tab=0;
const ml=$('movelist');const row=r=>`<tr><td class="mv">${r[0]}</td><td class="key">${r[1]}</td><td class="note">${r[2]}</td></tr>`;
const fillMoves=()=>{if(!ml)return;const c=p1.char;ml.innerHTML=`<tr><td colspan="3" class="mv">${c.name} – Stärken: ${c.pros||''} · Schwächen: ${c.cons||''}</td></tr>`+charMoves(c).map(row).join('')+MOVE_LIST.map(row).join('')};fillMoves();
function showTab(i){tab=(i+names.length)%names.length;names.forEach((n,k)=>{const s=$('tab-'+n);if(s)s.classList.toggle('hidden',k!==tab);if(tabs[k])tabs[k].classList.toggle('on',k===tab)})}
tabs.forEach((b,i)=>b.onclick=()=>showTab(i));showTab(0);
let padFocus=null;   // vom Controller markiertes Element im Pausenmenü
function setMenu(open){if(padFocus){padFocus.classList.remove('padfocus');padFocus=null}if(open)fillMoves();menuOpen=open;menu.classList.toggle('hidden',!open);clearInputs();if(!open)canvas.focus()}
const fs=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()};
canvas.addEventListener('dblclick',fs);
const on=(id,fn)=>{const e=$(id);if(e)e.onclick=()=>fn(e)};
on('btn-resume',()=>setMenu(false));
on('btn-debug',e=>{game.debug=!game.debug;e.textContent=game.debug?'An':'Aus';e.classList.toggle('on',game.debug)});
on('btn-meter',()=>{p1.meter=300});
on('btn-restart',()=>{if(arcade.pvp&&arcade.state!=='select')arcade.rematchVs();else game.rematch();setMenu(false)});
on('btn-select',()=>{arcade.toSelect();setMenu(false)});
on('btn-studio',()=>{arcade.toSelect();setMenu(false);arcade.cursor=CI();openStudio()});
on('btn-bg',()=>bgUi.open());
on('btn-playlist',()=>musicUi.open());
// ---- Startseite: Spielmodus vor dem ersten Kampf wählen (Arcade / Story / 2 Spieler / Melee) ----
const startEl=$('start');const start=startEl&&startEl.nodeType===1?startEl:null;let startOpen=!!start,startI=0;
const START_MODES=['arcade','story','versus','melee','online'];
const startPick=d=>{startI=(startI+d+START_MODES.length)%START_MODES.length;start.querySelectorAll('[data-mode]').forEach((b,i)=>b.classList.toggle('on',i===startI))};
const startGo=()=>{startMode(START_MODES[startI])};
const startMode=(m)=>{if(m==='online'){netOpen('start');return}arcade.setMode(m);startOpen=false;start.classList.add('hidden');canvas.focus();save('tf_startmode',m)};
// Titelmenü einklappen (freie Sicht auf den Demokampf): beim Betreten minimiert, nach ~2 s fährt es als Hologramm aus; V / Knopf schaltet um
// Cursor gekoppelt: 2 s ohne Mausbewegung -> Menü klappt ein, Bewegung -> klappt wieder aus. Manuell eingeklappt (V/Knopf) bleibt es zu, bis man es selbst wieder öffnet.
let startMinT=0,startIdleT=0,startPinned=false;
const startIdleArm=()=>{clearTimeout(startIdleT);if(start&&startOpen&&!startPinned)startIdleT=setTimeout(()=>{if(startOpen&&!startPinned)startMin(true)},2000)};
const startMin=on=>{if(!start)return;clearTimeout(startMinT);clearTimeout(startIdleT);if(!on)startPinned=false;start.classList.toggle('min',on);const tg=$('startToggle');if(tg)tg.setAttribute('aria-expanded',on?'false':'true');if(!on)startIdleArm()};
const startManual=()=>{const m=!startIsMin();startMin(m);startPinned=m};
let startQuiet=0;
const startAutoOpen=()=>{curShow();startMin(true);startQuiet=performance.now()+700};   // Titelmenü bleibt eingeklappt (freie Sicht auf den Demokampf), bis die Maus bewegt wird (oder eine Taste / V gedrückt wird)
const startIsMin=()=>!!start&&start.classList.contains('min');
const startTg=$('startToggle');if(startTg)startTg.onclick=()=>{startManual();canvas.focus()};
// Mauszeiger selbst: 2 s ohne Bewegung unsichtbar, bei Bewegung wieder sichtbar (nur im Titelmenü)
// Gilt jetzt in ALLEN Menüs (Titel, Charakter-/Stage-Wahl, Shop/Booster, Game Over / Sieg, Pause, Panels): Zeiger sichtbar bei Bewegung, nach 2 s Ruhe weg. Im Kampf bleibt er aus.
let startCurT=0,curWas=false,mouseL=null,endHot=-1;
const panelsOpen=()=>studioIsOpen()||bgUi.isOpen||musicUi.isOpen||netUi.isOpen;
const menuish=()=>!intro.active&&(startOpen||menuOpen||panelsOpen()||renderer.lootUi.open||(arcade.state!=='fight'&&!renderer.sel.launching));
const curShow=()=>{const b=document.body,m=menuish();b.classList.remove('nocur');if(m)b.classList.add('curon');clearTimeout(startCurT);if(m)startCurT=setTimeout(()=>{if(menuish())b.classList.add('nocur')},2000)};
window.addEventListener('mousemove',e=>{if(Math.abs(e.movementX||0)+Math.abs(e.movementY||0)<3)return;curShow();if(start&&startOpen&&!intro.active){if(startIsMin()){if(!startPinned&&performance.now()>startQuiet)startMin(false)}else startIdleArm()}});   // Mausbewegung während des Intros / direkt danach (Klick zum Überspringen) klappt das Menü nicht auf
window.addEventListener('mousedown',()=>{if(menuish())curShow()});
if(start){start.querySelectorAll('[data-mode]').forEach((b,i)=>{b.onclick=()=>{startI=i;startGo()}});const sm=load('tf_startmode','arcade');startI=START_MODES.indexOf(sm);if(startI<0)startI=0;startPick(0)}
// ---- Demokampf im Hintergrund der Startseite (KI vs KI, Albtraum-Stufe, variierende Matchups) ----
class DemoFight{
 constructor(){this.game=this.newGame();this.t=0;}
 newGame(){
  const ids=ROSTER.slice();
  const a=ids[Math.floor(Math.random()*ids.length)];
  let b=ids[Math.floor(Math.random()*ids.length)];
  while(ids.length>1&&b===a)b=ids[Math.floor(Math.random()*ids.length)];
  const ai1=new AIController(AI_LEVELS.length-1),ai2=new AIController(AI_LEVELS.length-1);
  const p1=new Fighter({char:CHARACTERS[a],x:340,facing:1,input:ai1});
  const p2=new Fighter({char:CHARACTERS[b],x:620,facing:-1,input:ai2});
  const dg=new Game(p1,p2);dg.stageIndex=0;dg.audio=sound;   // Kampf-Sounds auch in der Startseiten-Demo hörbar
  return dg;
 }
 step(){
  this.game.step();this.t++;
  if(this.game.phase==='match'&&this.game.pf>330){this.game=this.newGame();this.t=0;}
 }
}
const demo=start?new DemoFight():null;
const diff=$('difficulty');const setDiff=d=>{arcade.setDifficulty(d);save('tf_difficulty',String(arcade.difficulty));if(diff)diff.value=String(arcade.difficulty)};
if(diff){diff.value=String(arcade.difficulty);diff.onchange=()=>setDiff(+diff.value)}
const vol=$('volume'),mute=$('btn-mute');
if(vol){vol.value=String(sound.vol);vol.oninput=()=>{sound.setVolume(+vol.value);save('tf_volume',String(sound.vol))}}
const showMute=()=>{if(mute){mute.textContent=sound.muted?'Stumm':'An';mute.classList.toggle('on',!sound.muted)}};showMute();
if(mute)mute.onclick=()=>{sound.setMuted(!sound.muted);save('tf_mute',sound.muted?'1':'0');showMute()};
// Musik getrennt von den Effekten: Schalter (tf_music_mute) + Regler (tf_music_vol), gemerkt in localStorage
sound.setMusicVolume(+load('tf_music_vol',1));sound.setMusicMuted(load('tf_music_mute','0')==='1');
const mvol=$('musicvol'),mmute=$('btn-music');
if(mvol){mvol.value=String(sound.mvol);mvol.oninput=()=>{sound.setMusicVolume(+mvol.value);save('tf_music_vol',String(sound.mvol))}}
const showMusic=()=>{if(mmute){mmute.textContent=sound.mmuted?'Aus':'An';mmute.classList.toggle('on',!sound.mmuted)}};showMusic();
if(mmute)mmute.onclick=()=>{sound.setMusicMuted(!sound.mmuted);save('tf_music_mute',sound.mmuted?'1':'0');showMusic()};
const gsel=$('gfx');if(gsel){gsel.value=String(gfxMode);gsel.onchange=()=>{gfxMode=gsel.value;save('tf_gfx',gfxMode);if(gfxMode==='auto')setGfx(2);autoT=0;applyGfx()}}
const sp=$('speed');if(sp)sp.oninput=()=>{speed=+sp.value;$('speedval').textContent=speed.toFixed(1)+'×'};
if(sp){sp.value=speed;$('speedval').textContent=speed.toFixed(1)+'×'}
// ---- Startmenü (Charakterwahl): Tastatur + Maus ----
// 5. Slot = eigene Figur (Upload-Editor, gespeichert im Browser); leer => Klick/Enter öffnet den Editor
const SLOTS=()=>[...ROSTER,'custom'],CI=()=>ROSTER.length;
const openStudio=()=>{clearInputs();
 studioOpen(r=>{canvas.focus();clearInputs();
  if(r&&r.saved){arcade.cursor=CI();if(r.fight)startFight(CI())}else if(r&&r.deleted)arcade.cursor=Math.min(arcade.cursor,CI())})};
const useInputs=(versus,cpu)=>{const two=versus&&!cpu;p1.input=two?kbV1:kb;p2.input=two?kbV2:ai;clearInputs()};   // Melee gegen CPU: Spieler 1 spielt mit der normalen Belegung wie im Arcade
const startVersus=()=>{if(renderer.sel.launching)return;const v=arcade.vs,ids=Arcade.slotIds(),cpu=arcade.mode==='melee'&&arcade.cpu;
 renderer.sel.launch(ids[v.c1],()=>{useInputs(true,cpu);arcade.vsStart()},(n,o)=>game.sfx(n,o),ids[v.c2])};   // erst Videos + Feuerwerk, dann Kampf
const startFight=i=>{const id=SLOTS()[i];if(id==='custom'&&!CHARACTERS.custom){openStudio();return}if(renderer.sel.launching)return;useInputs(false);
 renderer.sel.launch(id,()=>{useInputs(false);arcade.start(id)},(n,o)=>game.sfx(n,o))};   // erst Feuerwerk, dann Kampfbildschirm
studioLoadSaved();   // gespeicherte eigene Figur aus dem Browser laden
// Farbwahl (C im Menü; 2 Spieler: C / L) merkt sich der Browser
const SKIN_KEY='hitisop.skins';
const saveSkins=()=>{try{localStorage.setItem(SKIN_KEY,JSON.stringify({skins:arcade.skins,s1:arcade.vs.s1|0,s2:arcade.vs.s2|0}))}catch(e){}};
try{const sv=JSON.parse(localStorage.getItem(SKIN_KEY)||'null');if(sv&&typeof sv==='object'){Object.assign(arcade.skins,sv.skins||{});arcade.vs.s1=sv.s1|0;arcade.vs.s2=sv.s2|0}}catch(e){}
// ---- Booster-Overlay / Shop: Öffnen, Kaufen ----
const lootCan=()=>{const st=arcade.state;return !menuOpen&&!renderer.sel.launching&&((st==='select'&&!arcade.pvp)||st==='gameover'||st==='victory')};
const lootOpen=mode=>{const u=renderer.lootUi;u.open=true;u.mode=mode;u.rewards=null;u.t=0;u.sel=0;u.msg=null};
// Booster aufreißen: Animation (render/packopen.js) mit den schon gezogenen Belohnungen; ENTER/Klick treibt sie voran, ESC überspringt (Belohnungen sind bereits gespeichert)
const lootReveal=rw=>{const u=renderer.lootUi;u.rewards=rw;u.po=new PackOpen(rw,(n,o)=>game.sfx(n,o));u.mode='reveal';u.t=0};
const lootNext=()=>{const u=renderer.lootUi;if(!u.po||u.po.advance()){u.mode='main';u.t=0;u.po=null}};
const shopBuy=i=>{const u=renderer.lootUi,o=SHOP[i];if(!o)return;u.sel=i;
 if(buyPack(i)){u.msg=`+${o.n} BOOSTER gekauft!`;u.msgOk=true;game.sfx('fw_rocket',{vol:.7,rate:1.5})}else{u.msg='Zu wenig Coins!';u.msgOk=false;game.sfx('block_guard',{vol:.5})}u.msgAt=u.t};
const logical=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)/r.width*960,(e.clientY-r.top)/r.height*540]};
canvas.addEventListener('mousemove',e=>{mouseL=logical(e)});canvas.addEventListener('mouseleave',()=>{mouseL=null});
const canvasMenu=()=>!menuOpen&&!panelsOpen()&&!intro.active&&!startOpen&&!renderer.sel.launching;
// Knöpfe auf den End-Bildschirmen (Game Over / Stage Clear / Sieg / Revanche): gleiche Aktionen wie ENTER / ESC / B
const endBtns=()=>{const A=arcade,st=A.state;if(st==='fight'||st==='select'||A.t<30||!canvasMenu())return[];const b=[],sel=()=>A.toSelect();
 if(netMatch&&netMatch.phase!=='pick'){if(st==='vsover'){b.push({label:'REVANCHE',col:'#7dff9a',fn:()=>netMatch&&netMatch.requestRematch()},{label:'VERLASSEN',col:'#ff9fb4',fn:()=>netMatch&&netMatch.leave()})}return b}
 if(st==='clear')b.push({label:'WEITER',col:'#7fe8ff',fn:()=>A.confirm()});
 else if(st==='gameover')b.push({label:A.mode==='story'?'WEITER':'NOCHMAL',col:'#7fe8ff',fn:()=>A.confirm()},{label:'CHARAKTERWAHL',col:'#b98bff',fn:sel});
 else if(st==='victory'){if(A.hasNextChapter)b.push({label:'NÄCHSTES KAPITEL',col:'#7fe8ff',fn:()=>A.confirm()});b.push({label:'CHARAKTERWAHL',col:'#b98bff',fn:sel})}
 else if(st==='vsover')b.push({label:'REVANCHE',col:'#7fe8ff',fn:()=>A.confirm()},{label:'KÄMPFERWAHL',col:'#b98bff',fn:sel});
 if((st==='gameover'||st==='victory')&&LOOT.packs>0&&lootCan())b.push({label:'BOOSTER ('+LOOT.packs+')',col:'#ffd23f',fn:()=>lootOpen('main')});
 return b};
// Was liegt unter dem Mauszeiger? -> Rechteck für den weichen Hover-Rahmen (gleiche Reihenfolge wie im Klick-Handler)
function hoverTarget(){endHot=-1;const L=mouseL;if(!L||menuOpen||panelsOpen()||startOpen||intro.active||renderer.sel.launching||document.body.classList.contains('nocur'))return null;
 const u=renderer.lootUi,a=arcade,st=a.state;
 if(u.open){if(u.mode==='shop'){const j=hitShopCard(...L);if(j>=0)return shopCardRect(j);return hitShopBack(...L)?shopBackRect():null}
  if(u.mode==='main'){if(hitShopBtn(...L))return shopBtnRect();if(LOOT.packs>0&&inR(lootOpenRect(),...L))return lootOpenRect();if(inR(lootCloseRect(),...L))return lootCloseRect()}return null}
 if(st!=='select'){const bs=endBtns();for(let i=0;i<bs.length;i++){const r=endBtnRect(i,bs.length);if(inR(r,...L)){endHot=i;return r}}return null}
 if(!a.pvp&&lootCan()){if(hitShopSel(...L))return shopSelRect();if(inR(boosterRect(),...L))return boosterRect()}
 const md=hitMode(...L);if(md>=0)return{x:MODE_PILL.x+md*MODE_PILL.w/4,y:MODE_PILL.y,w:MODE_PILL.w/4,h:MODE_PILL.h};
 if(a.mode==='melee'&&a.vs.step===0&&!a.vs.locked[0]&&!a.vs.locked[1]){const mo=hitMeleeOpt(...L);if(mo>=0&&(mo!==1||a.cpu))return MELEE_OPTS[mo]}
 if(a.pvp){const v=a.vs;if(v.step===1){const j=hitStage(...L);return j>=0&&a.stageOpen(j)?stageRect(j):null}const h=hitVsCar(...L);return h?vcarRect(h.pl,h.off):null}
 if(a.mode==='story'&&hitChapter(...L))return CHAPTER_RECT;
 if(CHARACTERS.custom&&a.cursor===CI()&&hitEdit(...L))return editRect();
 const off=hitCar(...L);return off===null?null:carRect(off)}
canvas.addEventListener('mousemove',e=>{const u=renderer.lootUi;if(u.open){if(u.mode==='shop'){const j=hitShopCard(...logical(e));if(j>=0)u.sel=j}return}
 if(arcade.state!=='select'||menuOpen||studioIsOpen()||renderer.sel.launching)return;
 if(arcade.pvp){if(arcade.vs.step===1){const j=hitStage(...logical(e));if(j>=0&&arcade.stageOpen(j))arcade.vs.stage=j}return}
 });   // Rondell: Hover ändert nichts mehr, es wird mit ◀ ▶ bzw. Klick auf die Seitenfiguren weitergeschaltet
canvas.addEventListener('click',e=>{{const u=renderer.lootUi;if(u.open){const L=logical(e);   // Overlay offen: nur dort klicken
  if(u.mode==='shop'){const j=hitShopCard(...L);if(j>=0)shopBuy(j);else if(hitShopBack(...L)){u.mode='main';u.t=0}}
  else if(u.mode==='main'){if(hitShopBtn(...L)){u.mode='shop';u.sel=0;u.msg=null}else if(LOOT.packs>0&&inR(lootOpenRect(),...L))lootReveal(openPack());else if(inR(lootCloseRect(),...L))u.open=false}
  else if(u.mode==='reveal')lootNext();
  return}}
 if(arcade.state==='select'&&!arcade.pvp&&lootCan()){const L=logical(e);if(hitShopSel(...L)){lootOpen('shop');return}if(inR(boosterRect(),...L)){lootOpen('main');return}}
 if(arcade.state!=='select'&&canvasMenu()){const L=logical(e),bs=endBtns();for(let i=0;i<bs.length;i++)if(inR(endBtnRect(i,bs.length),...L)){bs[i].fn();return}return}
 if(arcade.state!=='select'||menuOpen||studioIsOpen()||renderer.sel.launching)return;const L=logical(e);
 const md=hitMode(...L);if(md>=0){arcade.setMode(['arcade','story','versus','melee'][md]);return}
 if(arcade.mode==='melee'&&arcade.vs.step===0&&!arcade.vs.locked[0]&&!arcade.vs.locked[1]){const mo=hitMeleeOpt(...L);if(mo>=0){if(mo===0)arcade.toggleCpu();else if(mo===1&&arcade.cpu)setDiff((arcade.difficulty+1)%AI_LEVELS.length);else if(mo===2)arcade.cycleStocks();return}}
 if(arcade.pvp){const v=arcade.vs;if(v.step===1){const j=hitStage(...L);if(j>=0&&arcade.stageOpen(j)){v.stage=j;startVersus()}}
  else{const h=hitVsCar(...L);if(h){if(h.off===0)arcade.vsConfirm(h.pl);else arcade.vsMove(h.pl,h.off)}}return}   // Seitenfigur = dieses Rondell eine weiter, Mitte = bestätigen
 if(arcade.mode==='story'&&hitChapter(...L)){if(arcade.cycleChapter())game.sfx('ui_round_start',{vol:.5,rate:1.4});return}   // Klick auf die Kapitel-Zeile
 if(CHARACTERS.custom&&arcade.cursor===CI()&&hitEdit(...L)){openStudio();return}
 const off=hitCar(...L),n=SLOTS().length;if(off===0)startFight(arcade.cursor);else if(off!==null)arcade.cursor=(arcade.cursor+off+n)%n;});   // linke/rechte Figur = eine weiterschalten, mittlere = kämpfen
canvas.addEventListener('contextmenu',e=>{const u=renderer.lootUi;
 if(u.open){if(u.mode==='shop'||u.mode==='reveal'){u.mode='main';u.t=0;u.po=null}else u.open=false;e.preventDefault();return}
 if(!canvasMenu()||(netMatch&&netMatch.phase!=='pick'))return;const st=arcade.state;
 if(st==='select'&&arcade.pvp){arcade.vsBack();e.preventDefault()}
 else if(st==='gameover'||st==='victory'||st==='vsover'){arcade.toSelect();e.preventDefault()}});   // Rechtsklick = Zurück: Booster/Shop eine Ebene hoch, 2-Spieler-Auswahl zurück, End-Bildschirm -> Charakterwahl
canvas.addEventListener('wheel',e=>{if(arcade.state!=='select'||arcade.pvp||menuOpen||studioIsOpen()||renderer.sel.launching||renderer.lootUi.open)return;const n=SLOTS().length;arcade.cursor=(arcade.cursor+(e.deltaY>0||e.deltaX>0?1:-1)+n)%n;e.preventDefault()},{passive:false});
// ---- Online-Kampf (Lockstep: core/netplay.js + netmatch.js, Verbindung: core/netclient.js, Server: server/server.js, Oberfläche: render/netui.js) ----
let netClient=null,netMatch=null,netBusy=false,netFrom='start',netLeaveAsk=false,netPendingRoom=null;
try{const m=/[?&]room=([A-Za-z]{4})\b/.exec(location.search);if(m){netPendingRoom=m[1].toUpperCase();if(history.replaceState)history.replaceState(null,'',location.pathname)}}catch(e){}   // Einladungslink ?room=CODE
const netInputs=[new NetInput(),new NetInput()];
const NET_OK=id=>{const c=CHARACTERS[id];return !!c&&!c.noSpecialBlock&&id!=='wolf'&&id!=='custom'};   // spielbare Figuren (die eigene hochgeladene Figur gibt es beim Gegner nicht)
const netCat={chars:()=>ROSTER.map(id=>({id,name:CHARACTERS[id].name,desc:CHARACTERS[id].desc})),
 skins:id=>{const sp=CHARACTERS[id]&&CHARACTERS[id].sprites,a=[];for(let i=0;i<skinCount(sp);i++)if(ownsSkin(id,i))a.push({i,name:skinName(sp,i)});return a},
 stages:()=>THEMES.map((T,i)=>({i,name:T.name,open:arcade.stageOpen(i)}))};
const netUi=new NetUi({ctx:()=>({client:netClient,match:netMatch,busy:netBusy}),act:(a,v)=>netAct(a,v),cat:netCat});netUi.mount();
function netOpen(from){netFrom=from;if(from==='start'&&start){startOpen=false;start.classList.add('hidden')}
 if(arcade.state==='select')arcade.setMode('versus');clearInputs();netUi.open(netClient?'':'')}
function netClose(){netUi.close();if(netClient){netClient.close();netClient=null}netBusy=false;
 if(netFrom==='start'&&start){startOpen=true;start.classList.remove('hidden');startAutoOpen()}canvas.focus()}
async function netConnect(){if(netClient&&netClient.state!=='closed')return netClient;
 const url=netServerUrl();if(!url){netUi.say(netMessage('nourl'),true);return null}
 netBusy=true;netUi.say('');netUi.render();
 const c=new NetClient({url}).on('state',s=>{if(s==='paired')netPaired(c);netUi.render()}).on('error',m=>{netUi.say(netMessage(m.code)||m.msg||'Fehler',true);netUi.render()})
  .on('rtt',()=>netBarUpdate()).on('close',()=>{if(netClient===c){netClient=null;if(!netMatch)netUi.say(netMessage('disconnected'),true);netUi.render()}});
 netClient=c;
 // Erst jetzt (beim ersten Online-Klick) wird der Server kontaktiert; schläft er noch, kommt nach kurzer Zeit eine Wartemeldung und es wird automatisch weiter versucht
 const wt=setTimeout(()=>{if(netClient===c&&netBusy&&c.state!=='open'&&netUi.isOpen){netUi.say(netMessage('waking'));netUi.render()}},2500);
 try{await connectPatient(c,{cancelled:()=>netClient!==c||!netUi.isOpen})}catch(e){clearTimeout(wt);if(netClient===c)netClient=null;netBusy=false;if(netUi.isOpen){netUi.say(netMessage(e.message==='nourl'?'nourl':e.message==='timeout'?'timeout':'closed'),true);netUi.render()}return null}
 clearTimeout(wt);netBusy=false;netUi.say('');netUi.render();return c}
async function netAct(a,v){switch(a){
 case'quick':case'host':case'join':{
  if(a==='join'){v=String(v||'').toUpperCase().replace(/[^A-Z]/g,'');if(v.length!==4){netUi.say('Bitte den 4-stelligen Code eingeben.',true);return}}
  const c=await netConnect();if(!c||netClient!==c||c.state==='closed')return;
  if(a==='quick')c.quick();else if(a==='host')c.host();else c.join(v);break}
 case'cancel':if(netMatch)netMatch.leave();else if(netClient&&(netClient.state==='hosting'||netClient.state==='queued')){netClient.cancel()}else if(netBusy){if(netClient){netClient.close();netClient=null}netBusy=false;netUi.render()}break;
 case'close':netClose();break;
 case'leave':if(netMatch)netMatch.leave();break;
 case'pickChar':if(netMatch&&NET_OK(v)&&ROSTER.includes(v))netMatch.pick(v,arcade.skinOf(v));break;
 case'skin':{const m=netMatch;if(!m||!m.me.id)break;const l=netCat.skins(m.me.id);if(l.length<2)break;const i=l.findIndex(s=>s.i===m.me.skin);m.pick(m.me.id,l[(i+1)%l.length].i);break}
 case'ready':if(netMatch)netMatch.setReady(!netMatch.me.ready);break;
 case'start':if(netMatch&&netMatch.canStart()){let st=v|0;if(st<0){const own=ownedStages(arcade.stageCount);st=own[Math.floor(Math.random()*own.length)]}else if(!arcade.stageOpen(st))st=0;netMatch.hostStart(st)}break}}
function netPaired(c){if(netMatch)return;
 netMatch=new NetMatch({client:c,game,inputs:netInputs,valid:NET_OK,sample:()=>{const s=kb.sample();return encInput(s.dx,s.dy,s.pressed)},
  altSkin:(id,s)=>{const n=skinCount(CHARACTERS[id]&&CHARACTERS[id].sprites);return n>1?(s+1)%n:0},
  hooks:{onChange:()=>{netUi.render();netBarUpdate()},onLaunch:netLaunch,onStart:()=>{clearInputs();netBarUpdate()},onEnd:netEnded}});
 const first=ROSTER[Math.min(arcade.cursor,ROSTER.length-1)]||ROSTER[0];netMatch.pick(first,arcade.skinOf(first));netUi.say('');netUi.render()}
function netLaunch(cfg,o){netUi.close();netLeaveAsk=false;
 const go=()=>{if(!netMatch||netMatch.phase!=='launch')return;p1.input=netInputs[0];p2.input=netInputs[1];clearInputs();arcade.startOnline(cfg);netMatch.launched()};
 if(o.rematch){go();return}
 const ids=Arcade.slotIds(),i1=ids.indexOf(cfg.ids[0]),i2=ids.indexOf(cfg.ids[1]);   // Start-Animation (Videos + Feuerwerk) wie im 2-Spieler-Modus; fehlt eine Figur im eigenen Rondell (z. B. noch nicht freigeschaltet), direkt starten
 if(i1>=0&&i2>=0&&arcade.state==='select'&&!renderer.sel.launching){arcade.mode='versus';Object.assign(arcade.vs,{c1:i1,c2:i2,s1:cfg.skins[0],s2:cfg.skins[1],locked:[true,true],step:1,stage:cfg.stage});
  renderer.sel.launch(cfg.ids[0],go,(n,x)=>game.sfx(n,x),cfg.ids[1])}else go()}
function netEnded(reason){netMatch=null;netLeaveAsk=false;p1.input=kb;p2.input=ai;clearInputs();
 if(arcade.state!=='select')arcade.toSelect();else{arcade.online=false;arcade.vsReset()}
 arcade.mode='versus';netUi.setBar('','');
 if(netClient&&netClient.state==='closed')netClient=null;
 netUi.open(netMessage(reason),reason!=='left')}
function netBarUpdate(){const m=netMatch;if(!m||m.phase==='pick'||m.phase==='closed'||netUi.isOpen){netUi.setBar('','');return}
 let mid='',cls='';const st=m.stalledMs;
 if(m.phase==='wait')mid='WARTE AUF GEGNER …';
 else if(m.phase==='play'){if(netLeaveAsk)mid='KAMPF VERLASSEN?<small>ENTER = JA · ESC = NEIN</small>';else if(m.rematchWait)mid='WARTE AUF REVANCHE …';else if(st>NET.stallWarnMs){mid='VERBINDUNG LANGSAM …';cls='warn'}}
 netUi.setBar(`ONLINE · PING ${m.rtt?Math.round(m.rtt)+' ms':'…'} · DU = SPIELER ${m.slot+1}`,mid,cls)}
addEventListener('keydown',e=>{
 if(intro.key(e)){e.preventDefault();return}   // Intro läuft: Enter/Esc überspringt, andere Tasten werden verschluckt
 if(studioIsOpen()||bgUi.isOpen||musicUi.isOpen||netUi.isOpen)return;   // Editor für die eigene Figur / Hintergrund-Panel / Online-Lobby haben Vorrang (Tippen in Feldern)
 if(e.code==='KeyH'&&!menuOpen&&(startOpen||(arcade.state==='select'&&!renderer.sel.launching&&!renderer.lootUi.open))){bgUi.open();e.preventDefault();return}   // H = eigenen Hintergrund einfügen (Titelmenü + Auswahl)
 if(e.code==='KeyN'&&!menuOpen&&(startOpen||(arcade.state==='select'&&!renderer.sel.launching&&!renderer.lootUi.open))){musicUi.open();e.preventDefault();return}   // N = eigene Musik (Titelmenü + Auswahl)
 if(e.code==='KeyO'&&!menuOpen&&!netMatch&&(startOpen||(arcade.state==='select'&&!renderer.sel.launching&&!renderer.lootUi.open))){netOpen(startOpen?'start':'select');e.preventDefault();return}   // O = Online-Lobby (Titelmenü + Auswahl)
 if(netMatch&&netMatch.phase!=='pick'){   // Online-Kampf: kein Pausemenü (der Gegner kann nicht warten); Esc fragt nach / verlässt, Enter = Revanche; alles andere sind Kampftasten
  if(e.code==='Escape'){if(arcade.state==='vsover')netMatch.leave();else netLeaveAsk=!netLeaveAsk;e.preventDefault();return}
  if(e.code==='Enter'||e.code==='KeyR'){if(netLeaveAsk)netMatch.leave();else if(arcade.state==='vsover')netMatch.requestRematch();e.preventDefault();return}
  if(e.code==='KeyF'){fs();return}
  if(e.code==='F2'){game.debug=!game.debug;e.preventDefault()}
  return}
 if(startOpen){               // Auf der Startseite nur Modus wählen / starten
  if(e.code==='KeyV')startManual();
  else if(startIsMin()&&(e.code==='ArrowRight'||e.code==='KeyD'||e.code==='Tab'||e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='Enter'||e.code==='Space'||e.code==='KeyJ'))startMin(false);   // eingeklappt: erste Taste klappt nur auf
  else if(e.code==='ArrowRight'||e.code==='KeyD'||e.code==='Tab')startPick(1);
  else if(e.code==='ArrowLeft'||e.code==='KeyA')startPick(-1);
  else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ')startGo();
  e.preventDefault();return
 }
 {const u=renderer.lootUi,st=arcade.state,can=lootCan();   // Booster-Overlay (B) mit Shop (P)
  if(u.open||(can&&(e.code==='KeyB'||e.code==='KeyP'))){e.preventDefault();
   if(!u.open){lootOpen(e.code==='KeyP'?'shop':'main');return}
   if(u.mode==='shop'){
    if(e.code==='Escape'||e.code==='KeyB'||e.code==='KeyP'){u.mode='main';u.t=0}
    else if(e.code==='ArrowLeft'||e.code==='KeyA')u.sel=(u.sel+SHOP.length-1)%SHOP.length;
    else if(e.code==='ArrowRight'||e.code==='KeyD')u.sel=(u.sel+1)%SHOP.length;
    else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ')shopBuy(u.sel);
    return}
   if(e.code==='Escape'||e.code==='KeyB'){if(u.mode==='reveal'){u.mode='main';u.t=0;u.po=null}else u.open=false}
   else if(e.code==='KeyP'&&u.mode==='main'){u.mode='shop';u.sel=0;u.msg=null}
   else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ'){if(u.mode==='reveal')lootNext();else if(LOOT.packs>0)lootReveal(openPack())}
   return}}
 if(e.code==='KeyM'){setMenu(!menuOpen);return}
 if(e.code==='Escape'&&menuOpen){setMenu(false);return}
 if(e.code==='KeyF'&&!menuOpen){fs();return}
 if(menuOpen){if(e.code==='ArrowRight')showTab(tab+1);if(e.code==='ArrowLeft')showTab(tab-1);return}
 if(arcade.state==='select'&&arcade.pvp){const v=arcade.vs;
  if(renderer.sel.launching){e.preventDefault();return}   // Videos + Feuerwerk laufen: Eingaben sperren
  if(e.code==='Tab'){if(v.step===0&&!v.locked[0]&&!v.locked[1])arcade.cycleMode();e.preventDefault();return}
  if(arcade.mode==='melee'&&v.step===0&&!v.locked[0]&&!v.locked[1]){   // Melee-Optionen: B = Spieler 2 Mensch/CPU, T = Stocks, ▲▼ = CPU-Stärke
   if(e.code==='KeyB'){arcade.toggleCpu();e.preventDefault();return}
   if(e.code==='KeyT'){arcade.cycleStocks();e.preventDefault();return}
   if(arcade.cpu&&(e.code==='ArrowUp'||e.code==='ArrowDown')){setDiff(arcade.difficulty+(e.code==='ArrowUp'?1:-1));e.preventDefault();return}}
  const ok1=e.code==='KeyG'||e.code==='Space',ok2=e.code==='Enter'||e.code==='KeyK'||e.code==='Numpad1',back=e.code==='Escape'||e.code==='Backspace';
  if(v.step===0){if(e.code==='KeyC'){if(arcade.vsCycleSkin(1))saveSkins()}else if(e.code==='KeyL'){if(arcade.vsCycleSkin(2))saveSkins()}else if(e.code==='KeyA')arcade.vsMove(1,-1);else if(e.code==='KeyD')arcade.vsMove(1,1);else if(e.code==='ArrowLeft')arcade.vsMove(2,-1);else if(e.code==='ArrowRight')arcade.vsMove(2,1);
   else if(ok1)arcade.vsConfirm(1);else if(ok2)arcade.vsConfirm(2);else if(back)arcade.vsBack()}
  else{if(e.code==='KeyA'||e.code==='ArrowLeft')arcade.vsStageMove(-1);else if(e.code==='KeyD'||e.code==='ArrowRight')arcade.vsStageMove(1);else if(ok1||ok2)startVersus();else if(back)arcade.vsBack()}
  e.preventDefault();return}
 if(arcade.state==='select'){const n=SLOTS().length;
  if(renderer.sel.launching){e.preventDefault();return}   // Feuerwerk läuft: Eingaben sperren
  if(e.code==='ArrowRight'||e.code==='KeyD')arcade.cursor=(arcade.cursor+1)%n;
  else if(e.code==='ArrowLeft'||e.code==='KeyA')arcade.cursor=(arcade.cursor+n-1)%n;
  else if(e.code==='ArrowUp'||e.code==='KeyW')setDiff(arcade.difficulty+1);
  else if(e.code==='ArrowDown'||e.code==='KeyS')setDiff(arcade.difficulty-1);
  else if(e.code==='Tab')arcade.cycleMode();
  else if(e.code==='KeyK'){if(arcade.cycleChapter())game.sfx('ui_round_start',{vol:.5,rate:1.4})}   // Story: Kapitel wählen (nur freigeschaltete)
  else if(e.code==='KeyC'){if(arcade.cycleSkin(SLOTS()[arcade.cursor]))saveSkins()}
  else if(e.code==='KeyE'&&CHARACTERS.custom){arcade.cursor=CI();openStudio()}
  else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ')startFight(arcade.cursor);
  e.preventDefault();return}
 if(e.code==='F2'){game.debug=!game.debug;e.preventDefault()}
 if(e.code==='Enter'||e.code==='KeyR')arcade.confirm();
 if(e.code==='Escape'&&(arcade.state==='gameover'||arcade.state==='victory'||arcade.state==='vsover'))arcade.toSelect()});
addEventListener('blur',()=>{if(!menuOpen&&!studioIsOpen()&&!bgUi.busy()&&!musicUi.busy()&&!intro.active&&!netUi.isOpen&&!netMatch)setMenu(true)}); // Fenster verlassen => Menü/Pause
// ---- Game-Loop: Akkumulator, Schrittlänge folgt dem Spieltempo ----
let last=performance.now(),acc=0,slowAcc=0,autoT=0;
function assignPads(){const l=navigator.getGamepads?[...navigator.getGamepads()]:[],pads=l.map((g,i)=>g&&g.connected?i:-1).filter(i=>i>=0);
 kb.padIndex=pads.length?pads[0]:-1;kbV1.padIndex=pads.length>1?pads[0]:-1;kbV2.padIndex=pads.length>1?pads[1]:(pads.length?pads[0]:-1)}   // 1 Pad = Spieler 2 (Spieler 1 nutzt Tastatur), 2 Pads = je Spieler eins
// ---- Controller (PS4 / PS5 / Xbox): im Kampf liest KeyboardInput.pollPad den Controller direkt; hier: Verbindungs-Hinweis + Bedienung aller Menüs (Belegung: core/gamepad.js menuKey) ----
const padToast=(txt,ok)=>{let t=$('padtoast');if(!t){t=document.createElement('div');t.id='padtoast';document.body.appendChild(t)}t.textContent=txt;t.className=ok?'ok':'err';clearTimeout(padToast.t);padToast.t=setTimeout(()=>t.classList.add('hidden'),3500)};
addEventListener('gamepadconnected',e=>padToast('🎮 '+padLabel(e.gamepad)+' verbunden',true));
addEventListener('gamepaddisconnected',e=>{padToast('🎮 '+padLabel(e.gamepad)+' getrennt',false);
 if(arcade.state==='fight'&&!menuOpen&&!netMatch&&!intro.active&&!startOpen&&[p1.input,p2.input].some(k=>k&&k.padIndex===e.gamepad.index))setMenu(true)});   // Controller des laufenden Kampfs weg -> Pause
const padNav=new PadNav();
function padPause(n){   // Pausenmenü: ↑↓ Eintrag, ←→ Wert/Reiter, ✕ auslösen, ○ / Options schließen, L1/R1 Reiter
 const sec=[...menu.querySelectorAll('section')].find(x=>!x.classList.contains('hidden')),items=[...(sec?sec.querySelectorAll('button,select,input'):[]),$('btn-resume')].filter(Boolean);
 const mark=el=>{if(padFocus)padFocus.classList.remove('padfocus');padFocus=el;if(el){el.classList.add('padfocus');if(el.scrollIntoView)el.scrollIntoView({block:'nearest'})}};
 const fire=(el,t)=>el.dispatchEvent(new Event(t,{bubbles:true})),i=items.indexOf(padFocus),el=padFocus;
 if(n==='options'||n==='circle'){mark(null);setMenu(false)}
 else if(n==='l1'){mark(null);showTab(tab-1)}else if(n==='r1'){mark(null);showTab(tab+1)}
 else if(n==='down'||n==='up'){const d=n==='down'?1:-1;mark(items[i<0?(d>0?0:items.length-1):(i+d+items.length)%items.length])}
 else if(n==='left'||n==='right'){const d=n==='right'?1:-1;
  if(el&&el.tagName==='INPUT'&&el.type==='range'){el.value=String(Math.min(+el.max,Math.max(+el.min,+el.value+d*(+el.step||1))));fire(el,'input')}
  else if(el&&el.tagName==='SELECT'){const j=Math.min(el.options.length-1,Math.max(0,el.selectedIndex+d));if(j!==el.selectedIndex){el.selectedIndex=j;fire(el,'change')}}
  else{mark(null);showTab(tab+d)}}
 else if(n==='cross'&&el){if(el.tagName==='SELECT'){el.selectedIndex=(el.selectedIndex+1)%el.options.length;fire(el,'change')}else if(el.tagName!=='INPUT')el.click()}}
function padMenu(now){
 const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(g=>g&&g.connected):[];if(!pads.length&&!padNav.prev.size)return;
 let screen;
 if(intro.active)screen='intro';else if(panelsOpen())screen=null;else if(menuOpen)screen='pause';
 else if(netMatch&&netMatch.phase!=='pick')screen='online';else if(startOpen)screen='start';else if(arcade.state==='fight')screen='fight';
 else if(arcade.state==='select'&&renderer.sel.launching)screen=null;else if(arcade.state==='select'&&arcade.pvp&&!renderer.lootUi.open)screen='versus';else screen='menu';
 const over=['clear','gameover','victory','vsover'].includes(arcade.state);
 for(const e of padNav.poll(now,pads,screen!==null)){
  if(screen==='pause'){padPause(e.name);continue}
  if(e.name==='cross'&&over&&arcade.t<45)continue;   // wildes ✕-Hämmern am Kampfende überspringt den End-Bildschirm nicht
  const v=arcade.vs,who=pads.length>1?(e.slot===0?1:2):(v&&v.step===0&&v.locked[0]&&!v.locked[1]?2:1);   // 2 Controller = je Spieler einer; 1 Controller wählt erst für Spieler 1, dann für Spieler 2
  const k=menuKey(e.name,{screen,who,ask:netLeaveAsk||arcade.state==='vsover'});
  if(k)for(const t of['keydown','keyup'])dispatchEvent(new KeyboardEvent(t,{code:k,key:k,bubbles:true,cancelable:true}))}}
function loop(now){if(intro.active){last=now;padMenu(now);sound.music('menu');requestAnimationFrame(loop);return}   // Intro: Spiel steht still, aber die Menümusik läuft schon
 assignPads();padMenu(now);const dt=now-last;
 {const showBtns=(startOpen||arcade.state==='select')&&!menuOpen&&!studioIsOpen()&&!bgUi.isOpen&&!musicUi.isOpen&&!renderer.sel.launching&&!renderer.lootUi.open;bgUi.setBtn(showBtns);musicUi.setBtn(showBtns)}   // Hintergrund-Knopf nur im Titelmenü + in den Auswahlbildschirmen
 {const mn=menuish();if(mn&&!curWas)curShow();curWas=mn;   // Menü betreten: Zeiger zeigen, nach 2 s Ruhe weg
  if(mn){const hr=hoverTarget();renderer.hov.want=hr;canvas.style.cursor=hr?'pointer':'';renderer.endBtns=arcade.state!=='select'?endBtns():null;renderer.endHot=endHot}
  else{document.body.classList.remove('nocur','curon');canvas.style.cursor='';renderer.hov.want=null;renderer.endBtns=null}}sound.music(startOpen?'menu':musicFor());   // Titelmusik auf der Startseite, sonst Menü- / Kampf-Track
 if(gfxMode==='auto'&&!startOpen&&!menuOpen&&!document.hidden&&dt<500){autoT+=dt;slowAcc=Math.max(0,slowAcc+(dt>26?dt-16:-4));   // dauerhaft unter ~38 FPS => eine Stufe runter (nach 1,5 s Eingewöhnung)
  if(autoT>1500&&slowAcc>350&&GFX.level>0){setGfx(GFX.level-1);renderer.applyGfx();resize();slowAcc=0;autoT=0}}
 acc+=Math.min(100,dt);last=now;const STEP=1000/(60*(netMatch?SPEED:speed)*(startOpen?1:game.timeScale||1));   // Online: festes Tempo (beide Geräte müssen gleich schnell rechnen)
 while(acc>=STEP){if(startOpen){demo.step()}
  else if(netMatch&&netMatch.phase!=='pick'){if(arcade.state!=='select'&&netMatch.step())arcade.update();else{acc=netMatch&&netMatch.phase==='play'?Math.min(acc,STEP*3):0;break}}   // Online: nur rechnen, wenn die Eingabe des Gegners da ist (Lockstep)
  else if(!menuOpen&&arcade.state!=='select'){game.step();arcade.update()}acc-=STEP}
 if(netMatch){netMatch.flush();netMatch.poll()}netBarUpdate();
 if(startOpen)renderer.drawDemo(demo.game);else renderer.draw(game);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
sound.unlock();sound.music('menu');   // Menümusik schon beim Intro: Audio sofort vorbereiten (Browser geben es frei, sobald sie dürfen, spätestens bei der ersten Taste/Klick)
intro.start();   // als Letztes: alles ist eingerichtet, das Video startet sofort (kein Startknopf), die Menümusik setzt ein, sobald der Browser Ton erlaubt
window.__net=()=>netMatch;window.__intro=intro;window.__music=musicUi;window.__bgui=bgUi;window.__reveal=lootReveal;window.__lootOpen=lootOpen;window.__renderer=renderer;window.__demo=demo;window.__game=game;window.__arcade=arcade;
