// Gebäude-Varianten je Level (links/rechts verschieden): Fassade oben, brechbare Erdgeschoss-Wand, Innenraum.
// buildHouse(style,c) bekommt den Zeichen-Kontext aus Renderer.houseLayers (mk = Offscreen-Ebene, Maße, Seed-Zufall) und liefert {upper,ground,inner}.
// 'city' (Neon City) bleibt im Renderer; hier: temple, docks, labyrinth.
const hh=k=>{const s=Math.sin(k*12.9898)*43758.5453;return s-Math.floor(s)};
const glow=(g,x,y,r,col)=>{g.save();g.globalCompositeOperation='lighter';const lg=g.createRadialGradient(x,y,2,x,y,r);lg.addColorStop(0,col);lg.addColorStop(1,'#0000');g.fillStyle=lg;g.fillRect(x-r,y-r,r*2,r*2);g.restore()};
const hazard=(g,x,y,w,h,a='#e8c21a',b='#141008')=>{g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle=b;g.fillRect(x,y,w,h);g.fillStyle=a;for(let i=-h;i<w+h;i+=16){g.beginPath();g.moveTo(x+i,y+h);g.lineTo(x+i+8,y+h);g.lineTo(x+i+8+h,y);g.lineTo(x+i+h,y);g.fill()}g.restore()};
const lamp=(g,x,y,col,r=60)=>{glow(g,x,y,r,col+'66');g.fillStyle=col;g.beginPath();g.arc(x,y,4,0,7);g.fill()};
const bricks=(g,x0,x1,y0,y1,bh,base,var_,mortar,seed)=>{let row=0;for(let y=y0;y<y1;y+=bh,row++){let x=x0-(row%2?26:0),k=0;while(x<x1){const bw=44+hh(seed+row*13+k)*26,l=hh(seed+row*7+k*3)*var_;g.fillStyle=`rgb(${base[0]+l|0},${base[1]+l*.6|0},${base[2]+l*.4|0})`;g.fillRect(x,y,bw-2,bh-2);x+=bw;k++}}g.fillStyle=mortar;g.globalAlpha=.35;for(let y=y0;y<y1;y+=bh)g.fillRect(x0,y-1,x1-x0,2);g.globalAlpha=1};
const flare=(g,x,y,r)=>{glow(g,x,y,r,'#ff8a2a88');glow(g,x,y+4,r*.45,'#ffe09aaa')};

