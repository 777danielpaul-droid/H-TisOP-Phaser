import{H,W}from'../core/config.js';
import{CHARACTERS}from'../core/characters.js';
import{isItem}from'../core/items.js';
import{CARDS,CHAR_REQ,CHAR_SHOP,LOOT,RARITY,SHOP,SKIN_POOL,STAGE_NAMES,STAGE_POOL,canBuy,canBuyChar,cardsOwned,charReqMet,ownsChar,ownsSkin,ownsStage,sellPreview,sellable,shopCount}from'../core/loot.js';
import{drawFrameScaled,drawFullFrame,groupScale}from'./sprites.js';



import{skinName}from'./skins.js';
// Booster-Overlay (Taste B im Startmenü bzw. nach Story-Ende): Übersicht mit Sammlung, Booster öffnen mit Karten-Aufdeckung, Shop (Taste P / Button) zum Kaufen von Boostern für Coins.
// u = {open, mode:'main'|'reveal'|'shop'|'sell' (Karten gegen Coins tauschen; u.sell = {kartenId:anzahl}), rewards, t, sel, msg, msgAt}  (Zustand liegt in renderer.lootUi, Tasten in main.js)
export const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
// Sammelkarten-Bild (window.__CARDS__[id], vom Build aus assets/cards/<id>.png|webp|jpg eingebettet); null, solange es fehlt oder lädt
export function cardImg(id){const S=typeof window!=='undefined'&&window.__CARDS__&&window.__CARDS__[id];if(!S||typeof Image==='undefined')return null;
 cardImg.c=cardImg.c||{};let im=cardImg.c[id];if(!im){im=cardImg.c[id]=new Image();im.src=S}return im.complete&&im.naturalWidth>0?im:null}
export function cover(g,im,x,y,w,h){const k=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*k,dh=im.naturalHeight*k;g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);g.restore()}
// Abgerundetes Rechteck (Pfad) – Sammelkarten haben runde statt abgeschnittene Ecken
function rr(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.arcTo(x+w,y,x+w,y+r,r);g.lineTo(x+w,y+h-r);g.arcTo(x+w,y+h,x+w-r,y+h,r);g.lineTo(x+r,y+h);g.arcTo(x,y+h,x,y+h-r,r);g.lineTo(x,y+r);g.arcTo(x,y,x+r,y,r);g.closePath()}
export function card(g,hud,x,y,w,h,col,t1,t2,t3,flip=1,img=null){
 const fs=(b,s)=>Math.round(Math.min(b,w*1.65/Math.max(6,String(s).length)));g.save();g.translate(x+w/2,y+h/2);g.scale(Math.max(.025,Math.abs(flip)),1);const front=flip>=0,bx=-w/2,by=-h/2;const bk=front?null:cardImg('back');   // Rückseite: assets/cards/back.webp (tools/make-cardback.py); fehlt das Bild, bleibt die alte Text-Rückseite
 // Machined card chassis, raised outer lip and deep black-glass inset.
 g.shadowColor=front?col:bk?'#a56bff':'#6a9aa8';g.shadowBlur=front?18:8;g.fillStyle='#03080d';rr(g,bx,by,w,h,10);g.fill();g.shadowBlur=0;
 const shell=g.createLinearGradient(bx,by,bx+w,by+h);shell.addColorStop(0,'#b9d1d5');shell.addColorStop(.12,'#354a52');shell.addColorStop(.42,'#0b151c');shell.addColorStop(.78,'#24363e');shell.addColorStop(1,'#050b10');g.fillStyle=shell;rr(g,bx+2,by+2,w-4,h-4,8);g.fill();
 g.strokeStyle=front?col:'rgba(171,214,222,.55)';g.lineWidth=1.2;rr(g,bx+3,by+3,w-6,h-6,7);g.stroke();
 g.save();rr(g,bx+7,by+7,w-14,h-14,4);g.clip();const well=g.createLinearGradient(0,by+7,0,by+h-7);well.addColorStop(0,'#142630');well.addColorStop(.4,'#061018');well.addColorStop(1,'#020609');g.fillStyle=well;g.fillRect(bx+7,by+7,w-14,h-14);
 if(front&&img){cover(g,img,bx+8,by+8,w-16,h-16);const fade=g.createLinearGradient(0,by+h*.55,0,by+h*.86);fade.addColorStop(0,'#02060900');fade.addColorStop(1,'#020609ee');g.fillStyle=fade;g.fillRect(bx+8,by+h*.55,w-16,h*.31)}
 const sheen=g.createLinearGradient(bx,by,bx+w,by+h);sheen.addColorStop(0,'rgba(255,255,255,.16)');sheen.addColorStop(.22,'rgba(255,255,255,.025)');sheen.addColorStop(.52,'rgba(90,224,235,.035)');sheen.addColorStop(1,'rgba(0,0,0,.22)');g.fillStyle=sheen;g.fillRect(bx+7,by+7,w-14,h-14);
 g.restore();
 if(bk){g.save();rr(g,bx+2,by+2,w-4,h-4,8);g.clip();g.drawImage(bk,bx+2,by+2,w-4,h-4);g.restore()}   // Rückseite füllt die ganze Karte
 // Corner fasteners and a small energized spine.
 if(!bk){g.fillStyle='#d7f7fa';for(const [xx,yy] of [[bx+11,by+11],[bx+w-11,by+11],[bx+11,by+h-11],[bx+w-11,by+h-11]]){g.beginPath();g.arc(xx,yy,1.8,0,Math.PI*2);g.fill()}
 g.fillStyle=col;g.shadowColor=col;g.shadowBlur=9;g.fillRect(bx+10,by+15,2,h-30);g.shadowBlur=0}
 if(front){if(img){hud.txt(g,t1,0,h/2-h*.16,fs(h*.075,t1),'#f5ffff','center',col);hud.txt(g,t2+(t3?'  /  '+t3:''),0,h/2-h*.09,fs(h*.042,t2+(t3?'  /  '+t3:'')),col,'center')}
  else{hud.txt(g,t1,0,-h*.22,fs(h*.105,t1),'#f5ffff','center',col);hud.txt(g,t2,0,0,fs(h*.09,t2),col,'center');hud.txt(g,t3,0,h*.27,fs(h*.065,t3),'#a9cbd0','center')}
 }else if(!bk){hud.fam('900 22px Orbitron, sans-serif',()=>hud.fancy(g,'H!T',0,-4,Math.round(h*.24),['#eaffff',col],'center',col,0,false,false,900,2));hud.txt(g,'SEALED DATA',0,h*.24,Math.round(h*.06),'#9bbcc2','center')}
 g.restore()}


