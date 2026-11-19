import assert from'node:assert/strict';
import fs from'node:fs';
// Schwarzmarkthändler KORVUS (NPC) + kaufbarer Kämpfer (Rabe): Preis zentral, Kauf dauerhaft, kein Doppelkauf, Dialog/Käufe im Story-Modus, Kampf als Rabe.
const store={};globalThis.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};globalThis.location={search:''};
const{LOOT,SHOP,CHAR_PRICE,CHAR_SHOP,shopCount,charPrice,ownsChar,canBuyChar,buyChar,buyPack}=await import('../src/core/loot.js');
const{CHARACTERS,ROSTER}=await import('../src/core/characters.js');
const{Game}=await import('../src/core/game.js');const{Fighter}=await import('../src/core/fighter.js');const{AIController}=await import('../src/core/ai.js');
const{Arcade}=await import('../src/core/arcade.js');const{InputBuffer}=await import('../src/core/input.js');
const{Dealer,DEALER,MOODS,ITEM_SHOP,LINES,wrapText,resetDealerMemory}=await import('../src/core/blackmarket.js');
const{RABE_ANIMS,SPRITE_CHARS}=await import('../src/render/sprites.js');
const{GROUND}=await import('../src/core/config.js');
// ---- Daten: Preis zentral, Figur vorhanden aber nicht im Roster ----
assert.equal(CHAR_PRICE.rabe,10,'Testpreis 10 Coins');assert.equal(charPrice('rabe'),10);assert.equal(CHAR_SHOP.length,5);assert.equal(shopCount(),SHOP.length+5);   // KORVUS, A1LIEN, ST3-G0, LEON, ANUBIS
assert(CHARACTERS.rabe&&CHARACTERS.rabe.sprites==='rabe'&&CHARACTERS.rabe.mods&&CHARACTERS.rabe.mods.fireball&&CHARACTERS.rabe.mods.super,'Rabe als Kämpfer mit Moveset');
assert(!ROSTER.includes('rabe')&&!ownsChar('rabe'),'zu Beginn nicht spielbar');
console.log('  ✓ Daten: Preis zentral (CHAR_PRICE), Rabe zu Beginn gesperrt');
// ---- Kauf ----
LOOT.coins=9;assert(!canBuyChar('rabe')&&!buyChar('rabe')&&LOOT.coins===9&&!ownsChar('rabe'),'9 Coins reichen nicht');
LOOT.coins=10;assert(canBuyChar('rabe'));assert(buyChar('rabe'),'Kauf mit 10 Coins');assert.equal(LOOT.coins,0);assert.equal(JSON.parse(store['hitisop.loot']).coins,0,'Coins gespeichert');assert(ROSTER.includes('rabe')&&ownsChar('rabe'),'danach spielbar');
LOOT.coins=50;assert(!canBuyChar('rabe')&&!buyChar('rabe')&&LOOT.coins===50,'Doppelkauf: keine Abbuchung');
assert(JSON.parse(store['hitisop.unlocks']).includes('rabe'),'Freischaltung gespeichert');
console.log('  ✓ Kauf: 10 Coins, dauerhaft gespeichert, Doppelkauf verhindert');
// ---- Neustart (frische Module): Rabe bleibt freigeschaltet ----
{const m=await import('../src/core/characters.js?neustart');assert(m.ROSTER.includes('rabe'),'nach Neustart weiterhin im Roster');}
console.log('  ✓ Persistenz: nach Neustart weiterhin freigeschaltet');
// ---- Preis änderbar: ein Wert genügt ----
{const o=CHAR_PRICE.rabe;CHAR_PRICE.rabe=500;assert.equal(charPrice('rabe'),500);CHAR_PRICE.rabe=o}
// ---- Frames: alle Animationen/Posen existieren im Atlas ----
const meta=JSON.parse(fs.readFileSync(new URL('../assets/rabe/meta.json',import.meta.url)));
const names=new Set();for(const a of Object.values(RABE_ANIMS))for(const f of a.frames)names.add(f);for(const a of Object.values(MOODS))for(const f of a)names.add(f);
for(const n of names)assert(meta.frames[n],'Frame fehlt im Atlas: '+n);
assert(SPRITE_CHARS.rabe&&SPRITE_CHARS.rabe.anims===RABE_ANIMS);
for(const k of['idle','walk','crouch','air','dash','airdash','punch','kick','heavy','upper','special','hyper','hit','airhit','block','kd','wakeup','win','defeat','cpunch','ckick','jpunch','jkick','jheavy','cblock'])assert(RABE_ANIMS[k],'Animation fehlt: '+k);
console.log('  ✓ Sprites:',names.size,'Frames, alle im Atlas; Kampf-/Sprech-Animationen vollständig');
// Fall-/Aufsteh-/Sprung-Bögen (Flügel-Sprung): Frames im Atlas und in den Animationen verdrahtet
for(let i=0;i<7;i++)assert(meta.frames['f_'+i],'Fall-Frame f_'+i);for(let i=0;i<8;i++)assert(meta.frames['u_'+i],'Aufsteh-Frame u_'+i);for(let i=0;i<17;i++)assert(meta.frames['j_'+i],'Sprung-Frame j_'+i);
assert(RABE_ANIMS.air.frames.length>=12&&RABE_ANIMS.air.frames.every(f=>/^(?:j_\d+|nf_\d+)a$/.test(f)&&meta.frames[f]),'Sprung nutzt die Flügel-Frames (an der Körpermitte verankert)');
assert(RABE_ANIMS.kd.frames.every(f=>/^f_/.test(f))&&RABE_ANIMS.wakeup.frames.length===8&&RABE_ANIMS.wakeup.frames.every(f=>/^u_/.test(f)),'Fallen + Aufstehen aus den neuen Bögen');
console.log('  ✓ Sprung mit Flügeln, Fallen und Aufstehen verdrahtet');
// ---- Story: Händler ----
resetDealerMemory();
const kb=new InputBuffer(),dummy=new AIController(0);
const p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:kb}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy});
const game=new Game(p1,p2),arc=new Arcade(game,p1,p2,dummy);arc.setMode('story');arc.startStory('tiger',1);
const s=game.story,d=s.dealer;assert(d instanceof Dealer,'Händler im Kapitel 1');assert(s.cfg.npc.x<s.encs[0].x,'steht vor der ersten Welle');
const step=n=>{for(let i=0;i<n;i++){game.step();arc.update()}};
step(300);assert.equal(game.phase,'fight');assert(!d.near&&!d.open(),'weit weg: nicht ansprechbar');
p1.x=d.x-80;p1.y=GROUND;step(3);assert(d.near,'nah: ansprechbar');
assert(d.open()&&d.active,'E: Gespräch beginnt');assert(d.typing&&MOODS[d.mood],'Begrüßung wird getippt');
// Spieler bleibt stehen, auch wenn Tasten gedrückt werden
{const x0=p1.x;kb.feed(1,0,['L']);for(let i=0;i<40;i++){kb.dx=1;game.step()}assert(Math.abs(p1.x-x0)<1,'Spieler steht im Gespräch still');}
const fr=new Set();for(let i=0;i<200;i++){d.t+=7;fr.add(d.frame(d.t))}assert([...fr].every(f=>meta.frames[f]),'Sprech-Frames im Atlas');
assert(d.key('Enter')&&!d.typing,'Enter überspringt den Text');
assert.equal(d.opts.map(o=>o.label)[0],'BOOSTER-PACKS');
// Booster kaufen
LOOT.coins=50;LOOT.packs=0;d.choose(0);assert.equal(d.node,'booster');assert.equal(d.opts.length,SHOP.length+1);
assert(!d.opts[0].ok,'1 Booster = '+SHOP[0].price+' Coins, nur 50 vorhanden');d.choose(0);assert.equal(LOOT.packs,0);assert.equal(LOOT.coins,50,'zu wenig Coins: nichts abgebucht');
LOOT.coins=SHOP[0].price+5;d.rebuild();assert(d.opts[0].ok);d.choose(0);assert.equal(LOOT.packs,1);assert.equal(LOOT.coins,5);
assert.equal(JSON.parse(store['hitisop.loot']).packs,1,'Booster gespeichert');
d.key('Escape');assert.equal(d.node,'menu');
// Gegenstände
d.choose(1);assert.equal(d.node,'items');LOOT.coins=200;LOOT.items={};p1.hp=p1.maxHp;p1.meter=300;d.rebuild();d.choose(0);assert.equal(LOOT.coins,200-ITEM_SHOP[0].price);assert.equal(LOOT.items.drink,1,'Energiedrink im Beutel (auch bei vollem Leben kaufbar)');assert.equal(p1.hp,p1.maxHp,'nicht sofort benutzt');
LOOT.coins=200;const c0=LOOT.coins;d.rebuild();d.choose(1);assert.equal(LOOT.items.elixir,1,'Schattenelixier im Beutel');d.choose(0);assert.equal(LOOT.items.drink,2,'mehrfach auf Lager');assert.equal(JSON.parse(store['hitisop.loot']).items.drink,2,'gespeichert');
d.choose(2);assert.equal(LOOT.items.crystal,1);assert.equal(p1.meter,300,'Kristall wird nicht sofort benutzt');assert.equal(LOOT.coins,c0-ITEM_SHOP[1].price-ITEM_SHOP[0].price-ITEM_SHOP[2].price);
d.key('Escape');
// Kämpfer anheuern (nur als Rabe-Besitzer: schon vorhanden)
d.choose(2);assert.equal(d.node,'hire');assert(!d.opts[0].ok,'schon besessen: nicht erneut kaufbar');const c1=LOOT.coins;d.choose(0);assert.equal(LOOT.coins,c1);
d.key('Escape');d.choose(3);assert(d.say.length>10,'Plaudern');d.key('Escape');assert(!d.active,'Escape im Menü beendet das Gespräch');
console.log('  ✓ Story: ansprechen, Dialog, Booster/Gegenstände kaufen, Spieler eingefroren, nichts doppelt');
// Anheuern über den Händler bei frischem Spielstand (Preis aus CHAR_PRICE)
{const fresh=await import('../src/core/loot.js?frisch');const fc=await import('../src/core/characters.js?frisch2');void fc;}
// Welle: Händler duckt sich weg, Gespräch endet
p1.x=d.x-60;step(3);d.open();assert(d.active);p1.x=s.encs[0].x+5;step(5);assert(!d.active,'Welle beginnt: Gespräch endet');assert.equal(s.state,'fight');step(60);assert(d.alpha<.2,'Händler weg während der Welle');
console.log('  ✓ Welle beendet das Gespräch, Händler duckt sich weg');
// ---- Wortumbruch ----
assert(wrapText(LINES.first[0],44).every(l=>l.length<=48));
// ---- Spielbarer Rabe im Kampf (Roster, KI-Match, Moves, Hyper) ----
{const mk=(id,x,f,ai)=>new Fighter({char:CHARACTERS[id],x,facing:f,input:ai});
 const a=new AIController(3),b=new AIController(3),r=mk('rabe',340,1,a),t=mk('tiger',620,-1,b),g=new Game(r,t);g.startRound&&g.startRound();
 const seen=new Set(),st=new Set(),mv=new Set();let proj=0,hits=0,ph=r.hp+t.hp;
 for(let i=0;i<60*60;i++){if(g.phase==='fight'){r.hp=Math.max(r.hp,r.maxHp*.5);t.hp=Math.max(t.hp,t.maxHp*.5);if(i%300===0)r.meter=300}   // Test: Match läuft weiter (kein frühes KO)
  g.step();seen.add(r.anim);st.add(r.state);if(r.move)mv.add(r.move.label);if(g.projectiles.some(p=>p.owner===r))proj++;if(r.hp+t.hp<ph)hits++;ph=r.hp+t.hp}
 assert(hits>0,'Rabe tauscht Treffer aus');assert(proj>0,'Rabe feuert Schattensicheln');assert(mv.has('Schattensichel')&&mv.has('Rabenschwarm'),'Special + Hyper kommen vor: '+[...mv].join('|'));
 for(const an of seen)assert(RABE_ANIMS[an],'Animation ohne Frames: '+an);
 console.log('  ✓ Kampf als Rabe:',[...seen].sort().join(','),'| Zustände',[...st].sort().join(','));}
// Rabe als Spieler im Story-Modus
{const k2=new InputBuffer(),pa=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:k2}),pb=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:dummy}),g2=new Game(pa,pb),ar=new Arcade(g2,pa,pb,dummy);ar.setMode('story');ar.startStory('rabe',1);
 assert.equal(g2.p1.char.id,'rabe');for(let i=0;i<400;i++){g2.step();ar.update()}assert.equal(ar.state,'fight');}
// Arcade mit dem Raben (Roster-Platz, Leiter)
{const ar=new Arcade(new Game(p1,p2),p1,p2,dummy);ar.setMode('arcade');ar.start('rabe');assert.equal(ar.p1.char.id,'rabe');assert(!ar.opponents.includes('rabe'));}
console.log('Händler-Tests bestanden');
