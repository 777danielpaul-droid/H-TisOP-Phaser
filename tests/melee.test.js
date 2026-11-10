// Melee-Modus (Smash-Stil): Prozent statt HP, Rückstoß wächst mit %, offene Plattform, Blast-Zonen, Stocks, Respawn, KI-Rückkehr. node tests/melee.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS}from'../src/core/characters.js';
import{MELEE,GROUND,ROUND}from'../src/core/config.js';
import{meleeKnockback}from'../src/core/melee.js';
const ok=n=>console.log('  ✓',n);
function setup(){const ai=new AIController(2),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.st3g0,x:620,facing:-1,input:new InputBuffer()});
 const g=new Game(p1,p2),a=new Arcade(g,p1,p2,ai);return{g,a,p1,p2,ai}}
const toFight=(g)=>{for(let i=0;i<200&&g.phase!=='fight';i++)g.step()};
const run=(g,n,a)=>{for(let i=0;i<n;i++){g.step();if(a)a.update()}};
// 1) Modus-Zyklus und Melee-Optionen
{const{a}=setup();assert.equal(a.mode,'arcade');a.cycleMode();assert.equal(a.mode,'versus');a.cycleMode();assert.equal(a.mode,'melee');a.cycleMode();assert.equal(a.mode,'arcade');
 assert.equal(a.toggleCpu(),false,'CPU/Stocks nur im Melee');a.setMode('melee');assert.ok(a.pvp);assert.equal(a.cpu,true,'Melee startet standardmäßig gegen die CPU');a.toggleCpu();assert.equal(a.cpu,false);a.toggleCpu();assert.equal(a.cpu,true);
 assert.equal(a.stocks,MELEE.stocks);const seen=new Set();for(let i=0;i<6;i++){a.cycleStocks();seen.add(a.stocks)}assert.ok([...seen].every(n=>n>=1&&n<=5)&&seen.size===5);ok('Modus: Arcade → 2 Spieler → Melee; CPU + Stocks nur im Melee')}
// 2) Start: Regeln gesetzt, offene Arena, danach Arcade wieder normal
{const{a,g,p1,p2}=setup();a.setMode('melee');a.stocks=3;a.startMelee('tiger','st3g0',0);assert.equal(a.mode,'melee');assert.ok(g.melee);toFight(g);
 assert.equal(p1.stocks,3);assert.equal(p2.stocks,3);assert.equal(p1.pct,0);assert.ok(g.arena.l<-1000&&g.arena.r>1000,'keine Wände');assert.equal(g.arena.sideAt(110),null);
 a.toSelect();a.setMode('arcade');a.start('tiger');assert.equal(g.melee,null,'Arcade ohne Melee-Regeln');assert.ok(g.arena.l>0&&g.arena.r<960,'Arcade: Wände wieder da');ok('Start: Stocks/% gesetzt, Arena offen; Arcade danach unverändert')}
// 3) Treffer = Prozent, kein HP-Verlust; Rückstoß wächst mit dem %
{const{a,g,p1,p2}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);p1.x=400;p2.x=470;p1.facing=1;p2.facing=-1;p1.startMove('5H',g);
 let guard=0;while(p2.pct===0&&guard++<60)g.step();assert.ok(p2.pct>0,'Prozent gestiegen');assert.equal(p2.hp,p2.maxHp,'HP bleibt voll');assert.ok(['hit','airhit'].includes(p2.state));
 const mv=p1.moves['5H'],k0=meleeKnockback(mv,10,2,1,null),k1=meleeKnockback(mv,100,2,1,null),k2=meleeKnockback(mv,200,2,1,null);assert.ok(k1.kb>k0.kb*1.5&&k2.kb>k1.kb,'mehr % = mehr Rückstoß');
 const l=meleeKnockback(p1.moves['2H'],50,2,1,p1.moves['2H'].launch);assert.ok(l.vy<-8,'Launcher schleudert nach oben');const sp=meleeKnockback(p1.moves.jH,50,2,1,null);assert.ok(sp.vy>0,'Luft-Hammer = Meteor nach unten');ok('Treffer: % statt HP, Rückstoß wächst mit %, Launcher hoch, Hammer = Meteor')}
// 4) Plattform: Kante runterlaufen = fallen; Blast-Zone = Stock weg; Respawn schwebend + unverwundbar; % zurück auf 0
{const{a,g,p1,p2}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);
 assert.ok(p1.grounded);p1.x=MELEE.pr+4;p1.pct=88;g.step();assert.ok(!p1.grounded,'über der Kante: kein Boden');let n=0;while(p1.y<GROUND+120&&n++<120)g.step();assert.ok(p1.y>GROUND+100&&p1.under,'fällt unter die Plattform');
 n=0;while(p1.stocks===3&&n++<200)g.step();assert.equal(p1.stocks,2,'Blast-Zone unten: Stock verloren');assert.ok(p1.dead>0&&p1.pct===0);
 run(g,MELEE.respawn+16+2);assert.equal(p1.dead,0);assert.ok(p1.hover>0&&p1.inv>0&&p1.invulnerable(),'Respawn: schwebt + unverwundbar');assert.ok(p1.y<GROUND-150);
 run(g,MELEE.hover+5);assert.ok(!p1.hover);run(g,120);assert.ok(p1.grounded&&p1.y===GROUND,'landet auf der Plattform');assert.equal(p1.stocks,2);ok('Plattform: Kante, Blast-Zone, Stock-Verlust, Respawn (schwebend, unverwundbar), % zurück')}
