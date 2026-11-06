import{CHARACTERS,ROSTER,BOSS}from'../core/characters.js';
import{Arcade}from'../core/arcade.js';
import{drawFighter}from'./rig.js';
import{F_TECH}from'./fonts.js';
// Startmenü: Charakterwahl (4 Karten mit animierten Idle-Figuren), Arcade-Leiter-Vorschau und Schwierigkeit.
export const CARD={w:196,h:268,gap:18,y:104};
// Bei 5 Karten (4 Kämpfer + Slot für die eigene Figur) etwas schmaler, damit alles in die 960 px passt
export const cardRect=(i,n=4)=>{const w=n>4?170:CARD.w,gap=n>4?14:CARD.gap,tot=n*w+(n-1)*gap,x0=(960-tot)/2;return{x:x0+i*(w+gap),y:CARD.y,w,h:CARD.h}};
// Klickfläche „✎ EDIT“ auf der Karte der eigenen Figur
export const editRect=r=>({x:r.x+r.w-56,y:r.y+8,w:48,h:20});
export function hitEdit(lx,ly,n=5){const r=editRect(cardRect(n-1,n));return lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h}
export function hitCard(lx,ly,n=4){for(let i=0;i<n;i++){const r=cardRect(i,n);if(lx>=r.x&&lx<=r.x+r.w&&ly>=r.y&&ly<=r.y+r.h)return i}return -1}
const DIFF=['LEICHT','NORMAL','HART'],DCOL=['#7dffc8','#ffe23f','#ff4a4a'];
export class SelectScreen{
 constructor(hud){this.hud=hud;this.fakes={}}
 fake(id,t){const ch=CHARACTERS[id],f=this.fakes[id]||(this.fakes[id]={x:0,y:0,facing:1,char:ch,anim:'idle',animU:0,sf:0,mf:0,move:null,state:'idle',trail:[],vx:0,vy:0});f.sf=t;f.char=ch;return f}
 draw(g,arcade,t,W,H){const hud=this.hud;
  hud.fam(F_TECH,()=>{const j=Math.sin(t*.05)*2+(t%240<5?(Math.random()-.5)*8:0);g.save();g.globalCompositeOperation='lighter';
   hud.fancy(g,'H!TisOP',W/2-3-j,68,54,['#00f3ff','#00f3ff'],'center',null,t,false,true,900,6);hud.fancy(g,'H!TisOP',W/2+3+j,68,54,['#ff2bd6','#ff2bd6'],'center',null,t,false,true,900,6);g.restore();
   hud.fancy(g,'H!TisOP',W/2,68,54,['#ffffff','#bfb0ff'],'center','#8f6bff',t,false,false,900,6)});
  hud.lab(g,'WÄHLE DEINEN KÄMPFER',W/2+4,92,15,'#9fe8ff','center',10,'#00f3ff','700');
  const slots=[...ROSTER,'custom'],N=slots.length;
  slots.forEach((id,i)=>{const ch=CHARACTERS[id],r=cardRect(i,N),sel=i===arcade.cursor,pulse=.5+.5*Math.sin(t*.12),cx=r.x+r.w/2,col=ch?ch.glow||'#fff':'#3fe0ff';
   if(!ch){this.emptyCard(g,r,sel,pulse,t,col);return}
   g.save();g.translate(cx,r.y+r.h/2);const sc=sel?1.05+.01*pulse:.97;g.scale(sc,sc);g.translate(-cx,-(r.y+r.h/2));g.globalAlpha=sel?1:.62;
   g.shadowColor=col;g.shadowBlur=sel?26+10*pulse:6;g.fillStyle='#0a0618ee';g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.fill();g.shadowBlur=0;
   const bg=g.createRadialGradient(cx,r.y+r.h-70,10,cx,r.y+r.h-70,150);bg.addColorStop(0,col+'44');bg.addColorStop(1,'#0000');g.fillStyle=bg;g.fillRect(r.x,r.y,r.w,r.h);
   g.strokeStyle=col;g.lineWidth=sel?4:2;g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.stroke();
   // Figur (animiert) im Kartenausschnitt
   g.save();g.beginPath();g.roundRect(r.x+2,r.y+2,r.w-4,r.h-4,10);g.clip();
   const f=this.fake(id,sel?t:Math.floor(t/3)),by=r.y+r.h-92,s=.82;f.x=cx;f.y=by;g.translate(cx,by);g.scale(s,s);g.translate(-cx,-by);
   g.fillStyle='#0008';g.beginPath();g.ellipse(cx,by+4,52,9,0,0,7);g.fill();drawFighter(g,f,t/60,1,by);g.restore();
   hud.fancy(g,ch.name,cx,r.y+r.h-52,N>4?19:21,['#ffffff',col],'center',col,t,true);
   const parts=ch.desc.split(' · ');hud.txt(g,parts[0],cx,r.y+r.h-32,12,'#d6c8ff','center');if(parts[1])hud.txt(g,parts[1],cx,r.y+r.h-17,11,'#9d8fd0','center');
   if(sel){hud.fancy(g,'▼',cx,r.y+24,18,['#fff',col],'center',col,t)}
   if(ch.custom){const e=editRect(r);g.fillStyle='#1b1240';g.strokeStyle=col;g.lineWidth=1.5;g.beginPath();g.roundRect(e.x,e.y,e.w,e.h,6);g.fill();g.stroke();hud.txt(g,'✎ EDIT',e.x+e.w/2,e.y+14,11,'#fff','center')}
   g.restore()});
  // Werte des gewählten Kämpfers
  const sel=CHARACTERS[slots[arcade.cursor]];
  if(!sel){hud.fancy(g,'DEINE EIGENE FIGUR',W/2,396,19,['#ffffff','#3fe0ff'],'center','#3fe0ff',t,false);
   hud.txt(g,'Lade deine Sprite-Sheets hoch, stelle Name, Moves und Werte ein – und kämpfe mit deinem eigenen Charakter.',W/2,420,13,'#d6c8ff','center');
   hud.txt(g,'Es reicht ein einziges Sheet (Idle); alles andere kannst du nach und nach ergänzen.',W/2,438,12,'#9d8fd0','center');
   this.foot(g,arcade,t,W,'ENTER / KLICK – FIGUR ERSTELLEN',false);return}
  hud.txt(g,`HP ${sel.hp}   ·   TEMPO ${Math.round(sel.walk*100)}%   ·   SCHADEN ${Math.round(sel.dmg*100)}%   ·   ABWEHR ${Math.round(100/(sel.def||1))}%`,W/2,386,13,'#d6c8ff','center');
  hud.txt(g,'+ '+(sel.pros||''),W/2,402,12,'#7dffc8','center');hud.txt(g,'– '+(sel.cons||''),W/2,417,12,'#ff9a9a','center');
  // Arcade-Leiter für den gewählten Kämpfer
  const lad=Arcade.ladderFor(sel.id),bw=150,gap=12,x0=(W-(lad.length*bw+(lad.length-1)*gap))/2,y=434;
  hud.txt(g,'ARCADE – DEINE GEGNER (je 2 Runden)',W/2,y+2,12,'#9d8fd0','center');
  lad.forEach((id,i)=>{const ch=CHARACTERS[id],x=x0+i*(bw+gap),boss=id===BOSS,col=boss?'#ff3a55':ch.glow||'#fff';
   g.save();g.shadowColor=col;g.shadowBlur=boss?10+6*Math.sin(t*.2)**2:4;g.fillStyle=boss?'#2a0610':'#0e0a20';g.strokeStyle=col;g.lineWidth=boss?2.5:1.5;g.beginPath();g.roundRect(x,y+10,bw,30,6);g.fill();g.stroke();g.restore();
   hud.txt(g,`${i+1}  ${boss?'BOSS  ':''}${ch.name}`,x+bw/2,y+31,13,boss?'#ffb0b8':'#fff','center')});
  this.foot(g,arcade,t,W,'ENTER / J / KLICK – KÄMPFEN',!!CHARACTERS.custom)}

