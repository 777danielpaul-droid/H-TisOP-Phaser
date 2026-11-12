export class Hitbox{
 constructor(x,y,w,h){this.x=x;this.y=y;this.w=w;this.h=h}
 // box = [vorwärts-Offset, y-Offset (negativ = oben), Breite, Höhe], relativ zu den Füßen des Kämpfers
 static fromBox(b,f){const z=f.char.size||1;b=[b[0]*z,b[1]*z,b[2]*z,b[3]*z];const x=f.facing>0?f.x+b[0]:f.x-b[0]-b[2];return new Hitbox(x,f.y+b[1],b[2],b[3])}
 overlaps(o){return this.x<o.x+o.w&&this.x+this.w>o.x&&this.y<o.y+o.h&&this.y+this.h>o.y}
}
