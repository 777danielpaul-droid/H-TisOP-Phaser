import{H,W}from'../core/config.js';



import{R}from'./sprites.js';
// Stage-Themes (ein Level pro Gegner). Der statische Hintergrund deckt die ganze WELT ab (größer als der Bildschirm)
// und wird je Theme einmal in ein Offscreen-Canvas gerendert. Die Kamera skaliert/verschiebt ihn zusammen mit den Fightern.
export const rnd=seed=>{let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647};
export const THEMES=[
 {name:'NEON CITY',desc:'Neonlichter & Regen',style:'city',seed:7,sky:['#020106','#07031a','#120733','#2c0f55','#0a0618'],moon:['#b46cff','#2a1060'],
  layers:[{y:360,h:[60,170],c:'#0d0824',w:[40,80],win:.12,lit:'#7a4cff'},{y:390,h:[50,130],c:'#0a0619',w:[36,70],win:.2,lit:'#3fe0ff'},{y:430,h:[40,90],c:'#070413',w:[30,60],win:.3,lit:'#ff4fd8'}],
  signs:[[70,250,'NEON DOJO','#3fe0ff'],[740,230,'ULTRAVIOLET','#b46cff'],[560,300,'KO CLUB','#ff4fd8'],[-180,262,'RAMEN 24H','#ff4fd8'],[1040,258,'CYBER GYM','#3fe0ff'],[-90,160,'ARCADE','#b46cff'],[900,150,'HYPER','#3fe0ff']],
  floor:['#1a0e3a','#07040f'],grid:'#8f5bff',line:'#3fe0ff',lights:['#7a4cff','#3fe0ff','#ff4fd8'],crowd:255},
 {name:'CRIMSON TEMPLE',desc:'Pagoden & Kirschblüten',style:'temple',moonR:120,seed:21,sky:['#050102','#14040a','#2a0a12','#5a1418','#12040a'],moon:['#ff6a3d','#5a1408'],
  layers:[{y:350,h:[70,190],c:'#1a0609',w:[44,90],win:.14,lit:'#ff8a3d'},{y:385,h:[50,140],c:'#12050a',w:[38,74],win:.22,lit:'#ffd34f'},{y:430,h:[40,95],c:'#0a0306',w:[30,64],win:.3,lit:'#ff3a55'}],
  signs:[[80,255,'TEMPEL','#ffb347'],[720,235,'DRACHEN','#ff3a55'],[540,305,'FEUER','#ffd34f'],[-170,265,'SAKE BAR','#ff3a55'],[1030,255,'DOJO 13','#ffb347'],[-90,160,'GONG','#ffd34f'],[900,150,'KAMPF','#ff3a55']],
  floor:['#2a0c14','#0a0306'],grid:'#ff5a5a',line:'#ffb347',lights:['#ff3a55','#ffb347','#ff6a3d'],crowd:10},
 {name:'TOXIC DOCKS',desc:'Container & Nebel',style:'docks',moonR:54,seed:33,sky:['#010605','#03110e','#062a22','#0f4a3a','#04120e'],moon:['#52ffa8','#0e4a36'],
  layers:[{y:365,h:[60,150],c:'#06140f',w:[40,86],win:.14,lit:'#52ffa8'},{y:395,h:[46,120],c:'#050f0b',w:[34,70],win:.22,lit:'#3fe0ff'},{y:432,h:[38,90],c:'#030a07',w:[30,60],win:.3,lit:'#e6ff5a'}],
  signs:[[75,252,'DOCKS 7','#52ffa8'],[735,232,'TOXIC','#e6ff5a'],[555,302,'SUSHI','#3fe0ff'],[-175,262,'CONTAINER','#52ffa8'],[1035,256,'HAFEN','#3fe0ff'],[-90,160,'NACHT','#e6ff5a'],[900,150,'BAR','#52ffa8']],
  floor:['#0c2a22','#030a07'],grid:'#3fffb0',line:'#52ffa8',lights:['#52ffa8','#3fe0ff','#e6ff5a'],crowd:150},
 {name:'LABYRINTH',desc:'Fackeln & Stein',style:'labyrinth',seed:5,sky:['#050201','#120603','#2a0f06','#4a1a08','#0e0402'],moon:['#ff7a1a','#5a2006'],
  layers:[],signs:[],floor:['#2a1608','#0a0502'],grid:'#ff8a3a',line:'#ff9a3f',lights:['#ff7a1a','#ffb347','#ff3a20'],crowd:20}];
