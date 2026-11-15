// Pop-up / Feder-Effekt: node tests/pop.test.js
import assert from'node:assert/strict';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{CHARACTERS}from'../src/core/characters.js';
import{GROUND,BOUNCE}from'../src/core/config.js';
function setup(gap=70,char='tiger'){const i1=new InputBuffer(),i2=new InputBuffer();
 const p1=new Fighter({char:CHARACTERS[char],x:400,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.wolf,x:400+gap,facing:-1,input:i2});
 const g=new Game(p1,p2);while(g.phase!=='fight'){i1.feed(0,0,[]);i2.feed(0,0,[]);g.step()}
 const t=(dx=0,dy=0,pr=[],n=1)=>{for(let k=0;k<n;k++){const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,k===0?pr:[],fz);i2.feed(0,0,[],fz);g.step()}};
 return{g,p1,p2,t}}
const ok=n=>console.log('  ✓',n);
const hitWait=(p1,t)=>{let n=0;while(!p1.contact&&n++<40)t();assert.ok(p1.contact,'Kontakt '+p1.moveName)};
// 1) Jeder normale Bodentreffer hebt den Gegner an (leicht < mittel < schwer), ohne Knockdown
{const hs={};for(const[b,dy,name]of[['L',0,'5L'],['M',0,'5M'],['H',0,'5H']]){const{p1,p2,t}=setup(70);t(0,dy,[b],1);hitWait(p1,t);
  assert.equal(p2.state,'airhit','Pop-up bei '+name);assert.ok(p2.pop,'pop-Flag');assert.equal(p2.launched,false,'kein Launcher');
  let top=0;for(let k=0;k<60;k++){t();top=Math.max(top,GROUND-p2.y)}hs[name]=top;
  assert.ok(top>8,name+' hebt ab ('+top.toFixed(0)+' px)');assert.notEqual(p2.state,'knockdown','kein Knockdown nach '+name)}
 assert.ok(hs['5L']<hs['5H']&&hs['5M']<hs['5H'],'Schwer federt am höchsten');
 ok('Bodentreffer federn: L '+hs['5L'].toFixed(0)+' px, M '+hs['5M'].toFixed(0)+' px, H '+hs['5H'].toFixed(0)+' px')}
// 2) Weiche Landung: kurze Erholung (hit) statt Knockdown, Pop-Flag weg
{const{p1,p2,t}=setup(70);t(0,0,['L'],1);hitWait(p1,t);let n=0;while(p2.y<GROUND&&n++<5)t();while(p2.state==='airhit'&&n++<80)t();
 assert.equal(p2.state,'hit','weiche Landung');assert.equal(p2.pop,false);for(let k=0;k<BOUNCE.land+3;k++)t();assert.ok(['idle','crouch'].includes(p2.state)||p2.state==='walk','wieder handlungsfähig: '+p2.state);ok('Weiche Landung statt Knockdown')}
// 3) Jump-Cancel eines normalen Treffers -> Luft-Combo hinterher (MvC2-Stil)
{const{p1,p2,t}=setup(70);t(0,0,['H'],1);hitWait(p1,t);const h0=p2.comboHits;t(0,-1,[],1);let n=0;while(p1.state!=='air'&&n++<25)t();assert.equal(p1.state,'air','Jump-Cancel nach 5H');
 n=0;while(GROUND-p1.y<GROUND-p2.y-20&&n++<20)t(1,0,[]);t(1,0,['L'],1);n=0;while(p2.comboHits===h0&&n++<40)t(1,0,[]);assert.ok(p2.comboHits>h0,'Luft-Treffer nach dem Hinterherspringen');
 t(0,0,['M'],1);n=0;while(p1.moveName!=='jM'&&n++<20)t(1,0,[]);n=0;const h1=p2.comboHits;while(p2.comboHits===h1&&n++<40)t(1,0,[]);assert.ok(p2.comboHits>=h0+2,'zweiter Luft-Treffer '+p2.comboHits);ok('5H -> Jump-Cancel -> Luft-Combo ('+p2.comboHits+' Treffer)')}
// 4) Tiefschläge treffen den gefederten Gegner weiter (Magic-Series-Kette bleibt)
{const{p1,p2,t}=setup(70);t(0,0,['L'],1);hitWait(p1,t);t(0,1,['L'],1);let n=0;while(p1.moveName!=='2L'&&n++<30)t(0,1);hitWait(p1,t);assert.ok(p2.comboHits>=2,'2L trifft den Pop');ok('Tiefschlag trifft gefederten Gegner')}
// 5) Kein Hochschaukeln: lange Kette lässt den Gegner nicht aus dem Bild steigen
{const{p1,p2,t}=setup(70);let top=0;t(0,0,['L'],1);hitWait(p1,t);top=Math.max(top,GROUND-p2.y);
 for(const[b,dy,nm]of[['L',1,'2L'],['M',0,'5M'],['M',1,'2M'],['H',0,'5H']]){t(0,dy,[b],1);let n=0;while(p1.moveName!==nm&&n++<30)t(0,dy);hitWait(p1,t);top=Math.max(top,GROUND-p2.y)}
 assert.ok(top<220,'Maximalhöhe in der Kette '+top.toFixed(0));ok('Kette 5L-2L-5M-2M-5H: Gegner steigt max. '+top.toFixed(0)+' px')}
// 6) Launcher bleibt Launcher (Knockdown bei Landung), Pop-Flag aus
{const{p1,p2,t}=setup(70);t(0,1,['H'],1);let n=0;while(!p1.contact&&n++<30)t(0,1);assert.ok(p2.launched&&!p2.pop,'Launcher: kein Pop');for(let k=0;k<160&&p2.state!=='knockdown';k++)t();assert.equal(p2.state,'knockdown','Launcher endet im Knockdown');ok('Launcher unverändert')}
// 7) Geblockte Treffer federn nicht (Gegner hält zurück)
{const{p1,p2,g}=setup(70);const i1=p1.input,i2=p2.input;i1.feed(0,0,['M']);i2.feed(1,0,[]);g.step();let n=0;while(p2.state!=='block'&&n++<30){const fz=g.hitstop>0;i1.feed(0,0,[],fz);i2.feed(1,0,[],fz);g.step()}
 assert.equal(p2.state,'block');assert.equal(p2.pop,false);ok('Block: kein Pop-up')}
console.log('Pop-up-Tests bestanden');
