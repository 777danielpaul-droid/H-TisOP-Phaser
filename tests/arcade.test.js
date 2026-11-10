// Arcade-Ablauf: Gegner-Reihenfolge, Stages, Game Over/Retry. node tests/arcade.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS,ROSTER}from'../src/core/characters.js';
import{ROUND}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(){const i1=new InputBuffer(),ai=new AIController(0);
 const p1=new Fighter({char:CHARACTERS.st3g0,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2),a=new Arcade(g,p1,p2,ai);return{g,a,p1,p2,i1,ai}}
const winMatch=(g,p1)=>{p1.wins=ROUND.wins;g.phase='match';g.pf=70};
// Leiter mit mehreren Stages von Hand setzen (die echte Leiter hat bei 2 Figuren nur 1 Gegner) -> prüft den Stage-Ablauf trotzdem
const ladder=(a,player,ids)=>{a.start(player);a.opponents=ids;a.stage=0;a.beginStage()};
// 1) Leiter: alle anderen spielbaren Figuren genau einmal, nie die eigene Figur
for(const id of ROSTER){const l=Arcade.ladderFor(id);assert.equal(l.length,ROSTER.length-1,'alle anderen Kämpfer');assert.ok(!l.includes(id),'nicht gegen sich selbst');
 assert.deepEqual([...l].sort(),ROSTER.filter(x=>x!==id).sort(),'jeder andere Kämpfer genau einmal')}
ok('Leiter: '+ROSTER.length+' spielbare Figuren, jeder kämpft gegen alle anderen');
// 2) Echter Durchlauf: Gegner, Arena, Schwierigkeit, Sieg -> Charakterwahl
for(const pid of ROSTER){const{g,a,p1,p2,ai}=setup();assert.equal(a.state,'select');a.difficulty=1;a.start(pid);
 const N=a.total,seq=[];for(let s=0;s<N;s++){assert.equal(a.state,'fight');assert.equal(a.stage,s);seq.push(p2.char.id);
  assert.equal(g.stageIndex,s%a.stageCount,'Arenen der Reihe nach');assert.equal(p2.hp,p2.maxHp,'volle HP je Stage');assert.equal(g.round,1);assert.equal(p1.wins,0);
  assert.equal(ai.level,1,'Schwierigkeit wie gewählt');winMatch(g,p1);a.update();
  if(s<N-1){assert.equal(a.state,'clear');a.confirm()}else assert.equal(a.state,'victory')}
 assert.deepEqual(seq,[...Arcade.ladderFor(pid)]);a.confirm();assert.equal(a.state,'select');ok('Durchlauf '+pid+': '+seq.join(' → ')+' → Sieg → Charakterwahl')}
// 3) Mehrere Stages: Arena-Wechsel (auch mehr Gegner als Arenen), STAGE CLEAR, automatisches Weiter
{const{g,a,p1,p2}=setup();ladder(a,'tiger',['st3g0','wolf','st3g0','wolf','st3g0']);
 for(let s=0;s<5;s++){assert.equal(a.stage,s);assert.equal(g.stageIndex,s%a.stageCount);assert.equal(p2.char.id,s%2?'wolf':'st3g0');winMatch(g,p1);a.update();
  if(s<4){assert.equal(a.state,'clear');if(s===1){for(let i=0;i<260;i++)a.update();assert.equal(a.stage,2);assert.equal(a.state,'fight','geht automatisch weiter')}else a.confirm()}else assert.equal(a.state,'victory')}
 ok('Mehrere Stages: Arenen wiederholen sich, STAGE CLEAR geht automatisch weiter')}
// 4) Game Over: Enter = nochmal gegen denselben Gegner, Esc-Pfad = Auswahl
{const{g,a,p1,p2}=setup();a.start('tiger');const opp=p2.char.id;g.phase='match';g.pf=70;p2.wins=ROUND.wins;p1.wins=0;a.update();assert.equal(a.state,'gameover');
 a.confirm();assert.equal(a.state,'fight');assert.equal(a.stage,0);assert.equal(p2.char.id,opp);assert.equal(p1.wins,0);assert.equal(p2.wins,0);
 g.phase='match';g.pf=70;p2.wins=ROUND.wins;a.update();assert.equal(a.state,'gameover');a.toSelect();assert.equal(a.state,'select');ok('Game Over → nochmal / Auswahl')}
// 5) Echte Runde: 2 Runden-Siege nötig (Best of 3); letzter Gegner besiegt = Sieg
{const{g,a,p1,p2,i1}=setup();a.start('st3g0');let rounds=0;
 for(let r=0;r<2;r++){let n=0;while(g.phase!=='fight'&&n++<400){i1.feed(0,0,[]);g.step()}p2.x=p1.x+70;p2.hp=5;p2.input.tick=()=>{};
  n=0;while(g.phase==='fight'&&n++<200){i1.feed(0,0,n%12===1?['L']:[],g.hitstop>0);g.step()}
  n=0;while((g.phase==='ko'||g.phase==='result')&&n++<600){i1.feed(0,0,[]);g.step()}rounds++;if(r===0)assert.equal(g.phase,'intro','nach 1 Sieg geht es in Runde 2')}
 assert.equal(p1.wins,2);for(let i=0;i<10;i++){i1.feed(0,0,[]);g.step()}assert.equal(g.phase,'match');
 for(let i=0;i<80;i++){i1.feed(0,0,[]);g.step();a.update()}assert.equal(a.state,a.total>1?'clear':'victory');ok('2 Runden-Siege = Stage geschafft (bei letztem Gegner: Sieg, sonst STAGE CLEAR)')}
console.log('Arcade-Tests bestanden');
