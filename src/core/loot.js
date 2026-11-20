import{CHARACTERS,ROSTER,unlockChar}from'./characters.js';
import{isItem}from'./items.js';
import{loadUnlocks}from'./unlocks.js';


import{SKINS,skinName}from'../render/skins.js';
// Beute: Booster-Packs (fallen im Story-Modus aus Gegnern), Coins (für einen späteren Shop), Sammelkarten, freischaltbare Skins.
// Alles im Browser gespeichert (localStorage 'hitisop.loot'). Rein logisch -> headless testbar.
export const KEY='hitisop.loot';
export const RARITY=[{n:'GEWÖHNLICH',c:'#b8c0e0'},{n:'SELTEN',c:'#5fd0ff'},{n:'EPISCH',c:'#ffb02e'}];
// r = Seltenheit (Index in RARITY). Neue Karten: hier eintragen.
export const CARDS=[
 {id:'larve',name:'Schwarm-Larve',r:0,txt:'Klein, aber hungrig.'},{id:'spaeher',name:'Mantis-Späher',r:0,txt:'Immer zuerst da.'},
 {id:'krieger',name:'Mantis-Krieger',r:0,txt:'Springt von allen Seiten.'},{id:'drink',s:'DRINK',name:'Energiedrink',r:0,txt:'Heilt 25 % Leben. Story: Taste 1.'},{id:'wirbel',name:'Wirbel-Angriff',r:1,txt:'Trifft auch hinter ihm.'},
 {id:'tiger',name:'H!T',r:1,txt:'Wilder Brawler.'},{id:'st3g0',name:'ST3-G0',r:1,txt:'Panzer-Echse.'},{id:'kitsune',name:'KITSUNE',r:1,txt:'Neunschwanz-Fuchs.'},
 {id:'alpha',name:'Alpha-Mantis',r:2,txt:'Anführer des Schwarms.'},{id:'anubis',name:'ANUBIS',r:2,txt:'Wächter der Unterwelt.'},{id:'koenigin',name:'Schwarm-Königin',r:2,txt:'Niemand hat sie je gesehen.'},
 {id:'sichel',name:'Schattensichel',r:1,txt:'Ein violetter Bogen aus Nacht.'},{id:'schwarm',name:'Rabenschwarm',r:1,txt:'Hyper: Der Schwarm stürmt vor.'},
 {id:'blutrausch',name:'Blutrausch',r:1,txt:'Klauenhagel mit beiden Händen.'},{id:'blitz',name:'Blitz-Kamehameha',r:1,txt:'Hyper: Ein Blitz, ein Strahl.'},
 {id:'korvus',name:'KORVUS',r:2,txt:'Rabenfürst mit Sichel.'},{id:'cyberdemon',name:'A1LIEN',r:2,txt:'Glühende Klauen aus der Tiefe.'},
 {id:'elixir',s:'ELIXIR',name:'Schattenelixier',r:1,txt:'Heilt 70 % Leben. Story: Taste 2.'},{id:'crystal',s:'KRISTALL',name:'Hyper-Kristall',r:1,txt:'+100 Hyper-Meter. Story: Taste 3.'},
 // --- Attacken-, Hyper- und Siegerposen-Karten (Bilder: tools/make-cards.py) ---
 {id:'tigerklaue',name:'Tigerklaue',r:1,txt:'Special: Aufwärtshaken mit Wirbel.'},{id:'flugtritt',name:'Flugtritt',r:0,txt:'Der Tritt kommt aus der Luft.'},
 {id:'siegesbruell',name:'Siegesbrüller',r:1,txt:'H!T brüllt nach dem K.O.'},{id:'blitzladung',name:'Blitz-Ladung',r:1,txt:'Hyper: Die Energie sammelt sich.'},
 {id:'tiger_sieg',name:'H!T: Siegerpose',r:2,txt:'Muskeln raus, Runde vorbei.'},
 {id:'feueratem',name:'Feuer-Atem',r:1,txt:'Special: ST3-G0 speit Feuer.'},{id:'drachenuppercut',name:'Drachen-Uppercut',r:1,txt:'Aufwärtshaken mit Staubwolke.'},
 {id:'klauenhieb',name:'Klauenhieb',r:0,txt:'Schwerer Schlag der Panzer-Echse.'},{id:'drachenfluegel',name:'Drachenflügel',r:2,txt:'ST3-G0: Siegerpose in Jade-Licht.'},
 {id:'fuchsfeuer',name:'Fuchsfeuer',r:1,txt:'Special: Eine Welle aus Fuchsfeuer.'},{id:'neunschwanz',name:'Neunschwanz-Inferno',r:2,txt:'Hyper: Alle neun Schwänze lodern.'},
 {id:'meditation',name:'Meditation der Neun',r:1,txt:'KITSUNE: Siegerpose im Schneidersitz.'},{id:'fuchssprung',name:'Fuchs-Sprungtritt',r:0,txt:'Schnell wie ein Blitz.'},
 {id:'fuchshieb',name:'Fuchshieb',r:0,txt:'Schwerer Schlag mit Schwung.'},
 {id:'seelenwelle',name:'Seelenwelle',r:1,txt:'Special: ANUBIS schickt eine Welle.'},{id:'goldsichel',name:'Goldene Sichel',r:1,txt:'Ein Schwung mit goldener Spur.'},
 {id:'goldtritt',name:'Goldtritt',r:0,txt:'Hoher Tritt mit Goldspur.'},{id:'schakalblock',name:'Schakal-Block',r:0,txt:'Nichts kommt an der Wache vorbei.'},
 {id:'rabendornen',name:'Raben-Dornen',r:1,txt:'Hyper: Dornen aus Nacht am Boden.'},{id:'korvus_sieg',name:'KORVUS: Siegerpose',r:2,txt:'Brüllen und Power-Pose.'},
 {id:'fluegelsprung',name:'Flügelsprung',r:1,txt:'Violette Flügel, weit gespreizt.'},
 {id:'klauenwelle',name:'Klauenwelle',r:1,txt:'Special: Rote Welle aus Klauen.'},{id:'gegenhand',name:'Gegenhand-Hieb',r:1,txt:'Der zweite Hieb sitzt härter.'},
 {id:'daemonenatem',name:'Atem des Kerns',r:0,txt:'Er atmet. Das reicht.'}];
