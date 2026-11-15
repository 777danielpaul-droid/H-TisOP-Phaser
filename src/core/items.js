// Sonderitems aus den Booster-Packs (Sammelkarten, die zugleich benutzbare Gegenstände sind). Im Story-Modus mit Taste 1/2/3 benutzbar.
// Neuer Gegenstand: hier eintragen + gleichnamige Karte (gleiche id) in CARDS (core/loot.js). Rein logisch, kein DOM.
// kind 'heal' = v ist Anteil der Maximal-HP, kind 'meter' = v ist Hyper-Meter (Maximum ITEM_METER_MAX).
export const ITEM_METER_MAX=300;
export const ITEMS=[
 {id:'drink',name:'ENERGIEDRINK',short:'DRINK',info:'+25 % Leben',kind:'heal',v:.25,col:'#7dff9a'},
 {id:'elixir',name:'SCHATTENELIXIER',short:'ELIXIER',info:'+70 % Leben',kind:'heal',v:.7,col:'#b98bff'},
 {id:'crystal',name:'HYPER-KRISTALL',short:'KRISTALL',info:'+100 Hyper-Meter',kind:'meter',v:100,col:'#ffd23f'}];
export const itemOf=id=>ITEMS.find(i=>i.id===id)||null;
export const isItem=id=>!!itemOf(id);
// Hinweis, warum ein Gegenstand gerade nichts bringt (null = darf benutzt werden): so wird nie etwas verbraucht, das wirkungslos bliebe
export const itemBlock=(p,it)=>it.kind==='heal'?(p.hp>=p.maxHp?'LEBEN VOLL':null):(p.meter>=ITEM_METER_MAX?'METER VOLL':null);
