import{AIController}from'./ai.js';
import{Dealer}from'./blackmarket.js';
import{CHARACTERS}from'./characters.js';
import{EFFECT,GROUND}from'./config.js';
import{Fighter}from'./fighter.js';
import{Terrain}from'./terrain.js';
import{buildParkour}from'./parkour.js';
import{ITEMS,ITEM_METER_MAX,itemBlock,itemOf}from'./items.js';
import{addPack,itemCount,takeItem}from'./loot.js';

// Story-Modus: Seitenscroller-Level. Der Spieler läuft nach rechts; an festen Punkten (ENC) wird die Kamera gesperrt und Insektenkrieger
// (Mantis) springen in Gruppen von beiden Seiten herein. Erst wenn alle besiegt sind, geht es weiter (Checkpoint nach jeder Welle).
// Rein logisch (kein DOM) -> headless testbar. Werte hier justierbar.
export const LV={x0:-800,x1:2400,start:-700,half:560};   // Levelgrenzen, Startpunkt, halbe Breite des gesperrten Kampffelds
// Kapitel: je eigene Wellen (enc), Level-Look (stage = Index in THEMES, ground/line/lamp für die Straße), Textbausteine und Wellen-Limit (capBase + Welle, max cap).
// npc = Schwarzmarkthändler KORVUS (core/blackmarket.js): x = Standort (zwischen den Wellen ansprechbar, bei einer Welle duckt er sich weg).
// enc-Felder: x = Auslöse-Position, n = Anzahl Mantis, boss = Boss-Figur (1 = Alpha-Mantis) und at = Platz in der Spawn-Reihenfolge (0 = zuerst).
export const CHAPTERS=[
 {id:1,name:'DER SCHWARM',stage:0,capBase:2,cap:5,npc:{x:-480},ledges:[{x0:880,x1:1200,h:80},{x0:1320,x1:1640,h:100}],parkour:{deco:'neon',name:'NEON-CHIP',width:210,segs:'SLSHSFSHSDS'},props:[{k:'crate',x:-600},{k:'barrel',x:-120},{k:'sign',x:330},{k:'crate',x:820},{k:'barrel',x:1200},{k:'sign',x:1560},{k:'crate',x:1750},{k:'barrel',x:2050},{k:'sign',x:2280}],look:{ground:['#14101f','#050309'],line:'#4a3b78',lamp:'255,210,120',acc:'#7dff9a'},
  intro:['Die Stadt schläft nicht mehr. Aus den Gassen kriechen Insektenkrieger.','Kämpfe dich durch das Viertel – sie kommen in Gruppen.'],
  win:{title:'LEON BESIEGT',say:'Der Herrscher der Savanne ist geschlagen – der Schwarm zieht sich zurück!'},
  enc:[
   {x:-300,n:2,title:'ERSTE WELLE',say:'Etwas raschelt zwischen den Häusern …'},
   {x:150,n:3,title:'ZWEITE WELLE',say:'Es werden immer mehr.'},
   {x:600,n:4,title:'DRITTE WELLE',say:'Der Schwarm hat dich eingekreist!'},
   {x:1000,n:5,title:'VIERTE WELLE',say:'Sie greifen von beiden Seiten an – bleib in Bewegung!'},
   {x:1380,n:4,boss:1,title:'DER ALPHA',say:'Der Anführer des Schwarms steigt herab.'},
   {x:1800,n:2,boss:'leonBoss',at:0,title:'LEON',say:'Ein gewaltiges Brüllen erschüttert die Stadt – der Herrscher der Savanne fordert dich heraus!'}]},
 {id:2,name:'DER DÄMON ERWACHT',stage:2,capBase:3,cap:6,npc:{x:-480},ledges:[{x0:860,x1:1100,h:90},{x0:910,x1:1040,h:170}],parkour:{deco:'crane',name:'FRACHT-SCHATZ',width:185,segs:'SLSHNSDSLSHSFSDSS'},props:[{k:'barrel',x:-560},{k:'crate',x:-200},{k:'crate',x:420},{k:'barrel',x:900},{k:'sign',x:1250},{k:'crate',x:1600}],look:{ground:['#0c2a22','#030a07'],line:'#52ffa8',lamp:'120,255,200',acc:'#ff6a7a'},
  intro:['Der Schwarm war nur der Vorbote. Im Hafen regt sich etwas viel Größeres.','Mehr Krieger, härtere Wellen – und am Ende wartet er.'],
  win:{title:'ST3-G0 BESIEGT',say:'Die Panzer-Echse bricht zusammen – der Weg in den Kern ist frei.'},
  enc:[
   {x:-300,n:4,title:'ERSTE WELLE',say:'Diesmal sind es gleich mehr.'},
   {x:150,n:5,title:'ZWEITE WELLE',say:'Aus den Containern kriechen sie hervor.'},
   {x:600,n:6,title:'DRITTE WELLE',say:'Der Schwarm ist gewachsen – lass dich nicht einkreisen!'},
   {x:1000,n:7,title:'VIERTE WELLE',say:'Sie kommen aus allen Richtungen. Der Boden bebt.'},
   {x:1380,n:2,boss:'st3g0Boss',at:0,title:'ST3-G0',say:'Die Panzer-Echse versperrt den Weg zum Kern. Der Boden bebt unter ihren Schritten.'}]},
 // Kapitel 3: gemischte Wellen (mix = [[Figur, Anzahl], …], gleichmäßig durchgemischt) aus Mantis + Mini-A1LIEN, Finale: A1LIEN ('cyberdemon'). Boss-Reihenfolge: Kap. 1 LEON ('leonBoss'), Kap. 2 ST3-G0 ('st3g0Boss'), Kap. 3 A1LIEN, Kap. 4 ANUBIS ('anubisBoss'), Kap. 5 URSUS ('bearBoss').
 // parkour = Kletterstrecke pro Kapitel (Generator core/parkour.js): deco = Kulisse (neon/crane/reactor/obelisk/pagoda, render/storyhud.js), name = Schatz, width = Plattformbreite, segs = Kürzel-Folge (S Stufe, L flach, H hoch, N schmal, D Doppelsprung-Lücke, F gerade, B Rast, M beweglich, C bröckelnd, T Wende). Je Kapitel höher, schmaler und mit mehr D/M/C. Daraus entstehen platforms + relic (Schatz oben: Leben voll, +100 Meter, +2 Booster). Zone x -300..800 (links der Händler, rechts vor den Kanten); solange man oben klettert (>110 px über dem Boden), startet keine Welle.
 // ledges = Kanten/Ebenen des Kapitels [{x0,x1,h}]: ein Plateau, h Pixel über dem Boden. Von unten stoppt die Kante (Wand) – man springt hinauf, läuft oben weiter und fällt am Ende wieder hinunter; sich überlappende Plateaus ergeben Treppen. Siehe core/terrain.js.
 {id:3,name:'DER KERN',stage:1,capBase:3,cap:7,npc:{x:-480},look:{ground:['#2a0c14','#0a0206'],line:'#ff5a6e',lamp:'255,130,110',acc:'#ffb347'},
  intro:['Der Hafen ist gefallen – doch das Glühen kommt von weiter unten, aus dem Kern der Stadt.','Zwischen den Wellen versperren Trümmer den Weg. Spring drüber – und halte dich bereit.'],
  win:{title:'A1LIEN BESIEGT',say:'Das Glühen im Kern erlischt – doch tief unter den Trümmern öffnet sich ein Tor.'},
  ledges:[{x0:860,x1:1120,h:90},{x0:960,x1:1090,h:170},{x0:1170,x1:1320,h:100}],parkour:{deco:'reactor',name:'KERNSPLITTER',width:160,segs:'SLMHSNSDSMLSHFSDSNSMFSDS'},
  props:[{k:'crate',x:-640},{k:'barrel',x:-330},{k:'sign',x:-160},{k:'crate',x:260},{k:'barrel',x:520},{k:'sign',x:700},{k:'crate',x:940},{k:'barrel',x:1100},{k:'crate',x:1500},{k:'sign',x:1640}],
  enc:[
   {x:-300,mix:[['mantis',3],['miniDemon',1]],title:'ERSTE WELLE',say:'Zwischen den Insekten tauchen kleine Dämonen auf.'},
   {x:150,mix:[['mantis',3],['miniDemon',2]],title:'ZWEITE WELLE',say:'Das Glühen wird stärker.'},
   {x:600,mix:[['mantis',2],['miniDemon',3]],title:'DRITTE WELLE',say:'Die kleinen Dämonen sind schneller als sie aussehen!'},
   {x:1000,mix:[['mantis',3],['miniDemon',3]],title:'VIERTE WELLE',say:'Sie kommen von allen Seiten – spring, wenn es eng wird.'},
   {x:1380,n:2,boss:'cyberdemon',at:0,title:'A1LIEN',say:'Rotes Glühen unter der Haut – der Dämon des Kerns.'}]},
 // Kapitel 4: Das Totenreich (Stage 3 = Labyrinth). Mehr Gegner als Kapitel 3, ein Alpha-Mantis in der Vorwelle, Finale: ANUBIS ('anubisBoss').
 {id:4,name:'DAS TOTENREICH',stage:3,capBase:4,cap:8,npc:{x:-480},look:{ground:['#1f1507','#080501'],line:'#ffd45a',lamp:'255,190,90',acc:'#ffd45a'},
  intro:['Unter dem Kern liegt das Totenreich – Fackeln, Stein und der Geruch von altem Staub.','Seine Wächter lassen niemanden vorbei. Am Ende wartet ihr Herr.'],
  win:{title:'ANUBIS BESIEGT',say:'Der Wächter der Unterwelt ist gefallen – doch aus den Bergen dröhnt ein neues Brüllen.'},
  ledges:[{x0:860,x1:1200,h:100},{x0:1320,x1:1650,h:90},{x0:1430,x1:1560,h:180}],parkour:{deco:'obelisk',name:'SKARABÄUS',width:140,segs:'SLCSMNSDCSMFSCDSNSMCSLDSCMFSDS'},
  props:[{k:'barrel',x:-640},{k:'sign',x:-160},{k:'crate',x:240},{k:'barrel',x:520},{k:'sign',x:700},{k:'crate',x:960},{k:'barrel',x:1100},{k:'crate',x:1480},{k:'sign',x:1700},{k:'barrel',x:2000}],
  enc:[
   {x:-300,mix:[['mantis',3],['miniDemon',2]],title:'ERSTE WELLE',say:'Die Wächter des Totenreichs erwachen.'},
   {x:150,mix:[['mantis',4],['miniDemon',2]],title:'ZWEITE WELLE',say:'Aus den Nischen der Gruft kriechen sie hervor.'},
   {x:600,mix:[['mantis',3],['miniDemon',4]],title:'DRITTE WELLE',say:'Die Fackeln flackern – etwas Großes nähert sich.'},
   {x:1000,mix:[['mantis',4],['miniDemon',4]],title:'VIERTE WELLE',say:'Sie kommen aus allen Richtungen. Spring, wenn es eng wird!'},
   {x:1380,mix:[['mantis',3],['miniDemon',3]],boss:1,at:2,title:'DER ALPHA',say:'Der Alpha der Gruft führt die letzte Vorhut an.'},
   {x:1800,mix:[['miniDemon',2]],boss:'anubisBoss',at:0,title:'ANUBIS',say:'Das Tor zur Unterwelt öffnet sich – Anubis, der Wächter der Unterwelt, tritt hervor.'}]},
  // Kapitel 5: Der Bergtempel (Stage 1 = Tempel), Finale: URSUS der Bär ('bearBoss'). Kapitel 5 ist das letzte Kapitel: Abschluss = Story durchgespielt (zählt als Durchlauf, schaltet LEON frei; URSUS nach 5 Durchläufen, siehe CLEAR_UNLOCKS).
  {id:5,name:'DER BERGTEMPEL',stage:1,capBase:4,cap:9,npc:{x:-480},look:{ground:['#2a1a0c','#0a0603'],line:'#e0a05a',lamp:'255,200,120',acc:'#e08a4a'},
   intro:['Aus dem Totenreich führt ein Pfad hinauf zum Bergtempel – Nebel, Stein und Kirschblüten.','Dort haust, was selbst die Wächter der Gruft fürchten. Der Schwarm lässt dich nicht kampflos vorbei.'],
   win:{title:'URSUS BESIEGT',say:'Der Bär ist gefallen – der Berg schweigt, und die Stadt ist endlich sicher.'},
   ledges:[{x0:860,x1:1200,h:90},{x0:1300,x1:1650,h:120},{x0:1420,x1:1560,h:190}],parkour:{deco:'pagoda',name:'DRACHENPERLE',width:125,segs:'SCMLNSDCMSFCNSDMCSNMDCSLMNFCDMSNDS'},
   props:[{k:'barrel',x:-620},{k:'crate',x:-200},{k:'sign',x:180},{k:'barrel',x:560},{k:'crate',x:880},{k:'sign',x:1120},{k:'barrel',x:1400},{k:'crate',x:1700},{k:'sign',x:1980},{k:'barrel',x:2200}],
   enc:[
    {x:-300,mix:[['mantis',4],['miniDemon',3]],title:'ERSTE WELLE',say:'Der Schwarm hat den Berg erreicht.'},
    {x:150,mix:[['mantis',4],['miniDemon',4]],title:'ZWEITE WELLE',say:'Zwischen den Tempelsäulen regt sich etwas.'},
    {x:600,mix:[['mantis',5],['miniDemon',4]],title:'DRITTE WELLE',say:'Der Nebel verschluckt die Gegner – und spuckt sie von allen Seiten wieder aus.'},
    {x:1000,mix:[['mantis',4],['miniDemon',5]],title:'VIERTE WELLE',say:'Spring, wenn es eng wird – der Gipfel ist nah!'},
    {x:1380,mix:[['mantis',4],['miniDemon',4]],boss:1,at:2,title:'DER ALPHA',say:'Der Alpha des Berges führt die letzte Vorhut an.'},
    {x:1800,mix:[['miniDemon',2]],boss:'bearBoss',at:0,title:'URSUS',say:'Ein Brüllen lässt den Tempel beben – URSUS, der Bär vom Berg, stellt sich dir in den Weg.'}]}];
