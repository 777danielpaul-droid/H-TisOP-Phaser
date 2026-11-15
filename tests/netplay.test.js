// Online-Kampf (Lockstep): zwei Spielinstanzen über eine simulierte Leitung mit Verzögerung, Jitter und Paketverlust müssen Frame für Frame identisch rechnen. node tests/netplay.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{CHARACTERS}from'../src/core/characters.js';
import{NetInput,Lockstep,NET,NEUTRAL,encInput,decInput,netHash}from'../src/core/netplay.js';
const ok=n=>console.log('  ✓',n);
// 1) Eingabe-Kodierung: alle Richtungen/Tasten überleben Hin- und Rückweg
{for(const dx of[-1,0,1])for(const dy of[-1,0,1])for(const mask of[[],['L'],['M','H'],['S','SUP','DASH'],['L','M','H','S','SUP','DASH']]){const v=decInput(encInput(dx,dy,mask));assert.equal(v.dx,dx);assert.equal(v.dy,dy);assert.deepEqual(v.pressed.sort(),[...mask].sort())}
 assert.equal(encInput(0,0,[]),NEUTRAL);assert.ok(encInput(1,1,['L','M','H','S','SUP','DASH'])<1024,'passt in 10 Bit');ok('Eingabe-Kodierung (3×3 Richtungen × Tastenmengen, neutral = '+NEUTRAL+')')}
// Zufall mit festem Startwert (nur für die Test-Eingaben)
const rng=s=>()=>((s^=s<<13,s^=s>>>17,s^=s<<5)>>>0)/4294967296;
// Eingabe-Quelle: läuft grob aufeinander zu, hält Richtungen eine Weile, drückt oft Tasten (damit Kämpfe, Combos, Supers, KOs vorkommen)
const sampler=(seed,dirToward)=>{const r=rng(seed);let dx=0,dy=0,hold=0;return()=>{if(--hold<=0){hold=2+(r()*14|0);const q=r();dx=q<.45?dirToward:q<.6?-dirToward:0;dy=r()<.12?-1:r()<.1?1:0}
 const pr=[];if(r()<.22)pr.push(['L','M','H','S','SUP','DASH'][r()*6|0]);if(r()<.05)pr.push('H');return encInput(dx,dy,pr)}};
function mkGame(){const inputs=[new NetInput(),new NetInput()],p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:inputs[0]}),p2=new Fighter({char:CHARACTERS.st3g0,x:620,facing:-1,input:inputs[1]});const g=new Game(p1,p2);g.frame=0;g.rematch();p1.meter=p2.meter=300;return{g,inputs}}
// Leitung: jede Nachricht kommt nach lat(+Jitter) Ticks an, in Reihenfolge; loss = Verlustquote
function wire({lat=3,jit=0,loss=0,seed=7}={}){const r=rng(seed),q=[[],[]],last=[0,0];let t=0;
 return{send(to,m){if(loss&&r()<loss)return;const at=Math.max(last[to],t+lat+(jit?r()*jit|0:0));last[to]=at;q[to].push({at,m:JSON.parse(JSON.stringify(m))})},
  deliver(to,fn){while(q[to].length&&q[to][0].at<=t)fn(q[to].shift().m)},tick(){t++},get t(){return t},pending:()=>q[0].length+q[1].length}}
function run({frames=6000,lat=3,jit=0,loss=0,delay=6,rateB=1,tamper=null,seed=11}={}){
 const A=mkGame(),B=mkGame(),w=wire({lat,jit,loss,seed}),hashes=[new Map(),new Map()],desyncs=[];
 const mk=(me,slot,to)=>{const ls=new Lockstep({game:me.g,inputs:me.inputs,slot,sample:sampler(100+slot,slot?-1:1),send:m=>w.send(to,m),now:()=>w.t*16,onDesync:d=>desyncs.push({slot,...d})});return ls};
 const la=mk(A,0,1),lb=mk(B,1,0);
 la.start(1,delay);lb.start(1,delay);
 const log=(i,l)=>{const o=l.hash.bind(l);l.hash=function(){hashes[i].set(l.fr,netHash(l.game));o()}};log(0,la);log(1,lb);
 let guard=0;while((la.fr<frames||lb.fr<frames)&&guard++<frames*60){w.tick();w.deliver(0,m=>la.recv(m));w.deliver(1,m=>lb.recv(m));
  if(la.fr<frames)la.step();for(let k=0;k<rateB;k++)if(lb.fr<frames)lb.step();la.flush();lb.flush();
  if(tamper&&la.fr===tamper&&!run.done){run.done=true;A.g.fighters[0].x+=.5}}
 return{A,B,la,lb,hashes,desyncs,ticks:w.t}}