// Inhalt der Preis-Karte: Farbe, drei Textzeilen, id = Sammelkarten-Bild (falls vorhanden)
export function prizeFace(r){if(r.type==='coins')return{col:'#ffd23f',t1:'COINS',t2:'+'+r.n,t3:'für den Shop',id:null};
 if(r.type==='card')return{col:RARITY[r.r].c,t1:r.name,t2:RARITY[r.r].n,t3:r.isNew?'NEU!':'schon gesammelt',id:r.id};
 if(r.type==='stage')return{col:'#8f7bff',t1:'NEUE STAGE',t2:r.name,t3:'NEU · 2 Spieler / Melee',id:null};
 return{col:r.col,t1:r.char.toUpperCase()+' SKIN',t2:r.name,t3:'NEU · Taste C im Menü',id:null}}
// ---- Shop: Klickflächen (logische 960×540) ----
export const inR=(r,x,y)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
export const shopCardRect=i=>{const n=shopCount(),w=n>8?100:n>7?112:n>6?120:n>4?145:n>3?190:220,h=250,gap=n>8?5:n>7?6:n>6?10:n>4?12:n>3?20:30,x0=W/2-(w*n+gap*(n-1))/2;return{x:x0+i*(w+gap),y:128,w,h}};   // Booster-Angebote + Kämpfer-Karten nebeneinander
export const shopBackRect=()=>({x:W/2-80,y:H-84,w:160,h:28});
// Leiste oben rechts (STARTSEITE · SHOP · BOOSTER · COINS): exakt an der Mittelachse gespiegelte Modus-Leiste links (MODE_PILL in select.js: gleiche Knopfgröße, gleiche Abstände, gleiche Höhe, gleicher Abstand zum Titel)
const topBtn=i=>{const m={x:14,y:12,w:318,h:26},sw=m.w/4,k=3-i,w=sw-6,x=m.x+k*sw+(k?3:0);return{x:W-(x+w),y:m.y,w,h:m.h}};
export const shopSelRect=()=>topBtn(1);
export const hitShopSel=(lx,ly)=>inR(shopSelRect(),lx,ly);
export const startSelRect=()=>topBtn(0);   // „STARTSEITE“: 1. Knopf der Leiste (Spiegel von MELEE links), führt zurück zur Startseite mit dem Demokampf
export const hitStartSel=(lx,ly)=>inR(startSelRect(),lx,ly);
export const boosterRect=()=>topBtn(2);   // Booster-Zähler oben rechts
export const coinsRect=()=>topBtn(3);   // Coins-Anzeige (Spiegel von ARCADE links)
export const lootOpenRect=()=>({x:W/2-196,y:H-62,w:186,h:26});
export const lootCloseRect=()=>({x:W/2+10,y:H-62,w:186,h:26});   // Booster-Übersicht: „Booster öffnen“ / „Schließen“ per Maus
export const sellBtnRect=()=>({x:18,y:16,w:150,h:28});   // „TAUSCHEN“-Knopf (Karten gegen Coins) links oben in der Booster-Übersicht; im Tausch-Modus liegt „ALLE DOPPELTEN“ auf shopBtnRect
export const shopBtnRect=()=>({x:W-168,y:16,w:150,h:28});   // „SHOP“-Knopf in der Booster-Übersicht
export function hitShopCard(lx,ly){for(let i=0;i<shopCount();i++)if(inR(shopCardRect(i),lx,ly))return i;return -1}
export const hitShopBack=(lx,ly)=>inR(shopBackRect(),lx,ly);
export const hitShopBtn=(lx,ly)=>inR(shopBtnRect(),lx,ly);
export const hitSellBtn=(lx,ly)=>inR(sellBtnRect(),lx,ly);
// Pack-Sprites (assets/packs/CardPacks.png, vom Build als window.__PACKS__ eingebettet): 9 Farben (Spalten c) x 20 Motive (Zeilen d), je 84x154 Pixel
export const PACK={cols:9,rows:20,x0:3,y0:3,pw:84,ph:154,gx:95,gy:157};
export function packImg(){const S=typeof window!=='undefined'&&window.__PACKS__;if(!S||typeof Image==='undefined')return null;
 if(!packImg.im){packImg.im=new Image();packImg.im.src=S}const im=packImg.im;return im.complete&&im.naturalWidth>0?im:null}
