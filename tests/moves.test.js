// Tests der figurenspezifischen Movesets: node tests/moves.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{CHARACTERS,ROSTER,BOSS}from'../src/core/characters.js';
import{charMoves}from'../src/core/moves.js';
import{GROUND}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(a,b,gap=80){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS[a],x:400,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS[b],x:400+gap,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const t=(dx=0,dy=0,pr=[],n=1,dx2=0,dy2=0,pr2=[])=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,k===0?pr:[],fz);i2.feed(dx2,dy2,k===0?pr2:[],fz);g.step()}};
 return{g,p1,p2,t}}
const run=(t,n)=>t(0,0,[],n);

// 1) Jede Figur hat Labels für alle Moves; Figuren unterscheiden sich wirklich
{const sig={};for(const id of[...ROSTER,BOSS]){const L=charMoves(CHARACTERS[id]);assert.ok(L.length>=13,id);for(const m of L)assert.ok(m[0],id+' ohne Label');sig[id]=L.map(m=>m[0]).join('|')}
 const uniq=new Set(Object.values(sig));assert.equal(uniq.size,ROSTER.length+1,'alle Movesets verschieden');
 const spec=id=>['fireball','rising','rush','back','airsp','6M','6H'].map(k=>CHARACTERS[id].mods[k]&&CHARACTERS[id].mods[k].label).join();
 for(const a of[...ROSTER,BOSS])for(const b of[...ROSTER,BOSS])if(a<b)assert.notEqual(spec(a),spec(b));ok((ROSTER.length+1)+' verschiedene Movesets')}

// 2) Griff (Palm 6M): unblockbar, trifft Blockenden; Fehlschlag auf Distanz
{const{p2,t}=setup('palm','tiger',60);t(1,0,['M']);run(t,20);t(1,0,['M'],1,-1,0);for(let k=0;k<25;k++)t(0,0,[],1,-1,0);
 assert.ok(p2.hp<CHARACTERS.tiger.hp,'Griff trifft trotz Block');
 const s2=setup('palm','tiger',260);s2.t(1,0,['M']);run(s2.t,40);assert.equal(s2.p2.hp,CHARACTERS.tiger.hp);ok('Griff: unblockbar, Fehlschlag auf Distanz')}

// 3) Rüstung (Palm Eisenpalme / Mino Stier): Treffer ohne Hitstun, Move läuft weiter
{const q=setup('mino','hero',100);q.p1.state='idle';q.t(0,1,['S']);
 for(let k=0;k<6;k++)q.t();assert.equal(q.p1.moveName,'rush','Stier-Rammen gestartet');
 const hp=q.p1.hp;q.p2.move=null;q.g.projectiles.length=0;
 // direkter Treffer in Rüstungsphase
 q.p1.mf=6;const mv={dmg:50,hs:20,bs:10,pb:3,pbb:4,hstop:5,lv:'mid',launch:null,hard:false,multi:0};
 q.g.p2.state='attack';q.g.p2.move={...q.g.p2.moves['5L'],box:[0,-150,300,200]};q.g.p2.mf=q.g.p2.move.su;q.g.p2.hitDone=false;q.g.p2.facing=-1;
 q.t();assert.equal(q.p1.state,'attack','Rüstung: kein Hitstun');assert.ok(q.p1.hp<hp,'Rüstung: Schaden wird genommen');ok('Rüstung steckt Treffer ein')}

// 4) Teleport: Tiger Hinterhalt landet hinter dem Gegner und dreht sich um; Witch Blink geht nach hinten
{const{p1,p2,t}=setup('tiger','hero',200);t(-1,0,['S']);run(t,16);assert.ok(p1.x>p2.x,'Tiger hinter Gegner');assert.equal(p1.facing,-1,'Tiger schaut zurück zum Gegner');
 const w=setup('witch','hero',100);const x0=w.p1.x;w.t(-1,0,['S']);run(w.t,14);assert.ok(w.p1.x<x0-30,'Blink nach hinten');ok('Teleport (Hinterhalt, Blink)')}

