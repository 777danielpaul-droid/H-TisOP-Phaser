import assert from'node:assert/strict';
// ST3-G0: nicht mehr von Anfang an wählbar; Kapitel-2-Endgegner; freischaltbar per Shop-Kauf ODER nach 3 Durchläufen.
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
const{LOOT,CHAR_SHOP,charPrice,canBuyChar,buyChar,ownsChar}=await import('../src/core/loot.js');
const{CHARACTERS,ROSTER,LADDER,UNLOCKABLE,CLEAR_UNLOCK}=await import('../src/core/characters.js');
const{CHAPTERS}=await import('../src/core/story.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');
const{getClears,addClear}=await import('../src/core/unlocks.js');
const mk=()=>{const ai=new AIController(1),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.kitsune,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);return{g,a:new Arcade(g,p1,p2,ai),p1}};
// ---- Start: nicht wählbar, aber vorhanden / freischaltbar ----
assert(CHARACTERS.st3g0&&!ROSTER.includes('st3g0')&&!LADDER.includes('st3g0')&&UNLOCKABLE.includes('st3g0'),'ST3-G0 zu Beginn gesperrt, aber freischaltbar');
assert.equal(CLEAR_UNLOCK.id,'st3g0');assert.equal(CLEAR_UNLOCK.n,3);
console.log('  ✓ ST3-G0 ist kein Start-Kämpfer mehr');
// ---- Endgegner: Kapitel 2 = ST3-G0, Kapitel 3 = A1LIEN, Kapitel 4 = Anubis ----
assert.equal(CHAPTERS[1].enc.at(-1).boss,'st3g0Boss');assert.equal(CHARACTERS.st3g0Boss.name,'ST3-G0');assert(CHARACTERS.st3g0Boss.storyBoss&&!CHARACTERS.st3g0.storyBoss);
assert.equal(CHAPTERS[2].enc.at(-1).boss,'cyberdemon');assert.equal(CHAPTERS[3].enc.at(-1).boss,'anubisBoss');assert.equal(CHARACTERS.anubisBoss.name,'ANUBIS');assert(CHARACTERS.anubisBoss.storyBoss&&!CHARACTERS.anubis.storyBoss);
console.log('  ✓ Kapitel 2: Endgegner ST3-G0, Kapitel 3: A1LIEN, Kapitel 4: Anubis');
// ---- Shop ----
assert(charPrice('st3g0')>0&&CHAR_SHOP.some(o=>o.id==='st3g0'),'im Shop');LOOT.coins=charPrice('st3g0');assert(canBuyChar('st3g0'));assert(buyChar('st3g0'));assert.equal(LOOT.coins,0);assert(ownsChar('st3g0')&&ROSTER.includes('st3g0'));
console.log('  ✓ Shop-Kauf schaltet ST3-G0 frei');
ROSTER.splice(ROSTER.indexOf('st3g0'),1);delete store['hitisop.unlocks'];   // zurücksetzen für den Durchlauf-Test
// ---- 3 Durchläufe ----
assert.equal(getClears(),0);
for(let i=1;i<=2;i++){const{a}=mk();a.countClear();assert.equal(getClears(),i);assert(!ROSTER.includes('st3g0')&&a.newUnlock===null,'nach '+i+' Durchlauf noch gesperrt')}
{const{a}=mk();a.countClear();assert.equal(getClears(),3);assert(ROSTER.includes('st3g0'),'3. Durchlauf schaltet frei');assert.equal(a.newUnlock,'st3g0');assert(JSON.parse(store['hitisop.unlocks']).includes('st3g0'),'gespeichert')}
{const{a}=mk();a.countClear();assert.equal(a.newUnlock,'anubis','der 4. Durchlauf meldet Anubis (nicht erneut ST3-G0)')}
{const{a}=mk();a.countClear();assert.equal(a.newUnlock,'bear','der 5. Durchlauf meldet URSUS')}
{const{a}=mk();a.countClear();assert.equal(a.newUnlock,null,'danach keine erneute Meldung')}
console.log('  ✓ 3 Durchläufe schalten ST3-G0 frei (gespeichert, einmalige Meldung)');
console.log('ST3-G0-Freischalt-Test OK');
