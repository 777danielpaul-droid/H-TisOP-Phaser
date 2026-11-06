// KI-Stufen: gegen einen passiven Spieler gemessen, Schaden pro Level muss deutlich steigen. node tests/ai.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController,AI_LEVELS}from'../src/core/ai.js';
import{CHARACTERS}from'../src/core/characters.js';
function trial(level,frames=3000){const i1=new InputBuffer(),ai=new AIController(level);
 const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.wolf,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);let dmg=0,hits=0;
 for(let k=0;k<frames;k++){const hp=p1.hp;i1.feed(0,0,[]);g.step();if(g.phase==='fight'){if(p1.hp<hp){dmg+=hp-p1.hp;hits++}p1.hp=p1.maxHp;p2.hp=p2.maxHp}}
 return{dmg,hits}}
const avg=l=>{let d=0,h=0;const N=8;for(let i=0;i<N;i++){const t=trial(l);d+=t.dmg;h+=t.hits}return{dmg:d/N,hits:h/N}};
const r=AI_LEVELS.map((_,l)=>avg(l));
r.forEach((x,l)=>console.log(`  ${AI_LEVELS[l].name.padEnd(7)} Ø Schaden ${x.dmg.toFixed(0)} in ${x.hits.toFixed(1)} Treffern (3000 Frames, passiver Gegner)`));
assert.ok(r[0].dmg<r[1].dmg&&r[1].dmg<r[2].dmg,'Schaden steigt mit der Stufe');
assert.ok(r[0].dmg<r[2].dmg*.45,'Leicht < 45 % von Hart ('+(r[0].dmg/r[2].dmg*100).toFixed(0)+' %)');
const a=new AIController(0);a.setLevel(2);assert.equal(a.P.name,'HART');a.setLevel(99);assert.equal(a.level,2);a.setLevel(-3);assert.equal(a.level,0);
// Ecken-Taktik: Passiver Gegner steht an der Wand -> KI (HART) macht mit corner > 0 mehr Schaden / bricht die Wand schneller als mit corner = 0
function pin(corner,frames=2400){const i1=new InputBuffer(),ai=new AIController(2);ai.P={...ai.P,corner};
 const p1=new Fighter({char:CHARACTERS.tiger,x:800,facing:-1,input:i1}),p2=new Fighter({char:CHARACTERS.hero,x:600,facing:1,input:ai});
 const g=new Game(p1,p2);let dmg=0,breaks=0;
 for(let k=0;k<frames;k++){const hp=p1.hp;i1.feed(0,0,[]);g.step();if(g.phase==='fight'){if(p1.hp<hp)dmg+=hp-p1.hp;p1.hp=p1.maxHp;p2.hp=p2.maxHp;
   if(['idle','hit','knockdown','wakeup'].includes(p1.state)&&p1.grounded)p1.x=Math.min(p1.x,g.arena.r); // Gegner bleibt an der rechten Wand
   if(g.arena.R.step>0){breaks++;g.arena.reset();p1.x=g.arena.r}}}
 return{dmg,breaks}}
const pv=c=>{let d=0,b=0;const N=10;for(let n=0;n<N;n++){const t=pin(c);d+=t.dmg;b+=t.breaks}return{dmg:d/N,breaks:b/N}};
const c0=pv(0),c1=pv(.85);console.log(`  Ecke: ohne Taktik Ø ${c0.dmg.toFixed(0)} Schaden / ${c0.breaks.toFixed(1)} Wandbrüche, mit Taktik Ø ${c1.dmg.toFixed(0)} / ${c1.breaks.toFixed(1)}`);
assert.ok(c1.dmg>c0.dmg*1.05,'Ecken-Taktik macht mehr Schaden am Gegner in der Ecke');
assert.ok(AI_LEVELS[0].corner<AI_LEVELS[1].corner&&AI_LEVELS[1].corner<AI_LEVELS[2].corner,'corner steigt mit der Stufe');
console.log('KI-Tests bestanden');