export const packStyle=(rnd=Math.random)=>({d:Math.floor(rnd()*PACK.rows),c:Math.floor(rnd()*PACK.cols)});   // zufälliges Motiv + Farbe
// Ein Pack mittig bei (cx,cy), h = Höhe in Pixeln (Breite folgt dem Seitenverhältnis). Ab Faktor 1 pixelscharf, darunter geglättet. false, solange das Sheet noch lädt.
export function packSprite(g,st,cx,cy,h){const im=packImg();if(!im)return false;const k=h/PACK.ph,w=PACK.pw*k,d=((st&&st.d)|0)%PACK.rows,c=((st&&st.c)|0)%PACK.cols;
 g.save();g.imageSmoothingEnabled=k<1;g.imageSmoothingQuality='high';g.drawImage(im,PACK.x0+c*PACK.gx,PACK.y0+d*PACK.gy,PACK.pw,PACK.ph,cx-w/2,cy-h/2,w,h);g.restore();return true}
// Booster-Päckchen (Sprite aus dem Pack-Sheet); n = Anzahl gestapelter Päckchen (max. 3 sichtbar), h = Höhe, w wird nur vom Fallback genutzt
export function boosterArt(g,hud,cx,cy,w,h,col,n,tilt=0,st=null,alpha=1){if(!packImg())return boosterArtVector(g,hud,cx,cy,w,h,col,n,tilt);
 const count=Math.min(3,n),s0=st||{d:0,c:0},pw=PACK.pw*h/PACK.ph;
 for(let j=count-1;j>=0;j--){const o=j-(count-1)/2;g.save();g.translate(cx+o*pw*.46,cy+Math.abs(o)*3);g.rotate(tilt+o*.1);if(alpha<1){g.filter='grayscale(.75) brightness(.7)'}   // nicht leistbar: gedimmt statt durchsichtig (Safari ignoriert den Filter)
  
  g.shadowColor=col;g.shadowBlur=alpha>=1?14:0;packSprite(g,{d:s0.d,c:s0.c+j*2},0,0,h);g.restore()}}
