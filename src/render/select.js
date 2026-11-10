import{CHARACTERS,ROSTER}from'../core/characters.js';
import{Arcade}from'../core/arcade.js';
import{drawFullFrame}from'./sprites.js';
import{SKINS,skinCount,skinName}from'./skins.js';
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
// Modus-Schalter oben links (ARCADE | 2 SPIELER | MELEE) – klickbar, Taste TAB. Rückgabe 0 | 1 | 2
// Melee-Optionen als klickbare Felder (Spieler 2 Mensch/CPU, CPU-Stärke, Stocks)
export const MELEE_OPTS=[0,1,2].map(i=>({x:690,y:10+i*30,w:262,h:24}));
export function hitMeleeOpt(lx,ly){for(let i=0;i<3;i++){const r=MELEE_OPTS[i];if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
export const MODE_PILL={x:14,y:12,w:318,h:26};
export function hitMode(lx,ly){const m=MODE_PILL;if(ly<m.y||ly>m.y+m.h||lx<m.x||lx>m.x+m.w)return -1;return Math.min(2,Math.floor((lx-m.x)/(m.w/3)))}
// Stage-Karten (Versus): 4 Level + Zufall
export const stageRect=(i,n=5)=>{const w=170,gap=14,tot=n*w+(n-1)*gap,x0=(960-tot)/2;return{x:x0+i*(w+gap),y:128,w,h:190}};
export function hitStage(lx,ly,n=5){for(let i=0;i<n;i++){const r=stageRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
const P1C='#00f3ff',P2C='#b98bff';
// 2-Spieler-Kämpferwahl: eigene Karten (4 Kämpfer + Platz für die eigene Figur), unabhängig von der Kämpferliste des Arcade-Menüs
export const vsCardRect=(i,n=4)=>cardRect(i,n);   // gleiches Raster wie im Arcade-Menü
export function hitVsCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=vsCardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
const DIFF=['LEICHT','NORMAL','HART'],DCOL=['#7fe8ff','#9b9bff','#d38bff'];
const FIG={tiger:.9,st3g0:.88,kitsune:.86};   // Größenausgleich je Figur in der Liste
const PX=508,PW=422;   // Profilbereich rechts (x, Breite)
const VTEXT={tiger:['LET\'S GO','上吧！'],st3g0:['UNLIKELY','不太可能'],kitsune:['TRY!','试试吧！']};   // Schriftzug im Übergangsvideo + chinesische Übersetzung
const DIM='#9d8fd0',TXT='#d6c8ff';
export class SelectScreen{
 constructor(hud){this.hud=hud;this.fakes={};this.ln=null;this.fw=null;this._lt=null;this.sfx=null;this.vids={};try{for(const id of ROSTER)this.vid(id)}catch(e){}}
 // Kurzvideo je Figur (WebM, vom Build als Data-URI in window.__VIDEOS__); wird beim ersten Zugriff angelegt und vorgeladen, ohne Video/Browser-Support bleibt alles beim Alten
 vid(id){if(id in this.vids)return this.vids[id];let v=null;const src=typeof window!=='undefined'&&window.__VIDEOS__&&window.__VIDEOS__[id];
  if(src&&typeof document!=='undefined'){try{v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.loop=false;let u=src;try{const b=atob(src.slice(src.indexOf(',')+1)),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);u=URL.createObjectURL(new Blob([a],{type:'video/webm'}))}catch(e){}v.src=u;v.load()}catch(e){v=null}}
  return this.vids[id]=v}
 vidReady(v){return !!v&&!v.error&&v.readyState>=2&&v.videoWidth>0}
 get launching(){return !!this.ln}
 // Auswahl bestätigt: kleines Feuerwerk, danach (wenn alles verglüht ist) cb() -> Kampf startet
 launch(id,cb,sfx,id2){if(this.ln)return;this.sfx=sfx||null;this.fw=new ParticleSystem();const vs=id2!==undefined,gl=i=>(CHARACTERS[i]&&CHARACTERS[i].glow)||'#3fe0ff',col=gl(id),col2=vs?gl(id2):col;   // id2 gesetzt = 2-Spieler/Melee (zwei Videos nebeneinander)
  this.fw.onBoom=r=>{if(this.sfx&&!r.fin)this.sfx('fw_rocket',{vol:.8,rate:.92+Math.random()*.2});   // normale Raketen: Böller; die 3 Finale-Raketen bekommen zusammen den einen Finalschlag (unten)
  
   const f=this.fw,cc=vs&&Math.random()<.5?col2:col;f.ring(r.x,r.y,cc,90);f.glitter(r.x,r.y,{count:18,speed:5,life:70,size:4,colors:[cc,'#ffffff','#cdb4ff','#b98bff'],gravity:.05});if(r.fin&&!r.mega){f.flare(r.x,r.y,'#ffffff',200,18,Math.random()*3);f.starburst(r.x,r.y,cc,26)}};
  const ok=v=>v&&!v.error?v:null,v1=ok(this.vid(id)),v2=vs?ok(this.vid(id2)):null;let V=0;
  for(const v of new Set([v1,v2].filter(Boolean))){try{v.pause();v.currentTime=0}catch(e){}try{const p=v.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}V=Math.max(V,Math.round((isFinite(v.duration)&&v.duration>0?v.duration:2)*60))}
  if(V)V=Math.max(60,V);
  this.ln={id,id2,vs,cb,t:0,acc:0,vid:v1,vid2:v2,V,flash:0,col,col2,fx:480,sp:240,fy:vs?235:270,gx:60,gw:840,gy:120,gh:230};
  if(this.sfx)this.sfx('ui_round_start',{vol:.6})}
 // Schriftzug über dem Video: leuchtend, halbtransparent in der Figurenfarbe; darunter die chinesische Übersetzung
 vidText(g,id,lx,y,size,col,al,t){const T=VTEXT[id];if(!T||al<=0)return;const pu=.88+.12*Math.sin(t*.12);g.save();g.textAlign='left';g.lineJoin='round';   // lx = linke Kante des Schriftzugs
  const mix=(c,k)=>{const h=String(c).replace('#','');if(!/^[0-9a-f]{6}$/i.test(h))return c;const m=i=>Math.round(parseInt(h.slice(i,i+2),16)*(1-k)+255*k).toString(16).padStart(2,'0');return'#'+m(0)+m(2)+m(4)}, col2=mix(col,.45);   // Übersetzung etwas heller als das Original
  const row=(txt,yy,sz,c)=>{g.font=`900 ${sz}px ${F_DISP}`;
   for(const[blur,a,cc]of[[40,.5,c],[18,.65,c],[0,.55,'#ffffff']]){g.shadowColor=c;g.shadowBlur=blur;g.globalAlpha=al*a*pu;g.fillStyle=cc;g.fillText(txt,lx,yy)}
   g.shadowBlur=0;g.globalAlpha=al*.5;g.strokeStyle=c;g.lineWidth=1.5;g.strokeText(txt,lx,yy)};
  row(T[0],y,size,col);row(T[1],y+size*.78,size*.58,col2);g.restore()}
 // Kurzvideo als Rahmen-Feld (16:9) zeichnen
 vidPanel(g,v,x,y,w,h,col,al,flash){g.save();g.globalAlpha=al;g.shadowColor=col;g.shadowBlur=24;g.fillStyle='#000';g.beginPath();g.roundRect(x,y,w,h,8);g.fill();g.shadowBlur=0;g.save();g.clip();
  try{if(v)g.drawImage(v,x,y,w,h)}catch(e){}g.restore();g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.roundRect(x,y,w,h,8);g.stroke();
  if(flash>0){g.globalAlpha=al*Math.min(.92,flash*.55);g.fillStyle='#fff';g.beginPath();g.roundRect(x,y,w,h,8);g.fill()}g.restore()}
 // Feuerwerk weiterlaufen lassen (Schritte in 60-Hz-Frames, unabhängig von der Monitorfrequenz)
 stepLaunch(t,cellCx){const ln=this.ln;if(!ln)return;const dt=this._lt==null?1:Math.min(3,Math.max(0,t-this._lt));ln.acc+=dt;
  const col=ln.col,col2=ln.col2,vid=!!(ln.vid||ln.vid2),V=ln.V||70,FIN=Math.max(1,V-50),fx=ln.fx,sp=ln.sp,fy=ln.fy;
  // Show: viele Raketen über die Videolänge verteilt; das Finale (3 Raketen mit fester Steigzeit 50 Frames) platzt genau im Moment, in dem das Video endet
  const shots=[[1,cellCx,190,col],[8,480,130,'#ffffff'],[15,770,200,col2],[24,610,150,'#bfe9ff'],[32,250,170,'#b98bff'],[40,860,140,'#7dffc8'],[48,400,120,ln.vs?col:col]];
  const fin=[[FIN,fx,110,col],[FIN+2,fx-sp,140,ln.vs?col2:'#ffffff'],[FIN+4,fx+sp,130,'#bfe9ff']];
  while(ln.acc>=1){ln.acc-=1;ln.t++;
   for(const s of shots)if(s[0]===ln.t){this.fw.rocket(s[1],500,s[2],s[3],.72);this.fw.shock(s[1],500,s[3],200,26)}
   if(vid)for(const s of fin)if(s[0]===ln.t){this.fw.rocket(s[1],500,s[2],s[3],.9);this.fw.rk[this.fw.rk.length-1].rise=50;this.fw.rk[this.fw.rk.length-1].fin=true}
   if(vid&&ln.t===FIN+50){ln.flash=1;const f=this.fw,gold='#ffd27a';
    // FINALSCHLAG: vierfache Riesen-Blume (die äußere füllt fast den Bildschirm, ~1500 Sterne), normaler Blitz, Glitzer-/Splitterregen, Blitzbögen, danach Nachzünder
    f.mega(fx,fy,col,2.6,4,1.6);f.mega(fx,fy,col2,1.9,2.4,1.4);f.mega(fx,fy,gold,1.25,1.6,1.3);f.mega(fx,fy,'#ffffff',.7,1,1.2);
        f.shock(fx,420,col,420,36);f.shock(fx,420,col2,300,30);
    for(const r of[80,150,230])f.ring(fx,fy,r%2?'#ffffff':col,r);
    f.glitter(fx,fy,{count:170,speed:13,life:110,size:6,colors:[col,col2,gold,'#ffffff','#cdb4ff','#7df9ff','#b98bff'],gravity:.05});f.shard(fx,fy,{count:50,speed:11,life:90,colors:[col,col2,gold,'#ffffff','#cdb4ff']});
        for(let i=0;i<24;i++)f.bolt(fx,fy,i%2?col:'#ffffff',i*.2618+Math.random()*.15,260+Math.random()*220,10);   // (bolt: x,y,Farbe,Winkel,Länge,Leben)
    ln.later=[[8,-300,-60],[14,300,-40],[20,-170,70],[26,200,50],[32,0,-100],[38,-380,40],[44,380,30]].map((q,k)=>[ln.t+q[0],fx+q[1],fy+q[2],k%3===0?gold:k%2?col:col2]);   // Nachzünder: kleinere Kugeln rund um die Mitte
    if(this.sfx)this.sfx('fw_finale',{vol:.75})}
   if(ln.later)for(const q of ln.later)if(q[0]===ln.t){this.fw.mega(q[1],q[2],q[3],1.1,1.1,.9);this.fw.glitter(q[1],q[2],{count:22,speed:6,life:80,size:4,colors:[q[3],'#ffffff','#cdb4ff'],gravity:.05});this.fw.ring(q[1],q[2],q[3],120);this.fw.shock(q[1],q[2]+40,q[3],160,20)}
   if(vid&&ln.t>FIN+50&&ln.t%12===0)this.fw.glitter(ln.gx+Math.random()*ln.gw,ln.gy+Math.random()*ln.gh,{count:5,speed:2,life:60,size:3.4,colors:[col,col2,'#ffffff','#cdb4ff'],gravity:-.03});
   ln.flash=Math.max(0,ln.flash-.045);this.fw.update()}
  const f=this.fw,quiet=!f.fs.some(p=>p.alive)&&!f.rk.length&&!f.ff.length,vdone=[ln.vid,ln.vid2].filter(Boolean).every(v=>v.ended||!!v.error);
  // Ende: Video fertig (steht auf dem letzten Frame) UND Feuerwerk verglüht -> Kampf; Notbremse falls etwas hängt
  // Mit Video: nach dem Verglühen des Feuerwerks bleibt der letzte Frame noch 1 s (60 Frames) stehen
  if(vid&&ln.t>30&&quiet&&vdone&&ln.t>=V+40&&ln.qT==null)ln.qT=ln.t;
  if((!vid&&ln.t>30&&quiet)||(vid&&ln.qT!=null&&ln.t>=ln.qT+60)||ln.t>(vid?V+260:420)||ln.t>600){const cb=ln.cb;for(const v of[ln.vid,ln.vid2])try{if(v)v.pause()}catch(e){}this.ln=null;this.fw=null;if(cb)cb()}}
 fake(id,t){const ch=CHARACTERS[id],f=this.fakes[id]||(this.fakes[id]={x:0,y:0,facing:1,char:ch,anim:'idle',animU:0,sf:0,mf:0,move:null,state:'idle',trail:[],vx:0,vy:0,menu:true});f.sf=t;f.char=ch;return f}
 // Text in Zeilen umbrechen (Breite in Logik-Pixeln)
 wrap(g,s,size,maxW){const out=[];let line='';for(const w of String(s).split(' ')){const tr=line?line+' '+w:w;if(line&&this.hud.mw(g,tr,size)>maxW){out.push(line);line=w}else line=tr}if(line)out.push(line);return out}
 draw(g,arcade,t,W,H){if(arcade.pvp)return this.drawVs(g,arcade,t,W,H);const hud=this.hud;this.modePill(g,arcade,t);
  // Titel (klein, links oben) + Unterzeile
  hud.fam(F_TECH,()=>{g.save();g.globalCompositeOperation='lighter';hud.fancy(g,'H!TisOP',W/2-2,64,40,['#00f3ff','#00f3ff'],'center',null,t,false,true,900,4);g.restore();
   hud.fancy(g,'H!TisOP',W/2+2,64,40,['#b98bff','#b98bff'],'center',null,t,false,true,900,4);
   hud.fancy(g,'H!TisOP',W/2,64,40,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,4)});
  hud.lab(g,'WÄHLE DEINEN KÄMPFER',W/2+2,88,13,'#9fe8ff','center',4,null,'700');
  const slots=[...ROSTER,'custom'],N=slots.length,cur=arcade.cursor;
  // Kämpfer links: nur Figur + Name, kein Rahmen. Auswahl = Licht am Boden, voller Glanz, Name hell.
  slots.forEach((id,i)=>{const ch=CHARACTERS[id],r=cardRect(i,N),sel=i===cur,pulse=.5+.5*Math.sin(t*.1),cx=r.x+r.w/2,col=ch?ch.glow||'#fff':'#3fe0ff',base=r.y+r.h-50;
   g.save();g.globalAlpha=this.ln?(sel?1:.22):(sel?1:.55);
   // Bodenlicht
   const gl=g.createRadialGradient(cx,base+4,2,cx,base+4,sel?64:40);gl.addColorStop(0,col+(sel?'99':'33'));gl.addColorStop(1,'#0000');g.fillStyle=gl;g.beginPath();g.ellipse(cx,base+4,sel?64:40,sel?14:9,0,0,7);g.fill();
   if(ch){const f=this.fake(id,t/2),s=(sel?.52:.48)*(FIG[id]||1);f.skin=arcade.skinOf(id);f.x=cx;f.y=base;g.save();g.translate(cx,base);g.scale(s,s);g.translate(-cx,-base);drawFighter(g,f,t/60,1,base);g.restore()}
   else{g.strokeStyle=col;g.lineWidth=3;g.lineCap='round';g.globalAlpha=sel?.95:.5;g.beginPath();g.moveTo(cx-16,base-50);g.lineTo(cx+16,base-50);g.moveTo(cx,base-66);g.lineTo(cx,base-34);g.stroke();g.globalAlpha=sel?1:.55}
   hud.fam(F_DISP,()=>hud.fancy(g,ch?ch.name:'EIGENE FIGUR',cx,r.y+r.h-24,sel?19:17,sel?['#ffffff',col]:['#cfc6ee','#a79bd6'],'center',sel?col:null,t,false,false,400,1));
   if(ch)this.skinDots(g,ch,arcade.skinOf(id),cx,r.y+r.h-7,sel);
   if(ch&&ch.custom){const e=editRect(r);g.globalAlpha=sel?1:.6;g.strokeStyle=col;g.lineWidth=1;g.beginPath();g.roundRect(e.x,e.y,e.w,e.h,5);g.stroke();hud.txt(g,'✎ EDIT',e.x+e.w/2,e.y+13,10,'#fff','center')}
   g.restore()});
  this.profile(g,slots[cur],arcade,t,W);
  if(this.ln){const r=cardRect(cur,N),ln=this.ln;
   // Übergangsvideo: füllt den ganzen Bildschirm, bleibt am Ende auf dem letzten Frame stehen
   if(ln.vid&&ln.vid.paused&&!ln.vid.ended&&ln.vid.readyState>=2){try{ln.vid.play()}catch(e){}}
   if(this.vidReady(ln.vid)){g.save();g.globalAlpha=Math.min(1,ln.t/10);g.fillStyle='#000';g.fillRect(0,0,W,H);const k=Math.min(W/16,H/9),w=16*k,h=9*k;try{g.drawImage(ln.vid,(W-w)/2,(H-h)/2,w,h)}catch(e){}
    if(ln.flash>0){g.globalAlpha=Math.min(.92,ln.flash*.55);g.fillStyle='#fff';g.fillRect(0,0,W,H)}g.restore()}
   if(this.vidReady(ln.vid))this.vidText(g,ln.id,56,H-100,76,ln.col,Math.min(1,Math.max(0,(ln.t-15)/20)),t);
   this.stepLaunch(t,r.x+r.w/2);if(this.fw)this.fw.draw(g)}
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
  if(!drawFullFrame(g,ch,PX+16,py,ps,ph,arcade.skinOf(id))){g.fillStyle=col;g.font=`900 90px ${F_TECH}`;g.textAlign='center';g.fillText(ch.name[0],pcx,pcy+30)}
  g.restore();
  // Name + Beschreibung
  const tx=PX+16+ps+20;
  hud.fam(F_DISP,()=>hud.fancy(g,ch.name,tx,py+44,40,['#ffffff',col],'left',col,t,false,false,400,2));
  const parts=ch.desc.split(' · ');
  hud.lab(g,parts[0].toUpperCase(),tx,py+70,12,TXT,'left',2,null,'700');
  if(parts[1])hud.lab(g,parts[1].toUpperCase(),tx,py+90,12,col,'left',2,null,'700');
  // Während des Starts: statt Werten/Stärken/Gegnern läuft das Kurzvideo der Figur (bleibt am Ende auf dem letzten Frame stehen)
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
  block('+',ch.pros,'#7dffc8');block('–',ch.cons,'#d9b8ff');
  // Arcade-Gegner
  {const lad=Arcade.ladderFor(ch.id);y=Math.max(y+8,440);
   hud.lab(g,'ARCADE – DEINE GEGNER',bx,y,11,DIM,'left',2,null,'700');
   const cw=(PW-16-6*(lad.length-1))/lad.length;
   lad.forEach((gid,k)=>{const gc=CHARACTERS[gid],x=bx+k*(cw+6);
    hud.lab(g,`${k+1}`,x,y+22,11,DIM,'left',0,null,'800');
    hud.fam(F_DISP,()=>hud.fancy(g,gc.name,x+14,y+23,15,['#ffffff','#bfb0ff'],'left',null,t,false,true,400,.5))})}
  g.restore()}

 skinDots(g,ch,cur,cx,y,sel){const n=skinCount(ch.sprites);if(n<2)return;   // kleine Farbpunkte unter dem Namen, aktive Farbe mit Ring
  g.save();for(let k=0;k<n;k++){const x=cx+(k-(n-1)/2)*16;g.fillStyle=SKINS[ch.sprites][k].col;g.beginPath();g.arc(x,y,k===cur?4.5:3.2,0,7);g.fill();
   if(k===cur){g.strokeStyle=sel?'#fff':'#ffffffaa';g.lineWidth=1.5;g.beginPath();g.arc(x,y,7,0,7);g.stroke()}}g.restore()}
 foot(g,arcade,t,W,label,hasCustom){const hud=this.hud,d=arcade.difficulty;
  {const id=[...ROSTER,'custom'][arcade.cursor],ch=CHARACTERS[id];if(ch&&skinCount(ch.sprites)>1)hud.lab(g,'C = FARBE: '+skinName(ch.sprites,arcade.skinOf(id)),W-24,516,10,'#d6c8ff','right',2,null,'700')}
  if(!this.ln&&Math.sin(t*.14)>-.4)hud.fam(F_DISP,()=>hud.fancy(g,label,34,496,24,['#ffffff','#9fe8ff'],'left','#8f7bff',t,false,false,400,2));
  hud.lab(g,'◀ ▶  KÄMPFER',34,516,11,DIM,'left',2,null,'700');hud.lab(g,'▲ ▼  SCHWIERIGKEIT',34,532,11,DIM,'left',2,null,'700');hud.lab(g,DIFF[d],190,532,11,DCOL[d],'left',2,DCOL[d],'800');
  if(hasCustom)hud.lab(g,'E = EIGENE FIGUR BEARBEITEN',W-24,532,10,'#7d6fb0','right',2,null,'600')}
 modePill(g,A,t){const m=MODE_PILL,hud=this.hud,k=['arcade','versus','melee'].indexOf(A.mode),cols=[P1C,P2C,'#8f7bff'],col=cols[k],sw=m.w/3;g.save();g.fillStyle='#0a0618dd';g.strokeStyle='#7a5cff88';g.lineWidth=1.5;g.beginPath();g.roundRect(m.x,m.y,m.w,m.h,13);g.fill();g.stroke();
  const hx=m.x+k*sw;g.fillStyle=col+'33';g.strokeStyle=col;g.shadowColor=col;g.shadowBlur=10;g.beginPath();g.roundRect(hx+2,m.y+2,sw-4,m.h-4,11);g.fill();g.stroke();g.restore();
  ['ARCADE','2 SPIELER','MELEE'].forEach((n,i)=>hud.txt(g,n,m.x+sw*(i+.5),m.y+18,13,i===k?'#fff':'#9d8fd0','center'));hud.txt(g,'TAB = Modus wechseln',m.x+6,m.y+m.h+14,10,'#7d6fb0','left')}
 title(g,t,W,sub,col='#9fe8ff'){const hud=this.hud;
  hud.fam(F_TECH,()=>{g.save();g.globalCompositeOperation='lighter';hud.fancy(g,'H!TisOP',W/2-2,64,40,['#00f3ff','#00f3ff'],'center',null,t,false,true,900,4);g.restore();
   hud.fancy(g,'H!TisOP',W/2+2,64,40,['#b98bff','#b98bff'],'center',null,t,false,true,900,4);
   hud.fancy(g,'H!TisOP',W/2,64,40,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,4)});
  hud.lab(g,sub,W/2+2,88,13,col,'center',4,null,'700')}
 // ---- 2-Spieler-Modus: Kämpferwahl (zwei Cursor) ----
 drawVs(g,A,t,W,H){const hud=this.hud,v=A.vs,M=A.mode==='melee';this.modePill(g,A,t);
  if(v.step===1)return this.drawStagePick(g,A,t,W,H);
  this.title(g,t,W,M?'MELEE – WÄHLT EURE KÄMPFER':'2 SPIELER – WÄHLT EURE KÄMPFER',M?'#bfe9ff':undefined);
  if(M)this.meleeOpts(g,A,t,W);
  const slots=Arcade.slotIds(),N=slots.length;
  // Kämpfer links wie im Arcade-Menü: freie Figur + Name, Bodenlicht in der Spielerfarbe, ▼ P1 / ▼ P2 darüber
  slots.forEach((id,i)=>{const ch=CHARACTERS[id],r=vsCardRect(i,N),a=v.c1===i,b=v.c2===i,sel=a||b,cx=r.x+r.w/2,base0=ch.glow||'#fff',col=a&&b?(Math.sin(t*.3)>0?P1C:P2C):a?P1C:b?P2C:base0,base=r.y+r.h-50;
   g.save();g.globalAlpha=sel?1:.55;
   const glow=(x,c,big)=>{const rr=big?64:40,gl=g.createRadialGradient(x,base+4,2,x,base+4,rr);gl.addColorStop(0,c+(big?'99':'33'));gl.addColorStop(1,'#0000');g.fillStyle=gl;g.beginPath();g.ellipse(x,base+4,rr,big?14:9,0,0,7);g.fill()};
   if(a&&b){glow(cx-14,P1C,true);glow(cx+14,P2C,true)}else glow(cx,col,sel);
   const f=this.fake(id,t/2),sc=(sel?.52:.48)*(FIG[id]||1);f.skin=a?A.vsSkinOf(1):b?A.vsSkinOf(2):0;f.x=cx;f.y=base;g.save();g.translate(cx,base);g.scale(sc,sc);g.translate(-cx,-base);drawFighter(g,f,t/60,1,base);g.restore();
   hud.fam(F_DISP,()=>hud.fancy(g,ch.name,cx,r.y+r.h-24,sel?19:17,sel?['#ffffff',col]:['#cfc6ee','#a79bd6'],'center',sel?col:null,t,false,false,400,1));
   this.skinDots(g,ch,a?A.vsSkinOf(1):b?A.vsSkinOf(2):0,cx,r.y+r.h-7,sel);
   const tag=(txt,x,c)=>hud.fancy(g,txt,x,r.y+16,16,['#fff',c],'center',c,t);
   if(a)tag('▼ P1'+(v.locked[0]?' ✔':''),cx-(b?38:0),P1C);if(b)tag('▼ P2'+(v.locked[1]?' ✔':''),cx+(a?38:0),P2C);
   g.restore()});
  // Profil rechts wie im Arcade-Menü, je Spieler ein Block
  g.save();const bg=g.createLinearGradient(PX-20,0,PX+PW+20,0);bg.addColorStop(0,'#0a061800');bg.addColorStop(.12,'#0a0618cc');bg.addColorStop(1,'#0a0618cc');g.fillStyle=bg;g.fillRect(PX-20,104,PW+50,396);
  g.fillStyle=P1C+'88';g.fillRect(PX-1,112,2,180);g.fillStyle=P2C+'88';g.fillRect(PX-1,312,2,180);
  g.fillStyle='#ffffff14';g.fillRect(PX+8,302,PW-16,1);g.restore();
  this.vsProfile(g,A,t,1,slots[v.c1],104,P1C,M);this.vsProfile(g,A,t,2,slots[v.c2],304,P2C,M);
  // Fuß: Wartehinweis + Steuerung
  const one=v.locked[0]!==v.locked[1];if(one&&Math.sin(t*.14)>-.4)hud.fam(F_DISP,()=>hud.fancy(g,`WARTE AUF SPIELER ${v.locked[0]?2:1}`,34,496,22,['#ffffff','#9fe8ff'],'left','#8f7bff',t,false,false,400,2));
  hud.txt(g,'P1:  A / D wählen · C Farbe · G bestätigen',34,516,11,P1C,'left');
  hud.txt(g,M&&A.cpu?'CPU (P2):  ◀ / ▶ wählt den Gegner · ENTER bestätigen':'P2:  ◀ / ▶ wählen · L Farbe · ENTER bestätigen',34,532,11,P2C,'left');
  hud.lab(g,'ESC = ZURÜCK',W-24,516,10,'#7d6fb0','right',2,null,'600')}
 // Ein Spieler-Block im 2P-/Melee-Menü: Porträt, Name, Beschreibung, Balken, Stärken/Schwächen (wie das Arcade-Profil, nur kompakter)
 vsProfile(g,A,t,pl,id,y0,pc,M){const hud=this.hud,ch=CHARACTERS[id],col=ch.glow||'#fff',lk=A.vs.locked[pl-1];
  const ps=92,ph=104,px=PX+14,py=y0+10,pcx=px+ps/2,pcy=py+ph/2;
  g.save();const pg=g.createRadialGradient(pcx,pcy+24,5,pcx,pcy+24,ps*.8);pg.addColorStop(0,col+'55');pg.addColorStop(1,'#0000');g.fillStyle=pg;g.fillRect(px-8,py-6,ps+16,ph+12);
  if(!drawFullFrame(g,ch,px,py,ps,ph,A.vsSkinOf(pl))){g.fillStyle=col;g.font=`900 60px ${F_TECH}`;g.textAlign='center';g.fillText(ch.name[0],pcx,pcy+20)}
  g.restore();
  const tx=px+ps+16,rw=PX+PW-8;
  hud.lab(g,(M&&A.cpu&&pl===2?'CPU':`SPIELER ${pl}`)+(skinCount(ch.sprites)>1?'  ·  '+skinName(ch.sprites,A.vsSkinOf(pl)).toUpperCase():''),tx,y0+20,11,pc,'left',2,pc,'800');
  hud.txt(g,lk?'✔ BEREIT':'wählt …',rw,y0+20,12,lk?'#7dffc8':DIM,'right');
  hud.fam(F_DISP,()=>hud.fancy(g,ch.name,tx,y0+54,32,['#ffffff',col],'left',col,t,false,false,400,2));
  const parts=ch.desc.split(' · ');hud.lab(g,parts[0].toUpperCase(),tx,y0+74,11,TXT,'left',2,null,'700');if(parts[1])hud.lab(g,parts[1].toUpperCase(),tx,y0+90,11,col,'left',2,null,'700');
  const all=[['LEBEN',ch.hp,(ch.hp-700)/(1500-700)],['TEMPO',Math.round(ch.walk*100)+'%',ch.walk/1.4],['SCHADEN',Math.round(ch.dmg*100)+'%',ch.dmg/1.3],['ABWEHR',Math.round(100/(ch.def||1))+'%',(1/(ch.def||1))/1.3]];
  const bars=M?all.slice(1):all,by=y0+(M?112:106),lw=72,bw=PW-(tx-PX)-lw-56,st=M?18:15;
  bars.forEach(([lab,val,vv],k)=>{const y=by+k*st;vv=Math.max(.04,Math.min(1,vv));
   hud.lab(g,lab,tx,y+4,10,DIM,'left',2,null,'700');g.fillStyle='#ffffff18';g.fillRect(tx+lw,y-4,bw,7);
   const fg=g.createLinearGradient(tx+lw,0,tx+lw+bw,0);fg.addColorStop(0,col+'88');fg.addColorStop(1,col);g.fillStyle=fg;g.fillRect(tx+lw,y-4,bw*vv,7);
   hud.lab(g,String(val),tx+lw+bw+8,y+4,11,'#fff','left',1,null,'700')});
  const fit=(txt)=>{let q=String(txt||'');while(q.length>3&&hud.mw(g,q,11)>PW-16-24)q=q.slice(0,-2);return q===String(txt||'')?q:q.trimEnd()+'…'};
  const sy=y0+174;
  if(ch.pros){hud.lab(g,'+',px,sy,13,'#7dffc8','left',0,null,'800');hud.txt(g,fit(ch.pros),px+16,sy,11,'#7dffc8','left')}
  if(ch.cons){hud.lab(g,'–',px,sy+15,13,'#d9b8ff','left',0,null,'800');hud.txt(g,fit(ch.cons),px+16,sy+15,11,'#d9b8ff','left')}}
 // Melee-Optionen (rechts oben, klickbar): Spieler 2 = Mensch/CPU (B), CPU-Stärke (▲▼ bzw. Klick), Stocks (T)
 meleeOpts(g,A,t,W){const hud=this.hud,c='#bfe9ff',on='#7dffc8';
  const row=(i,txt,col,hot)=>{const r=MELEE_OPTS[i];g.save();g.fillStyle=hot?col+'22':'#0a0618cc';g.strokeStyle=hot?col:'#7a5cff88';g.lineWidth=1.5;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,9);g.fill();g.stroke();g.restore();hud.txt(g,txt,r.x+r.w/2,r.y+r.h-7,13,col,'center')};
  row(0,A.cpu?'GEGEN CPU  (klicken / B)':'2 SPIELER LOKAL  (klicken / B)',A.cpu?on:c,A.cpu);
  row(1,A.cpu?`CPU-STÄRKE: ${DIFF[A.difficulty]}  (klicken / ▲▼)`:'CPU-STÄRKE: –  (erst CPU wählen)',A.cpu?DCOL[A.difficulty]:'#6a5d96',A.cpu);
  row(2,`STOCKS: ${A.stocks}  (klicken / T)`,c,false);
  void t}
 // ---- 2-Spieler-Modus: Stage-Wahl ----
 drawStagePick(g,A,t,W,H){const hud=this.hud,v=A.vs,N=THEMES.length+1,slots=Arcade.slotIds();
  if(this.ln&&this.ln.vs)return this.drawVsLaunch(g,A,t,W,H,slots);
  this.title(g,t,W,A.mode==='melee'?'MELEE – STAGE WÄHLEN':'STAGE WÄHLEN',A.mode==='melee'?'#bfe9ff':undefined);
  for(let i=0;i<N;i++){const r=stageRect(i,N),T=THEMES[i],sel=v.stage===i,pulse=.5+.5*Math.sin(t*.12),cx=r.x+r.w/2,col=T?T.lights[0]:'#9fe8ff';
   g.save();g.translate(cx,r.y+r.h/2);const sc=sel?1.06+.01*pulse:.96;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=sel?1:.65;g.shadowColor=col;g.shadowBlur=sel?28:6;
   const gr=g.createLinearGradient(0,r.y,0,r.y+r.h);if(T){gr.addColorStop(0,T.sky[1]);gr.addColorStop(.55,T.sky[3]);gr.addColorStop(1,T.floor[0])}else{gr.addColorStop(0,'#1a1240');gr.addColorStop(1,'#0a0618')}
   g.fillStyle=gr;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.fill();g.shadowBlur=0;g.save();g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.clip();
   if(T){g.fillStyle=T.moon[0]+'88';g.beginPath();g.arc(cx+30,r.y+70,26,0,7);g.fill();g.fillStyle='#00000066';for(let k=0;k<7;k++){const bh=26+((k*37)%34);g.fillRect(r.x+8+k*23,r.y+r.h-70-bh,19,bh+20)}g.fillStyle=T.floor[0];g.fillRect(r.x,r.y+r.h-58,r.w,58);g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(r.x,r.y+r.h-58);g.lineTo(r.x+r.w,r.y+r.h-58);g.stroke()}
   else hud.fancy(g,'?',cx,r.y+r.h/2+20,72,['#ffffff','#8f7bff'],'center','#8f7bff',t);
   g.restore();g.strokeStyle=sel?'#fff':col;g.lineWidth=sel?4:2;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.stroke();
   hud.fancy(g,T?T.name:'ZUFALL',cx,r.y+r.h-30,T?17:20,['#ffffff',col],'center',col,t,true);hud.txt(g,T?T.desc:'neu bei jeder Revanche',cx,r.y+r.h-12,11,'#d6c8ff','center');g.restore()}
  hud.fancy(g,`${CHARACTERS[slots[v.c1]].name}`,W*.25,372,22,['#ffffff',P1C],'center',P1C,t);hud.fancy(g,'VS',W/2,372,26,['#ffffff','#9fe8ff'],'center','#8f7bff',t);hud.fancy(g,`${CHARACTERS[slots[v.c2]].name}`,W*.75,372,22,['#ffffff',P2C],'center',P2C,t);
  hud.txt(g,'SPIELER 1',W*.25,390,11,'#9fe8ff','center');hud.txt(g,'SPIELER 2',W*.75,390,11,'#c9a0ff','center');
  hud.txt(g,'A / D  oder  ◀ / ▶  Stage wählen',W/2,452,14,'#d6c8ff','center');
  if(Math.sin(t*.14)>-.4)hud.fancy(g,'ENTER / G / KLICK – KAMPF STARTEN',W/2,488,22,['#ffffff','#9fe8ff'],'center','#8f7bff',t);
  hud.txt(g,'ESC = zurück zur Kämpferwahl',14,530,11,'#7d6fb0','left')}
 // 2-Spieler/Melee-Start: statt der Stage-Karten laufen die beiden Kurzvideos nebeneinander, dazu das Feuerwerk; danach beginnt der Kampf
 drawVsLaunch(g,A,t,W,H,slots){const hud=this.hud,ln=this.ln,v=A.vs,M=A.mode==='melee';
  this.title(g,t,W,M?'MELEE':'2 SPIELER',M?'#bfe9ff':undefined);
  const w=400,h=225,y=118,xs=[W*.25-w/2,W*.75-w/2],vv=[ln.vid,ln.vid2],ids=[ln.id,ln.id2],cols=[ln.col,ln.col2],al=Math.min(1,ln.t/10);
  for(let i=0;i<2;i++){if(vv[i]&&vv[i].paused&&!vv[i].ended&&vv[i].readyState>=2){try{vv[i].play()}catch(e){}}
   if(this.vidReady(vv[i])){this.vidPanel(g,vv[i],xs[i],y,w,h,cols[i],al,ln.flash);this.vidText(g,ids[i],xs[i]+18,y+h-50,38,cols[i],Math.min(1,Math.max(0,(ln.t-15)/20)),t)}
   else{this.vidPanel(g,null,xs[i],y,w,h,cols[i],al,ln.flash);const ch=CHARACTERS[ids[i]];g.save();g.globalAlpha=al;if(ch&&!drawFullFrame(g,ch,xs[i]+w/2-60,y+10,120,h-20,A.vsSkinOf(i+1))){g.fillStyle=cols[i];g.font=`900 80px ${F_TECH}`;g.textAlign='center';g.fillText(ch.name[0],xs[i]+w/2,y+h/2+28)}g.restore()}}
  hud.fancy(g,CHARACTERS[ids[0]].name,W*.25,372,26,['#ffffff',P1C],'center',P1C,t);hud.fancy(g,'VS',W/2,236,34,['#ffffff','#9fe8ff'],'center','#8f7bff',t);hud.fancy(g,CHARACTERS[ids[1]].name,W*.75,372,26,['#ffffff',P2C],'center',P2C,t);
  hud.txt(g,M&&A.cpu?'CPU':'SPIELER 2',W*.75,392,11,'#c9a0ff','center');hud.txt(g,'SPIELER 1',W*.25,392,11,'#9fe8ff','center');
  this.stepLaunch(t,W/2);if(this.fw)this.fw.draw(g);this._lt=t;void v}
}
