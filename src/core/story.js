import{AIController}from'./ai.js';
import{CHARACTERS}from'./characters.js';
import{GROUND,H}from'./config.js';
import{Fighter}from'./fighter.js';
import{Game}from'./game.js';
import{addPack}from'./loot.js';

// Story-Modus: Seitenscroller-Level. Der Spieler läuft nach rechts; an festen Punkten (ENC) wird die Kamera gesperrt und Insektenkrieger
// (Mantis) springen in Gruppen von beiden Seiten herein. Erst wenn alle besiegt sind, geht es weiter (Checkpoint nach jeder Welle).
// Rein logisch (kein DOM) -> headless testbar. Werte hier justierbar.
export const LV={x0:-800,x1:1900,start:-700,half:560};   // Levelgrenzen, Startpunkt, halbe Breite des gesperrten Kampffelds
export const ENC=[
 {x:-300,n:2,title:'ERSTE WELLE',say:'Etwas raschelt zwischen den Häusern …'},
 {x:150,n:3,title:'ZWEITE WELLE',say:'Es werden immer mehr.'},
 {x:600,n:4,title:'DRITTE WELLE',say:'Der Schwarm hat dich eingekreist!'},
 {x:1000,n:5,title:'VIERTE WELLE',say:'Sie greifen von beiden Seiten an – bleib in Bewegung!'},
 {x:1380,n:4,boss:1,title:'DER ALPHA',say:'Der Anführer des Schwarms steigt herab.'}];
// KI für Schwarm-Gegner: nur die nächsten 2-3 greifen an, der Rest kreist in Abstand (sonst Dauer-Überzahl)
export class MobAI extends AIController{
 tick(me,opp,game){const st=game.story;
  if(st&&game.phase==='fight'&&['idle','walk','crouch'].includes(me.state)&&!st.att.includes(me)){
   const d=opp.x-me.x,fwd=d>=0?1:-1,dist=Math.abs(d),want=250+(me.id%3)*50;
   this.feed(dist>want+40?fwd:dist<want-60?-fwd:0,0,[],game.hitstop>0);return}
  super.tick(me,opp,game)}}
