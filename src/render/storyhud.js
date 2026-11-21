import{DEALER,wrapText}from'../core/blackmarket.js';
import{CHARACTERS,CLEAR_UNLOCKS}from'../core/characters.js';
import{GROUND,H,W}from'../core/config.js';
import{ITEMS}from'../core/items.js';
import{LOOT,itemCount,ownsChar}from'../core/loot.js';
import{CHAPTERS,LV}from'../core/story.js';

import{drawPortrait,drawSpriteFrame}from'./sprites.js';
// Story-Modus: Welt (Straße, Laternen), Lebensbalken der Mantis, HUD (Balken, Fortschritt, Wellen-Banner, Intro/Ende).
export function storyWorld(g,game,t){const x0=LV.x0-400,x1=LV.x1+400,L=(game.story&&game.story.cfg||CHAPTERS[0]).look;g.save();
 const gr=g.createLinearGradient(0,GROUND,0,GROUND+90);gr.addColorStop(0,L.ground[0]);gr.addColorStop(1,L.ground[1]);g.fillStyle=gr;g.fillRect(x0,GROUND,x1-x0,100);
 g.fillStyle=L.line;g.fillRect(x0,GROUND,x1-x0,3);g.fillStyle='rgba(255,255,255,.12)';for(let x=Math.floor(x0/160)*160;x<x1;x+=160)g.fillRect(x,GROUND+36,70,4);
 for(let x=-1200;x<=2200;x+=400){g.fillStyle='#1a1426';g.fillRect(x-3,GROUND-215,6,215);g.fillRect(x-3,GROUND-215,34,5);
  g.save();g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(x+28,GROUND-208,4,x+28,GROUND-208,170);rg.addColorStop(0,`rgba(${L.lamp},.5)`);rg.addColorStop(1,`rgba(${L.lamp},0)`);g.fillStyle=rg;g.fillRect(x-150,GROUND-380,360,380);
  g.translate(x+28,GROUND+6);g.scale(1,.22);const pg=g.createRadialGradient(0,0,4,0,0,130);pg.addColorStop(0,`rgba(${L.lamp},.4)`);pg.addColorStop(1,`rgba(${L.lamp},0)`);g.fillStyle=pg;g.fillRect(-130,-130,260,260);g.restore()}
 g.restore();drawLedges(g,game,t,L);drawParkour(g,game,t,L);drawProps(g,game,t,L);drawDealer(g,game,t)}
// Kanten/Ebenen (Kapitel-Config: ledges, core/terrain.js): Steinblock mit leuchtender Oberkante und Seitenkanten. Die Figuren stehen auf der Oberkante (Standfläche = GROUND - h).
function drawLedges(g,game,t,L){const T=game.story&&game.story.terrain;if(!T)return;const G=L.ground||['#1b1430','#0a0714'];g.save();
 for(const l of[...T.ledges].sort((a,b)=>a.h-b.h)){const w=l.x1-l.x0,y=GROUND-l.h,bot=GROUND+16;
  g.save();g.shadowColor=L.acc;g.shadowBlur=18;g.fillStyle='#1b1430';g.fillRect(l.x0,y,w,bot-y);g.restore();
  g.save();g.beginPath();g.rect(l.x0,y,w,bot-y);g.clip();
  const gr=g.createLinearGradient(0,y,0,bot);gr.addColorStop(0,G[0]);gr.addColorStop(1,G[1]);g.fillStyle=gr;g.globalAlpha=.92;g.fillRect(l.x0,y,w,bot-y);
  g.globalAlpha=.3;g.strokeStyle=L.line;g.lineWidth=1;   // Steinfugen
  for(let yy=y+30,r=0;yy<bot;yy+=30,r++){g.beginPath();g.moveTo(l.x0,yy);g.lineTo(l.x1,yy);for(let xx=l.x0+(r%2?40:0);xx<l.x1;xx+=80){g.moveTo(xx,yy);g.lineTo(xx,yy-30)}g.stroke()}
  g.restore();
  g.fillStyle=L.line;g.globalAlpha=.95;g.fillRect(l.x0-3,y,w+6,4);g.globalAlpha=.3;g.fillRect(l.x0-3,y+4,w+6,8);   // leuchtende Oberkante
  g.globalAlpha=.8;g.fillStyle=L.acc;g.fillRect(l.x0-3,y,3,bot-y);g.fillRect(l.x1,y,3,bot-y);g.globalAlpha=1}   // Seitenkanten
 g.restore()}
