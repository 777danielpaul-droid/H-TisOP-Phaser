import{Arcade}from'../core/arcade.js';
import{BOSS,CHARACTERS,ROSTER}from'../core/characters.js';
import{H,MELEE,W}from'../core/config.js';
import{ownsSkin}from'../core/loot.js';

import{ParticleSystem}from'../core/particles.js';
import{CHAPTERS,Story}from'../core/story.js';

import{F_DISP,F_TECH}from'./fonts.js';

import{mix}from'./meleehud.js';
import{A,drawFighter}from'./rig.js';
import{SKINS,skinCount,skinName}from'./skins.js';
import{R,drawFullFrame}from'./sprites.js';
import{Stage,THEMES}from'./stage.js';
// Startmenü: Kämpferliste links (kleine Figuren ohne Rahmen), rechts Profil des gewählten/gehoverten Kämpfers (Porträt + Kampfwerte).
export const GRID={cols:3,w:146,h:176,x:30,y:116};
// Rondell (Arcade/Story): immer 3 Figuren sichtbar, die mittlere ist die gewählte. Links/Rechts schaltet eine weiter.
export const CAR={cx:255,spacing:166,base:366,sideBase:340,sc:.78,scSide:.5};
// Zelle für den Versus-Raster (2-Spieler-Menü nutzt weiter das Raster)
export const cardRect=(i,n=4)=>({x:GRID.x+(i%GRID.cols)*GRID.w,y:GRID.y+Math.floor(i/GRID.cols)*GRID.h,w:GRID.w,h:GRID.h});
// Klickfläche je Rondell-Platz: off -1 = linke Figur, 0 = Mitte, 1 = rechte Figur
export const carRect=off=>off===0?{x:CAR.cx-78,y:170,w:156,h:250}:{x:CAR.cx+off*CAR.spacing-58,y:210,w:116,h:170};
export function hitCar(lx,ly){for(const off of[0,-1,1]){const r=carRect(off);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return off}return null}
// Klickfläche „✎ EDIT“ unter dem Namen der eigenen Figur (nur wenn sie in der Mitte steht)
export const editRect=()=>({x:CAR.cx-28,y:CAR.base+66,w:56,h:18});
export function hitEdit(lx,ly){const r=editRect();return lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h}
export function hitCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=cardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
// Modus-Schalter oben links (ARCADE | 2 SPIELER | MELEE) – klickbar, Taste TAB. Rückgabe 0 | 1 | 2
// Melee-Optionen als klickbare Felder (Spieler 2 Mensch/CPU, CPU-Stärke, Stocks)
export const MELEE_OPTS=[0,1,2].map(i=>({x:690,y:10+i*30,w:262,h:24}));
export function hitMeleeOpt(lx,ly){for(let i=0;i<3;i++){const r=MELEE_OPTS[i];if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
export const MODE_PILL={x:14,y:12,w:318,h:26};
export function hitChapter(lx,ly){return lx>=W-300&&lx<=W-16&&ly>=478&&ly<=506}   // Kapitel-Zeile im Story-Menü (rechts unten)
export function hitMode(lx,ly){const m=MODE_PILL;if(ly<m.y||ly>m.y+m.h||lx<m.x||lx>m.x+m.w)return -1;return Math.min(3,Math.floor((lx-m.x)/(m.w/4)))}
// Stage-Karten (Versus): 4 Level + Zufall
export const stageRect=(i,n=5)=>{const w=170,gap=14,tot=n*w+(n-1)*gap,x0=(960-tot)/2;return{x:x0+i*(w+gap),y:128,w,h:190}};
export function hitStage(lx,ly,n=5){for(let i=0;i<n;i++){const r=stageRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
export const P1C='#6fe3ff',P2C='#b98bff';
// 2-Spieler-Kämpferwahl: eigene Karten (4 Kämpfer + Platz für die eigene Figur), unabhängig von der Kämpferliste des Arcade-Menüs
// 2-Spieler/Melee: je Spieler ein Rondell (P1 oben, P2 unten, auf Höhe seines Profil-Blocks)
export const VCAR={cx:255,spacing:150,sc:.6,scSide:.38};
export const vsY0=pl=>pl===1?104:304;
export const vcarRect=(pl,off)=>{const y0=vsY0(pl);return off===0?{x:VCAR.cx-64,y:y0+34,w:128,h:150}:{x:VCAR.cx+off*VCAR.spacing-46,y:y0+60,w:92,h:110}};
export function hitVsCar(lx,ly){for(const pl of[1,2])for(const off of[0,-1,1]){const r=vcarRect(pl,off);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return{pl,off}}return null}
export const vsCardRect=(i,n=4)=>cardRect(i,n);   // gleiches Raster wie im Arcade-Menü
export function hitVsCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=vsCardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
export const DIFF=['LEICHT','NORMAL','HART','ALPTRAUM'],DCOL=['#7fe8ff','#9b9bff','#d38bff','#ff4d5e'];
export const FIG={tiger:.9,st3g0:.88,kitsune:.86};   // Größenausgleich je Figur in der Liste
export const PX=508,PW=422;   // Profilbereich rechts (x, Breite)
export const VTEXT={tiger:['LET\'S GO','上吧！'],st3g0:['UNLIKELY','不太可能'],kitsune:['TRY!','试试吧！'],anubis:['JUDGMENT','审判']};   // Schriftzug im Übergangsvideo + chinesische Übersetzung
export const DIM='#8f95d8',TXT='#d6dcff';
export class SelectScreen{
 constructor(hud){this.hud=hud;this.fakes={};this.ln=null;this.fw=null;this._lt=null;this.sfx=null;this.vids={};try{const ids=new Set(ROSTER);if(typeof window!=='undefined'&&window.__VIDEOS__)for(const k in window.__VIDEOS__)ids.add(k);for(const id of ids)this.vid(id)}catch(e){}}   // auch noch nicht freigeschaltete Figuren (Anubis) vorladen, damit das Video beim ersten Start sofort bereit ist
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
  const light=!!T[2],row=(txt,yy,sz,c)=>{g.font=`900 ${sz}px ${F_DISP}`;
   if(light){g.save();g.lineJoin='round';g.lineWidth=Math.max(4,sz*.1);g.strokeStyle='#0a1210';g.shadowColor='#000';g.shadowBlur=8;g.globalAlpha=al*.85;g.strokeText(txt,lx,yy);g.restore()}   // heller Hintergrund: dunkler Rand + weicher Schatten
   for(const[blur,a,cc]of(light?[[40,.5,c],[18,.65,c],[0,.92,c],[0,.47,'#ffffff']]:[[40,.5,c],[18,.65,c],[0,.55,'#ffffff']])){g.shadowColor=c;g.shadowBlur=blur;g.globalAlpha=al*a*pu;g.fillStyle=cc;g.fillText(txt,lx,yy)}
   g.shadowBlur=0;g.globalAlpha=al*.5;g.strokeStyle=c;g.lineWidth=1.5;g.strokeText(txt,lx,yy)};
  row(T[0],y,size,col);row(T[1],y+size*.78,size*.58,col2);g.restore()}
 // Kurzvideo als Rahmen-Feld (16:9) zeichnen
 vidPanel(g,v,x,y,w,h,col,al,flash){g.save();g.globalAlpha=al;g.shadowColor=col;g.shadowBlur=24;g.fillStyle='#000';this.hud.kChamfer(g,x,y,w,h,12);g.fill();g.shadowBlur=0;g.save();g.clip();
  try{if(v)g.drawImage(v,x,y,w,h)}catch(e){}g.restore();g.strokeStyle=col;g.lineWidth=1.4;this.hud.kChamfer(g,x,y,w,h,12);g.stroke();g.strokeStyle='#4a4c9a';g.lineWidth=1;this.hud.kChamfer(g,x-5,y-5,w+10,h+10,15);g.stroke();
  if(flash>0){g.globalAlpha=al*Math.min(.92,flash*.55);g.fillStyle='#fff';this.hud.kChamfer(g,x,y,w,h,12);g.fill()}g.restore()}
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
  hud.fam(F_TECH,()=>{g.save();g.globalCompositeOperation='lighter';hud.fancy(g,'H!TisOP',W/2-2,64,40,['#7fe8ff','#7fe8ff'],'center',null,t,false,true,900,4);g.restore();
   hud.fancy(g,'H!TisOP',W/2+2,64,40,['#b98bff','#b98bff'],'center',null,t,false,true,900,4);
   hud.fancy(g,'H!TisOP',W/2,64,40,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,4)});
  hud.kSub(g,'WÄHLE DEINEN KÄMPFER',W/2,88,13,'#9fe8ff',4,t);
  const slots=[...ROSTER,'custom'],N=slots.length,cur=arcade.cursor;
  this.carousel(g,slots,cur,arcade,t);
  this.profile(g,slots[cur],arcade,t,W);
  if(this.ln){const ln=this.ln;
   // Übergangsvideo: füllt den ganzen Bildschirm, bleibt am Ende auf dem letzten Frame stehen
   if(ln.vid&&ln.vid.paused&&!ln.vid.ended&&ln.vid.readyState>=2){try{ln.vid.play()}catch(e){}}
   if(this.vidReady(ln.vid)){g.save();g.globalAlpha=Math.min(1,ln.t/10);g.fillStyle='#000';g.fillRect(0,0,W,H);const k=Math.min(W/16,H/9),w=16*k,h=9*k;try{g.drawImage(ln.vid,(W-w)/2,(H-h)/2,w,h)}catch(e){}
    if(ln.flash>0){g.globalAlpha=Math.min(.92,ln.flash*.55);g.fillStyle='#fff';g.fillRect(0,0,W,H)}g.restore()}
   if(this.vidReady(ln.vid))this.vidText(g,ln.id,56,H-100,76,ln.col,Math.min(1,Math.max(0,(ln.t-15)/20)),t);
   this.stepLaunch(t,CAR.cx);if(this.fw)this.fw.draw(g)}
  this._lt=t;
  this.foot(g,arcade,t,W,slots[cur]==='custom'&&!CHARACTERS.custom?'ENTER / KLICK – FIGUR ERSTELLEN':'ENTER / J / KLICK – KÄMPFEN',!!CHARACTERS.custom)}

 // Rondell: Position rp (Kommazahl) gleitet zum Cursor, dabei immer über den kürzesten Weg (auch über das Listenende hinweg).
 // Platz d = Abstand zur Mitte (-1 links, 0 Mitte, +1 rechts); Figuren weiter außen blenden aus.
 carousel(g,slots,cur,arcade,t){const hud=this.hud,N=slots.length,dt=this._rt==null?9:Math.min(6,Math.max(0,t-this._rt));this._rt=t;
  if(this.rp==null||!isFinite(this.rp))this.rp=cur;
  let df=((cur-this.rp)%N+N)%N;if(df>N/2)df-=N;   // kürzeste Richtung zum Ziel
  this.rp+=Math.abs(df)<.002?df:df*(1-Math.exp(-dt*.24));this.rp=((this.rp%N)+N)%N;
  const items=[];
  for(let i=0;i<N;i++){let d=((i-this.rp)%N+N)%N;if(d>N/2)d-=N;if(Math.abs(d)<=1.7)items.push({i,d})}
  items.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));   // äußere zuerst, die Mitte liegt oben
  const lerp=(a,b,k)=>a+(b-a)*k;
  for(const{i,d}of items){const id=slots[i],ch=CHARACTERS[id],ad=Math.min(1,Math.abs(d)),sel=Math.abs(d)<.5,cx=CAR.cx+d*CAR.spacing,base=lerp(CAR.base,CAR.sideBase,ad),
    fade=Math.abs(d)>1?Math.max(0,1-(Math.abs(d)-1)/.7):1,col=ch?ch.glow||'#fff':'#3fe0ff';
   g.save();g.globalAlpha=(this.ln?(i===cur?1:.18):lerp(1,.5,ad))*fade;
   // Bodenlicht (Mitte groß, Seiten klein)
   const rw=lerp(86,42,ad),gl=g.createRadialGradient(cx,base+4,2,cx,base+4,rw);gl.addColorStop(0,col+(ad<.5?'aa':'33'));gl.addColorStop(1,'#0000');g.fillStyle=gl;g.beginPath();g.ellipse(cx,base+4,rw,rw*.22,0,0,7);g.fill();
   if(ch){const f=this.fake(id,t/2),s=lerp(CAR.sc,CAR.scSide,ad)*(FIG[id]||1);f.skin=arcade.skinOf(id);f.x=cx;f.y=base;g.save();g.translate(cx,base);g.scale(s,s);g.translate(-cx,-base);drawFighter(g,f,t/60,1,base);g.restore()}
   else{const k=lerp(1.8,1,ad);g.strokeStyle=col;g.lineWidth=3*k;g.lineCap='round';g.beginPath();g.moveTo(cx-16*k,base-50*k);g.lineTo(cx+16*k,base-50*k);g.moveTo(cx,base-66*k);g.lineTo(cx,base-34*k);g.stroke()}
   const nm=ch?ch.name:'EIGENE FIGUR',nsz=lerp(28,16,ad);
   hud.fam(F_DISP,()=>hud.fancy(g,nm,cx,base+lerp(34,22,ad),nsz,sel?['#ffffff',col]:['#cfc6ee','#a79bd6'],'center',sel?col:null,t,false,false,400,1));
   if(ch&&sel)this.skinDots(g,ch,arcade.skinOf(id),cx,base+52,true);
   if(ch&&ch.custom&&sel){const e=editRect();hud.kPlate(g,e.x,e.y,e.w-6,e.h,{col,on:true,sk:5,t});hud.txt(g,'✎ EDIT',e.x+e.w/2-1,e.y+13,10,'#fff','center')}
   g.restore()}
  // Pfeile links/rechts neben dem Namen der Mitte
  if(!this.ln){const pu=.5+.5*Math.sin(t*.14);g.save();g.fillStyle='#9fe8ff';g.shadowColor='#7fe8ff';g.shadowBlur=10;g.globalAlpha=.6+.4*pu;
   for(const sgn of[-1,1]){const x=CAR.cx+sgn*(92+pu*4),y=CAR.base+26;g.beginPath();g.moveTo(x+sgn*9,y);g.lineTo(x-sgn*6,y-11);g.lineTo(x-sgn*6,y+11);g.closePath();g.fill()}g.restore();
   // Positionspunkte unter dem Rondell
   g.save();for(let k=0;k<N;k++){const on=k===cur;g.globalAlpha=on?1:.4;g.fillStyle=on?'#ffffff':'#8f95d8';g.beginPath();g.arc(CAR.cx+(k-(N-1)/2)*16,CAR.base+82+0,on?4:3,0,7);g.fill()}g.restore()}}

 // Profil rechts: Porträt, Name, Kurzbeschreibung, Werte, Stärken/Schwächen, Arcade-Gegner
 profile(g,id,arcade,t,W){const hud=this.hud,ch=CHARACTERS[id],col=ch?ch.glow||'#fff':'#3fe0ff';
  g.save();
  // zarte Fläche statt Rahmen
  const bg=g.createLinearGradient(PX-20,0,PX+PW+20,0);bg.addColorStop(0,'#0a061800');bg.addColorStop(.12,'#0a0618cc');bg.addColorStop(1,'#0a0618cc');g.fillStyle=bg;g.fillRect(PX-20,104,PW+50,396);
  hud.kVRule(g,PX,112,492,col,.9);
  if(!ch){   // leerer Slot
   hud.fam(F_DISP,()=>hud.fancy(g,'EIGENE FIGUR',PX+16,162,40,['#ffffff',col],'left',col,t,false,false,400,2));
   this.wrap(g,'Lade deine Sprite-Sheets hoch, stelle Name, Moves und Werte ein und kämpfe mit deinem eigenen Charakter.',14,PW-30).forEach((l,k)=>hud.txt(g,l,PX+16,198+k*20,14,TXT,'left'));
   hud.txt(g,'Es reicht ein einziges Sheet (Idle); alles andere kannst du nach und nach ergänzen.',PX+16,262,12,DIM,'left');g.restore();return}
  // Porträt
  const py=116,ps=150,ph=170,pcx=PX+16+ps/2,pcy=py+ph/2;
  const pg=g.createRadialGradient(pcx,pcy+30,6,pcx,pcy+30,ps*.8);pg.addColorStop(0,col+'55');pg.addColorStop(1,'#0000');g.fillStyle=pg;g.fillRect(PX+8,py-6,ps+16,ph+12);hud.kBrackets(g,PX+8,py-4,ps+16,ph+8,12,col,.85);
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
   hud.kBar(g,bx+lw,y-5,bw,8,v,col,t,5);
   hud.lab(g,String(val),bx+lw+bw+10,y+4,12,'#fff','left',1,null,'700')});
  // Stärken / Schwächen
  let y=by+4*22+10;
  const block=(sign,txt,c)=>{if(!txt)return;const lines=this.wrap(g,txt,13,PW-16-30);hud.lab(g,sign,bx,y,14,c,'left',0,null,'800');lines.forEach((l,k)=>hud.txt(g,l,bx+22,y+k*17,13,c,'left'));y+=lines.length*17+6};
  block('+',ch.pros,'#9fe8ff');block('–',ch.cons,'#c9b8ff');
  // Arcade-Gegner
  if(arcade.mode==='story'){y=Math.max(y+8,440);const c=CHAPTERS[arcade.chapter-1];   // Story: Kapitelinfo statt Arcade-Gegnerliste
   hud.lab(g,'STORY – KAPITEL '+c.id,bx,y,11,DIM,'left',2,null,'700');hud.txt(g,c.name,bx,y+24,16,'#ffffff','left',c.look.acc);
   hud.txt(g,c.enc.length-1+' Wellen · Boss: '+CHARACTERS[c.enc[c.enc.length-1].boss===1?'mantisAlpha':c.enc[c.enc.length-1].boss].name,bx,y+44,12,'#c9d0ff','left')}
  else{const lad=Arcade.ladderFor(ch.id);y=Math.max(y+8,440);
   hud.lab(g,'ARCADE – DEINE GEGNER',bx,y,11,DIM,'left',2,null,'700');
   const cw=(PW-16-6*(lad.length-1))/lad.length;
   lad.forEach((gid,k)=>{const gc=CHARACTERS[gid],x=bx+k*(cw+6);
    hud.lab(g,`${k+1}`,x,y+22,11,DIM,'left',0,null,'800');
    hud.fam(F_DISP,()=>hud.fancy(g,gid===BOSS&&!ROSTER.includes(BOSS)?'???':gc.name,x+14,y+23,15,['#ffffff','#bfb0ff'],'left',null,t,false,true,400,.5))})}
  g.restore()}

 skinDots(g,ch,cur,cx,y,sel){const n=skinCount(ch.sprites);if(n<2)return;   // kleine Farbpunkte unter dem Namen, aktive Farbe mit Ring
  g.save();for(let k=0;k<n;k++){const x=cx+(k-(n-1)/2)*16;const own=ownsSkin(ch.sprites,k);g.globalAlpha=own?1:.28;g.fillStyle=own?SKINS[ch.sprites][k].col:'#6a6f9a';g.beginPath();g.arc(x,y,k===cur?4.5:3.2,0,7);g.fill();g.globalAlpha=1;   // noch nicht freigeschaltete Farben (Booster): blass, grau
   if(k===cur){g.strokeStyle=sel?'#fff':'#ffffffaa';g.lineWidth=1.5;g.beginPath();g.arc(x,y,7,0,7);g.stroke()}}g.restore()}
 foot(g,arcade,t,W,label,hasCustom){const hud=this.hud,d=arcade.difficulty;
  {const id=[...ROSTER,'custom'][arcade.cursor],ch=CHARACTERS[id];if(ch&&skinCount(ch.sprites)>1)hud.lab(g,'C = FARBE: '+skinName(ch.sprites,arcade.skinOf(id)),W-24,516,10,'#d6c8ff','right',2,null,'700')}
  if(!this.ln&&Math.sin(t*.14)>-.4)hud.fam(F_DISP,()=>hud.fancy(g,label,34,496,24,['#ffffff','#9fe8ff'],'left','#8f7bff',t,false,false,400,2));
  hud.lab(g,'◀ ▶  KÄMPFER',34,516,11,DIM,'left',2,null,'700');hud.lab(g,'▲ ▼  SCHWIERIGKEIT',34,532,11,DIM,'left',2,null,'700');hud.lab(g,DIFF[d],190,532,11,DCOL[d],'left',2,DCOL[d],'800');
  if(hasCustom)hud.lab(g,'E = EIGENE FIGUR BEARBEITEN',W-24,532,10,'#7d6fb0','right',2,null,'600');
  if(arcade.mode==='story'){const c=CHAPTERS[arcade.chapter-1],nx=CHAPTERS[arcade.chapter],lock=nx&&!arcade.chapterOpen(arcade.chapter+1);   // Kapitelwahl (K / Klick): Kapitel 2+ erst nach Abschluss des Vorgängers
   hud.lab(g,'K = KAPITEL '+arcade.chapter+':  '+c.name,W-24,500,12,'#7dff9a','right',2,'#7dff9a','800');
   if(lock)hud.lab(g,'KAPITEL '+(arcade.chapter+1)+' GESPERRT – schließe Kapitel '+arcade.chapter+' ab',W-24,480,10,'#7d6fb0','right',2,null,'600')}}
 modePill(g,A,t){const m=MODE_PILL,hud=this.hud,k=['arcade','story','versus','melee'].indexOf(A.mode),cols=[P1C,'#7dff9a',P2C,'#8f7bff'],sw=m.w/4;
  ['ARCADE','STORY','2 SPIELER','MELEE'].forEach((n,i)=>{const on=i===k,x=m.x+i*sw+(i?3:0),w=sw-6;hud.kPlate(g,x,m.y,w,m.h,{col:cols[i],on,sk:9,t});hud.txt(g,n,x+w/2+4,m.y+18,13,on?'#ffffff':DIM,'center',on?cols[i]:null)});
  hud.txt(g,'TAB = Modus wechseln',m.x+6,m.y+m.h+14,10,'#7d86c8','left')}
 title(g,t,W,sub,col='#9fe8ff'){const hud=this.hud;
  hud.fam(F_TECH,()=>{g.save();g.globalCompositeOperation='lighter';hud.fancy(g,'H!TisOP',W/2-2,64,40,['#7fe8ff','#7fe8ff'],'center',null,t,false,true,900,4);g.restore();
   hud.fancy(g,'H!TisOP',W/2+2,64,40,['#b98bff','#b98bff'],'center',null,t,false,true,900,4);
   hud.fancy(g,'H!TisOP',W/2,64,40,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,4)});
  hud.kSub(g,sub,W/2,88,13,col,4,t)}
 // ---- 2-Spieler-Modus: Kämpferwahl (zwei Cursor) ----
 drawVs(g,A,t,W,H){const hud=this.hud,v=A.vs,M=A.mode==='melee';this.modePill(g,A,t);
  if(v.step===1)return this.drawStagePick(g,A,t,W,H);
  this.title(g,t,W,M?'MELEE – WÄHLT EURE KÄMPFER':'2 SPIELER – WÄHLT EURE KÄMPFER',M?'#bfe9ff':undefined);
  if(M)this.meleeOpts(g,A,t,W);
  const slots=Arcade.slotIds();
  this.vsRondell(g,A,t,1,slots);this.vsRondell(g,A,t,2,slots);
  g.save();g.globalAlpha=.5;hud.kRule(g,30,488,302,'#4a4c9a','r',.9);g.restore();
  // Profil rechts wie im Arcade-Menü, je Spieler ein Block
  g.save();const bg=g.createLinearGradient(PX-20,0,PX+PW+20,0);bg.addColorStop(0,'#0a061800');bg.addColorStop(.12,'#0a0618cc');bg.addColorStop(1,'#0a0618cc');g.fillStyle=bg;g.fillRect(PX-20,104,PW+50,396);
  hud.kVRule(g,PX,112,292,P1C,.9);hud.kVRule(g,PX,312,492,P2C,.9);
  hud.kRule(g,PX+8,PX+PW-8,302,'#4a4c9a','r',.9);g.restore();
  this.vsProfile(g,A,t,1,slots[v.c1],104,P1C,M);this.vsProfile(g,A,t,2,slots[v.c2],304,P2C,M);
  // Fuß: Wartehinweis + Steuerung
  const one=v.locked[0]!==v.locked[1];if(one&&Math.sin(t*.14)>-.4)hud.fam(F_DISP,()=>hud.fancy(g,`WARTE AUF SPIELER ${v.locked[0]?2:1}`,34,496,22,['#ffffff','#9fe8ff'],'left','#8f7bff',t,false,false,400,2));
  hud.txt(g,'P1:  A / D wählen · C Farbe · G bestätigen',34,516,11,P1C,'left');
  hud.txt(g,M&&A.cpu?'CPU (P2):  ◀ / ▶ wählt den Gegner · ENTER bestätigen':'P2:  ◀ / ▶ wählen · L Farbe · ENTER bestätigen',34,532,11,P2C,'left');
  hud.lab(g,'ESC = ZURÜCK',W-24,516,10,'#7d6fb0','right',2,null,'600')}
 // Ein Rondell im 2-Spieler-/Melee-Menü (pl = 1 oben, 2 unten): gleiche Logik wie carousel(), kleiner, mit Spielerfarbe, Name-Tag und ✔ bei Bestätigung
 vsRondell(g,A,t,pl,slots){const hud=this.hud,v=A.vs,N=slots.length,cur=pl===1?v.c1:v.c2,lk=v.locked[pl-1],pc=pl===1?P1C:P2C,y0=vsY0(pl),base0=y0+132,sideB=y0+122,
   dt=this._vt&&this._vt[pl]!=null?Math.min(6,Math.max(0,t-this._vt[pl])):9;(this._vt=this._vt||{})[pl]=t;
  this.vrp=this.vrp||{};if(this.vrp[pl]==null||!isFinite(this.vrp[pl]))this.vrp[pl]=cur;
  let df=((cur-this.vrp[pl])%N+N)%N;if(df>N/2)df-=N;
  this.vrp[pl]+=Math.abs(df)<.002?df:df*(1-Math.exp(-dt*.24));this.vrp[pl]=((this.vrp[pl]%N)+N)%N;
  const items=[];for(let i=0;i<N;i++){let d=((i-this.vrp[pl])%N+N)%N;if(d>N/2)d-=N;if(Math.abs(d)<=1.7)items.push({i,d})}
  items.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  const lerp=(a,b,k)=>a+(b-a)*k;
  for(const{i,d}of items){const id=slots[i],ch=CHARACTERS[id],ad=Math.min(1,Math.abs(d)),sel=Math.abs(d)<.5,cx=VCAR.cx+d*VCAR.spacing,base=lerp(base0,sideB,ad),
    fade=Math.abs(d)>1?Math.max(0,1-(Math.abs(d)-1)/.7):1,col=sel?pc:(ch.glow||'#fff');
   g.save();g.globalAlpha=lerp(1,.5,ad)*fade;
   const rw=lerp(66,34,ad),gl=g.createRadialGradient(cx,base+4,2,cx,base+4,rw);gl.addColorStop(0,col+(ad<.5?'aa':'33'));gl.addColorStop(1,'#0000');g.fillStyle=gl;g.beginPath();g.ellipse(cx,base+4,rw,rw*.22,0,0,7);g.fill();
   const f=this.fake(id,t/2),sc=lerp(VCAR.sc,VCAR.scSide,ad)*(FIG[id]||1);f.skin=sel?A.vsSkinOf(pl):0;f.x=cx;f.y=base;g.save();g.translate(cx,base);g.scale(sc,sc);g.translate(-cx,-base);drawFighter(g,f,t/60,1,base);g.restore();
   hud.fam(F_DISP,()=>hud.fancy(g,ch.name,cx,base+lerp(26,18,ad),lerp(22,13,ad),sel?['#ffffff',pc]:['#cfc6ee','#a79bd6'],'center',sel?pc:null,t,false,false,400,1));
   if(sel)this.skinDots(g,ch,A.vsSkinOf(pl),cx,base+42,true);
   g.restore()}
  // Tag + Pfeile (Pfeile weg, sobald bestätigt)
  const lab=(A.mode==='melee'&&A.cpu&&pl===2)?'CPU':'P'+pl;
  hud.fancy(g,'▼ '+lab+(lk?' ✔':''),VCAR.cx,y0+30,18,['#fff',pc],'center',pc,t);
  if(!lk){const pu=.5+.5*Math.sin(t*.14);g.save();g.fillStyle=pc;g.shadowColor=pc;g.shadowBlur=8;g.globalAlpha=.6+.4*pu;
   for(const sgn of[-1,1]){const x=VCAR.cx+sgn*(78+pu*3),y=base0+22;g.beginPath();g.moveTo(x+sgn*8,y);g.lineTo(x-sgn*5,y-9);g.lineTo(x-sgn*5,y+9);g.closePath();g.fill()}g.restore()}}

 // Ein Spieler-Block im 2P-/Melee-Menü: Porträt, Name, Beschreibung, Balken, Stärken/Schwächen (wie das Arcade-Profil, nur kompakter)
 vsProfile(g,A,t,pl,id,y0,pc,M){const hud=this.hud,ch=CHARACTERS[id],col=ch.glow||'#fff',lk=A.vs.locked[pl-1];
  const ps=92,ph=104,px=PX+14,py=y0+10,pcx=px+ps/2,pcy=py+ph/2;
  g.save();const pg=g.createRadialGradient(pcx,pcy+24,5,pcx,pcy+24,ps*.8);pg.addColorStop(0,col+'55');pg.addColorStop(1,'#0000');g.fillStyle=pg;g.fillRect(px-8,py-6,ps+16,ph+12);
  if(!drawFullFrame(g,ch,px,py,ps,ph,A.vsSkinOf(pl))){g.fillStyle=col;g.font=`900 60px ${F_TECH}`;g.textAlign='center';g.fillText(ch.name[0],pcx,pcy+20)}
  g.restore();
  const tx=px+ps+16,rw=PX+PW-8;
  hud.lab(g,(M&&A.cpu&&pl===2?'CPU':`SPIELER ${pl}`)+(skinCount(ch.sprites)>1?'  ·  '+skinName(ch.sprites,A.vsSkinOf(pl)).toUpperCase():''),tx,y0+20,11,pc,'left',2,pc,'800');
  hud.txt(g,lk?'✔ BEREIT':'wählt …',rw,y0+20,12,lk?'#9fe8ff':DIM,'right');
  hud.fam(F_DISP,()=>hud.fancy(g,ch.name,tx,y0+54,32,['#ffffff',col],'left',col,t,false,false,400,2));
  const parts=ch.desc.split(' · ');hud.lab(g,parts[0].toUpperCase(),tx,y0+74,11,TXT,'left',2,null,'700');if(parts[1])hud.lab(g,parts[1].toUpperCase(),tx,y0+90,11,col,'left',2,null,'700');
  const all=[['LEBEN',ch.hp,(ch.hp-700)/(1500-700)],['TEMPO',Math.round(ch.walk*100)+'%',ch.walk/1.4],['SCHADEN',Math.round(ch.dmg*100)+'%',ch.dmg/1.3],['ABWEHR',Math.round(100/(ch.def||1))+'%',(1/(ch.def||1))/1.3]];
  const bars=M?all.slice(1):all,by=y0+(M?112:106),lw=72,bw=PW-(tx-PX)-lw-56,st=M?18:15;
  bars.forEach(([lab,val,vv],k)=>{const y=by+k*st;vv=Math.max(.04,Math.min(1,vv));
   hud.lab(g,lab,tx,y+4,10,DIM,'left',2,null,'700');hud.kBar(g,tx+lw,y-4,bw,7,vv,col,t,4);
   hud.lab(g,String(val),tx+lw+bw+8,y+4,11,'#fff','left',1,null,'700')});
  const fit=(txt)=>{let q=String(txt||'');while(q.length>3&&hud.mw(g,q,11)>PW-16-24)q=q.slice(0,-2);return q===String(txt||'')?q:q.trimEnd()+'…'};
  const sy=y0+174;
  if(ch.pros){hud.lab(g,'+',px,sy,13,'#9fe8ff','left',0,null,'800');hud.txt(g,fit(ch.pros),px+16,sy,11,'#9fe8ff','left')}
  if(ch.cons){hud.lab(g,'–',px,sy+15,13,'#c9b8ff','left',0,null,'800');hud.txt(g,fit(ch.cons),px+16,sy+15,11,'#c9b8ff','left')}}
 // Melee-Optionen (rechts oben, klickbar): Spieler 2 = Mensch/CPU (B), CPU-Stärke (▲▼ bzw. Klick), Stocks (T)
 meleeOpts(g,A,t,W){const hud=this.hud,c='#bfe9ff',on='#9fe8ff';
  const row=(i,txt,col,hot)=>{const r=MELEE_OPTS[i],w=r.w-8;hud.kPlate(g,r.x,r.y,w,r.h,{col,on:hot,sk:8,t});hud.txt(g,txt,r.x+w/2+4,r.y+r.h-7,13,col,'center')};
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
   g.fillStyle=gr;hud.kChamfer(g,r.x,r.y,r.w,r.h,14);g.fill();g.shadowBlur=0;g.save();hud.kChamfer(g,r.x,r.y,r.w,r.h,14);g.clip();
   if(T){g.fillStyle=T.moon[0]+'88';g.beginPath();g.arc(cx+30,r.y+70,26,0,7);g.fill();g.fillStyle='#00000066';for(let k=0;k<7;k++){const bh=26+((k*37)%34);g.fillRect(r.x+8+k*23,r.y+r.h-70-bh,19,bh+20)}g.fillStyle=T.floor[0];g.fillRect(r.x,r.y+r.h-58,r.w,58);g.strokeStyle=T.line;g.lineWidth=2;g.beginPath();g.moveTo(r.x,r.y+r.h-58);g.lineTo(r.x+r.w,r.y+r.h-58);g.stroke()}
   else hud.fancy(g,'?',cx,r.y+r.h/2+20,72,['#ffffff','#8f7bff'],'center','#8f7bff',t);
   {const gl=g.createLinearGradient(0,r.y,0,r.y+r.h*.5);gl.addColorStop(0,'rgba(255,255,255,.3)');gl.addColorStop(1,'rgba(255,255,255,.02)');g.fillStyle=gl;g.fillRect(r.x,r.y,r.w,r.h*.5)}   // Glasglanz
   g.restore();g.save();g.strokeStyle=sel?'#eaf6ff':col;g.globalAlpha*=sel?1:.7;g.lineWidth=1.2;hud.kChamfer(g,r.x,r.y,r.w,r.h,14);g.stroke();if(sel){g.lineWidth=1;g.strokeStyle='#4a4c9a';hud.kChamfer(g,r.x-5,r.y-5,r.w+10,r.h+10,17);g.stroke()}g.restore();
   const lk=!A.stageOpen(i);if(lk){g.save();g.globalAlpha=.62;g.fillStyle='#04020a';hud.kChamfer(g,r.x,r.y,r.w,r.h,14);g.fill();g.restore();hud.fancy(g,'GESPERRT',cx,r.y+r.h/2+8,20,['#ffffff','#8f7bff'],'center','#8f7bff',t)}
   hud.fancy(g,T?T.name:'ZUFALL',cx,r.y+r.h-30,T?17:20,['#ffffff',col],'center',col,t,true);hud.txt(g,lk?'per Booster freischalten':T?T.desc:'neu bei jeder Revanche',cx,r.y+r.h-12,11,lk?'#ffd23f':'#d6c8ff','center');g.restore()}
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
