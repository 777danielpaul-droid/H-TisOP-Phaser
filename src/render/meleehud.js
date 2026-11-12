import{GROUND,H,MELEE,W}from'../core/config.js';


// Melee-Modus: Bühne (offene Plattform über dem Abgrund), Respawn-Plattform und HUD (Prozent, Stocks, Pfeile für Kämpfer außerhalb des Bildes).
export const MC=['#6fe3ff','#c28bff'];
export const mclamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,u)=>a+(b-a)*u;
export const hex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.round(mclamp(v,0,255)).toString(16).padStart(2,'0')).join('');
// Prozentfarbe im Kristall-Look: weiß -> eisblau (50) -> hellviolett (100) -> violett (150) -> tiefes Indigo (250+)
export function pctColor(p){const st=[[0,255,255,255],[50,159,232,255],[100,185,150,255],[150,140,100,255],[250,80,60,200]];
 for(let i=1;i<st.length;i++)if(p<=st[i][0]){const a=st[i-1],b=st[i],u=(p-a[0])/(b[0]-a[0]);return hex(mix(a[1],b[1],u),mix(a[2],b[2],u),mix(a[3],b[3],u))}
 return hex(80,60,200)}
// Welt-Raum (unter Kamera-Transform): Hintergrund-Boden wird durch den Abgrund ersetzt, darauf schwebt die Plattform
export function meleeStage(g,T,t,cbg){const M=MELEE,x0=-1100,x1=2100,y1=1500,pl=M.pl,pr=M.pr,mid=(pl+pr)/2,L=T.line||'#3fe0ff';
 g.save();
 const vg=g.createLinearGradient(0,GROUND-4,0,y1);vg.addColorStop(0,T.sky[4]||'#0a0618');vg.addColorStop(.18,'#07030f');vg.addColorStop(1,'#000000');if(!cbg){g.fillStyle=vg;g.fillRect(x0,GROUND-3,x1-x0,y1-GROUND+3)}
 // Der Hintergrund-Boden (Horizont bis Fußlinie) wird abgedunkelt; nur die Plattform bekommt eine sichtbare Standfläche
 const hz=GROUND-130,bg=g.createLinearGradient(0,hz,0,GROUND);bg.addColorStop(0,(T.sky[3]||'#2c0f55')+'00');bg.addColorStop(.35,(T.sky[4]||'#0a0618')+'e6');bg.addColorStop(1,T.sky[4]||'#0a0618');if(!cbg){g.fillStyle=bg;g.fillRect(x0,hz,x1-x0,GROUND-hz-2)}
 const dk=g.createLinearGradient(0,GROUND-26,0,GROUND);dk.addColorStop(0,T.floor?T.floor[0]:'#1a0e3a');dk.addColorStop(1,'#0c061c');g.fillStyle=dk;g.beginPath();g.moveTo(pl-16,GROUND);g.lineTo(pr+16,GROUND);g.lineTo(pr-4,GROUND-26);g.lineTo(pl+4,GROUND-26);g.closePath();g.fill();
 g.strokeStyle=L+'aa';g.lineWidth=1.6;g.beginPath();g.moveTo(pl+4,GROUND-26);g.lineTo(pr-4,GROUND-26);g.stroke();
 // Nebel/Lichtschlieren im Abgrund
 g.globalCompositeOperation='lighter';const lc=T.lights||['#7a4cff','#3fe0ff','#b98bff'];
 for(let i=0;i<34;i++){const h=Math.sin(i*91.7)*43758.5453,r=h-Math.floor(h),xx=x0+((r*7919+i*263)%(x1-x0)),sp=.25+r*.5,yy=GROUND+30+((i*131+t*sp*40)%(y1-GROUND-60));g.globalAlpha=.05+.07*r;g.fillStyle=lc[i%3];g.fillRect(xx,yy,2,26+r*60)}
 g.globalAlpha=1;g.globalCompositeOperation='source-over';
 // Blast-Zonen: leicht pulsierender Rand (links/rechts/unten)
 const bz=g.createLinearGradient(M.x0,0,M.x0-120,0);bz.addColorStop(0,'#8f7bff30');bz.addColorStop(1,'#8f7bff00');g.fillStyle=bz;g.fillRect(M.x0-120,-600,120,2200);
 const bz2=g.createLinearGradient(M.x1,0,M.x1+120,0);bz2.addColorStop(0,'#8f7bff30');bz2.addColorStop(1,'#8f7bff00');g.fillStyle=bz2;g.fillRect(M.x1,-600,120,2200);
 const bz3=g.createLinearGradient(0,M.y1,0,M.y1+120);bz3.addColorStop(0,'#8f7bff30');bz3.addColorStop(1,'#8f7bff00');g.fillStyle=bz3;g.fillRect(M.x0-120,M.y1,M.x1-M.x0+240,120);
 // Plattform: Oberseite auf Fußhöhe (GROUND), Unterseite läuft schräg zusammen (schwebende Insel)
 const sl=[[pl-16,GROUND],[pr+16,GROUND],[pr+16,GROUND+22],[pr-60,GROUND+66],[pr-170,GROUND+112],[mid+60,GROUND+150],[mid,GROUND+168],[mid-60,GROUND+150],[pl+170,GROUND+112],[pl+60,GROUND+66],[pl-16,GROUND+22]];
 g.beginPath();g.moveTo(sl[0][0],sl[0][1]);for(const p of sl)g.lineTo(p[0],p[1]);g.closePath();
 const pg=g.createLinearGradient(0,GROUND,0,GROUND+170);pg.addColorStop(0,T.floor?T.floor[0]:'#1a0e3a');pg.addColorStop(.25,'#120a26');pg.addColorStop(1,'#04020a');g.fillStyle=pg;g.fill();
 g.save();g.clip();g.strokeStyle=(T.grid||'#8f5bff')+'55';g.lineWidth=1.2;for(let x=pl-60;x<pr+60;x+=36){g.beginPath();g.moveTo(x,GROUND+2);g.lineTo(mid+(x-mid)*.2,GROUND+170);g.stroke()}
 for(let k=1;k<6;k++){const y=GROUND+Math.pow(k/6,1.4)*160;g.beginPath();g.moveTo(pl-20,y);g.lineTo(pr+20,y);g.stroke()}g.restore();
 // Leuchtkante oben + Glühen unter der Insel
 g.shadowColor=L;g.shadowBlur=18;g.strokeStyle=L;g.lineWidth=3;g.beginPath();g.moveTo(pl-16,GROUND+1);g.lineTo(pr+16,GROUND+1);g.stroke();g.shadowBlur=0;
 g.strokeStyle=L+'88';g.lineWidth=1.6;g.beginPath();g.moveTo(sl[2][0],sl[2][1]);for(let i=3;i<=9;i++)g.lineTo(sl[i][0],sl[i][1]);g.lineTo(sl[10][0],sl[10][1]);g.stroke();
 g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(mid,GROUND+150,10,mid,GROUND+150,260);gl.addColorStop(0,L+'44');gl.addColorStop(1,L+'00');g.fillStyle=gl;g.fillRect(mid-260,GROUND+20,520,330);
 g.restore()}
