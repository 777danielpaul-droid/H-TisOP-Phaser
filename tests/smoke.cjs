// Smoke-Test des gebauten Bundles mit DOM-Stub: Tasten-Mashing + Menü-Toggle + Rendering aller Zustände.
const fs=require('fs');const L={};
const P=()=>new Proxy(function(){},{get:(t,k)=>k==='classList'?{toggle(){},add(){},remove(){}}:k==='clientWidth'?1920:k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true},apply:()=>{}});
const mkctx=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='createPattern'?()=>({}):()=>{}),set:(t,k,v)=>{t[k]=v;return true}});
const cvs=()=>({width:1920,height:1080,clientWidth:1920,getContext:mkctx,focus(){},addEventListener(){}});
global.document={getElementById:id=>id==='screen'?cvs():P(),createElement:()=>cvs(),querySelectorAll:()=>[],documentElement:{},hidden:false,addEventListener(){}};
global.Image=class{set src(v){this.complete=false}};global.window=global;global.addEventListener=(e,f)=>{(L[e]=L[e]||[]).push(f)};global.performance={now:()=>T};
let T=0,cb=null;global.requestAnimationFrame=f=>{cb=f};
eval(fs.readFileSync('dist/game.js','utf8'));
__arcade.start('tiger');
const keys=['KeyA','KeyD','KeyW','KeyS','KeyJ','KeyK','KeyL','KeyU','KeyI','KeyO','Space','ArrowLeft'];
const fire=(t,code)=>(L[t]||[]).forEach(f=>f({code,repeat:false,shiftKey:false,preventDefault(){}}));
let seen=new Set();
for(let i=0;i<9000;i++){T+=16.7;if(i%3===0){const k=keys[Math.random()*keys.length|0];fire('keydown',k);if(Math.random()<.6)fire('keyup',k)}
 if(i===3000||i===3100)fire('keydown','KeyM'); // Menü auf/zu
 if(i%500===0)__game.p1.meter=300;if(__arcade.state==='clear'||__arcade.state==='victory'||__arcade.state==='gameover')fire('keydown','Enter');cb(T);seen.add(__game.p1.state+'/'+__game.p2.state)}
console.log('Smoke OK. Phase:',__game.phase,'Runde',__game.round,'Zustände:',[...new Set([...seen].flatMap(s=>s.split('/')))].join(','));
