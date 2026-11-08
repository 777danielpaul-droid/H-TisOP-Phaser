// Arcade-Ablauf: Gegner-Reihenfolge, Stages, Game Over/Retry, Endgegner. node tests/arcade.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS,ROSTER,BOSS}from'../src/core/characters.js';
import{ROUND}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(){const i1=new InputBuffer(),ai=new AIController(0);
 const p1=new Fighter({char:CHARACTERS.hero,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2),a=new Arcade(g,p1,p2,ai);return{g,a,p1,p2,i1,ai}}
const winMatch=(g,p1)=>{p1.wins=ROUND.wins;g.phase='match';g.pf=70};
// 1) Leiter: alle anderen spielbaren Figuren, Endgegner zuletzt, nie die eigene Figur, Boss nicht spielbar
for(const id of ROSTER){const l=Arcade.ladderFor(id);assert.equal(l.length,ROSTER.length,'3 Gegner + Boss');assert.equal(l[l.length-1],BOSS,'Boss zuletzt');assert.ok(!l.includes(id),'nicht gegen sich selbst');
 assert.deepEqual([...l.slice(0,-1)].sort(),ROSTER.filter(x=>x!==id).sort(),'jeder andere Kämpfer genau einmal')}
assert.ok(!ROSTER.includes(BOSS),'Minotaurus nicht spielbar');assert.ok(CHARACTERS[BOSS].boss);ok('Leiter: '+ROSTER.length+' spielbare Figuren, Boss zuletzt, nie die eigene Figur');
// 2) Ganzer Durchlauf: alle Gegner + Boss, Gegnerwechsel, Stage-Index, Boss-Härte
{const{g,a,p1,p2,ai}=setup();assert.equal(a.state,'select');a.difficulty=1;a.start('hero');
 const N=a.total,seq=[];for(let s=0;s<N;s++){assert.equal(a.state,'fight');assert.equal(a.stage,s);seq.push(p2.char.id);const boss=s===N-1;
  assert.equal(g.stageIndex,boss?a.stageCount-1:s%(a.stageCount-1),'Arena: Boss immer in der letzten, sonst der Reihe nach');
  assert.equal(p2.hp,p2.maxHp,'volle HP je Stage');assert.equal(g.round,1);assert.equal(p1.wins,0);
  assert.equal(ai.level,Math.min(2,1+(boss?1:0)),'Boss eine Stufe härter');
  winMatch(g,p1);a.update();
  if(!boss){assert.equal(a.state,'clear');a.confirm()}else assert.equal(a.state,'victory')}
 assert.deepEqual(seq,[...Arcade.ladderFor('hero')]);assert.equal(seq[N-1],'mino');a.confirm();assert.equal(a.state,'select');ok('Durchlauf '+seq.join(' → ')+' → Sieg → Charakterwahl')}
// 3) Automatisches Weiter nach STAGE CLEAR
{const{g,a,p1}=setup();a.start('witch');winMatch(g,p1);a.update();assert.equal(a.state,'clear');for(let i=0;i<260;i++)a.update();assert.equal(a.stage,1);assert.equal(a.state,'fight');ok('STAGE CLEAR geht automatisch weiter')}
// 4) Game Over: Enter = nochmal gegen denselben Gegner, Esc-Pfad = Auswahl
{const{g,a,p1,p2}=setup();a.start('palm');const opp=p2.char.id;g.phase='match';g.pf=70;p2.wins=ROUND.wins;p1.wins=0;a.update();assert.equal(a.state,'gameover');
 a.confirm();assert.equal(a.state,'fight');assert.equal(a.stage,0);assert.equal(p2.char.id,opp);assert.equal(p1.wins,0);assert.equal(p2.wins,0);
 g.phase='match';g.pf=70;p2.wins=ROUND.wins;a.update();assert.equal(a.state,'gameover');a.toSelect();assert.equal(a.state,'select');ok('Game Over → nochmal / Auswahl')}
// 5) Echte Runde: 2 Runden-Siege nötig (Best of 3)
{const{g,a,p1,p2,i1}=setup();a.start('hero');let rounds=0;
 for(let r=0;r<2;r++){let n=0;while(g.phase!=='fight'&&n++<400){i1.feed(0,0,[]);g.step()}p2.x=p1.x+70;p2.hp=5;p2.input.tick=()=>{};
  n=0;while(g.phase==='fight'&&n++<200){i1.feed(0,0,n%12===1?['L']:[],g.hitstop>0);g.step()}
  n=0;while((g.phase==='ko'||g.phase==='result')&&n++<600){i1.feed(0,0,[]);g.step()}rounds++;if(r===0)assert.equal(g.phase,'intro','nach 1 Sieg geht es in Runde 2')}
 assert.equal(p1.wins,2);for(let i=0;i<10;i++){i1.feed(0,0,[]);g.step()}assert.equal(g.phase,'match');
 for(let i=0;i<80;i++){i1.feed(0,0,[]);g.step();a.update()}assert.equal(a.state,'clear');ok('2 Runden-Siege = Stage geschafft')}
// 6) Boss: größer, härter
{const b=CHARACTERS[BOSS];assert.ok(b.size>1&&b.hp>1200&&b.dmg>1.1);ok('Boss: Größe '+b.size+'×, HP '+b.hp+', Schaden '+Math.round(b.dmg*100)+' %')}
console.log('Arcade-Tests bestanden');
