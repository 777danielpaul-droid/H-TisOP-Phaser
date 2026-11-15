import assert from'node:assert/strict';
// Sonderitems aus Boostern (Energiedrink, Elixier, Kristall): kommen in den Beutel, sind im Story-Modus benutzbar, verbrauchen sich nur bei Wirkung, bleiben gespeichert.
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
store['hitisop.loot']=JSON.stringify({packs:0,coins:0,cards:{drink:2,tiger:1},skins:{},stages:[]});   // alter Spielstand ohne Beutel
const{LOOT,CARDS,openPack,itemCount,addItem,takeItem,addPack}=await import('../src/core/loot.js');
const{ITEMS,itemOf,isItem,itemBlock}=await import('../src/core/items.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');const{CHARACTERS}=await import('../src/core/characters.js');
const{menuKey}=await import('../src/core/gamepad.js');
// ---- Daten ----
assert.deepEqual(ITEMS.map(i=>i.id),['drink','elixir','crystal']);assert(ITEMS.every(i=>CARDS.some(c=>c.id===i.id)),'jedes Item hat eine Sammelkarte');
assert(isItem('drink')&&!isItem('tiger')&&itemOf('nix')===null);
assert.equal(itemCount('drink'),2,'alter Spielstand: gesammelte Drinks werden zu Items');assert.equal(itemCount('tiger'),0);
console.log('  ✓ Daten: 3 Items mit Karten, Altspielstand migriert');
// ---- Beutel ----
assert(addItem('elixir',2)&&itemCount('elixir')===2&&!addItem('tiger'));assert.equal(JSON.parse(store['hitisop.loot']).items.elixir,2,'gespeichert');
assert(takeItem('elixir')&&takeItem('elixir')&&!takeItem('elixir')&&itemCount('elixir')===0,'nie unter 0');
// Booster öffnen: Item-Karte legt ein Stück in den Beutel, andere Karten nicht
{let n=0,got=0;const before={};for(const i of ITEMS)before[i.id]=itemCount(i.id);const cardsBefore=Object.values(LOOT.cards).reduce((a,b)=>a+b,0);
 for(let k=0;k<60;k++){addPack();const r=openPack();for(const x of r)if(x.type==='card'){n++;if(x.item){got++;assert(isItem(x.id))}else assert(!isItem(x.id))}}
 const after=Object.values(LOOT.cards).reduce((a,b)=>a+b,0);assert.equal(after-cardsBefore,n,'alle Karten gezählt');
 const gained=ITEMS.reduce((a,i)=>a+itemCount(i.id)-before[i.id],0);assert.equal(gained,got,'jede Item-Karte = genau +1 im Beutel');assert(got>0,'in 60 Boostern kommt mindestens ein Item');}
console.log('  ✓ Booster: Item-Karten füllen den Beutel, Zähler stimmen, gespeichert');
// ---- Story: benutzen ----
const kb=new InputBuffer(),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',1);
const s=game.story,step=n=>{for(let i=0;i<n;i++){game.step();arc.update()}};
LOOT.items={drink:2,elixir:1,crystal:1};
assert(!s.useItem('drink'),'im Intro/vor dem Kampf nicht benutzbar');assert.equal(itemCount('drink'),2,'nichts verbraucht');
step(300);assert.equal(game.phase,'fight');
// Leben voll: nichts verbrauchen
assert(!s.useItem('drink')&&itemCount('drink')===2,'Leben voll: Drink bleibt im Beutel');step(30);
// Drink: +25 %
p1.hp=Math.round(p1.maxHp*.4);const h0=p1.hp;assert(s.useItem('drink'));assert.equal(p1.hp,h0+Math.round(p1.maxHp*.25));assert.equal(itemCount('drink'),1);
assert(!s.useItem('drink')&&itemCount('drink')===1,'Abklingzeit: kein Doppelverbrauch durch Tastenhämmern');step(45);
// Elixir: +70 %, Deckel bei maxHp
p1.hp=Math.round(p1.maxHp*.5);assert(s.useItem('elixir'));assert.equal(p1.hp,p1.maxHp,'Heilung begrenzt auf Maximum');assert.equal(itemCount('elixir'),0);step(45);
// leer: nichts passiert
p1.hp=Math.round(p1.maxHp*.3);assert(!s.useItem('elixir')&&p1.hp===Math.round(p1.maxHp*.3),'leerer Beutel');step(30);
// Kristall: +100 Meter, bei vollem Meter kein Verbrauch
p1.meter=0;assert(s.useItem('crystal'));assert.equal(p1.meter,100);assert.equal(itemCount('crystal'),0);step(45);
LOOT.items.crystal=1;p1.meter=300;assert(!s.useItem('crystal')&&itemCount('crystal')===1,'Meter voll: Kristall bleibt');
assert(!s.useItem('unbekannt'));
console.log('  ✓ Story: Drink/Elixir/Kristall wirken, Deckel, leer, voll und Abklingzeit verbrauchen nichts');
// ---- Händler-Gespräch sperrt Benutzung; Auswahl Q ----
LOOT.items={drink:1,elixir:0,crystal:1};s.isel=0;assert(s.cycleItem()&&s.isel===2,'Q springt zum nächsten vorhandenen');assert(s.cycleItem()&&s.isel===0);LOOT.items={drink:0,elixir:0,crystal:0};assert(!s.cycleItem(),'nichts da: Auswahl bleibt');
LOOT.items={drink:1};p1.hp=Math.round(p1.maxHp*.5);s.dealer.active=true;assert(!s.useItem('drink')&&itemCount('drink')===1,'im Gespräch gesperrt');s.dealer.active=false;
// ---- Tod: keine Items ----
step(45);p1.hp=0;assert(!s.useItem('drink')&&itemCount('drink')===1,'tot: nichts benutzbar');
console.log('  ✓ Q-Auswahl, Händler-Gespräch und K.O. sperren Benutzung');
// ---- Controller: L3 = wählen, R3 = benutzen (nur im Kampf) ----
assert.equal(menuKey('l3',{screen:'fight'}),'KeyQ');assert.equal(menuKey('r3',{screen:'fight'}),'Digit0');assert.equal(menuKey('l3',{screen:'menu'}),null);assert.equal(menuKey('l2',{screen:'fight'}),'KeyE','L2 = Händler bleibt');
console.log('  ✓ Controller-Belegung');
console.log('items.test.js OK');