// Reihenfolge im Reward Vault (Sammlung + Tausch-Modus): nach Figur gruppiert. Je Figur zuerst die Charakterkarte, dann Normals, Specials, Hypers, Siegerpose
// (Figur = Sprite-Ordner der Karte in tools/make-cards.py). Danach Karten ohne Eintrag, ganz hinten die Sonderitems. Neue Karte: id hier an der passenden Stelle eintragen.
export const CARD_ORDER=[
 'tiger','wirbel','flugtritt','tigerklaue','blitz','blitzladung','siegesbruell','tiger_sieg',                         // H!T
 'st3g0','klauenhieb','drachenuppercut','feueratem','drachenfluegel',                                                 // ST3-G0
 'kitsune','fuchshieb','fuchssprung','fuchsfeuer','neunschwanz','meditation',                                         // KITSUNE
 'anubis','goldtritt','schakalblock','goldsichel','seelenwelle',                                                      // ANUBIS
 'korvus','fluegelsprung','sichel','schwarm','rabendornen','korvus_sieg',                                             // KORVUS
 'cyberdemon','gegenhand','blutrausch','klauenwelle','daemonenatem',                                                  // A1LIEN
 'larve','spaeher','krieger','alpha','koenigin'];                                                                     // Mantis-Schwarm
{const rank=c=>{const i=CARD_ORDER.indexOf(c.id);return i>=0?i:isItem(c.id)?2e6:1e6};CARDS.sort((a,b)=>rank(a)-rank(b))}   // stabil: Karten mit gleichem Rang behalten ihre Reihenfolge; Sammlung speichert nach id, die Sortierung ändert keinen Spielstand
export const SKIN_POOL=[];for(const id of['tiger','st3g0','kitsune','leon'])for(const k of[1,2,3])SKIN_POOL.push([id,k]);   // Zu Beginn hat jede Figur nur Farbe 0; alle weiteren Farben kommen nur aus Boostern
export const STAGE_NAMES=['NEON CITY','CRIMSON TEMPLE','TOXIC DOCKS','LABYRINTH'];   // Reihenfolge wie THEMES in render/stage.js; Stage 0 ist frei, alle weiteren kommen nur aus Boostern
export const STAGE_POOL=[1,2,3];
export const LOOT={packs:0,coins:0,cards:{},skins:{},stages:[],items:{}};   // items = benutzbare Sonderitems im Beutel (Anzahl je id, siehe core/items.js)
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&typeof d==='object'){Object.assign(LOOT,{packs:d.packs|0,coins:d.coins|0,cards:d.cards||{},skins:d.skins||{},stages:Array.isArray(d.stages)?d.stages:[]});
 if(d.items&&typeof d.items==='object')LOOT.items=d.items;else for(const id of Object.keys(LOOT.cards))if(isItem(id))LOOT.items[id]=LOOT.cards[id]|0}}catch(e){}   // alter Spielstand ohne Beutel: schon gesammelte Item-Karten werden zu benutzbaren Items
