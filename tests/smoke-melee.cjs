// Smoke-Test des gebauten Bundles mit DOM-Stub: Tasten-Mashing + Menü-Toggle + Rendering aller Zustände.
const fs=require('fs');const L={};
const P=()=>new Proxy(function(){},{get:(t,k)=>k==='classList'?{toggle(){},add(){},remove(){}}:k==='clientWidth'?1920:k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true},apply:()=>{}});
const mkctx=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='createPattern'?()=>({}):()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const cvs=()=>({width:1920,height:1080,clientWidth:1920,getContext:mkctx,focus(){},addEventListener(){}});
global.document={getElementById:id=>id==='screen'?cvs():P(),createElement:()=>cvs(),querySelectorAll:()=>[],documentElement:{},hidden:false,addEventListener(){}};
global.Image=class{set src(v){this.complete=false}};global.window=global;global.addEventListener=(e,f)=>{(L[e]=L[e]||[]).push(f)};global.performance={now:()=>T};
let T=0,cb=null;global.requestAnimationFrame=f=>{cb=f};
eval(fs.readFileSync('dist/game.js','utf8'));
// Melee-Smoke: Menü (3er-Schalter, CPU/Stocks), Kampf mit Tasten-Mashing + Rendering im Melee (Plattform, HUD, Respawn, Spielende), danach Arcade wieder normal.
const fire=(t,code)=>(L[t]||[]).forEach(f=>f({code,repeat:false,shiftKey:false,preventDefault(){}}));
const frame=n=>{for(let i=0;i<n;i++){T+=16.7;cb(T)}};
frame(5);fire('keydown','Tab');frame(3);if(__arcade.mode!=='story')throw new Error('Tab 1 -> story, ist '+__arcade.mode);
fire('keydown','Tab');frame(3);if(__arcade.mode!=='versus')throw new Error('Tab 2 -> versus, ist '+__arcade.mode);
fire('keydown','Tab');frame(3);if(__arcade.mode!=='melee')throw new Error('Tab 3 -> melee, ist '+__arcade.mode);
fire('keydown','KeyT');fire('keydown','KeyT');if(__arcade.stocks!==5)throw new Error('Stocks '+__arcade.stocks);
if(!__arcade.cpu)throw new Error('Melee startet gegen CPU');fire('keydown','KeyB');if(__arcade.cpu)throw new Error('CPU aus');fire('keydown','KeyB');if(!__arcade.cpu)throw new Error('CPU an');fire('keydown','ArrowUp');frame(3);
fire('keydown','KeyG');fire('keydown','Enter');frame(5);if(__arcade.vs.step!==1)throw new Error('Stage-Wahl erwartet');frame(3);fire('keydown','Enter');frame(5);
if(__arcade.state!=='select')throw new Error('Show vor dem Kampf erwartet');frame(500);   // Videos + Feuerwerk laufen vor dem Kampf
if(__arcade.state!=='fight'||!__game.melee)throw new Error('Melee-Kampf erwartet: '+__arcade.state);
const keys=['KeyA','KeyD','KeyW','KeyS','KeyJ','KeyK','KeyL','KeyU','KeyI','KeyO','Space','ArrowLeft','ArrowRight','ArrowUp'];
let seen=new Set(),maxPct=0,stocksSeen=new Set();
for(let i=0;i<14000;i++){T+=16.7;if(i%3===0){const k=keys[Math.random()*keys.length|0];fire('keydown',k);if(Math.random()<.6)fire('keyup',k)}
 if(i%400===0)__game.p1.meter=300;
 if(i%700===300){__game.p2.pct=Math.max(__game.p2.pct,140+Math.random()*60);__game.p2.vx=15;__game.p2.vy=-6;__game.p2.state='airhit';__game.p2.stun=40}   // Kill erzwingen
 if(__arcade.state==='vsover')fire('keydown','Enter');cb(T);seen.add(__game.p1.state+'/'+__game.p2.state);maxPct=Math.max(maxPct,__game.p1.pct,__game.p2.pct);stocksSeen.add(__game.p1.stocks+'-'+__game.p2.stocks)}
if(maxPct<=0)throw new Error('kein Schaden');
fire('keydown','KeyM');frame(2);fire('keydown','KeyM');
__arcade.toSelect();frame(3);__arcade.setMode('arcade');__arcade.start('tiger');frame(120);if(__game.melee)throw new Error('Arcade soll ohne Melee laufen');
console.log('Melee-Smoke OK. Max-%:',Math.round(maxPct),'Stocks-Stände:',[...stocksSeen].join(' '),'Zustände:',[...new Set([...seen].flatMap(s=>s.split('/')))].join(','));
