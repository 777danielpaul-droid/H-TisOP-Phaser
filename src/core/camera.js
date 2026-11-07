import{W,H,WORLD,CAMERA}from'./config.js';
// Virtuelle Kamera. (x,y) = Weltkoordinate in der Bildschirmmitte, zoom = Skalierung (1 = normal, <1 = herausgezoomt).
// Rein rechnerisch (kein DOM) -> Teil der Spiellogik und headless testbar.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Camera{
 constructor(){this.x=W/2;this.y=H/2;this.zoom=1;this.punch=0;this.target={x:W/2,y:H/2,zoom:1}}
 // Zielwerte aus der Bounding-Box beider Kämpfer: Breite (Abstand) UND Höhe (Sprünge) bestimmen den Zoom.
 compute(fighters){const C=CAMERA;let minX=1e9,maxX=-1e9,minTop=1e9;
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
 update(fighters){this.punch=this.punch>.0004?this.punch*.84:0;const t=this.target=this.compute(fighters),C=CAMERA;
  this.x+=(t.x-this.x)*C.lerpPos;this.y+=(t.y-this.y)*C.lerpPos;this.zoom+=(t.zoom-this.zoom)*C.lerpZoom}
 snap(fighters){const t=this.target=this.compute(fighters);this.x=t.x;this.y=t.y;this.zoom=t.zoom}
 // Welt-Transformation: erst auf Bildschirmmitte, dann skalieren, dann um den Kamerapunkt verschieben.
 apply(g){g.translate(W/2,H/2);g.scale(this.z,this.z);g.translate(-this.x,-this.y)}
 toScreen(x,y){return[(x-this.x)*this.z+W/2,(y-this.y)*this.z+H/2]}
 toWorld(sx,sy){return[(sx-W/2)/this.z+this.x,(sy-H/2)/this.z+this.y]}
}
