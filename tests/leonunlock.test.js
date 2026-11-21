import assert from'node:assert/strict';
// Leon: nicht mehr von Anfang an im Roster; Endboss von Kapitel 1 (nach Mantis);
// freischaltbar durch 1x Story durchspielen ODER Kauf im Shop (150 Coins).
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
const{LOOT,CHAR_SHOP,charPrice,canBuyChar,buyChar,ownsChar}=await import('../src/core/loot.js');
const{CHARACTERS,ROSTER,LADDER,UNLOCKABLE,STORY_CLEAR_UNLOCK}=await import('../src/core/characters.js');
const{CHAPTERS}=await import('../src/core/story.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');
const{loadUnlocks}=await import('../src/core/unlocks.js');

const mk=()=>{const ai=new AIController(1),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.kitsune,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);return{g,a:new Arcade(g,p1,p2,ai),p1}};

// 1) Startzustand: Leon nicht im Start-Roster/Ladder, aber als freischaltbar deklariert
assert(CHARACTERS.leon&&!ROSTER.includes('leon')&&!LADDER.includes('leon')&&UNLOCKABLE.includes('leon'),'Leon zu Beginn nicht im Roster, aber in UNLOCKABLE');
assert(CHARACTERS.leon.unlockable===true,'Leon hat unlockable: true');
assert.equal(STORY_CLEAR_UNLOCK.id,'leon');assert.equal(STORY_CLEAR_UNLOCK.n,1);
console.log('  ✓ Leon ist kein Start-Kämpfer mehr und als freischaltbar markiert');

// 2) Kapitel 1: Alpha-Mantis bei enc[4] (x: 1380) gefolgt von leonBoss als Endboss bei enc[5] (x: 1800)
const ch1=CHAPTERS[0];
assert.equal(ch1.enc.length,6,'Kapitel 1 hat 6 Wellen');
const mantisWave=ch1.enc[4];
assert.equal(mantisWave.boss,1,'Welle 5 ist der Alpha-Mantis');
assert.equal(mantisWave.x,1380);
const leonWave=ch1.enc[5];
assert.equal(leonWave.boss,'leonBoss','Welle 6 (nach Mantis) ist leonBoss');
assert.equal(leonWave.x,1800);
const lb=CHARACTERS.leonBoss;
assert(lb&&lb.storyBoss===true,'leonBoss ist storyBoss');
assert.equal(lb.hp,1300);
assert.equal(lb.sprites,'leon');
assert.equal(lb.glow,'#ff9a22');
assert(!CHARACTERS.leon.storyBoss,'spielbarer Leon ist kein storyBoss');
console.log('  ✓ Kapitel 1: Leon ist Endboss nach dem Mantis-Kampf (Welle 6 nach Alpha-Mantis)');

// 3) Shop: Leon kostet 150 Coins, kaufbar und schaltet ihn frei
assert.equal(charPrice('leon'),150,'Leon kostet 150 Coins im Shop');
assert(CHAR_SHOP.some(o=>o.id==='leon'&&o.price===150),'Leon ist in CHAR_SHOP');
LOOT.coins=150;
assert(canBuyChar('leon'),'kann gekauft werden mit 150 Coins');
assert(buyChar('leon'),'Kauf erfolgreich');
assert.equal(LOOT.coins,0);
assert(ownsChar('leon')&&ROSTER.includes('leon'),'nach Kauf im Roster');
console.log('  ✓ Shop: Leon für 150 Coins kaufbar und freigeschaltet');

// Zurücksetzen für Story-Clear-Test
ROSTER.splice(ROSTER.indexOf('leon'),1);
delete store['hitisop.unlocks'];
assert(!ROSTER.includes('leon'),'für Test zurückgesetzt');

// 4) Story-Clear: 1 Durchlauf durch Story (letztes Kapitel = CHAPTERS.length abgeschlossen) schaltet Leon frei; Kapitel 3 und das vorletzte allein reichen nicht
{
 const{g,a}=mk();
 a.setMode('story');
 a.startStory('tiger',3);
 assert.equal(a.chapter,3);
 g.story.state='done';g.story.doneT=265;a.update();
 assert.equal(a.state,'victory');assert(!ROSTER.includes('leon'),'Kapitel 3 allein schaltet Leon nicht frei');
 a.startStory('tiger',CHAPTERS.length-1);
 g.story.state='done';g.story.doneT=265;a.update();
 assert.equal(a.state,'victory');assert(!ROSTER.includes('leon'),'das vorletzte Kapitel allein schaltet Leon nicht frei');
 a.startStory('tiger',CHAPTERS.length);
 assert.equal(a.chapter,CHAPTERS.length);
 const s=g.story;
 s.state='done';
 s.doneT=265;
 gameoverCheck: {
  a.update();
 }
 assert.equal(a.state,'victory','Story abgeschlossen');
 assert(ROSTER.includes('leon'),'Story-Abschluss schaltet Leon frei');
 assert.equal(a.newUnlock,'leon','newUnlock zeigt leon an');
 assert(loadUnlocks().includes('leon'),'Freischaltung in hitisop.unlocks gespeichert');
}
console.log('  ✓ 1x Story durchspielen schaltet Leon frei (newUnlock, gespeichert)');

console.log('Leon-Freischalt-Tests erfolgreich bestanden!');
