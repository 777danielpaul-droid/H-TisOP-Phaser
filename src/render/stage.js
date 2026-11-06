// Stage-Themes (ein Level pro Gegner). Der statische Hintergrund deckt die ganze WELT ab (größer als der Bildschirm)
// und wird je Theme einmal in ein Offscreen-Canvas gerendert. Die Kamera skaliert/verschiebt ihn zusammen mit den Fightern.
const rnd=seed=>{let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647};
export const THEMES=[
 {name:'NEON CITY',style:'city',seed:7,sky:['#020106','#07031a','#120733','#2c0f55','#0a0618'],moon:['#b46cff','#2a1060'],
  layers:[{y:360,h:[60,170],c:'#0d0824',w:[40,80],win:.12,lit:'#7a4cff'},{y:390,h:[50,130],c:'#0a0619',w:[36,70],win:.2,lit:'#3fe0ff'},{y:430,h:[40,90],c:'#070413',w:[30,60],win:.3,lit:'#ff4fd8'}],
  signs:[[70,250,'NEON DOJO','#3fe0ff'],[740,230,'ULTRAVIOLET','#b46cff'],[560,300,'KO CLUB','#ff4fd8'],[-180,262,'RAMEN 24H','#ff4fd8'],[1040,258,'CYBER GYM','#3fe0ff'],[-90,160,'ARCADE','#b46cff'],[900,150,'HYPER','#3fe0ff']],
  floor:['#1a0e3a','#07040f'],grid:'#8f5bff',line:'#3fe0ff',lights:['#7a4cff','#3fe0ff','#ff4fd8'],crowd:255},
 {name:'CRIMSON TEMPLE',style:'city',seed:21,sky:['#050102','#14040a','#2a0a12','#5a1418','#12040a'],moon:['#ff6a3d','#5a1408'],
  layers:[{y:350,h:[70,190],c:'#1a0609',w:[44,90],win:.14,lit:'#ff8a3d'},{y:385,h:[50,140],c:'#12050a',w:[38,74],win:.22,lit:'#ffd34f'},{y:430,h:[40,95],c:'#0a0306',w:[30,64],win:.3,lit:'#ff3a55'}],
  signs:[[80,255,'TEMPEL','#ffb347'],[720,235,'DRACHEN','#ff3a55'],[540,305,'FEUER','#ffd34f'],[-170,265,'SAKE BAR','#ff3a55'],[1030,255,'DOJO 13','#ffb347'],[-90,160,'GONG','#ffd34f'],[900,150,'KAMPF','#ff3a55']],
  floor:['#2a0c14','#0a0306'],grid:'#ff5a5a',line:'#ffb347',lights:['#ff3a55','#ffb347','#ff6a3d'],crowd:10},
 {name:'TOXIC DOCKS',style:'city',seed:33,sky:['#010605','#03110e','#062a22','#0f4a3a','#04120e'],moon:['#52ffa8','#0e4a36'],
  layers:[{y:365,h:[60,150],c:'#06140f',w:[40,86],win:.14,lit:'#52ffa8'},{y:395,h:[46,120],c:'#050f0b',w:[34,70],win:.22,lit:'#3fe0ff'},{y:432,h:[38,90],c:'#030a07',w:[30,60],win:.3,lit:'#e6ff5a'}],
  signs:[[75,252,'DOCKS 7','#52ffa8'],[735,232,'TOXIC','#e6ff5a'],[555,302,'SUSHI','#3fe0ff'],[-175,262,'CONTAINER','#52ffa8'],[1035,256,'HAFEN','#3fe0ff'],[-90,160,'NACHT','#e6ff5a'],[900,150,'BAR','#52ffa8']],
  floor:['#0c2a22','#030a07'],grid:'#3fffb0',line:'#52ffa8',lights:['#52ffa8','#3fe0ff','#e6ff5a'],crowd:150},
 {name:'LABYRINTH',style:'labyrinth',seed:5,sky:['#050201','#120603','#2a0f06','#4a1a08','#0e0402'],moon:['#ff7a1a','#5a2006'],
  layers:[],signs:[],floor:['#2a1608','#0a0502'],grid:'#ff8a3a',line:'#ff9a3f',lights:['#ff7a1a','#ffb347','#ff3a20'],crowd:20}];
