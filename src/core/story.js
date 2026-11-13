import{AIController}from'./ai.js';
import{CHARACTERS}from'./characters.js';
import{EFFECT,GROUND,H}from'./config.js';
import{Fighter}from'./fighter.js';
import{Game}from'./game.js';
import{addPack}from'./loot.js';

// Story-Modus: Seitenscroller-Level. Der Spieler läuft nach rechts; an festen Punkten (ENC) wird die Kamera gesperrt und Insektenkrieger
// (Mantis) springen in Gruppen von beiden Seiten herein. Erst wenn alle besiegt sind, geht es weiter (Checkpoint nach jeder Welle).
// Rein logisch (kein DOM) -> headless testbar. Werte hier justierbar.
export const LV={x0:-800,x1:1900,start:-700,half:560};   // Levelgrenzen, Startpunkt, halbe Breite des gesperrten Kampffelds
// Kapitel: je eigene Wellen (enc), Level-Look (stage = Index in THEMES, ground/line/lamp für die Straße), Textbausteine und Wellen-Limit (capBase + Welle, max cap).
// enc-Felder: x = Auslöse-Position, n = Anzahl Mantis, boss = Boss-Figur (1 = Alpha-Mantis) und at = Platz in der Spawn-Reihenfolge (0 = zuerst).
export const CHAPTERS=[
 {id:1,name:'DER SCHWARM',stage:0,capBase:2,cap:5,look:{ground:['#14101f','#050309'],line:'#4a3b78',lamp:'255,210,120',acc:'#7dff9a'},
  intro:['Die Stadt schläft nicht mehr. Aus den Gassen kriechen Insektenkrieger.','Kämpfe dich durch das Viertel – sie kommen in Gruppen.'],
  win:{title:'SCHWARM BESIEGT',say:'Die Stadt ist sicher – vorerst.'},
  enc:[
   {x:-300,n:2,title:'ERSTE WELLE',say:'Etwas raschelt zwischen den Häusern …'},
   {x:150,n:3,title:'ZWEITE WELLE',say:'Es werden immer mehr.'},
   {x:600,n:4,title:'DRITTE WELLE',say:'Der Schwarm hat dich eingekreist!'},
   {x:1000,n:5,title:'VIERTE WELLE',say:'Sie greifen von beiden Seiten an – bleib in Bewegung!'},
   {x:1380,n:4,boss:1,title:'DER ALPHA',say:'Der Anführer des Schwarms steigt herab.'}]},
 {id:2,name:'DER DÄMON ERWACHT',stage:2,capBase:3,cap:6,look:{ground:['#0c2a22','#030a07'],line:'#52ffa8',lamp:'120,255,200',acc:'#ff6a7a'},
  intro:['Der Schwarm war nur der Vorbote. Im Hafen regt sich etwas viel Größeres.','Mehr Krieger, härtere Wellen – und am Ende wartet er.'],
  win:{title:'DÄMON BESIEGT',say:'Das Glühen im Hafen erlischt.'},
  enc:[
   {x:-300,n:4,title:'ERSTE WELLE',say:'Diesmal sind es gleich mehr.'},
   {x:150,n:5,title:'ZWEITE WELLE',say:'Aus den Containern kriechen sie hervor.'},
   {x:600,n:6,title:'DRITTE WELLE',say:'Der Schwarm ist gewachsen – lass dich nicht einkreisen!'},
   {x:1000,n:7,title:'VIERTE WELLE',say:'Sie kommen aus allen Richtungen. Der Boden bebt.'},
   {x:1380,n:2,boss:'cyberdemon',at:0,title:'CYBERDÄMON',say:'Rotes Glühen unter der Haut – der Dämon des Kerns.'}]}];
