// 2-Spieler-Modus (PvP): Auswahl beider Spieler, Stage-Wahl, Match-Ende, Revanche, Rückkehr zu Arcade. node tests/versus.test.js
import assert from'node:assert/strict';
import{unlockAll}from'../src/core/loot.js';unlockAll();   // diese Tests prüfen Ablauf/Auswahl mit allen Farben und Stages (Start-Zustand: tests/loot.test.js)
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer,KeyboardInput,VS1_BUTTONS,VS2_BUTTONS,VS1_DIRS,VS2_DIRS}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS,ROSTER}from'../src/core/characters.js';
import{ROUND}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n);
function setup(){const ai=new AIController(0),p1=new Fighter({char:CHARACTERS.st3g0,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2),a=new Arcade(g,p1,p2,ai);return{g,a,p1,p2}}
// 1) Moduswechsel nur im Auswahlbildschirm; Standard bleibt Arcade
{const{a}=setup();assert.equal(a.mode,'arcade');a.toggleMode();assert.equal(a.mode,'versus');a.toggleMode();assert.equal(a.mode,'arcade');a.state='fight';a.setMode('versus');assert.equal(a.mode,'arcade');ok('Modus: Arcade ⇄ 2 Spieler (nur im Auswahlbildschirm)')}
// 2) Beide wählen unabhängig; erst wenn beide bereit sind, kommt die Stage-Wahl
{const{a}=setup();a.setMode('versus');const n=Arcade.slotIds().length;a.vsMove(1,1);a.vsMove(2,-1);assert.equal(a.vs.c1,1);assert.equal(a.vs.c2,0);a.vsMove(2,-1);assert.equal(a.vs.c2,n-1,'Auswahl läuft im Kreis');
 a.vsSet(1,0);a.vsSet(2,1);a.vsConfirm(1);assert.equal(a.vs.step,0,'P2 noch nicht bereit');a.vsMove(1,1);assert.equal(a.vs.c1,0,'gesperrter Spieler bewegt sich nicht');a.vsConfirm(2);assert.equal(a.vs.step,1);
 a.vsBack();assert.equal(a.vs.step,0);assert.deepEqual(a.vs.locked,[false,false]);ok('Auswahl: beide unabhängig, Stage-Wahl erst wenn beide bereit, Zurück funktioniert')}
// 3) Start: beide Figuren + Stage gesetzt, volle HP, Runden 0:0; Stage 0..3 oder Zufall
{const{a,g,p1,p2}=setup();a.setMode('versus');a.vsSet(1,0);a.vsSet(2,1);a.vsConfirm(1);a.vsConfirm(2);a.vsStageMove(1);a.vsStageMove(1);assert.equal(a.vs.stage,2);assert.ok(a.vsStart());
 assert.equal(a.state,'fight');assert.equal(a.mode,'versus');assert.equal(p1.char.id,ROSTER[0]);assert.equal(p2.char.id,ROSTER[1]);assert.equal(g.stageIndex,2);assert.equal(p1.wins+p2.wins,0);assert.equal(a.total,0,'kein Arcade-Fortschritt');
 for(let i=0;i<5;i++){a.vs={...a.vs,step:1,stage:4};a.vsStart();assert.ok(g.stageIndex>=0&&g.stageIndex<4,'Zufall bleibt im Bereich')}ok('Start: Figuren, Stage, Zufalls-Stage, kein Arcade-Fortschritt')}
// 4) Matchende: Sieger P1 oder P2 -> vsover, ENTER = Revanche (gleiche Figuren), ESC/toSelect = Auswahl
{const{a,g,p1,p2}=setup();a.startVersus('st3g0','tiger',1);const idP2=p2.char.id;
 p2.wins=ROUND.wins;g.phase='match';g.pf=70;a.update();assert.equal(a.state,'vsover','auch wenn P2 gewinnt: kein Game Over');
 a.confirm();assert.equal(a.state,'fight');assert.equal(p1.wins+p2.wins,0);assert.equal(p2.char.id,idP2);assert.equal(g.stageIndex,1,'Revanche: gleiche Stage');
 g.phase='match';g.pf=70;p1.wins=ROUND.wins;a.update();assert.equal(a.state,'vsover');a.toSelect();assert.equal(a.state,'select');assert.equal(a.mode,'versus','Modus bleibt gemerkt');ok('Matchende: Sieger egal, ENTER = Revanche, zurück zur Auswahl')}
// 5) Arcade läuft unverändert weiter, nachdem man zurückgewechselt hat
{const{a,g,p1}=setup();a.startVersus('st3g0','tiger',0);a.toSelect();a.setMode('arcade');a.start('st3g0');assert.equal(a.mode,'arcade');assert.ok(a.total>0);p1.wins=ROUND.wins;g.phase='match';g.pf=70;a.update();assert.equal(a.state,a.total>1?'clear':'victory');ok('Zurück zu Arcade: Leiter + Stage-Ende wie zuvor')}
// 6) Tastaturen: P1 (WASD/GHJ…) und P2 (Pfeile/KL;…) überschneiden sich nicht, nichts kollidiert mit Menü-/Vollbild-Tasten
{const k1=Object.keys(VS1_BUTTONS),k2=Object.keys(VS2_BUTTONS),d1=Object.values(VS1_DIRS).flat(),d2=Object.values(VS2_DIRS).flat();
 const all=[...k1,...k2,...d1,...d2];assert.equal(new Set(all).size,all.length,'keine Taste doppelt belegt');
 for(const bad of['KeyM','KeyF','Escape','Enter','F2'])assert.ok(!all.includes(bad),bad+' bleibt frei (Menü/Vollbild/Bestätigen)');
 const kb1=new KeyboardInput(null,VS1_BUTTONS,VS1_DIRS),kb2=new KeyboardInput(null,VS2_BUTTONS,VS2_DIRS);kb1.keys.add('KeyD');kb2.keys.add('ArrowLeft');kb1.pend.push('L');kb1.tick();kb2.tick();
 assert.equal(kb1.dx,1);assert.equal(kb2.dx,-1);assert.ok(kb1.pressed('L'));assert.ok(!kb2.pressed('L'),'Eingaben bleiben getrennt');ok('Belegung: zwei getrennte Tastaturhälften ohne Konflikte')}
// 7) Gamepad: Stick/Steuerkreuz + Buttons werden gelesen (simuliert), ohne Pad nichts
{const kb=new KeyboardInput(null);kb.padIndex=0;const setPad=v=>Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>v},configurable:true});setPad([{axes:[.9,0],buttons:Array.from({length:17},(_,i)=>({pressed:i===0}))}]);
 kb.tick();assert.equal(kb.dx,1);assert.ok(kb.pressed('L'));kb.tick();assert.equal(kb.buf.filter(e=>e.b==='L'&&e.age===0).length,0,'gehaltener Button löst nicht dauernd neu aus');
 setPad([null]);kb.tick();assert.equal(kb.dx,0);ok('Gamepad: Richtung + Buttons, nur Flanke zählt, ohne Pad neutral')}
console.log('Versus-Tests bestanden');
