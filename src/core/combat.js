import{COMBO_SCALE,METER,PHYS,GROUND,BARRIER,EFFECT,BOUNCE}from'./config.js';
import{Hitbox}from'./hitbox.js';
import{meleeHit}from'./melee.js';
import{hitSounds,comboStep}from'./sfx.js';
// Trefferauflösung pro Frame: Normals/Specials, Projektile, Projektil-Clash.
export function resolveCombat(game){
 const{p1,p2}=game;
 for(const[a,b]of[[p1,p2],[p2,p1]]){
  if(game.phase!=='fight'||b.state==='ko'||b.dead>0||a.dead>0)continue;
  const ah=a.activeHitbox();
  if(ah&&ah.rect.overlaps(b.hurtbox())&&!b.invulnerable())hit(game,a,b,ah.move,ah.rect,false)}
 for(const pr of game.projectiles){
  if(pr.dead||game.phase!=='fight')continue;const a=pr.owner,b=a===p1?p2:p1;
  if(b.state!=='ko'&&!(b.dead>0)&&pr.rect().overlaps(b.hurtbox())&&!b.invulnerable()){pr.dead=true;hit(game,a,b,pr.asMove(),pr.rect(),true)}}
 const ps=game.projectiles;
 for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
  if(ps[i].owner!==ps[j].owner&&!ps[i].dead&&!ps[j].dead&&ps[i].rect().overlaps(ps[j].rect())){
   ps[i].dead=true;ps[j].dead=true;game.fx.hit((ps[i].x+ps[j].x)/2,ps[i].y,2,'#ffffff',1)}}}
