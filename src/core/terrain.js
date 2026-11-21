import{GROUND}from'./config.js';
// Story-Terrain: Kanten/Ebenen. Der Boden ist überall GROUND, außer auf Plateaus {x0,x1,h}: dort liegt er h Pixel höher (floorAt = y-Koordinate der Standfläche, kleiner = höher).
// Plateaus dürfen sich überlappen (Treppen): es zählt das höchste. Von unten ist die Kante eine Wand – man muss hochspringen; oben läuft man weiter und fällt am Ende wieder hinunter.
// Zusätzlich Plattformen {x0,x1,h} (Parkour): von unten durchlässig (man springt hindurch), von oben ein Boden – man landet nur, wenn man von oben kommt (land) oder steht schon darauf (floorFor).
// Rein rechnerisch (kein DOM) -> Teil der Spiellogik. Genutzt von Fighter.physics (game.terrain), Projektilen, Items und der Darstellung (render/storyhud.js).
export const TERRAIN_HALF=16;    // halbe Körperbreite: die Wand stoppt die Vorderkante, nicht die Körpermitte
export const TERRAIN_STEP=6;     // so viel Höhenunterschied läuft man noch ohne Sprung hinauf (kein Stolpern an Pixelkanten)
export class Terrain{
 constructor(ledges=[],platforms=[]){this.shift=0;   // shift: nur für Tests (Phase der beweglichen Plattformen)
  // kind: 'solid' | 'move' (pendelt um ±amp, Periode per Frames, Phase ph; trägt Figuren mit: dx = Bewegung dieses Frames) | 'crumble' (bröckelt hold Frames nach dem Betreten, ist dann off Frames weg)
  this.platforms=platforms.map(p=>({x0:Math.min(p.x0,p.x1),x1:Math.max(p.x0,p.x1),h:p.h,kind:p.kind||'solid',amp:p.amp||0,per:p.per||240,ph:p.ph||0,hold:p.hold||45,off:p.off||170,ox:0,dx:0,on:true,tm:0,gone:false}));this.ledges=ledges.map(l=>({x0:Math.min(l.x0,l.x1),x1:Math.max(l.x0,l.x1),h:Math.max(0,l.h)}));
  this.edges=[...new Set(this.ledges.flatMap(l=>[l.x0,l.x1]))].sort((a,b)=>a-b)}
 // Höhe des Bodens (Plateau-Höhe) an der Stelle x; 0 = normaler Boden
 heightAt(x){let h=0;for(const l of this.ledges)if(x>=l.x0&&x<=l.x1&&l.h>h)h=l.h;return h}
 floorAt(x){return GROUND-this.heightAt(x)}
 // Standfläche für Füße bei (x,y): Boden/Plateau, oder die Plattform, auf der man gerade steht (y liegt genau auf ihrer Oberkante)
 floorFor(x,y){let f=this.floorAt(x);for(const p of this.platforms){if(!p.on||x<p.x0+p.ox||x>p.x1+p.ox)continue;const yp=GROUND-p.h;if(Math.abs(yp-y)<=.5&&yp<f)f=yp}return f}
 // die Plattform, auf der man bei (x,y) gerade steht (oder null)
 under(x,y){for(const p of this.platforms){if(!p.on||x<p.x0+p.ox||x>p.x1+p.ox)continue;if(Math.abs(GROUND-p.h-y)<=.5)return p}return null}
 // pro Frame (Game.step): bewegliche Plattformen pendeln; bröckelnde zählen herunter, solange jemand darauf steht
 tick(frame,fighters=[]){const f=frame+this.shift;for(const p of this.platforms){
   if(p.kind==='move'){const o=Math.sin(f*2*Math.PI/p.per+p.ph)*p.amp;p.dx=o-p.ox;p.ox=o}
   else if(p.kind==='crumble'){if(p.gone){if(++p.tm>=p.off){p.gone=false;p.on=true;p.tm=0}}
    else{const stand=fighters.some(q=>q.hp>0&&q.x>=p.x0&&q.x<=p.x1&&Math.abs(GROUND-p.h-q.y)<=.5);if(stand){if(++p.tm>=p.hold){p.gone=true;p.on=false;p.tm=0}}else if(p.tm>0)p.tm--}}}}
 // Fällt man von py nach y durch die Oberkante einer Plattform? -> deren Oberkante (die höchste), sonst null
 land(x,py,y){let b=null;for(const p of this.platforms){if(!p.on||x<p.x0+p.ox||x>p.x1+p.ox)continue;const yp=GROUND-p.h;if(py<=yp+.01&&y>=yp&&(b===null||yp<b))b=yp}return b}
 // Bewegung von px nach x auf Fußhöhe y: läuft die Vorderkante gegen eine höhere Ebene (Oberkante höher als die Füße + TERRAIN_STEP), stoppt sie an der Kante.
 // Rückgabe: die erlaubte neue x-Position (= x, wenn nichts im Weg ist).
 block(px,x,y){if(px===x||!this.ledges.length)return x;
  const d=x>px?1:-1,R=TERRAIN_HALF,lead=x+d*R;
  if(this.floorAt(lead)>=y-TERRAIN_STEP)return x;                 // Ziel nicht höher als die Füße -> frei
  const a=px+d*R;let best=null;                                   // nächste Kante auf dem Weg der Vorderkante, hinter der der Boden zu hoch ist
  for(const e of this.edges){if(d>0?(e<a||e>lead):(e>a||e<lead))continue;if(this.floorAt(e+d*.01)>=y-TERRAIN_STEP)continue;if(best===null||(d>0?e<best:e>best))best=e}
  return best===null?px:best-d*R-d*.5}
}
