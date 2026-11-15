import{MELEE,GROUND,EFFECT,COMBO_SCALE,METER}from'./config.js';
import{hitSounds}from'./sfx.js';
// Melee-Modus (Smash-Stil). Rein logisch, headless testbar.
// Schaden = Prozent (steigt nur), Rückstoß = Grundwert x (1 + % / kbDiv) -> bei hohem % fliegt man über die Blast-Zonen -> Stock weg.
// Treffer-Ablauf siehe combat.js (ruft meleeHit auf, wenn game.melee gesetzt ist).

// Rückstoß-Vektor für einen Treffer (px/Frame). kb wächst mit dem % des Opfers (nach dem Treffer).
export function meleeKnockback(mv,pct,power,facing,L){
 const base=L?Math.hypot(L.vx,L.vy)*.62:mv.hard?MELEE.hard:MELEE.base[Math.max(0,Math.min(2,power-1))];
 const kb=base*(1+pct/MELEE.kbDiv);
 let ang;                                            // Winkel nach oben (rad); Launcher folgen ihrem Vektor, harte Treffer (Hammer) = Meteor nach unten
 if(L)ang=Math.atan2(-L.vy,Math.max(1.2,L.vx));else if(mv.hard)ang=-1.15;else ang=.42;
 return{kb,vx:facing*Math.cos(ang)*kb,vy:-Math.sin(ang)*kb,base,ang}}

export function meleeHit(game,a,b,mv,sx,sy,col,power,isProj){
 const M=MELEE,def=b.char.def||1,mtr=a.char.meter||1,E=EFFECT;
 const ch=Math.min(b.comboHits,COMBO_SCALE.length-1),scale=Math.max(COMBO_SCALE[ch],mv.minScale||0);
 // ---- Rüstung: Treffer wird eingesteckt (60 % Prozent, kein Rückstoß), Move läuft weiter ----
 if(b.state==='attack'&&b.move&&b.move.armor&&b.mf>=b.move.armor[0]&&b.mf<=b.move.armor[1]){
  const ad=Math.max(1,Math.round(mv.dmg*a.dmgMul()*def*M.pctScale*.6*scale));b.pct=Math.min(M.pctMax,b.pct+ad);b.armorFlash=8;
  a.meter=Math.min(METER.max,a.meter+ad*1.5*mtr);game.hitstop=Math.max(game.hitstop,Math.min(mv.hstop,6));game.shake=Math.max(game.shake,3);
  game.fx.block(sx,sy,'#ffd23f');game.fx.hit(sx,sy,1,'#ffd23f',a.facing);game.sfx('heavy_hit_impact',{vol:.6});return}
 // ---- Block: kein Schaden, Rückstoß wie im normalen Modus ----
 if(b.isBlocking(mv)){
  b.blockCrouch=b.grounded&&b.input.dy>0;b.move=null;b.state='block';b.sf=0;b.stun=mv.bs;b.vx=a.facing*mv.pbb;
  game.hitstop=Math.max(game.hitstop,Math.min(mv.hstop,6));
  a.meter=Math.min(METER.max,a.meter+mv.dmg*.05*mtr);b.meter=Math.min(METER.max,b.meter+mv.dmg*.04);
  game.fx.block(sx,sy,col);game.sfx('block_guard');game.camera.kick(.004);game.kickX+=a.facing*2;return}
 // ---- Treffer: % erhöhen, Rückstoß aus dem neuen % ----
 const add=Math.max(1,Math.round(mv.dmg*a.dmgMul()*scale*def*M.pctScale));
 b.pct=Math.min(M.pctMax,b.pct+add);b.comboHits++;b.comboDmg+=add;b.comboShow={hits:b.comboHits,dmg:b.comboDmg,t:100};b.comboFlash=10;
 a.meter=Math.min(METER.max,a.meter+add*1.6*mtr);b.meter=Math.min(METER.max,b.meter+add*.8);
 b.move=null;b.noGrav=false;b.hover=0;
 const lastMulti=!mv.multi||a.mf>=mv.su+mv.ac-mv.multi,L=mv.launch&&lastMulti?mv.launch:null;
 const k=meleeKnockback(mv,b.pct,power,a.facing,L);
 if(b.grounded&&!L&&!mv.hard&&k.kb<M.flinch){   // leichter Treffer am Boden: kurzer Hitstun, Figur bleibt stehen
  b.state='hit';b.sf=0;b.stun=mv.hs;b.vx=a.facing*mv.pb*(1+b.pct/220)}
 else{                                           // Treffer in der Luft / harter Treffer / zu hohes %: wird weggeschleudert
  b.state='airhit';b.sf=0;b.stun=Math.max(14,Math.min(86,Math.round(M.stunBase+k.kb*M.stunK)));b.launched=false;b.hard=!!mv.hard;
  b.vx=k.vx;b.vy=k.vy;if(b.grounded)b.y=GROUND-1}
 game.hitstop=Math.max(game.hitstop,mv.hstop+(k.kb>14?3:0));game.shake=Math.max(game.shake,b.comboHits>=2?E.comboShake:(mv.shake||power*1.5)+Math.min(6,k.kb*.25));
 game.fx.hit(sx,sy,power,col,a.facing);game.hitFeel(sx,sy,a.facing,power,add,col,{launch:!!L||k.kb>=M.flinch*1.6,hard:!!mv.hard,hits:b.comboHits});
 game.sfxList(hitSounds(mv,{launch:!!L,proj:isProj}));
 if(b.comboHits>=2)game.fx.combo(sx,sy,b.comboHits,col,a.facing)}