// Parkour (Kapitel-Config parkour, core/terrain.js Plattformen): Kulisse je Kapitel (deco) hinter den Plattformen, die Plattformen selbst, Hinweisschild und der leuchtende Schatz oben.
// Die Figuren stehen auf der Oberkante der Plattform (GROUND - h).
const pkRand=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const PK_DECO={
 // Neon City: Hochhaus-Fassade mit Fenstern und Feuerleiter, oben ein Neonschild
 neon(g,P,t,L,top,x0,x1){const bx=x0-70,bw=x1-x0+130;g.fillStyle='#0b0716';g.globalAlpha=.88;g.fillRect(bx,top-80,bw,GROUND-top+80);g.globalAlpha=1;
  for(let x=bx+10;x<bx+bw-14;x+=26)for(let y=top-60;y<GROUND-20;y+=34){const r=pkRand(x*3+y);if(r<.42){g.globalAlpha=.25+.3*Math.abs(Math.sin(t*.6+r*20));g.fillStyle=r<.2?L.acc:'#ffd23f';g.fillRect(x,y,14,20)}}
  g.globalAlpha=.55;g.strokeStyle=L.line;g.lineWidth=2;g.beginPath();P.slice(0,3).forEach((q,i)=>{const cx=(q.x0+q.x1)/2;if(!i)g.moveTo(cx,GROUND);g.lineTo(cx,GROUND-q.h)});g.stroke();   // Feuerleiter
  g.globalAlpha=.9;g.strokeStyle=L.acc;g.lineWidth=3;g.shadowColor=L.acc;g.shadowBlur=14;g.strokeRect(bx+bw*.55,top-70,bw*.4,34);g.shadowBlur=0;g.globalAlpha=1},
 // Hafen: Kran – Gitterturm unter der obersten Plattform, Ausleger nach links mit Haken; die unteren Plattformen sind Container
 crane(g,P,t,L,top,x0,x1){const last=P[P.length-1],tx=last.x1-34,ty=top-34;g.strokeStyle='#d4a82c';g.fillStyle='#d4a82c';g.globalAlpha=.9;g.lineWidth=3;
  g.beginPath();g.moveTo(tx-12,GROUND);g.lineTo(tx-12,ty);g.moveTo(tx+12,GROUND);g.lineTo(tx+12,ty);g.stroke();g.lineWidth=1.5;g.beginPath();for(let y=GROUND;y>ty+30;y-=38){g.moveTo(tx-12,y);g.lineTo(tx+12,y-38);g.moveTo(tx+12,y);g.lineTo(tx-12,y-38)}g.stroke();
  g.lineWidth=5;g.beginPath();g.moveTo(x0+30,ty);g.lineTo(tx+60,ty);g.stroke();g.lineWidth=1.5;g.beginPath();for(let x=x0+30;x<tx;x+=34){g.moveTo(x,ty);g.lineTo(x+17,ty-16);g.lineTo(x+34,ty)}g.stroke();   // Ausleger mit Fachwerk
  g.fillRect(tx+30,ty-6,34,22);const sw=Math.sin(t*1.3)*6,hx=x0+60+sw;g.lineWidth=1.5;g.beginPath();g.moveTo(hx,ty);g.lineTo(hx,ty+90);g.stroke();g.lineWidth=3;g.beginPath();g.arc(hx,ty+98,8,-.4,Math.PI*1.1);g.stroke();   // Haken am Seil
  g.globalAlpha=1},
 // Kern: glühender Reaktor-Zylinder in der Lücke, Rohre zu den Plattformen, zuckende Blitze
 reactor(g,P,t,L,top,x0,x1){const a=P[P.length-2],b=P[P.length-1],cx=(a.x1+b.x0)/2,pul=.75+.25*Math.sin(t*3);
  const gr=g.createLinearGradient(cx-34,0,cx+34,0);gr.addColorStop(0,'#1a0a0e');gr.addColorStop(.5,L.acc);gr.addColorStop(1,'#1a0a0e');g.globalAlpha=.55*pul;g.fillStyle=gr;g.fillRect(cx-34,top-40,68,GROUND-top+40);g.globalAlpha=1;
  g.save();g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(cx,top+80,6,cx,top+80,190);rg.addColorStop(0,L.acc);rg.addColorStop(1,'#0000');g.globalAlpha=.35*pul;g.fillStyle=rg;g.fillRect(cx-190,top-110,380,380);g.restore();
  g.strokeStyle='#2a2030';g.lineWidth=7;g.beginPath();for(const q of P){const px=q.x1<cx?q.x1:q.x0,y=GROUND-q.h+8;g.moveTo(cx+(px<cx?-34:34),y);g.lineTo(px,y)}g.stroke();
  g.strokeStyle='#fff';g.globalAlpha=.55+.4*Math.sin(t*17);g.lineWidth=2;g.beginPath();let y=top+10;g.moveTo(a.x1,y);for(let i=1;i<=8;i++){g.lineTo(a.x1+(b.x0-a.x1)*i/8,y+(pkRand(i+Math.floor(t*9))-.5)*40)}g.stroke();g.globalAlpha=1},
 // Totenreich: Pyramide im Hintergrund, Obelisk neben dem Schatz
 obelisk(g,P,t,L,top,x0,x1){const cx=(x0+x1)/2,b=P[P.length-1],ox=(b.x0+b.x1)/2;
  const gr=g.createLinearGradient(0,top-70,0,GROUND);gr.addColorStop(0,'#3a2a10');gr.addColorStop(1,'#120b04');g.fillStyle=gr;g.globalAlpha=.7;g.beginPath();g.moveTo(x0-170,GROUND);g.lineTo(cx,top-80);g.lineTo(x1+170,GROUND);g.closePath();g.fill();
  g.globalAlpha=.4;g.strokeStyle=L.line;g.lineWidth=1.2;for(let y=top-30;y<GROUND;y+=34){const k=(y-(top-80))/(GROUND-(top-80));g.beginPath();g.moveTo(cx-(cx-(x0-170))*k,y);g.lineTo(cx+((x1+170)-cx)*k,y);g.stroke()}
  g.globalAlpha=.95;g.fillStyle='#2b200f';g.strokeStyle=L.acc;g.lineWidth=2;g.beginPath();g.moveTo(ox-34,GROUND);g.lineTo(ox-18,top-10);g.lineTo(ox,top-64);g.lineTo(ox+18,top-10);g.lineTo(ox+34,GROUND);g.closePath();g.fill();g.stroke();g.globalAlpha=1},
 // Tempel: Pagode mit Dächern, Glocke über dem Schatz
 pagoda(g,P,t,L,top,x0,x1){const b=P[P.length-1],cx=(b.x0+b.x1)/2;g.fillStyle='#2a0a14';g.globalAlpha=.85;g.fillRect(cx-46,top+20,92,GROUND-top-20);g.globalAlpha=1;
  for(let i=0;i<4;i++){const y=top+30+i*((GROUND-top-30)/4),w=70+i*26;g.fillStyle='#5e0f22';g.strokeStyle=L.acc;g.lineWidth=2;g.beginPath();g.moveTo(cx-w-14,y+16);g.quadraticCurveTo(cx-w,y,cx-w+22,y);g.lineTo(cx+w-22,y);g.quadraticCurveTo(cx+w,y,cx+w+14,y+16);g.lineTo(cx+w-10,y+14);g.lineTo(cx-w+10,y+14);g.closePath();g.fill();g.stroke()}
  const sw=Math.sin(t*1.6)*.12;g.save();g.translate(cx,top-80);g.rotate(sw);g.fillStyle='#d9a521';g.beginPath();g.moveTo(-16,24);g.quadraticCurveTo(-18,-2,0,-10);g.quadraticCurveTo(18,-2,16,24);g.closePath();g.fill();g.restore();
  g.strokeStyle='#d9a521';g.lineWidth=2;g.beginPath();g.moveTo(cx,top-100);g.lineTo(cx,top-90);g.stroke()}};
