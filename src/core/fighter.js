import{GROUND,PHYS,METER,BARRIER,WALL_L,WALL_R,BOUNCE,MELEE,SPAM}from'./config.js';
import{Hitbox}from'./hitbox.js';
import{buildMoves}from'./moves.js';
import{strike,swingSound}from'./sfx.js';
const FACE_STATES=['idle','walk','crouch'];
const RANK={L:1,M:2,H:3};
let UID=0;
// Zustände: idle walk crouch air dash airdash attack hit block airhit tumble knockdown wakeup ko win
export class Fighter{
 constructor({char,x,facing,input}){this.id=UID++;this.char=char;this.skin=0;this.input=input;this.moves=buildMoves(char);
  this.maxHp=char.hp;this.startX=x;this.startFacing=facing;this.wins=0;this.meter=0;this.trail=[];this.comboShow={hits:0,dmg:0,t:0};this.reset()}
 // Melee-Felder: pct = Schaden in %, stocks = Leben, dead = Frames bis Respawn, inv = Unverwundbarkeit, hover = Schweben auf der Respawn-Plattform, onStage/under = Boden unter den Füßen?
 reset(){Object.assign(this,{x:this.startX,y:GROUND,vx:0,vy:0,facing:this.startFacing,hp:this.maxHp,state:'idle',sf:0,mf:0,move:null,moveName:'',
  hitDone:false,contact:false,hitCd:0,stun:0,coyote:0,airJumps:this.maxAJ,airDashes:1,launched:false,chainLen:0,comboHits:0,comboDmg:0,juggle:0,pop:false,hard:false,landLag:0,dashDir:0,
  noGrav:false,kdFrames:0,blockCrouch:false,anim:'idle',animU:0,_mo:0,spam:{btn:'',n:0,t:999},
  pct:0,stocks:0,dead:0,inv:0,hover:0,onStage:true,under:false,recUsed:false});this.trail.length=0;this.comboShow={hits:0,dmg:0,t:0}}
 // Kämpfer wechseln (Menü): neue Stats + Moves, danach Zurücksetzen
 setChar(char,skin=0){this.char=char;this.skin=skin|0;this.moves=buildMoves(char);this.maxHp=char.hp;this.reset()}
 get grounded(){return this.y>=GROUND&&this.onStage&&!this.under}   // Melee: nur auf der Plattform (onStage), nicht darunter (under) -> sonst fällt man
 get maxAJ(){const a=this.char.airJumps;return a===undefined?1:a} // Luft-Sprünge pro Luftphase (Figurenwert)
 // Schadensfaktor: Charakter-Wert x Schwierigkeits-Faktor der KI (falls die Eingabe eine KI ist)
 dmgMul(){return this.char.dmg*((this.input&&this.input.P&&this.input.P.dmg)||1)}
 setState(s){this.state=s;this.sf=0}
 // ---------- Boxen ----------
 hurtbox(){const s=this.state;let w=52,h=150;
  if(s==='knockdown'||(s==='ko'&&this.grounded)){w=140;h=38}
  else if(s==='crouch'||(s==='attack'&&this.move&&this.move.crouch)||(s==='block'&&this.blockCrouch))h=96;
  else if(!this.grounded)h=132;
  const z=this.char.size||1;w*=z;if(s!=='knockdown'&&!(s==='ko'&&this.grounded))h*=z;
  const ext=this.pop&&s==='airhit'&&GROUND-this.y<BOUNCE.reach?GROUND-this.y:0;   // Pop-up: Füße sind noch nah am Boden -> Hurtbox reicht bis zum Boden, auch Tiefschläge treffen
  return new Hitbox(this.x-w/2,this.y-h,w,h+ext)}
 activeHitbox(){const m=this.move;if(this.state!=='attack'||!m||!m.box)return null;
  if(this.mf<m.su||this.mf>=m.su+m.ac)return null;
  if(m.multi){if(this.hitCd>0)return null}else if(this.hitDone)return null;
  return{move:m,rect:Hitbox.fromBox(m.box,this)}}
 invulnerable(){const s=this.state;
  if(this.inv>0)return true;   // Melee: nach dem Respawn kurz unverwundbar
  if(s==='knockdown'||s==='wakeup'||s==='win')return true;
  if(s==='attack'&&this.move&&this.move.inv&&this.mf>=this.move.inv[0]&&this.mf<=this.move.inv[1])return true;
  if(s==='dash'&&this.dashDir!==this.facing&&this.sf<6)return true;return false}
 isBlocking(m){const s=this.state;if(!['idle','walk','crouch','air','block'].includes(s))return false;
  if(s==='block')return true;
  if(this.input.dx*this.facing>=0)return false; // Zurückhalten = Block
  if(!this.grounded)return m.lv!=='low';
  const crouch=this.input.dy>0;
  if(m.lv==='low')return crouch;if(m.lv==='high')return !crouch;return true}
 // ---------- Frame-Update ----------
 update(opp,game){
  this.sf++;
  if(this.inv>0)this.inv--;
  if(this.hover>0){const i=this.input;this.hover--;if(i&&(i.dx||i.dy||(i.buf&&i.buf.length)))this.hover=0;   // Respawn: schwebt auf der Plattform, bis er sich bewegt/angreift (oder die Zeit abläuft)
   if(this.hover>0){this.noGrav=true;this.vy=0;this.vx*=.85}else this.noGrav=false}
  if(this.comboShow.t>0)this.comboShow.t--;
  if(this.spam.t<999)this.spam.t++;
  if(this.comboFlash>0)this.comboFlash--;
  if(FACE_STATES.includes(this.state))this.facing=opp.x>=this.x?1:-1;
  if(this.grounded)this.coyote=PHYS.coyote;else if(this.coyote>0)this.coyote--;
  switch(this.state){
   case'attack':this.tickAttack(opp,game);break;
   case'hit':case'block':this.vx*=.84;if(--this.stun<=0){this.endCombo();this.blockCrouch=false;this.setState('idle')}break;
   case'airhit':if(this.pop)this.vx*=BOUNCE.drag;if(--this.stun<=0){this.endCombo();this.pop=false;const M=!!game.melee;this.airJumps=M?this.maxAJ:0;this.airDashes=M?1:0;if(M)this.recUsed=false;this.setState('air')}break;   // Melee: nach dem Hitstun darf man zurückspringen/dashen
   case'knockdown':if(this.sf>=this.kdFrames)this.setState('wakeup');break;
   case'wakeup':if(this.sf>=18)this.setState('idle');break;
   case'dash':this.tickDash(game);break;
   case'airdash':this.tickAirDash(game);break;
   case'recover':this.tickRecover(game);break;
   case'tumble':case'ko':case'win':break;
   default:this.free(game)}
  this.physics(game)}
 // ---------- Freie Aktionen ----------
 free(game){const i=this.input;
  if(this.landLag>0)this.landLag--;
  if(this.tryRecover(game))return;
  if(this.tryAttack(game))return;
  if(this.tryDash(game))return;
  this.tryJump(game);
  const dx=i.dx;
  if(!this.grounded){if(this.state!=='air')this.setState('air');this.vx+=(dx*PHYS.airDrift*this.char.walk-this.vx)*(dx?.18:.02);return}
  if(i.dy>0){if(this.state!=='crouch')this.setState('crouch');this.vx=0;return}
  if(dx){const rel=dx*this.facing;this.vx=dx*(rel>0?PHYS.walk:PHYS.back)*this.char.walk;if(this.state!=='walk')this.setState('walk')}
  else{this.vx=0;if(this.state!=='idle')this.setState('idle')}}
 // Sprung mit Jump-Buffering + Coyote-Time + Doppelsprung
 tryJump(game){const i=this.input,g=this.grounded;
  const want=i.pressed('UP',PHYS.jumpBuffer)||(i.dy<0&&g&&this.sf>1);
  if(!want)return false;
  if(g||this.coyote>0){i.consume('UP');this.vy=PHYS.jumpV*(this.char.jump||1);this.vx=i.dx*PHYS.walk*1.1*this.char.walk;this.y=Math.min(this.y,GROUND-1);
   this.coyote=0;this.airJumps=this.maxAJ;this.setState('air');game.fx.jump(this.x,GROUND);return true}
  if(this.airJumps>0&&i.pressed('UP',2)){i.consume('UP');this.vy=PHYS.airJumpV*(this.char.jump||1);this.vx=i.dx*PHYS.walk*1.1*this.char.walk;this.airJumps--;
   this.setState('air');game.fx.ps.ring(this.x,this.y-10,'#9a8bff',40);return true}
  return false}
 tryDash(game){const i=this.input;const dd=i.takeDash(),btn=i.pressed('DASH',3);if(!dd&&!btn)return false;if(btn)i.consume('DASH');
  const dir=dd||(i.dx||this.facing);
  if(this.grounded){this.dashDir=dir;this.vx=dir*PHYS.dash*(this.char.dash||1)*(dir===this.facing?1:.85);this.setState('dash');game.fx.dash(this.x,this.y,dir);game.sfx(dir===this.facing?'dash':'dodge',{rate:.72,vol:.8});return true}
  if(this.airDashes>0){this.airDashes--;this.dashDir=dir;this.vx=dir*PHYS.airDash*(this.char.dash||1);this.vy=i.dy<0?-3.5:i.dy>0?5:0;this.noGrav=true;this.setState('airdash');game.fx.dash(this.x,this.y-60,dir);game.sfx('dash',{vol:.7,rate:.8});return true}
  return false}
 tickDash(game){if(this.sf>4&&(this.tryAttack(game)))return;if(this.sf>3&&this.tryJump(game))return;
  if(this.sf>=PHYS.dashFrames){this.vx*=.3;this.setState('idle')}}
 // Melee: Rettungssprung (Hoch + Special in der Luft). Einmal pro Luftphase (Landung, Treffer oder Respawn geben ihn zurück). Kurzes Verharren, dann steiler Aufstieg, seitlich steuerbar;
 // danach ohne Doppelsprung/Air-Dash weiter (hilflos) -> reicht nur, wenn man nicht zu weit draussen ist.
 tryRecover(game){const i=this.input;if(!game.melee||this.grounded||this.recUsed)return false;
  if(!(i.dy<0&&i.pressed('S')))return false;
  i.consume('S');i.consume('UP');this.recUsed=true;this.move=null;this.moveName='';this.vy=0;this.vx*=.3;this.noGrav=true;if(i.dx)this.facing=i.dx;this.setState('recover');
  const gl=this.char.glow||'#fff';game.fx.ps.ring(this.x,this.y-70,gl,100);game.sfx('whoosh_heavy',{vol:.8,rate:1.15});return true}
 tickRecover(game){const R=MELEE.rec,i=this.input;
  if(this.grounded){this.land(game);return}                       // auf der Plattform angekommen
  if(this.sf<=R.start){this.vy=0;this.vx*=.8;return}               // Ansprung: kurz in der Luft verharren
  const t=this.sf-R.start;
  if(t>R.frames){this.noGrav=false;this.airJumps=0;this.airDashes=0;this.setState('air');return}   // Aufstieg vorbei: hilflos weiterfallen
  this.vy=R.vy+R.decay*t;this.vx+=(i.dx*R.vx-this.vx)*.25;if(i.dx)this.facing=i.dx;
  if(t%3===1)game.fx.ps.ring(this.x,this.y-60,this.char.glow||'#fff',46)}
 tickAirDash(game){if(this.sf>5&&this.tryAttack(game)){this.noGrav=false;return}
  if(this.sf>=PHYS.airDashFrames){this.noGrav=false;this.vx*=.5;this.setState('air')}}
 // ---------- Moves ----------
 select(b){const i=this.input,g=this.grounded,rel=i.dx*this.facing;this._btn=b;
  if(b==='SUP')return'super';
  if(b==='S'){if(!g)return'airsp';return rel>0?'rising':rel<0?'back':i.dy>0?'rush':'fireball'}
  if(g){const mo=i.motion('dp',this.facing)?'rising':i.motion('qcf',this.facing)?'fireball':i.motion('qcb',this.facing)?'rush':null;
   if(mo){this._mo=1;return mo}
   if(i.dy<=0&&rel>0&&(b==='M'||b==='H'))return'6'+b; // Command-Normal: vorwärts + K / L
   return(i.dy>0?'2':'5')+b}
  return'j'+b}
 canUse(n){const m=this.moves[n];if(!m)return false;if(m.cost&&this.meter<m.cost)return false;if(m.air&&this.grounded)return false;return true}
 rank(n){const m=this.moves[n];if(m.special)return m.super?30:20;return RANK[n.slice(-1)]||0}
 // Spam-Sperre: dieselbe Angriffstaste höchstens SPAM.max Mal in Folge (Hyper ausgenommen)
 spamLocked(b){const s=this.spam;return b!=='SUP'&&s.btn===b&&s.n>=SPAM.max&&s.t<SPAM.reset}
 noteSpam(b){if(!b||b==='SUP')return;const s=this.spam;if(s.btn===b&&s.t<SPAM.reset)s.n++;else{s.btn=b;s.n=1}s.t=0}
 tryAttack(game){const i=this.input;
  for(const b of['SUP','H','M','L','S']){if(!i.pressed(b))continue;if(this.spamLocked(b))continue;const n=this.select(b);
   if(n&&this.canUse(n)){i.consume(b);this.startMove(n,game);return true}}return false}
 startMove(n,game,cancel=false){let m=this.moves[n];this.noteSpam(this._btn);
  if(m.v){const vv=m.v[this._btn==='S'?'M':this._btn];if(vv)m={...m,...vv}} // Stärke-Variante (J/K/L) bei Specials
  this.chainLen=cancel?this.chainLen+1:0;this.move=m;this.moveName=n;this.mf=0;this.hitDone=false;this.contact=false;this.hitCd=0;this.noGrav=false;
  if(this._mo){this.input.hist.length=0;this._mo=0}
  if(!m.air&&this.grounded)this.vx=0;
  if(m.cost){this.meter-=m.cost;game.startSuper(this)}
  this.setState('attack')}
 tickAttack(opp,game){const m=this.move;this.mf++;if(this.hitCd>0)this.hitCd--;
  if(m.box&&!m.super){if(this.mf===m.su){const[n,o]=swingSound(m);game.sfx(n,o);if(this.moveName==='rush')game.sfx('dash',{vol:.7,rate:1.1})}                    // Schwung / Rush
   else if(this.mf===m.su+m.ac&&!this.contact&&m.ac<=12&&strike(m).s>=2)game.sfx('whiff_miss',{vol:.45})}                                              // Fehlschlag (nur mittlere/schwere Normals)
  if(m.fx==='tails'&&this.mf>=m.su&&this.mf<m.su+m.ac&&(this.mf-m.su)%multiOr(m)===0){game.fx.ps.ring(this.x+this.facing*60,this.y-72,this.char.glow||'#fff',110);game.sfx('whoosh_heavy',{vol:.45,rate:.9+Math.random()*.3})}   // Neunschwanz-Inferno: pro Schwanz ein Ring + Rauschen
  if(m.fx==='bolt'){   // Blitz-Kamehameha: Einschlag (Blitz+Wumms), Abschuss (Schub), währenddessen Knistern/Druckringe
   if(this.mf===6){game.flash=Math.max(game.flash,8);game.flashColor='#bfe6ff';game.shake=Math.max(game.shake,12);game.sfx('heavy_hit_impact');game.sfx('ground_slam',{vol:.7})}
   if(this.mf===m.su){game.flash=Math.max(game.flash,5);game.flashColor='#8fd8ff';game.shake=Math.max(game.shake,9);game.sfx('whoosh_heavy',{vol:.9,rate:.6})}
   if(this.mf>m.su&&this.mf<m.su+m.ac&&(this.mf-m.su)%8===0){game.fx.ps.ring(this.x+this.facing*80,this.y-105,'#8fd8ff',90);game.sfx('whoosh_heavy',{vol:.4,rate:.8+Math.random()*.3})}}
  if(m.fx==='breath'&&this.mf>=m.su&&this.mf<m.su+m.ac&&(this.mf-m.su)%10===0){game.fx.ps.ring(this.x+this.facing*64,this.y-158,'#ffc531',70);game.sfx('whoosh_heavy',{vol:.4,rate:.7+Math.random()*.2})}   // Drachen-Feuersturm: Rauschen + Druckring am Maul
  if(m.lunge){if(this.mf<=m.su+m.ac)this.vx=this.facing*m.lunge;else this.vx*=.6}
  else if(!m.air&&this.grounded)this.vx*=.7;
  if(m.dive&&this.mf===m.su){this.vx=this.facing*m.dive.vx;this.vy=m.dive.vy}
  if(m.tp&&this.mf===m.su)this.teleport(m.tp,opp,game);
  if(m.proj)for(const d of[].concat(m.proj))if(this.mf===d.frame)game.spawnProjectile(this,m,d);
  if(this.contact&&this.tryCancel(game))return;
  if(this.mf>=m.su+m.ac+m.rc)this.endMove()}
 // Cancels (nur nach Kontakt): Chain mit steigendem Rang UND Stance-Wechsel (5L→2L→5M→2M→5H ...), Special-/Hyper-Cancel,
 // Jump-Cancel (Launcher), in der Luft Doppelsprung-/Air-Dash-Cancel für lange Mehrfach-Combos. chainLen begrenzt Endlos-Ketten.
 tryCancel(game){const i=this.input,m=this.move,B=PHYS.cancelBuffer;
  if(m.jc&&(i.dy<0||i.pressed('UP',B))){i.consume('UP');this.move=null;this.vy=(m.launch?PHYS.superJumpV:PHYS.hopV)*(this.char.jump||1);this.vx=i.dx*PHYS.walk*1.2;   // Launcher: hoher Sprung; normale Treffer: Sprungabbruch in Reichweite des gefederten Gegners
   this.y=GROUND-1;
   this.airJumps=this.maxAJ;this.airDashes=1;this.setState('air');game.fx.jump(this.x,GROUND);return true}
  if(m.air){
   if(this.airJumps>0&&i.pressed('UP',3)){i.consume('UP');this.move=null;this.vy=PHYS.airJumpV*(this.char.jump||1);this.vx=i.dx*PHYS.walk*1.1*this.char.walk;this.airJumps--;
    this.setState('air');game.fx.ps.ring(this.x,this.y-10,'#9a8bff',40);return true}
   if(this.airDashes>0&&(i.pressed('DASH',4)||i.dashEv)){this.move=null;if(this.tryDash(game))return true;this.move=m}}
  for(const b of['SUP','H','M','L','S']){if(!i.pressed(b,B))continue;if(this.spamLocked(b))continue;const n=this.select(b);if(!n||!this.canUse(n))continue;const nm=this.moves[n];
   let ok;if(nm.special)ok=m.special?(nm.super&&m.spc):m.spc;
   else{const rn=this.rank(n),rc=this.rank(this.moveName);ok=!m.special&&nm.air===m.air&&this.chainLen<6&&(rn>rc||(rn===rc&&n!==this.moveName&&this.chainLen<3))}
   if(ok){i.consume(b);this.startMove(n,game,true);return true}}return false}
 // Teleport: rel 'opp' = relativ zum Gegner (off>0 = auf die abgewandte Seite, flip = dreht sich um), rel 'self' = relativ zu sich (off<0 = zurück)
 teleport(t,opp,game){const gl=this.char.glow||'#fff';game.fx.ps.ring(this.x,this.y-80,gl,90);game.sfx('whoosh_heavy',{rate:.8,vol:.6});
  let nx=(t.rel==='opp'?opp.x:this.x)+this.facing*t.off;nx=Math.max(game.arena.l,Math.min(game.arena.r,nx));this.x=nx;if(t.flip)this.facing=-this.facing;
  game.fx.ps.ring(this.x,this.y-80,gl,90)}
 endMove(){this.move=null;this.setState(this.grounded?'idle':'air')}
 endCombo(){if(this.comboHits>0)this.comboShow={hits:this.comboHits,dmg:this.comboDmg,t:100};this.comboHits=0;this.comboDmg=0;this.juggle=0}
 // ---------- Physik ----------
 physics(game){const M=game.melee;
  if(!this.noGrav&&(!this.grounded||this.vy<0))this.vy+=this.state==='airhit'?PHYS.gravity*(this.pop?BOUNCE.grav:.8):PHYS.gravity;
  if(M&&this.vy>26)this.vy=26;   // Fallgeschwindigkeit begrenzen
  const px=this.x;this.x+=this.vx;this.y+=this.vy;
  if(M)this.onStage=this.x>=MELEE.pl&&this.x<=MELEE.pr;
  const A=game.arena;
  if(this.x<A.l||this.x>A.r){const fast=Math.abs(this.vx),hurt=['hit','airhit','tumble','ko'].includes(this.state);this.x=this.x<A.l?A.l:A.r;
   if(hurt&&fast>BARRIER.impactV){A.hitWall(game,this,(fast-BARRIER.impactV+1)*BARRIER.impactMul);if(this.x===A.l||this.x===A.r)this.vx=0}} // Aufprall auf die Barriere
  this.ceiling(game,px);
  if(M){   // offene Plattform: landen nur über der Plattform und nicht von unten; wer darunter ist, fällt weiter (bis zur Blast-Zone)
   if(this.y>=GROUND&&this.onStage&&!this.under){const fall=this.vy>0;this.y=GROUND;if(fall)this.land(game);this.vy=0}
   else if(this.y>GROUND+1)this.under=true;
   if(this.y<GROUND)this.under=false}
  else if(this.y>=GROUND){const fall=this.vy>0;this.y=GROUND;if(fall)this.land(game);this.vy=0}}
 // Melee: nach einem Stock-Verlust zurück ins Spiel – schwebt über der Mitte, kurz unverwundbar, mit allen Sprüngen
 respawn(x,y,facing){Object.assign(this,{x,y,vx:0,vy:0,facing,state:'air',sf:0,mf:0,move:null,moveName:'',hitDone:false,contact:false,hitCd:0,stun:0,launched:false,hard:false,noGrav:true,
  comboHits:0,comboDmg:0,juggle:0,pct:0,dead:0,hover:MELEE.hover,inv:MELEE.inv,onStage:true,under:false,recUsed:false,airJumps:this.maxAJ,airDashes:1,landLag:0,blockCrouch:false,meter:Math.min(this.meter,100)});
  this.comboShow={hits:0,dmg:0,t:0};this.trail.length=0;this.input.clear()}
 // Decke im Gebäude: Kopf (Höhe der Luft-Hurtbox) darf die Unterkante der Decke nicht überschreiten. Vom Hof aus gilt die Decke als Türsturz:
 // Wer mit dem Kopf darüber liegt, kommt nicht durch die Bresche (wird an der Wandlinie gestoppt), statt in die Decke zu "ploppen".
 ceiling(game,px){const A=game.arena,side=A.inside(this.x);if(!side)return;const hh=132*(this.char.size||1),lim=A.ceil+hh;if(this.y>=lim)return;
  if(!A.inside(px)){this.x=side==='L'?WALL_L:WALL_R;if(this.vx*(side==='L'?-1:1)>0)this.vx=0;return}
  const hit=this.vy<-3;this.y=lim;if(this.vy<0)this.vy=1;
  if(hit){game.particles.burst(this.x,A.ceil+4,{count:7,speed:4,color:'#d8c8a8',life:16,size:2.4,angle:Math.PI/2,spread:1.4,gravity:.25});game.shake=Math.max(game.shake,2);game.sfx('body_fall',{vol:.3,rate:1.4})}}
 land(game){const s=this.state;
  if(s==='airhit'&&this.pop&&!this.launched&&this.hp>0){   // Pop-up ohne Launcher/Knockdown: weich landen, kurze Erholung statt Knockdown
   this.pop=false;this.vx=0;this.stun=BOUNCE.land;this.setState('hit');game.fx.land(this.x,GROUND,false);game.sfx('land',{vol:.5});return}
  if(s==='airhit'||s==='tumble'){this.pop=false;this.launched=false;this.endCombo();this.kdFrames=this.hard?52:36;game.sfx(this.hard?'ground_slam':'body_fall',{vol:this.hard?.9:.85});this.hard=false;this.vx=0;this.setState('knockdown');game.fx.land(this.x,GROUND,true);game.shake=Math.max(game.shake,6);return}
  if(s==='ko'){this.vx=0;game.fx.land(this.x,GROUND,true);game.sfx('body_fall',{vol:.7});return}
  if(s==='attack'){const m=this.move;if(m&&m.air){this.move=null;this.landLag=m.land||4;this.setState('idle')}}
  else if(s==='airdash'){this.noGrav=false;this.setState('idle')}
  else if(s==='recover'){this.noGrav=false;this.setState('idle');this.landLag=3}
  else if(s==='air'){this.setState('idle');this.landLag=3}
  this.recUsed=false;this.airJumps=this.maxAJ;this.airDashes=1;this.vx*=.3;game.fx.land(this.x,GROUND,false);game.sfx('land',{vol:.6})}
 // ---------- Animation (für den Renderer) ----------
 updateAnim(){const s=this.state,m=this.move;this.animU=0;
  switch(s){
   case'idle':this.anim='idle';break;case'walk':this.anim='walk';break;case'crouch':this.anim='crouch';break;case'air':this.anim='air';this.animU=Math.max(0,Math.min(.999,(this.vy+18)/36));break;   // Sprung-Frames nach Flugbahn (steigen -> Scheitel -> fallen)
   case'dash':this.anim='dash';break;case'airdash':case'recover':this.anim='airdash';break;
   case'attack':this.anim=m?m.anim:'idle';this.animU=m?Math.min(1,this.mf/(m.su+m.ac+Math.max(m.rc,6))):0;break;
   case'hit':this.anim='hit';this.animU=Math.min(1,this.sf/12);break;
   case'block':this.anim=this.blockCrouch?'cblock':'block';break;
   case'airhit':case'tumble':
    if(s==='airhit'&&this.pop&&this.sf<14){this.anim='hit';this.animU=Math.min(1,this.sf/12)}   // Pop-up: erst Treffer-Pose (Rückstoß), danach Flug-Pose
    else{this.anim='airhit';this.animU=Math.min(1,this.sf/34)}break;
   case'knockdown':this.anim='kd';this.animU=Math.min(1,this.sf/16);break;
   case'wakeup':this.anim='wakeup';this.animU=Math.min(1,this.sf/18);break;
   case'ko':this.anim=this.grounded?(this.char.defeat?'defeat':'kd'):'airhit';this.animU=Math.min(1,this.sf/(this.grounded?16:34));break;
   case'win':this.anim='win';this.animU=Math.min(.999,this.sf/180);break;default:this.anim='idle'}
  const fast=s==='dash'||s==='airdash'||s==='recover'||(s==='attack'&&m&&m.lunge);
  for(const t of this.trail)t.age++;this.trail=this.trail.filter(t=>t.age<14);
  if(fast&&this.sf%3===0)this.trail.push({x:this.x,y:this.y,facing:this.facing,anim:this.anim,animU:this.animU,sf:this.sf,state:s,char:this.char,move:null,age:0})}
}
const multiOr=m=>m.multi||6;
