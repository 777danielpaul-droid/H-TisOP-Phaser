import{Game}from'./core/game.js';
import{Fighter}from'./core/fighter.js';
import{KeyboardInput}from'./core/input.js';
import{AIController}from'./core/ai.js';
import{Arcade}from'./core/arcade.js';
import{CHARACTERS,ROSTER}from'./core/characters.js';
import{MOVE_LIST,charMoves}from'./core/moves.js';
import{SPEED}from'./core/config.js';
import{Renderer}from'./render/renderer.js';
import{Sound}from'./render/audio.js';
import{loadFonts}from'./render/fonts.js';
import{hitCard,hitEdit}from'./render/select.js';
import{studioOpen,studioIsOpen,studioLoadSaved}from'./render/customstudio.js';
// Einstiegspunkt: Vollbild-Canvas, Eingabe, KI, Game-Loop (fester Schritt) und Pause-Menü (M).
loadFonts();   // eingebettete Schriften registrieren (Canvas + Menü)
const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return localStorage.getItem(k)||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};   // Auswahl merken (falls Browser-Speicher verfügbar)
let saved=+load('tf_difficulty',0);
const kb=new KeyboardInput(window),ai=new AIController(saved);
const p1=new Fighter({char:CHARACTERS[ROSTER[0]],x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
const game=new Game(p1,p2),canvas=$('screen'),renderer=new Renderer(canvas),arcade=new Arcade(game,p1,p2,ai);arcade.difficulty=saved;
let menuOpen=false,speed=SPEED;
// ---- Sound: Lautstärke/Stumm gemerkt; Audio startet erst nach der ersten Tasten-/Klick-Geste (Browser-Regel) ----
const sound=new Sound();game.audio=sound;sound.setVolume(+load('tf_volume',.7));sound.setMuted(load('tf_mute','0')==='1');
for(const ev of['keydown','pointerdown'])addEventListener(ev,()=>sound.unlock());
// ---- Canvas immer scharf: interne Auflösung folgt der Fenstergröße (max. 3200 px breit) ----
function resize(){const dpr=Math.min(2,window.devicePixelRatio||1);const w=Math.max(960,Math.min(3200,Math.round((canvas.clientWidth||1920)*dpr)));
 canvas.width=w;canvas.height=Math.round(w*9/16);renderer.scale=canvas.width/960}
window.addEventListener('resize',resize);resize();
// ---- Menü ----
const menu=$('menu'),tabs=[...document.querySelectorAll('.tabs button')],names=tabs.map(b=>b.dataset.tab);let tab=0;
const ml=$('movelist');const row=r=>`<tr><td class="mv">${r[0]}</td><td class="key">${r[1]}</td><td class="note">${r[2]}</td></tr>`;
const fillMoves=()=>{if(!ml)return;const c=p1.char;ml.innerHTML=`<tr><td colspan="3" class="mv">${c.name} – Stärken: ${c.pros||''} · Schwächen: ${c.cons||''}</td></tr>`+charMoves(c).map(row).join('')+MOVE_LIST.map(row).join('')};fillMoves();
function showTab(i){tab=(i+names.length)%names.length;names.forEach((n,k)=>{const s=$('tab-'+n);if(s)s.classList.toggle('hidden',k!==tab);if(tabs[k])tabs[k].classList.toggle('on',k===tab)})}
tabs.forEach((b,i)=>b.onclick=()=>showTab(i));showTab(0);
function setMenu(open){if(open)fillMoves();menuOpen=open;menu.classList.toggle('hidden',!open);kb.keys.clear();kb.pend.length=0;kb.clear();if(!open)canvas.focus()}
const fs=()=>{if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()};
canvas.addEventListener('dblclick',fs);
const on=(id,fn)=>{const e=$(id);if(e)e.onclick=()=>fn(e)};
on('btn-resume',()=>setMenu(false));
on('btn-debug',e=>{game.debug=!game.debug;e.textContent=game.debug?'An':'Aus';e.classList.toggle('on',game.debug)});
on('btn-meter',()=>{p1.meter=300});
on('btn-restart',()=>{game.rematch();setMenu(false)});
on('btn-select',()=>{arcade.toSelect();setMenu(false)});
on('btn-studio',()=>{arcade.toSelect();setMenu(false);arcade.cursor=CUSTOM_I;openStudio()});
const diff=$('difficulty');const setDiff=d=>{arcade.setDifficulty(d);save('tf_difficulty',String(arcade.difficulty));if(diff)diff.value=String(arcade.difficulty)};
if(diff){diff.value=String(arcade.difficulty);diff.onchange=()=>setDiff(+diff.value)}
const vol=$('volume'),mute=$('btn-mute');
if(vol){vol.value=String(sound.vol);vol.oninput=()=>{sound.setVolume(+vol.value);save('tf_volume',String(sound.vol))}}
const showMute=()=>{if(mute){mute.textContent=sound.muted?'Stumm':'An';mute.classList.toggle('on',!sound.muted)}};showMute();
if(mute)mute.onclick=()=>{sound.setMuted(!sound.muted);save('tf_mute',sound.muted?'1':'0');showMute()};
const sp=$('speed');if(sp)sp.oninput=()=>{speed=+sp.value;$('speedval').textContent=speed.toFixed(1)+'×'};
if(sp){sp.value=speed;$('speedval').textContent=speed.toFixed(1)+'×'}
// ---- Startmenü (Charakterwahl): Tastatur + Maus ----
// 5. Slot = eigene Figur (Upload-Editor, gespeichert im Browser); leer => Klick/Enter öffnet den Editor
const SLOTS=()=>[...ROSTER,'custom'],CUSTOM_I=ROSTER.length;
const openStudio=()=>{kb.keys.clear();kb.pend.length=0;kb.clear();
 studioOpen(r=>{canvas.focus();kb.keys.clear();kb.pend.length=0;kb.clear();
  if(r&&r.saved){arcade.cursor=CUSTOM_I;if(r.fight)startFight(CUSTOM_I)}else if(r&&r.deleted)arcade.cursor=Math.min(arcade.cursor,CUSTOM_I)})};
const startFight=i=>{const id=SLOTS()[i];if(id==='custom'&&!CHARACTERS.custom){openStudio();return}kb.keys.clear();kb.pend.length=0;kb.clear();arcade.start(id)};
studioLoadSaved();   // gespeicherte eigene Figur aus dem Browser laden
const logical=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)/r.width*960,(e.clientY-r.top)/r.height*540]};
canvas.addEventListener('mousemove',e=>{if(arcade.state!=='select'||menuOpen||studioIsOpen())return;const i=hitCard(...logical(e),SLOTS().length);if(i>=0)arcade.cursor=i});
canvas.addEventListener('click',e=>{if(arcade.state!=='select'||menuOpen||studioIsOpen())return;const L=logical(e);
 if(CHARACTERS.custom&&hitEdit(...L,SLOTS().length)){arcade.cursor=CUSTOM_I;openStudio();return}
 const i=hitCard(...L,SLOTS().length);if(i>=0){arcade.cursor=i;startFight(i)}});
