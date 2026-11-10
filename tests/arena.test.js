// Gasse zwischen zwei Hochhäusern (beide Seiten brechbar): node tests/arena.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{CHARACTERS}from'../src/core/characters.js';
import{GROUND,WALL_L,WALL_R,BARRIER,WORLD,HOUSE}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS.wolf,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:i2});
 const g=new Game(p1,p2);const tick=(pr=[],dx=0,dy=0)=>{const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,pr,fz);i2.feed(0,0,[],fz);g.step()};
 while(g.phase!=='fight')tick();return{g,p1,p2,i1,i2,tick}}
const ENDL=WALL_L-BARRIER.width,ENDR=WALL_R+BARRIER.width;
// 1) Startzustand: enge Gasse, links und rechts je eine brechbare Wand, dahinter unzerstörbare Rückwand
{const{g}=setup(),A=g.arena;assert.equal(A.l,WALL_L);assert.equal(A.r,WALL_R);assert.ok(WALL_R-WALL_L<800,'enge Gasse');
 for(const s of['L','R']){assert.equal(A[s].visible,true);assert.equal(A[s].final,false);assert.equal(A[s].hp,BARRIER.hp[0])}assert.equal(A.endL,ENDL);assert.equal(A.endR,ENDR);ok('Startzustand: Gasse '+(WALL_R-WALL_L)+' px, beide Wände brechbar')}
// 2) Treffer auf Gegner an der Wand beschädigen sie (echter Kampf) – beide Seiten
for(const side of['R','L']){const{g,p1,p2,tick}=setup(),A=g.arena,d=side==='R'?1:-1;p2.x=A[side].x;p1.x=p2.x-d*70;p1.facing=d;
 for(let k=0;k<12;k++)tick();tick(['M']);let n=0;while(A[side].hp===BARRIER.hp[0]&&n++<40)tick();
 assert.ok(A[side].hp<BARRIER.hp[0],'Wand beschädigt');assert.ok(A[side].show>0);assert.equal(A[side].x,side==='R'?WALL_R:WALL_L);ok('Treffer in der Ecke beschädigt die Wand ('+side+', '+(BARRIER.hp[0]-A[side].hp).toFixed(0)+' Schaden)')}
// 3) Weiter verprügeln -> Wand bricht, Gegner fliegt ins Gebäude (links und rechts)
for(const side of['R','L']){const{g,p1,p2,tick}=setup(),A=g.arena,d=side==='R'?1:-1;p2.x=A[side].x;let broke=false,vx=0,st='';
 for(let f=0;f<1500&&!broke;f++){if(['idle','hit'].includes(p2.state)&&p2.grounded){p2.x=d>0?Math.min(p2.x,A.r):Math.max(p2.x,A.l);p2.hp=p2.maxHp}
  if(p1.state==='idle'||p1.state==='walk'){p1.x=p2.x-d*70;p1.facing=d}
  const s0=A[side].step;tick(p1.state==='idle'?['M']:[]);if(A[side].step>s0){broke=true;vx=p2.vx;st=p2.state}}
 assert.ok(broke,'Wand gebrochen');assert.equal(A[side==='R'?'r':'l'],side==='R'?ENDR:ENDL);assert.equal(A[side].final,true);assert.ok(A.msg&&A.msg.dir===d&&A.openT[side]>=0);
 assert.equal(st,'airhit');assert.ok(vx*d>5,'Gegner fliegt ins Gebäude '+vx);
 for(let k=0;k<30;k++)tick();assert.ok(side==='R'?p2.x>WALL_R+20:p2.x<WALL_L-20,'im Gebäude ('+p2.x.toFixed(0)+')');
 assert.equal(A[side==='R'?'l':'r'],side==='R'?WALL_L:WALL_R,'andere Seite unberührt');ok('Bruch '+side+': Grenze → '+(side==='R'?ENDR:ENDL)+', Gegner fliegt hinein')}
// 4) Rückwand unzerstörbar, je Seite nur ein Durchbruch, beide Seiten unabhängig
{const{g,p2}=setup(),A=g.arena;p2.x=A.r;assert.equal(A.hitWall(g,p2,1e6),true);p2.x=A.r;assert.equal(A.hitWall(g,p2,1e9),false);assert.equal(A.r,ENDR);
 p2.x=A.l;assert.equal(A.hitWall(g,p2,1e6),true);assert.equal(A.l,ENDL);p2.x=A.l;assert.equal(A.hitWall(g,p2,1e9),false);assert.equal(A.l,ENDL);assert.equal(A.broken,2);ok('Rückwände halten, beide Seiten brechen unabhängig (Arena '+(ENDR-ENDL)+' px)')}