// ===================== TEMPEL: links Dojo, rechts Schrein =====================
function temple(c){const{T,isR,mk,top,bot,fl,X0,X1,sa,sb,ew,mid,R,ceil,edge,neon}=c,wood='#2a1014',red='#8a1a1c',gold='#ffb347';
 const lantern=(g,x,y,s=1)=>{glow(g,x,y,46*s,'#ff3a2a55');g.fillStyle='#c83222';g.beginPath();g.ellipse(x,y,9*s,12*s,0,0,7);g.fill();g.fillStyle='#ffd27a';g.globalAlpha=.7;g.fillRect(x-1,y-12*s,2,24*s);g.globalAlpha=1;g.fillStyle='#1a0808';g.fillRect(x-5*s,y-14*s,10*s,3);g.fillRect(x-5*s,y+11*s,10*s,3)};
 const shoji=(g,x,y,w,h,lit)=>{if(lit){g.save();g.shadowColor='#ff9a4a';g.shadowBlur=18;const pg=g.createLinearGradient(0,y,0,y+h);pg.addColorStop(0,'#ffeec4');pg.addColorStop(1,'#ff9a4a');g.fillStyle=pg;g.fillRect(x,y,w,h);g.restore()}else{g.fillStyle='#3a1c1a';g.fillRect(x,y,w,h)}
  g.strokeStyle='#14070a';g.lineWidth=2.5;g.strokeRect(x,y,w,h);g.beginPath();for(let k=1;k<3;k++){g.moveTo(x+k*w/3,y);g.lineTo(x+k*w/3,y+h)}for(let k=1;k<5;k++){g.moveTo(x,y+k*h/5);g.lineTo(x+w,y+k*h/5)}g.stroke()};
 const upper=mk(-420,top+420,g=>{const yT=-420,bg=g.createLinearGradient(0,yT,0,top);bg.addColorStop(0,'#0e0508');bg.addColorStop(1,'#241014');g.fillStyle=bg;g.fillRect(sa,yT,sb-sa,top-yT);const pitch=120;
  for(let fy=top-20;fy>yT-60;fy-=pitch){g.fillStyle=wood;g.fillRect(sa,fy-pitch+22,sb-sa,pitch-34);
   for(let x=X0+16;x<X1-30;x+=64)shoji(g,x,fy-pitch+36,42,62,R()<.55);
   for(let x=X0+2;x<X1+24;x+=192){g.fillStyle=red;g.fillRect(x,fy-pitch+22,12,pitch-34);g.fillStyle='#ffffff18';g.fillRect(x+2,fy-pitch+22,2,pitch-34)}
   g.fillStyle='#12080b';g.beginPath();g.moveTo(sa-22,fy-26);g.quadraticCurveTo(sa+40,fy+6,sa+110,fy+6);g.lineTo(sb-110,fy+6);g.quadraticCurveTo(sb-40,fy+6,sb+22,fy-26);g.lineTo(sb,fy-12);g.lineTo(sa,fy-12);g.fill();   // Ziegeldach mit hochgezogenen Traufen
   g.strokeStyle='#ffffff10';g.lineWidth=1;for(let x=sa;x<sb;x+=9){g.beginPath();g.moveTo(x,fy-12);g.lineTo(x+2,fy+4);g.stroke()}g.fillStyle=gold+'88';g.fillRect(sa,fy+4,sb-sa,2);
   for(let x=X0+60;x<X1;x+=192)lantern(g,x,fy+26,.9)}
  const fade=g.createLinearGradient(0,top,0,yT);fade.addColorStop(0,'#0000');fade.addColorStop(1,'#000000aa');g.fillStyle=fade;g.fillRect(sa,yT,sb-sa,top-yT);
  g.fillStyle='#0a0406';g.fillRect(isR?sb-10:sa,yT,10,top-yT);edge(g,yT,top);g.fillStyle='#14080a';g.fillRect(sa,top-22,sb-sa,24);g.fillStyle=gold+'66';g.fillRect(sa,top-3,sb-sa,3)});
 const ground=mk(top,bot-top+14,g=>{const wg=g.createLinearGradient(0,top,0,bot);wg.addColorStop(0,'#321418');wg.addColorStop(1,'#1a0a0c');g.fillStyle=wg;g.fillRect(sa,top,sb-sa,bot-top);
  for(let x=X0-20;x<sb;x+=120){g.fillStyle=red;g.fillRect(x,top,14,bot-top);g.fillStyle='#ffffff1c';g.fillRect(x+2,top,2,bot-top);g.fillStyle='#00000066';g.fillRect(x+12,top,2,bot-top)}
  g.fillStyle='#14070a';g.fillRect(sa,top+8,sb-sa,10);g.fillRect(sa,top+92,sb-sa,8);g.fillRect(sa,bot-30,sb-sa,30);
  for(const off of[-300,-190,190,300])shoji(g,mid+off-40,top+26,80,150,R()<.8);
  const dw=150,dx=mid-dw/2,dy=bot-160;g.fillStyle='#0d0507';g.fillRect(dx-10,dy-10,dw+20,170);shoji(g,dx,dy,dw/2-2,150,true);shoji(g,dx+dw/2+2,dy,dw/2-2,150,true);glow(g,mid,dy+80,150,'#ffa04a33');
  g.fillStyle='#8a1620';g.fillRect(dx-6,dy-6,dw+12,40);g.fillStyle='#00000055';for(let k=0;k<4;k++)g.fillRect(dx+k*(dw+12)/4-6,dy-6,2,40);g.fillStyle='#f4e6c8';g.font='bold 22px "Yu Gothic","Noto Sans CJK JP","Microsoft YaHei",serif';g.textAlign='center';g.fillText(isR?'神社':'道場',mid,dy+22);   // Noren
  g.fillStyle='#0d0507';g.fillRect(mid-100,dy-70,200,40);c.glowRect(g,mid-100,dy-70,200,40,gold,12);g.save();g.shadowColor=gold;g.shadowBlur=10;g.fillStyle=gold;g.font='bold 20px "Courier New",monospace';g.fillText(isR?'DRACHEN-SCHREIN':'DOJO',mid,dy-43);g.restore();
  lantern(g,mid-120,dy-20,1.3);lantern(g,mid+120,dy-20,1.3);g.fillStyle='#120608';g.fillRect(sa-4,bot-10,sb-sa+8,14);edge(g,top,bot)});
 const inner=mk(top-20,540-top+20,g=>{
  const wg=g.createLinearGradient(0,top,0,fl);if(isR){wg.addColorStop(0,'#1a0a0e');wg.addColorStop(1,'#3a1418')}else{wg.addColorStop(0,'#2c1812');wg.addColorStop(1,'#4a2a1c')}g.fillStyle=wg;g.fillRect(sa,top,sb-sa,fl-top);
  for(let x=X0;x<X1;x+=76){g.fillStyle=isR?'#00000030':'#ffe2a818';g.fillRect(x+6,top+30,64,fl-top-120);g.fillStyle='#0000004a';g.fillRect(x,top+18,3,fl-top-18)}            // Wandfelder / Papierwand
  g.fillStyle='#120708';g.fillRect(sa,top-20,sb-sa,ceil-top+20);g.fillStyle=gold+'55';g.fillRect(sa,ceil-2,sb-sa,2);for(let x=X0;x<X1;x+=110){g.fillStyle='#1c0c0e';g.fillRect(x,ceil,12,18);g.fillRect(x-4,ceil+14,20,6)}   // Deckenbalken
  g.fillStyle=isR?'#1a0a0c':'#26120e';g.fillRect(sa,fl-70,sb-sa,70);g.fillStyle=gold+'88';g.fillRect(X0,fl-72,X1-X0,3);
  const fg=g.createLinearGradient(0,fl,0,540);if(isR){fg.addColorStop(0,'#3a1c14');fg.addColorStop(1,'#120806')}else{fg.addColorStop(0,'#8a8248');fg.addColorStop(1,'#2a2810')}g.fillStyle=fg;g.fillRect(sa,fl,sb-sa,540-fl);
  g.strokeStyle='#00000066';g.lineWidth=1.5;for(let x=X0-200;x<X1+200;x+=isR?60:110){g.beginPath();g.moveTo(mid+(x-mid)*.3,fl);g.lineTo(x,540);g.stroke()}for(let k=0;k<4;k++){const y=fl+Math.pow(k/4,1.5)*80+6;g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}
  if(!isR){ // ===== Dojo: Tatami, Waffenständer, Taiko, Schriftrollen, Übungspuppe =====
   for(let i=0;i<7;i++){const x=X0+60+i*130+(i>3?30:0);g.fillStyle='#f0e4c6';g.fillRect(x,top+50,34,110);g.fillStyle='#7a1a1a';g.fillRect(x-2,top+46,38,5);g.fillRect(x-2,top+158,38,5);g.fillStyle='#1a0e0e';g.save();g.translate(x+17,top+104);g.rotate(R()*.4-.2);g.fillRect(-2,-40,4,80);g.restore();g.fillStyle='#c03030';g.fillRect(x+22,top+130,8,8)}
   const rx=X1-330;g.fillStyle='#4a2a1a';g.fillRect(rx,fl-110,150,8);g.fillRect(rx,fl-60,150,8);g.fillRect(rx,fl-110,8,110);g.fillRect(rx+142,fl-110,8,110);
   for(let i=0;i<5;i++){g.save();g.translate(rx+24+i*26,fl-56);g.rotate(-.12+i*.06);g.fillStyle=i%2?'#a8884a':'#6a4a2a';g.fillRect(-3,-62,6,92);g.restore()}
   const dx=X0+300;g.fillStyle='#5a3a22';g.fillRect(dx-6,fl-110,12,110);g.fillStyle='#7a5230';for(const[ay,ax]of[[fl-92,-34],[fl-76,28],[fl-60,-30]]){g.fillRect(dx+Math.min(0,ax),ay,Math.abs(ax),6)}g.fillStyle='#2a1810';g.fillRect(dx-24,fl-4,48,8);
   const tx=X0+520;g.fillStyle='#4a2a16';g.fillRect(tx-46,fl-92,8,92);g.fillRect(tx+38,fl-92,8,92);const dg=g.createRadialGradient(tx,fl-60,4,tx,fl-60,44);dg.addColorStop(0,'#f0e0b8');dg.addColorStop(1,'#a8341c');g.fillStyle=dg;g.beginPath();g.ellipse(tx,fl-60,44,44,0,0,7);g.fill();g.strokeStyle='#ffd27a';g.lineWidth=3;g.stroke();g.fillStyle='#ffd27a';for(let k=0;k<12;k++){const a=k/12*6.283;g.beginPath();g.arc(tx+Math.cos(a)*40,fl-60+Math.sin(a)*40,2,0,7);g.fill()}
   for(const lx of[X0+180,X0+440,X0+700,X1-160]){g.strokeStyle='#00000088';g.lineWidth=1.5;g.beginPath();g.moveTo(lx,ceil+18);g.lineTo(lx,ceil+58);g.stroke();lantern(g,lx,ceil+72,1.15)}
   g.fillStyle='#3a2014';g.fillRect(X1-120,fl-30,70,30);g.fillStyle='#d8c8a0';g.fillRect(X1-108,fl-40,10,10);g.fillRect(X1-88,fl-40,10,10);glow(g,mid,fl+10,260,'#ffb34718')}
  else{ // ===== Schrein: Altar, Bronzeglocke, Räucherschale, Laternenwald =====
   for(let x=X0+30;x<X1-20;x+=190){g.fillStyle=red;g.fillRect(x,top+18,18,fl-top-18);g.fillStyle=gold;g.fillRect(x-4,top+18,26,8);g.fillRect(x-4,fl-18,26,18);g.fillStyle='#ffffff18';g.fillRect(x+3,top+26,3,fl-top-40)}
   const ax=X0+430,aw=220;for(let i=0;i<3;i++){g.fillStyle=['#2a1410','#3a1c16','#4a241c'][i];g.fillRect(ax-aw/2+i*14,fl-26-i*20,aw-i*28,20)}g.fillStyle='#120608';g.fillRect(ax-70,fl-120,140,60);glow(g,ax,fl-130,170,'#ffcf7a55');
   g.fillStyle='#d6a84a';g.beginPath();g.arc(ax,fl-134,22,0,7);g.fill();g.beginPath();g.moveTo(ax-34,fl-66);g.quadraticCurveTo(ax-36,fl-112,ax,fl-108);g.quadraticCurveTo(ax+36,fl-112,ax+34,fl-66);g.fill();g.strokeStyle='#ffe9a8';g.lineWidth=2;g.beginPath();g.arc(ax,fl-136,34,0,7);g.stroke();                   // Statue mit Heiligenschein
   for(const kx of[-80,80]){g.fillStyle='#e8d8b0';g.fillRect(ax+kx-3,fl-52,6,20);flare(g,ax+kx,fl-58,34)}
   const bx=X0+720;g.fillStyle='#3a1c12';g.fillRect(bx-90,fl-150,10,150);g.fillRect(bx+80,fl-150,10,150);g.fillRect(bx-96,fl-156,192,12);g.strokeStyle='#00000088';g.lineWidth=3;g.beginPath();g.moveTo(bx,fl-148);g.lineTo(bx,fl-120);g.stroke();
   const bg2=g.createLinearGradient(bx-34,0,bx+34,0);bg2.addColorStop(0,'#6a4a1c');bg2.addColorStop(.45,'#d6a24a');bg2.addColorStop(1,'#4a3010');g.fillStyle=bg2;g.beginPath();g.moveTo(bx-18,fl-122);g.quadraticCurveTo(bx-22,fl-100,bx-36,fl-30);g.lineTo(bx+36,fl-30);g.quadraticCurveTo(bx+22,fl-100,bx+18,fl-122);g.fill();g.fillStyle='#00000055';g.fillRect(bx-30,fl-84,60,5);g.fillRect(bx-33,fl-56,66,5);
   g.fillStyle='#4a2a16';g.fillRect(bx-70,fl-86,56,10);g.fillStyle='#2a1810';g.fillRect(bx-74,fl-88,6,10);
   const ix=X1-200;g.fillStyle='#1a1a1e';g.beginPath();g.moveTo(ix-36,fl-50);g.lineTo(ix+36,fl-50);g.lineTo(ix+26,fl-8);g.lineTo(ix-26,fl-8);g.fill();g.fillStyle='#d6a84a';g.fillRect(ix-40,fl-54,80,6);g.fillStyle='#2a2a30';g.fillRect(ix-30,fl-8,12,8);g.fillRect(ix+18,fl-8,12,8);
   g.strokeStyle='#d8d0c8';g.globalAlpha=.3;g.lineWidth=5;g.lineCap='round';for(let k=0;k<3;k++){g.beginPath();g.moveTo(ix+(k-1)*10,fl-54);g.bezierCurveTo(ix+(k-1)*10+24,fl-90,ix+(k-1)*10-24,fl-120,ix+(k-1)*10+8,fl-150);g.stroke()}g.globalAlpha=1;
   const sx=X0+120;g.fillStyle='#2a1410';g.fillRect(sx,fl-40,90,40);g.fillStyle='#120608';for(let x=sx+6;x<sx+86;x+=10)g.fillRect(x,fl-40,5,12);g.fillStyle=gold;g.fillRect(sx-4,fl-44,98,5);
   for(let i=0;i<12;i++){const lx=X0+60+i*80+hh(i)*30,ly=ceil+30+hh(i+9)*110;g.strokeStyle='#00000088';g.lineWidth=1.2;g.beginPath();g.moveTo(lx,ceil+18);g.lineTo(lx,ly-12);g.stroke();lantern(g,lx,ly,.85+hh(i+3)*.4)}
   g.fillStyle=gold+'44';g.beginPath();g.ellipse(mid,c.GROUND+24,190,22,0,0,7);g.fill();g.strokeStyle=gold;g.lineWidth=2;g.beginPath();g.ellipse(mid,c.GROUND+24,160,16,0,0,7);g.stroke()}
  const vg=g.createLinearGradient(sa,0,sb,0);vg.addColorStop(0,'#000000aa');vg.addColorStop(.1,'#0000');vg.addColorStop(.9,'#0000');vg.addColorStop(1,'#000000bb');g.fillStyle=vg;g.fillRect(sa,top-20,sb-sa,540-top+20);
  c.backWall(g)});
 return{upper,ground,inner}}