// Respawn-Plattform: leuchtende Scheibe unter dem schwebenden Kämpfer
export function meleeHalo(g,f,t){if(!(f.hover>0))return;const col=f.char.glow||'#fff',a=.65+.25*Math.sin(t*9),fade=Math.min(1,f.hover/18);
 g.save();g.translate(f.x,f.y+3);g.globalAlpha=fade;g.globalCompositeOperation='lighter';
 const rg=g.createRadialGradient(0,0,4,0,0,70);rg.addColorStop(0,col+'aa');rg.addColorStop(.55,col+'44');rg.addColorStop(1,col+'00');g.save();g.scale(1,.22);g.fillStyle=rg;g.beginPath();g.arc(0,0,70,0,7);g.fill();g.restore();
 g.strokeStyle='#ffffff';g.globalAlpha=fade*a;g.lineWidth=2.4;g.shadowColor=col;g.shadowBlur=14;g.beginPath();g.ellipse(0,0,50,9,0,0,7);g.stroke();g.globalAlpha=fade*a*.6;g.beginPath();g.ellipse(0,0,34,6,0,0,7);g.stroke();
 g.restore()}
// Bildschirm-Raum: Prozent-Plaketten unten, Stocks, Pfeile für Kämpfer außerhalb des Bildes
export function drawMeleeHud(g,hud,game,t){const cam=game.camera,mx=game.melee&&game.melee.stocks||MELEE.stocks;
 hud._mp=hud._mp||[0,0];hud._ms=hud._ms||[0,0];
 game.fighters.forEach((f,i)=>{const cx=i?W*.75:W*.25,col=MC[i],pc=pctColor(f.pct),dead=f.dead>0;
  if(f.pct>hud._mp[i])hud._ms[i]=14;hud._mp[i]=f.pct;if(hud._ms[i]>0)hud._ms[i]--;
  const sh=hud._ms[i]>0?(Math.random()-.5)*hud._ms[i]*.7:0;
  g.save();g.translate(sh,Math.abs(sh)*.4);
  // Plakette
  const px=cx-128,py=H-134,pw=256,ph=84;g.fillStyle='#080a1ccc';g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=14;g.lineWidth=2;g.beginPath();g.moveTo(px+12,py);g.lineTo(px+pw,py);g.lineTo(px+pw-12,py+ph);g.lineTo(px,py+ph);g.closePath();g.fill();g.stroke();g.shadowBlur=0;
  const gr=g.createLinearGradient(px,py,px+pw,py);gr.addColorStop(0,col+'33');gr.addColorStop(1,col+'00');g.fillStyle=gr;g.fill();
  hud.txt(g,`P${i+1}  ·  ${f.char.name}`,px+16,py+19,12,col,'left');
  // Prozent (groß, Farbe steigt mit dem Wert)
  hud.fancy(g,String(Math.round(f.pct)),px+pw-40,py+60,34,['#ffffff',pc],'right',pc,t);hud.txt(g,'%',px+pw-36,py+60,16,pc,'left');
  // Stocks
  for(let k=0;k<mx;k++){const sx=px+22+k*19,sy=py+58,on=k<f.stocks;g.beginPath();g.arc(sx,sy,7,0,7);if(on){g.fillStyle=col;g.shadowColor=col;g.shadowBlur=10;g.fill();g.shadowBlur=0;g.strokeStyle='#ffffffcc';g.lineWidth=1.4;g.stroke()}else{g.strokeStyle=col+'66';g.lineWidth=1.6;g.stroke()}}
  if(dead&&f.stocks>0)hud.txt(g,'…',px+pw/2,py-6,13,col,'center');
  g.restore();
  // Pfeil, wenn der Kämpfer außerhalb des Bildes ist
  if(dead)return;const[sx,sy]=cam.toScreen(f.x,f.y-70),m=30;
  if(sx<-4||sx>W+4||sy<-4||sy>H+4){const bx=mclamp(sx,m,W-m),by=mclamp(sy,m+10,H-m-10),a=Math.atan2(sy-by,sx-bx);
   g.save();g.translate(bx,by);g.globalAlpha=.9;g.fillStyle='#080a1ccc';g.strokeStyle=col;g.lineWidth=2;g.shadowColor=col;g.shadowBlur=10;g.beginPath();g.arc(0,0,16,0,7);g.fill();g.stroke();g.shadowBlur=0;
   g.rotate(a);g.fillStyle=col;g.beginPath();g.moveTo(26,0);g.lineTo(17,-6);g.lineTo(17,6);g.closePath();g.fill();g.rotate(-a);hud.txt(g,'P'+(i+1),0,4,11,'#ffffff','center');g.restore()}})}