export const ENC=CHAPTERS[0].enc;   // Kapitel 1 (Rückwärtskompatibilität: Tests/HUD)
// KI für Schwarm-Gegner: nur die nächsten 2-3 greifen an, der Rest kreist in Abstand (sonst Dauer-Überzahl)
export class MobAI extends AIController{
 tick(me,opp,game){const st=game.story;
  if(st&&game.phase==='fight'&&['idle','walk','crouch'].includes(me.state)&&!st.att.includes(me)){
   const d=opp.x-me.x,fwd=d>=0?1:-1,dist=Math.abs(d),want=250+(me.id%3)*50;
   this.feed(dist>want+40?fwd:dist<want-60?-fwd:0,0,[],game.hitstop>0);return}
  super.tick(me,opp,game)}}
export class Story{
 constructor(game,{ai=0,chapter=1}={}){this.g=game;this.lvl=[0,1,1,2][Math.max(0,Math.min(3,ai|0))];this.ch=Math.max(1,Math.min(CHAPTERS.length,chapter|0||1));this.cfg=CHAPTERS[this.ch-1];this.encs=this.cfg.enc;this.rage=false;this.cp=0;this.kills=0;this.att=[];this.mobs=[];this.l=LV.x0;this.r=LV.x1}
 get total(){return this.encs.length}
 alive(){return this.mobs.filter(m=>m.state!=='ko')}
 nearest(f){let b=null,bd=1e9;for(const m of this.alive()){const d=Math.abs(m.x-f.x);if(d<bd){bd=d;b=m}}return b}
 pairs(){const p=this.g.p1,o=[];for(const m of this.alive()){o.push([p,m],[m,p])}return o}
 // Start / Neustart (Game.startRound): am letzten Checkpoint
 begin(){const g=this.g,p=g.p1;this.mobs=[];this.items=[];g.fighters=[p];this.queue=[];this.state='walk';this.enc=this.cp;this.ft=0;this.sd=0;this.goT=0;this.doneT=0;this.msg=null;this.att=[];this.rage=false;
  p.x=this.cp?this.encs[this.cp-1].x+140:LV.start;p.facing=1;this.setBounds(LV.x0,LV.x1)}
 setBounds(l,r){this.l=l;this.r=r;this.g.arena.setOpen(l,r)}
 engage(e){this.state='fight';this.setBounds(Math.max(LV.x0,e.x-LV.half),Math.min(LV.x1,e.x+LV.half));
  this.queue=[];for(let i=0;i<e.n;i++)this.queue.push({side:i%2?-1:1,elite:false});
  if(e.boss)this.queue.splice(e.at===undefined?2:e.at,0,{side:1,elite:true,id:e.boss===1?'mantisAlpha':e.boss});
  this.cap=Math.min(this.cfg.cap,this.cfg.capBase+this.enc);this.sd=30;this.msg={t:170,title:e.title,say:e.say};this.g.sfx('ui_round_start',{vol:.7})}
 spawn(q){const g=this.g,c=CHARACTERS[q.id||(q.elite?'mantisAlpha':'mantis')],boss=!!c.storyBoss;
  const f=new Fighter({char:c,x:q.side<0?this.l+40:this.r-40,facing:-q.side,input:new MobAI(boss?Math.min(3,this.lvl+1):this.lvl)});   // Story-Boss: KI eine Stufe härter
  const k=[.8,1,1.2][Math.min(2,this.lvl)];f.maxHp=f.hp=Math.round(c.hp*k);f.y=GROUND-420+Math.random()*60;f.vy=0;f.state='air';f.airJumps=0;
  this.mobs.push(f);g.fighters.push(f);g.fx.ps.ring(f.x,GROUND-200,c.glow,boss?220:120);g.sfx(boss?'heavy_hit_impact':'whoosh_heavy',boss?{vol:.8}:{vol:.5,rate:1.2});
  if(boss){g.shake=Math.max(g.shake,10);g.flash=Math.max(g.flash,8);g.flashColor=c.glow}}
 clear(){const g=this.g,p=g.p1;this.cp=this.enc+1;this.enc++;this.drop(p.x+(p.facing>0?140:-140),.35);p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.3);p.meter=Math.min(300,p.meter+60);g.sfx('ui_round_start',{vol:.6,rate:1.3});
  if(this.enc>=this.encs.length){this.state='done';this.doneT=0;this.msg={t:240,title:this.cfg.win.title,say:this.cfg.win.say};g.celeb={f:p,t:0};g.flash=10;g.flashColor='#ffffff'}
  else{this.state='walk';this.goT=0;this.setBounds(LV.x0,LV.x1);this.msg={t:130,title:'GESCHAFFT',say:'Weiter nach rechts ➜'}}}
 mobDown(v,a,quiet){const g=this.g;this.kills++;v.state='ko';v.sf=0;v.vy=-9;v.vx=a.facing*6;v.noGrav=false;v.move=null;v.koT=0;v.pop=false;
  g.fx.ps.ring(v.x,v.y-80,v.char.glow,130);g.sfx('fw_finale',{vol:.35,rate:1.3});if(quiet)return;g.shake=Math.max(g.shake,7);g.hitstop=Math.max(g.hitstop,9);g.camera.kick(.02);
  if(v.char.storyBoss){   // Boss besiegt: Zeitlupe, Belohnung (2 Booster + Heilung), der restliche Schwarm bricht zusammen
   this.queue=[];g.slow=g.slowMax=EFFECT.koSlow;g.aberr=1;g.camera.kick(.06);g.shake=Math.max(g.shake,16);g.flash=Math.max(g.flash,10);g.flashColor=v.char.glow;g.fx.ps.ring(v.x,v.y-100,'#ffffff',240);g.sfx('fw_finale',{vol:.8});
   this.drop(v.x-34,.3,'pack');this.drop(v.x+34,.3,'pack');this.drop(v.x,.35,'heal');
   for(const m of this.alive())this.mobDown(m,a,true);return}
  const hurt=g.p1.hp/g.p1.maxHp<.45;if(this.kills%3===0||Math.random()<.35)this.drop(v.x,.25,hurt||Math.random()<.5?'heal':'pack')}   // Gegner lassen Heilung ODER Booster fallen (bei wenig Leben immer Heilung)
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
  this.att=al.slice(0,this.enc<2?1:al.length>5?3:2).concat(al.filter(m=>m.char.id==='mantisAlpha'||m.char.storyBoss));
  if(this.msg&&--this.msg.t<=0)this.msg=null;
  if(this.state==='walk'){this.goT++;const e=this.encs[this.enc];if(e&&p.x>=e.x-20)this.engage(e)}
  else if(this.state==='fight'){
   this.rageCheck();
   if(this.queue.length&&al.length<this.cap&&--this.sd<=0){this.spawn(this.queue.shift());this.sd=70}
   if(!this.queue.length&&!al.length)this.clear()}
  else if(this.state==='done')this.doneT++}
 // Boss unter 50 % Leben: Wutphase – lädt Hyper-Meter auf und ruft 2 weitere Mantis (einmal pro Kampf)
 rageCheck(){const g=this.g,b=this.mobs.find(m=>m.char.storyBoss&&m.state!=='ko');if(!b||this.rage||b.hp>b.maxHp*.5)return;
  this.rage=true;b.meter=Math.max(b.meter,150);this.queue.push({side:-1,elite:false},{side:1,elite:false});this.sd=Math.min(this.sd,20);
  this.msg={t:150,title:'DER DÄMON RASTET AUS',say:'Der Schwarm eilt ihm zu Hilfe!'};g.shake=Math.max(g.shake,12);g.flash=Math.max(g.flash,10);g.flashColor=b.char.glow;g.fx.ps.ring(b.x,b.y-100,b.char.glow,200);g.sfx('heavy_hit_impact',{vol:.8})}
 // Körper nicht übereinanderlaufen (Spieler + Mantis)
 separate(){const fs=[this.g.p1,...this.alive()];
  for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){const a=fs[i],b=fs[j];if(Math.abs(a.y-b.y)>90||a.state==='knockdown'||b.state==='knockdown')continue;
   const d=b.x-a.x,ad=Math.abs(d);if(ad>=48)continue;const s=d>0?1:d<0?-1:(a.id%2?1:-1),push=(48-ad)/2;a.x-=s*push;b.x+=s*push}
  for(const f of fs)f.x=Math.max(this.l,Math.min(this.r,f.x))}
}