// 5) Sturzflug (Luft-Special), Heilung/Meter (Palm Qi), Bogen-Projektile (Witch), Falle (max 1)
{const{p1,t}=setup('hero','tiger',250);t(0,-1,[],1);run(t,12);assert.ok(p1.y<GROUND-60);t(0,0,['S']);for(let k=0;k<40&&p1.y<GROUND;k++)t();assert.ok(p1.moveName==='airsp'||p1.state!=='air','Sturzkick ausgeführt');ok('Sturzflug')}
{const{p1,t}=setup('palm','tiger',300);p1.hp=500;t(-1,0,['S']);run(t,14);assert.ok(p1.hp>=525,'Qi heilt');assert.ok(p1.meter>=35,'Qi lädt Meter');ok('Qi sammeln heilt + lädt Meter')}
{const{g,t}=setup('witch','hero',300);t(0,1,['S']);run(t,22);assert.ok(g.projectiles.length>=3,'3 Funken');
 const y0=g.projectiles[0].y;run(t,10);assert.ok(g.projectiles.length===0||g.projectiles[0].y!==y0,'Bogenflug');ok('Funkenregen: 3 Bogen-Projektile')}
{const{g,p1,t}=setup('witch','hero',300);t(1,0,['H']);run(t,24);t(1,0,['H']);run(t,30);t(0,0,[],1);
 assert.equal(g.projectiles.filter(p=>p.def.uniq==='mine').length,1,'max. 1 Falle');ok('Zauber-Falle: max. 1')}
{const{g,p2,t}=setup('palm','hero',200);t(0,1,[],1);t(1,1,[],1);t(1,0,['L'],1);run(t,60);assert.ok(p2.hp<CHARACTERS.hero.hp||g.projectiles.length>0,'Palmwelle');ok('Palmwelle (durchdringend)')}

// 6) Werte: Sorceress 2 Luftsprünge, Minotaurus 0; Tiger schneller Dash
{const w=setup('witch','hero',300);w.t(0,-1,[],1);assert.equal(w.p1.airJumps,2);const m=setup('mino','hero',300);m.t(0,-1,[],1);assert.equal(m.p1.airJumps,0);
 const a=setup('tiger','hero',300),b=setup('palm','hero',300);a.t(1,0,['DASH'],8);b.t(1,0,['DASH'],8);assert.ok(a.p1.x-400>b.p1.x-400,'Tiger dasht weiter');ok('Charakterwerte (Sprünge, Dash)')}
{// Schaden: Witch (def 1.12) nimmt mehr als Mino (0.85)
 const dmgTo=id=>{const s=setup('hero',id,70);s.t(0,0,['L'],1);run(s.t,12);return CHARACTERS[id].hp-s.p2.hp};assert.ok(dmgTo('witch')>dmgTo('mino'),'Abwehr-Werte wirken');ok('Abwehr: Zerbrechliche nehmen mehr Schaden')}

// 7) Crash-/Vollständigkeitstest: KI vs KI, alle Paarungen, alle Moves werden irgendwann benutzt
{const used={};
 for(const a of[...ROSTER,BOSS])for(const b of[...ROSTER,BOSS]){if(a===b)continue;const A=new AIController(2),B=new AIController(2);
  const p1=new Fighter({char:CHARACTERS[a],x:340,facing:1,input:A}),p2=new Fighter({char:CHARACTERS[b],x:620,facing:-1,input:B});const g=new Game(p1,p2);
  for(let f=0;f<9000;f++){g.step();for(const p of[p1,p2])if(p.state==='attack')(used[p.char.id]||(used[p.char.id]=new Set())).add(p.moveName);
   if(g.phase==='match'){g.rematch()}
   for(const p of[p1,p2]){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.hp),'NaN '+a+' vs '+b)}}}
 for(const id of[...ROSTER,BOSS]){const miss=['back','6M','6H','fireball','rising','rush','airsp'].filter(k=>!used[id].has(k));assert.equal(miss.length,0,id+' nutzt nie: '+miss.join(','))}
 ok('KI vs KI: alle Paarungen stabil, KI nutzt alle Spezialmoves')}
console.log('Move-Tests bestanden');