// Altes Vektor-Päckchen (Fallback, solange das Sprite-Sheet fehlt)
export function boosterArtVector(g,hud,cx,cy,w,h,col,n,tilt=0){const count=Math.min(3,n);
 for(let j=count-1;j>=0;j--){g.save();g.translate(cx+(j-(count-1)/2)*w*.34,cy+Math.abs(j-(count-1)/2)*3);g.rotate(tilt+(j-(count-1)/2)*.09);
  const x=-w/2,y=-h/2,cut=Math.max(5,w*.075);
  // Thick sealed alloy foil with crimped edges, not a flat coloured wrapper.
  g.shadowColor=col;g.shadowBlur=16;g.fillStyle='#010509';g.beginPath();g.moveTo(x+cut,y);g.lineTo(x+w-cut,y);g.lineTo(x+w,y+cut);g.lineTo(x+w-cut,y+h-cut);g.lineTo(x+w-cut*.5,y+h);g.lineTo(x+cut*.5,y+h);g.lineTo(x+cut,y+h-cut);g.lineTo(x,y+cut);g.closePath();g.fill();g.shadowBlur=0;
  const metal=g.createLinearGradient(x,y,x+w,y+h);metal.addColorStop(0,'#c6d8dc');metal.addColorStop(.09,'#536b73');metal.addColorStop(.2,'#172a33');metal.addColorStop(.43,'#050d14');metal.addColorStop(.61,'#263b45');metal.addColorStop(.78,'#101c26');metal.addColorStop(.91,'#536b76');metal.addColorStop(1,'#05090e');
  g.fillStyle=metal;g.beginPath();g.moveTo(x+cut,y+3);g.lineTo(x+w-cut,y+3);g.lineTo(x+w-3,y+cut);g.lineTo(x+w-4,y+h-cut);g.lineTo(x+w-cut,y+h-3);g.lineTo(x+cut,y+h-3);g.lineTo(x+4,y+h-cut);g.lineTo(x+3,y+cut);g.closePath();g.fill();
  g.strokeStyle='rgba(226,250,255,.82)';g.lineWidth=1;g.stroke();g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=2;g.beginPath();g.moveTo(x+5,y+10);g.lineTo(x+w-5,y+10);g.moveTo(x+5,y+h-10);g.lineTo(x+w-5,y+h-10);g.stroke();
  g.save();g.beginPath();g.moveTo(x+4,y+13);g.lineTo(x+w-4,y+13);g.lineTo(x+w-5,y+h-13);g.lineTo(x+5,y+h-13);g.closePath();g.clip();
  const foil=g.createLinearGradient(x,y,x+w,y+h);foil.addColorStop(0,'rgba(255,255,255,.28)');foil.addColorStop(.22,'rgba(255,255,255,.02)');foil.addColorStop(.48,'rgba(70,215,230,.12)');foil.addColorStop(.7,'rgba(130,112,255,.11)');foil.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=foil;g.fillRect(x+4,y+13,w-8,h-26);
  g.fillStyle='rgba(220,252,255,.11)';g.beginPath();g.moveTo(x+w*.14,y+14);g.lineTo(x+w*.32,y+14);g.lineTo(x+w*.08,y+h-14);g.lineTo(x-w*.06,y+h-14);g.closePath();g.fill();
  // Alien insignia / energy core.
  const rr=Math.min(w*.27,h*.15),ey=y+h*.47;g.save();g.translate(0,ey);g.rotate(Math.PI/4);g.strokeStyle=col;g.lineWidth=1.5;g.shadowColor=col;g.shadowBlur=10;g.strokeRect(-rr,-rr,rr*2,rr*2);g.rotate(-Math.PI/4);g.beginPath();g.arc(0,0,rr*.58,0,Math.PI*2);g.stroke();g.fillStyle='#eaffff';g.shadowBlur=12;g.fillRect(-2,-2,4,4);g.restore();g.restore();
  g.fillStyle='rgba(220,250,255,.86)';g.fillRect(x+7,y+5,w-14,1);g.fillRect(x+7,y+h-6,w-14,1);
  hud.txt(g,'H!T',0,y+h*.32,Math.round(w*.28),'#efffff','center',col);hud.txt(g,'XENOS / SUPPLY',0,y+h*.72,Math.max(7,Math.round(w*.09)),'#b6d7dc','center');
  g.restore()}}