// ===================== DOCKS: links Lagerhalle, rechts Kontrollraum =====================
function docks(c){const{T,isR,mk,top,bot,fl,X0,X1,sa,sb,ew,mid,R,ceil,edge,neon}=c,G=T.lights[0];
 const crate=(g,x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);g.strokeStyle='#00000066';g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2);g.beginPath();g.moveTo(x,y);g.lineTo(x+w,y+h);g.moveTo(x+w,y);g.lineTo(x,y+h);g.stroke();g.fillStyle='#d8c8a044';g.fillRect(x+w/2-3,y,6,h)};
 const barrel=(g,x,y,col='#1f6a44')=>{g.fillStyle=col;g.fillRect(x-14,y-38,28,38);g.fillStyle='#00000055';g.fillRect(x-14,y-26,28,3);g.fillRect(x-14,y-12,28,3);g.fillStyle='#e6ff5a';g.beginPath();g.moveTo(x,y-34);g.lineTo(x+7,y-22);g.lineTo(x-7,y-22);g.fill();glow(g,x,y-20,44,G+'33')};
 const upper=mk(-420,top+420,g=>{const yT=-420;g.fillStyle='#0a1412';g.fillRect(sa,yT,sb-sa,top-yT);const pal=['#7a2e1c','#1f5260','#8a6c1c','#2a3f70','#3e6030','#5a2e4c','#6a6a70'];
  let n=0;for(let y=top-44;y>yT-44;y-=44){let x=sa-(((y/44)|0)%2?50:0);while(x<sb){const w=90+hh(n)*26,col=pal[(hh(n*3+1)*pal.length)|0];n++;g.fillStyle=col;g.fillRect(x,y,w-2,42);g.fillStyle='#00000040';for(let k=4;k<w-4;k+=6)g.fillRect(x+k,y+2,2,38);g.fillStyle='#00000066';g.fillRect(x,y,w-2,3);g.fillRect(x,y+39,w-2,3);g.fillStyle='#ffffff14';g.fillRect(x,y,w-2,1.5);
    if(hh(n*7)<.3){g.fillStyle='#e8e2c8';g.globalAlpha=.55;g.font='bold 8px "Courier New",monospace';g.fillText('MSKU '+(((hh(n)*900000)|0)+100000),x+6,y+16);g.globalAlpha=1}x+=w}}
  for(let y=top-44*3;y>yT;y-=44*4){hazard(g,sa,y,sb-sa,6)}
  g.fillStyle='#00000088';g.fillRect(sa,yT,sb-sa,top-yT);const lg=g.createLinearGradient(0,top,0,yT);lg.addColorStop(0,'#0000');lg.addColorStop(1,'#000000aa');g.fillStyle=lg;g.fillRect(sa,yT,sb-sa,top-yT);
  for(let x=X0+6;x<X1+24;x+=250){g.fillStyle='#10201c';g.fillRect(x,yT,14,top-yT);g.fillStyle=G+'33';g.fillRect(x+12,yT,2,top-yT)}
  for(let y=top-30;y>yT;y-=140)for(let x=X0+70;x<X1;x+=250)lamp(g,x,y,y%280?G:'#ff4a3a',50);
  g.fillStyle='#050a08';g.fillRect(isR?sb-10:sa,yT,10,top-yT);edge(g,yT,top);g.fillStyle='#0c1614';g.fillRect(sa,top-22,sb-sa,24);hazard(g,sa,top-6,sb-sa,6)});
 const ground=mk(top,bot-top+14,g=>{const wg=g.createLinearGradient(0,top,0,bot);wg.addColorStop(0,'#24322f');wg.addColorStop(1,'#101a18');g.fillStyle=wg;g.fillRect(sa,top,sb-sa,bot-top);
  for(let x=sa;x<sb;x+=11){g.fillStyle='#00000030';g.fillRect(x,top,3,bot-top);g.fillStyle='#ffffff10';g.fillRect(x+3,top,1,bot-top)}
  for(let i=0;i<26;i++){const rx=sa+hh(i)*(sb-sa),rh=60+hh(i+5)*220,rg=g.createLinearGradient(0,top,0,top+rh);rg.addColorStop(0,'#7a3a1a55');rg.addColorStop(1,'#0000');g.fillStyle=rg;g.fillRect(rx,top,5+hh(i+2)*9,rh)}
  g.fillStyle='#ffffff18';for(let y=top+60;y<bot-30;y+=60)for(let x=sa+8;x<sb;x+=44){g.fillRect(x,y,2,2)}
  g.fillStyle='#142320';g.fillRect(sa,top+54,sb-sa,18);g.fillStyle='#ffffff10';g.fillRect(sa,top+54,sb-sa,2);for(let x=sa+30;x<sb;x+=140){g.fillStyle='#2a3d38';g.fillRect(x,top+50,10,26)}   // Rohr + Flansche
  const vx=mid-220;g.strokeStyle='#d83a3a';g.lineWidth=5;g.beginPath();g.arc(vx,top+63,14,0,7);g.moveTo(vx-14,top+63);g.lineTo(vx+14,top+63);g.moveTo(vx,top+49);g.lineTo(vx,top+77);g.stroke();
  for(const off of[-330,-240,240,330]){const wx=mid+off-26;g.fillStyle='#050c0a';g.fillRect(wx,top+100,52,70);const sg=g.createLinearGradient(0,top+104,0,top+166);sg.addColorStop(0,G+'cc');sg.addColorStop(1,G+'33');g.save();g.shadowColor=G;g.shadowBlur=18;g.fillStyle=sg;g.fillRect(wx+3,top+103,46,64);g.restore();g.strokeStyle='#050c0a';g.lineWidth=3;for(let k=1;k<5;k++){g.beginPath();g.moveTo(wx+k*10.4,top+103);g.lineTo(wx+k*10.4,top+167);g.stroke()}}
  const dw=190,dx=mid-dw/2,dy=bot-176;g.fillStyle='#050a08';g.fillRect(dx-16,dy-16,dw+32,194);hazard(g,dx-16,dy-16,dw+32,14);hazard(g,dx-16,dy-16,14,194);hazard(g,dx+dw+2,dy-16,14,194);
  const dg=g.createLinearGradient(0,dy,0,bot);dg.addColorStop(0,'#3a4a46');dg.addColorStop(1,'#1c2826');g.fillStyle=dg;g.fillRect(dx,dy,dw,164);g.fillStyle='#00000066';for(let y=dy+10;y<bot-12;y+=12)g.fillRect(dx,y,dw,2);g.fillStyle='#ffffff14';g.fillRect(dx,dy,dw,3);g.fillStyle='#e8c21a';g.fillRect(dx+dw/2-26,bot-40,52,10);
  neon(g,mid-100,dy-74,200,36,isR?'KONTROLLE':'LAGER 7',isR?T.lights[1]:G,19);lamp(g,mid-130,dy-30,'#ffffff',70);lamp(g,mid+130,dy-30,'#ffffff',70);g.fillStyle='#0a1210';g.fillRect(sa-4,bot-10,sb-sa+8,14);edge(g,top,bot)});
 const inner=mk(top-20,540-top+20,g=>{
  const wg=g.createLinearGradient(0,top,0,fl);wg.addColorStop(0,'#1a2623');wg.addColorStop(1,'#2a3a36');g.fillStyle=wg;g.fillRect(sa,top,sb-sa,fl-top);for(let x=sa;x<sb;x+=13){g.fillStyle='#00000026';g.fillRect(x,top,3,fl-top)}
  g.fillStyle='#0a1210';g.fillRect(sa,top-20,sb-sa,ceil-top+20);g.strokeStyle='#2a3d38';g.lineWidth=3;for(let x=X0;x<X1;x+=120){g.beginPath();g.moveTo(x,ceil);g.lineTo(x+60,ceil+34);g.lineTo(x+120,ceil);g.moveTo(x+60,ceil+34);g.lineTo(x+60,ceil);g.stroke()}g.fillStyle=G+'66';g.fillRect(sa,ceil-2,sb-sa,2);hazard(g,sa,ceil+34,sb-sa,6);
  g.fillStyle='#0e1816';g.fillRect(sa,fl-70,sb-sa,70);g.fillStyle=G+'88';g.fillRect(X0,fl-72,X1-X0,3);
  const fg=g.createLinearGradient(0,fl,0,540);fg.addColorStop(0,'#2e3a38');fg.addColorStop(1,'#0a100e');g.fillStyle=fg;g.fillRect(sa,fl,sb-sa,540-fl);
  g.strokeStyle='#e8c21a88';g.lineWidth=3;g.setLineDash([22,16]);for(const k of[.25,.6]){const y=fl+k*80;g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}g.setLineDash([]);
  for(let i=0;i<4;i++){const px=X0+120+hh(i+4)*(X1-X0-240),py=fl+16+hh(i+8)*50;g.fillStyle='#4aa8c022';g.beginPath();g.ellipse(px,py,46,6,0,0,7);g.fill();g.fillStyle='#ffffff18';g.fillRect(px-30,py-1,40,1.5)}
  for(let x=X0+90;x<X1-60;x+=220){glow(g,x,ceil+60,160,'#cfe8d822');g.strokeStyle='#00000088';g.lineWidth=1.5;g.beginPath();g.moveTo(x,ceil+34);g.lineTo(x,ceil+50);g.stroke();g.fillStyle='#2a3d38';g.beginPath();g.moveTo(x-20,ceil+62);g.lineTo(x+20,ceil+62);g.lineTo(x+10,ceil+50);g.lineTo(x-10,ceil+50);g.fill();g.fillStyle='#e8f6e8';g.fillRect(x-14,ceil+61,28,3);g.save();g.globalCompositeOperation='lighter';const cg=g.createLinearGradient(0,ceil+62,0,fl);cg.addColorStop(0,'#cfe8d825');cg.addColorStop(1,'#0000');g.fillStyle=cg;g.beginPath();g.moveTo(x-14,ceil+62);g.lineTo(x+14,ceil+62);g.lineTo(x+90,fl);g.lineTo(x-90,fl);g.fill();g.restore()}
  if(!isR){ // ===== Lagerhalle =====
   const ctn=(x,w,h,col)=>{g.fillStyle=col;g.fillRect(x,fl-h,w,h);g.fillStyle='#00000040';for(let k=4;k<w-4;k+=6)g.fillRect(x+k,fl-h+2,2,h-4);g.fillStyle='#00000077';g.fillRect(x,fl-h,w,3);g.fillRect(x,fl-4,w,4)};
   ctn(X0+40,170,100,'#2a3f70');ctn(X0+40,170,100,'#2a3f70');ctn(X0+60,170,100,'#7a2e1c');g.fillStyle='#7a2e1c';g.fillRect(X0+60,fl-200,170,98);g.fillStyle='#00000040';for(let k=4;k<166;k+=6)g.fillRect(X0+60+k,fl-198,2,94);
   for(let i=0;i<4;i++)crate(g,X0+270+i*52+(i>1?20:0),fl-50-(i%2)*50,50,50,'#7a5a30');crate(g,X0+292,fl-150,50,50,'#6a4a28');
   const fx=X0+560;g.fillStyle='#caa030';g.fillRect(fx,fl-64,92,38);g.fillStyle='#1a1a1a';g.fillRect(fx+56,fl-100,6,76);g.fillStyle='#caa030';g.fillRect(fx+54,fl-110,42,10);g.strokeStyle='#caa030';g.lineWidth=4;g.beginPath();g.moveTo(fx+8,fl-64);g.lineTo(fx+8,fl-104);g.lineTo(fx+54,fl-104);g.stroke();g.fillStyle='#222';g.fillRect(fx-34,fl-52,34,6);g.fillRect(fx-34,fl-52,4,34);g.beginPath();g.arc(fx+22,fl-14,13,0,7);g.arc(fx+78,fl-14,11,0,7);g.fill();   // Gabelstapler
   barrel(g,X1-190,fl);barrel(g,X1-150,fl-4,'#6a2a1a');barrel(g,X1-110,fl);g.fillStyle='#e8c21a';g.fillRect(X1-200,fl-70,120,5);
   for(let x=X0+800;x<X1-250;x+=70)crate(g,x,fl-46,46,46,'#6a4a28');glow(g,mid,fl+10,260,G+'14')}
  else{ // ===== Kontrollraum =====
   const sw=X0+60;g.fillStyle='#050c0a';g.fillRect(sw,top+40,360,150);g.strokeStyle=G+'88';g.lineWidth=2;g.strokeRect(sw,top+40,360,150);g.fillStyle=G+'1c';g.fillRect(sw+2,top+42,356,146);g.strokeStyle=G+'44';g.lineWidth=1;for(let k=1;k<12;k++){g.beginPath();g.moveTo(sw+k*30,top+42);g.lineTo(sw+k*30,top+188);g.stroke()}for(let k=1;k<5;k++){g.beginPath();g.moveTo(sw+2,top+40+k*30);g.lineTo(sw+358,top+40+k*30);g.stroke()}
   g.strokeStyle='#e6ff5a';g.lineWidth=2.5;g.beginPath();g.moveTo(sw+20,top+170);g.lineTo(sw+90,top+120);g.lineTo(sw+150,top+140);g.lineTo(sw+230,top+80);g.lineTo(sw+300,top+100);g.lineTo(sw+340,top+62);g.stroke();for(const[px,py]of[[90,120],[230,80],[340,62]]){lamp(g,sw+px,top+py,'#ff4a3a',40)}
   for(let i=0;i<4;i++){const mx=X0+470+i*92;g.fillStyle='#050c0a';g.fillRect(mx,top+60,80,60);const c2=[G,T.lights[1],T.lights[2],G][i],sg=g.createLinearGradient(0,top+64,0,top+116);sg.addColorStop(0,c2+'dd');sg.addColorStop(1,c2+'33');g.save();g.shadowColor=c2;g.shadowBlur=14;g.fillStyle=sg;g.fillRect(mx+4,top+64,72,52);g.restore();g.fillStyle='#050c0a';for(let k=0;k<5;k++)g.fillRect(mx+8,top+70+k*9,20+hh(i*9+k)*40,3)}
   const cx0=X0+330;g.fillStyle='#16221f';g.fillRect(cx0,fl-70,380,70);g.fillStyle='#2e403b';g.fillRect(cx0-6,fl-76,392,8);for(let k=0;k<9;k++){g.fillStyle=k%3?G:'#ff4a3a';g.beginPath();g.arc(cx0+24+k*40,fl-52,4,0,7);g.fill();g.fillStyle='#050c0a';g.fillRect(cx0+14+k*40,fl-40,20,22)}
   for(let i=0;i<2;i++){const sx=cx0+80+i*190;g.fillStyle='#050c0a';g.fillRect(sx,fl-130,70,48);g.fillStyle=G+'88';g.fillRect(sx+4,fl-126,62,40);glow(g,sx+35,fl-106,70,G+'33')}
   const rk=X0+800;for(let i=0;i<3;i++){g.fillStyle='#0e1816';g.fillRect(rk+i*58,fl-150,52,150);g.strokeStyle='#2a3d38';g.lineWidth=2;g.strokeRect(rk+i*58,fl-150,52,150);for(let k=0;k<8;k++){g.fillStyle=hh(i*8+k)<.5?G:'#ff4a3a';g.fillRect(rk+i*58+8,fl-140+k*17,6,4);g.fillStyle='#ffffff18';g.fillRect(rk+i*58+18,fl-140+k*17,26,4)}}
   g.save();g.fillStyle='#ffffff';g.globalAlpha=.1;for(let k=0;k<6;k++){g.beginPath();g.ellipse(X1-110+(k%2)*14,fl-60-k*26,18+k*5,12+k*3,0,0,7);g.fill()}g.restore();g.fillStyle='#2a3d38';g.fillRect(X1-130,fl-40,40,40);g.fillStyle='#10201c';g.fillRect(X1-122,fl-50,24,10);
   g.fillStyle='#e8c21a';g.fillRect(X0+30,fl-34,10,34);g.fillRect(X0+30,fl-34,120,5);glow(g,mid,fl+10,260,T.lights[1]+'14')}
  const vg=g.createLinearGradient(sa,0,sb,0);vg.addColorStop(0,'#000000aa');vg.addColorStop(.1,'#0000');vg.addColorStop(.9,'#0000');vg.addColorStop(1,'#000000bb');g.fillStyle=vg;g.fillRect(sa,top-20,sb-sa,540-top+20);c.backWall(g)});
 return{upper,ground,inner}}

