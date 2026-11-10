import{Hitbox}from'./hitbox.js';
import{GROUND,WORLD}from'./config.js';
// Projektil. Felder der Definition (`proj`): frame (Spawn-Frame), ox/y (Versatz zum Kämpfer), vx/vy/grav (Bewegung, Bögen), w/h, dmg/hs/bs, life,
// lv (Trefferhöhe), launch/hard, look (Darstellung)
export class Projectile{
 constructor(owner,mv,d=mv.proj){this.owner=owner;this.def=d;this.x=owner.x+owner.facing*(d.ox||64);this.y=owner.y+d.y;
  this.vx=owner.facing*d.vx;this.vy=d.vy||0;this.grav=d.grav||0;this.life=d.life;this.dead=false;this.age=0;this.w=d.w;this.h=d.h}
 update(){this.x+=this.vx;if(this.vy||this.grav){this.vy+=this.grav;this.y+=this.vy}
  this.life--;this.age++;
  if(this.life<=0||this.x<WORLD.x0||this.x>WORLD.x1)this.dead=true;
  if(this.vy>0&&this.y>=GROUND-8)this.dead=true} // Bogen-/Schräg-Projektile verpuffen am Boden
 rect(){return new Hitbox(this.x-this.w/2,this.y-this.h/2,this.w,this.h)}
 // Projektile treffen wie Moves – gleiche Felder, damit combat.hit() nur einen Pfad braucht
 asMove(){const d=this.def;return{dmg:d.dmg,hs:d.hs,bs:d.bs,pb:4,pbb:5,hstop:8,shake:3,lv:d.lv||'mid',launch:d.launch||null,hard:!!d.hard,multi:0,minScale:0}}
}