export class Stage{
 constructor(W,H,floor,world,theme=THEMES[0]){this.W=W;this.H=H;this.floor=floor;this.world=world;this.theme=theme;this.cache=null;this.cacheT=null}
 build(noSky){const{W,H,world:w,theme:T}=this,S=1.5,c=document.createElement('canvas');c.width=Math.round((w.x1-w.x0)*S);c.height=Math.round((w.y1-w.y0)*S);
  const g=c.getContext('2d');g.scale(S,S);g.translate(-w.x0,-w.y0);const R=rnd(T.seed),X0=w.x0,X1=w.x1,Y0=w.y0,fl=this.floor,lab=T.style==='labyrinth';
  if(!noSky){   // bei eigenem Hintergrund (Bild/Video) entfällt der Himmel samt Sternen und Mond
  const sky=g.createLinearGradient(0,Y0,0,H);[0,.5,.73,.88,1].forEach((p,i)=>sky.addColorStop(p,T.sky[i]));g.fillStyle=sky;g.fillRect(X0,Y0,X1-X0,H-Y0);
  for(let i=0;i<220;i++){g.fillStyle=lab?'#ffcf8a':'#fff';g.globalAlpha=.12+R()*.5;g.fillRect(X0+R()*(X1-X0),Y0+R()*(300-Y0),R()<.15?2:1,R()<.15?2:1)}g.globalAlpha=1;
  const mg=g.createRadialGradient(W/2,190,10,W/2,190,260);mg.addColorStop(0,T.moon[0]+'55');mg.addColorStop(.4,T.moon[0]+'22');mg.addColorStop(1,'#0000');g.fillStyle=mg;g.fillRect(W/2-300,Y0,600,H-Y0);
  const MR=T.moonR||70;g.fillStyle=T.moon[1];g.beginPath();g.arc(W/2,T.style==='temple'?230:190,MR,0,7);g.fill();g.strokeStyle=T.moon[0];g.lineWidth=2;g.stroke();if(T.style==='temple'){g.fillStyle=T.moon[0]+'33';g.beginPath();g.arc(W/2,230,MR,0,7);g.fill()}
  }
  this.dyn={lant:[],blink:[],torch:[],search:null};const D=this.dyn,ST=T.style,hash=k=>{const q=Math.sin(k*12.9898)*43758.5453;return q-Math.floor(q)};
  if(!noSky){   // Skyline/Kulissen ganz hinten gehören zum Hintergrundbild -> bei eigenem Hintergrund weglassen (nur Boden bleibt)
  if(ST==='temple')this.buildTemple(g,R,D);else if(ST==='docks')this.buildDocks(g,R,D);
  if(ST==='city'){
   for(const L of T.layers){let x=X0;while(x<X1){const bw=L.w[0]+R()*(L.w[1]-L.w[0]),bh=L.h[0]+R()*(L.h[1]-L.h[0]);g.fillStyle=L.c;g.fillRect(x,L.y-bh,bw,bh+80);
     g.strokeStyle=L.lit+'55';g.lineWidth=1;g.strokeRect(x+.5,L.y-bh+.5,bw,bh);
     for(let wy=L.y-bh+8;wy<L.y-4;wy+=9)for(let wx=x+5;wx<x+bw-6;wx+=8)if(R()<L.win){g.fillStyle=L.lit;g.globalAlpha=.35+R()*.5;g.fillRect(wx,wy,3,4)}
     g.globalAlpha=1;x+=bw+2+R()*6}}
   const sign=(x,y,t,col)=>{g.save();g.shadowColor=col;g.shadowBlur=14;g.strokeStyle=col;g.lineWidth=2;g.strokeRect(x,y,t.length*11+14,24);g.fillStyle=col;g.font='bold 15px "Courier New",monospace';g.fillText(t,x+8,y+17);g.restore()};
   for(const[x,y,t,col]of T.signs)sign(x,y,t,col);
  }else if(lab){ // Labyrinth: ferne Bogenhallen, davor Steinsäulen mit Fackeln
   for(let x=X0;x<X1;x+=120){g.fillStyle='#090402';g.beginPath();g.moveTo(x,fl-40);g.lineTo(x,210);g.arc(x+30,210,30,Math.PI,0);g.lineTo(x+60,fl-40);g.fill();g.fillStyle='#ff7a1a0a';g.fillRect(x+6,215,48,fl-255)} // Labyrinth: Steinsäulen mit Fackeln und Bögen
   for(let x=X0-40;x<X1;x+=150){const px=x+R()*10;
    const cg=g.createLinearGradient(px,0,px+56,0);cg.addColorStop(0,'#1a0d06');cg.addColorStop(.5,'#3a2010');cg.addColorStop(1,'#140a04');g.fillStyle=cg;g.fillRect(px,110,56,fl-110);
    g.strokeStyle='#5a3418';g.lineWidth=1.5;for(let y=125;y<fl-30;y+=26){g.beginPath();g.moveTo(px,y);g.lineTo(px+56,y);g.stroke()}
    g.fillStyle='#2a160a';g.fillRect(px-10,100,76,16);g.fillRect(px-8,fl-48,72,12);
    g.fillStyle='#120804';g.beginPath();g.moveTo(px+56,150);g.quadraticCurveTo(px+75,92,px+94,150);g.lineTo(px+94,150);g.fill();                  // Bogenansatz
    const tx=px+28,ty=250;D.torch.push([tx,ty-8]);g.fillStyle='#2a160a';g.fillRect(tx-5,ty,10,26);
    const fg=g.createRadialGradient(tx,ty-8,2,tx,ty-8,70);fg.addColorStop(0,'#ffe09a');fg.addColorStop(.25,'#ff8a1a88');fg.addColorStop(1,'#0000');g.fillStyle=fg;g.beginPath();g.arc(tx,ty-8,70,0,7);g.fill();
    g.fillStyle='#ffcf5a';g.beginPath();g.ellipse(tx,ty-8,6,12,0,0,7);g.fill()}
   g.fillStyle='#0a0402';g.fillRect(X0,fl-40,X1-X0,6)}
  if(!lab)for(let x=X0;x<X1;x+=15.5){const xx=x+R()*6,y=372+R()*14;g.fillStyle=`hsl(${T.crowd+R()*40},40%,${(ST==='city'?5:3)+R()*5}%)`;g.beginPath();g.arc(xx,y,8+R()*4,0,7);g.fill();g.fillRect(xx-9,y,18,46)}
  }
  const fg=g.createLinearGradient(0,fl-40,0,H);fg.addColorStop(0,T.floor[0]);fg.addColorStop(1,T.floor[1]);g.fillStyle=fg;g.fillRect(X0,fl-40,X1-X0,H-fl+40);
  this.buildFloor(g,T,fl,X0,X1,H,W,R,ST);
  g.save();g.shadowColor=T.line;g.shadowBlur=16;g.strokeStyle=T.line;g.lineWidth=3;g.beginPath();g.moveTo(X0,fl-40);g.lineTo(X1,fl-40);g.stroke();g.restore();
  if(noSky)this.cacheT=c;else this.cache=c;
  const s=document.createElement('canvas');s.width=4;s.height=4;const sg=s.getContext('2d');sg.fillStyle='#0000002a';sg.fillRect(0,0,4,1);this.scan=s}
 // ---- Boden je Level-Stil ----
 buildFloor(g,T,fl,X0,X1,H,W,R,ST){const y0=fl-40,hgt=H-y0,cx=W/2;
  const conv=(n,sp0,sp1,col,a,lw)=>{g.strokeStyle=col;g.globalAlpha=a;g.lineWidth=lw;for(let i=-n;i<=n;i++){g.beginPath();g.moveTo(cx+i*sp0,y0);g.lineTo(cx+i*sp1,H);g.stroke()}g.globalAlpha=1};
  const hor=(n,col,a,lw)=>{g.strokeStyle=col;g.globalAlpha=a;g.lineWidth=lw;for(let k=0;k<n;k++){const y=y0+Math.pow(k/n,1.7)*hgt+4;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke()}g.globalAlpha=1};
  const ring=(rx,ry,col,lw,bl)=>{g.save();g.shadowColor=col;g.shadowBlur=bl;g.strokeStyle=col;g.lineWidth=lw;g.beginPath();g.ellipse(cx,fl+20,rx,ry,0,0,7);g.stroke();g.restore()};
  if(ST==='temple'){conv(60,22,80,'#000',.5,1.6);conv(60,22,80,'#ffb347',.06,1);hor(5,'#000',.4,2);
   for(let k=0;k<200;k++){g.fillStyle='#00000030';g.fillRect(X0+R()*(X1-X0),y0+R()*hgt,18+R()*40,1)}
   ring(330,38,'#ffb347',4,18);ring(298,33,'#ffd27a',1.5,8);for(let k=0;k<8;k++){const a=k/8*6.283;g.strokeStyle='#ffb34788';g.lineWidth=2;g.beginPath();g.moveTo(cx+Math.cos(a)*298,fl+20+Math.sin(a)*33);g.lineTo(cx+Math.cos(a)*330,fl+20+Math.sin(a)*38);g.stroke()}
   g.fillStyle='#ff3a5522';g.beginPath();g.ellipse(cx,fl+20,296,32,0,0,7);g.fill()}
  else if(ST==='docks'){conv(40,40,140,'#000',.45,1.5);hor(6,'#000',.45,2);hor(6,'#ffffff',.05,1);
   g.save();g.beginPath();g.rect(X0,y0,X1-X0,10);g.clip();g.fillStyle='#141008';g.fillRect(X0,y0,X1-X0,10);g.fillStyle='#e8c21a';for(let x=X0-10;x<X1+10;x+=24){g.beginPath();g.moveTo(x,y0+10);g.lineTo(x+12,y0+10);g.lineTo(x+22,y0);g.lineTo(x+10,y0);g.fill()}g.restore();
   g.strokeStyle='#e8c21a99';g.lineWidth=3;g.setLineDash([36,24]);g.beginPath();g.moveTo(X0,fl+34);g.lineTo(X1,fl+34);g.stroke();g.setLineDash([]);
   for(let i=0;i<44;i++){const px=X0+R()*(X1-X0),py=y0+18+R()*(hgt-26),pw=40+R()*90;g.fillStyle=i%3?'#00000040':'#4affc614';g.beginPath();g.ellipse(px,py,pw,3+R()*7,0,0,7);g.fill();if(i%3===0){g.fillStyle='#ffffff18';g.fillRect(px-pw*.5,py-1,pw*.6,1.5)}}}
  else if(ST==='labyrinth'){conv(60,26,84,'#000',.55,1.8);conv(60,26,84,'#ffb347',.06,1);hor(5,'#000',.5,2);hor(5,'#ffb347',.05,1);
   for(let i=0;i<90;i++){g.fillStyle='#00000030';g.fillRect(X0+R()*(X1-X0),y0+R()*hgt,6+R()*14,2)}
   ring(300,36,'#ff9a3f',3,16);ring(230,27,'#ffb347',1.5,8);for(let k=0;k<12;k++){const a=k/12*6.283;g.fillStyle='#ffb347aa';g.fillRect(cx+Math.cos(a)*265-3,fl+20+Math.sin(a)*31-2,6,4)}}
  else{g.strokeStyle=T.grid;g.globalAlpha=.35;g.lineWidth=1;for(let i=-34;i<=34;i++){g.beginPath();g.moveTo(cx+i*30,y0);g.lineTo(cx+i*110,H);g.stroke()}hor(7,T.grid,.35,1)}}
 // ---- Tempel: Berge im Nebel, Pagoden, Torii-Tore, Laternenketten, Steinlaternen ----
 buildTemple(g,R,D){const{W,H,floor:fl,world:w}=this,X0=w.x0,X1=w.x1;
  const ridge=(base,amp,col,sd)=>{g.fillStyle=col;g.beginPath();g.moveTo(X0,H);for(let x=X0;x<=X1;x+=16)g.lineTo(x,base-amp*(.55+.3*Math.sin(x*.0041+sd)+.25*Math.sin(x*.0113+sd*2.3)+.12*Math.sin(x*.031+sd*3)));g.lineTo(X1,H);g.fill()};
  const mist=(y,h,col)=>{const mg=g.createLinearGradient(0,y,0,y+h);mg.addColorStop(0,'#0000');mg.addColorStop(.5,col);mg.addColorStop(1,'#0000');g.fillStyle=mg;g.fillRect(X0,y,X1-X0,h)};
  const pagoda=(x,by,sc,n,col,lit)=>{let y=by,wd=130*sc;for(let i=0;i<n;i++){const h=44*sc,rw=wd*(1-i*.13);g.fillStyle=col;g.fillRect(x-rw*.36,y-h,rw*.72,h+2);
    if(lit){g.fillStyle=lit;for(let k=-1;k<=1;k++){g.globalAlpha=.45+R()*.5;g.fillRect(x+k*rw*.2-3*sc,y-h*.78,6*sc,h*.5)}g.globalAlpha=1}
    const ry=y-h;g.fillStyle=col;g.beginPath();g.moveTo(x-rw*.66,ry-12*sc);g.quadraticCurveTo(x-rw*.44,ry+9*sc,x-rw*.3,ry+9*sc);g.lineTo(x+rw*.3,ry+9*sc);g.quadraticCurveTo(x+rw*.44,ry+9*sc,x+rw*.66,ry-12*sc);g.quadraticCurveTo(x+rw*.2,ry-14*sc,x,ry-32*sc);g.quadraticCurveTo(x-rw*.2,ry-14*sc,x-rw*.66,ry-12*sc);g.fill();y=ry-16*sc}
   g.fillStyle=col;g.fillRect(x-1.6*sc,y-46*sc,3.2*sc,48*sc);for(let k=0;k<4;k++)g.fillRect(x-6*sc,y-40*sc+k*8*sc,12*sc,2.5*sc)};
  const torii=(x,by,sc)=>{const wd=150*sc,h=170*sc,t=13*sc,y0=by-h;g.save();g.shadowColor='#ff3a2a';g.shadowBlur=8;g.fillStyle='#5a1014';g.fillRect(x-wd/2,y0,t,h);g.fillRect(x+wd/2-t,y0,t,h);g.fillRect(x-wd/2+t*.3,y0+h*.26,wd-t*.6,t*.9);g.fillStyle='#1a0808';g.fillRect(x-wd/2-4*sc,by-6*sc,t+8*sc,6*sc);g.fillRect(x+wd/2-t-4*sc,by-6*sc,t+8*sc,6*sc);
   g.fillStyle='#14080a';g.beginPath();g.moveTo(x-wd*.74,y0-14*sc);g.quadraticCurveTo(x,y0+16*sc,x+wd*.74,y0-14*sc);g.lineTo(x+wd*.64,y0+8*sc);g.quadraticCurveTo(x,y0+32*sc,x-wd*.64,y0+8*sc);g.fill();g.restore();g.fillStyle='#5a1014';g.fillRect(x-wd*.6,y0+8*sc,wd*1.2,t*.6)};
  ridge(330,160,'#2a0a16',1);mist(260,150,'#5a1a2a44');
  for(let x=X0+60;x<X1;x+=360+R()*120)pagoda(x,392,.5+R()*.35,3+((R()*3)|0),'#1a070e',null);
  mist(330,100,'#4a102488');ridge(392,70,'#12050a',4);
  for(let x=X0+120;x<X1;x+=640+R()*160)pagoda(x,410,.95+R()*.45,4+((R()*2)|0),'#0c0306','#ffb347');
  for(const[x,sc]of[[480,1.75],[-330,1.2],[1290,1.2],[-840,1],[1800,1]])torii(x,412,sc);
  // Laternenketten
  for(let x=X0+40;x<X1-200;x+=300){const x2=x+300,y1=250+hashT(x)*24,sag=46;g.strokeStyle='#00000088';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y1);g.quadraticCurveTo(x+150,y1+sag*2,x2,y1);g.stroke();g.fillStyle='#14070a';g.fillRect(x-2,y1-8,4,170);
   for(let i=1;i<9;i++){const u=i/9,lx=x+(x2-x)*u,ly=y1+2*sag*u*(1-u)+4,col=i%3?'#ff4a2a':'#ffb347';D.lant.push([lx,ly+10,col]);g.fillStyle=col;g.beginPath();g.ellipse(lx,ly+10,6,8,0,0,7);g.fill();g.fillStyle='#ffe9b8';g.globalAlpha=.7;g.fillRect(lx-1,ly+4,2,12);g.globalAlpha=1}}
  // Steinlaternen am Wegesrand
  for(let x=X0+80;x<X1;x+=230){const y=432;g.fillStyle='#1a1216';g.fillRect(x-14,y-8,28,8);g.fillRect(x-5,y-44,10,38);g.fillRect(x-14,y-70,28,26);g.beginPath();g.moveTo(x-22,y-70);g.lineTo(x+22,y-70);g.lineTo(x+10,y-84);g.lineTo(x-10,y-84);g.fill();g.fillStyle='#ffb347';g.globalAlpha=.9;g.fillRect(x-6,y-64,12,14);g.globalAlpha=1;D.lant.push([x,y-57,'#ffb347'])}
  function hashT(k){const q=Math.sin(k*12.9898)*43758.5453;return q-Math.floor(q)}}
 // ---- Docks: Fabrikskyline, Wasser, Frachter, Containerkräne, Containerstapel, Fässer ----
 buildDocks(g,R,D){const{W,H,floor:fl,world:w}=this,X0=w.x0,X1=w.x1,WY=396,PY=432;
  for(let x=X0;x<X1;){const bw=50+R()*110,bh=26+R()*84;g.fillStyle='#04130f';g.fillRect(x,WY-bh,bw,bh+4);
   if(R()<.5){const sx=x+bw*.3;g.fillRect(sx,WY-bh-44,12,46);g.fillStyle='#ff4a3a';g.globalAlpha=.9;g.fillRect(sx,WY-bh-46,12,3);g.globalAlpha=1;D.blink.push([sx+6,WY-bh-46,'#ff4a3a',R()*6]);g.fillStyle='#04130f'}
   for(let wy=WY-bh+8;wy<WY-6;wy+=10)for(let wx=x+5;wx<x+bw-6;wx+=9)if(R()<.2){g.fillStyle=R()<.3?'#e6ff5a':'#52ffa8';g.globalAlpha=.3+R()*.5;g.fillRect(wx,wy,3,4)}g.globalAlpha=1;x+=bw+2}
  const wg=g.createLinearGradient(0,WY,0,PY);wg.addColorStop(0,'#063a30');wg.addColorStop(1,'#020e0b');g.fillStyle=wg;g.fillRect(X0,WY,X1-X0,PY-WY+2);
  const ship=(x,len,col)=>{const dy=392;g.fillStyle=col;g.beginPath();g.moveTo(x,dy);g.lineTo(x+len,dy);g.lineTo(x+len-60,dy+32);g.lineTo(x+46,dy+32);g.fill();g.fillStyle='#ffffff10';g.fillRect(x,dy,len,3);
   const pal=['#7a2e1c','#1f5260','#8a6c1c','#2a3f70','#3e6030','#5a2e4c'];for(let cx=x+30;cx<x+len-150;cx+=34){const n=1+((R()*3)|0);for(let k=0;k<n;k++){g.fillStyle=pal[(R()*pal.length)|0];g.fillRect(cx,dy-22*(k+1),32,21);g.fillStyle='#00000055';g.fillRect(cx+4,dy-22*(k+1),2,21)}}
   const bx=x+len-120;g.fillStyle='#0b1c18';g.fillRect(bx,dy-74,86,74);g.fillRect(bx+10,dy-96,66,24);g.fillRect(bx+36,dy-124,4,30);for(let k=0;k<5;k++){g.fillStyle='#e6ff5a';g.globalAlpha=.8;g.fillRect(bx+14+k*12,dy-90,8,6);g.fillRect(bx+8+k*16,dy-60,10,6);g.globalAlpha=1}D.blink.push([bx+38,dy-125,'#ff4a3a',1.7]);return[bx+60,dy-84]};
  const sp=ship(520,640,'#0a1a16');D.search={x:sp[0],y:sp[1]};ship(-780,520,'#09161a');
  const crane=(x,by,sc)=>{const col='#07120e';g.strokeStyle=col;g.fillStyle=col;g.lineWidth=7*sc;for(const lx of[-44,44]){g.beginPath();g.moveTo(x+lx*sc,by);g.lineTo(x+lx*sc,by-250*sc);g.stroke()}g.lineWidth=2.4*sc;for(let y=by;y>by-240*sc;y-=40*sc){g.beginPath();g.moveTo(x-44*sc,y);g.lineTo(x+44*sc,y-40*sc);g.moveTo(x+44*sc,y);g.lineTo(x-44*sc,y-40*sc);g.stroke()}
   g.fillRect(x-80*sc,by-262*sc,360*sc,16*sc);g.lineWidth=2.4*sc;for(let k=0;k<9;k++){g.beginPath();g.moveTo(x+k*30*sc,by-246*sc);g.lineTo(x+(k+1)*30*sc,by-282*sc);g.lineTo(x+(k+2)*30*sc,by-246*sc);g.stroke()}g.fillRect(x+140*sc,by-246*sc,30*sc,18*sc);g.lineWidth=2*sc;g.beginPath();g.moveTo(x+155*sc,by-228*sc);g.lineTo(x+155*sc,by-120*sc);g.stroke();g.fillRect(x+146*sc,by-122*sc,18*sc,10*sc);
   g.strokeStyle='#52ffa833';g.lineWidth=1;g.beginPath();g.moveTo(x-44*sc,by);g.lineTo(x-44*sc,by-250*sc);g.moveTo(x-80*sc,by-262*sc);g.lineTo(x+280*sc,by-262*sc);g.stroke();D.blink.push([x-70*sc,by-266*sc,'#ff4a3a',R()*6],[x+276*sc,by-266*sc,'#ffffff',R()*6])};
  for(const[x,sc]of[[-560,1.1],[120,1.2],[790,1.0],[1500,1.15]])crane(x,PY,sc);
  const pal2=['#4a2014','#143a44','#5a4812','#1c2c50','#284420','#40203a'];
  for(let x=X0+30;x<X1-60;){const cw=62+R()*30,mid=x>-40&&x<1000,lv=1+((R()*(mid?1.4:3.2))|0);for(let k=0;k<lv;k++){const y=PY-26*(k+1);g.fillStyle=pal2[(R()*pal2.length)|0];g.fillRect(x,y,cw,25);g.fillStyle='#00000050';for(let q=4;q<cw-3;q+=5)g.fillRect(x+q,y+2,2,21);g.fillStyle='#00000099';g.fillRect(x,y,cw,2);g.fillStyle='#ffffff10';g.fillRect(x,y+23,cw,2)}x+=cw+4+R()*70}
  for(let x=X0+120;x<X1;x+=300+R()*160){g.fillStyle='#1f6a44';g.fillRect(x-12,PY-34,24,34);g.fillStyle='#00000055';g.fillRect(x-12,PY-24,24,3);g.fillRect(x-12,PY-12,24,3);g.fillStyle='#e6ff5a';g.beginPath();g.moveTo(x,PY-30);g.lineTo(x+6,PY-20);g.lineTo(x-6,PY-20);g.fill();g.save();g.globalCompositeOperation='lighter';const gl=g.createRadialGradient(x,PY-20,2,x,PY-20,46);gl.addColorStop(0,'#52ffa855');gl.addColorStop(1,'#0000');g.fillStyle=gl;g.fillRect(x-46,PY-66,92,92);g.restore()}
  g.strokeStyle='#6affd0';g.globalAlpha=.16;g.lineWidth=1;for(let i=0;i<260;i++){const x=X0+R()*(X1-X0),y=WY+4+R()*(PY-WY-8),l=10+R()*40;g.beginPath();g.moveTo(x,y);g.lineTo(x+l,y);g.stroke()}g.globalAlpha=1}
 draw(g,t,noSky){if(noSky){if(!this.cacheT)this.build(true)}else if(!this.cache)this.build();const w=this.world,T=this.theme,ST=T.style,D=this.dyn,hh=k=>{const q=Math.sin(k*12.9898)*43758.5453;return q-Math.floor(q)},W0=w.x1-w.x0;g.drawImage(noSky?this.cacheT:this.cache,w.x0,w.y0,W0,w.y1-w.y0);
  if(noSky){g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.25+Math.sin(t*3)*.1;g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(w.x0,this.floor-40);g.lineTo(w.x1,this.floor-40);g.stroke();g.restore();return}
  g.save();g.globalCompositeOperation='lighter';
  if(ST!=='docks')for(let i=0;i<3;i++){const x=this.W*(.2+.3*i)+Math.sin(t*.6+i*2)*60,l=g.createLinearGradient(x,w.y0,x,this.floor),col=T.lights[i];l.addColorStop(0,'#0000');l.addColorStop(.6,col+'33');l.addColorStop(1,col+'33');
   g.fillStyle=l;g.beginPath();g.moveTo(x-8,w.y0);g.lineTo(x+8,w.y0);g.lineTo(x+120+Math.sin(t+i)*30,this.floor);g.lineTo(x-120+Math.sin(t+i)*30,this.floor);g.fill()}
  const glowAt=(x,y,r,col,a)=>{const gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'#0000');g.globalAlpha=a;g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)};
  if(ST==='city'){g.strokeStyle='#bfe9ff';g.lineWidth=1;for(let i=0;i<340;i++){const sp=520+hh(i)*320,x=w.x0+(((hh(i*3)*W0-t*70)%W0)+W0)%W0,y=w.y0+(hh(i*7)*900+t*sp)%900;g.globalAlpha=.1+.2*hh(i*5);g.beginPath();g.moveTo(x,y);g.lineTo(x-4,y+17);g.stroke()}}   // Neon-Regen
  else if(ST==='temple'){for(let i=0;i<D.lant.length;i++){const l=D.lant[i];glowAt(l[0],l[1],34+3*Math.sin(t*2.2+i),l[2]+'88',.45+.15*Math.sin(t*3+i*1.7))}
   g.fillStyle='#ffb7c9';for(let i=0;i<190;i++){const sp=26+hh(i)*30,x=w.x0+(((hh(i*3)*W0+t*18+Math.sin(t*.8+i)*30)%W0)+W0)%W0,y=w.y0+(hh(i*7)*900+t*sp)%900,a=t*1.5+i;g.globalAlpha=.35+.4*hh(i*5);g.save();g.translate(x,y);g.rotate(a);g.scale(1,.55+.45*Math.sin(a*1.7));g.beginPath();g.ellipse(0,0,3.2,2,0,0,7);g.fill();g.restore()}}   // Kirschblüten + pulsierende Laternen
  else if(ST==='docks'){for(let i=0;i<7;i++){const x=w.x0+((hh(i*5)*W0+t*(10+i*3))%W0),y=380+hh(i*3)*80;g.save();g.translate(x,y);g.scale(3.4,.34);glowAt(0,0,150,'#7affc8',.1);g.restore()}   // Nebelbänke
   for(const b of D.blink){const on=Math.sin(t*3+b[3])>.1;glowAt(b[0],b[1],on?22:9,b[2],on?.9:.2)}
   if(D.search){const a=Math.PI*.9+Math.sin(t*.35)*.32,L=1100,sx=D.search.x,sy=D.search.y,wd=.045;const sg=g.createLinearGradient(sx,sy,sx+Math.cos(a)*L,sy+Math.sin(a)*L);sg.addColorStop(0,'#e8fff4aa');sg.addColorStop(1,'#0000');g.globalAlpha=.16;g.fillStyle=sg;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+Math.cos(a-wd)*L,sy+Math.sin(a-wd)*L);g.lineTo(sx+Math.cos(a+wd)*L,sy+Math.sin(a+wd)*L);g.fill();glowAt(sx,sy,26,'#e8fff4',.8)}   // Suchscheinwerfer
   g.strokeStyle='#9dfff0';g.lineWidth=1.2;for(let i=0;i<70;i++){const x=w.x0+((hh(i*4)*W0+t*12)%W0),y=402+hh(i*9)*26;g.globalAlpha=.12+.18*Math.max(0,Math.sin(t*2+i));g.beginPath();g.moveTo(x,y);g.lineTo(x+16+hh(i)*20,y);g.stroke()}}
  else if(ST==='labyrinth'){for(const q of D.torch){const fk=1+.16*Math.sin(t*9+q[0])+.1*Math.sin(t*17+q[0]*.3);glowAt(q[0],q[1],70*fk,'#ff8a2a',.22);glowAt(q[0],q[1],24*fk,'#ffe09a',.22)}
   g.fillStyle='#ffa04a';for(let i=0;i<80;i++){const x=w.x0+(((hh(i*3)*W0+Math.sin(t*.7+i)*26)%W0)+W0)%W0,y=this.floor-((hh(i*7)*520+t*(18+hh(i)*34))%520);g.globalAlpha=.25+.5*hh(i*5)*Math.max(0,Math.sin(t*2+i));g.fillRect(x,y,1.6+hh(i)*1.6,1.6+hh(i)*1.6)}}   // aufsteigende Glut
  g.globalAlpha=.25+Math.sin(t*3)*.1;g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(w.x0,this.floor-40);g.lineTo(w.x1,this.floor-40);g.stroke();g.restore()}
 // Bildschirmraum (unskaliert): Scanlines + Vignette
 overlay(g){if(!this.scan)return;g.save();g.fillStyle=g.createPattern(this.scan,'repeat');g.fillRect(0,0,this.W,this.H);
  const v=g.createRadialGradient(this.W/2,this.H/2,this.H*.4,this.W/2,this.H/2,this.H*.95);v.addColorStop(0,'#0000');v.addColorStop(1,'#000000aa');g.fillStyle=v;g.fillRect(0,0,this.W,this.H);g.restore()}
}
