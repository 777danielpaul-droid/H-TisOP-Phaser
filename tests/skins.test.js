// Zweitfarben: Auswahl (Arcade + 2 Spieler), Weitergabe an die Kämpfer, Farbtausch der Pixel. node tests/skins.test.js
import assert from'node:assert/strict';
import{LOOT}from'../src/core/loot.js';LOOT.skins={tiger:[1],st3g0:[1],kitsune:[1]};   // Farbwahl-Test: Farbe 1 gilt als freigeschaltet, 2/3 bleiben gesperrt (Start-Zustand und Booster: tests/loot.test.js)
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS,ROSTER}from'../src/core/characters.js';
import{SKINS,skinCount,skinName,recolor}from'../src/render/skins.js';
const ok=n=>console.log('  ✓',n);
function setup(){const ai=new AIController(0),p1=new Fighter({char:CHARACTERS.st3g0,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);return{a:new Arcade(g,p1,p2,ai),p1,p2}}
for(const id of ROSTER){assert.equal(skinCount(CHARACTERS[id].sprites),4,id+' hat 4 Farben (2 frei + 2 aus Boostern)');assert.ok(SKINS[CHARACTERS[id].sprites].every(s=>s.name&&/^#[0-9a-f]{6}$/i.test(s.col)))}
ok('Alle spielbaren Figuren haben 4 Farben (Name + Farbpunkt)');
assert.equal(skinName('tiger',1),'WEISS');assert.equal(skinName('st3g0',1),'GRAUBLAU');assert.equal(skinName('kitsune',1),'LILA');ok('Farben: Tiger weiß, ST3-G0 graublau, Kitsune lila');
{const{a,p1,p2}=setup();assert.equal(a.skinOf('tiger'),0);assert.ok(a.cycleSkin('tiger'));assert.equal(a.skinOf('tiger'),1);assert.ok(a.cycleSkin('tiger'));assert.equal(a.skinOf('tiger'),0);
 a.cycleSkin('kitsune');a.start('kitsune');assert.equal(p1.skin,1,'Spieler: gewählte Farbe');assert.equal(p2.skin,0,'Gegner: eigene gemerkte Farbe');
 a.cycleSkin('tiger');a.start('st3g0');assert.equal(p1.skin,0);const tig=a.opponents.indexOf('tiger');a.stage=tig;a.beginStage();assert.equal(p2.skin,1,'Gegner-Tiger weiß');
 assert.equal(a.cycleSkin('custom'),false,'Figur ohne Sprite-Farben: nichts passiert');ok('Arcade: Farbe wird gemerkt und an Spieler/Gegner weitergegeben')}
{const{a,p1,p2}=setup();a.setMode('versus');a.vs.c1=0;a.vs.c2=1;assert.equal(a.vsSkinOf(1),0);assert.equal(a.vsSkinOf(2),0);
 assert.ok(a.vsCycleSkin(2));assert.equal(a.vsSkinOf(2),1);assert.equal(a.vsSkinOf(1),0,'Spieler 1 unabhängig');
 a.vs.c2=0;a.vs.s2=0;assert.equal(a.vsSkinOf(1),0);assert.equal(a.vsSkinOf(2),1,'gleiche Figur + gleiche Farbe -> P2 bekommt automatisch die andere');
 a.vs.c1=0;a.vs.c2=0;a.vs.step=1;a.vsStart();assert.equal(p1.skin,0);assert.equal(p2.skin,1);
 a.vs.s1=1;a.toSelect();a.setMode('versus');assert.equal(a.vs.s1,1,'Farbwahl übersteht Zurück zur Auswahl');
 a.vs.locked[0]=true;assert.equal(a.vsCycleSkin(1),false,'bereit = Farbe gesperrt');ok('2 Spieler: Farbe je Spieler, gleiche Figur bekommt verschiedene Farben')}
{const px=(r,g,b,al=255)=>new Uint8ClampedArray([r,g,b,al]);
 let d=px(20,80,255);recolor('tiger',d,1);assert.ok(d[0]>200&&d[1]>200&&d[2]>200,'blaues Tiger-Fell -> weiß');
 d=px(10,12,40);recolor('tiger',d,1);assert.ok(d[0]<60&&d[2]<70,'dunkle Streifen/Linien bleiben dunkel');
 d=px(60,150,40);recolor('st3g0',d,1);assert.ok(d[2]>d[1]-5&&d[2]>d[0],'ST3-G0 grün -> bläulich');
 d=px(120,120,132);recolor('kitsune',d,1);assert.ok(d[0]>d[1]&&d[2]>d[1],'graues Fell -> lila');
 d=px(70,25,100);const o=[...d];recolor('kitsune',d,1);assert.deepEqual([...d],o,'lila Kleidung bleibt');
 d=px(210,200,170);const o2=[...d];recolor('kitsune',d,1);assert.deepEqual([...d],o2,'cremefarbene Bandagen bleiben');
 d=px(20,80,255,0);recolor('tiger',d,1);assert.equal(d[3],0,'Transparenz bleibt');
 d=px(20,80,255);recolor('tiger',d,0);assert.deepEqual([...d],[20,80,255,255],'Skin 0 = Original');ok('Farbtausch: Fell umgefärbt, Linien/Kleidung/Alpha unberührt')}
console.log('Farben-Tests bestanden');