function pkSlab(g,p,deco,i,t,L){const y=GROUND-p.h,w=p.x1-p.x0;g.save();g.shadowColor=L.acc;g.shadowBlur=12;
 if(deco==='crane'){g.shadowBlur=0;g.fillStyle=['#a93226','#1f618d','#b7950b','#117a65'][i%4];g.fillRect(p.x0,y,w,34);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;for(let x=p.x0+10;x<p.x1;x+=16){g.beginPath();g.moveTo(x,y+4);g.lineTo(x,y+30);g.stroke()}g.fillStyle='#e6e1d0';g.fillRect(p.x0,y,w,4)}
 else if(deco==='neon'){g.fillStyle='#14102a';g.fillRect(p.x0,y,w,18);g.strokeStyle=L.acc;g.lineWidth=2;g.strokeRect(p.x0,y,w,18);g.shadowBlur=0;g.fillStyle=i%2?'#ffd23f':L.acc;g.globalAlpha=.6+.3*Math.sin(t*4+i);for(let x=p.x0+8;x<p.x1-14;x+=20)g.fillRect(x,y+6,12,5)}
 else if(deco==='reactor'){g.fillStyle='#1c1722';g.fillRect(p.x0,y,w,14);g.shadowBlur=0;g.strokeStyle='#4a3f58';g.lineWidth=1;for(let x=p.x0+6;x<p.x1;x+=10){g.beginPath();g.moveTo(x,y);g.lineTo(x-6,y+14);g.stroke()}g.fillStyle=L.acc;g.globalAlpha=.8;g.fillRect(p.x0,y,w,3)}
 else if(deco==='obelisk'){g.fillStyle='#2e2412';g.fillRect(p.x0,y,w,26);g.shadowBlur=0;g.fillStyle=L.acc;g.globalAlpha=.9;g.fillRect(p.x0,y,w,3);g.globalAlpha=.45;for(let x=p.x0+10;x<p.x1-10;x+=22)g.fillRect(x,y+10,10,3)}
 else{g.fillStyle='#5e0f22';g.beginPath();g.moveTo(p.x0-12,y+16);g.quadraticCurveTo(p.x0,y,p.x0+20,y);g.lineTo(p.x1-20,y);g.quadraticCurveTo(p.x1,y,p.x1+12,y+16);g.lineTo(p.x1-8,y+14);g.lineTo(p.x0+8,y+14);g.closePath();g.fill();g.shadowBlur=0;g.strokeStyle='#d9a521';g.lineWidth=2;g.stroke()}
 g.restore()}
