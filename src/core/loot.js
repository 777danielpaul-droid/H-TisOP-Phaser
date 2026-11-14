import{H,W}from'./config.js';

import{Story}from'./story.js';

import{card}from'../render/lootui.js';
import{SKINS,skinName}from'../render/skins.js';
import{Stage,THEMES,rnd}from'../render/stage.js';
// Beute: Booster-Packs (fallen im Story-Modus aus Gegnern), Coins (für einen späteren Shop), Sammelkarten, freischaltbare Skins.
// Alles im Browser gespeichert (localStorage 'hitisop.loot'). Rein logisch -> headless testbar.
export const KEY='hitisop.loot';
export const RARITY=[{n:'GEWÖHNLICH',c:'#b8c0e0'},{n:'SELTEN',c:'#5fd0ff'},{n:'EPISCH',c:'#ffb02e'}];
// r = Seltenheit (Index in RARITY). Neue Karten: hier eintragen.
export const CARDS=[
 {id:'larve',name:'Schwarm-Larve',r:0,txt:'Klein, aber hungrig.'},{id:'spaeher',name:'Mantis-Späher',r:0,txt:'Immer zuerst da.'},
 {id:'krieger',name:'Mantis-Krieger',r:0,txt:'Springt von allen Seiten.'},{id:'laterne',name:'Straßenlaterne',r:0,txt:'Das letzte Licht der Gasse.'},
 {id:'drink',name:'Energiedrink',r:0,txt:'Heilt 25 % Leben.'},{id:'wirbel',name:'Wirbel-Angriff',r:1,txt:'Trifft auch hinter ihm.'},
 {id:'tiger',name:'H!T',r:1,txt:'Wilder Brawler.'},{id:'st3g0',name:'ST3-G0',r:1,txt:'Panzer-Echse.'},{id:'kitsune',name:'KITSUNE',r:1,txt:'Neunschwanz-Fuchs.'},
 {id:'alpha',name:'Alpha-Mantis',r:2,txt:'Anführer des Schwarms.'},{id:'anubis',name:'ANUBIS',r:2,txt:'Wächter der Unterwelt.'},{id:'koenigin',name:'Schwarm-Königin',r:2,txt:'Niemand hat sie je gesehen.'}];
