import{H,W}from'../core/config.js';
import{LOOT,prizeTier}from'../core/loot.js';

import{ParticleSystem}from'../core/particles.js';

import{boosterArt,card,cardImg,prizeFace}from'./lootui.js';

import{R}from'./sprites.js';
// Booster aufreißen (ersetzt die alte Kartenreihe beim Öffnen). Ablauf, alles in 60-Hz-Frames:
//  idle  Päckchen fliegt ein und schwebt            -> ENTER / Klick = aufreißen
//  tear  Wackeln + Risslinie, dann reißt oben ab, Licht + Funken schießen heraus
//  pop   die drei Karten springen verdeckt heraus
//  show  jede Karte einzeln: fliegt in die Mitte, wackelt (je wertvoller, desto länger), dreht sich um, Einschlag + Feuerwerk -> ENTER = nächste
//  out   Karte wandert in die kleine Ablage unten
//  sum   alle drei groß nebeneinander; Abschlussfeuerwerk nach dem besten Preis -> ENTER = zurück zur Übersicht
// Wertigkeit (loot.js prizeTier 0..4) steuert Spannung und Feuerwerk: 0 Funkenregen · 1 eine Rakete · 2 fünf Raketen · 3 Riesenblume + Finale-Raketen · 4 JACKPOT: große Bombe mit Schockwellen, Blitzen, Nachzündern.
// Aufruf: new PackOpen(rewards, sfx) ; pro Bild draw(g,hud,u) ; advance() bei ENTER/Klick (true = fertig). Zeit läuft in 60-Hz-Schritten, unabhängig von der Monitorfrequenz.
export const PO={cx:480,cy:292,pw:176,ph:250,tearAt:46,rip:14,popGap:20,popLen:36,popEnd:76,fly:28,flip:22,out:26};
export const poCl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),poEo=t=>1-Math.pow(1-t,3),poEi=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const poRow=i=>({x:480+(i-1)*190,y:262,w:150,h:206,r:0}),poMini=i=>({x:480+(i-1)*44,y:514,w:30,h:42,r:0}),poSum=i=>({x:480+(i-1)*236,y:268,w:210,h:290,r:0});
export const PO_BIG={x:480,y:266,w:232,h:320,r:0},PO_OPEN={x:480,y:230,w:56,h:78,r:0};
export const poLp=(a,b,e)=>({x:a.x+(b.x-a.x)*e,y:a.y+(b.y-a.y)*e,w:a.w+(b.w-a.w)*e,h:a.h+(b.h-a.h)*e,r:(a.r||0)+((b.r||0)-(a.r||0))*e});
export const poA=(c,a)=>c.length===7?c+a:c;   // '#rrggbb' + Alpha-Hex
export const PO_TITLES=['','NICE!','STARK!','WOW!','JACKPOT!!'];
export const PO_GOLD='#ffd23f';
export class PackOpen{
 constructor(rewards,sfx){this.items=rewards.map(r=>({r,tier:prizeTier(r),face:prizeFace(r)}));this.sfx=sfx||null;this.fw=new ParticleSystem();
  this.ph='idle';this.pt=0;this.a=0;this.acc=0;this.k=0;this.ta=-1;this.flash=0;this.shake=0;this.ray=0;this.q=[];this.col=PO_GOLD;this._n=null;this.title=null;
  this.maxTier=Math.max(0,...this.items.map(i=>i.tier));
  // Feuerwerksraketen: Ring + Glitter in der Preis-Farbe; Riesenblumen (mega) bekommen ihren Effekt selbst
  this.fw.onBoom=r=>{if(r.mega)return;if(!r.fin)this.S('fw_rocket',{vol:.55,rate:.92+Math.random()*.2});const c=this.col,f=this.fw;f.ring(r.x,r.y,c,90);
   f.glitter(r.x,r.y,{count:18,speed:5,life:70,size:4,colors:[c,'#ffffff','#ffe27a','#cdb4ff'],gravity:.05});if(r.fin){f.flare(r.x,r.y,'#ffffff',200,18,Math.random()*3);f.starburst(r.x,r.y,c,26)}}}
 S(n,o){if(this.sfx)this.sfx(n,o)}
 later(d,fn){this.q.push([this.a+d,fn])}
 holdOf(i){return 16+this.items[i].tier*12}          // Spannungsphase vor dem Umdrehen: je wertvoller, desto länger
 impAt(i){return PO.fly+this.holdOf(i)+PO.flip}       // Frame (in 'show'), in dem die Karte aufgedeckt ist = Einschlag
 // ---- Zeit ----
 update(dt){this.acc+=dt;let n=0;while(this.acc>=1&&n++<6){this.acc-=1;this.step()}if(this.acc>=1)this.acc=0}
 step(){this.a++;this.pt++;if(this.ta>=0)this.ta++;this.flash=Math.max(0,this.flash-.06);this.shake=this.shake>.15?this.shake*.9:0;this.ray=Math.max(0,this.ray-.012);
  for(let i=this.q.length-1;i>=0;i--)if(this.q[i][0]<=this.a){const f=this.q[i][1];this.q.splice(i,1);f()}
  const t=this.pt,P=this.ph;
  if(P==='idle'){if(t%7===0)this.spark(1)}
  else if(P==='tear'){
   if(t<PO.tearAt){if(t%2===0)this.spark(1+Math.floor(t/PO.tearAt*3));const T=[6,14,22,30,38],j=T.indexOf(t);if(j>=0)this.S('combo_step_0'+(1+j%4),{vol:.45,rate:.9+t/80})}   // Spannung: aufsteigende Töne
   else if(t===PO.tearAt)this.rip();
   else if(t>=PO.tearAt+PO.rip){this.ph='pop';this.pt=0}}
  else if(P==='pop'){for(let i=0;i<3;i++)if(t===i*PO.popGap){this.S('whoosh_light',{vol:.55,rate:1+i*.15});this.fw.glitter(480,225,{count:14,speed:6,life:50,size:4,colors:[PO_GOLD,'#ffffff','#7df9ff'],gravity:.03})}
   if(t>=PO.popEnd){this.ph='show';this.k=0;this.pt=0}}
  else if(P==='show'){const k=this.k,r=this.items[k],T=r.tier,imp=this.impAt(k),hold=this.holdOf(k);
   if(t===1){this.col=r.face.col;this.S('whoosh_light',{vol:.6,rate:.9})}
   if(t===PO.fly&&T>=3)this.S('ground_slam',{vol:.2+T*.05,rate:.7});                                  // Grollen bei hohen Preisen
   if(t>PO.fly&&t<PO.fly+hold&&T>=2&&t%6===0)this.fw.glitter(480+(Math.random()-.5)*200,266+(Math.random()-.5)*300,{count:T,speed:1.6,life:40,size:3,colors:[r.face.col,'#ffffff'],gravity:-.03});
   if(t===PO.fly+hold)this.S('whoosh_light',{vol:.7,rate:1.25});
   if(t===imp)this.impact(k);
   if(t>imp&&T>=3&&t%9===0)this.fw.glitter(80+Math.random()*800,90+Math.random()*60,{count:4,speed:1.8,life:70,size:3.4,colors:[r.face.col,'#ffffff','#ffe27a'],gravity:.04})}   // Glitzerregen
  else if(P==='out'){if(t>=PO.out){this.k++;this.pt=0;if(this.k<this.items.length)this.ph='show';else{this.ph='sum';this.enterSum()}}}
  else if(P==='sum'){if(t%10===0&&this.maxTier>=2)this.fw.glitter(80+Math.random()*800,80+Math.random()*60,{count:3,speed:1.6,life:70,size:3.2,colors:[PO_GOLD,'#ffffff','#cdb4ff'],gravity:.04})}
  this.fw.update()}
 spark(n){this.fw.glitter(PO.cx+(Math.random()-.5)*PO.pw*1.3,PO.cy+(Math.random()-.5)*PO.ph,{count:n,speed:1.5,life:46,size:3,colors:[PO_GOLD,'#ffffff','#ffe27a'],gravity:-.02})}
 // Päckchen reißt auf: Blitz, Schockwelle, Funken, Strahlen, Oberteil fliegt weg
 rip(){const f=this.fw;this.ta=0;this.flash=.7;this.shake=10;this.ray=1;this.col=PO_GOLD;this.S('whoosh_heavy',{vol:.8});this.S('hit_critical',{vol:.55,rate:1.2});
  f.shock(480,225,'#fff2b0',320,26);f.ring(480,225,'#ffffff',140);f.starburst(480,225,PO_GOLD,30);
  f.glitter(480,225,{count:70,speed:9,life:70,size:5,colors:[PO_GOLD,'#ffffff','#ffe27a','#7df9ff'],gravity:.05});f.shard(480,225,{count:16,speed:8,life:50,colors:[PO_GOLD,'#ffffff']})}
 // Karte k ist aufgedeckt: Blitz, Wackeln, Titel („WOW!“) und Feuerwerk – je nach Wertigkeit
 impact(k){const r=this.items[k],T=r.tier,c=r.face.col,f=this.fw,X=480,Y=262;this.col=c;this.flash=[.3,.4,.55,.75,.9][T];this.shake=[2,4,7,11,18][T];this.title={a:this.a,text:PO_TITLES[T]};
  f.shock(X,Y+40,c,[160,220,300,380,470][T],24);f.ring(X,Y,c,[90,120,170,220,280][T]);
  f.glitter(X,Y,{count:[22,34,50,80,170][T],speed:[5,7,9,11,13][T],life:90,size:5,colors:[c,'#ffffff','#ffe27a','#cdb4ff'],gravity:.05});
  const rk=(x,top,d,sc=.75,fin=false)=>this.later(d,()=>{this.fw.rocket(x,540,top,c,sc);if(fin){const q=this.fw.rk[this.fw.rk.length-1];q.rise=50;q.fin=true}});
  if(T===0)this.S('combo_step_04',{vol:.6,rate:1.2});
  else if(T===1){this.S('punch_heavy',{vol:.5});rk(480,150,0,.6)}
  else if(T===2){this.S('heavy_hit_impact',{vol:.6});rk(200,170,0,.7);rk(760,170,6,.7);rk(480,120,14,.8);rk(330,200,22,.6);rk(630,200,28,.6)}
  else if(T===3){this.S('ground_slam',{vol:.6});this.S('fw_finale',{vol:.55,rate:1.1});f.mega(X,Y-20,c,1.7,2.4,1.3);f.mega(X,Y-20,'#ffffff',.8,1,1.2);for(const[x,tp,d]of[[150,170,0],[810,170,4],[300,130,10],[660,130,14]])rk(x,tp,d,.8);rk(480,100,24,.9,true);rk(380,120,26,.9,true);rk(580,120,28,.9,true)}
  else{   // JACKPOT: die große Bombe (wie der Finalschlag der Charakterwahl, noch größer) + Raketensalve
   const gold='#ffd27a';this.S('ground_slam',{vol:.9});this.S('hit_critical',{vol:.8});this.S('fw_finale',{vol:.9});
   f.mega(X,Y,c,2.6,4,1.6);f.mega(X,Y,gold,1.9,2.4,1.4);f.mega(X,Y,'#ffffff',1.25,1.6,1.3);f.mega(X,Y,c,.7,1,1.2);f.shock(X,420,c,420,36);f.shock(X,420,gold,300,30);
   for(const rr of[80,150,230])f.ring(X,Y,rr%2?'#ffffff':c,rr);f.shard(X,Y,{count:50,speed:11,life:90,colors:[c,gold,'#ffffff']});
   for(let i=0;i<24;i++)f.bolt(X,Y,i%2?c:'#ffffff',i*.2618+Math.random()*.15,260+Math.random()*220,10);
   [[8,-300,-60],[14,300,-40],[20,-170,70],[26,200,50],[32,0,-100],[38,-380,40],[44,380,30]].forEach((q,i)=>this.later(q[0],()=>{const cc=i%3===0?gold:i%2?c:'#ffffff';this.fw.mega(X+q[1],Y+q[2],cc,1.1,1.1,.9);this.fw.glitter(X+q[1],Y+q[2],{count:22,speed:6,life:80,size:4,colors:[cc,'#ffffff','#cdb4ff'],gravity:.05});this.fw.ring(X+q[1],Y+q[2],cc,120)}));
   [[120,150],[840,150],[240,110],[720,110],[60,200],[900,200],[480,90],[360,130]].forEach((q,i)=>rk(q[0],q[1],10+i*6,.85))}}
 enterSum(){const T=this.maxTier,f=this.fw;this.flash=.3;this.col=PO_GOLD;this.S(T>=3?'fw_finale':'fw_rocket',{vol:.5});
  for(let i=0;i<[0,1,3,5,8][T];i++)this.later(i*7,()=>{this.col=this.items[i%3].face.col;f.rocket(120+Math.random()*720,540,90+Math.random()*100,this.col,.75)});
  f.glitter(480,200,{count:40,speed:8,life:80,size:4,colors:[PO_GOLD,'#ffffff','#7df9ff','#ff7ae6'],gravity:.05});if(T>=3)f.mega(480,170,PO_GOLD,1.4,2,1.2)}
 // ENTER / Klick. true = Animation zu Ende (zurück zur Übersicht)
 advance(){const P=this.ph;
  if(P==='idle'){this.ph='tear';this.pt=0;return false}
  if(P==='tear'){if(this.pt<PO.tearAt-1)this.pt=PO.tearAt-1;return false}                // Wackeln überspringen
  if(P==='pop'){this.pt=Math.max(this.pt,PO.popEnd-1);return false}
  if(P==='show'){const imp=this.impAt(this.k);if(this.pt<imp-1){this.pt=imp-1;return false}if(this.pt>=imp+24){this.ph='out';this.pt=0}return false}   // erst Spannung überspringen, dann weiter
  if(P==='sum')return this.pt>20;
  return false}
 // ---- Lage der Karten ----
 pose(i){const P=this.ph,t=this.pt,k=this.k;let p;
  if(P==='idle'||P==='tear')return null;
  if(P==='pop'){if(t<i*PO.popGap)return null;const e=poEo(poCl((t-i*PO.popGap)/PO.popLen));p=poLp(PO_OPEN,poRow(i),e);p.y-=Math.sin(e*Math.PI)*80;p.r=(1-e)*(i-1)*.7;p.face=0;return p}
  if(P==='sum'){p=poLp(poMini(i),poSum(i),poEo(poCl(t/30)));p.face=1;return p}
  if(i<k){p=poMini(i);p.face=1;return p}
  if(i>k){p=k===0&&P==='show'?poLp(poRow(i),poMini(i),poEi(poCl(t/26))):poMini(i);p.face=0;return p}
  if(P==='out'){p=poLp(PO_BIG,poMini(i),poEi(poCl(t/PO.out)));p.face=1;return p}
  const hold=this.holdOf(k),imp=this.impAt(k),T=this.items[i].tier;p=poLp(k===0?poRow(i):poMini(i),PO_BIG,poEo(poCl(t/PO.fly)));
  if(t>PO.fly){const amp=poCl((t-PO.fly)/hold)*(2+T*1.8)*(t<PO.fly+hold?1:.3);p.dx=Math.sin(t*1.9)*amp;p.dy=Math.cos(t*2.3)*amp*.7}     // Wackeln wird stärker
  p.face=poEi(poCl((t-PO.fly-hold)/PO.flip));if(t>=imp){const z=Math.max(0,1-(t-imp)/14)*.12;p.w*=1+z;p.h*=1+z}   // Einschlag: kurzes Aufplustern
  return p}
 // ---- Zeichnen ----
 draw(g,hud,u){const n=performance.now();this.update(this._n==null?1:Math.min(3,(n-this._n)/16.6667));this._n=n;const fa=this.a+this.acc,T=fa/60,P=this.ph,k=this.k,cur=P==='show'||P==='out'?this.items[k]:null;
  g.save();const bg=g.createRadialGradient(480,270,40,480,270,520);bg.addColorStop(0,'#1a1040');bg.addColorStop(1,'#04020a');g.globalAlpha=.92;g.fillStyle=bg;g.fillRect(0,0,W,H);g.globalAlpha=1;
  if(this.shake>0)g.translate((Math.random()-.5)*this.shake*1.6,(Math.random()-.5)*this.shake*1.6);
  // Strahlen hinter allem
  if(P==='idle')this.rays(g,PO.cx,PO.cy,PO_GOLD,.10+.04*Math.sin(T*2),560,T);
  else if(P==='tear'||this.ray>0){const ch=P==='tear'&&this.pt<PO.tearAt?this.pt/PO.tearAt*.3:0;this.rays(g,PO.cx,P==='tear'&&this.pt<PO.tearAt?PO.cy:225,PO_GOLD,ch+this.ray*.3,760,T*2)}
  if(cur){const rv=poCl((this.pt-PO.fly-this.holdOf(k)+10)/20),a=[0,.12,.2,.3,.42][cur.tier]*(P==='out'?1-poCl(this.pt/PO.out):rv);this.rays(g,480,266,cur.face.col,a,640,T*1.4)}
  this.fw.draw(g);                                        // Feuerwerk + Funken (hinter Päckchen und Karten)
  this.drawPack(g,hud,fa,T);
  for(let i=0;i<3;i++)this.drawCard(g,hud,i,T);
  this.texts(g,hud,T);
  g.restore();
  if(this.flash>0){g.save();g.globalAlpha=Math.min(1,this.flash)*.6;g.fillStyle='#fff';g.fillRect(0,0,W,H);g.restore()}}
 rays(g,x,y,col,al,len,T,n=14){if(al<=.01)return;g.save();g.globalCompositeOperation='lighter';g.translate(x,y);g.rotate(T*.25);const gr=g.createRadialGradient(0,0,10,0,0,len);gr.addColorStop(0,poA(col,'aa'));gr.addColorStop(1,poA(col,'00'));g.fillStyle=gr;g.globalAlpha=Math.min(1,al);
  for(let i=0;i<n;i++){const a=i/n*6.2832,w=.065;g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a-w)*len,Math.sin(a-w)*len);g.lineTo(Math.cos(a+w)*len,Math.sin(a+w)*len);g.closePath();g.fill()}g.restore()}
 zig(w,h){const y0=-h/2+54,pts=[];for(let i=0;i<=8;i++)pts.push([-w/2-6+(w+12)*i/8,y0+(i%2?-7:7)]);return pts}   // Risslinie quer über das Päckchen
 piece(g,hud,top,pts,w,h){g.beginPath();if(top){g.moveTo(-w*2,-h*2);g.lineTo(w*2,-h*2);for(let i=pts.length-1;i>=0;i--)g.lineTo(pts[i][0],pts[i][1])}else{pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.lineTo(w*2,h*2);g.lineTo(-w*2,h*2)}g.closePath();g.clip();boosterArt(g,hud,0,0,w,h,'#ffc830',1,0)}
 drawPack(g,hud,fa,T){const t=this.pt,P=this.ph,w=PO.pw,h=PO.ph;let x=PO.cx,y=PO.cy,rot=0,sc=1;
  if(P==='pop'||P==='show'||P==='out'||P==='sum'){if(this.ta<0||this.ta>80)return}
  if(P==='idle'){const e=poCl(t/38),b=e<1?(1-Math.pow(1-e,3))+Math.sin(e*Math.PI*3)*(1-e)*.12:1;y=PO.cy-(1-b)*340+Math.sin(fa*.05)*6;rot=Math.sin(fa*.04)*.035}
  else if(P==='tear'&&t<PO.tearAt){const k=t/PO.tearAt,amp=k*k*8;x+=Math.sin(t*2.3)*amp;y+=Math.cos(t*3.1)*amp*.6;sc=1+k*.07;rot=Math.sin(t*1.7)*amp*.006}
  else sc=1.07;
  g.save();g.translate(x,y);g.rotate(rot);g.scale(sc,sc);
  const pts=this.zig(w,h),ripped=this.ta>=0;
  if(!ripped){boosterArt(g,hud,0,0,w,h,'#ffc830',1,0);
   if(P==='idle'||P==='tear'){g.save();g.beginPath();g.rect(-w/2,-h/2,w,h);g.clip();g.globalCompositeOperation='lighter';const sx=-w+((fa*(P==='idle'?1.6:4))%(w*3));const gr=g.createLinearGradient(sx,0,sx+60,0);gr.addColorStop(0,'#ffffff00');gr.addColorStop(.5,'#ffffff55');gr.addColorStop(1,'#ffffff00');g.fillStyle=gr;g.fillRect(-w/2,-h/2,w,h);g.restore()}
   if(P==='tear'&&t>12){const p=poCl((t-12)/(PO.tearAt-14)),m=Math.max(1,Math.round(pts.length*p));g.save();g.shadowColor='#fff2b0';g.shadowBlur=14;g.strokeStyle='#ffffff';g.lineWidth=3;g.beginPath();for(let i=0;i<m;i++)i?g.lineTo(pts[i][0],pts[i][1]):g.moveTo(pts[i][0],pts[i][1]);g.stroke();g.restore()}}
  else{const tt=this.ta;
   g.save();g.globalAlpha=1-poCl((tt-6)/26);g.translate(0,tt*tt*.06);this.piece(g,hud,false,pts,w,h);g.restore();                                  // Unterteil sinkt weg
   g.save();g.globalAlpha=1-poCl((tt-8)/40);g.translate(-tt*3.5,-tt*7+tt*tt*.28);g.rotate(-tt*.07);this.piece(g,hud,true,pts,w,h);g.restore()}    // Oberteil fliegt davon
  g.restore()}
 drawCard(g,hud,i,T){const p=this.pose(i);if(!p)return;const c=this.items[i],fc=c.face,col=fc.col;
  g.save();g.translate(p.x+(p.dx||0),p.y+(p.dy||0));g.rotate(p.r||0);
  if(p.w<80){const f=p.face>=.5;g.shadowColor=f?col:'#8f7bff';g.shadowBlur=8;g.fillStyle=f?poA(col,'66'):'#2a1f5a';g.strokeStyle=f?col:'#8f7bff';g.lineWidth=2;g.fillRect(-p.w/2,-p.h/2,p.w,p.h);g.strokeRect(-p.w/2,-p.h/2,p.w,p.h);g.shadowBlur=0;if(!f)hud.txt(g,'?',0,6,16,'#8f7bff','center')}
  else{
   if(p.face<.5&&c.tier>=2){const hint=this.ph==='pop'||(this.ph==='show'&&i===this.k);if(hint){g.save();g.globalCompositeOperation='lighter';const R=Math.max(p.w,p.h)*(.75+.1*Math.sin(T*6)),gr=g.createRadialGradient(0,0,10,0,0,R);gr.addColorStop(0,poA(col,c.tier>=3?'88':'44'));gr.addColorStop(1,poA(col,'00'));g.fillStyle=gr;g.fillRect(-R,-R,R*2,R*2);g.restore()}}   // ahnungsvolles Leuchten hinter verdeckten Top-Karten
   if(p.face>=.5){g.save();g.globalCompositeOperation='lighter';const R=Math.max(p.w,p.h)*.8,gr=g.createRadialGradient(0,0,10,0,0,R);gr.addColorStop(0,poA(col,'55'));gr.addColorStop(1,poA(col,'00'));g.fillStyle=gr;g.fillRect(-R,-R,R*2,R*2);g.restore()}
   card(g,hud,-p.w/2,-p.h/2,p.w,p.h,col,fc.t1,fc.t2,fc.t3,-Math.cos(p.face*Math.PI),fc.id?cardImg(fc.id):null)}
  g.restore()}
 texts(g,hud,T){const P=this.ph,t=this.pt,k=this.k,blink=.55+.45*Math.sin(T*8);
  if(P==='idle'){hud.txt(g,'DEIN BOOSTER',480,62,32,'#ffffff','center',PO_GOLD);g.save();g.globalAlpha=blink;hud.txt(g,'ENTER / KLICK – AUFREISSEN',480,476,17,'#ffffff','center',PO_GOLD);g.restore()}
  if(P==='show'||P==='out'){const r=this.items[k],imp=this.impAt(k);
   if(this.title&&this.title.text&&t>=imp&&P==='show'){const age=this.a-this.title.a,s=1+Math.max(0,1-age/12)*.9,big=r.tier>=4?48:r.tier>=3?42:36;g.save();g.translate(480,74);g.scale(s,s);g.rotate(Math.sin(age*.5)*.04*Math.max(0,1-age/30));hud.fancy(g,this.title.text,0,0,big,[r.face.col,'#ffffff'],'center',r.face.col,T,false,false,900,4);g.restore()}
   if(P==='show'&&t>=imp+8&&r.r.isNew){g.save();g.globalAlpha=.6+.4*Math.sin(T*7);hud.txt(g,'★ NEU ★',480,452,20,'#7dff9a','center','#7dff9a');g.restore()}
   if(P==='show'&&t>=imp+30){g.save();g.globalAlpha=blink;hud.txt(g,k<this.items.length-1?'ENTER – weiter':'ENTER – alle Preise ansehen',480,482,15,'#ffffff','center');g.restore()}
   else if(P==='show'&&t<imp-1&&t>PO.fly){g.save();g.globalAlpha=.5;hud.txt(g,'ENTER – überspringen',480,482,12,'#aab2e8','center');g.restore()}
   hud.txt(g,(Math.min(k,2)+1)+' / 3',900,34,16,'#aab2e8','center')}
  if(P==='sum'){hud.txt(g,'DEINE BELOHNUNGEN',480,58,30,'#ffffff','center',PO_GOLD);if(t>20){g.save();g.globalAlpha=blink;hud.txt(g,LOOT.packs>0?`ENTER – weiter (noch ${LOOT.packs} Booster)`:'ENTER – weiter',480,484,15,'#ffffff','center');g.restore()}}}
}
