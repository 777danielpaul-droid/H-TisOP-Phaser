// Tests der figurenspezifischen Movesets: node tests/moves.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{CHARACTERS,ROSTER}from'../src/core/characters.js';
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
{const sig={};for(const id of ROSTER){const L=charMoves(CHARACTERS[id]);assert.ok(L.length>=13,id);for(const m of L)assert.ok(m[0],id+' ohne Label');sig[id]=L.map(m=>m[0]).join('|')}
 const uniq=new Set(Object.values(sig));assert.equal(uniq.size,ROSTER.length,'alle Movesets verschieden');
 const spec=id=>['fireball','rising','rush','back','airsp','6M','6H'].map(k=>CHARACTERS[id].mods[k]&&CHARACTERS[id].mods[k].label).join();
 for(const a of ROSTER)for(const b of ROSTER)if(a<b)assert.notEqual(spec(a),spec(b));ok(ROSTER.length+' verschiedene Movesets')}

// 2) Rüstung (ST3-G0 Panzer-Sprint): Treffer ohne Hitstun, Move läuft weiter
{const q=setup('st3g0','tiger',100);q.p1.state='idle';q.t(0,1,['S']);
 for(let k=0;k<6;k++)q.t();assert.equal(q.p1.moveName,'rush','Panzer-Sprint gestartet');
 const hp=q.p1.hp;q.p2.move=null;q.g.projectiles.length=0;
 // direkter Treffer in Rüstungsphase
 q.p1.mf=6;const mv={dmg:50,hs:20,bs:10,pb:3,pbb:4,hstop:5,lv:'mid',launch:null,hard:false,multi:0};
 q.g.p2.state='attack';q.g.p2.move={...q.g.p2.moves['5L'],box:[0,-150,300,200]};q.g.p2.mf=q.g.p2.move.su;q.g.p2.hitDone=false;q.g.p2.facing=-1;
 q.t();assert.equal(q.p1.state,'attack','Rüstung: kein Hitstun');assert.ok(q.p1.hp<hp,'Rüstung: Schaden wird genommen');ok('Rüstung steckt Treffer ein')}

// 3) Teleport: Tiger Hinterhalt landet hinter dem Gegner und dreht sich um
{const{p1,p2,t}=setup('tiger','st3g0',200);t(-1,0,['S']);run(t,16);assert.ok(p1.x>p2.x,'Tiger hinter Gegner');assert.equal(p1.facing,-1,'Tiger schaut zurück zum Gegner');ok('Teleport (Hinterhalt)')}

// 4) Sturzflug (Luft-Special) und Feuer-Atem (Projektil)
for(const id of ROSTER){const{p1,t}=setup(id,id==='tiger'?'st3g0':'tiger',250);t(0,-1,[],1);run(t,12);assert.ok(p1.y<GROUND-60);t(0,0,['S']);for(let k=0;k<40&&p1.y<GROUND;k++)t();assert.ok(p1.moveName==='airsp'||p1.state!=='air','Sturzkick ausgeführt '+id)}
ok('Sturzflug (beide Figuren)')
{const{g,p2,t}=setup('st3g0','tiger',200);t(0,1,[],1);t(1,1,[],1);t(1,0,['L'],1);run(t,60);assert.ok(p2.hp<CHARACTERS.tiger.hp||g.projectiles.length>0,'Feuer-Atem');ok('Feuer-Atem (Projektil)')}

// 5) Werte: beide 1 Luftsprung; Tiger schneller Dash
{const w=setup('tiger','st3g0',300);w.t(0,-1,[],1);assert.equal(w.p1.airJumps,1);const m=setup('st3g0','tiger',300);m.t(0,-1,[],1);assert.equal(m.p1.airJumps,1);
 const a=setup('tiger','st3g0',300),b=setup('st3g0','tiger',300);a.t(1,0,['DASH'],8);b.t(1,0,['DASH'],8);assert.ok(a.p1.x-400>b.p1.x-400,'Tiger dasht weiter');ok('Charakterwerte (Sprünge, Dash)')}
{// Schaden: Tiger (def 1.05) nimmt mehr als ST3-G0 (0.95)
 const dmgTo=id=>{const s=setup('wolf',id,70);s.t(0,0,['L'],1);run(s.t,12);return CHARACTERS[id].hp-s.p2.hp};assert.ok(dmgTo('tiger')>dmgTo('st3g0'),'Abwehr-Werte wirken');ok('Abwehr: Zerbrechliche nehmen mehr Schaden')}

// 6) Crash-/Vollständigkeitstest: KI vs KI, alle Paarungen, alle Moves werden irgendwann benutzt
{const used={};
 for(const a of ROSTER)for(const b of ROSTER){if(a===b)continue;const A=new AIController(2),B=new AIController(2);
  const p1=new Fighter({char:CHARACTERS[a],x:340,facing:1,input:A}),p2=new Fighter({char:CHARACTERS[b],x:620,facing:-1,input:B});const g=new Game(p1,p2);
  for(let f=0;f<9000;f++){g.step();for(const p of[p1,p2])if(p.state==='attack')(used[p.char.id]||(used[p.char.id]=new Set())).add(p.moveName);
   if(g.phase==='match'){g.rematch()}
   for(const p of[p1,p2]){assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.hp),'NaN '+a+' vs '+b)}}}
 for(const id of ROSTER){const miss=['back','6M','6H','fireball','rising','rush','airsp'].filter(k=>!used[id].has(k));assert.equal(miss.length,0,id+' nutzt nie: '+miss.join(','))}
 ok('KI vs KI: alle Paarungen stabil, KI nutzt alle Spezialmoves')}
console.log('Move-Tests bestanden');