for(const c of CHAPTERS)if(c.parkour)Object.assign(c.parkour,buildParkour(c.parkour));   // Strecke aus den Kürzeln erzeugen (platforms, relic, height)
export const ENC=CHAPTERS[0].enc;   // Kapitel 1 (Rückwärtskompatibilität: Tests/HUD)
// KI für Schwarm-Gegner: nur die nächsten 2-3 greifen an, der Rest kreist in Abstand (sonst Dauer-Überzahl)
export class MobAI extends AIController{
 tick(me,opp,game){const st=game.story;
  if(st&&game.phase==='fight'&&['idle','walk','crouch'].includes(me.state)&&!st.att.includes(me)){
   const d=opp.x-me.x,fwd=d>=0?1:-1,dist=Math.abs(d),want=250+(me.id%3)*50;
   this.feed(dist>want+40?fwd:dist<want-60?-fwd:0,0,[],game.hitstop>0);return}
  super.tick(me,opp,game)}}
export class Story{
 constructor(game,{ai=0,chapter=1}={}){this.g=game;this.lvl=[0,1,1,2][Math.max(0,Math.min(3,ai|0))];this.ch=Math.max(1,Math.min(CHAPTERS.length,chapter|0||1));this.cfg=CHAPTERS[this.ch-1];this.encs=this.cfg.enc;const pk=this.cfg.parkour;this.terrain=(this.cfg.ledges&&this.cfg.ledges.length)||pk?new Terrain(this.cfg.ledges||[],pk?pk.platforms:[]):null;
  this.relic=pk&&pk.relic?{x:pk.relic.x,y:GROUND-pk.relic.h-34,name:pk.relic.name,got:false,t:0}:null;this.rage=false;this.cp=0;this.kills=0;this.att=[];this.mobs=[];this.l=LV.x0;this.r=LV.x1;this.dealer=null;this.itemCd=0;this.isel=0}
 get total(){return this.encs.length}
 alive(){return this.mobs.filter(m=>m.state!=='ko')}
 nearest(f){let b=null,bd=1e9;for(const m of this.alive()){const d=Math.abs(m.x-f.x);if(d<bd){bd=d;b=m}}return b}
 pairs(){const p=this.g.p1,o=[];for(const m of this.alive()){o.push([p,m],[m,p])}return o}
 // Start / Neustart (Game.startRound): am letzten Checkpoint
 begin(){const g=this.g,p=g.p1;this.mobs=[];this.items=[];g.fighters=[p];this.queue=[];this.state='walk';this.enc=this.cp;this.ft=0;this.sd=0;this.goT=0;this.doneT=0;this.msg=null;this.att=[];this.rage=false;
  p.x=this.cp?this.encs[this.cp-1].x+140:LV.start;p.facing=1;this.setBounds(LV.x0,LV.x1);
  this.dealer=this.cfg.npc?new Dealer(this,this.cfg.npc):null;if(this.dealer&&this.cp)this.dealer.place(this.dealerSpot())}   // Händler: bei jedem (Neu-)Start frisch (Gespräch geschlossen)
 // Händler steht ein Stück vor dem Spieler, aber noch vor dem nächsten Wellen-Auslöser (Checkpoint/Wellenende)
 dealerSpot(){const p=this.g.p1,e=this.encs[this.enc],lim=e?e.x-130:LV.x1-80;return Math.max(LV.x0+80,Math.min(lim,p.x+170))}
 setBounds(l,r){this.l=l;this.r=r;this.g.arena.setOpen(l,r)}
 engage(e){this.state='fight';this.setBounds(Math.max(LV.x0,e.x-LV.half),Math.min(LV.x1,e.x+LV.half));
  this.queue=[];
  if(e.mix){const L=e.mix.map(([id,n])=>Array.from({length:n},()=>id));let i=0;while(L.some(a=>a.length))for(const a of L)if(a.length){this.queue.push({side:i++%2?-1:1,elite:false,id:a.shift()})}}   // gemischt: reihum aus jeder Gruppe, Seiten im Wechsel
  else for(let i=0;i<e.n;i++)this.queue.push({side:i%2?-1:1,elite:false});
  if(e.boss)this.queue.splice(e.at===undefined?2:e.at,0,{side:1,elite:true,id:e.boss===1?'mantisAlpha':e.boss});
  this.cap=Math.min(this.cfg.cap,this.cfg.capBase+this.enc);this.sd=30;this.msg={t:170,title:e.title,say:e.say};this.g.sfx('ui_round_start',{vol:.7})}
 spawn(q){const g=this.g,c=CHARACTERS[q.id||(q.elite?'mantisAlpha':'mantis')],boss=!!c.storyBoss;
  const f=new Fighter({char:c,x:q.side<0?this.l+40:this.r-40,facing:-q.side,input:new MobAI(boss?Math.min(3,this.lvl+1):this.lvl)});   // Story-Boss: KI eine Stufe härter
  const k=[.8,1,1.2][Math.min(2,this.lvl)];f.maxHp=f.hp=Math.round(c.hp*k);f.y=GROUND-420+Math.random()*60;f.vy=0;f.state='air';f.airJumps=0;
  this.mobs.push(f);g.fighters.push(f);g.fx.ps.ring(f.x,GROUND-200,c.glow,boss?220:120);g.sfx(boss?'heavy_hit_impact':'whoosh_heavy',boss?{vol:.8}:{vol:.5,rate:1.2});
  if(boss){g.shake=Math.max(g.shake,10);g.flash=Math.max(g.flash,8);g.flashColor=c.glow}}
 clear(){const g=this.g,p=g.p1;this.cp=this.enc+1;this.enc++;this.drop(p.x+(p.facing>0?140:-140),.35);p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.3);p.meter=Math.min(300,p.meter+60);g.sfx('ui_round_start',{vol:.6,rate:1.3});
  if(this.enc>=this.encs.length){this.state='done';this.doneT=0;this.msg={t:240,title:this.cfg.win.title,say:this.cfg.win.say};g.celeb={f:p,t:0};g.flash=10;g.flashColor='#ffffff'}
  else{this.state='walk';this.goT=0;this.setBounds(LV.x0,LV.x1);this.msg={t:130,title:'GESCHAFFT',say:'Weiter nach rechts ➜'};if(this.dealer)this.dealer.place(this.dealerSpot())}}
 mobDown(v,a,quiet){const g=this.g;this.kills++;v.state='ko';v.sf=0;v.vy=-9;v.vx=a.facing*6;v.noGrav=false;v.move=null;v.koT=0;v.pop=false;
  g.fx.ps.ring(v.x,v.y-80,v.char.glow,130);g.sfx('fw_finale',{vol:.35,rate:1.3});if(quiet)return;g.shake=Math.max(g.shake,7);g.hitstop=Math.max(g.hitstop,9);g.camera.kick(.02);
  if(v.char.storyBoss){   // Boss besiegt: Zeitlupe, Belohnung (2 Booster + Heilung), der restliche Schwarm bricht zusammen
   this.queue=[];g.slow=g.slowMax=EFFECT.koSlow;g.aberr=1;g.camera.kick(.06);g.shake=Math.max(g.shake,16);g.flash=Math.max(g.flash,10);g.flashColor=v.char.glow;g.fx.ps.ring(v.x,v.y-100,'#ffffff',240);g.sfx('fw_finale',{vol:.8});
   this.drop(v.x-34,.3,'pack');this.drop(v.x+34,.3,'pack');this.drop(v.x,.35,'heal');
   for(const m of this.alive())this.mobDown(m,a,true);return}
  const hurt=g.p1.hp/g.p1.maxHp<.45;if(this.kills%3===0||Math.random()<.35)this.drop(v.x,.25,hurt||Math.random()<.5?'heal':'pack')}   // Gegner lassen Heilung ODER Booster fallen (bei wenig Leben immer Heilung)
 // Heilitem (Energiedrink): fällt aus Gegnern bzw. liegt nach jeder Welle bereit; Drüberlaufen = +25 % Leben
 drop(x,heal=.25,kind='heal'){x=Math.max(this.l+30,Math.min(this.r-30,x));this.items.push({kind,x,y:this.g.floorAt(x)-120,vy:-6,heal,age:0})}
 pickups(){const g=this.g,p=g.p1;for(const it of this.items){it.age++;const fl=g.floorAt(it.x);it.vy+=.5;it.y=Math.min(fl-14,it.y+it.vy);if(it.y>=fl-14)it.vy=0;
  if(p.hp>0&&Math.abs(p.x-it.x)<42&&p.y>fl-70&&p.y<=fl+30&&it.y>=fl-14){it.got=true;g.sfx('ui_round_start',{vol:.5,rate:1.6});
   if(it.kind==='pack'){addPack();g.fx.ps.ring(it.x,fl-40,'#ffd23f',110);g.pop(it.x,fl-130,'+1 BOOSTER','#ffd23f',1.1,{text:true})}
   else{const h=Math.round(p.maxHp*it.heal);p.hp=Math.min(p.maxHp,p.hp+h);g.fx.ps.ring(it.x,fl-40,'#7dff9a',110);g.pop(it.x,fl-130,'+'+h,'#7dff9a',1.2)}}}
  this.items=this.items.filter(i=>!i.got&&i.age<1800)}
 // Parkour-Schatz (Kapitel-Config parkour.relic): liegt ganz oben auf der Kletterstrecke, einmal pro Kapitelstart. Belohnung: Leben voll, +100 Hyper-Meter, +2 Booster.
 relicCheck(){const r=this.relic,g=this.g,p=g.p1;if(!r||r.got)return;r.t++;if(p.hp<=0||p.state==='ko'||Math.abs(p.x-r.x)>46||Math.abs(p.y-(r.y+34))>64)return;
  r.got=true;p.hp=p.maxHp;p.meter=Math.min(ITEM_METER_MAX,p.meter+100);addPack(2);
  this.msg={t:230,title:r.name+' GEFUNDEN',say:'Leben voll · +100 Hyper-Meter · +2 Booster'};g.sfx('fw_finale',{vol:.7});g.flash=Math.max(g.flash,8);g.flashColor='#ffd23f';
  g.fx.ps.ring(r.x,r.y,'#ffd23f',170);g.pop(r.x,r.y-60,'+2 BOOSTER','#ffd23f',1.2,{text:true})}
 // Sonderitems aus den Boostern (LOOT.items, core/items.js): Taste 1/2/3 benutzt direkt, Q wählt das nächste vorhandene, Digit0/R3 benutzt das gewählte.
 // Ein Stück wird nur verbraucht, wenn es wirkt (Leben/Meter nicht voll). Rückgabe true = benutzt.
 cycleItem(){const n=ITEMS.length;for(let k=1;k<=n;k++){const i=(this.isel+k)%n;if(itemCount(ITEMS[i].id)>0){this.isel=i;return true}}return false}
 useItem(id){const g=this.g,p=g.p1,it=itemOf(id);
  if(!it||g.phase!=='fight'||this.state==='done'||p.hp<=0||p.state==='ko'||(this.dealer&&this.dealer.active)||this.itemCd>0)return false;
  const no=(txt,col)=>{g.pop(p.x,p.y-190,txt,col||'#ff8a9a',1,{text:true});g.sfx('block_guard',{vol:.4});this.itemCd=20;return false};
  if(itemCount(id)<1)return no('KEIN '+it.short);
  const why=itemBlock(p,it);if(why)return no(why,'#ffd23f');
  if(!takeItem(id))return false;
  this.itemCd=40;this.isel=ITEMS.indexOf(it);
  if(it.kind==='heal'){const h=Math.round(p.maxHp*it.v),b=p.hp;p.hp=Math.min(p.maxHp,p.hp+h);g.pop(p.x,p.y-190,'+'+Math.round(p.hp-b),it.col,1.2)}
  else{const b=p.meter;p.meter=Math.min(300,p.meter+it.v);g.pop(p.x,p.y-190,'+'+Math.round(p.meter-b)+' METER',it.col,1.1,{text:true})}
  g.fx.ps.ring(p.x,p.y-80,it.col,110);g.sfx('ui_round_start',{vol:.5,rate:1.6});return true}
 // Hindernisse (Kapitel 3): beim Laufen am Boden blockiert; wer drüberspringt (Füße höher als h), kommt durch. Landen im Hindernis schiebt zur näheren Seite.
 update(){const g=this.g,p=g.p1;this.ft++;if(this.itemCd>0)this.itemCd--;this.pickups();this.relicCheck();if(this.dealer)this.dealer.update();
  for(const m of this.mobs)if(m.state==='ko')m.koT=(m.koT||0)+1;
  const gone=this.mobs.filter(m=>m.state==='ko'&&m.koT>80);
  if(gone.length){this.mobs=this.mobs.filter(m=>!gone.includes(m));g.fighters=g.fighters.filter(f=>!gone.includes(f))}
  const al=this.alive().sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x));
  this.att=al.slice(0,this.enc<2?1:al.length>5?3:2).concat(al.filter(m=>m.char.id==='mantisAlpha'||m.char.storyBoss));
  if(this.msg&&--this.msg.t<=0)this.msg=null;
  if(this.state==='walk'){this.goT++;const e=this.encs[this.enc];if(e&&p.x>=e.x-20&&p.y>GROUND-110)this.engage(e)}   // oben auf der Kletterstrecke startet keine Welle
  else if(this.state==='fight'){
   this.rageCheck();
   if(this.queue.length&&al.length<this.cap&&--this.sd<=0){this.spawn(this.queue.shift());this.sd=70}
   if(!this.queue.length&&!al.length)this.clear()}
  else if(this.state==='done')this.doneT++}
 // Boss unter 50 % Leben: Wutphase – lädt Hyper-Meter auf und ruft 2 weitere Mantis (einmal pro Kampf)
 rageCheck(){const g=this.g,b=this.mobs.find(m=>m.char.storyBoss&&m.state!=='ko');if(!b||this.rage||b.hp>b.maxHp*.5)return;
  this.rage=true;b.meter=Math.max(b.meter,150);this.queue.push({side:-1,elite:false},{side:1,elite:false});this.sd=Math.min(this.sd,20);
  this.msg={t:150,title:(b.char.name?b.char.name+' RASTET AUS':'DER BOSS RASTET AUS'),say:'Der Schwarm eilt ihm zu Hilfe!'};g.shake=Math.max(g.shake,12);g.flash=Math.max(g.flash,10);g.flashColor=b.char.glow;g.fx.ps.ring(b.x,b.y-100,b.char.glow,200);g.sfx('heavy_hit_impact',{vol:.8})}
 // Körper nicht übereinanderlaufen (Spieler + Mantis)
 separate(){const fs=[this.g.p1,...this.alive()];
  for(let i=0;i<fs.length;i++)for(let j=i+1;j<fs.length;j++){const a=fs[i],b=fs[j];if(Math.abs(a.y-b.y)>90||a.state==='knockdown'||b.state==='knockdown')continue;
   const d=b.x-a.x,ad=Math.abs(d);if(ad>=48)continue;const s=d>0?1:d<0?-1:(a.id%2?1:-1),push=(48-ad)/2;a.x-=s*push;b.x+=s*push}
  for(const f of fs)f.x=Math.max(this.l,Math.min(this.r,f.x))}
}