// 5) Von unten nicht auf die Plattform "landen"; von der Seite zurück springen geht
{const{a,g,p1}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);p1.x=MELEE.pr+30;p1.y=GROUND+60;p1.vy=2;p1.under=true;p1.state='air';run(g,4);assert.ok(!p1.grounded);
 p1.x=300;p1.y=GROUND+40;p1.vy=-8;p1.under=true;g.step();assert.ok(!p1.grounded,'unter der Plattform kein Boden');p1.y=GROUND-30;p1.vy=3;p1.under=false;run(g,30);assert.ok(p1.grounded,'von oben landen klappt');ok('Landen nur von oben (unterhalb: durchfliegen)')}
// 6) Letzter Stock: Spielende, Sieger, vsover, Revanche setzt alles zurück
{const{a,g,p1,p2}=setup();a.setMode('melee');a.stocks=1;a.startMelee('tiger','st3g0',1);toFight(g);p2.x=MELEE.x1+20;run(g,2,a);assert.equal(p2.stocks,0);assert.equal(g.phase,'ko');assert.equal(g.winner,p1);
 let n=0;while(a.state==='fight'&&n++<2000){g.step();a.update()}assert.equal(a.state,'vsover','Melee-Ende = Sieger-Bildschirm');assert.equal(p1.wins,ROUND.wins);assert.equal(p2.wins,0);
 a.confirm();assert.equal(a.state,'fight');assert.equal(g.melee.stocks,1);assert.equal(p1.stocks,1);assert.equal(p2.stocks,1);assert.equal(p2.dead,0);assert.equal(p1.wins+p2.wins,0);ok('Spielende: letzter Stock → Sieger → vsover → Revanche zurückgesetzt')}
// 7) Zeitlimit: mehr Stocks gewinnt, sonst weniger %
{const{a,g,p1,p2}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);p2.stocks=2;g.timeFrames=1;g.step();assert.equal(g.winner,p1);
 const t=setup();t.a.setMode('melee');t.a.startMelee('tiger','st3g0',0);toFight(t.g);t.p1.pct=80;t.p2.pct=40;t.g.timeFrames=1;t.g.step();assert.equal(t.g.winner,t.p2,'Gleichstand: weniger % gewinnt');ok('Zeitlimit: Stocks, dann %')}
// 8) Kamera: Plattform immer im Bild, Weitgeflogene begrenzt, Tote ignoriert
{const{a,g,p1,p2}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);run(g,60);const c=g.camera;assert.ok(c.zoom<=1&&c.zoom>=.65);assert.ok(c.x>300&&c.x<660);
 p1.x=MELEE.x1-10;p1.y=GROUND+250;run(g,5);const z0=c.zoom;assert.ok(z0<=1&&z0>=.65,'Zoom bleibt in den Grenzen');p1.dead=50;run(g,200);assert.ok(c.zoom>.8,'Kamera ignoriert den Toten');ok('Kamera: Plattform im Bild, Zoom begrenzt, Tote ignoriert')}
// 9) KI findet zurück: unter der Kante gestartet, steht nach einiger Zeit wieder auf der Plattform
{let back=0;for(let t=0;t<10;t++){const{a,g,p1,p2,ai}=setup();p2.input=ai;ai.setLevel(1);a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);
  p2.x=MELEE.pr+60;p2.y=GROUND+30;p2.vy=0;p2.vx=0;p2.state='air';p2.under=true;p2.airJumps=1;p2.airDashes=1;p1.x=300;
  let ok2=false;for(let i=0;i<300&&!ok2;i++){g.step();if(p2.stocks<3)break;if(p2.grounded)ok2=true}if(ok2)back++}
 assert.ok(back>=7,'KI kommt in den meisten Fällen zurück ('+back+'/10)');ok('KI: kommt von außerhalb zurück auf die Plattform ('+back+'/10)')}
// 10) Killwerte: aus der Plattformmitte wird mit schweren Treffern irgendwo zwischen ~60 % und ~220 % gekillt (nicht sofort, nicht nie)
{const kb=(pct,mv)=>meleeKnockback(mv,pct,2,1,null);const{p1}=setup();const mv=p1.moves['5H'];let killAt=null;
 for(let pct=0;pct<=300&&killAt===null;pct+=5){const{a,g,p1:x,p2:y}=setup();a.setMode('melee');a.startMelee('tiger','st3g0',0);toFight(g);y.x=480;y.pct=pct;x.x=420;x.facing=1;y.facing=-1;y.state='idle';x.startMove('5H',g);
  for(let i=0;i<260;i++){g.step();if(y.stocks<3){killAt=pct;break}}}
 console.log('    Kill-Prozent 5H aus der Mitte ≈',killAt);assert.ok(killAt!==null&&killAt>=60&&killAt<=240,'Kill-% plausibel (war '+killAt+')');ok('Balance: 5H killt aus der Mitte bei ≈ '+killAt+' %')}
console.log('Melee-Tests bestanden');