// Blast-Zonen: wer sie verlässt, verliert einen Stock. Letzter Stock = Spielende (Phase 'ko' -> Sieger).
export function meleeBlast(game){const M=MELEE;
 for(const f of game.fighters){if(f.dead>0||game.phase!=='fight')continue;
  if(!(f.x<M.x0||f.x>M.x1||f.y>M.y1||f.y-60<M.y0))continue;
  const o=f===game.p1?game.p2:game.p1,col=f.char.glow||'#fff';
  const bx=Math.max(M.x0,Math.min(M.x1,f.x)),by=Math.max(M.y0,Math.min(M.y1,f.y-70));
  f.stocks--;f.pct=0;f.move=null;f.vx=f.vy=0;f.noGrav=false;f.hover=0;f.inv=0;f.comboHits=0;f.comboDmg=0;f.state='idle';f.blastedAt={x:bx,y:by};
  game.sfx('fw_finale',{vol:.8});game.fx.ko(bx,by,col);game.fx.ps.ring(bx,by,col,260);game.fx.ps.ring(bx,by,'#ffffff',150);
  game.shake=Math.max(game.shake,EFFECT.koShake);game.flash=EFFECT.screenFlash;game.flashColor=col;game.camera.kick(.05);game.aberr=1;
  game.impact={t:8,t0:8,x:bx,y:by,col,p:1,seed:Math.random()*99};
  if(f.stocks<=0){f.dead=99999;game.winner=o;game.phase='ko';game.pf=0;game.slow=game.slowMax=EFFECT.koSlow;game.hitstop=26;break}
  f.dead=M.respawn;game.hitstop=Math.max(game.hitstop,16)}}

// Wiedereinstieg: schwebend über der Mitte (leicht versetzt je Spieler), Blick zur Mitte
export function meleeRespawn(game,f){const i=game.fighters.indexOf(f),x=(MELEE.pl+MELEE.pr)/2+(i?70:-70);
 f.respawn(x,GROUND-250,i?-1:1);game.fx.ps.ring(x,GROUND-250,f.char.glow||'#fff',140);game.sfx('ui_round_start',{vol:.35,rate:1.3})}

// Zeitlimit: mehr Stocks gewinnt, bei Gleichstand das niedrigere %, sonst Unentschieden
export function meleeWinnerOnTime(game){const[a,b]=game.fighters;
 if(a.stocks!==b.stocks)return a.stocks>b.stocks?a:b;if(a.pct!==b.pct)return a.pct<b.pct?a:b;return null}