export const SHOP_PACK_H=118,SHOP_STYLE=[{d:2,c:8},{d:17,c:2},{d:18,c:6}];   // Motiv/Farbe der Packs im Shop (1 / 3 / 5 Booster)
export function drawShop(g,hud,u){const sel=u.sel|0;
 SHOP.forEach((o,i)=>{const r=shopCardRect(i),on=i===sel,ok=canBuy(i),col=ok?'#65e5ed':'#536d78',cx=r.x+r.w/2;
  g.save();g.translate(cx,r.y+r.h/2);const sc=on?1.05+.012*Math.sin(u.t*.12):.97;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=on?1:.88;
  g.shadowColor=on?'#58ddeb':'#000';g.shadowBlur=on?22:10;g.fillStyle='#02070c';hud.kChamfer(g,r.x,r.y,r.w,r.h,15);g.fill();g.shadowBlur=0;const shell=g.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);shell.addColorStop(0,'#647b83');shell.addColorStop(.16,'#172a33');shell.addColorStop(.7,'#050d13');shell.addColorStop(1,'#344b54');g.fillStyle=shell;hud.kChamfer(g,r.x+2,r.y+2,r.w-4,r.h-4,13);g.fill();g.strokeStyle=on?'#9dfaff':'rgba(145,197,205,.42)';g.lineWidth=on?1.8:1;hud.kChamfer(g,r.x+4,r.y+4,r.w-8,r.h-8,11);g.stroke();g.fillStyle='rgba(255,255,255,.18)';g.fillRect(r.x+15,r.y+7,r.w*.3,1.5);g.strokeStyle='rgba(132,217,225,.18)';hud.kChamfer(g,r.x+9,r.y+9,r.w-18,r.h-18,8);g.stroke();
  boosterArt(g,hud,cx,r.y+88,r.w<130?64:76,SHOP_PACK_H,ok?'#69e9ef':'#596c83',o.n,on?-.05:0,SHOP_STYLE[i%SHOP_STYLE.length],ok?1:.5);
  hud.txt(g,o.n===1?'1 BOOSTER':o.n+' BOOSTER',cx,r.y+170,r.w<130?16:19,'#ffffff','center',on?col:null);
  if(o.n>1)hud.txt(g,'SPARE '+Math.round((1-o.price/(o.n*SHOP[0].price))*100)+' %',cx,r.y+188,r.w<130?10:11,'#7dff9a','center');
  hud.txt(g,o.price+' CREDITS',cx,r.y+222,r.w<130?16:20,ok?'#a9faff':'#78909a','center',ok&&on?'#65e5ed':null);
  if(!ok)hud.txt(g,'noch '+(o.price-LOOT.coins)+' fehlen',cx,r.y+r.h-8,r.w<130?9:10,'#ff9aa6','center');
  g.restore()});
 const figW=shopCardRect(SHOP.length).w-(shopCardRect(SHOP.length).w<130?2:24),figS=groupScale(CHAR_SHOP.map(o=>CHARACTERS[o.id]),figW,128);   // gemeinsamer Maßstab nach den Spiel-Größenverhältnissen (sprites.js, SPRITE_CHARS.rs)
 CHAR_SHOP.forEach((o,j)=>{const i=SHOP.length+j,r=shopCardRect(i),on=i===sel,own=ownsChar(o.id),ok=canBuyChar(o.id),ch=CHARACTERS[o.id],col=own?'#7dff9a':ok?'#65e5ed':'#536d78',cx=r.x+r.w/2;
  g.save();g.translate(cx,r.y+r.h/2);const sc=on?1.05+.012*Math.sin(u.t*.12):.97;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=on?1:.88;
  g.shadowColor=on?'#58ddeb':'#000';g.shadowBlur=on?22:10;g.fillStyle='#02070c';hud.kChamfer(g,r.x,r.y,r.w,r.h,15);g.fill();g.shadowBlur=0;const shell=g.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);shell.addColorStop(0,'#647b83');shell.addColorStop(.16,'#172a33');shell.addColorStop(.7,'#050d13');shell.addColorStop(1,'#344b54');g.fillStyle=shell;hud.kChamfer(g,r.x+2,r.y+2,r.w-4,r.h-4,13);g.fill();g.strokeStyle=on?'#9dfaff':'rgba(145,197,205,.42)';g.lineWidth=on?1.8:1;hud.kChamfer(g,r.x+4,r.y+4,r.w-8,r.h-8,11);g.stroke();g.fillStyle='rgba(255,255,255,.18)';g.fillRect(r.x+15,r.y+7,r.w*.3,1.5);g.strokeStyle='rgba(132,217,225,.18)';hud.kChamfer(g,r.x+9,r.y+9,r.w-18,r.h-18,8);g.stroke();
  g.save();g.shadowColor=ch.glow;g.shadowBlur=on?18:8;if(!(figS&&drawFrameScaled(g,ch,cx,r.y+12+128,figS)))drawFullFrame(g,ch,r.x+(r.w<130?14:30),r.y+12,r.w-(r.w<130?28:60),128);g.restore();
  hud.txt(g,ch.name,cx,r.y+170,r.w<115?14:r.w<130?16:19,'#ffffff','center',on?col:null);
  hud.txt(g,'KÄMPFER FREISCHALTEN',cx,r.y+188,r.w<115?7:r.w<130?8:10,'#9bbcc2','center');
  if(own)hud.txt(g,'BESITZT ✓',cx,r.y+222,r.w<115?14:r.w<130?16:20,'#7dff9a','center',on?'#7dff9a':null);
  else if(!charReqMet(o.id)){hud.txt(g,'GESPERRT',cx,r.y+222,r.w<115?14:r.w<130?16:20,'#78909a','center');hud.txt(g,CHAR_REQ[o.id].txt,cx,r.y+r.h-8,r.w<115?7:r.w<130?8:10,'#ff9aa6','center')}   // Voraussetzung (z. B. Kapitel 3) noch nicht erfüllt
  else{hud.txt(g,o.price+' CREDITS',cx,r.y+222,r.w<115?14:r.w<130?16:20,ok?'#a9faff':'#78909a','center',ok&&on?'#65e5ed':null);
   if(!ok)hud.txt(g,'noch '+(o.price-LOOT.coins)+' fehlen',cx,r.y+r.h-8,r.w<115?8:r.w<130?9:10,'#ff9aa6','center');else hud.txt(g,r.w<130?'dauerhaft frei':'einmaliger Kauf · dauerhaft',cx,r.y+r.h-8,r.w<115?8:r.w<130?9:10,'#9bbcc2','center')}
  g.restore()});
 const b=shopBackRect();hud.kBtn(g,b.x,b.y,b.w,b.h,'ZURÜCK',{col:'#b98bff',t:u.t});
 const age=u.t-(u.msgAt==null?-999:u.msgAt);if(u.msg&&age<110){g.save();g.globalAlpha=Math.min(1,(110-age)/30);hud.txt(g,u.msg,W/2,H-112,20,u.msgOk?'#7dff9a':'#ff6f7f','center',u.msgOk?'#7dff9a':'#ff6f7f');g.restore()}
 hud.txt(g,'◀ ▶  wählen   ·   ENTER / Klick – kaufen   ·   ESC / P – zurück',W/2,H-34,14,'#ffffff','center')}
