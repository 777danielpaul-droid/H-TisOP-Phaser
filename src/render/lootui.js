import{H,W}from'../core/config.js';
import{CARDS,LOOT,RARITY,SHOP,SKIN_POOL,STAGE_NAMES,STAGE_POOL,canBuy,cardsOwned,ownsSkin,ownsStage}from'../core/loot.js';

import{Story}from'../core/story.js';


import{skinName}from'./skins.js';
import{R}from'./sprites.js';
// Booster-Overlay (Taste B im Startmenü bzw. nach Story-Ende): Übersicht mit Sammlung, Booster öffnen mit Karten-Aufdeckung, Shop (Taste P / Button) zum Kaufen von Boostern für Coins.
// u = {open, mode:'main'|'reveal'|'shop', rewards, t, sel, msg, msgAt}  (Zustand liegt in renderer.lootUi, Tasten in main.js)
export const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
// Sammelkarten-Bild (window.__CARDS__[id], vom Build aus assets/cards/<id>.png|webp|jpg eingebettet); null, solange es fehlt oder lädt
export function cardImg(id){const S=typeof window!=='undefined'&&window.__CARDS__&&window.__CARDS__[id];if(!S||typeof Image==='undefined')return null;
 cardImg.c=cardImg.c||{};let im=cardImg.c[id];if(!im){im=cardImg.c[id]=new Image();im.src=S}return im.complete&&im.naturalWidth>0?im:null}
export function cover(g,im,x,y,w,h){const k=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);g.restore()}
export function card(g,hud,x,y,w,h,col,t1,t2,t3,flip=1,img=null){const fs=(b,s)=>Math.round(Math.min(b,w*1.85/Math.max(6,String(s).length)));g.save();g.translate(x+w/2,y+h/2);g.scale(Math.max(.02,Math.abs(flip)),1);const f=flip>=0;
 g.fillStyle=f?'#141028':'#2a1f5a';g.strokeStyle=f?col:'#8f7bff';g.lineWidth=3;g.shadowColor=f?col:'#8f7bff';g.shadowBlur=f?16:6;g.fillRect(-w/2,-h/2,w,h);g.strokeRect(-w/2,-h/2,w,h);g.shadowBlur=0;
 if(f&&img){cover(g,img,-w/2,-h/2,w,h);g.shadowBlur=0;const gr=g.createLinearGradient(0,h/2-h*.26,0,h/2);gr.addColorStop(0,'#04020a00');gr.addColorStop(1,'#04020aee');g.fillStyle=gr;g.fillRect(-w/2,h/2-h*.26,w,h*.26);g.strokeStyle=col;g.lineWidth=3;g.strokeRect(-w/2,-h/2,w,h);hud.txt(g,t1,0,h/2-h*.12,fs(h*.075,t1),'#ffffff','center',col);hud.txt(g,t2+(t3?'  ·  '+t3:''),0,h/2-h*.04,fs(h*.045,t2+(t3?'  ·  '+t3:'')),col,'center')}
 else if(f){hud.txt(g,t1,0,-h/2+h*.3,fs(h*.13,t1),'#ffffff','center',col);hud.txt(g,t2,0,0,fs(h*.09,t2),col,'center');hud.txt(g,t3,0,h/2-h*.12,fs(h*.08,t3),'#aab2e8','center')}
 else hud.txt(g,'?',0,10,Math.round(h*.3),'#8f7bff','center');g.restore()}

// Inhalt der Preis-Karte: Farbe, drei Textzeilen, id = Sammelkarten-Bild (falls vorhanden)
export function prizeFace(r){if(r.type==='coins')return{col:'#ffd23f',t1:'COINS',t2:'+'+r.n,t3:'für den Shop',id:null};
 if(r.type==='card')return{col:RARITY[r.r].c,t1:r.name,t2:RARITY[r.r].n,t3:r.isNew?'NEU!':'schon gesammelt',id:r.id};
 if(r.type==='stage')return{col:'#8f7bff',t1:'NEUE STAGE',t2:r.name,t3:'NEU · 2 Spieler / Melee',id:null};
 return{col:r.col,t1:r.char.toUpperCase()+' SKIN',t2:r.name,t3:'NEU · Taste C im Menü',id:null}}