// ===================== LABYRINTH: links Waffenkammer, rechts Schatzkammer =====================
function labyrinth(c){const{T,isR,mk,top,bot,fl,X0,X1,sa,sb,ew,mid,R,ceil,edge,neon}=c,O='#ff9a3f';
 const torch=(g,x,y)=>{g.fillStyle='#2a160a';g.fillRect(x-4,y,8,28);g.fillStyle='#5a3418';g.fillRect(x-7,y-2,14,6);flare(g,x,y-10,64);g.fillStyle='#ffcf5a';g.beginPath();g.ellipse(x,y-10,5,11,0,0,7);g.fill()};
 const banner=(g,x,y,w,h,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(x-w/2,y);g.lineTo(x+w/2,y);g.lineTo(x+w/2,y+h);g.lineTo(x,y+h-22);g.lineTo(x-w/2,y+h);g.fill();g.fillStyle='#00000044';g.fillRect(x-w/2,y,5,h-6);g.strokeStyle=O;g.lineWidth=2;g.beginPath();g.arc(x,y+h*.36,w*.22,0,7);g.stroke();g.beginPath();g.moveTo(x,y+h*.36-w*.22);g.lineTo(x,y+h*.36+w*.22);g.moveTo(x-w*.22,y+h*.36);g.lineTo(x+w*.22,y+h*.36);g.stroke();g.fillStyle='#ffcf7a';g.fillRect(x-w/2-3,y-4,w+6,5)};
 const upper=mk(-420,top+420,g=>{const yT=-420;g.fillStyle='#120a06';g.fillRect(sa,yT,sb-sa,top-yT);bricks(g,sa,sb,yT,top,24,[44,28,18],22,'#000',T.seed);
  for(let y=top-110;y>yT-60;y-=140){for(let x=X0+26;x<X1-20;x+=84){const lit=hh(x+y)<.55;g.fillStyle='#0a0503';g.beginPath();g.roundRect?g.roundRect(x,y,16,52,[8,8,0,0]):g.rect(x,y,16,52);g.fill();if(lit){g.save();g.shadowColor=O;g.shadowBlur=16;g.fillStyle=O;g.globalAlpha=.55+hh(x*3+y)*.4;g.fillRect(x+3,y+8,10,42);g.restore()}}
   g.fillStyle='#3a2616';g.fillRect(sa,y+64,sb-sa,10);g.fillStyle='#00000055';g.fillRect(sa,y+74,sb-sa,3);g.fillStyle='#ffcf7a30';for(let x=sa+10;x<sb;x+=24)g.fillRect(x,y+68,6,2)}
  for(let x=X0+60;x<X1;x+=224)banner(g,x,top-300-((x/224|0)%2)*120,44,150,isR?'#4a1010':'#2a1010');
  const fade=g.createLinearGradient(0,top,0,yT);fade.addColorStop(0,'#0000');fade.addColorStop(1,'#000000aa');g.fillStyle=fade;g.fillRect(sa,yT,sb-sa,top-yT);
  g.fillStyle='#0a0503';g.fillRect(isR?sb-10:sa,yT,10,top-yT);edge(g,yT,top);g.fillStyle='#2a180c';g.fillRect(sa,top-24,sb-sa,26);for(let x=sa+10;x<sb;x+=40){g.fillStyle='#1a0e06';g.beginPath();g.moveTo(x,top+2);g.lineTo(x+22,top+2);g.lineTo(x+16,top+14);g.lineTo(x+6,top+14);g.fill()}g.fillStyle=O+'66';g.fillRect(sa,top-3,sb-sa,3)});
 const ground=mk(top,bot-top+14,g=>{g.fillStyle='#1a0e08';g.fillRect(sa,top,sb-sa,bot-top);bricks(g,sa,sb,top,bot,26,[38,24,15],20,'#000',T.seed+9);g.fillStyle='#ff9a3f10';g.fillRect(sa,top,sb-sa,bot-top);
  for(let x=X0+30;x<sb;x+=200){g.fillStyle='#2a180c';g.fillRect(x,top,22,bot-top);g.fillStyle='#ffffff0c';g.fillRect(x+2,top,3,bot-top);g.fillStyle='#3a2414';g.fillRect(x-6,top,34,12);g.fillRect(x-6,bot-22,34,22)}
  const aw=170,ah=190,ax=mid-aw/2;g.fillStyle='#050302';g.beginPath();g.moveTo(ax,bot);g.lineTo(ax,bot-ah+aw/2);g.arc(mid,bot-ah+aw/2,aw/2,Math.PI,0);g.lineTo(ax+aw,bot);g.fill();
  const dg=g.createLinearGradient(ax,0,ax+aw,0);dg.addColorStop(0,'#3a2412');dg.addColorStop(.5,'#5a3a1c');dg.addColorStop(1,'#2a1a0c');g.fillStyle=dg;g.beginPath();g.moveTo(ax+8,bot);g.lineTo(ax+8,bot-ah+aw/2);g.arc(mid,bot-ah+aw/2,aw/2-8,Math.PI,0);g.lineTo(ax+aw-8,bot);g.fill();
  g.strokeStyle='#00000066';g.lineWidth=2;for(let x=ax+14;x<ax+aw-8;x+=18){g.beginPath();g.moveTo(x,bot);g.lineTo(x,bot-ah+10);g.stroke()}g.fillStyle='#1a1a1e';for(const y of[bot-50,bot-110,bot-160])g.fillRect(ax+8,y,aw-16,10);g.fillStyle='#8a8a94';for(const y of[bot-50,bot-110,bot-160])for(let x=ax+18;x<ax+aw-12;x+=28){g.beginPath();g.arc(x,y+5,2.5,0,7);g.fill()}
  g.strokeStyle=O;g.lineWidth=3;g.save();g.shadowColor=O;g.shadowBlur=18;g.beginPath();g.moveTo(ax,bot);g.lineTo(ax,bot-ah+aw/2);g.arc(mid,bot-ah+aw/2,aw/2,Math.PI,0);g.lineTo(ax+aw,bot);g.stroke();g.restore();
  const rx=mid,ry=bot-ah-34;g.save();g.shadowColor=O;g.shadowBlur=16;g.strokeStyle=O;g.lineWidth=2.5;g.beginPath();g.arc(rx,ry,24,0,7);g.stroke();g.beginPath();g.arc(rx,ry,12,0,7);g.stroke();for(let k=0;k<6;k++){const a=k/6*6.283;g.beginPath();g.moveTo(rx+Math.cos(a)*12,ry+Math.sin(a)*12);g.lineTo(rx+Math.cos(a)*24,ry+Math.sin(a)*24);g.stroke()}g.restore();
  torch(g,mid-150,bot-190);torch(g,mid+150,bot-190);torch(g,mid-320,bot-170);torch(g,mid+320,bot-170);g.fillStyle='#0a0503';g.fillRect(sa-4,bot-10,sb-sa+8,14);edge(g,top,bot)});
 const inner=mk(top-20,540-top+20,g=>{
  g.fillStyle='#1a0e08';g.fillRect(sa,top,sb-sa,fl-top);bricks(g,sa,sb,top,fl,26,[34,22,14],14,'#000',T.seed+21);g.fillStyle='#000000aa';g.fillRect(sa,top-20,sb-sa,ceil-top+20);g.fillStyle=O+'55';g.fillRect(sa,ceil-2,sb-sa,2);
  for(let x=X0+30;x<X1;x+=170){g.fillStyle='#2a180c';g.fillRect(x,ceil,18,fl-ceil-70);g.fillStyle='#ffffff0c';g.fillRect(x+2,ceil,3,fl-ceil-70);g.fillStyle='#3a2414';g.fillRect(x-6,ceil,30,10)}
  g.fillStyle='#120a06';g.fillRect(sa,fl-70,sb-sa,70);g.fillStyle=O+'66';g.fillRect(X0,fl-72,X1-X0,3);
  const fg=g.createLinearGradient(0,fl,0,540);fg.addColorStop(0,'#3a2616');fg.addColorStop(1,'#0e0804');g.fillStyle=fg;g.fillRect(sa,fl,sb-sa,540-fl);
  g.strokeStyle='#00000066';g.lineWidth=1.5;for(let x=X0-200;x<X1+200;x+=70){g.beginPath();g.moveTo(mid+(x-mid)*.3,fl);g.lineTo(x,540);g.stroke()}for(let k=0;k<4;k++){const y=fl+Math.pow(k/4,1.5)*80+6;g.beginPath();g.moveTo(sa,y);g.lineTo(sb,y);g.stroke()}
  if(!isR){ // ===== Waffenkammer mit Esse =====
   const fx=X0+110;g.fillStyle='#2a1a10';g.fillRect(fx-70,fl-170,140,170);g.fillStyle='#0a0402';g.beginPath();g.moveTo(fx-44,fl);g.lineTo(fx-44,fl-70);g.arc(fx,fl-70,44,Math.PI,0);g.lineTo(fx+44,fl);g.fill();glow(g,fx,fl-40,200,'#ff6a1a88');glow(g,fx,fl-30,90,'#ffe09acc');g.fillStyle='#ff8a1a';g.beginPath();g.moveTo(fx-36,fl);for(let i=0;i<7;i++)g.lineTo(fx-36+i*12,fl-30-((i%2)?30:10)-hh(i)*14);g.lineTo(fx+36,fl);g.fill();g.fillStyle='#ffe09a';g.fillRect(fx-18,fl-26,36,26);g.fillStyle='#1a0e08';g.fillRect(fx-18,fl-250,36,90);
   const ax=X0+330;g.fillStyle='#3a2414';g.fillRect(ax-8,fl-30,16,30);g.fillStyle='#1c1c20';g.beginPath();g.moveTo(ax-36,fl-36);g.lineTo(ax+34,fl-36);g.lineTo(ax+22,fl-48);g.lineTo(ax-14,fl-48);g.lineTo(ax-14,fl-58);g.lineTo(ax-30,fl-58);g.fill();glow(g,ax,fl-50,70,'#ff6a1a33');
   for(let r=0;r<3;r++){const rx=X0+470+r*150;g.fillStyle='#3a2414';g.fillRect(rx,top+70,110,7);g.fillRect(rx,top+140,110,7);g.fillRect(rx+4,top+70,6,106);g.fillRect(rx+100,top+70,6,106);
    for(let k=0;k<4;k++){g.save();g.translate(rx+22+k*20,top+110+(r%2?4:0));g.rotate(((k+r)%3-1)*.05);g.fillStyle='#b8b8c4';g.fillRect(-2,-44,4,76);g.fillStyle='#4a2a14';g.fillRect(-8,22,16,5);g.fillRect(-2,24,4,16);g.restore()}}
   for(let i=0;i<4;i++){const sx=X0+950+i*70,sy=top+90+(i%2)*26;g.fillStyle='#4a1a12';g.beginPath();g.arc(sx,sy,26,0,7);g.fill();g.strokeStyle='#d6a84a';g.lineWidth=3;g.stroke();g.beginPath();g.arc(sx,sy,10,0,7);g.stroke()}
   for(const bx of[X1-250,X1-205])barrelS(g,bx,fl);for(let x=X0+640;x<X0+800;x+=60){g.strokeStyle='#4a4a54';g.lineWidth=3;g.beginPath();g.moveTo(x,ceil);g.lineTo(x,ceil+60+hh(x)*40);g.stroke()}glow(g,mid,fl+10,260,'#ff7a1a14')}
  else{ // ===== Schatzkammer / Thronsaal =====
   g.fillStyle='#6a1414';g.beginPath();g.moveTo(X0+50,fl+8);g.lineTo(X1-330,fl+8);g.lineTo(X1-330,540);g.lineTo(X0-120,540);g.fill();g.fillStyle=O+'88';g.fillRect(X0-120,538,0,0);
   const tx=X1-200;for(const bo of[-110,110])banner(g,tx+bo,top+30,60,200,'#4a1010');g.fillStyle='#2a1c10';g.fillRect(tx-70,fl-30,140,30);g.fillRect(tx-90,fl-14,180,14);g.fillStyle='#3a2414';g.fillRect(tx-46,fl-190,92,160);g.fillRect(tx-62,fl-92,124,18);g.fillRect(tx-62,fl-92,16,62);g.fillRect(tx+46,fl-92,16,62);g.fillStyle='#d6a84a';g.fillRect(tx-46,fl-196,92,8);g.beginPath();g.moveTo(tx-46,fl-196);g.lineTo(tx,fl-228);g.lineTo(tx+46,fl-196);g.fill();g.fillStyle='#8a1a1a';g.fillRect(tx-34,fl-170,68,76);glow(g,tx,fl-130,150,'#ffcf7a33');
   const pile=(px,py,n,sc)=>{for(let i=0;i<n;i++){const a=hh(px+i)*6.283,r=hh(px+i*3)*38*sc;g.fillStyle=['#ffd23f','#e8b020','#ffec8a'][i%3];g.beginPath();g.ellipse(px+Math.cos(a)*r,py-Math.abs(Math.sin(a))*r*.5-(1-r/(38*sc))*18*sc,5*sc,3.4*sc,0,0,7);g.fill()}glow(g,px,py-16*sc,70*sc,'#ffcf4a55')};
   pile(X0+120,fl+4,60,1.5);pile(X0+330,fl+8,50,1.2);pile(X0+640,fl+2,70,1.7);pile(X0+860,fl+8,40,1.1);
   for(const cx of[X0+240,X0+500,X0+760]){g.fillStyle='#4a2a14';g.fillRect(cx-30,fl-34,60,34);g.fillStyle='#2a180c';g.fillRect(cx-30,fl-34,60,5);g.fillStyle='#d6a84a';g.fillRect(cx-4,fl-26,8,10);g.beginPath();g.moveTo(cx-30,fl-34);g.lineTo(cx-26,fl-60);g.lineTo(cx+26,fl-60);g.lineTo(cx+30,fl-34);g.fillStyle='#5a3418';g.fill();glow(g,cx,fl-40,60,'#ffd23f66')}
   for(const bx of[X0+60,X0+400,X0+700,X1-380]){g.fillStyle='#2a1c10';g.fillRect(bx-4,fl-52,8,52);g.fillStyle='#3a2616';g.beginPath();g.moveTo(bx-18,fl-52);g.lineTo(bx+18,fl-52);g.lineTo(bx+10,fl-72);g.lineTo(bx-10,fl-72);g.fill();flare(g,bx,fl-80,70)}
   g.strokeStyle='#d6a84a';g.lineWidth=3;g.beginPath();g.arc(mid,ceil+90,60,0,7);g.stroke();for(let k=0;k<8;k++){const a=k/8*6.283,px=mid+Math.cos(a)*60,py=ceil+90+Math.sin(a)*60;g.strokeStyle='#00000088';g.lineWidth=1.2;g.beginPath();g.moveTo(px,py);g.lineTo(mid+Math.cos(a)*6,ceil+8);g.stroke();flare(g,px,py-8,26)}glow(g,mid,ceil+110,200,'#ffb34722')}
  const vg=g.createLinearGradient(sa,0,sb,0);vg.addColorStop(0,'#000000aa');vg.addColorStop(.1,'#0000');vg.addColorStop(.9,'#0000');vg.addColorStop(1,'#000000bb');g.fillStyle=vg;g.fillRect(sa,top-20,sb-sa,540-top+20);c.backWall(g)});
 return{upper,ground,inner}}
const barrelS=(g,x,y)=>{g.fillStyle='#4a2a14';g.fillRect(x-16,y-42,32,42);g.fillStyle='#1a1a1e';g.fillRect(x-16,y-32,32,4);g.fillRect(x-16,y-12,32,4)};
export function buildHouse(style,c){return style==='temple'?temple(c):style==='docks'?docks(c):labyrinth(c)}