// ---- Karten-Ansicht (Klick auf eine Karte = groß anzeigen) ----
export const gridGeom=()=>{const n=CARDS.length,gx=8,AVAIL=292;let cols=6,cw=112,ch=152;for(cols=6;cols<=24;cols++){cw=Math.min(112,Math.floor((W-110-(cols-1)*gx)/cols));ch=Math.round(cw*152/112);if(Math.ceil(n/cols)*(ch+gx)<=AVAIL||cols===24)break}return{cols,cw,ch,gx,y0:104,rows:Math.ceil(n/cols)}};   // wächst mit der Kartenzahl: so wenige Spalten wie nötig, damit alle Reihen auf den Bildschirm passen
export const cardGridRect=i=>{const G=gridGeom(),x0=W/2-(G.cols*G.cw+(G.cols-1)*G.gx)/2;return{x:x0+(i%G.cols)*(G.cw+G.gx),y:G.y0+Math.floor(i/G.cols)*(G.ch+G.gx),w:G.cw,h:G.ch}};
export function hitCardGrid(lx,ly){for(let i=0;i<CARDS.length;i++)if(inR(cardGridRect(i),lx,ly)&&(LOOT.cards[CARDS[i].id]|0)>0)return i;return -1}   // nur besessene Karten lassen sich ansehen
export const cardFace=c=>({col:RARITY[c.r].c,t1:c.name,t2:RARITY[c.r].n,t3:'x'+(LOOT.cards[c.id]|0)+' gesammelt'+(isItem(c.id)?' · '+(LOOT.items[c.id]|0)+' im Beutel':''),id:c.id});
export const cardFaceAt=i=>cardFace(CARDS[i]);
export function drawZoom(g,hud,u){const z=u&&u.zoom;if(!z)return;u.zt=(u.zt||0)+1;const e=Math.min(1,u.zt/10),k=1-Math.pow(1-e,3),w=300,h=414;
 g.save();g.globalAlpha=.95*k;g.fillStyle='#010409';g.fillRect(0,0,W,H);g.globalAlpha=1;
 g.save();g.globalCompositeOperation='lighter';const R=330,gr=g.createRadialGradient(W/2,H/2,20,W/2,H/2,R);gr.addColorStop(0,z.col+'55');gr.addColorStop(1,z.col+'00');g.globalAlpha=k;g.fillStyle=gr;g.fillRect(W/2-R,H/2-R,R*2,R*2);g.restore();
 g.translate(W/2,H/2-6);const sc=.82+.18*k;g.scale(sc,sc);g.globalAlpha=k;
 card(g,hud,-w/2,-h/2,w,h,z.col,z.t1,z.t2,z.t3,1,z.id?cardImg(z.id):null);
 g.restore();hud.txt(g,'Klick / ESC / ENTER – schließen',W/2,H-22,14,'#ffffff','center')}