// ---- Shop: Klickflächen (logische 960×540) ----
export const inR=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
export const shopCardRect=i=>{const w=220,h=250,gap=30,x0=W/2-(w*3+gap*2)/2;return{x:x0+i*(w+gap),y:128,w,h}};
export const shopBackRect=()=>({x:W/2-80,y:H-84,w:160,h:28});
export const shopSelRect=()=>({x:W-18-122-6-122-6-104,y:14,w:104,h:26});   // „SHOP“-Knopf im Startmenü, links neben dem Booster-Zähler
export const hitShopSel=(lx,ly)=>inR(shopSelRect(),lx,ly);
export const boosterRect=()=>({x:W-18-122-6-122,y:14,w:122,h:26});   // Booster-Zähler oben rechts (Klick = Booster-Übersicht)
export const lootOpenRect=()=>({x:W/2-196,y:H-62,w:186,h:26});
export const lootCloseRect=()=>({x:W/2+10,y:H-62,w:186,h:26});   // Booster-Übersicht: „Booster öffnen“ / „Schließen“ per Maus
export const shopBtnRect=()=>({x:W-168,y:16,w:150,h:28});   // „SHOP“-Knopf in der Booster-Übersicht
export function hitShopCard(lx,ly){for(let i=0;i<SHOP.length;i++)if(inR(shopCardRect(i),lx,ly))return i;return -1}
export const hitShopBack=(lx,ly)=>inR(shopBackRect(),lx,ly);
export const hitShopBtn=(lx,ly)=>inR(shopBtnRect(),lx,ly);
// Booster-Päckchen (Folie, Zacken oben/unten, Glanzstreifen); n = Anzahl gestapelter Päckchen (max. 3 sichtbar)
export function boosterArt(g,hud,cx,cy,w,h,col,n,tilt=0){const k=Math.min(3,n);
 for(let j=k-1;j>=0;j--){g.save();g.translate(cx+(j-(k-1)/2)*w*.44,cy+Math.abs(j-(k-1)/2)*4);g.rotate(tilt+(j-(k-1)/2)*.12);
  const x=-w/2,y=-h/2,z=6,gr=g.createLinearGradient(x,y,x+w,y+h);gr.addColorStop(0,'#fff3b0');gr.addColorStop(.35,col);gr.addColorStop(1,'#a05a10');
  g.shadowColor=col;g.shadowBlur=18;g.fillStyle=gr;g.beginPath();g.moveTo(x,y+z);for(let i=0;i<=8;i++)g.lineTo(x+w*i/8,y+(i%2?0:z));g.lineTo(x+w,y+h-z);for(let i=8;i>=0;i--)g.lineTo(x+w*i/8,y+h-(i%2?0:z));g.closePath();g.fill();g.shadowBlur=0;
  g.strokeStyle='#fff6';g.lineWidth=1.5;g.stroke();
  g.save();g.clip();g.fillStyle='#ffffff2a';g.beginPath();g.moveTo(x+w*.1,y);g.lineTo(x+w*.4,y);g.lineTo(x+w*.1,y+h);g.lineTo(x-w*.2,y+h);g.closePath();g.fill();g.restore();
  hud.txt(g,'H!T',0,6,Math.round(w*.3),'#3a1c00','center');hud.txt(g,'BOOSTER',0,h*.3,Math.round(w*.12),'#5a2e00','center');g.restore()}}
