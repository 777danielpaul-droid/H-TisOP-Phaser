import assert from'node:assert/strict';
// A1LIEN (früher Cyberdämon): Umbenennung + kaufbarer Kämpfer im Shop, aber erst nach dem Abschluss von Kapitel 3.
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
const{LOOT,CHAR_REQ,CHAR_SHOP,shopCount,SHOP,charPrice,charReqMet,ownsChar,canBuyChar,buyChar,CARDS}=await import('../src/core/loot.js');
const{CHARACTERS,ROSTER}=await import('../src/core/characters.js');
const{CHAPTERS}=await import('../src/core/story.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');
// ---- Name ----
assert.equal(CHARACTERS.cyberdemon.name,'A1LIEN');assert.equal(CHARACTERS.cyberdemon.id,'cyberdemon','interne ID bleibt (Sprites, Spielstände)');
assert.equal(CHARACTERS.miniDemon.name,'MINI-A1LIEN');
for(const c of CHAPTERS)for(const e of c.enc)if(e.boss==='cyberdemon')assert.equal(e.title,'A1LIEN','Boss-Titel in Kapitel '+c.id);
assert.equal(CARDS.find(c=>c.id==='cyberdemon').name,'A1LIEN');
const shown=[...Object.values(CHARACTERS).map(c=>c.name+' '+c.desc),...CARDS.map(c=>c.name),...CHAPTERS.flatMap(c=>c.enc.map(e=>e.title))];
assert(!shown.some(s=>/cyberd/i.test(s)),'kein alter Anzeigename mehr: '+shown.filter(s=>/cyberd/i.test(s)).join(' | '));
console.log('  ✓ Name: A1LIEN / MINI-A1LIEN (ID cyberdemon bleibt)');
// ---- Shop-Eintrag + Bedingung ----
assert(charPrice('cyberdemon')>0&&CHAR_SHOP.some(o=>o.id==='cyberdemon'),'A1LIEN steht im Shop');assert.equal(shopCount(),SHOP.length+CHAR_SHOP.length);
assert.equal(CHAR_REQ.cyberdemon.flag,'storydone3');assert(!ownsChar('cyberdemon')&&!ROSTER.includes('cyberdemon'),'zu Beginn nicht spielbar');
LOOT.coins=99999;assert(!charReqMet('cyberdemon'),'Bedingung zu Beginn nicht erfüllt');assert(!canBuyChar('cyberdemon'),'auch mit vielen Coins nicht kaufbar');
assert(!buyChar('cyberdemon')&&LOOT.coins===99999&&!ownsChar('cyberdemon'),'Kaufversuch ohne Kapitel 3: keine Abbuchung, nicht freigeschaltet');
console.log('  ✓ Shop: gesperrt, solange Kapitel 3 nicht geschafft ist (keine Abbuchung)');
// ---- Kapitel 1 und 2 reichen nicht, Kapitel 3 schon ----
const kb=new InputBuffer(),dummy=new AIController(0);
const mk=ch=>{const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});const g=new Game(p1,p2),a=new Arcade(g,p1,p2,dummy);a.setMode('story');a.startStory('tiger',ch);return{g,a}};
const finish=({g,a})=>{g.story.state='done';g.story.doneT=300;a.update();return a.state};
for(const ch of[1,2]){const r=mk(ch);assert.equal(finish(r),'victory');assert(!charReqMet('cyberdemon'),'Kapitel '+ch+' schaltet den Shop-Kauf nicht frei')}
{const r=mk(3);assert.equal(r.a.chapter,3);assert.equal(finish(r),'victory','Kapitel 3 geschafft');assert(JSON.parse(store['hitisop.unlocks']).includes('storydone3'),'Abschluss gespeichert');}
assert(charReqMet('cyberdemon')&&canBuyChar('cyberdemon'),'nach Kapitel 3 kaufbar');
console.log('  ✓ Kapitel 3 abgeschlossen -> Shop-Kauf freigegeben (Kapitel 1/2 nicht)');
// ---- Kauf ----
LOOT.coins=charPrice('cyberdemon')-1;assert(!canBuyChar('cyberdemon')&&!buyChar('cyberdemon'),'zu wenig Coins');
LOOT.coins=charPrice('cyberdemon')+7;assert(buyChar('cyberdemon'),'Kauf');assert.equal(LOOT.coins,7);assert(ownsChar('cyberdemon')&&ROSTER.includes('cyberdemon'),'danach spielbar');
assert(JSON.parse(store['hitisop.unlocks']).includes('cyberdemon'),'Freischaltung gespeichert');
LOOT.coins=9999;assert(!canBuyChar('cyberdemon')&&!buyChar('cyberdemon')&&LOOT.coins===9999,'Doppelkauf: keine Abbuchung');
console.log('  ✓ Kauf: Preis abgebucht, dauerhaft gespeichert, Doppelkauf verhindert');
// ---- spielbar: Arcade + Story als A1LIEN ----
{const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});const a=new Arcade(new Game(p1,p2),p1,p2,dummy);
 a.setMode('arcade');a.start('cyberdemon');assert.equal(a.p1.char.id,'cyberdemon');assert(!a.opponents.includes('cyberdemon'));
 a.setMode('story');a.startStory('cyberdemon',1);assert.equal(a.p1.char.id,'cyberdemon');for(let i=0;i<120;i++){a.game.step();a.update()}}
console.log('  ✓ A1LIEN spielbar (Arcade + Story)');
console.log('A1LIEN-Test OK');