export class Story{
 constructor(game,{ai=0}={}){this.g=game;this.lvl=[0,1,1,2][Math.max(0,Math.min(3,ai|0))];this.cp=0;this.kills=0;this.att=[];this.mobs=[];this.l=LV.x0;this.r=LV.x1}
 get total(){return ENC.length}
 alive(){return this.mobs.filter(m=>m.state!=='ko')}
 nearest(f){let b=null,bd=1e9;for(const m of this.alive()){const d=Math.abs(m.x-f.x);if(d<bd){bd=d;b=m}}return b}
 pairs(){const p=this.g.p1,o=[];for(const m of this.alive()){o.push([p,m],[m,p])}return o}
 // Start / Neustart (Game.startRound): am letzten Checkpoint
 begin(){const g=this.g,p=g.p1;this.mobs=[];this.items=[];g.fighters=[p];this.queue=[];this.state='walk';this.enc=this.cp;this.ft=0;this.sd=0;this.goT=0;this.doneT=0;this.msg=null;this.att=[];
  p.x=this.cp?ENC[this.cp-1].x+140:LV.start;p.facing=1;this.setBounds(LV.x0,LV.x1)}
 setBounds(l,r){this.l=l;this.r=r;this.g.arena.setOpen(l,r)}
 engage(e){this.state='fight';this.setBounds(Math.max(LV.x0,e.x-LV.half),Math.min(LV.x1,e.x+LV.half));
  this.queue=[];for(let i=0;i<e.n;i++)this.queue.push({side:i%2?-1:1,elite:false});
  if(e.boss)this.queue.splice(2,0,{side:1,elite:true});
  this.cap=Math.min(5,2+this.enc);this.sd=30;this.msg={t:170,title:e.title,say:e.say};this.g.sfx('ui_round_start',{vol:.7})}
 spawn(q){const g=this.g,c=CHARACTERS[q.elite?'mantisAlpha':'mantis'];
  const f=new Fighter({char:c,x:q.side<0?this.l+40:this.r-40,facing:-q.side,input:new MobAI(this.lvl)});
  const k=[.8,1,1.2][Math.min(2,this.lvl)];f.maxHp=f.hp=Math.round(c.hp*k);f.y=GROUND-420+Math.random()*60;f.vy=0;f.state='air';f.airJumps=0;
  this.mobs.push(f);g.fighters.push(f);g.fx.ps.ring(f.x,GROUND-200,c.glow,120);g.sfx('whoosh_heavy',{vol:.5,rate:1.2})}
 clear(){const g=this.g,p=g.p1;this.cp=this.enc+1;this.enc++;this.drop(p.x+(p.facing>0?140:-140),.35);p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.3);p.meter=Math.min(300,p.meter+60);g.sfx('ui_round_start',{vol:.6,rate:1.3});
  if(this.enc>=ENC.length){this.state='done';this.doneT=0;this.msg={t:240,title:'SCHWARM BESIEGT',say:'Die Stadt ist sicher – vorerst.'};g.celeb={f:p,t:0};g.flash=10;g.flashColor='#ffffff'}
  else{this.state='walk';this.goT=0;this.setBounds(LV.x0,LV.x1);this.msg={t:130,title:'GESCHAFFT',say:'Weiter nach rechts ➜'}}}
 mobDown(v,a){const g=this.g;this.kills++;v.state='ko';v.sf=0;v.vy=-9;v.vx=a.facing*6;v.noGrav=false;v.move=null;v.koT=0;v.pop=false;
  g.fx.ps.ring(v.x,v.y-80,v.char.glow,130);g.sfx('fw_finale',{vol:.35,rate:1.3});g.shake=Math.max(g.shake,7);g.hitstop=Math.max(g.hitstop,9);g.camera.kick(.02);const hurt=g.p1.hp/g.p1.maxHp<.45;if(this.kills%3===0||Math.random()<.35)this.drop(v.x,.25,hurt||Math.random()<.5?'heal':'pack')}   // Gegner lassen Heilung ODER Booster fallen (bei wenig Leben immer Heilung)
 // Heilitem (Energiedrink): fällt aus Gegnern bzw. liegt nach jeder Welle bereit; Drüberlaufen = +25 % Leben
 drop(x,heal=.25,kind='heal'){this.items.push({kind,x:Math.max(this.l+30,Math.min(this.r-30,x)),y:GROUND-120,vy:-6,heal,age:0})}
 pickups(){const g=this.g,p=g.p1;for(const it of this.items){it.age++;it.vy+=.5;it.y=Math.min(GROUND-14,it.y+it.vy);if(it.y>=GROUND-14)it.vy=0;
  if(p.hp>0&&Math.abs(p.x-it.x)<42&&p.y>GROUND-70&&it.y>=GROUND-14){it.got=true;g.sfx('ui_round_start',{vol:.5,rate:1.6});
   if(it.kind==='pack'){addPack();g.fx.ps.ring(it.x,GROUND-40,'#ffd23f',110);g.pop(it.x,GROUND-130,'+1 BOOSTER','#ffd23f',1.1,{text:true})}
   else{const h=Math.round(p.maxHp*it.heal);p.hp=Math.min(p.maxHp,p.hp+h);g.fx.ps.ring(it.x,GROUND-40,'#7dff9a',110);g.pop(it.x,GROUND-130,'+'+h,'#7dff9a',1.2)}}}
  this.items=this.items.filter(i=>!i.got&&i.age<1800)}
 update(){const g=this.g,p=g.p1;this.ft++;this.pickups();
  for(const m of this.mobs)if(m.state==='ko')m.koT=(m.koT||0)+1;
  const gone=this.mobs.filter(m=>m.state==='ko'&&m.koT>80);
  if(gone.length){this.mobs=this.mobs.filter(m=>!gone.includes(m));g.fighters=g.fighters.filter(f=>!gone.includes(f))}
  const al=this.alive().sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
  this.att=al.slice(0,this.enc<2?1:al.length>5?3:2).concat(al.filter(m=>m.char.id==='mantisAlpha'));
  if(this.msg&&--this.msg.t<=0)this.msg=null;
  if(this.state==='walk'){this.goT++;const e=ENC[this.enc];if(e&&p.x>=e.x-20)this.engage(e)}
  else if(this.state==='fight'){
   if(this.queue.length&&al.length<this.cap&&--this.sd<=0){this.spawn(this.queue.shift());this.sd=70}
   if(!this.queue.length&&!al.length)this.clear()}
  else if(this.state==='done')this.doneT++}
 // Körper nicht übereinanderlaufen (Spieler + Mantis)
 separate(){const fs=[this.g.p1,...this.alive()];
  for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){const a=fs[i],b=fs[j];if(Math.abs(a.y-b.y)>90||a.state==='knockdown'||b.state==='knockdown')continue;
   const d=b.x-a.x,ad=Math.abs(d);if(ad>=48)continue;const s=d>0?1:d<0?-1:(a.id%2?1:-1),push=(48-ad)/2;a.x-=s*push;b.x+=s*push}
  for(const f of fs)f.x=Math.max(this.l,Math.min(this.r,f.x))}
}