export const SKIN_POOL=[];for(const id of['tiger','st3g0','kitsune'])for(const k of[1,2,3])SKIN_POOL.push([id,k]);   // Zu Beginn hat jede Figur nur Farbe 0; alle weiteren Farben kommen nur aus Boostern
export const STAGE_NAMES=['NEON CITY','CRIMSON TEMPLE','TOXIC DOCKS','LABYRINTH'];   // Reihenfolge wie THEMES in render/stage.js; Stage 0 ist frei, alle weiteren kommen nur aus Boostern
export const STAGE_POOL=[1,2,3];
export const LOOT={packs:0,coins:0,cards:{},skins:{},stages:[]};
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&typeof d==='object')Object.assign(LOOT,{packs:d.packs|0,coins:d.coins|0,cards:d.cards||{},skins:d.skins||{},stages:Array.isArray(d.stages)?d.stages:[]})}catch(e){}
export const saveLoot=()=>{try{localStorage.setItem(KEY,JSON.stringify(LOOT))}catch(e){}};
export const ownsSkin=(id,k)=>k<1||(LOOT.skins[id]||[]).includes(k);   // nur Skin 0 ist frei
export const ownsStage=i=>i<1||LOOT.stages.includes(i);   // nur Stage 0 ist frei
export const ownedStages=n=>{const a=[];for(let i=0;i<n;i++)if(ownsStage(i))a.push(i);return a.length?a:[0]};
export const unlockAll=()=>{for(const[id,k]of SKIN_POOL)if(!ownsSkin(id,k))(LOOT.skins[id]=LOOT.skins[id]||[]).push(k);for(const i of STAGE_POOL)if(!ownsStage(i))LOOT.stages.push(i);saveLoot()};   // Test/Debug
export const addPack=(n=1)=>{LOOT.packs+=n;saveLoot()};
// Shop: Booster für Coins. Preise hier anpassen (Coins gibt es nur aus Boostern: ca. 35-40 pro Pack, daher kostet 1 Booster 100).
export const SHOP=[{n:1,price:100},{n:3,price:270},{n:5,price:425}];
export const canBuy=i=>!!SHOP[i]&&LOOT.coins>=SHOP[i].price;
export function buyPack(i){const o=SHOP[i];if(!o||LOOT.coins<o.price)return false;LOOT.coins-=o.price;LOOT.packs+=o.n;saveLoot();return true}
// Wertigkeit eines Preises 0..4 (steuert Aufdeck-Spannung und Feuerwerk in render/packopen.js):
// 0 wenig Coins · 1 viele Coins / gewöhnliche Karte · 2 seltene Karte · 3 neue Farbe oder Stage · 4 epische Karte (JACKPOT)
export const prizeTier=r=>!r?0:r.type==='coins'?(r.n>=35?1:0):r.type==='card'?[1,2,4][r.r]||1:3;
export const cardsOwned=()=>CARDS.filter(c=>LOOT.cards[c.id]>0).length;
export const pick=(a,rnd)=>a[Math.floor(rnd()*a.length)];
// Pro Booster höchstens EINE gute Belohnung (Tier >= 2: seltene/epische Karte, neue Farbe, neue Stage). Der Rest sind Coins und ab und zu ein gewöhnliches Sammelbild.
// Feinjustierung: GOOD_CHANCE = Wahrscheinlichkeit, dass ein Booster überhaupt etwas Gutes enthält; GOOD_MIX = Verteilung darunter; FILLER_COIN = Anteil Coins bei den übrigen Plätzen.
export const GOOD_CHANCE=.22,GOOD_MIX={epic:.15,rare:.40},FILLER_COIN=.78;   // GOOD_MIX: Rest (~45 %) = neue Farbe/Stage, solange es noch welche gibt
export const isGood=r=>prizeTier(r)>=2;
const mkCard=(c,rnd)=>({type:'card',id:c.id,name:c.name,r:c.r,isNew:!(LOOT.cards[c.id]>0)});
// Füllplatz: meist wenig Coins (6-26), selten ein dicker Coin-Treffer (35-50), sonst eine gewöhnliche Karte
export function rollFiller(rnd){
 if(rnd()<FILLER_COIN)return{type:'coins',n:rnd()<.08?35+Math.floor(rnd()*16):6+Math.floor(rnd()*21)};
 return mkCard(pick(CARDS.filter(c=>c.r===0),rnd),rnd)}
// Der seltene gute Platz: epische Karte, seltene Karte oder etwas Freischaltbares (Farben + Stages)
export function rollGood(rnd){const x=rnd(),card=r=>mkCard(pick(CARDS.filter(c=>c.r===r),rnd),rnd);
 if(x<GOOD_MIX.epic)return card(2);if(x<GOOD_MIX.epic+GOOD_MIX.rare)return card(1);
 const free=[...SKIN_POOL.filter(([id,k])=>!ownsSkin(id,k)).map(([id,k])=>['skin',id,k]),...STAGE_POOL.filter(i=>!ownsStage(i)).map(i=>['stage',i])];
 if(!free.length)return card(1);   // alles freigeschaltet -> seltene Karte
 const f=pick(free,rnd);if(f[0]==='stage')return{type:'stage',idx:f[1],name:STAGE_NAMES[f[1]],isNew:true};
 const[,id,k]=f;return{type:'skin',char:id,idx:k,name:skinName(id,k),col:SKINS[id][k].col,isNew:true}}
// Booster öffnen: 3 Belohnungen (meist Coins, ab und zu eine gewöhnliche Karte, selten EIN guter Treffer). null, wenn kein Booster da ist.
export function openPack(rnd=Math.random){if(LOOT.packs<1)return null;LOOT.packs--;const out=[],good=rnd()<GOOD_CHANCE,slot=Math.floor(rnd()*3);   // der gute Treffer (falls vorhanden) landet auf einem zufälligen Platz
 for(let i=0;i<3;i++){const r=good&&i===slot?rollGood(rnd):rollFiller(rnd);
  if(r.type==='coins')LOOT.coins+=r.n;else if(r.type==='card')LOOT.cards[r.id]=(LOOT.cards[r.id]|0)+1;else if(r.type==='stage')LOOT.stages.push(r.idx);else(LOOT.skins[r.char]=LOOT.skins[r.char]||[]).push(r.idx);
  out.push(r)}
 saveLoot();return out}