const bounceOf=(mv,isProj)=>mv.bounce||(isProj?BOUNCE.proj:mv.multi?BOUNCE.multi:mv.dmg<BOUNCE.mid?BOUNCE.L:mv.dmg<BOUNCE.heavy?BOUNCE.M:BOUNCE.H);
function hit(game,a,b,mv,rect,isProj){
 const hurt=b.hurtbox();
 const sx=(Math.max(rect.x,hurt.x)+Math.min(rect.x+rect.w,hurt.x+hurt.w))/2,sy=(Math.max(rect.y,hurt.y)+Math.min(rect.y+rect.h,hurt.y+hurt.h))/2;
 const col=a.char.glow||'#fff';
 const A=game.arena,pinned=(b.grounded||b.pop)&&A.sideAt(b.x)!==null; // Gegner steht an der Barriere (vor dem Treffer geprüft)
 if(!isProj){if(mv.multi)a.hitCd=mv.multi;else a.hitDone=true}
 a.contact=true;
 const def=b.char.def||1,mtr=a.char.meter||1;
 const power=mv.hstop>=11?3:mv.hstop>=8?2:1;
 if(game.melee)return meleeHit(game,a,b,mv,sx,sy,col,power,isProj);   // Melee: Prozent + Rückstoß statt HP
 // ---- Rüstung: steckt den Treffer ein (60 % Schaden), kein Hitstun, Move läuft weiter ----
 if(b.state==='attack'&&b.move&&b.move.armor&&b.mf>=b.move.armor[0]&&b.mf<=b.move.armor[1]){
  const ad=Math.max(1,Math.round(mv.dmg*a.dmgMul()*def*.6*COMBO_SCALE[Math.min(b.comboHits,COMBO_SCALE.length-1)]));
  b.hp-=ad;b.armorFlash=8;a.meter=Math.min(METER.max,a.meter+ad*.28*mtr);b.meter=Math.min(METER.max,b.meter+ad*.2);
  game.hitstop=Math.max(game.hitstop,Math.min(mv.hstop,6));game.shake=Math.max(game.shake,3);game.fx.block(sx,sy,'#ffd23f');game.fx.hit(sx,sy,1,'#ffd23f',a.facing);game.sfx('heavy_hit_impact',{vol:.6});
  if(b.hp<=0){b.hp=0;game.knockout(b,a)}return}
 // ---- Block ----
 if(b.isBlocking(mv)){
  const chip=Math.round(mv.dmg*a.dmgMul()*def*.1);b.hp=Math.max(1,b.hp-chip);
  b.blockCrouch=b.grounded&&b.input.dy>0;b.move=null;b.state='block';b.sf=0;b.stun=mv.bs;b.vx=a.facing*mv.pbb;
  if(pinned)a.vx=-a.facing*mv.pbb;
  if(pinned)A.hitWall(game,b,mv.dmg*a.dmgMul()*BARRIER.hitMul*BARRIER.blockMul,{launch:false});
  game.hitstop=Math.max(game.hitstop,Math.min(mv.hstop,6));
  a.meter=Math.min(METER.max,a.meter+mv.dmg*.05*mtr);b.meter=Math.min(METER.max,b.meter+mv.dmg*.04);
  game.fx.block(sx,sy,col);game.sfx('block_guard');game.camera.kick(.004);game.kickX+=a.facing*2;return}
 // ---- Treffer: Schadensskalierung pro Combo-Treffer ----
 const scale=Math.max(COMBO_SCALE[Math.min(b.comboHits,COMBO_SCALE.length-1)],mv.minScale||0);
 const dmg=Math.max(1,Math.round(mv.dmg*a.dmgMul()*scale*def));
 b.hp-=dmg;b.comboHits++;b.comboDmg+=dmg;b.comboShow={hits:b.comboHits,dmg:b.comboDmg,t:100};b.comboFlash=10;
 a.meter=Math.min(METER.max,a.meter+dmg*.28*mtr);b.meter=Math.min(METER.max,b.meter+dmg*.14);
 const air=!b.grounded;
 b.move=null;b.noGrav=false;
 const lastMulti=!mv.multi||a.mf>=mv.su+mv.ac-mv.multi;
 const launch=mv.launch&&lastMulti?mv.launch:null;
 if(launch||air||mv.hard){
  b.juggle=air?b.juggle+1:1;
  let vy=launch?launch.vy*(air?.8:1):-9,vx=launch?launch.vx:3;
  if(!launch&&!mv.hard&&b.pop){const bn=bounceOf(mv,isProj);vy=bn.vy*Math.max(.2,1-(GROUND-b.y)/BOUNCE.cap);vx=bn.vx}   // Treffer im Pop-up: sanfter Nachschub, kein Hochschaukeln
  if(b.juggle>PHYS.juggleMax)vy=Math.max(vy,2); // Juggle-Limit: danach fällt der Gegner
  if(launch||mv.hard)b.launched=true;           // Launcher/harter Treffer: keine Luft-Erholung mehr -> Knockdown bei der Landung
  b.state='airhit';b.stun=b.launched?9999:Math.max(mv.hs,34); // großzügiger Luft-Hitstun für Mehrfach-Combos
  if(mv.hard){b.state='tumble';vy=11;vx=3.2;b.hard=true}
  if(launch||mv.hard)b.pop=false;
  b.sf=0;b.vx=a.facing*vx;b.vy=vy;b.y=Math.min(b.y,GROUND-1)}
 else{ // Normaler Bodentreffer: Feder-Effekt -> Gegner hüpft in die Luft (Pop-up), Combo geht in der Luft weiter
  const bn=bounceOf(mv,isProj);
  b.juggle=1;b.pop=true;b.state='airhit';b.sf=0;b.stun=Math.max(mv.hs,34);b.vx=a.facing*bn.vx;b.vy=bn.vy;b.y=Math.min(b.y,GROUND-1);
  game.fx.ps.ring(b.x,GROUND-8,col,48+bn.vy*-3)}
 let broke=false;
 if(pinned&&b.hp>0){const heavy=launch||mv.hard?BARRIER.heavyMul:1;broke=A.hitWall(game,b,mv.dmg*a.dmgMul()*BARRIER.hitMul*heavy)}     // Wand nimmt Schaden; bricht sie, fliegt b hindurch
 if(!air&&pinned&&!broke&&!mv.multi)a.vx=-a.facing*mv.pb;
 game.hitstop=Math.max(game.hitstop,mv.hstop);game.shake=Math.max(game.shake,b.comboHits>=2?EFFECT.comboShake:mv.shake||power*1.5);
 game.fx.hit(sx,sy,power,col,a.facing);game.hitFeel(sx,sy,a.facing,power,dmg,col,{launch:!!launch,hard:!!mv.hard,hits:b.comboHits});
 game.sfxList(hitSounds(mv,{launch:!!launch,proj:isProj}));
 if(b.comboHits>=2){game.fx.combo(sx,sy,b.comboHits,col,a.facing);}
 if(b.hp<=0){b.hp=0;game.knockout(b,a)}}
