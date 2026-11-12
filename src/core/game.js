import{Arena}from'./barrier.js';
import{Camera}from'./camera.js';
import{resolveCombat}from'./combat.js';
import{CAMERA,EFFECT,MELEE,ROUND,W}from'./config.js';
import{Effects}from'./effects.js';
import{meleeBlast,meleeRespawn,meleeWinnerOnTime}from'./melee.js';

import{ParticleSystem}from'./particles.js';
import{Projectile}from'./projectile.js';
import{Story}from'./story.js';

import{Sound}from'../render/audio.js';

import{R}from'../render/sprites.js';
export const SUPER_FRAMES=42;   // Länge des Super-Freeze (muss zu hud.flash passen)
// Spielzustand + fester 60-Hz-Schritt. Keine DOM-Abhängigkeit -> headless testbar.
// Phasen: intro -> fight -> ko -> result -> (intro | match)
export class Game{
 constructor(p1,p2){this.p1=p1;this.p2=p2;this.fighters=[p1,p2];this.particles=new ParticleSystem();this.fx=new Effects(this.particles);
  this.camera=new Camera();this.arena=new Arena();this.stageIndex=0;this.melee=null;this.meleeOn=false;this.meleeStocks=MELEE.stocks;   // melee = Regeln des laufenden Melee-Matches (oder null)
  this.arcade=null;this.debug=false;this.round=1;this.frame=0;this.flash=0;this.flashColor='#fff';
  this.pops=[];this.kickX=0;this.kickY=0;this.aberr=0;this.impact=null;this.slow=0;this.timeScale=1;this.celeb=null;this.particles.onBoom=()=>this.sfx('fw_rocket',{vol:.65,rate:.92+Math.random()*.2});this.story=null;this.dummy={x:0,y:0,state:'idle',grounded:true,hp:1};this.startRound()}
 // Story-Modus: Gegner eines Kämpfers (Spieler -> nächster Mantis, Mantis -> Spieler)
 foe(f){if(!this.story)return f===this.p1?this.p2:this.p1;if(f!==this.p1)return this.p1;const n=this.story.nearest(f);if(n)return n;this.dummy.x=f.x+500;return this.dummy}
 // Sound: game.audio (render/audio.js) ist im Test/headless null -> kein Ton. sfx() für einzelne Sounds, sfxList() für Listen aus core/sfx.js
 sfx(n,o){if(this.audio)this.audio.play(n,o)}
 sfxList(l){if(this.audio)for(const[n,o]of l)this.audio.play(n,o)}
 startRound(){this.cineW=0;this.cineT=0;this.arena.reset();this.pops=[];this.kickX=this.kickY=0;this.aberr=0;this.impact=null;this.celeb=null;this.slow=0;this.timeScale=1;this.sfx('ui_round_start',{vol:.8});this.projectiles=[];this.phase='intro';this.pf=0;this.timeFrames=ROUND.time*60;this.hitstop=0;this.superFlash=0;this.superOwner=null;this.shake=0;this.flash=0;this.winner=null;this.timedOut=false;
  for(const f of this.fighters){f.reset();f.input.clear()}
  if(this.story){this.story.begin();this.timeFrames=1e9}
  this.melee=this.meleeOn?{stocks:this.meleeStocks}:null;this.camera.melee=!!this.melee;   // Melee: Stocks statt Runden, keine Wände, offene Plattform
  if(this.melee){this.arena.setOpen(-5000,5000);for(const f of this.fighters)f.stocks=this.melee.stocks;this.timeFrames=MELEE.time*60}
  this.camera.snap(this.fighters)}
 rematch(){this.round=1;for(const f of this.fighters){f.wins=0;f.meter=0}this.startRound()}
 spawnProjectile(f,mv,d=mv.proj){this.sfx('whoosh_heavy',{vol:.6,rate:.85});this.projectiles.push(new Projectile(f,mv,d))}
 // Schadenszahl / Text-Pop (Welt-Koordinaten); kind: 'dmg' | 'text'
 pop(x,y,s,col,size=1,o={}){if(this.pops.length>14)this.pops.shift();this.pops.push({x,y,s:String(s),col:col||'#fff',size,age:0,life:o.life||46,dx:o.dx!==undefined?o.dx:(Math.random()-.5)*34,rot:(Math.random()-.5)*.18,text:!!o.text,tech:!!o.tech})}
 // Treffer-Feedback: Zoom-Punch, Rückstoß der Kamera, Farbsäume, Impact-Frame, Schadenszahl
 hitFeel(x,y,dir,power,dmg,col,o={}){const E=EFFECT,big=power>=3||o.launch||o.hard;
  this.camera.kick(big?E.punchBig:power>=2?E.punchMid:E.punchSmall);this.kickX+=dir*(big?E.kickBig:E.kickSmall);this.kickY+=big?-3:-1;
  this.aberr=Math.max(this.aberr,big?.9:power>=2?.45:.18);
  if(big){this.impact={t:7,t0:7,x,y,col,p:1,seed:Math.random()*99};this.flash=Math.max(this.flash,3);this.flashColor='#ffffff'}
}
 startSuper(f){this.aberr=1;this.camera.kick(.05);this.superName=(f.move&&f.move.label)||'';this.sfx('heavy_hit_impact');this.superFlash=SUPER_FRAMES;this.superOwner=f;this.shake=EFFECT.superShake;this.flash=EFFECT.screenFlash;this.flashColor=f.char.glow||'#fff';this.fx.ps.ring(f.x,f.y-80,'#ffffff',160)}
 knockout(victim,attacker){if(this.story&&victim!==this.p1){this.story.mobDown(victim,attacker);return}
  this.sfx('fw_finale',{vol:.8});this.slow=this.slowMax=EFFECT.koSlow;this.aberr=1;this.camera.kick(.07);this.kickX+=attacker.facing*14;this.impact={t:10,t0:10,x:victim.x,y:victim.y-80,col:victim.char.glow||'#fff',p:1.2,seed:Math.random()*99};victim.state='ko';victim.sf=0;victim.vy=-9;victim.vx=attacker.facing*6;victim.noGrav=false;victim.move=null;
  this.phase='ko';this.pf=0;this.winner=attacker;this.hitstop=26;this.shake=EFFECT.koShake;this.flash=EFFECT.screenFlash;this.flashColor=victim.char.glow||'#fff';this.fx.ko(victim.x,victim.y-80,victim.char.glow||'#fff')}
 // Hyper-Kamerafahrt: weich auf den Angreifer zoomen und im Zoom bleiben, solange sein Hyper-Move aktiv ist (inkl. Freeze); `lead` Frames vor Ende der aktiven Phase sanft zurück
 cineCamera(){const f=this.superOwner,K=CAMERA.cine;
  const m=f&&f.move,on=!!f&&(this.superFlash>0||(m&&m.super&&f.mf<m.su+m.ac-K.lead))&&this.cineT<K.maxF;   // Rauszoomen beginnt schon vor dem letzten Treffer
  if(on){this.cineT++;this.cineW=Math.min(1,this.cineW+1/K.inF)}else{this.cineW=Math.max(0,this.cineW-1/K.outF);if(this.cineW<=0)this.cineT=0}
  if(!f||this.cineW<=0){this.camera.focus(null);return}
  const o=f===this.p1?(this.story&&this.story.nearest(f)||this.p2):this.p1,sz=(f.char&&f.char.size)||1,w=this.cineW*this.cineW*(3-2*this.cineW);
  const fit=W/(Math.abs(o.x-f.x)+K.margin*2);   // nie so dicht, dass der Gegner aus dem Bild fällt
  this.camera.focus(f.x+(o.x-f.x)*K.bias,f.y-K.lift*sz,Math.max(1,Math.min(K.zoom/Math.sqrt(sz),fit)),w)}
 step(){
  this.frame++;
  for(const f of this.fighters)f.input.tick(f,this.foe(f),this);
  this.particles.update();this.arena.update();
  if(this.celeb){this.celeb.t++;this.fx.celebrate(this.celeb.f,this.celeb.t,this.camera)}
  this.kickX*=.78;this.kickY*=.78;this.aberr*=.86;if(this.aberr<.01)this.aberr=0;if(this.impact&&--this.impact.t<=0)this.impact=null;
  for(const p of this.pops)p.age++;this.pops=this.pops.filter(p=>p.age<p.life);
  if(this.slow>0){this.slow--;const u=1-this.slow/this.slowMax;this.timeScale=EFFECT.koSlowMin+(1-EFFECT.koSlowMin)*u*u}else this.timeScale=1;  // Zeitlupe beim K.O. (Hauptschleife teilt die Schrittlänge dadurch)
  this.cineCamera();
  this.camera.update(this.fighters); // läuft auch im Hitstop/Super-Flash weiter
  if(this.shake>0)this.shake=Math.max(0,this.shake-.4);
  if(this.flash>0)this.flash--;
  if(this.superFlash>0){this.superFlash--;return}
  if(this.hitstop>0){this.hitstop--;return}
  switch(this.phase){
   case'intro':this.pf++;for(const f of this.fighters){f.sf++;f.updateAnim()}
    if(this.pf>=(this.story&&this.story.cp===0?260:ROUND.intro)){this.phase='fight';this.pf=0;for(const f of this.fighters)f.input.clear()}break;
   case'fight':this.simulate(true);if(--this.timeFrames<=0&&this.phase==='fight')this.timeUp();break;
   case'ko':this.pf++;if(this.pf<70&&this.frame%2)break;this.simulate(false);if(this.pf>=ROUND.ko)this.endRound();break;
   case'result':this.pf++;this.simulate(false);if(this.pf>=ROUND.result){
     const w=this.fighters.find(f=>f.wins>=ROUND.wins);if(w){this.phase='match';this.pf=0}else{this.round++;this.startRound()}}break;
   case'storyover':this.pf++;this.simulate(false);break
   case'match':this.pf++;this.simulate(false);break}}
 simulate(combat){if(this.story)return this.simulateStory(combat);const[a,b]=this.fighters;
  for(const[f,o]of[[a,b],[b,a]]){if(f.dead>0){if(--f.dead===0&&this.melee)meleeRespawn(this,f);continue}f.update(o,this)}   // Melee: Tote warten auf den Respawn
  for(const p of this.projectiles)p.update();
  if(combat)resolveCombat(this);
  if(combat&&this.melee)meleeBlast(this);
  this.projectiles=this.projectiles.filter(p=>!p.dead);
  this.separate(a,b);
  for(const f of this.fighters)f.updateAnim()}
 simulateStory(combat){
  for(const f of this.fighters){if(f.dead>0)continue;f.update(this.foe(f),this)}
  for(const p of this.projectiles)p.update();
  if(combat)resolveCombat(this);
  this.projectiles=this.projectiles.filter(p=>!p.dead);
  this.story.separate();
  for(const f of this.fighters)f.updateAnim();
  if(combat)this.story.update()}
 // Körper nicht übereinanderlaufen lassen (Wand-sicher)
 separate(a,b){if(a.dead>0||b.dead>0||Math.abs(a.y-b.y)>90)return;if(['knockdown','ko'].includes(a.state)||['knockdown','ko'].includes(b.state))return;
  const min=48,d=b.x-a.x,ad=Math.abs(d);if(ad>=min)return;const s=d>=0?1:-1,push=(min-ad)/2;
  a.x-=s*push;b.x+=s*push;
  const WL=this.arena.l,WR=this.arena.r;for(const f of[a,b]){if(f.x<WL){const o=WL-f.x;f.x=WL;(f===a?b:a).x+=o}if(f.x>WR){const o=f.x-WR;f.x=WR;(f===a?b:a).x-=o}}}
 timeUp(){const[a,b]=this.fighters;this.winner=this.melee?meleeWinnerOnTime(this):a.hp>b.hp?a:b.hp>a.hp?b:null;this.timedOut=true;this.endRound()}
 endRound(){if(this.story){this.phase='storyover';this.pf=0;return}
  if(this.winner){this.winner.wins=this.melee?ROUND.wins:this.winner.wins+1;   // Melee: ein Spiel, kein Rundensystem
  this.shake=Math.max(this.shake,EFFECT.winShake);this.fx.win(this.winner.x,this.winner.y-80,this.winner.char.glow||'#fff');this.celeb={f:this.winner,t:0};this.camera.kick(.06);this.flash=EFFECT.screenFlash;this.flashColor='#ffffff';if(this.winner.grounded&&this.winner.state!=='ko'){this.winner.setState('win')}}
  this.phase='result';this.pf=0}
}