export function drawShop(g,hud,u){const sel=u.sel|0;
 SHOP.forEach((o,i)=>{const r=shopCardRect(i),on=i===sel,ok=canBuy(i),col=ok?'#ffd23f':'#7a6a40',cx=r.x+r.w/2;
  g.save();g.translate(cx,r.y+r.h/2);const sc=on?1.05+.012*Math.sin(u.t*.12):.97;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=on?1:.88;
  g.fillStyle='#141028';g.strokeStyle=on?'#ffffff':col;g.lineWidth=on?3:2;g.shadowColor=col;g.shadowBlur=on?24:8;g.fillRect(r.x,r.y,r.w,r.h);g.strokeRect(r.x,r.y,r.w,r.h);g.shadowBlur=0;
  boosterArt(g,hud,cx,r.y+88,66,92,ok?'#ffc830':'#a08a50',o.n,on?-.05:0);
  hud.txt(g,o.n===1?'1 BOOSTER':o.n+' BOOSTER',cx,r.y+170,19,'#ffffff','center',on?col:null);
  if(o.n>1)hud.txt(g,'SPARE '+Math.round((1-o.price/(o.n*SHOP[0].price))*100)+' %',cx,r.y+188,11,'#7dff9a','center');
  hud.txt(g,o.price+' COINS',cx,r.y+222,20,ok?'#7fe8ff':'#ff6f7f','center',ok&&on?'#7fe8ff':null);
  if(!ok)hud.txt(g,'noch '+(o.price-LOOT.coins)+' fehlen',cx,r.y+r.h-8,10,'#ff9aa6','center');
  g.restore()});
 const b=shopBackRect();hud.kPlate(g,b.x,b.y,b.w,b.h,{col:'#8f7bff',on:false,sk:8,t:u.t});hud.txt(g,'ZURÜCK',b.x+b.w/2+4,b.y+19,13,'#d6c8ff','center');
 const age=u.t-(u.msgAt==null?-999:u.msgAt);if(u.msg&&age<110){g.save();g.globalAlpha=Math.min(1,(110-age)/30);hud.txt(g,u.msg,W/2,H-112,20,u.msgOk?'#7dff9a':'#ff6f7f','center',u.msgOk?'#7dff9a':'#ff6f7f');g.restore()}
 hud.txt(g,'◀ ▶  wählen   ·   ENTER / Klick – kaufen   ·   ESC / P – zurück',W/2,H-34,14,'#ffffff','center')}