// 5) Block: kein Hindurchschleudern
{const{g,p2}=setup(),A=g.arena;for(const[s,d]of[['R',1],['L',-1]]){p2.x=A[s].x;p2.state='block';p2.vx=0;A.hitWall(g,p2,1e6,{launch:false});assert.equal(p2.state,'block');assert.ok(p2.vx*d>0)}ok('Block: kein Hindurchschleudern')}
// 6) Aufprall mit Tempo schadet, langsames Anstoßen nicht
{const{g,p2}=setup(),A=g.arena;p2.x=A.l+2;p2.vx=-9;p2.state='airhit';p2.stun=99;p2.y=GROUND-50;p2.vy=0;g.simulate(false);assert.ok(A.L.hp<BARRIER.hp[0],'Aufprall links schadet');
 const h=A.L.hp;p2.x=A.l+1;p2.vx=-1.5;p2.state='hit';p2.stun=20;g.simulate(false);assert.equal(A.L.hp,h);ok('Aufprall-Schaden nur bei hohem Tempo')}
// 7) In die Gebäude laufen, Rückwände stoppen
{const{g,p1,tick}=setup(),A=g.arena;A.hitWall(g,{x:A.r,y:GROUND,vx:0,state:'idle'},1e6);A.hitWall(g,{x:A.l,y:GROUND,vx:0,state:'idle'},1e6);
 p1.x=WALL_R-20;for(let k=0;k<700;k++)tick([],1);assert.ok(p1.x>WALL_R+150&&p1.x<=ENDR+.01,'rechts '+p1.x.toFixed(0));
 p1.x=WALL_L+20;for(let k=0;k<700;k++)tick([],-1);assert.ok(p1.x<WALL_L-150&&p1.x>=ENDL-.01,'links '+p1.x.toFixed(0));ok('Laufen in beide Gebäude, Rückwände stoppen')}
// 8) Neue Runde: beide Wände wieder heil
{const{g,p2}=setup(),A=g.arena;p2.x=A.r;A.hitWall(g,p2,1e6);p2.x=A.l;A.hitWall(g,p2,1e6);g.startRound();assert.equal(g.arena.r,WALL_R);assert.equal(g.arena.l,WALL_L);assert.equal(g.arena.R.hp,BARRIER.hp[0]);assert.equal(g.arena.openT.L,-1);assert.equal(g.arena.broken,0);ok('Rundenstart setzt die Gasse zurück')}
// 9) Welt umfasst beide Gebäude komplett
assert.ok(WORLD.x0<ENDL-24&&WORLD.x1>ENDR+24);ok('Welt umfasst beide Gebäude');
// 10) Breitere Häuser: Innenraum >= 900 px je Seite
assert.ok(BARRIER.width>=900);ok('Gebäude '+BARRIER.width+' px breit');
// 11) Decke im Gebäude: Sprunghöhe begrenzt (Kopf bleibt unter HOUSE.ceil), im Hof dagegen frei
{const{g,p1,tick}=setup(),A=g.arena,hh=132*(p1.char.size||1);let hof=1e9;
 p1.x=480;for(let k=0;k<70;k++){tick(k<2?['UP']:[],0,0);hof=Math.min(hof,p1.y-hh)}
 assert.ok(hof<HOUSE.ceil-40,'im Hof höher als die Decke ('+hof.toFixed(0)+')');
 for(let k=0;k<90;k++)tick();
 A.hitWall(g,{x:A.r,y:GROUND,vx:0,state:'idle'},1e6);p1.x=WALL_R+300;p1.vx=0;for(let k=0;k<40;k++)tick();
 let inn=1e9;for(let k=0;k<80;k++){tick(k===0?['UP']:[],0,-1);inn=Math.min(inn,p1.y-hh);assert.ok(p1.y-hh>=HOUSE.ceil-.01,'Kopf unter der Decke ('+(p1.y-hh).toFixed(1)+')')}
 assert.ok(inn<HOUSE.ceil+20,'stößt wirklich an die Decke ('+inn.toFixed(0)+')');
 ok('Decke: Hof Kopfhöhe '+hof.toFixed(0)+', im Gebäude nie über '+HOUSE.ceil)}
// 12) Vom Hof aus nicht über dem Türsturz in das Gebäude springen (kein Ploppen in die Decke)
for(const side of['R','L']){const{g,p1,tick}=setup(),A=g.arena,d=side==='R'?1:-1,hh=132*(p1.char.size||1);
 A.hitWall(g,{x:A[side].x,y:GROUND,vx:0,state:'idle'},1e6);
 p1.x=(side==='R'?WALL_R:WALL_L)-d*30;p1.y=HOUSE.ceil-60;p1.vy=0;p1.state='air';p1.airJumps=0;
 for(let k=0;k<6;k++){tick([],d,0);assert.ok(side==='R'?p1.x<=WALL_R+.01:p1.x>=WALL_L-.01,'bleibt im Hof '+p1.x.toFixed(0));}
 p1.x=(side==='R'?WALL_R:WALL_L)-d*30;p1.y=GROUND-1;p1.vy=-6;p1.state='air';for(let k=0;k<50;k++)tick([],d,0);
 assert.ok(side==='R'?p1.x>WALL_R+40:p1.x<WALL_L-40,'tief fliegend kommt man hinein ('+p1.x.toFixed(0)+')');
 ok('Türsturz '+side+': hoch geblockt, tief durch')}
console.log('Arena-Tests bestanden');