const same=(r,label)=>{let n=0;for(const[f,h]of r.hashes[0])if(r.hashes[1].has(f)){assert.equal(r.hashes[1].get(f),h,label+': Zustand weicht bei Frame '+f+' ab');n++}assert.ok(n>=r.la.fr/NET.hashEvery*.9,label+': genug Vergleichspunkte');assert.equal(r.desyncs.length,0,label+': kein Desync gemeldet');return n};
// 2) Sauberes Netz: 6000 Frames identisch, es wurde wirklich gekämpft
{const r=run({frames:6000});const n=same(r,'sauber');const[a,b]=[r.A.g,r.B.g];assert.equal(netHash(a),netHash(b));
 const dmg=a.fighters.reduce((s,f)=>s+(f.maxHp-f.hp),0)+a.fighters.reduce((s,f)=>s+f.wins,0)*1000+(a.round-1)*1000;assert.ok(dmg>400,'Kampf mit Treffern/Runden fand statt ('+dmg+')');
 ok('2 Geräte, 6000 Frames, '+n+' Prüfpunkte identisch (Runde '+a.round+', HP '+a.fighters.map(f=>Math.round(f.hp))+')')}
// 3) Hohe Laufzeit + Jitter: Eingabe-Verzögerung reicht, nie ein Desync (ggf. kurze Wartezeiten)
{const r=run({frames:5000,lat:4,jit:3,delay:8});same(r,'Jitter');ok('Laufzeit 4 + Jitter 3 Ticks bei 8 Frames Verzögerung: identisch ('+r.ticks+' Ticks für 5000 Frames)')}
// 4) Ein Gerät rechnet doppelt so schnell (wartet dann auf das langsamere) – bleibt synchron
{const r=run({frames:4000,rateB:2,lat:2});same(r,'Tempo');assert.ok(Math.abs(r.la.fr-r.lb.fr)<=NET.delayMax+2,'Abstand begrenzt durch die Verzögerung');ok('Unterschiedliches Rechentempo: synchron, Abstand ≤ Verzögerung')}
// 5) 10 % Paketverlust (z. B. UDP/WebRTC-Transport): Mehrfachsendung der letzten Eingaben füllt Lücken, kein Desync
{const r=run({frames:4000,loss:.1,lat:2,delay:8});same(r,'Verlust');ok('10 % Paketverlust: identisch (Redundanz '+NET.redundancy+')')}
// 6) Desync wird erkannt: ein Gerät rechnet minimal anders -> beide melden es spätestens beim nächsten Prüfpunkt
{run.done=false;const r=run({frames:900,tamper:200});assert.ok(r.desyncs.length>=1,'Desync gemeldet');assert.ok(r.desyncs.every(d=>d.frame>=200),'erst nach der Abweichung');assert.ok(r.desyncs[0].frame<=200+NET.hashEvery,'innerhalb eines Prüfintervalls');ok('Desync-Erkennung: Abweichung bei Frame 200 erkannt bei Frame '+r.desyncs[0].frame)}
// 7) Ohne Gegner-Eingabe wird nicht gerechnet (kein Vorlaufen), Wartezeit wird gemessen
{const A=mkGame();let t=0;const ls=new Lockstep({game:A.g,inputs:A.inputs,slot:0,sample:()=>NEUTRAL,send:()=>{},now:()=>t});ls.start(1,6);t=100;assert.equal(ls.step(),false);assert.equal(A.g.frame,0);t=700;assert.equal(ls.step(),false);assert.ok(ls.stalledMs()>=600);
 ls.recv({t:'i',e:1,f:0,a:[NEUTRAL]});assert.equal(ls.step(),true);assert.equal(A.g.frame,1);assert.equal(ls.stalledMs(),0);ok('Wartet auf den Gegner statt vorzulaufen; Wartezeit messbar')}
// 8) Nachrichten einer fremden Epoche und unsinnige Werte werden ignoriert
{const A=mkGame();const ls=new Lockstep({game:A.g,inputs:A.inputs,slot:0,sample:()=>NEUTRAL,send:()=>{},now:()=>0});ls.start(2,6);ls.recv({t:'i',e:1,f:0,a:[NEUTRAL]});assert.equal(ls.remote.size,0);ls.recv({t:'i',e:2,f:2,a:['x',null,NEUTRAL]});assert.equal(ls.remote.size,1,'nur gültige Zahlen');ls.recv({t:'i',e:2,f:'a',a:[1]});assert.equal(ls.remote.size,1);ok('Fremde Epoche / ungültige Eingaben verworfen')}
