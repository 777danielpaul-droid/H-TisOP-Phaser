import{WALL_L,WALL_R,GROUND,BARRIER,HOUSE}from'./config.js';
// Arena-Begrenzung: Gasse zwischen zwei Hochhäusern. Jede Seite hat eine brechbare Außenwand; bricht sie, rückt die Spielfeldgrenze in das
// Gebäude (Innenraum). Rein logisch (kein DOM) -> headless testbar. Grenzen immer über arena.l / arena.r abfragen, nie über WALL_L/WALL_R.
export class Arena{
 constructor(){this.reset()}
 reset(){this.L=this.make(-1,0);this.R=this.make(1,0);this.msg=null;this.broken=0;this.openT={L:-1,R:-1}}
 make(dir,step){const side=dir<0?'L':'R',n=BARRIER.steps[side],final=step>=n,hp=final?Infinity:BARRIER.hp[Math.min(step,BARRIER.hp.length-1)];
  return{dir,step,final,visible:n>0,hp,max:hp,x:(dir<0?WALL_L:WALL_R)+dir*step*BARRIER.width,flash:0,show:0}}
 get l(){return this.L.x}
 get r(){return this.R.x}
 get endL(){return WALL_L-BARRIER.width*BARRIER.steps.L} // Rückwand des linken Gebäudes
 get endR(){return WALL_R+BARRIER.width*BARRIER.steps.R} // Rückwand des rechten Gebäudes
 // Innenraum eines aufgebrochenen Gebäudes: 'L' | 'R' | null (Hof/Gasse). Nur dort gibt es eine Decke (HOUSE.ceil).
 get ceil(){return HOUSE.ceil}
 inside(x){return this.L.step>0&&x<WALL_L?'L':this.R.step>0&&x>WALL_R?'R':null}
 // Welche Begrenzung berührt ein Kämpfer an Position x? 'L' | 'R' | null
 sideAt(x){return x<=this.l+6?'L':x>=this.r-6?'R':null}
 update(){for(const w of[this.L,this.R]){if(w.flash>0)w.flash--;if(w.show>0)w.show--}if(this.msg&&--this.msg.t<=0)this.msg=null;
  for(const k of['L','R'])if(this.openT[k]>=0)this.openT[k]++}
 // Schaden an der Wand hinter `victim`. Gibt true zurück, wenn sie dabei bricht.
 hitWall(game,victim,amount,{launch=true}={}){const side=this.sideAt(victim.x);if(!side||!(amount>0))return false;
  const w=this[side],py=victim.y-70;
  if(!w.visible&&!w.step)return false;                       // Grenze ohne Wand: kein Schaden, keine Effekte
  w.flash=8;
  if(w.final){game.sfx&&game.sfx('body_fall',{vol:.3,rate:.9});game.particles.burst(w.x,py,{count:5,speed:4,color:'#ffd9a0',life:12,size:2,angle:w.dir>0?Math.PI:0,spread:2});return false}
  w.hp-=amount;w.show=150;game.sfx&&game.sfx('body_fall',{vol:.55,rate:.8});
  game.particles.burst(w.x,py,{count:8,speed:5,color:'#d9a98a',life:18,size:2.6,angle:w.dir>0?Math.PI:0,spread:2.2,gravity:.3});
  if(w.hp>0)return false;
  this.breakWall(game,side,victim,launch);return true}
 breakWall(game,side,victim,launch){const w=this[side],ox=w.x,d=w.dir;
  this[side]=this.make(d,w.step+1);this.broken++;this.openT[side]=0;this.msg={t:170,side,dir:d,step:w.step+1};
  const P=game.particles,a=d>0?0:Math.PI;
  P.burst(ox,GROUND-90,{count:50,speed:11,color:'#b9855f',life:46,size:5,gravity:.35,angle:a,spread:2.6,streak:.5});   // Ziegel
  P.burst(ox,GROUND-90,{count:30,speed:9,color:'#d8c8a8',life:40,size:3.5,gravity:.3,angle:a,spread:3,streak:.6});    // Staub/Putz
  P.burst(ox,GROUND-90,{count:20,speed:8,color:'#ffffff',life:20,size:3,angle:a,spread:3});
  P.ring(ox,GROUND-90,'#ffd9a0',200);P.ring(ox,GROUND-60,'#ffffff',130);
  game.shake=Math.max(game.shake,14);game.hitstop=Math.max(game.hitstop,12);if(game.sfx){game.sfx('heavy_hit_impact');game.sfx('ground_slam',{vol:.7})}
  // Opfer wird durch die Bresche ins Gebäude geschleudert (nur bei echtem Treffer, nicht beim Blocken / KO)
  if(victim&&launch&&victim.state!=='ko'&&victim.state!=='block'){
   victim.move=null;victim.noGrav=false;victim.state='airhit';victim.sf=0;victim.launched=true;victim.stun=9999;
   victim.vx=d*BARRIER.breakVx;victim.vy=BARRIER.breakVy;victim.y=Math.min(victim.y,GROUND-1)}
  else if(victim)victim.vx=d*BARRIER.breakVx*.5}
}