function drawParkour(g,game,t,L){const s=game.story,pk=s&&s.cfg.parkour;if(!pk)return;const P=pk.platforms,top=Math.min(...P.map(p=>GROUND-p.h)),x0=Math.min(...P.map(p=>p.x0)),x1=Math.max(...P.map(p=>p.x1));
 g.save();(PK_DECO[pk.deco]||PK_DECO.neon)(g,P,t,L,top,x0,x1);g.restore();
 P.forEach((p,i)=>pkSlab(g,p,pk.deco,i,t,L));
 g.save();{const hx=x0-92;g.fillStyle='#1a1426';g.fillRect(hx-2,GROUND-110,4,110);g.fillStyle='rgba(8,5,16,.9)';g.strokeStyle=L.acc;g.lineWidth=2;g.shadowColor=L.acc;g.shadowBlur=10;g.fillRect(hx-46,GROUND-168,92,56);g.strokeRect(hx-46,GROUND-168,92,56);g.shadowBlur=0;   // Hinweisschild: Doppelsprung
  g.fillStyle=L.acc;g.globalAlpha=.65+.3*Math.sin(t*4);for(const dy of[0,12]){g.beginPath();g.moveTo(hx-14,GROUND-134-dy);g.lineTo(hx,GROUND-146-dy);g.lineTo(hx+14,GROUND-134-dy);g.lineTo(hx+14,GROUND-129-dy);g.lineTo(hx,GROUND-141-dy);g.lineTo(hx-14,GROUND-129-dy);g.closePath();g.fill()}
  g.globalAlpha=1;g.font='700 9px Orbitron,Impact,sans-serif';g.textAlign='center';g.fillText('DOPPELSPRUNG',hx,GROUND-116)}g.restore();
 const r=s.relic;if(r&&!r.got){g.save();const bob=Math.sin(t*2.2)*5,x=r.x,y=r.y+bob;g.globalCompositeOperation='lighter';
  const bm=g.createLinearGradient(0,y,0,y-440);bm.addColorStop(0,'rgba(255,210,63,.5)');bm.addColorStop(1,'rgba(255,210,63,0)');g.fillStyle=bm;g.fillRect(x-16,y-440,32,440);
  const rg=g.createRadialGradient(x,y,2,x,y,64);rg.addColorStop(0,'rgba(255,236,150,.95)');rg.addColorStop(1,'rgba(255,210,63,0)');g.fillStyle=rg;g.fillRect(x-64,y-64,128,128);
  g.globalCompositeOperation='source-over';const wv=Math.max(.25,Math.abs(Math.cos(t*2)))*15;g.fillStyle='#ffe27a';g.strokeStyle='#fff7cc';g.lineWidth=2;g.beginPath();g.moveTo(x,y-22);g.lineTo(x+wv,y);g.lineTo(x,y+22);g.lineTo(x-wv,y);g.closePath();g.fill();g.stroke();g.restore()}}