export const saveLoot=()=>{try{localStorage.setItem(KEY,JSON.stringify(LOOT))}catch(e){}};
export const ownsSkin=(id,k)=>k<1||(LOOT.skins[id]||[]).includes(k);   // nur Skin 0 ist frei
export const ownsStage=i=>i<1||LOOT.stages.includes(i);   // nur Stage 0 ist frei
export const ownedStages=n=>{const a=[];for(let i=0;i<n;i++)if(ownsStage(i))a.push(i);return a.length?a:[0]};
export const unlockAll=()=>{for(const[id,k]of SKIN_POOL)if(!ownsSkin(id,k))(LOOT.skins[id]=LOOT.skins[id]||[]).push(k);for(const i of STAGE_POOL)if(!ownsStage(i))LOOT.stages.push(i);saveLoot()};   // Test/Debug
export const itemCount=id=>LOOT.items[id]|0;
export const addItem=(id,n=1)=>{if(!isItem(id))return false;LOOT.items[id]=itemCount(id)+n;saveLoot();return true};
export const takeItem=id=>{if(itemCount(id)<1)return false;LOOT.items[id]--;saveLoot();return true};   // genau ein Stück verbrauchen; leer -> false, nichts passiert
export const addPack=(n=1)=>{LOOT.packs+=n;saveLoot()};
// Shop: Booster für Coins. Preise hier anpassen (Coins gibt es nur aus Boostern: ca. 35-40 pro Pack, daher kostet 1 Booster 100).
export const SHOP=[{n:1,price:100},{n:3,price:270},{n:5,price:425}];
// Kämpfer im Shop (Karte hinter den Boostern): EIN dauerhafter Kauf je Figur, danach in der Charakterwahl spielbar (Freischaltung in unlocks.js, Münzen in LOOT.coins).
// >>> PREIS HIER ÄNDERN <<< (Testpreis 10 Coins; später einfach die Zahl erhöhen – Shop-Karte, Händler-Dialog und Kauflogik lesen ausschließlich diesen Wert).
export const CHAR_PRICE={rabe:10,cyberdemon:150,st3g0:150,leon:150,anubis:200,bear:250};   // ST3-G0 gibt es alternativ gratis nach 3 Durchläufen, ANUBIS nach 4, URSUS (Bär) nach 5 Durchläufen (CLEAR_UNLOCKS in characters.js), LEON nach 1x Story durchspielen (Kapitel 5)
// Voraussetzung, damit ein Kämpfer im Shop gekauft werden darf (Flag in 'hitisop.unlocks'). A1LIEN (cyberdemon): erst nach dem Ende von Kapitel 3 (Flag 'storydone3', gesetzt in arcade.js). Zum Testen: Seite mit ?unlock=storydone3 öffnen.
export const CHAR_REQ={cyberdemon:{flag:'storydone3',txt:'Schließe Kapitel 3 ab'}};
export const charReqMet=id=>!CHAR_REQ[id]||loadUnlocks().includes(CHAR_REQ[id].flag);
export const CHAR_SHOP=Object.keys(CHAR_PRICE).map(id=>({id,price:CHAR_PRICE[id]}));
export const shopCount=()=>SHOP.length+CHAR_SHOP.length;   // Karten im Shop: erst die Booster (Index 0..SHOP.length-1), dann die Kämpfer
export const charPrice=id=>CHAR_PRICE[id]|0;
export const ownsChar=id=>ROSTER.includes(id);   // spielbar = freigeschaltet (Browser-Speicher 'hitisop.unlocks')
export const canBuyChar=id=>charPrice(id)>0&&!!CHARACTERS[id]&&!ownsChar(id)&&charReqMet(id)&&LOOT.coins>=charPrice(id);
// Kämpfer kaufen: erst freischalten + speichern, dann Münzen abbuchen (so wird nie bezahlt, ohne freizuschalten). Doppelkauf unmöglich: schon besessen -> false, keine Abbuchung. Voraussetzung (CHAR_REQ) nicht erfüllt -> false.
export function buyChar(id){if(!charPrice(id)||!CHARACTERS[id]||ownsChar(id)||!charReqMet(id)||LOOT.coins<charPrice(id))return false;
 unlockChar(id);if(!ownsChar(id))return false;LOOT.coins-=charPrice(id);saveLoot();return true}
