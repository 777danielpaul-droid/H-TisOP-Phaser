import{Game}from'./core/game.js';
import{Fighter}from'./core/fighter.js';
import{KeyboardInput,VS1_BUTTONS,VS1_DIRS,VS2_BUTTONS,VS2_DIRS}from'./core/input.js';
import{AIController,AI_LEVELS}from'./core/ai.js';
import{Arcade}from'./core/arcade.js';
import{CHARACTERS,ROSTER}from'./core/characters.js';
import{MOVE_LIST,charMoves}from'./core/moves.js';
import{SPEED,GFX,GFX_PRESETS,setGfx}from'./core/config.js';
import{Renderer}from'./render/renderer.js';
import{Sound}from'./render/audio.js';
import{loadFonts}from'./render/fonts.js';
import{hitCard,hitEdit,hitMode,hitStage,hitVsCard,hitMeleeOpt}from'./render/select.js';
import{studioOpen,studioIsOpen,studioLoadSaved}from'./render/customstudio.js';
// Einstiegspunkt: Vollbild-Canvas, Eingabe, KI, Game-Loop (fester Schritt) und Pause-Menü (M).
loadFonts();   // eingebettete Schriften registrieren (Canvas + Menü)
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};   // Auswahl merken (falls Browser-Speicher verfügbar)
let saved=Math.max(0,Math.min(AI_LEVELS.length-1,+load('tf_difficulty',0)||0));
const kb=new KeyboardInput(window),ai=new AIController(saved);
const kbV1=new KeyboardInput(window,VS1_BUTTONS,VS1_DIRS),kbV2=new KeyboardInput(window,VS2_BUTTONS,VS2_DIRS);   // 2-Spieler-Modus: getrennte Tastaturhälften
const clearInputs=()=>{for(const k of[kb,kbV1,kbV2]){k.keys.clear();k.pend.length=0;k.clear()}};
const p1=new Fighter({char:CHARACTERS[ROSTER[0]],x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
const game=new Game(p1,p2),canvas=$('screen'),renderer=new Renderer(canvas),arcade=new Arcade(game,p1,p2,ai);arcade.difficulty=saved;
let menuOpen=false,speed=SPEED;
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
function setMenu(open){if(open)fillMoves();menuOpen=open;menu.classList.toggle('hidden',!open);clearInputs();if(!open)canvas.focus()}
const fs=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()};
canvas.addEventListener('dblclick',fs);
const on=(id,fn)=>{const e=$(id);if(e)e.onclick=()=>fn(e)};
on('btn-resume',()=>setMenu(false));
on('btn-debug',e=>{game.debug=!game.debug;e.textContent=game.debug?'An':'Aus';e.classList.toggle('on',game.debug)});
on('btn-meter',()=>{p1.meter=300});
on('btn-restart',()=>{if(arcade.pvp&&arcade.state!=='select')arcade.rematchVs();else game.rematch();setMenu(false)});
on('btn-select',()=>{arcade.toSelect();setMenu(false)});
on('btn-studio',()=>{arcade.toSelect();setMenu(false);arcade.cursor=CI();openStudio()});
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
const logical=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)/r.width*960,(e.clientY-r.top)/r.height*540]};
canvas.addEventListener('mousemove',e=>{if(arcade.state!=='select'||menuOpen||studioIsOpen()||renderer.sel.launching)return;
 if(arcade.pvp){if(arcade.vs.step===1){const j=hitStage(...logical(e));if(j>=0)arcade.vs.stage=j}return}
 const i=hitCard(...logical(e),SLOTS().length);if(i>=0)arcade.cursor=i});
canvas.addEventListener('click',e=>{if(arcade.state!=='select'||menuOpen||studioIsOpen()||renderer.sel.launching)return;const L=logical(e);
 const md=hitMode(...L);if(md>=0){arcade.setMode(['arcade','versus','melee'][md]);return}
 if(arcade.mode==='melee'&&arcade.vs.step===0&&!arcade.vs.locked[0]&&!arcade.vs.locked[1]){const mo=hitMeleeOpt(...L);if(mo>=0){if(mo===0)arcade.toggleCpu();else if(mo===1&&arcade.cpu)setDiff((arcade.difficulty+1)%AI_LEVELS.length);else if(mo===2)arcade.cycleStocks();return}}
 if(arcade.pvp){const v=arcade.vs;if(v.step===1){const j=hitStage(...L);if(j>=0){v.stage=j;startVersus()}}
  else{const i=hitVsCard(...L,Arcade.slotIds().length);if(i>=0){const pl=!v.locked[0]?1:!v.locked[1]?2:0;if(pl){arcade.vsSet(pl,i);arcade.vsConfirm(pl)}}}return}
 if(CHARACTERS.custom&&hitEdit(...L,SLOTS().length)){arcade.cursor=CI();openStudio();return}
 const i=hitCard(...L,SLOTS().length);if(i>=0){arcade.cursor=i;startFight(i)}});
addEventListener('keydown',e=>{
 if(studioIsOpen())return;   // Editor für die eigene Figur hat Vorrang (Tippen in Feldern)
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
  else if(e.code==='KeyC'){if(arcade.cycleSkin(SLOTS()[arcade.cursor]))saveSkins()}
  else if(e.code==='KeyE'&&CHARACTERS.custom){arcade.cursor=CI();openStudio()}
  else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ')startFight(arcade.cursor);
  e.preventDefault();return}
 if(e.code==='F2'){game.debug=!game.debug;e.preventDefault()}
 if(e.code==='Enter'||e.code==='KeyR')arcade.confirm();
 if(e.code==='Escape'&&(arcade.state==='gameover'||arcade.state==='victory'||arcade.state==='vsover'))arcade.toSelect()});
addEventListener('blur',()=>{if(!menuOpen&&!studioIsOpen())setMenu(true)}); // Fenster verlassen => Menü/Pause
// ---- Game-Loop: Akkumulator, Schrittlänge folgt dem Spieltempo ----
let last=performance.now(),acc=0,slowAcc=0,autoT=0;
function assignPads(){const l=navigator.getGamepads?[...navigator.getGamepads()]:[],pads=l.map((g,i)=>g&&g.connected?i:-1).filter(i=>i>=0);
 kb.padIndex=pads.length?pads[0]:-1;kbV1.padIndex=pads.length>1?pads[0]:-1;kbV2.padIndex=pads.length>1?pads[1]:(pads.length?pads[0]:-1)}   // 1 Pad = Spieler 2 (Spieler 1 nutzt Tastatur), 2 Pads = je Spieler eins
function loop(now){assignPads();const dt=now-last;sound.music(musicFor());
 if(gfxMode==='auto'&&!menuOpen&&!document.hidden&&dt<500){autoT+=dt;slowAcc=Math.max(0,slowAcc+(dt>26?dt-16:-4));   // dauerhaft unter ~38 FPS => eine Stufe runter (nach 1,5 s Eingewöhnung)
  if(autoT>1500&&slowAcc>350&&GFX.level>0){setGfx(GFX.level-1);renderer.applyGfx();resize();slowAcc=0;autoT=0}}
 acc+=Math.min(100,dt);last=now;const STEP=1000/(60*speed*(game.timeScale||1));
 while(acc>=STEP){if(!menuOpen&&arcade.state!=='select'){game.step();arcade.update()}acc-=STEP}
 renderer.draw(game);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
window.__renderer=renderer;window.__game=game;window.__arcade=arcade;
