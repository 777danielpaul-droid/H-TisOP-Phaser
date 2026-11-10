// Feuerwerk (aus Ghostwriter): Rakete steigt auf, platzt zu einer Kugel aus Sternen, alles verschwindet wieder; Zeichnen läuft ohne Fehler.
import{ParticleSystem}from'../src/core/particles.js';
let fails=0;const check=(n,ok,i='')=>{console.log((ok?'  ✓ ':'  ✗ ')+n+(ok?'':'  '+i));if(!ok)fails++};

const ps=new ParticleSystem();let booms=0,bx=0,by=0;ps.onBoom=r=>{booms++;bx=r.x;by=r.y};
ps.rocket(480,470,150,'#3fe0ff');
check('Rakete wartet auf Aufstieg',ps.rk.length===1&&booms===0);
let f=0;while(booms===0&&f<200){ps.update();f++}
check('Rakete platzt nach 0,65–0,95 s',booms===1&&f>=39&&f<=58,'Frames: '+f);
check('Explosion sitzt in Höhe ty (±8 px)',Math.abs(by-150)<8&&Math.abs(bx-480)<8,bx+','+by);
const alive=()=>ps.fs.filter(p=>p.alive).length;
check('Kugel besteht aus ~210 Sternen (plus Funkenschweif)',alive()>=210&&alive()<=260,String(alive()));
check('Blitz beim Platzen',ps.ff.length===1);
for(let i=0;i<30;i++)ps.update();
const R=Math.max(...ps.fs.filter(p=>p.alive).map(p=>Math.hypot(p.x-bx,p.y-by)));
check('Kugel breitet sich aus (Radius > 80 px nach 0,5 s)',R>80,R.toFixed(0));
check('alle Werte endlich',ps.fs.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.vx)&&Number.isFinite(p.vy)));
for(let i=0;i<260;i++)ps.update();
check('nach ~5 s ist alles verglüht',alive()===0&&ps.ff.length===0&&ps.rk.length===0,String(alive()));

// Dauerfeuer wie im Sieger-Finale: Pool läuft nie über, nichts hängt
const q=new ParticleSystem();for(let t=0;t<600;t++){if(t%16===2)q.rocket(300+Math.random()*400,470,86+Math.random()*140,['#ffd23f','#ff4fd8','#fff'][t%3]);q.update()}
check('Dauerfeuer: Pool bleibt bei 4400 Sternen',q.fs.length===4400);
for(let i=0;i<400;i++)q.update();
check('Dauerfeuer: danach alles aus',q.fs.every(p=>!p.alive)&&!q.rk.length);

// Zeichnen mit Attrappen für Canvas/document (kein Browser nötig)
const calls={img:0,stroke:0};
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){},set fillStyle(v){}})})};
const g=new Proxy({},{get:(t,k)=>k==='drawImage'?()=>{calls.img++}:k==='stroke'?()=>{calls.stroke++}:()=>{},set:()=>true});
const d=new ParticleSystem();d.rocket(480,470,150,'#ff4fd8');for(let i=0;i<70;i++)d.update();
let ok=true;try{d.draw(g)}catch(e){ok=false;console.log(e)}
check('draw() zeichnet Sterne ohne Fehler',ok&&calls.img>200,String(calls.img));
console.log(fails?`\n${fails} Test(s) fehlgeschlagen`:'\nFeuerwerk-Tests bestanden');process.exit(fails?1:0);