 // Karte „Eigene Figur“ ohne Figur: gestrichelter Rahmen mit Plus
 emptyCard(g,r,sel,pulse,t,col){const hud=this.hud,cx=r.x+r.w/2,cy=r.y+r.h/2;
  g.save();g.globalAlpha=sel?1:.7;g.shadowColor=col;g.shadowBlur=sel?24+8*pulse:4;g.fillStyle='#0a0618ee';g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,12);g.fill();g.shadowBlur=0;
  g.strokeStyle=col;g.lineWidth=sel?3:2;g.setLineDash([9,7]);g.beginPath();g.roundRect(r.x+3,r.y+3,r.w-6,r.h-6,10);g.stroke();g.setLineDash([]);
  g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(cx-24,cy-30);g.lineTo(cx+24,cy-30);g.moveTo(cx,cy-54);g.lineTo(cx,cy-6);g.stroke();
  hud.fancy(g,'EIGENE FIGUR',cx,cy+26,19,['#ffffff',col],'center',col,t,true);
  hud.txt(g,'Lade deine Assets hoch',cx,cy+52,12,'#d6c8ff','center');hud.txt(g,'und spiele selbst damit',cx,cy+68,12,'#9d8fd0','center');
  if(sel)hud.fancy(g,'▼',cx,r.y+24,18,['#fff',col],'center',col,t);g.restore()}
 foot(g,arcade,t,W,label,hasCustom){const hud=this.hud,d=arcade.difficulty;
  hud.txt(g,'◀ ▶  Figur wählen      ▲ ▼  Schwierigkeit:',W/2-70,486,14,'#d6c8ff','center');hud.txt(g,DIFF[d],W/2+150,486,17,DCOL[d],'center',DCOL[d]);
  if(Math.sin(t*.14)>-.4)hud.fancy(g,label,W/2,516,22,['#ffe23f','#ff9a3f'],'center','#ffb347',t);
  if(hasCustom)hud.txt(g,'E = Eigene Figur bearbeiten',14,530,11,'#7d6fb0','left');
  hud.txt(g,'M = Menü (Steuerung & Moves)',W-14,530,11,'#7d6fb0','right')}
}
