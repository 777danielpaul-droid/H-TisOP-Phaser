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
export function rollOne(rnd){const x=rnd();
 if(x<.5)return{type:'coins',n:10+Math.floor(rnd()*31)};
 if(x<.85){const rr=rnd(),r=rr<.6?0:rr<.9?1:2,c=pick(CARDS.filter(c=>c.r===r),rnd);return{type:'card',id:c.id,name:c.name,r:c.r,isNew:!(LOOT.cards[c.id]>0)}}
 const free=[...SKIN_POOL.filter(([id,k])=>!ownsSkin(id,k)).map(([id,k])=>['skin',id,k]),...STAGE_POOL.filter(i=>!ownsStage(i)).map(i=>['stage',i])];   // Freischaltbares: Farben + Stages
 if(!free.length)return{type:'coins',n:50};
 const f=pick(free,rnd);if(f[0]==='stage')return{type:'stage',idx:f[1],name:STAGE_NAMES[f[1]],isNew:true};
 const[,id,k]=f;return{type:'skin',char:id,idx:k,name:skinName(id,k),col:SKINS[id][k].col,isNew:true}}
// Booster öffnen: 3 Belohnungen (Coins / Karte / Skin). null, wenn kein Booster da ist.
export function openPack(rnd=Math.random){if(LOOT.packs<1)return null;LOOT.packs--;const out=[];
 for(let i=0;i<3;i++){let r=rollOne(rnd);
  if((r.type==='skin'&&out.some(o=>o.type==='skin'&&o.char===r.char&&o.idx===r.idx))||(r.type==='stage'&&out.some(o=>o.type==='stage'&&o.idx===r.idx)))r={type:'coins',n:50};
  if(r.type==='coins')LOOT.coins+=r.n;else if(r.type==='card')LOOT.cards[r.id]=(LOOT.cards[r.id]|0)+1;else if(r.type==='stage')LOOT.stages.push(r.idx);else(LOOT.skins[r.char]=LOOT.skins[r.char]||[]).push(r.idx);
  out.push(r)}
 saveLoot();return out}