export const canBuy=i=>!!SHOP[i]&&LOOT.coins>=SHOP[i].price;
export function buyPack(i){const o=SHOP[i];if(!o||LOOT.coins<o.price)return false;LOOT.coins-=o.price;LOOT.packs+=o.n;saveLoot();return true}
// Karten gegen Coins tauschen (Modus 'sell' im Booster-Overlay): je Karte ein Mindestbetrag nach Seltenheit + ein Zufallsbonus 0..SELL_BONUS.
// >>> WERTE HIER ÄNDERN <<< (Index = Seltenheit: gewöhnlich, selten, episch). Zum Vergleich: 1 Booster kostet 100 Coins und bringt ca. 35-40.
// Verkaufbar sind nur Doppelte (SELL_KEEP Stück bleiben immer in der Sammlung) und Sonderitems im Beutel (LOOT.items); die Sammlung selbst (LOOT.cards) bleibt bei Items unangetastet.
export const SELL_MIN=[3,10,30],SELL_BONUS=[4,10,25],SELL_KEEP=1;
export const cardOf=id=>CARDS.find(c=>c.id===id)||null;
export const sellable=id=>{const c=cardOf(id);if(!c)return 0;return isItem(id)?Math.max(0,itemCount(id)):Math.max(0,(LOOT.cards[id]|0)-SELL_KEEP)};
// Auswahl {id:anzahl}: Anzahl der Karte um d ändern, begrenzt auf 0..sellable; gibt die neue Anzahl zurück
export function sellAdjust(sel,id,d){const n=Math.max(0,Math.min(sellable(id),(sel[id]|0)+d));if(n)sel[id]=n;else delete sel[id];return n}
// „Alle Doppelten“: jede Nicht-Item-Karte mit Überschuss komplett wählen (Sonderitems aus dem Beutel bleiben bewusst draußen)
export function sellSelectDupes(sel){for(const k of Object.keys(sel))delete sel[k];for(const c of CARDS)if(!isItem(c.id)&&sellable(c.id)>0)sel[c.id]=sellable(c.id);return sel}
// Vorschau: Anzahl Karten, Mindestbetrag und größtmöglicher Bonus der aktuellen Auswahl
export function sellPreview(sel){let n=0,min=0,bonus=0;for(const id of Object.keys(sel||{})){const c=cardOf(id),k=c?Math.min(sel[id]|0,sellable(id)):0;if(k<1)continue;n+=k;min+=SELL_MIN[c.r]*k;bonus+=SELL_BONUS[c.r]*k}return{n,min,bonus}}
// Verkaufen: zieht die Karten ab, schreibt Mindestbetrag + Zufallsbonus gut und speichert. Nichts Verkaufbares gewählt -> null (nichts passiert).
export function sellCards(sel,rnd=Math.random){const take=[];for(const id of Object.keys(sel||{})){const c=cardOf(id),k=c?Math.min(sel[id]|0,sellable(id)):0;if(k>0)take.push([c,k])}
 let n=0,base=0,bonus=0,maxBonus=0;
 for(const[c,k]of take){for(let i=0;i<k;i++){base+=SELL_MIN[c.r];maxBonus+=SELL_BONUS[c.r];bonus+=Math.floor(rnd()*(SELL_BONUS[c.r]+1))}n+=k;
  if(isItem(c.id))LOOT.items[c.id]=itemCount(c.id)-k;else LOOT.cards[c.id]=(LOOT.cards[c.id]|0)-k}
 if(!n)return null;LOOT.coins+=base+bonus;saveLoot();return{n,base,bonus,maxBonus,total:base+bonus}}
