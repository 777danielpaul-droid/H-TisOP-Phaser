import assert from'node:assert/strict';
// Anubis: Endgegner von Story-Kapitel 4 (und letzte Arcade-Stufe). Spielbar per Shop-Kauf ODER nach 4 Durchläufen – einmal Durchspielen reicht nicht mehr.
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
const{LOOT,CHAR_SHOP,CHAR_REQ,charPrice,canBuyChar,buyChar,ownsChar,shopCount,SHOP}=await import('../src/core/loot.js');
const{CHARACTERS,ROSTER,LADDER,UNLOCKABLE,BOSS,CLEAR_UNLOCKS}=await import('../src/core/characters.js');
const{CHAPTERS}=await import('../src/core/story.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');
const{getClears}=await import('../src/core/unlocks.js');
const mk=()=>{const ai=new AIController(1),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.kitsune,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);return{g,a:new Arcade(g,p1,p2,ai),p1}};
// ---- Start: gesperrt, aber freischaltbar; weiter Arcade-Endgegner ----
assert.equal(BOSS,'anubis');assert(CHARACTERS.anubis&&!ROSTER.includes('anubis')&&UNLOCKABLE.includes('anubis'),'Anubis zu Beginn gesperrt, aber freischaltbar');
assert.equal(Arcade.ladderFor('tiger').at(-1),'anubis','weiter Endgegner im Arcade');assert(!LADDER.includes('anubis'));
const cu=CLEAR_UNLOCKS.find(u=>u.id==='anubis');assert(cu&&cu.n===4,'Anubis: 4 Durchläufe');assert.equal(CLEAR_UNLOCKS.find(u=>u.id==='st3g0').n,3,'ST3-G0 bleibt bei 3');
console.log('  ✓ Anubis: gesperrt, freischaltbar (4 Durchläufe), weiter Arcade-Endgegner');
// ---- Story: Endboss von Kapitel 4 ----
assert(CHAPTERS.length>=4);assert.equal(CHAPTERS[3].enc.at(-1).boss,'anubisBoss');assert(!CHAPTERS.slice(0,3).some(c=>c.enc.some(e=>e.boss==='anubisBoss')),'Anubis nur in Kapitel 4');
assert(CHARACTERS.anubisBoss.storyBoss&&/Kapitel 4/.test(CHARACTERS.anubisBoss.desc));
console.log('  ✓ Story: Anubis ist Endboss von Kapitel 4 (nicht mehr von Kapitel 3)');
// ---- einmal Arcade durchspielen schaltet Anubis NICHT mehr frei ----
{const{g,a,p1}=mk();a.start('tiger');a.stage=a.total-1;a.beginStage();assert(a.isBoss());p1.wins=2;g.phase='match';g.pf=80;a.update();assert.equal(a.state,'victory');
 assert.equal(a.newUnlock,null);assert(!ROSTER.includes('anubis'),'1x Arcade reicht nicht');assert.equal(getClears(),1,'zählt aber als Durchlauf')}
console.log('  ✓ 1x Arcade durchspielen: kein Anubis, aber ein Durchlauf gezählt');
// ---- Shop ----
assert(charPrice('anubis')>0&&CHAR_SHOP.some(o=>o.id==='anubis'),'Anubis im Shop');assert(!CHAR_REQ.anubis,'keine Zusatzbedingung');assert.equal(shopCount(),SHOP.length+CHAR_SHOP.length);
LOOT.coins=charPrice('anubis')-1;assert(!canBuyChar('anubis')&&!buyChar('anubis'),'zu wenig Coins');assert.equal(LOOT.coins,charPrice('anubis')-1);
LOOT.coins=charPrice('anubis')+5;assert(canBuyChar('anubis'));assert(buyChar('anubis'));assert.equal(LOOT.coins,5);assert(ownsChar('anubis')&&ROSTER.includes('anubis'));assert(JSON.parse(store['hitisop.unlocks']).includes('anubis'),'gespeichert');
LOOT.coins=9999;assert(!canBuyChar('anubis')&&!buyChar('anubis')&&LOOT.coins===9999,'Doppelkauf: keine Abbuchung');
{const{a}=mk();a.setMode('story');a.startStory('anubis',1);assert.equal(a.p1.char.id,'anubis','als Anubis spielbar');assert(!Arcade.ladderFor('anubis').includes('anubis'),'als Anubis kein Endgegner')}
console.log('  ✓ Shop-Kauf: Preis abgebucht, gespeichert, Doppelkauf verhindert, spielbar');
ROSTER.splice(ROSTER.indexOf('anubis'),1);delete store['hitisop.unlocks'];delete store['hitisop.clears'];
// ---- 4 Durchläufe ----
assert.equal(getClears(),0);
for(let i=1;i<=3;i++){const{a}=mk();a.countClear();assert.equal(getClears(),i);assert(!ROSTER.includes('anubis'),'nach '+i+' Durchläufen noch gesperrt')}
{const{a}=mk();a.countClear();assert.equal(getClears(),4);assert(ROSTER.includes('anubis'),'4. Durchlauf schaltet Anubis frei');assert(['st3g0','anubis'].includes(a.newUnlock));assert(JSON.parse(store['hitisop.unlocks']).includes('anubis'),'gespeichert')}
{const{a}=mk();a.countClear();assert.equal(a.newUnlock,'bear','der 5. Durchlauf meldet URSUS, nicht erneut Anubis')}
{const{a}=mk();a.countClear();assert.equal(a.newUnlock,null,'danach keine erneute Meldung')}
console.log('  ✓ 4 Durchläufe schalten Anubis frei (gespeichert, einmalige Meldung)');
// ---- Story-Durchlauf (Kapitel 4) zählt als Durchlauf ----
delete store['hitisop.clears'];{const{g,a}=mk();a.setMode('story');a.startStory('tiger',3);g.story.state='done';g.story.doneT=300;a.update();assert.equal(getClears(),0,'Kapitel 3 ist kein Durchlauf');
 a.startStory('tiger',CHAPTERS.length);g.story.state='done';g.story.doneT=300;a.update();assert.equal(a.state,'victory');assert.equal(getClears(),1,'das letzte Kapitel zählt als Durchlauf');assert(!a.hasNextChapter)}
console.log('  ✓ Story: erst das letzte Kapitel zählt als Durchlauf');
console.log('Anubis-Freischalt-Test OK');
