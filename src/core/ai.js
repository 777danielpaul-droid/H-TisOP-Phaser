import{InputBuffer}from'./input.js';
import{MELEE,GROUND}from'./config.js';
// Schwierigkeitsstufen. Alle Werte hier justierbar:
//  wait   = Pause zwischen Entscheidungen in Frames [min,max]     idle   = Chance, eine Entscheidung "zu verschlafen"
//  react  = Reaktionszeit in Frames, bevor geblockt werden kann    block  = Blockchance pro Angriff
//  combo  = Chance, nach einem Treffer weiterzumachen              maxChain = max. Folgeschritte (Chain/Launcher/Luft-Combo)
//  special/sup/dash = Anteil Specials / Hypers / Dashes            antiair = Chance auf Anti-Air   back = Chance auf Rückzug
//  aerial = Luft-Angriffschance pro Frame in der Luft              dmg = Schadensfaktor der KI
//  corner = Wie konsequent die KI einen Gegner an der Wand/in der Ecke bearbeitet (weniger Abwarten/Rückzug, Druck, Launcher) und selbst aus der Ecke ausbricht
export const AI_LEVELS=[
 {name:'LEICHT',wait:[75,140],idle:.4,react:24,block:.05,combo:.08,maxChain:1,special:.06,sup:0,dash:.03,jump:.004,antiair:.1,back:.3,aerial:.01,dmg:.7,corner:.12},
 {name:'NORMAL',wait:[42,85],idle:.2,react:13,block:.28,combo:.35,maxChain:2,special:.16,sup:.08,dash:.1,jump:.01,antiair:.35,back:.15,aerial:.03,dmg:.9,corner:.5},
 {name:'HART',wait:[24,50],idle:.06,react:7,block:.48,combo:.55,maxChain:4,special:.24,sup:.25,dash:.2,jump:.02,antiair:.6,back:.06,aerial:.06,dmg:1,corner:.85},
 // ALPTRAUM: kaum zu schlagen. Reaktion fast sofort (2 F), blockt ~92 % aller Angriffe, kaum Pausen, lange Combos, Hypers, volle Ecken-Taktik, +40 % Schaden.
 {name:'ALPTRAUM',wait:[8,20],idle:0,react:2,block:.92,combo:.95,maxChain:6,special:.28,sup:.3,dash:.25,jump:.03,antiair:.92,back:.02,aerial:.12,dmg:1.4,corner:1}];