// Wertigkeit eines Preises 0..4 (steuert Aufdeck-Spannung und Feuerwerk in render/packopen.js):
// 0 wenig Coins · 1 viele Coins / gewöhnliche Karte · 2 seltene Karte · 3 neue Farbe oder Stage · 4 epische Karte (JACKPOT)
export const prizeTier=r=>!r?0:r.type==='coins'?(r.n>=35?1:0):r.type==='card'?[1,2,4][r.r]||1:3;
export const cardsOwned=()=>CARDS.filter(c=>LOOT.cards[c.id]>0).length;
export const pick=(a,rnd)=>a[Math.floor(rnd()*a.length)];
// Pro Booster höchstens EINE gute Belohnung (Tier >= 2: seltene/epische Karte, neue Farbe, neue Stage). Der Rest sind Coins und ab und zu ein gewöhnliches Sammelbild.
// Feinjustierung: GOOD_CHANCE = Wahrscheinlichkeit, dass ein Booster überhaupt etwas Gutes enthält; GOOD_MIX = Verteilung darunter; FILLER_COIN = Anteil Coins bei den übrigen Plätzen.
// >>> TESTMODUS (14.11.2026): Drops absichtlich hochgeschraubt, damit Karten/Booster schnell geprüft werden können. <<<
// Originalwerte fürs fertige Spiel: GOOD_CHANCE=.22, GOOD_MIX={epic:.15,rare:.40}, FILLER_COIN=.78
export const ITEM_FILLER=.3,ITEM_GOOD=.35;   // Anteil Sonderitems an den Karten-Füllplätzen (Rest: gewöhnliche Karten)
export const GOOD_CHANCE=.9,GOOD_MIX={epic:.4,rare:.5},FILLER_COIN=.45;   // GOOD_MIX: Rest (~45 %) = neue Farbe/Stage, solange es noch welche gibt
export const isGood=r=>prizeTier(r)>=2;
const mkCard=(c,rnd)=>({type:'card',id:c.id,name:c.name,r:c.r,isNew:!(LOOT.cards[c.id]>0),item:isItem(c.id)});   // item: Karte ist zugleich ein benutzbares Story-Item
// Füllplatz: meist wenig Coins (6-26), selten ein dicker Coin-Treffer (35-50), sonst eine gewöhnliche Karte
export function rollFiller(rnd){
 if(rnd()<FILLER_COIN)return{type:'coins',n:rnd()<.08?35+Math.floor(rnd()*16):6+Math.floor(rnd()*21)};
 if(rnd()<ITEM_FILLER)return mkCard(pick(CARDS.filter(c=>c.r===0&&isItem(c.id)),rnd),rnd);   // gewöhnliches Sonderitem (Energydrink) – benutzbar im Story-Modus
 return mkCard(pick(CARDS.filter(c=>c.r===0&&!isItem(c.id)),rnd),rnd)}
