import{H,W}from'../core/config.js';
// Mausbedienung für die Canvas-Menüs: weicher Hover-Rahmen (gleitet von Ziel zu Ziel) + Knöpfe der End-Bildschirme (Game Over / Stage Clear / Sieg / Revanche).
// Zustand setzt main.js pro Frame: hov.want = Rechteck unter dem Mauszeiger (oder null), renderer.endBtns/endHot für die Knöpfe unten.
export const endBtnRect=(i,n)=>{const w=214,h=30,gap=16,x0=W/2-(n*w+(n-1)*gap)/2;return{x:x0+i*(w+gap),y:H-78,w,h}};
export class HoverFx{
 constructor(){this.want=null;this.r=null;this.a=0;this._n=0}
 draw(g){const n=performance.now(),dt=this._n?Math.min(.1,(n-this._n)/1000):.016;this._n=n;const w=this.want;
  if(w){if(!this.r||this.a<.03)this.r={x:w.x,y:w.y,w:w.w,h:w.h};   // frisch eingeblendet: direkt am Ziel starten; sonst weich hinübergleiten
   else{const k=1-Math.exp(-dt*22),r=this.r;r.x+=(w.x-r.x)*k;r.y+=(w.y-r.y)*k;r.w+=(w.w-r.w)*k;r.h+=(w.h-r.h)*k}
   this.a=Math.min(1,this.a+dt*8)}
  else this.a=Math.max(0,this.a-dt*7);
  if(!this.r||this.a<=.01)return;
  const r=this.r,p=3+Math.sin(n*.008)*.8;
  g.save();g.globalAlpha=this.a;g.lineJoin='round';
  g.fillStyle='rgba(127,232,255,.09)';g.fillRect(r.x-p,r.y-p,r.w+2*p,r.h+2*p);
  g.shadowColor='#7fe8ff';g.shadowBlur=16;g.strokeStyle='#bff3ff';g.lineWidth=2;g.strokeRect(r.x-p,r.y-p,r.w+2*p,r.h+2*p);
  g.restore()}
}
// Knöpfe unten auf den End-Bildschirmen; btns = [{label,col}], hot = Index unter dem Mauszeiger
export function drawEndBtns(g,hud,btns,hot,t){if(!btns||!btns.length)return;
 btns.forEach((b,i)=>{const r=endBtnRect(i,btns.length);hud.kPlate(g,r.x,r.y,r.w,r.h,{col:b.col||'#7fe8ff',on:i===hot,sk:8,t});hud.txt(g,b.label,r.x+r.w/2+4,r.y+20,14,'#ffffff','center',i===hot?b.col||'#7fe8ff':null)})}