// Ausschmückung (Kisten, Fässer, Neonschilder; Kapitel-Config: props) – Dinge im Bereich einer Kante entfallen
function drawProps(g,game,t,L){const c=game.story&&game.story.cfg,T=game.story&&game.story.terrain;if(!c)return;const pp=c.parkour&&c.parkour.platforms,pz=pp?[Math.min(...pp.map(q=>q.x0))-80,Math.max(...pp.map(q=>q.x1))+80]:null;g.save();
 for(const o of c.props||[]){const x=o.x;if(T&&T.ledges.some(l=>x>l.x0-50&&x<l.x1+50))continue;if(pz&&x>pz[0]&&x<pz[1])continue;
  if(o.k==='crate'){g.fillStyle='#1b1428';g.fillRect(x-34,GROUND-52,68,52);g.fillRect(x-22,GROUND-92,46,40);g.strokeStyle=L.line;g.globalAlpha=.7;g.lineWidth=2;g.strokeRect(x-34,GROUND-52,68,52);g.strokeRect(x-22,GROUND-92,46,40);g.beginPath();g.moveTo(x-34,GROUND-52);g.lineTo(x+34,GROUND);g.moveTo(x+34,GROUND-52);g.lineTo(x-34,GROUND);g.stroke();g.globalAlpha=1}
  else if(o.k==='barrel'){g.fillStyle='#211832';g.beginPath();g.ellipse(x,GROUND-5,24,6,0,0,7);g.fill();g.fillRect(x-24,GROUND-62,48,58);g.fillStyle=L.line;g.globalAlpha=.55;g.fillRect(x-24,GROUND-48,48,4);g.fillRect(x-24,GROUND-20,48,4);g.globalAlpha=1;g.strokeStyle='#3a2f58';g.lineWidth=2;g.strokeRect(x-24,GROUND-62,48,58)}
  else if(o.k==='sign'){g.fillStyle='#1a1426';g.fillRect(x-2,GROUND-150,4,150);const fl=.75+.25*Math.sin(t*3+x),w=90;g.fillStyle='rgba(10,6,20,.9)';g.fillRect(x-w/2,GROUND-190,w,40);g.strokeStyle=L.acc;g.globalAlpha=fl;g.lineWidth=2;g.strokeRect(x-w/2,GROUND-190,w,40);g.fillStyle=L.acc;g.fillRect(x-30,GROUND-176,60,5);g.fillRect(x-20,GROUND-164,40,5);g.globalAlpha=1}}
 g.restore()}
