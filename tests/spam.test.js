// Spam-Sperre: node tests/spam.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{CHARACTERS}from'../src/core/characters.js';
import{SPAM}from'../src/core/config.js';
function setup(gap=400){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS.tiger,x:200,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.wolf,x:200+gap,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const t=(pr=[],n=1)=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(0,0,k===0?pr:[],fz);i2.feed(0,0,[],fz);g.step()}};
 return{g,p1,p2,t}}
const ok=n=>console.log('  ✓',n);
// Zählt, wie oft eine Taste bei Dauerdrücken tatsächlich einen Angriff startet
// 1) Dieselbe Taste: nur 3 Starts, danach gesperrt (egal wie schnell gedrückt wird)
for(const b of['L','M','H']){const{p1,t}=setup();let starts=0,prev=false;
 for(let k=0;k<80;k++){t([b]);const a=p1.state==='attack'&&p1.mf<=1&&!prev;if(a)starts++;prev=p1.state==='attack'&&p1.mf<=1}
 assert.equal(p1.spam.n,SPAM.max,b+': Zähler bei '+SPAM.max);assert.ok(p1.spamLocked(b),b+' gesperrt')}
ok('Taste L/M/H: nach '+SPAM.max+' Einsätzen in Folge gesperrt');
// 2) Gesperrte Taste startet nichts mehr; eine andere Taste geht und gibt die erste wieder frei
{const{p1,t}=setup();for(let k=0;k<70;k++)t(['L']);while(p1.state==='attack')t();assert.ok(p1.spamLocked('L'));
 t(['L']);assert.notEqual(p1.state,'attack','4. L wird ignoriert');
 t(['M']);assert.equal(p1.state,'attack','M funktioniert');assert.equal(p1.spam.btn,'M');assert.ok(!p1.spamLocked('L'),'L wieder frei nach M');
 ok('andere Taste startet und entsperrt')}
// 3) Pause: nach SPAM.reset Frames ohne Einsatz ist die Taste wieder frei
{const{p1,t}=setup();for(let k=0;k<70;k++)t(['L']);while(p1.state==='attack')t();assert.ok(p1.spamLocked('L'));t([],SPAM.reset+2);assert.ok(!p1.spamLocked('L'),'nach Pause frei');t(['L']);assert.equal(p1.state,'attack','5L wieder möglich');assert.equal(p1.spam.n,1);ok('Pause von '+SPAM.reset+' Frames entsperrt')}
// 4) Hyper ist ausgenommen; neue Runde setzt den Zähler zurück
{const{p1,t}=setup();for(let k=0;k<70;k++)t(['L']);p1.noteSpam('SUP');assert.ok(!p1.spamLocked('SUP'));p1.reset();assert.equal(p1.spam.n,0);assert.ok(!p1.spamLocked('L'));ok('Hyper ausgenommen, Reset pro Runde')}
console.log('Spam-Tests bestanden');