export function drawLoot(g,hud,u){if(!u||!u.open)return;u.t=(u.t||0)+1;
 g.save();g.globalAlpha=.94;g.fillStyle='#010509ee';g.fillRect(0,0,W,H);g.globalAlpha=1;
 // Vault chassis and recessed glass work surface.
 g.save();hud.kChamfer(g,14,12,W-28,H-24,22);const deck=g.createLinearGradient(0,12,0,H-12);deck.addColorStop(0,'#1b2d35');deck.addColorStop(.12,'#07131a');deck.addColorStop(.82,'#02080d');deck.addColorStop(1,'#182830');g.fillStyle=deck;g.fill();g.strokeStyle='rgba(172,221,226,.54)';g.lineWidth=1;g.stroke();hud.kChamfer(g,21,19,W-42,H-38,17);g.strokeStyle='rgba(91,229,237,.18)';g.stroke();g.fillStyle='#6de6ed';g.fillRect(32,26,90,2);g.fillRect(W-122,H-28,90,2);g.restore();
 if(u.mode==='reveal'&&u.po){u.po.draw(g,hud,u);g.restore();drawZoom(g,hud,u);return}   // Booster aufreißen (render/packopen.js)
 hud.txt(g,u.mode==='shop'?'XENOS SUPPLY EXCHANGE':u.mode==='sell'?'DATA CARD  EXCHANGE':'REWARD VAULT  /  DATA ARCHIVE',W/2,52,29,'#eaffff','center','#62ddea');hud.lab(g,'ALIEN CONTROL NETWORK  //  SECURE INVENTORY',W/2,72,9,'#6faebb','center',2,null,'700');
 hud.txt(g,`SEALED PACKS  ${LOOT.packs}     /     CREDITS  ${LOOT.coins}     /     DATA CARDS  ${cardsOwned()}/${CARDS.length}`,W/2,96,13,'#9cebf2','center');
 if(u.mode==='shop')drawShop(g,hud,u);
 else if(u.mode==='reveal'&&u.rewards){const R=u.rewards,cw=210,ch=290,gap=34,x0=W/2-(cw*3+gap*2)/2;
  R.forEach((r,i)=>{const fl=Math.cos(cl((u.t-i*18)/20,0,1)*Math.PI),x=x0+i*(cw+gap),y=130;
   if(r.type==='coins')card(g,hud,x,y,cw,ch,'#ffd23f','COINS','+'+r.n,'für den Shop',fl);
   else if(r.type==='card')card(g,hud,x,y,cw,ch,RARITY[r.r].c,r.name,RARITY[r.r].n,(r.isNew?'NEU!':'schon gesammelt')+(r.item?' · +1 ITEM':''),fl,cardImg(r.id));
   else if(r.type==='stage')card(g,hud,x,y,cw,ch,'#8f7bff','NEUE STAGE',r.name,'NEU – im 2-Spieler/Melee-Menü',fl);
   else card(g,hud,x,y,cw,ch,r.col,r.char.toUpperCase()+' SKIN',r.name,'NEU – Farbe im Menü mit C',fl)});
  if(u.t>70)hud.txt(g,LOOT.packs>0?`ENTER – weiter (noch ${LOOT.packs} Booster)`:'ENTER – weiter',W/2,H-34,15,'#ffffff','center')}
 else{const{cols,cw,ch,gx,y0,rows}=gridGeom(),x0=W/2-(cols*cw+(cols-1)*gx)/2;
  const small=cw<80,sm=u.mode==='sell';
  CARDS.forEach((c,i)=>{const x=x0+(i%cols)*(cw+gx),y=y0+Math.floor(i/cols)*(ch+gx),n=LOOT.cards[c.id]|0,col=RARITY[c.r].c,im=n?cardImg(c.id):null;
   g.fillStyle='#07131c';g.strokeStyle=n?col:'#31505d';g.lineWidth=1.3;g.fillRect(x,y,cw,ch);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x+2,y+2,cw-4,2);g.strokeStyle='rgba(150,225,235,.18)';g.strokeRect(x+4,y+4,cw-8,ch-8);
   if(im){cover(g,im,x,y,cw,ch);const gr=g.createLinearGradient(0,y+ch-40,0,y+ch);gr.addColorStop(0,'#04020a00');gr.addColorStop(1,'#04020aee');g.fillStyle=gr;g.fillRect(x,y+ch-40,cw,40);if(!small)hud.txt(g,c.name,x+cw/2,y+ch-18,10,'#ffffff','center');hud.txt(g,'x'+n,x+cw-(small?10:14),y+(small?11:14),small?9:11,'#ffffff','center',col)}   // kleine Kacheln (viele Karten): Name erst in der Großansicht
   else if(n){const lb=c.s||c.name;hud.txt(g,lb,x+cw/2,y+ch*.38,Math.max(6,Math.min(12,Math.floor(cw*1.7/Math.max(6,lb.length)))),'#ffffff','center');if(!small)hud.txt(g,RARITY[c.r].n,x+cw/2,y+ch*.38+20,9,col,'center');hud.txt(g,'x'+n,x+cw/2,y+ch-(small?9:18),small?9:11,'#aab2e8','center')}
   else hud.txt(g,'?',x+cw/2,y+ch*.6,30,'#2a2a50','center');
   g.strokeRect(x,y,cw,ch);
   if(sm){const sn=sellable(c.id),pk=(u.sell&&u.sell[c.id])|0;   // Tausch-Modus: nichts Verkaufbares = abgedunkelt, gewählte Karten gold mit „−Anzahl“, Cursor cyan
    if(n&&!sn){g.fillStyle='rgba(2,6,10,.62)';g.fillRect(x,y,cw,ch)}
    if(pk){g.save();g.strokeStyle='#ffd23f';g.lineWidth=2.4;g.shadowColor='#ffd23f';g.shadowBlur=12;g.strokeRect(x+1,y+1,cw-2,ch-2);g.restore();g.fillStyle='#ffd23f';g.fillRect(x+cw/2-19,y+ch/2-13,38,26);hud.txt(g,'−'+pk,x+cw/2,y+ch/2+5,15,'#1a1200','center')}
    if(n&&i===u.sel){g.save();g.strokeStyle='#7fe8ff';g.lineWidth=1.6;g.strokeRect(x-3,y-3,cw+6,ch+6);g.restore()}}});
  const own=SKIN_POOL.filter(([id,k])=>ownsSkin(id,k)).map(([id,k])=>id.toUpperCase()+' '+skinName(id,k));
  hud.txt(g,'FARBEN: '+(own.length?own.join(' · '):'noch keine – Booster bringen neue Farben'),W/2,y0+rows*(ch+gx)+18,12,'#c9d0ff','center');
  const ow2=STAGE_POOL.filter(i=>ownsStage(i)).map(i=>STAGE_NAMES[i]);hud.txt(g,'STAGES: NEON CITY'+(ow2.length?' · '+ow2.join(' · '):'')+'   ('+(1+ow2.length)+'/'+(1+STAGE_POOL.length)+')',W/2,y0+rows*(ch+gx)+38,12,'#c9d0ff','center');
  if(sm){const sp=sellPreview(u.sell||{}),b=shopBtnRect(),o=lootOpenRect(),c=lootCloseRect(),ok=sp.n>0;
   hud.kBtn(g,b.x,b.y,b.w,b.h,'A – ALLE DOPPELTEN',{col:'#7fe8ff',t:u.t,size:11});
   hud.kBtn(g,o.x,o.y,o.w,o.h,'V – VERKAUFEN',{col:'#7fe8ff',on:ok,dim:!ok,t:u.t});
   hud.kBtn(g,c.x,c.y,c.w,c.h,'ZURÜCK',{col:'#b98bff',t:u.t});
   const age=u.t-(u.msgAt==null?-999:u.msgAt);
   if(u.msg&&age<260){g.save();g.globalAlpha=Math.min(1,(260-age)/40);hud.txt(g,u.msg,W/2,H-76,17,u.msgOk?'#7dff9a':'#ff6f7f','center',u.msgOk?'#7dff9a':'#ff6f7f');g.restore()}
   else hud.txt(g,sp.n?`AUSGEWÄHLT: ${sp.n} ${sp.n===1?'Karte':'Karten'}   ·   mindestens ${sp.min} Coins  +  Zufallsbonus 0–${sp.bonus}`:'Doppelte Karten und Beutel-Items gegen Coins tauschen – eine Karte pro Sorte bleibt in der Sammlung',W/2,H-76,14,sp.n?'#ffd23f':'#9cebf2','center');
   hud.txt(g,'Klick: +1   ·   Rechtsklick / Backspace: −1   ·   ◀ ▶ ▲ ▼ + ENTER   ·   ESC – zurück',W/2,H-16,12,'#ffffff','center')}
  else{{const b=sellBtnRect();hud.kBtn(g,b.x,b.y,b.w,b.h,'T – TAUSCHEN',{col:'#7fe8ff',t:u.t})}
  {const b=shopBtnRect();hud.kBtn(g,b.x,b.y,b.w,b.h,'P – SHOP',{col:'#b98bff',on:true,t:u.t})}
  {const o=lootOpenRect(),c=lootCloseRect(),pk=LOOT.packs>0;
   hud.kBtn(g,o.x,o.y,o.w,o.h,'BOOSTER ÖFFNEN',{col:'#7fe8ff',on:pk,dim:!pk,t:u.t});
   hud.kBtn(g,c.x,c.y,c.w,c.h,'SCHLIESSEN',{col:'#b98bff',t:u.t})}
  hud.txt(g,LOOT.packs>0?'Karte anklicken – groß ansehen   ·   ENTER – Booster öffnen   ·   P – Shop   ·   B / ESC – schließen':'Karte anklicken – groß ansehen   ·   Keine Booster – Story-Modus oder Shop (P)   ·   B / ESC – schließen',W/2,H-16,12,'#ffffff','center')}}
 g.restore();drawZoom(g,hud,u)}