// ---------- Schwarzmarkthändler KORVUS (NPC): Marktstand + Rabe in der Welt, Dialog-Panel im HUD ----------
// Welt (unter der Kamera, vor den Kämpfern gezeichnet): Kisten, violette Laterne, Tuch mit Raben-Auge; Rabe mit Sprech-Gesten (Frames aus assets/rabe: Dealer.frame()).
export function drawDealer(g,game,t){const d=game.story&&game.story.dealer;if(!d||d.alpha<=.01)return;const x=d.x,a=d.alpha;
 g.save();g.globalAlpha=a;
 // Stand: Kisten + Tuch + Laterne (hinter dem Händler)
 g.fillStyle='#1b1428';g.fillRect(x-150,GROUND-46,64,46);g.fillRect(x-136,GROUND-84,46,38);g.fillStyle='#2a1f40';g.fillRect(x-150,GROUND-46,64,5);g.fillRect(x-136,GROUND-84,46,5);
 g.strokeStyle='#4a3b78';g.lineWidth=2;g.strokeRect(x-150,GROUND-46,64,46);g.strokeRect(x-136,GROUND-84,46,38);
 g.fillStyle='#3a2658';g.beginPath();g.moveTo(x+70,GROUND-168);g.lineTo(x+150,GROUND-168);g.lineTo(x+142,GROUND-96);g.lineTo(x+110,GROUND-108);g.lineTo(x+78,GROUND-96);g.closePath();g.fill();   // Tuch
 g.fillStyle='#b98bff';g.beginPath();g.moveTo(x+110,GROUND-150);g.lineTo(x+120,GROUND-136);g.lineTo(x+110,GROUND-122);g.lineTo(x+100,GROUND-136);g.closePath();g.fill();   // Raben-Auge
 g.fillStyle='#14101f';g.fillRect(x+108,GROUND-168,4,-16);
 {const fl=.8+.2*Math.sin(t*5+1);g.save();g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(x-60,GROUND-120,2,x-60,GROUND-120,130);rg.addColorStop(0,`rgba(176,110,255,${.5*fl})`);rg.addColorStop(1,'rgba(176,110,255,0)');g.fillStyle=rg;g.fillRect(x-200,GROUND-260,280,260);g.restore();
  g.fillStyle='#d6b8ff';g.fillRect(x-66,GROUND-132,12,16)}   // Laterne
 drawSpriteFrame(g,DEALER.id,d.frame(game.frame),x,GROUND,d.facing,.96,a);
 // Hinweis: E – ansprechen
 if(d.near&&!d.active&&a>.9){const bob=Math.sin(t*4)*3,bx=x,by=GROUND-262+bob;g.fillStyle='rgba(10,6,20,.82)';g.strokeStyle='#b98bff';g.lineWidth=2;g.beginPath();g.roundRect?g.roundRect(bx-74,by-16,148,28,8):g.rect(bx-74,by-16,148,28);g.fill();g.stroke();
  g.fillStyle='#ffffff';g.font='700 15px Rajdhani, "Segoe UI", sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('E  –  ANSPRECHEN',bx,by-1)}
 g.restore()}
// Dialog-Panel (Bildschirmraum): Porträt, Name, Text (tippt sich ein), Auswahlzeilen rechts (Maus + Tasten), Coins/Booster oben.
export const DLG={x:24,y:76,w:W-48,h:214};   // oben, damit der Händler (Sprech-Gesten) und der Spieler darunter sichtbar bleiben
export const dealerOptRect=i=>({x:W-362,y:DLG.y+14+i*36,w:322,h:31});
export function hitDealerOpt(lx,ly,n){for(let i=0;i<n;i++){const r=dealerOptRect(i);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
export function drawDealerUi(g,hud,game,t){const d=game.story&&game.story.dealer;if(!d||!d.active)return;const ch=CHARACTERS[DEALER.id],col=ch.glow;
 g.save();g.globalAlpha=.32;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=1;
 hud.kPlate(g,DLG.x,DLG.y,DLG.w,DLG.h,{col,on:true,sk:10,t});
 g.fillStyle='#0b0716cc';g.fillRect(DLG.x+14,DLG.y+14,150,150);g.strokeStyle=col;g.lineWidth=2;g.strokeRect(DLG.x+14,DLG.y+14,150,150);
 g.save();g.beginPath();g.rect(DLG.x+15,DLG.y+15,148,148);g.clip();   // Porträt = aktuelle Sprech-Pose (Oberkörper), die Gesten wechseln mit dem Text
 if(!drawSpriteFrame(g,DEALER.id,d.frame(game.frame),DLG.x+89,DLG.y+19+246,1,1.2,1,false))drawPortrait(g,ch,DLG.x+89,DLG.y+82,138,false);
 g.restore();
 hud.txt(g,DEALER.name,DLG.x+89,DLG.y+184,20,'#ffffff','center',col);hud.txt(g,DEALER.title,DLG.x+89,DLG.y+202,10,'#d6b8ff','center');
 const tx=DLG.x+190,ls=wrapText(d.say.slice(0,Math.floor(d.shown)),44);
 ls.forEach((ln,i)=>hud.txt(g,ln,tx,DLG.y+40+i*25,16,'#f2ecff','left'));
 if(!d.typing&&d.node==='menu'&&Math.floor(t*2)%2===0)hud.txt(g,'▼',tx+330,DLG.y+DLG.h-62,14,col,'center');
 hud.txt(g,`COINS ${LOOT.coins}  ·  BOOSTER ${LOOT.packs}`,tx,DLG.y+DLG.h-32,13,'#ffd23f','left');
 hud.txt(g,'↑↓ wählen · ENTER / E bestätigen · ESC zurück',tx,DLG.y+DLG.h-14,11,'#9aa4e8','left');
 d.opts.forEach((o,i)=>{const r=dealerOptRect(i),on=i===d.sel;hud.kPlate(g,r.x,r.y,r.w,r.h,{col:o.ok?col:'#6a6a80',on,sk:6,t,al:o.ok?1:.6});
  hud.txt(g,o.label,r.x+16,r.y+20,14,o.ok?(on?'#ffffff':'#d6c8ff'):'#8a8aa0','left',on&&o.ok?col:null);
  if(o.sub)hud.txt(g,o.sub,r.x+r.w-14,r.y+20,11,o.ok?'#ffd23f':'#a06a70','right')});
 g.restore()}
export function storyMobBars(g,game){const s=game.story;if(!s)return;
 for(const it of s.items||[]){const b=Math.sin(game.frame/12+it.x)*3,x=it.x,y=it.y+b;const pk=it.kind==='pack',c=pk?'#72e9f4':'#9a8dff';g.save();g.shadowColor=c;g.shadowBlur=14;g.fillStyle=pk?'#082b37':'#171333';g.strokeStyle=c;g.lineWidth=2.5;g.beginPath();g.moveTo(x-8,y-30);g.lineTo(x+13,y-30);g.lineTo(x+13,y-5);g.lineTo(x+8,y);g.lineTo(x-13,y);g.lineTo(x-13,y-25);g.closePath();g.fill();g.stroke();
  g.fillStyle=c;if(pk){g.beginPath();for(let i=0;i<10;i++){const r=i%2?4:9,a=i*Math.PI/5-Math.PI/2;g.lineTo(x+Math.cos(a)*r,y-15+Math.sin(a)*r)}g.fill()}else{g.fillRect(x-3,y-24,6,18);g.fillRect(x-9,y-18,18,6)}g.restore()}
 for(const m of s.alive()){const z=m.char.size||1,w=52*z,x=m.x-w/2,y=m.y-168*z,a=m.char.id==='mantisAlpha';if(m.char.storyBoss||(!a&&m.hp>=m.maxHp))continue;
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-1,y-1,w+2,7);g.fillStyle=a?'#ff7a3a':'#8dff6a';g.fillRect(x,y,w*Math.max(0,m.hp/m.maxHp),5)}}
export const bar=(g,x,y,w,h,v,c0,c1)=>{g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-2,y-2,w+4,h+4);const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,c0);gr.addColorStop(1,c1);g.fillStyle=gr;g.fillRect(x,y,w*Math.max(0,Math.min(1,v)),h)};
export function drawStoryHud(g,hud,game,t,cv){const s=game.story,p=game.p1,A=game.arcade;if(!s)return;const E=s.encs,L=s.cfg.look,ACC=L.acc;
 g.save();
 hud.storyBase(g,game,game.frame);   // gleiche Leiste wie in den anderen Modi
 const wv=Math.min(s.enc+(s.state==='fight'?1:0),E.length);hud.lab(g,`KAPITEL ${s.ch}  ·  WELLE ${wv}/${E.length}`,W-28,30,12,'#ffffff','right',3,ACC);hud.lab(g,`BESIEGT  ${s.kills}`,W-28,50,10,'#b9c4ff','right',3);hud.lab(g,`BOOSTER ${LOOT.packs}   ·   COINS ${LOOT.coins}`,W-28,68,10,'#ffd23f','right',3);
 {const pk=s.cfg.parkour;if(pk&&p.y<GROUND-110){const hgt=Math.max(0,(GROUND-p.y)/100),tot=pk.height/100,bx=W-22,by=140,bh=250,f=Math.min(1,hgt/tot);   // Höhenanzeige beim Klettern
  g.save();g.fillStyle='rgba(185,196,255,.25)';g.fillRect(bx,by,4,bh);g.fillStyle='#ffd23f';g.shadowColor='#ffd23f';g.shadowBlur=8;g.fillRect(bx,by+bh*(1-f),4,bh*f);g.beginPath();g.arc(bx+2,by+bh*(1-f),6,0,7);g.fill();g.restore();
  hud.lab(g,`HÖHE ${hgt.toFixed(0)} m`,W-34,by+bh*(1-f)+4,11,'#ffd23f','right',2,'#ffd23f');hud.lab(g,`SCHATZ ${tot.toFixed(0)} m`,W-34,by-8,9,'#ffd23f','right',2)}}
 const px=W/2-40,pw=260,py=30;g.fillStyle='rgba(185,196,255,.28)';g.fillRect(px,py,pw,2);
 for(let i=0;i<E.length;i++){const x=px+(E[i].x-LV.start)/(LV.x1-LV.start)*pw;g.fillStyle=i<s.cp?'#7dff9a':E[i].boss?'#ff7a3a':'#ffffff';g.save();g.translate(x,py+1);g.rotate(Math.PI/4);g.fillRect(-3.5,-3.5,7,7);g.restore()}
 g.save();g.fillStyle='#63e5ee';g.shadowColor='#6fe3ff';g.shadowBlur=10;g.beginPath();g.arc(px+Math.max(0,Math.min(1,(p.x-LV.start)/(LV.x1-LV.start)))*pw,py+1,4.5,0,7);g.fill();g.restore();
 if(s.msg){const m=s.msg,a=Math.min(1,m.t/25,(170-Math.min(170,m.t))/12+.2);g.globalAlpha=Math.max(0,Math.min(1,a));hud.txt(g,m.title,W/2,150,38,'#ffffff','center',ACC);hud.txt(g,m.say,W/2,182,16,'#e8ecff','center');g.globalAlpha=1}
 if(s.state==='walk'&&s.goT>70&&s.enc<E.length&&!(s.dealer&&s.dealer.active)&&Math.floor(t*2)%2===0)hud.txt(g,'WEITER  ➜',W-110,250,26,'#ffffff','center',ACC);
 const bo=s.alive().find(m=>m.char.storyBoss);   // Boss-Leiste (oben Mitte): Name, Lebensbalken, Marke bei 50 % (Wutphase)
 if(bo&&game.phase==='fight'){const bw=480,bx=W/2-bw/2,by=92;hud.lab(g,bo.char.name,W/2,78,14,'#ffffff','center',5,bo.char.glow);hud.kBar(g,bx,by,bw,12,bo.hp/bo.maxHp,'#ff4a5a',game.frame,8);g.fillStyle='rgba(255,255,255,.7)';g.fillRect(bx+bw/2-1,by-3,2,18);if(s.rage&&Math.floor(t*3)%2===0)hud.txt(g,'WUT',bx+bw+34,by+13,12,'#ff6a7a','center')}
 if(game.phase==='fight'&&s.cp===0&&s.ft<420&&s.state==='walk')hud.txt(g,'A / D laufen · W springen · J K L Angriff · U Special · O Dash · 1 2 3 Items',W/2,H-24,13,'#c9d0ff','center');
 if(game.phase==='intro'&&s.cp===0){const a=game.pf<190?1:Math.max(0,1-(game.pf-190)/70);g.globalAlpha=.78*a;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=a;
  hud.txt(g,'KAPITEL '+s.ch,W/2,190,16,ACC,'center');hud.txt(g,s.cfg.name,W/2,240,s.cfg.name.length>14?40:50,'#ffffff','center',ACC);
  hud.txt(g,s.cfg.intro[0],W/2,290,15,'#e8ecff','center');hud.txt(g,s.cfg.intro[1],W/2,314,15,'#e8ecff','center');g.globalAlpha=1}
 if(A&&(A.state==='gameover'||A.state==='victory')){const v=A.state==='victory';g.globalAlpha=.7;g.fillStyle='#04020a';g.fillRect(0,0,W,H);g.globalAlpha=1;
  hud.txt(g,v?s.cfg.win.title:'BESIEGT',W/2,230,v&&s.cfg.win.title.length>14?46:54,'#ffffff','center',v?ACC:'#ff4a5a');
  hud.txt(g,v?s.cfg.win.say:'ENTER – weiter ab Checkpoint',W/2,280,18,'#e8ecff','center');
  if(v&&A.hasNextChapter){const nx=CHAPTERS[s.ch];hud.txt(g,`ENTER – Kapitel ${nx.id}: ${nx.name}`,W/2,318,20,'#ffffff','center',nx.look.acc)}
  if(v&&s.ch===3&&!ownsChar('cyberdemon'))hud.txt(g,`NEU IM SHOP: ${CHARACTERS.cyberdemon.name} – als Kämpfer kaufbar (Taste P)`,W/2,A.hasNextChapter?378:340,18,'#ffb347','center','#ffb347');   // Kapitel 3 geschafft (steht unter der ESC-Zeile): A1LIEN wird im Shop kaufbar
  if(v&&s.ch===4&&!ownsChar('anubis')){const au=CLEAR_UNLOCKS.find(u=>u.id==='anubis');hud.txt(g,`${CHARACTERS.anubis.name}: im Shop kaufbar (Taste P)${au?` oder nach ${au.n} Durchläufen frei`:''}`,W/2,A.hasNextChapter?378:340,18,'#ffd45a','center','#ffd45a')}   // Kapitel 4 geschafft: Hinweis auf Anubis
  if(v&&!A.hasNextChapter&&!ownsChar('bear')){const bu=CLEAR_UNLOCKS.find(u=>u.id==='bear');hud.txt(g,`${CHARACTERS.bear.name}: im Shop kaufbar (Taste P)${bu?` oder nach ${bu.n} Durchläufen frei`:''}`,W/2,340,18,'#e08a4a','center','#e08a4a')}   // Story durchgespielt: Hinweis auf URSUS
  if(v&&A.newUnlock)hud.txt(g,`NEUER KÄMPFER FREIGESCHALTET: ${CHARACTERS[A.newUnlock].name}`,W/2,372,18,'#7dff4a','center','#7dff4a');   // z. B. ST3-G0 nach dem 3. Durchlauf
  hud.txt(g,'ESC – Menü'+(LOOT.packs>0?`   ·   B – Booster öffnen (${LOOT.packs})`:''),W/2,v&&A.hasNextChapter?348:308,14,'#9aa4e8','center')}
 drawItemBar(g,hud,game,t);
 drawDealerUi(g,hud,game,t);
 g.restore()}
// Item-Leiste unten links: Taste 1/2/3, Name, Anzahl im Beutel (grau = leer, Rahmen = zuletzt gewähltes Item für Q / R3)
export function drawItemBar(g,hud,game,t){const s=game.story;if(!s||game.phase!=='fight'||s.state==='done'||(s.dealer&&s.dealer.active))return;
 const w=100,h=42,gap=8,x0=28,y=H-90;
 ITEMS.forEach((it,i)=>{const n=itemCount(it.id),x=x0+i*(w+gap),on=n>0&&i===s.isel;
  hud.kPlate(g,x,y,w,h,{col:n?it.col:'#6a6a80',on,sk:6,t,al:n?1:.55});
  hud.txt(g,String(i+1),x+15,y+26,16,n?'#ffffff':'#8a8aa0','center',n?it.col:null);
  hud.txt(g,it.short,x+w/2+10,y+17,11,n?'#ffffff':'#8a8aa0','center');
  hud.txt(g,'x'+n,x+w/2+10,y+34,12,n?'#ffd23f':'#8a8aa0','center')})}