export function drawLoot(g,hud,u){if(!u||!u.open)return;u.t=(u.t||0)+1;
 g.save();g.globalAlpha=.88;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=1;
 if(u.mode==='reveal'&&u.po){u.po.draw(g,hud,u);g.restore();return}   // Booster aufreißen (render/packopen.js)
 hud.txt(g,u.mode==='shop'?'SHOP':'BOOSTER & SAMMLUNG',W/2,56,34,'#ffffff','center','#ffd23f');
 hud.txt(g,`BOOSTER: ${LOOT.packs}      COINS: ${LOOT.coins}      KARTEN: ${cardsOwned()}/${CARDS.length}`,W/2,88,15,'#ffd23f','center');
 if(u.mode==='shop')drawShop(g,hud,u);
 else if(u.mode==='reveal'&&u.rewards){const R=u.rewards,cw=210,ch=290,gap=34,x0=W/2-(cw*3+gap*2)/2;
  R.forEach((r,i)=>{const fl=Math.cos(cl((u.t-i*18)/20,0,1)*Math.PI),x=x0+i*(cw+gap),y=130;
   if(r.type==='coins')card(g,hud,x,y,cw,ch,'#ffd23f','COINS','+'+r.n,'für den Shop',fl);
   else if(r.type==='card')card(g,hud,x,y,cw,ch,RARITY[r.r].c,r.name,RARITY[r.r].n,r.isNew?'NEU!':'schon gesammelt',fl,cardImg(r.id));
   else if(r.type==='stage')card(g,hud,x,y,cw,ch,'#8f7bff','NEUE STAGE',r.name,'NEU – im 2-Spieler/Melee-Menü',fl);
   else card(g,hud,x,y,cw,ch,r.col,r.char.toUpperCase()+' SKIN',r.name,'NEU – Farbe im Menü mit C',fl)});
  if(u.t>70)hud.txt(g,LOOT.packs>0?`ENTER – weiter (noch ${LOOT.packs} Booster)`:'ENTER – weiter',W/2,H-34,15,'#ffffff','center')}
 else{const cols=6,cw=112,ch=152,gx=10,x0=W/2-(cols*cw+(cols-1)*gx)/2,y0=104;
  CARDS.forEach((c,i)=>{const x=x0+(i%cols)*(cw+gx),y=y0+Math.floor(i/cols)*(ch+gx),n=LOOT.cards[c.id]|0,col=RARITY[c.r].c,im=n?cardImg(c.id):null;
   g.fillStyle='#10102a';g.strokeStyle=n?col:'#2a2a50';g.lineWidth=2;g.fillRect(x,y,cw,ch);
   if(im){cover(g,im,x,y,cw,ch);const gr=g.createLinearGradient(0,y+ch-40,0,y+ch);gr.addColorStop(0,'#04020a00');gr.addColorStop(1,'#04020aee');g.fillStyle=gr;g.fillRect(x,y+ch-40,cw,40);hud.txt(g,c.name,x+cw/2,y+ch-18,10,'#ffffff','center');hud.txt(g,'x'+n,x+cw-14,y+14,11,'#ffffff','center',col)}
   else if(n){hud.txt(g,c.name,x+cw/2,y+ch*.38,12,'#ffffff','center');hud.txt(g,RARITY[c.r].n,x+cw/2,y+ch*.38+20,9,col,'center');hud.txt(g,'x'+n,x+cw/2,y+ch-18,11,'#aab2e8','center')}
   else hud.txt(g,'?',x+cw/2,y+ch*.6,30,'#2a2a50','center');
   g.strokeRect(x,y,cw,ch)});
  const own=SKIN_POOL.filter(([id,k])=>ownsSkin(id,k)).map(([id,k])=>id.toUpperCase()+' '+skinName(id,k));
  hud.txt(g,'FARBEN: '+(own.length?own.join(' · '):'noch keine – Booster bringen neue Farben'),W/2,y0+2*(ch+gx)+18,12,'#c9d0ff','center');
  const ow2=STAGE_POOL.filter(i=>ownsStage(i)).map(i=>STAGE_NAMES[i]);hud.txt(g,'STAGES: NEON CITY'+(ow2.length?' · '+ow2.join(' · '):'')+'   ('+(1+ow2.length)+'/'+(1+STAGE_POOL.length)+')',W/2,y0+2*(ch+gx)+38,12,'#c9d0ff','center');
  {const b=shopBtnRect();hud.kPlate(g,b.x,b.y,b.w,b.h,{col:'#ffd23f',on:true,sk:8,t:u.t});hud.txt(g,'P – SHOP',b.x+b.w/2+4,b.y+19,13,'#ffffff','center','#ffd23f')}
  {const o=lootOpenRect(),c=lootCloseRect(),pk=LOOT.packs>0;
   hud.kPlate(g,o.x,o.y,o.w,o.h,{col:pk?'#ffd23f':'#6a6a80',on:pk,sk:8,t:u.t});hud.txt(g,'BOOSTER ÖFFNEN',o.x+o.w/2+4,o.y+19,13,pk?'#ffffff':'#8a8aa0','center',pk?'#ffd23f':null);
   hud.kPlate(g,c.x,c.y,c.w,c.h,{col:'#8f7bff',on:false,sk:8,t:u.t});hud.txt(g,'SCHLIESSEN',c.x+c.w/2+4,c.y+19,13,'#d6c8ff','center')}
  hud.txt(g,LOOT.packs>0?'ENTER – Booster öffnen   ·   P – Shop   ·   B / ESC – schließen   ·   Rechtsklick – schließen':'Keine Booster – besiege Mantis im Story-Modus oder kaufe welche im Shop (P)   ·   B / ESC – schließen',W/2,H-16,12,'#ffffff','center')}
 g.restore()}
