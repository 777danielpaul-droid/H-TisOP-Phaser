// Combatant Bay (Arcade/Story): echte Z-Staffelung + Neon-Nebel (render/select.js, render/fog.js). Ohne DOM.  node tests/depth.test.js
import assert from'node:assert/strict';
import{CAR,CAR_Z,carK,carProject,carZ,carRect,SelectScreen}from'../src/render/select.js';
import{NeonFog,fogParseColor}from'../src/render/fog.js';
import{CHARACTERS,ROSTER}from'../src/core/characters.js';
const ok=n=>console.log('  ✓',n),near=(a,b,e=.6)=>Math.abs(a-b)<=e;
// --- Z-Achse ---
{const sel=carProject(0),side=carProject(1),left=carProject(-1);
 assert.equal(sel.z,0);assert.ok(side.z>sel.z+100&&left.z===side.z,'gewählte Figur steht auf der Z-Achse deutlich weiter vorn');
 assert.ok(CAR_Z.fog>sel.z&&CAR_Z.fog<side.z,'Nebelebene liegt zwischen gewählter und hinteren Figuren');
 assert.equal(sel.k,1);assert.ok(near(CAR.sc*side.k,CAR.scSide,.01),'Perspektive liefert die bisherige Größe der hinteren Figuren');
 assert.ok(near(sel.x,CAR.cx)&&near(sel.y,CAR.base)&&near(side.y,CAR.sideBase)&&near(side.x,CAR.cx+CAR.spacing)&&near(left.x,CAR.cx-CAR.spacing),'Bildposition aus Z passt zu den Klickflächen');
 const r=carRect(1);assert.ok(side.x>=r.x&&side.x<=r.x+r.w);
 let prev=-1;for(let d=0;d<=1.2;d+=.1){const z=carZ(d);assert.ok(z>=prev&&z<=CAR_Z.back);prev=z}assert.equal(carZ(2),CAR_Z.back);assert.ok(carK(100)<carK(10));ok('Z-Modell: gewählte Figur vorn, übrige dahinter, Nebel dazwischen, Klickflächen passen')}
// --- Zeichenreihenfolge im Rondell: hinten -> Nebel -> gewählte Figur ---
{const log=[],g=new Proxy({},{get:(t,k)=>k in t?t[k]:(...a)=>{log.push([k,a]);return/^create/.test(k)?{addColorStop(){}}:undefined},set(t,k,v){t[k]=v;return true}});
 const hud=new Proxy({},{get:(t,k)=>(...a)=>{if(k==='fam')a[1]();}});
 const self={hud,fakes:{},fake(id,t){return SelectScreen.prototype.fake.call(this,id,t)},skinDots(){},fogLayer:(gg,id,t,dt)=>log.push(['FOG',id]),rp:null,ln:null};
 const slots=[...ROSTER,'custom'];try{SelectScreen.prototype.carousel.call(self,g,slots,1,{skinOf:()=>0},10)}catch(e){console.log('Hinweis:',e.message)}
 const fi=log.findIndex(l=>l[0]==='FOG');assert.ok(fi>0,'Nebel wird gezeichnet');assert.equal(log[fi][1],slots[1],'Nebel bekommt die gewählte Figur (Neonfarbe)');
 assert.equal(log.filter(l=>l[0]==='FOG').length,1,'genau eine Nebelebene');
 const sc=log.map((l,i)=>[l,i]).filter(([l])=>l[0]==='scale'&&l[1].length===2&&l[1][0]===l[1][1]&&l[1][0]>.3&&l[1][0]<1.2).map(([l,i])=>({s:l[1][0],i}));
 const big=Math.max(...sc.map(x=>x.s));assert.ok(sc.filter(x=>x.s>=big-1e-9).every(x=>x.i>fi),'gewählte (größte) Figur wird NACH dem Nebel gezeichnet');
 assert.ok(sc.some(x=>x.i<fi&&x.s<big-.1),'hintere (kleinere) Figuren werden VOR dem Nebel gezeichnet');ok('Reihenfolge: hintere Figuren -> Nebel -> gewählte Figur')}
// --- Nebel: zweifarbig = Neonfarbe der gewählten Figur + Standard-Cyan ---
{assert.deepEqual(fogParseColor('#ff8000'),[255,128,0]);assert.deepEqual(fogParseColor('#f00'),[255,0,0]);assert.deepEqual(fogParseColor('rgb(1, 2, 3)'),[1,2,3]);assert.deepEqual(fogParseColor('quatsch'),[63,224,255]);
 const stops=[],g=new Proxy({},{get:(t,k)=>k in t?t[k]:k==='createRadialGradient'?()=>({addColorStop:(o,c)=>stops.push(c)}):()=>{},set(t,k,v){t[k]=v;return true}});
 const f=new NeonFog(),R={x:18,y:104,w:466,h:394,hole:255},rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
 const split=()=>{const c=stops.filter(s=>/^rgba/.test(s)).map(rgb),cy=c.filter(([r,g,b])=>b>=g*.8&&g>r*1.5);return{cy:cy.length,rest:c.filter(x=>!cy.includes(x))}};
 f.draw(g,5,R,'#ff2020',1);assert.ok(stops.length>50,'viele Schwaden');let sp=split();
 assert.ok(sp.cy>10,'Cyan-Anteil vorhanden');assert.ok(sp.rest.length>sp.cy,'Figurfarbe überwiegt');assert.ok(sp.rest.every(([r,g,b])=>r>g*1.5&&r>b*1.5),'Rest = Rot der gewählten Figur');
 stops.length=0;for(let i=0;i<80;i++)f.draw(g,10+i,R,'#20ff20',3);stops.length=0;f.draw(g,100,R,'#20ff20',3);sp=split();
 assert.ok(sp.cy>10,'Cyan bleibt bei jeder Figur dabei');assert.ok(sp.rest.length>sp.cy&&sp.rest.every(([r,g,b])=>g>r*1.5&&g>b*1.5),'Figurfarbe wechselt weich auf Grün');
 stops.length=0;f.draw(g,101,R,'#ff2020',0);assert.ok(split().rest.every(([r,g,b])=>g>r*1.5),'dt=0: Farbe ändert sich nicht');ok('Neon-Nebel zweifarbig: Figurfarbe (überwiegt, weicher Wechsel) + Standard-Cyan')}
// --- Schwaden bewegen sich und haben unterschiedliche Dichte ---
{const f=new NeonFog(),W=155,H=131;const q0=f.body.map(p=>f.place(p,0,W,H)),q1=f.body.map(p=>f.place(p,600,W,H));
 assert.ok(q0.filter((q,i)=>Math.hypot(q.x-q1[i].x,q.y-q1[i].y)>8).length>20,'Schwaden treiben/kreisen');
 const dens=q0.map(q=>q.dens);assert.ok(Math.max(...dens)-Math.min(...dens)>.4,'unterschiedlich dicht');
 assert.ok(q0.every(q=>q.x>-95&&q.x<W+95&&q.y>-20&&q.y<H+20)&&f.body.every(p=>p.rx>p.ry*1.4),'lang gezogene Schwaden im Bild');ok('Schwaden driften, kreisen, sind lang gezogen und unterschiedlich dicht')}
console.log('Tiefen-/Nebel-Tests bestanden');
