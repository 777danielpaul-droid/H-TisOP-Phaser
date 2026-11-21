// Balance-Messung: KI gegen KI, alle Paarungen der spielbaren Figuren, mit Seitentausch.
//   node tools/balance.mjs [--n=24] [--level=2] [--chars=tiger,bear,...] [--seed=1]
// n = Runden pro Paarung (je zur Hälfte mit vertauschten Seiten). Ausgabe: Gewinnquoten-Matrix, Gesamtquote, Rundenlänge, Schaden je Move.
// Läuft parallel über mehrere Prozesse; der Zufall ist geseedet (gleiche Parameter = vergleichbare Läufe).
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{AIController}from'../src/core/ai.js';
import{CHARACTERS}from'../src/core/characters.js';
import{STAMINA}from'../src/core/config.js';
import{fork}from'node:child_process';
import os from'node:os';
import{fileURLToPath}from'node:url';

const arg=(k,d)=>{const a=process.argv.find(s=>s.startsWith('--'+k+'='));return a?a.slice(k.length+3):d};
const IDS=arg('chars','tiger,st3g0,kitsune,anubis,rabe,leon,bear,cyberdemon').split(',');
const N=+arg('n',24),LEVEL=+arg('level',2),SEED=+arg('seed',1),STAM=arg('stam','1')==='1';   // --stam=0 misst ohne Ausdauer-System
const TUNE=arg('tune','');for(const t of TUNE.split(',').filter(Boolean)){const[k,v]=t.split('=');const p=k.split('.');
 if(p[0]==='S'){let o=STAMINA;for(let i=1;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=+v;continue}   // S.regen=.4 / S.cost.L=3 ... = Ausdauer-Konstanten
 if(CHARACTERS[p[0]])CHARACTERS[p[0]][p[1]]=+v}
const mulberry=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

function fight(a,b,seed,st){
 Math.random=mulberry(seed);
 const i1=new AIController(LEVEL),i2=new AIController(LEVEL);
 const p1=new Fighter({char:CHARACTERS[a],x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS[b],x:620,facing:-1,input:i2});
 const g=new Game(p1,p2);g.stamPref=STAM;let f=0;
 const att=(x,hp0,o)=>{const d=hp0-o.hp;if(d>0){const k=x.state==='attack'?x.moveName:'proj/sonst';const m=st.dmg[x.char.id]||(st.dmg[x.char.id]={});m[k]=(m[k]||0)+d}};
 const sa=(x)=>{const m=st.sta[x.char.id]||(st.sta[x.char.id]={fr:0,exh:0,ev:0,rest:0,sum:0,low:0,pe:0});m.fr++;m.sum+=x.st/x.stMax;if(x.exh){m.exh++;if(!x.pe)m.ev++}if(x.st<25)m.low++;if(x.state==='rest')m.rest++;x.pe=x.exh};
 while(g.phase!=='result'&&g.phase!=='match'&&f++<9000){const h1=p1.hp,h2=p2.hp;g.step();if(g.phase==='fight'||g.phase==='ko'){att(p1,h2,p2);att(p2,h1,p1)}if(g.phase==='fight'&&STAM){sa(p1);sa(p2)}}
 return{a,b,w:g.winner?g.winner.char.id:null,frames:f,ko:!g.timedOut}}

function hook(st){const o=Fighter.prototype.startMove;Fighter.prototype.startMove=function(n,...r){const m=st.mv[this.char.id]||(st.mv[this.char.id]={});m[n]=(m[n]||0)+1;return o.call(this,n,...r)}}

const jobs=[];let j=0;
for(let x=0;x<IDS.length;x++)for(let y=x+1;y<IDS.length;y++)for(let k=0;k<N;k++)jobs.push({a:k%2?IDS[y]:IDS[x],b:k%2?IDS[x]:IDS[y],seed:SEED*100003+(j++)});

if(process.argv.includes('--worker')){
 const wi=+arg('wi',0),wn=+arg('wn',1),st={dmg:{},mv:{},sta:{}};hook(st);const res=[];
 jobs.forEach((jb,i)=>{if(i%wn===wi)res.push(fight(jb.a,jb.b,jb.seed,st))});
 process.send({res,st},()=>process.exit(0))}
else{
 const W=+arg('w',4),self=fileURLToPath(import.meta.url);let done=0;const all=[],ST={dmg:{},mv:{},sta:{}};
 const merge=(t,s)=>{for(const c in s){t[c]=t[c]||{};for(const k in s[c])t[c][k]=(t[c][k]||0)+s[c][k]}};
 const t0=Date.now();
 const report=()=>{
  const pct=(x,n)=>n?Math.round(100*x/n):0,pad=(s,n)=>String(s).padEnd(n),lp=(s,n)=>String(s).padStart(n);
  const M={},T={};for(const a of IDS){M[a]={};T[a]={w:0,n:0,fr:0,ko:0};for(const b of IDS)M[a][b]={w:0,n:0}}
  for(const r of all)for(const[x,y]of[[r.a,r.b],[r.b,r.a]]){const c=M[x][y],t=T[x];c.n++;t.n++;if(r.w===x){c.w++;t.w++}t.fr+=r.frames;if(r.ko)t.ko++}
  if(process.argv.includes('--json')){const o={};for(const a of IDS)o[a]=T[a].w/T[a].n;process.stdout.write(JSON.stringify(o)+'\n',()=>process.exit(0));return}
  console.log(`\nBalance: ${all.length} Runden, KI-Stufe ${LEVEL}, ${((Date.now()-t0)/1000).toFixed(0)} s\n`);
  console.log(pad('Gewinnquote % (Zeile vs Spalte)',24)+IDS.map(i=>lp(i.slice(0,6),7)).join('')+lp('GESAMT',8)+lp('K.O.%',7)+lp('Ø s',6));
  for(const a of IDS){const t=T[a];console.log(pad(a,24)+IDS.map(b=>lp(a===b?'-':pct(M[a][b].w,M[a][b].n),7)).join('')+lp(pct(t.w,t.n),8)+lp(pct(t.ko,t.n),7)+lp((t.fr/t.n/60).toFixed(0),6))}
  console.log('\nSchaden je Figur (Ø pro Runde) | Top-Moves nach Schaden | Hypers pro Runde:');
  for(const a of IDS){const rounds=T[a].n||1,d=ST.dmg[a]||{},tot=Object.values(d).reduce((s,v)=>s+v,0),mv=ST.mv[a]||{};
   const top=Object.entries(d).sort((x,y)=>y[1]-x[1]).slice(0,8).map(([k,v])=>`${k} ${Math.round(v/rounds)}`).join(' · ');
   console.log(`${pad(a,10)} ${lp(Math.round(tot/rounds),4)} | ${top} | Hyper ${((mv.super||0)/rounds).toFixed(2)} Luft ${((mv.airsuper||0)/rounds).toFixed(2)}`)}
  if(STAM){console.log('\nAusdauer je Figur: Ø Füllstand | Zeit erschöpft | Zeit <25 | Auspowern/Runde | Verschnaufen (s)/Runde');
   for(const a of IDS){const m=ST.sta[a]||{fr:1,exh:0,ev:0,rest:0,sum:0,low:0},rounds=T[a].n||1;
    console.log(`${pad(a,10)} ${lp(Math.round(100*m.sum/m.fr),3)} % | ${lp((100*m.exh/m.fr).toFixed(1),5)} % | ${lp((100*m.low/m.fr).toFixed(1),5)} % | ${lp((m.ev/rounds).toFixed(2),5)} | ${lp((m.rest/60/rounds).toFixed(2),5)}`)}}
  process.exit(0)};
 for(let k=0;k<W;k++){const c=fork(self,['--worker','--wi='+k,'--wn='+W,'--n='+N,'--level='+LEVEL,'--seed='+SEED,'--chars='+IDS.join(','),'--tune='+TUNE,'--stam='+(STAM?1:0)]);
  c.on('message',m=>{all.push(...m.res);merge(ST.dmg,m.st.dmg);merge(ST.mv,m.st.mv);merge(ST.sta,m.st.sta);if(++done===W)report()})}
}