export class Stage{
 constructor(W,H,floor,world,theme=THEMES[0]){this.W=W;this.H=H;this.floor=floor;this.world=world;this.theme=theme;this.cache=null}
 build(){const{W,H,world:w,theme:T}=this,S=1.5,c=document.createElement('canvas');c.width=Math.round((w.x1-w.x0)*S);c.height=Math.round((w.y1-w.y0)*S);
  const g=c.getContext('2d');g.scale(S,S);g.translate(-w.x0,-w.y0);const R=rnd(T.seed),X0=w.x0,X1=w.x1,Y0=w.y0,fl=this.floor,lab=T.style==='labyrinth';
  const sky=g.createLinearGradient(0,Y0,0,H);[0,.5,.73,.88,1].forEach((p,i)=>sky.addColorStop(p,T.sky[i]));g.fillStyle=sky;g.fillRect(X0,Y0,X1-X0,H-Y0);
  for(let i=0;i<220;i++){g.fillStyle=lab?'#ffcf8a':'#fff';g.globalAlpha=.12+R()*.5;g.fillRect(X0+R()*(X1-X0),Y0+R()*(300-Y0),R()<.15?2:1,R()<.15?2:1)}g.globalAlpha=1;
  const mg=g.createRadialGradient(W/2,190,10,W/2,190,260);mg.addColorStop(0,T.moon[0]+'55');mg.addColorStop(.4,T.moon[0]+'22');mg.addColorStop(1,'#0000');g.fillStyle=mg;g.fillRect(W/2-300,Y0,600,H-Y0);
  g.fillStyle=T.moon[1];g.beginPath();g.arc(W/2,190,70,0,7);g.fill();g.strokeStyle=T.moon[0];g.lineWidth=2;g.stroke();
  if(!lab){
   for(const L of T.layers){let x=X0;while(x<X1){const bw=L.w[0]+R()*(L.w[1]-L.w[0]),bh=L.h[0]+R()*(L.h[1]-L.h[0]);g.fillStyle=L.c;g.fillRect(x,L.y-bh,bw,bh+80);
     g.strokeStyle=L.lit+'55';g.lineWidth=1;g.strokeRect(x+.5,L.y-bh+.5,bw,bh);
     for(let wy=L.y-bh+8;wy<L.y-4;wy+=9)for(let wx=x+5;wx<x+bw-6;wx+=8)if(R()<L.win){g.fillStyle=L.lit;g.globalAlpha=.35+R()*.5;g.fillRect(wx,wy,3,4)}
     g.globalAlpha=1;x+=bw+2+R()*6}}
   const sign=(x,y,t,col)=>{g.save();g.shadowColor=col;g.shadowBlur=14;g.strokeStyle=col;g.lineWidth=2;g.strokeRect(x,y,t.length*11+14,24);g.fillStyle=col;g.font='bold 15px "Courier New",monospace';g.fillText(t,x+8,y+17);g.restore()};
   for(const[x,y,t,col]of T.signs)sign(x,y,t,col);
   for(let x=X0;x<X1;x+=15.5){const xx=x+R()*6,y=372+R()*14;g.fillStyle=`hsl(${T.crowd+R()*40},40%,${5+R()*5}%)`;g.beginPath();g.arc(xx,y,8+R()*4,0,7);g.fill();g.fillRect(xx-9,y,18,46)}
  }else{ // Labyrinth: Steinsäulen mit Fackeln und Bögen
   for(let x=X0-40;x<X1;x+=150){const px=x+R()*10;
    const cg=g.createLinearGradient(px,0,px+56,0);cg.addColorStop(0,'#1a0d06');cg.addColorStop(.5,'#3a2010');cg.addColorStop(1,'#140a04');g.fillStyle=cg;g.fillRect(px,110,56,fl-110);
    g.strokeStyle='#5a3418';g.lineWidth=1.5;for(let y=125;y<fl-30;y+=26){g.beginPath();g.moveTo(px,y);g.lineTo(px+56,y);g.stroke()}
    g.fillStyle='#2a160a';g.fillRect(px-10,100,76,16);g.fillRect(px-8,fl-48,72,12);
    g.fillStyle='#120804';g.beginPath();g.moveTo(px+56,150);g.quadraticCurveTo(px+75,92,px+94,150);g.lineTo(px+94,150);g.fill();                  // Bogenansatz
    const tx=px+28,ty=250;g.fillStyle='#2a160a';g.fillRect(tx-5,ty,10,26);
    const fg=g.createRadialGradient(tx,ty-8,2,tx,ty-8,70);fg.addColorStop(0,'#ffe09a');fg.addColorStop(.25,'#ff8a1a88');fg.addColorStop(1,'#0000');g.fillStyle=fg;g.beginPath();g.arc(tx,ty-8,70,0,7);g.fill();
    g.fillStyle='#ffcf5a';g.beginPath();g.ellipse(tx,ty-8,6,12,0,0,7);g.fill()}
   g.fillStyle='#0a0402';g.fillRect(X0,fl-40,X1-X0,6)}
  const fg=g.createLinearGradient(0,fl-40,0,H);fg.addColorStop(0,T.floor[0]);fg.addColorStop(1,T.floor[1]);g.fillStyle=fg;g.fillRect(X0,fl-40,X1-X0,H-fl+40);
  g.strokeStyle=T.grid;g.globalAlpha=.35;g.lineWidth=1;for(let i=-34;i<=34;i++){g.beginPath();g.moveTo(W/2+i*30,fl-40);g.lineTo(W/2+i*110,H);g.stroke()}
  for(let k=0;k<7;k++){const y=fl-40+Math.pow(k/7,1.7)*(H-fl+40)+4;g.beginPath();g.moveTo(X0,y);g.lineTo(X1,y);g.stroke()}g.globalAlpha=1;
  g.save();g.shadowColor=T.line;g.shadowBlur=16;g.strokeStyle=T.line;g.lineWidth=3;g.beginPath();g.moveTo(X0,fl-40);g.lineTo(X1,fl-40);g.stroke();g.restore();
  this.cache=c;
  const s=document.createElement('canvas');s.width=4;s.height=4;const sg=s.getContext('2d');sg.fillStyle='#0000002a';sg.fillRect(0,0,4,1);this.scan=s}
 // Weltraum-Zeichnung: wird INNERHALB der Kamera-Transformation aufgerufen
 draw(g,t){if(!this.cache)this.build();const w=this.world,T=this.theme;g.drawImage(this.cache,w.x0,w.y0,w.x1-w.x0,w.y1-w.y0);
  g.save();g.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const x=this.W*(.2+.3*i)+Math.sin(t*.6+i*2)*60,l=g.createLinearGradient(x,w.y0,x,this.floor),col=T.lights[i];l.addColorStop(0,'#0000');l.addColorStop(.6,col+'33');l.addColorStop(1,col+'33');
   g.fillStyle=l;g.beginPath();g.moveTo(x-8,w.y0);g.lineTo(x+8,w.y0);g.lineTo(x+120+Math.sin(t+i)*30,this.floor);g.lineTo(x-120+Math.sin(t+i)*30,this.floor);g.fill()}
  g.globalAlpha=.25+Math.sin(t*3)*.1;g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(w.x0,this.floor-40);g.lineTo(w.x1,this.floor-40);g.stroke();g.restore()}
 // Bildschirmraum (unskaliert): Scanlines + Vignette
 overlay(g){if(!this.scan)return;g.save();g.fillStyle=g.createPattern(this.scan,'repeat');g.fillRect(0,0,this.W,this.H);
  const v=g.createRadialGradient(this.W/2,this.H/2,this.H*.4,this.W/2,this.H/2,this.H*.95);v.addColorStop(0,'#0000');v.addColorStop(1,'#000000aa');g.fillStyle=v;g.fillRect(0,0,this.W,this.H);g.restore()}
}
