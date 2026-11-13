import assert from'node:assert/strict';
import{LOOT,SHOP,canBuy,buyPack,addPack,openPack,ownsSkin,ownsStage,ownedStages,CARDS,SKIN_POOL,STAGE_POOL}from'../src/core/loot.js';
import{Arcade}from'../src/core/arcade.js';import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';import{CHARACTERS}from'../src/core/characters.js';
assert.equal(openPack(),null);
// Start-Zustand: pro Figur nur Farbe 0, nur Stage 0 frei
assert(SKIN_POOL.every(([id,k])=>!ownsSkin(id,k))&&['tiger','st3g0','kitsune'].every(id=>ownsSkin(id,0)),'am Anfang nur Farbe 0');
assert(STAGE_POOL.every(i=>!ownsStage(i))&&ownsStage(0)&&ownedStages(4).join()==='0','am Anfang nur Stage 0');
{const p1=new Fighter({char:CHARACTERS.tiger,x:0,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.st3g0,x:9,facing:-1,input:new InputBuffer()});
 const A=new Arcade(new Game(p1,p2),p1,p2,{setLevel(){}});A.setMode('versus');A.vs.step=1;A.vs.stage=0;A.vsStageMove(1);assert.equal(A.vs.stage,4,'gesperrte Stages werden übersprungen (nur Zufall folgt)');
 A.setMode('arcade');A.start('tiger');for(let s=0;s<A.total;s++){A.stage=s;A.beginStage();assert.equal(A.game.stageIndex,0,'Arcade nutzt nur freigeschaltete Stages')}
 A.setMode('versus');A.startVersus('tiger','st3g0',2);assert.equal(A.game.stageIndex,0,'gesperrte Stage wird nicht gespielt')}
console.log('  ✓ Start: nur eine Farbe pro Figur, nur eine Stage; gesperrte Stages nicht wählbar');
addPack(400);let coins=0,cards=0,skins=0,stages=0;
for(let i=0;i<400;i++){const r=openPack();assert.equal(r.length,3);for(const x of r){if(x.type==='coins')coins++;else if(x.type==='card')cards++;else if(x.type==='stage')stages++;else skins++}}
assert.equal(LOOT.packs,0);assert(coins>0&&cards>0&&skins>0&&stages>0,'alle Belohnungsarten');
assert(SKIN_POOL.every(([id,k])=>ownsSkin(id,k))&&STAGE_POOL.every(i=>ownsStage(i)),'nach vielen Boostern alle Farben und Stages frei (jede nur einmal)');assert.equal(new Set(LOOT.stages).size,LOOT.stages.length,'Stage nie doppelt');
console.log('  ✓ Booster: Coins/Karten/Farben/Stages, jede Farbe/Stage nur einmal',LOOT.coins,'Coins');
// Skin-Wahl überspringt gesperrte Skins
LOOT.skins={};LOOT.stages=[];const p1=new Fighter({char:CHARACTERS.tiger,x:0,facing:1,input:new InputBuffer()}),p2=new Fighter({char:CHARACTERS.st3g0,x:9,facing:-1,input:new InputBuffer()});
const A=new Arcade(new Game(p1,p2),p1,p2,{setLevel(){}});A.cycleSkin('tiger');A.cycleSkin('tiger');assert.equal(A.skinOf('tiger'),0);
LOOT.skins={tiger:[3]};A.cycleSkin('tiger');assert.equal(A.skinOf('tiger'),3);A.cycleSkin('tiger');assert.equal(A.skinOf('tiger'),0);
console.log('  ✓ gesperrte Skins werden übersprungen');
// Shop: Booster für Coins
LOOT.coins=0;LOOT.packs=0;assert(!canBuy(0)&&!buyPack(0),'ohne Coins nichts kaufbar');assert.equal(LOOT.packs,0);
LOOT.coins=SHOP[0].price;assert(buyPack(0));assert.equal(LOOT.packs,1);assert.equal(LOOT.coins,0);
LOOT.coins=SHOP[1].price-1;assert(!buyPack(1),'eine Coin zu wenig');assert.equal(LOOT.coins,SHOP[1].price-1);
LOOT.coins=SHOP[2].price+7;assert(buyPack(2));assert.equal(LOOT.packs,1+SHOP[2].n);assert.equal(LOOT.coins,7);assert(!buyPack(9),'unbekanntes Angebot');
assert(SHOP.every(o=>o.price/o.n<=SHOP[0].price),'Mengenrabatt: nie teurer pro Booster');
console.log('  ✓ Shop: Kaufen zieht Coins ab, bringt Booster, zu wenig Coins = nichts');console.log('Loot-Tests bestanden');