addEventListener('keydown',e=>{
 if(studioIsOpen())return;   // Editor für die eigene Figur hat Vorrang (Tippen in Feldern)
 if(e.code==='KeyM'){setMenu(!menuOpen);return}
 if(e.code==='Escape'&&menuOpen){setMenu(false);return}
 if(e.code==='KeyF'&&!menuOpen){fs();return}
 if(menuOpen){if(e.code==='ArrowRight')showTab(tab+1);if(e.code==='ArrowLeft')showTab(tab-1);return}
 if(arcade.state==='select'){const n=SLOTS().length;
  if(e.code==='ArrowRight'||e.code==='KeyD')arcade.cursor=(arcade.cursor+1)%n;
  else if(e.code==='ArrowLeft'||e.code==='KeyA')arcade.cursor=(arcade.cursor+n-1)%n;
  else if(e.code==='ArrowUp'||e.code==='KeyW')setDiff(arcade.difficulty+1);
  else if(e.code==='ArrowDown'||e.code==='KeyS')setDiff(arcade.difficulty-1);
  else if(e.code==='KeyE'&&CHARACTERS.custom){arcade.cursor=CUSTOM_I;openStudio()}
  else if(e.code==='Enter'||e.code==='Space'||e.code==='KeyJ')startFight(arcade.cursor);
  e.preventDefault();return}
 if(e.code==='F2'){game.debug=!game.debug;e.preventDefault()}
 if(e.code==='Enter'||e.code==='KeyR')arcade.confirm();
 if(e.code==='Escape'&&(arcade.state==='gameover'||arcade.state==='victory'))arcade.toSelect()});
addEventListener('blur',()=>{if(!menuOpen&&!studioIsOpen())setMenu(true)}); // Fenster verlassen => Menü/Pause
// ---- Game-Loop: Akkumulator, Schrittlänge folgt dem Spieltempo ----
let last=performance.now(),acc=0;
function loop(now){acc+=Math.min(100,now-last);last=now;const STEP=1000/(60*speed*(game.timeScale||1));
 while(acc>=STEP){if(!menuOpen&&arcade.state!=='select'){game.step();arcade.update()}acc-=STEP}
 renderer.draw(game);requestAnimationFrame(loop)}
requestAnimationFrame(loop);
window.__game=game;window.__arcade=arcade;
