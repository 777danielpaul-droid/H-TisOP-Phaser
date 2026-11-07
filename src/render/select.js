import{CHARACTERS,ROSTER,BOSS}from'../core/characters.js';
import{Arcade}from'../core/arcade.js';
import{drawFullFrame}from'./sprites.js';
import{ParticleSystem}from'../core/particles.js';
import{drawFighter}from'./rig.js';
import{F_TECH,F_DISP}from'./fonts.js';
import{THEMES}from'./stage.js';
// Startmenü: Kämpferliste links (kleine Figuren ohne Rahmen), rechts Profil des gewählten/gehoverten Kämpfers (Porträt + Kampfwerte).
const GRID={cols:3,w:146,h:176,x:30,y:116};
// Zelle je Slot (Klick-/Hover-Fläche); n = Anzahl Slots (4 Kämpfer + ggf. eigene Figur)
export const cardRect=(i,n=4)=>({x:GRID.x+(i%GRID.cols)*GRID.w,y:GRID.y+Math.floor(i/GRID.cols)*GRID.h,w:GRID.w,h:GRID.h});
// Klickfläche „✎ EDIT“ unter dem Namen der eigenen Figur
export const editRect=r=>({x:r.x+r.w/2-28,y:r.y+r.h-26,w:56,h:18});
export function hitEdit(lx,ly,n=5){const r=editRect(cardRect(n-1,n));return lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h}
export function hitCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=cardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
// Modus-Schalter oben links (ARCADE | 2 SPIELER) – klickbar, Taste TAB
export const MODE_PILL={x:14,y:12,w:216,h:26};
export function hitMode(lx,ly){const m=MODE_PILL;if(ly<m.y||ly>m.y+m.h||lx<m.x||lx>m.x+m.w)return -1;return lx<m.x+m.w/2?0:1}
// Stage-Karten (Versus): 4 Level + Zufall
export const stageRect=(i,n=5)=>{const w=170,gap=14,tot=n*w+(n-1)*gap,x0=(960-tot)/2;return{x:x0+i*(w+gap),y:128,w,h:190}};
export function hitStage(lx,ly,n=5){for(let i=0;i<n;i++){const r=stageRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
const P1C='#00f3ff',P2C='#ff2bd6';
// 2-Spieler-Kämpferwahl: eigene Karten (4 Kämpfer + Platz für die eigene Figur), unabhängig von der Kämpferliste des Arcade-Menüs
const VSCARD={w:196,h:268,gap:18,y:104};
export const vsCardRect=(i,n=4)=>{const w=n>4?170:VSCARD.w,gap=n>4?14:VSCARD.gap,tot=n*w+(n-1)*gap,x0=(960-tot)/2;return{x:x0+i*(w+gap),y:VSCARD.y,w,h:VSCARD.h}};
export function hitVsCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=vsCardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
const DIFF=['LEICHT','NORMAL','HART'],DCOL=['#7dffc8','#ffe23f','#ff4a4a'];
const FIG={tiger:.9,mino:.7};   // Größenausgleich je Figur in der Liste
const PX=508,PW=422;   // Profilbereich rechts (x, Breite)
const DIM='#9d8fd0',TXT='#d6c8ff';
export class SelectScreen{
 constructor(hud){this.hud=hud;this.fakes={};this.ln=null;this.fw=null;this._lt=null;this.sfx=null}
 get launching(){return !!this.ln}
 // Auswahl bestätigt: kleines Feuerwerk, danach (wenn alles verglüht ist) cb() -> Kampf startet
 launch(id,cb,sfx){if(this.ln)return;this.sfx=sfx||null;this.fw=new ParticleSystem();this.fw.onBoom=()=>this.sfx&&this.sfx('heavy_hit_impact',{vol:.3,rate:.9+Math.random()*.25});
  this.ln={id,cb,t:0,acc:0};if(this.sfx)this.sfx('ui_round_start',{vol:.6})}
 // Feuerwerk weiterlaufen lassen (Schritte in 60-Hz-Frames, unabhängig von der Monitorfrequenz)
 stepLaunch(t,cellCx){const ln=this.ln;if(!ln)return;const dt=this._lt==null?1:Math.min(3,Math.max(0,t-this._lt));ln.acc+=dt;
  const col=(CHARACTERS[ln.id]&&CHARACTERS[ln.id].glow)||'#3fe0ff',shots={1:[cellCx,190,col],8:[480,130,'#ffffff'],15:[770,200,col]};
  while(ln.acc>=1){ln.acc-=1;ln.t++;const s=shots[ln.t];if(s)this.fw.rocket(s[0],500,s[1],s[2],.72);this.fw.update()}
  const f=this.fw,quiet=!f.fs.some(p=>p.alive)&&!f.rk.length&&!f.ff.length;
  if((ln.t>30&&quiet)||ln.t>420){const cb=ln.cb;this.ln=null;this.fw=null;if(cb)cb()}}
 fake(id,t){const ch=CHARACTERS[id],f=this.fakes[id]||(this.fakes[id]={x:0,y:0,facing:1,char:ch,anim:'idle',animU:0,sf:0,mf:0,move:null,state:'idle',trail:[],vx:0,vy:0,menu:true});f.sf=t;f.char=ch;return f}
 // Text in Zeilen umbrechen (Breite in Logik-Pixeln)
 wrap(g,s,size,maxW){const out=[];let line='';for(const w of String(s).split(' ')){const tr=line?line+' '+w:w;if(line&&this.hud.mw(g,tr,size)>maxW){out.push(line);line=w}else line=tr}if(line)out.push(line);return out}
 draw(g,arcade,t,W,H){if(arcade.mode==='versus')return this.drawVs(g,arcade,t,W,H);const hud=this.hud;this.modePill(g,arcade,t);
  // Titel (klein, links oben) + Unterzeile
  hud.fam(F_TECH,()=>{g.save();g.globalCompositeOperation='lighter';hud.fancy(g,'H!TisOP',W/2-2,64,40,['#00f3ff','#00f3ff'],'center',null,t,false,true,900,4);g.restore();
   hud.fancy(g,'H!TisOP',W/2+2,64,40,['#ff2bd6','#ff2bd6'],'center',null,t,false,true,900,4);
   hud.fancy(g,'H!TisOP',W/2,64,40,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,4)});
  hud.lab(g,'WÄHLE DEINEN KÄMPFER',W/2+2,88,13,'#9fe8ff','center',4,null,'700');
  const slots=[...ROSTER,'custom'],N=slots.length,cur=arcade.cursor;
  // Kämpfer links: nur Figur + Name, kein Rahmen. Auswahl = Licht am Boden, voller Glanz, Name hell.
  slots.forEach((id,i)=>{const ch=CHARACTERS[id],r=cardRect(i,N),sel=i===cur,pulse=.5+.5*Math.sin(t*.1),cx=r.x+r.w/2,col=ch?ch.glow||'#fff':'#3fe0ff',base=r.y+r.h-50;
   g.save();g.globalAlpha=this.ln?(sel?1:.22):(sel?1:.55);
   // Bodenlicht
   const gl=g.createRadialGradient(cx,base+4,2,cx,base+4,sel?64:40);gl.addColorStop(0,col+(sel?'99':'33'));gl.addColorStop(1,'#0000');g.fillStyle=gl;g.beginPath();g.ellipse(cx,base+4,sel?64:40,sel?14:9,0,0,7);g.fill();
   if(ch){const f=this.fake(id,t/2),s=(sel?.52:.48)*(FIG[id]||1);f.x=cx;f.y=base;g.save();g.translate(cx,base);g.scale(s,s);g.translate(-cx,-base);drawFighter(g,f,t/60,1,base);g.restore()}
   else{g.strokeStyle=col;g.lineWidth=3;g.lineCap='round';g.globalAlpha=sel?.95:.5;g.beginPath();g.moveTo(cx-16,base-50);g.lineTo(cx+16,base-50);g.moveTo(cx,base-66);g.lineTo(cx,base-34);g.stroke();g.globalAlpha=sel?1:.55}
   hud.fam(F_DISP,()=>hud.fancy(g,ch?ch.name:'EIGENE FIGUR',cx,r.y+r.h-24,sel?19:17,sel?['#ffffff',col]:['#cfc6ee','#a79bd6'],'center',sel?col:null,t,false,false,400,1));
   if(ch&&ch.custom){const e=editRect(r);g.globalAlpha=sel?1:.6;g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.roundRect(e.x,e.y,e.w,e.h,5);g.stroke();hud.txt(g,'✎ EDIT',e.x+e.w/2,e.y+13,10,'#fff','center')}
   g.restore()});
  this.profile(g,slots[cur],arcade,t,W);
  if(this.ln){const r=cardRect(cur,N);this.stepLaunch(t,r.x+r.w/2);if(this.fw)this.fw.draw(g)}
  this._lt=t;
  this.foot(g,arcade,t,W,slots[cur]==='custom'&&!CHARACTERS.custom?'ENTER / KLICK – FIGUR ERSTELLEN':'ENTER / J / KLICK – KÄMPFEN',!!CHARACTERS.custom)}

 // Profil rechts: Porträt, Name, Kurzbeschreibung, Werte, Stärken/Schwächen, Arcade-Gegner
 profile(g,id,arcade,t,W){const hud=this.hud,ch=CHARACTERS[id],col=ch?ch.glow||'#fff':'#3fe0ff';
  g.save();
  // zarte Fläche statt Rahmen
  const bg=g.createLinearGradient(PX-20,0,PX+PW+20,0);bg.addColorStop(0,'#0a061800');bg.addColorStop(.12,'#0a0618cc');bg.addColorStop(1,'#0a0618cc');g.fillStyle=bg;g.fillRect(PX-20,104,PW+50,396);
  g.fillStyle=col+'88';g.fillRect(PX-1,112,2,380);
  if(!ch){   // leerer Slot
   hud.fam(F_DISP,()=>hud.fancy(g,'EIGENE FIGUR',PX+16,162,40,['#ffffff',col],'left',col,t,false,false,400,2));
   this.wrap(g,'Lade deine Sprite-Sheets hoch, stelle Name, Moves und Werte ein und kämpfe mit deinem eigenen Charakter.',14,PW-30).forEach((l,k)=>hud.txt(g,l,PX+16,198+k*20,14,TXT,'left'));
   hud.txt(g,'Es reicht ein einziges Sheet (Idle); alles andere kannst du nach und nach ergänzen.',PX+16,262,12,DIM,'left');g.restore();return}
  // Porträt
  const py=116,ps=150,ph=170,pcx=PX+16+ps/2,pcy=py+ph/2;
  const pg=g.createRadialGradient(pcx,pcy+30,6,pcx,pcy+30,ps*.8);pg.addColorStop(0,col+'55');pg.addColorStop(1,'#0000');g.fillStyle=pg;g.fillRect(PX+8,py-6,ps+16,ph+12);
  g.save();
  if(!drawFullFrame(g,ch,PX+16,py,ps,ph)){g.fillStyle=col;g.font=`900 90px ${F_TECH}`;g.textAlign='center';g.fillText(ch.name[0],pcx,pcy+30)}
  g.restore();
  // Name + Beschreibung
  const tx=PX+16+ps+20;
  hud.fam(F_DISP,()=>hud.fancy(g,ch.name,tx,py+44,40,['#ffffff',col],'left',col,t,false,false,400,2));
  const parts=ch.desc.split(' · ');
  hud.lab(g,parts[0].toUpperCase(),tx,py+70,12,TXT,'left',2,null,'700');
  if(parts[1])hud.lab(g,parts[1].toUpperCase(),tx,py+90,12,col,'left',2,null,'700');
  // Werte als Balken
  const bars=[['LEBEN',ch.hp,(ch.hp-700)/(1500-700)],['TEMPO',Math.round(ch.walk*100)+'%',ch.walk/1.4],['SCHADEN',Math.round(ch.dmg*100)+'%',ch.dmg/1.3],['ABWEHR',Math.round(100/(ch.def||1))+'%',(1/(ch.def||1))/1.3]];
  const by=py+ph+16,bx=PX+16,lw=84,bw=PW-16-lw-70;
  bars.forEach(([lab,val,v],k)=>{const y=by+k*22;v=Math.max(.04,Math.min(1,v));
   hud.lab(g,lab,bx,y+4,11,DIM,'left',2,null,'700');
   g.fillStyle='#ffffff18';g.fillRect(bx+lw,y-5,bw,8);
   const fg=g.createLinearGradient(bx+lw,0,bx+lw+bw,0);fg.addColorStop(0,col+'88');fg.addColorStop(1,col);g.fillStyle=fg;g.fillRect(bx+lw,y-5,bw*v,8);
   hud.lab(g,String(val),bx+lw+bw+10,y+4,12,'#fff','left',1,null,'700')});
  // Stärken / Schwächen
  let y=by+4*22+10;
  const block=(sign,txt,c)=>{if(!txt)return;const lines=this.wrap(g,txt,13,PW-16-30);hud.lab(g,sign,bx,y,14,c,'left',0,null,'800');lines.forEach((l,k)=>hud.txt(g,l,bx+22,y+k*17,13,c,'left'));y+=lines.length*17+6};
  block('+',ch.pros,'#7dffc8');block('–',ch.cons,'#ff9a9a');
  // Arcade-Gegner
  if(!ch.boss){const lad=Arcade.ladderFor(ch.id);y=Math.max(y+8,440);
   hud.lab(g,'ARCADE – DEINE GEGNER',bx,y,11,DIM,'left',2,null,'700');
   const cw=(PW-16-6*(lad.length-1))/lad.length;
   lad.forEach((gid,k)=>{const gc=CHARACTERS[gid],boss=gid===BOSS,x=bx+k*(cw+6);
    hud.lab(g,`${k+1}`,x,y+22,11,boss?'#ff7a8a':DIM,'left',0,null,'800');
    hud.fam(F_DISP,()=>hud.fancy(g,gc.name,x+14,y+23,15,boss?['#ffb0b8','#ff3a55']:['#ffffff','#bfb0ff'],'left',null,t,false,true,400,.5))})}
  g.restore()}

 foot(g,arcade,t,W,label,hasCustom){const hud=this.hud,d=arcade.difficulty;
  if(!this.ln&&Math.sin(t*.14)>-.4)hud.fam(F_DISP,()=>hud.fancy(g,label,34,496,24,['#ffe23f','#ff9a3f'],'left','#ffb347',t,false,false,400,2));
  hud.lab(g,'◀ ▶  KÄMPFER',34,516,11,DIM,'left',2,null,'700');hud.lab(g,'▲ ▼  SCHWIERIGKEIT',34,532,11,DIM,'left',2,null,'700');hud.lab(g,DIFF[d],190,532,11,DCOL[d],'left',2,DCOL[d],'800');
  if(hasCustom)hud.lab(g,'E = EIGENE FIGUR BEARBEITEN',W-24,532,10,'#7d6fb0','right',2,null,'600')}
 modePill(g,A,t){const m=MODE_PILL,hud=this.hud,v=A.mode==='versus';g.save();g.fillStyle='#0a0618dd';g.strokeStyle='#7a5cff88';g.lineWidth=1.5;g.beginPath();g.roundRect(m.x,m.y,m.w,m.h,13);g.fill();g.stroke();
  const hx=m.x+(v?m.w/2:0);g.fillStyle=v?'#ff2bd633':'#00f3ff33';g.strokeStyle=v?P2C:P1C;g.shadowColor=v?P2C:P1C;g.shadowBlur=10;g.beginPath();g.roundRect(hx+2,m.y+2,m.w/2-4,m.h-4,11);g.fill();g.stroke();g.restore();
  hud.txt(g,'ARCADE',m.x+m.w/4,m.y+18,13,v?'#9d8fd0':'#fff','center');hud.txt(g,'2 SPIELER',m.x+m.w*.75,m.y+18,13,v?'#fff':'#9d8fd0','center');hud.txt(g,'TAB',m.x+m.w+8,m.y+17,11,'#7d6fb0','left')}
 title(g,t,W,sub,col='#9fe8ff'){const hud=this.hud;
  hud.fam(F_TECH,()=>{const j=Math.sin(t*.05)*2+(t%240<5?(Math.random()-.5)*8:0);g.save();g.globalCompositeOperation='lighter';
   hud.fancy(g,'H!TisOP',W/2-3-j,68,54,['#00f3ff','#00f3ff'],'center',null,t,false,true,900,6);hud.fancy(g,'H!TisOP',W/2+3+j,68,54,['#ff2bd6','#ff2bd6'],'center',null,t,false,true,900,6);g.restore();
   hud.fancy(g,'H!TisOP',W/2,68,54,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,6)});
  hud.lab(g,sub,W/2+4,92,15,col,'center',10,col,'700')}
 // ---- 2-Spieler-Modus: Kämpferwahl (zwei Cursor) ----
 drawVs(g,A,t,W,H){const hud=this.hud,v=A.vs;this.modePill(g,A,t);
  if(v.step===1)return this.drawStagePick(g,A,t,W,H);
  this.title(g,t,W,'2 SPIELER – WÄHLT EURE KÄMPFER');
  const slots=Arcade.slotIds(),N=slots.length;
  slots.forEach((id,i)=>{const ch=CHARACTERS[id],r=vsCardRect(i,N),a=v.c1===i,b=v.c2===i,sel=a||b,pulse=.5+.5*Math.sin(t*.12),cx=r.x+r.w/2,base=ch.glow||'#fff',col=a&&b?(Math.sin(t*.3)>0?P1C:P2C):a?P1C:b?P2C:base;
   g.save();g.translate(cx,r.y+r.h/2);const sc=sel?1.05+.01*pulse:.97;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=sel?1:.6;
   g.shadowColor=col;g.shadowBlur=sel?26+10*pulse:6;g.fillStyle='#0a0618ee';g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.fill();g.shadowBlur=0;
   const bg=g.createRadialGradient(cx,r.y+r.h-70,10,cx,r.y+r.h-70,150);bg.addColorStop(0,base+'44');bg.addColorStop(1,'#0000');g.fillStyle=bg;g.fillRect(r.x,r.y,r.w,r.h);
   g.strokeStyle=col;g.lineWidth=sel?4:2;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.stroke();
   g.save();g.beginPath();g.roundRect(r.x+2,r.y+2,r.w-4,r.h-4,10);g.clip();
   const f=this.fake(id,t/2),by=r.y+r.h-92,s=.82;f.x=cx;f.y=by;g.translate(cx,by);g.scale(s,s);g.translate(-cx,-by);g.fillStyle='#0008';g.beginPath();g.ellipse(cx,by+4,52,9,0,0,7);g.fill();drawFighter(g,f,t/60,1,by);g.restore();
   hud.fancy(g,ch.name,cx,r.y+r.h-52,N>4?19:21,['#ffffff',base],'center',base,t,true);
   const parts=ch.desc.split(' · ');hud.txt(g,parts[0],cx,r.y+r.h-32,12,'#d6c8ff','center');if(parts[1])hud.txt(g,parts[1],cx,r.y+r.h-17,11,'#9d8fd0','center');
   if(a)hud.fancy(g,'▼ P1',cx-(b?36:0),r.y+22,16,['#fff',P1C],'center',P1C,t);if(b)hud.fancy(g,'▼ P2',cx+(a?36:0),r.y+22,16,['#fff',P2C],'center',P2C,t);
   g.restore()});
  // Werte + Status beider Spieler
  [[v.c1,1,W*.25,P1C],[v.c2,2,W*.75,P2C]].forEach(([ci,pl,x,col])=>{const ch=CHARACTERS[slots[ci]],lk=v.locked[pl-1];
   hud.fancy(g,`SPIELER ${pl}  ·  ${ch.name}`,x,392,18,['#ffffff',col],'center',col,t);
   hud.txt(g,`HP ${ch.hp}  ·  TEMPO ${Math.round(ch.walk*100)}%  ·  SCHADEN ${Math.round(ch.dmg*100)}%`,x,410,12,'#d6c8ff','center');
   hud.txt(g,'+ '+(ch.pros||''),x,425,11,'#7dffc8','center');hud.txt(g,'– '+(ch.cons||''),x,439,11,'#ff9a9a','center');
   hud.fancy(g,lk?'✔ BEREIT':'wählt …',x,462,15,lk?['#ffffff','#7dffc8']:['#9d8fd0','#9d8fd0'],'center',lk?'#7dffc8':null,t)});
  hud.txt(g,'P1:  A / D  wählen  ·  G  bestätigen',W*.25,492,13,P1C,'center');hud.txt(g,'P2:  ◀ / ▶  wählen  ·  ENTER  bestätigen',W*.75,492,13,P2C,'center');
  const both=v.locked[0]&&v.locked[1];if(!both&&(v.locked[0]||v.locked[1])&&Math.sin(t*.14)>-.4)hud.fancy(g,`WARTE AUF SPIELER ${v.locked[0]?2:1}`,W/2,520,18,['#ffe23f','#ff9a3f'],'center','#ffb347',t);
  hud.txt(g,'ESC = Auswahl zurücknehmen',14,530,11,'#7d6fb0','left');hud.txt(g,'M = Menü (Steuerung & Moves)',W-14,530,11,'#7d6fb0','right')}
 // ---- 2-Spieler-Modus: Stage-Wahl ----
 drawStagePick(g,A,t,W,H){const hud=this.hud,v=A.vs,N=THEMES.length+1,slots=Arcade.slotIds();
  this.title(g,t,W,'STAGE WÄHLEN');
  for(let i=0;i<N;i++){const r=stageRect(i,N),T=THEMES[i],sel=v.stage===i,pulse=.5+.5*Math.sin(t*.12),cx=r.x+r.w/2,col=T?T.lights[0]:'#ffe23f';
   g.save();g.translate(cx,r.y+r.h/2);const sc=sel?1.06+.01*pulse:.96;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=sel?1:.65;g.shadowColor=col;g.shadowBlur=sel?28:6;
   const gr=g.createLinearGradient(0,r.y,0,r.y+r.h);if(T){gr.addColorStop(0,T.sky[1]);gr.addColorStop(.55,T.sky[3]);gr.addColorStop(1,T.floor[0])}else{gr.addColorStop(0,'#1a1240');gr.addColorStop(1,'#0a0618')}
   g.fillStyle=gr;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.fill();g.shadowBlur=0;g.save();g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.clip();
   if(T){g.fillStyle=T.moon[0]+'88';g.beginPath();g.arc(cx+30,r.y+70,26,0,7);g.fill();g.fillStyle='#00000066';for(let k=0;k<7;k++){const bh=26+((k*37)%34);g.fillRect(r.x+8+k*23,r.y+r.h-70-bh,19,bh+20)}g.fillStyle=T.floor[0];g.fillRect(r.x,r.y+r.h-58,r.w,58);g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(r.x,r.y+r.h-58);g.lineTo(r.x+r.w,r.y+r.h-58);g.stroke()}
   else hud.fancy(g,'?',cx,r.y+r.h/2+20,72,['#ffffff','#ffb347'],'center','#ffb347',t);
   g.restore();g.strokeStyle=sel?'#fff':col;g.lineWidth=sel?4:2;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.stroke();
   hud.fancy(g,T?T.name:'ZUFALL',cx,r.y+r.h-30,T?17:20,['#ffffff',col],'center',col,t,true);hud.txt(g,T?T.desc:'neu bei jeder Revanche',cx,r.y+r.h-12,11,'#d6c8ff','center');g.restore()}
  hud.fancy(g,`${CHARACTERS[slots[v.c1]].name}`,W*.25,372,22,['#ffffff',P1C],'center',P1C,t);hud.fancy(g,'VS',W/2,372,26,['#ffe23f','#ff9a3f'],'center','#ffb347',t);hud.fancy(g,`${CHARACTERS[slots[v.c2]].name}`,W*.75,372,22,['#ffffff',P2C],'center',P2C,t);
  hud.txt(g,'SPIELER 1',W*.25,390,11,'#9fe8ff','center');hud.txt(g,'SPIELER 2',W*.75,390,11,'#ff9ae8','center');
  hud.txt(g,'A / D  oder  ◀ / ▶  Stage wählen',W/2,452,14,'#d6c8ff','center');
  if(Math.sin(t*.14)>-.4)hud.fancy(g,'ENTER / G / KLICK – KAMPF STARTEN',W/2,488,22,['#ffe23f','#ff9a3f'],'center','#ffb347',t);
  hud.txt(g,'ESC = zurück zur Kämpferwahl',14,530,11,'#7d6fb0','left')}
}