// KI nutzt dieselbe Eingabe-Schnittstelle wie der Spieler (vereinfachte Special-Eingaben: Taste + Richtung).
export class AIController extends InputBuffer{
 constructor(level=0){super();this.keep={dx:0,dy:0,n:0};this.cd=0;this.setLevel(level)}
 setLevel(l){this.level=Math.max(0,Math.min(AI_LEVELS.length-1,l|0));this.P=AI_LEVELS[this.level];
  this.wait=this.P.wait[1];this.seen=null;this.seenP=null;this.seenAge=0;this.blockRoll=false;this.blockN=0;this.chain=0;this.keep={dx:0,dy:0,n:0}}
 tick(me,opp,game){
  const P=this.P,R=Math.random,pr=[];let dx=0,dy=0;
  if(game.phase!=='fight'){this.feed(0,0,[]);return}
  if(game.melee&&me.dead>0){this.feed(0,0,[]);return}
  if(game.melee&&this.meleeRecover(me,game))return;   // außerhalb der Plattform: zurückkommen hat Vorrang
  const fwd=opp.x>=me.x?1:-1,dist=Math.abs(opp.x-me.x),frozen=game.hitstop>0||game.superFlash>0;
  if(this.keep.n>0){this.keep.n--;dx=this.keep.dx;dy=this.keep.dy}
  const go=(btn,x=0,y=0,n=3)=>{if(btn)pr.push(btn);dx=x;dy=y;this.keep={dx:x,dy:y,n}};
  const walk=(x,y,n)=>{this.keep={dx:x,dy:y,n};dx=x;dy=y};
  if(this.cd>0)this.cd--;
  // --- Verteidigung: erst nach der Reaktionszeit blocken; sehr schnelle Angriffe kommen durch ---
  const om=opp.state==='attack'?opp.move:null,pj=game.projectiles.find(p=>p.owner===opp&&Math.abs(p.x-me.x)<230);
  if(om&&om!==this.seen){this.seen=om;this.seenAge=0;this.blockRoll=R()<P.block;this.blockN=om.su+om.ac+6}
  else if(pj&&pj!==this.seenP){this.seenP=pj;this.seen=null;this.seenAge=0;this.blockRoll=R()<P.block;this.blockN=26}
  else if(!om&&!pj)this.seen=null;
  if(om||pj)this.seenAge++;
  if(this.blockN>0)this.blockN--;
  if(this.blockRoll&&this.blockN>0&&this.seenAge>=P.react&&me.grounded&&['idle','walk','crouch','block','dash'].includes(me.state)){
   this.feed(-fwd,om&&om.lv==='low'?1:0,[],frozen);return}
  // --- Combo-Fortsetzung (gestuft: maxChain begrenzt die Länge) ---
  if(me.state==='attack'&&me.contact&&this.cd<=0){
   if(this.chain<P.maxChain){
    if(R()<P.combo){const mn=me.moveName,r=R();this.cd=3;this.chain++;
     if(mn==='5L'||mn==='2L')go(r<.5?'M':'H',0,r<.4?1:0);
     else if(mn==='5M'||mn==='2M')r<.55?go('H',0,1):go('S');
     else if(mn==='5H')go('S');
     else if(mn==='2H'){walk(fwd,-1,5)}
     else if(mn==='jL')go('M');else if(mn==='jM')go('H');
     else if((mn==='rising'||mn==='fireball'||mn==='rush')&&me.meter>=100&&R()<P.sup*3)go('SUP')}
    else this.chain=99}}
  else if(me.state==='air'&&!me.move&&this.cd<=0&&dist<140){
   if(!opp.grounded||opp.state==='airhit'||opp.state==='tumble'){if(R()<P.combo){this.cd=3;go('L')}}
   else if(R()<P.aerial){this.cd=10;go(R()<.25?'S':R()<.5?'M':'H')}}
  // --- Neutral: seltener und ruhiger entscheiden ---
  else if(this.wait>0)this.wait--;
  else if(!['attack','hit','block','knockdown','wakeup','airhit','tumble','ko'].includes(me.state)){
   const A=game.arena,oppGap=fwd>0?A.r-opp.x:opp.x-A.l,pin=oppGap<150&&(opp.grounded||opp.pop);                    // Gegner steht vor der Wand
   this.wait=Math.round((P.wait[0]+(R()*(P.wait[1]-P.wait[0])|0))*(pin?1-.45*P.corner:1));this.chain=0;const r=R();
   if(R()<P.idle*(pin?1-.85*P.corner:1))walk(0,0,18);                                          // abwarten
   else if(!opp.grounded&&!opp.pop&&dist<170&&me.grounded){if(R()<P.antiair)go('S',fwd,0,4)}
   else if(opp.state==='knockdown'||opp.state==='wakeup'){if(dist>100)walk(fwd,0,16);else go(r<.5?'M':'L')}
   else if(this.corner(me,opp,dist,fwd,go,walk,game)){}                                 // Ecke: Druck machen bzw. ausbrechen
   else if(this.tool(me,dist,fwd,go)){}                                  // figurentypische Moves (char.ai)
   else if(dist>300){if(r<P.special)go('S');else if(r<P.special+P.dash)go('DASH',fwd);else if(R()<P.jump*8)walk(fwd,-1,5);else walk(fwd,0,25)}
   else if(dist>150){
    if(r<P.special)go('S');else if(r<P.special+P.sup&&me.meter>=100)go('SUP');else if(r<P.special+P.sup+.12)go('S',0,1);
    else if(r<P.special+P.sup+.12+P.dash)go('DASH',fwd);else walk(fwd,0,14)}
   else if(dist>95){if(r<.35)go('M');else if(r<.5)go('M',0,1);else if(r<.65)go('H');else walk(fwd,0,8)}
   else{if(R()<P.back&&(fwd>0?me.x-game.arena.l:game.arena.r-me.x)>120)walk(-fwd,0,20);else if(r<.4)go('L');else if(r<.6)go('L',0,1);else if(r<.8)go('M');else go('H',0,1)}}
  // KI in der Luft: Luft-Special gelegentlich
  this.feed(dx,dy,pr,frozen)}
 // Melee: Die KI fällt nicht freiwillig von der Plattform. Draußen/unter der Kante: zur Mitte steuern, bei Absturz springen/dashen.
 // Am Rand wird nicht weiter nach außen gelaufen (kurz vor der Kante bremst sie).
 meleeRecover(me,game){const M=MELEE,mid=(M.pl+M.pr)/2,off=!me.onStage||me.under||me.y>GROUND+2,R=Math.random;
  if(['hit','block','airhit','tumble','knockdown','wakeup'].includes(me.state))return false;   // in Hitstun kann niemand steuern
  if(!off){const near=me.x<M.pl+34?-1:me.x>M.pr-34?1:0;
   if(near&&me.grounded&&(this.keep.dx===near||R()<.5)){this.keep={dx:-near,dy:0,n:6};this.feed(-near,0,[],game.hitstop>0);return true}   // Kante: zurück nach innen
   return false}
  const toMid=mid>=me.x?1:-1,pr=[],dy=0;
  if(me.state!=='recover'&&!me.recUsed&&me.airJumps===0&&me.vy>1&&me.y>GROUND-10&&me.y<GROUND+330&&R()<[.1,.2,.35,.6][this.level]){this.feed(toMid,-1,['S'],game.hitstop>0);return true}   // Doppelsprung verbraucht: Rettungssprung (Hoch + Special)
  if(me.vy>1&&me.y>GROUND-60){if(me.airJumps>0)pr.push('UP');else if(me.airDashes>0&&Math.abs(me.x-mid)>150&&R()<.3)pr.push('DASH')}   // fällt unter Plattformhöhe: Doppelsprung, danach Air-Dash zur Mitte
  this.feed(toMid,dy,pr,game.hitstop>0);return true}
 // Wand-Taktik: Steht der Gegner vor der Wand, setzt die KI nach (Dash, Projektil, Normals, Launcher = 1,5× Wandschaden). Steht sie selbst
 // mit dem Rücken zur Wand, bricht sie aus (Sprung über den Gegner) statt weiter zurückzuweichen. Chance skaliert mit P.corner (je Stufe).
 corner(me,opp,dist,fwd,go,walk,game){const P=this.P,A=game.arena,R=Math.random;if(!P.corner)return false;
  const oppGap=fwd>0?A.r-opp.x:opp.x-A.l,meGap=fwd>0?me.x-A.l:A.r-me.x;
  if(meGap<100&&dist<190&&R()<P.corner*.7){if(R()<.55)walk(fwd,-1,6);else go('M');return true}
  if(oppGap>=150||!(opp.grounded||opp.pop)||R()>=P.corner)return false;
  const r=R();
  if(dist>200){if(r<.45)go('DASH',fwd);else if(r<.65)go('S');else walk(fwd,0,20)}
  else if(dist>110){if(r<.3)go('M');else if(r<.5)go('S');else walk(fwd,0,10)}
  else{if(r<.25)go('L');else if(r<.4)go('L',0,1);else if(r<.65)go('M');else if(r<.85)go('H',0,1);else go('H')}
  return true}
 // Figurenspezifische Werkzeuge (Griff, Teleport, Falle ...): Liste char.ai = [{min,max,b,dx,dy,p}], Chance skaliert mit der Stufe
 tool(me,dist,fwd,go){const L=me.char.ai;if(!L)return false;const k=[.45,.8,1,1][this.level];
  for(const t of L){if(dist<t.min||dist>=t.max)continue;if(Math.random()<t.p*k){go(t.b,(t.dx||0)*fwd,t.dy||0,4);return true}}return false}
}
