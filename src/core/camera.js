import{W,H,WORLD,CAMERA,MELEE,GROUND}from'./config.js';
const MWORLD={...WORLD,y1:MELEE.y1+90};   // Melee: Kamera darf unter die Plattform schauen (Fallende, Blast-Zone unten)
// Virtuelle Kamera. (x,y) = Weltkoordinate in der Bildschirmmitte, zoom = Skalierung (1 = normal, <1 = herausgezoomt).
// Rein rechnerisch (kein DOM) -> Teil der Spiellogik und headless testbar.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Camera{
 constructor(){this.x=W/2;this.y=H/2;this.zoom=1;this.punch=0;this.cine=null;this.melee=false;this.target={x:W/2,y:H/2,zoom:1}}
 // Zielwerte aus der Bounding-Box beider Kämpfer: Breite (Abstand) UND Höhe (Sprünge) bestimmen den Zoom.
 get wd(){return this.melee?MWORLD:WORLD}
 // Melee: Plattform bleibt immer im Bild; Kämpfer (auch weit draußen, begrenzt auf die Blast-Zonen) werden mit eingerahmt, Tote ignoriert
 computeMelee(fighters){const C=CAMERA,M=MELEE,cl=(v,a,b)=>Math.max(a,Math.min(b,v));let minX=M.pl-30,maxX=M.pr+30,minTop=GROUND-200,maxBot=GROUND+10;
  for(const f of fighters){if(f.dead>0)continue;const sz=(f.char&&f.char.size)||1;
   minX=Math.min(minX,cl(f.x,M.x0,M.x1)-70);maxX=Math.max(maxX,cl(f.x,M.x0,M.x1)+70);minTop=Math.min(minTop,cl(f.y-165*sz,M.y0,M.y1));maxBot=Math.max(maxBot,cl(f.y+30,M.y0,M.y1+30))}
  const needW=(maxX-minX)+120,needH=(maxBot-minTop)+C.headroom+70,zoom=cl(Math.min(W/needW,H/needH),C.minZoom,C.maxZoom),hw=W/2/zoom,hh=H/2/zoom,wd=MWORLD;
  return{x:cl((minX+maxX)/2,wd.x0+hw,wd.x1-hw),y:cl((minTop-C.headroom+maxBot+30)/2,wd.y0+hh,wd.y1-hh),zoom}}
 compute(fighters){if(this.melee)return this.computeMelee(fighters);const C=CAMERA;let minX=1e9,maxX=-1e9,minTop=1e9;
  for(const f of fighters){minX=Math.min(minX,f.x-70);maxX=Math.max(maxX,f.x+70);
   const lying=f.state==='knockdown'||(f.state==='ko'&&f.grounded);minTop=Math.min(minTop,f.y-(lying?40:165*((f.char&&f.char.size)||1)))}
  const needW=(maxX-minX)+C.marginX*2;           // benötigte Weltbreite
  const needH=H-(minTop-C.headroom);              // von Kopf-Oberkante (+Luft fürs HUD) bis zum Boden-Bildrand
  const zoom=clamp(Math.min(W/needW,H/needH),C.minZoom,C.maxZoom);
  const hw=W/2/zoom,hh=H/2/zoom;
  let x=(minX+maxX)/2;                            // horizontal: Mitte beider Kämpfer
  let y=Math.min(H-hh,minTop-C.headroom+hh);      // Unterkante bleibt am Boden; bei Sprüngen neigt sich die Kamera nach oben
  x=clamp(x,WORLD.x0+hw,WORLD.x1-hw);y=clamp(y,WORLD.y0+hh,WORLD.y1-hh);
  return{x,y,zoom}}
 kick(a){this.punch=Math.max(this.punch,a)}   // kurzer Zoom-Punch bei Treffern (klingt von selbst ab)
 get z(){return this.zoom*(1+this.punch)}
 // Kamerafahrt (Hyper): Fokus auf einen Weltpunkt. w (0..1) blendet zwischen Kampfkamera und Fokus; focus(null) beendet sie.
 focus(x,y,zoom,w=1){this.cine=x==null?null:{x,y,zoom,w}}
 update(fighters){this.punch=this.punch>.0004?this.punch*.84:0;let t=this.compute(fighters);const C=CAMERA,K=this.cine;let lp=C.lerpPos,lz=C.lerpZoom;
  if(K&&K.w>0){const z=t.zoom+(Math.max(K.zoom,t.zoom)-t.zoom)*K.w,hw=W/2/z,hh=H/2/z;
   t={x:clamp(t.x+(K.x-t.x)*K.w,this.wd.x0+hw,this.wd.x1-hw),y:clamp(t.y+(K.y-t.y)*K.w,this.wd.y0+hh,this.wd.y1-hh),zoom:z};
   lp=C.lerpPos+(C.cine.lerpPos-C.lerpPos)*K.w;lz=C.lerpZoom+(C.cine.lerpZoom-C.lerpZoom)*K.w}
  this.target=t;this.x+=(t.x-this.x)*lp;this.y+=(t.y-this.y)*lp;this.zoom+=(t.zoom-this.zoom)*lz}
 snap(fighters){const t=this.target=this.compute(fighters);this.x=t.x;this.y=t.y;this.zoom=t.zoom}
 // Welt-Transformation: erst auf Bildschirmmitte, dann skalieren, dann um den Kamerapunkt verschieben.
 apply(g){g.translate(W/2,H/2);g.scale(this.z,this.z);g.translate(-this.x,-this.y)}
 toScreen(x,y){return[(x-this.x)*this.z+W/2,(y-this.y)*this.z+H/2]}
 toWorld(sx,sy){return[(sx-W/2)/this.z+this.x,(sy-H/2)/this.z+this.y]}
}