// Der seltene gute Platz: epische Karte, seltene Karte oder etwas Freischaltbares (Farben + Stages)
export function rollGood(rnd){const x=rnd(),card=r=>{let pool=CARDS.filter(c=>c.r===r);if(r===1){const it=pool.filter(c=>isItem(c.id)),rest=pool.filter(c=>!isItem(c.id));if(it.length&&rest.length)pool=rnd()<ITEM_GOOD?it:rest}return mkCard(pick(pool,rnd),rnd)};   // seltene Karte: zu ITEM_GOOD ein Sonderitem (Elixier, Hyper-Kristall)
 if(x<GOOD_MIX.epic)return card(2);if(x<GOOD_MIX.epic+GOOD_MIX.rare)return card(1);
 const free=[...SKIN_POOL.filter(([id,k])=>!ownsSkin(id,k)).map(([id,k])=>['skin',id,k]),...STAGE_POOL.filter(i=>!ownsStage(i)).map(i=>['stage',i])];
 if(!free.length)return card(1);   // alles freigeschaltet -> seltene Karte
 const f=pick(free,rnd);if(f[0]==='stage')return{type:'stage',idx:f[1],name:STAGE_NAMES[f[1]],isNew:true};
 const[,id,k]=f;return{type:'skin',char:id,idx:k,name:skinName(id,k),col:SKINS[id][k].col,isNew:true}}
// Booster öffnen: 3 Belohnungen (meist Coins, ab und zu eine gewöhnliche Karte, selten EIN guter Treffer). null, wenn kein Booster da ist.
// GUARANTEED_CARD: jeder Booster enthält mindestens EINE Sammelkarte (Testmodus; fürs fertige Spiel auf false stellen).
export const GUARANTEED_CARD=true;
export function openPack(rnd=Math.random){if(LOOT.packs<1)return null;LOOT.packs--;const good=rnd()<GOOD_CHANCE,slot=Math.floor(rnd()*3);   // der gute Treffer (falls vorhanden) landet auf einem zufälligen Platz
 const out=[];for(let i=0;i<3;i++)out.push(good&&i===slot?rollGood(rnd):rollFiller(rnd));
 if(GUARANTEED_CARD&&!out.some(r=>r.type==='card')){   // keine Karte dabei -> einen Coin-Platz zur Karte machen (höchstens EINE gute Belohnung bleibt erhalten)
  const k=out.findIndex(r=>!isGood(r)),at=k<0?slot:k,hasGood=out.some((r,i)=>i!==at&&isGood(r));
  if(!hasGood){const x=rnd(),c=pick(CARDS.filter(c=>c.r===(x<GOOD_MIX.epic/(GOOD_MIX.epic+GOOD_MIX.rare)?2:1)),rnd);out[at]=mkCard(c,rnd)}
  else out[at]=mkCard(pick(CARDS.filter(c=>c.r===0),rnd),rnd)}
 for(const r of out){if(r.type==='coins')LOOT.coins+=r.n;else if(r.type==='card'){LOOT.cards[r.id]=(LOOT.cards[r.id]|0)+1;if(r.item)LOOT.items[r.id]=itemCount(r.id)+1}else if(r.type==='stage')LOOT.stages.push(r.idx);else(LOOT.skins[r.char]=LOOT.skins[r.char]||[]).push(r.idx)}
 saveLoot();return out}
