import assert from'node:assert/strict';
import{LOOT,CARDS,SELL_MIN,SELL_BONUS,SELL_KEEP,sellable,sellAdjust,sellSelectDupes,sellPreview,sellCards,addItem}from'../src/core/loot.js';
const reset=()=>{LOOT.coins=0;LOOT.packs=0;LOOT.cards={};LOOT.items={};LOOT.skins={};LOOT.stages=[]};
const byR=r=>CARDS.find(c=>c.r===r&&!['drink','elixir','crystal'].includes(c.id));
const common=byR(0),rare=byR(1),epic=byR(2);
const lo=()=>0,hi=()=>.999999;   // Zufall: immer kleinster / größter Bonus
reset();
// Nur Doppelte sind verkaufbar: eine Karte pro Sorte bleibt
LOOT.cards[common.id]=1;assert.equal(sellable(common.id),0,'einzelne Karte nicht verkaufbar');
LOOT.cards[common.id]=4;assert.equal(sellable(common.id),4-SELL_KEEP);assert.equal(sellable('gibtsnicht'),0);
const sel={};assert.equal(sellAdjust(sel,common.id,1),1);assert.equal(sellAdjust(sel,common.id,10),3,'Auswahl begrenzt auf verkaufbare Anzahl');assert.equal(sellAdjust(sel,common.id,-10),0);assert(!(common.id in sel),'0 = nicht ausgewählt');
console.log('  ✓ Verkaufbar sind nur Doppelte; Auswahl wird begrenzt');
// Mindestbetrag + Bonus je Seltenheit, Bonusgrenzen exakt
LOOT.cards[rare.id]=3;LOOT.cards[epic.id]=2;LOOT.cards[common.id]=4;
const s2={[common.id]:3,[rare.id]:2,[epic.id]:1};
const pv=sellPreview(s2);assert.equal(pv.n,6);assert.equal(pv.min,3*SELL_MIN[0]+2*SELL_MIN[1]+SELL_MIN[2]);assert.equal(pv.bonus,3*SELL_BONUS[0]+2*SELL_BONUS[1]+SELL_BONUS[2]);
LOOT.coins=5;const r0=sellCards({...s2},lo);assert.equal(r0.bonus,0);assert.equal(r0.total,pv.min);assert.equal(LOOT.coins,5+pv.min,'ohne Bonus genau der Mindestbetrag');
assert.equal(LOOT.cards[common.id],1);assert.equal(LOOT.cards[rare.id],1);assert.equal(LOOT.cards[epic.id],1,'je eine Karte bleibt');
LOOT.cards[rare.id]=3;LOOT.cards[epic.id]=2;LOOT.cards[common.id]=4;LOOT.coins=0;
const r1=sellCards({...s2},hi);assert.equal(r1.bonus,pv.bonus);assert.equal(LOOT.coins,pv.min+pv.bonus,'größter Bonus = Mindestbetrag + Maximalbonus');
console.log('  ✓ Mindestbetrag + Zufallsbonus (',pv.min,'+ 0..'+pv.bonus,') korrekt gebucht, Karten abgezogen');
// Zufall liegt immer im erlaubten Bereich und variiert
const tot=new Set();for(let i=0;i<300;i++){LOOT.cards[rare.id]=3;LOOT.coins=0;const r=sellCards({[rare.id]:2});assert(r.total>=2*SELL_MIN[1]&&r.total<=2*(SELL_MIN[1]+SELL_BONUS[1]));tot.add(r.total)}assert(tot.size>3,'Bonus ist wirklich zufällig');
console.log('  ✓ Zufallsbonus bleibt im Bereich und variiert');
// Nichts / Ungültiges: nichts passiert
reset();LOOT.cards[common.id]=1;LOOT.coins=9;assert.equal(sellCards({}),null);assert.equal(sellCards({[common.id]:5}),null,'einzelne Karte wird nicht verkauft');assert.equal(sellCards({nix:3}),null);assert.equal(LOOT.coins,9);assert.equal(LOOT.cards[common.id],1);
console.log('  ✓ Leere/ungültige Auswahl ändert nichts');
// Zu viel angegeben: wird auf das Verkaufbare gekürzt (nie unter die behaltene Karte)
LOOT.cards[common.id]=3;LOOT.coins=0;const r3=sellCards({[common.id]:99},lo);assert.equal(r3.n,2);assert.equal(LOOT.cards[common.id],1);
// „Alle Doppelten“ lässt Sonderitems im Beutel in Ruhe
reset();LOOT.cards[common.id]=3;LOOT.cards.drink=5;addItem('drink',5);const sd={};sellSelectDupes(sd);assert.equal(sd[common.id],2);assert(!('drink' in sd),'Items nicht automatisch');
// Item-Karte einzeln: verkauft aus dem Beutel, Sammlung bleibt
assert.equal(sellable('drink'),5);const ri=sellCards({drink:2},lo);assert.equal(ri.n,2);assert.equal(LOOT.items.drink,3);assert.equal(LOOT.cards.drink,5,'Sammlung der Item-Karte unverändert');
console.log('  ✓ Kürzung auf Verkaufbares; „Alle Doppelten“ ohne Items; Item-Karten aus dem Beutel');
console.log('Tausch-Tests bestanden');
