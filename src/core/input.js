import{PHYS}from'./config.js';
// Numpad-Notation relativ zur Blickrichtung: 2=unten, 3=unten-vorwärts, 6=vorwärts ...
const MOTIONS={qcf:[2,3,6],qcb:[2,1,4],dp:[6,2,3]};
// Gemeinsame Basis für Tastatur und KI: Richtungs-Historie, Button-Puffer, Doppeltipp-Erkennung.
export class InputBuffer{
 constructor(){this.dx=0;this.dy=0;this.hist=[];this.buf=[];this.taps=[];this.dashEv=null}
 tick(){}
 clear(){this.hist.length=0;this.buf.length=0;this.taps.length=0;this.dashEv=null}
 // frozen=true (Hitstop/Super-Flash): Puffer altert nicht, damit Eingaben währenddessen nicht verfallen
 feed(dx,dy,pressed=[],frozen=false){
  const pdx=this.dx,pdy=this.dy;this.dx=dx;this.dy=dy;
  this.hist.push({dx,dy});if(this.hist.length>40)this.hist.shift();
  if(!frozen){for(const e of this.buf)e.age++;for(const t of this.taps)t.age++;if(this.dashEv)this.dashEv.age++}
  this.buf=this.buf.filter(e=>e.age<=14);this.taps=this.taps.filter(t=>t.age<=14);
  if(this.dashEv&&this.dashEv.age>3)this.dashEv=null;
  if(dy<0&&pdy>=0)pressed=[...pressed,'UP'];
  if(dx!==0&&dx!==pdx){const prev=this.taps.find(t=>t.dir===dx&&t.age>2);
   if(prev){this.dashEv={dir:dx,age:0};this.taps=[]}else this.taps.push({dir:dx,age:0})}
  for(const b of pressed)this.buf.push({b,age:0});
 }
 pressed(b,w=PHYS.inputBuffer){for(const e of this.buf)if(e.b===b&&e.age<=w)return true;return false}
 consume(b){this.buf=this.buf.filter(e=>e.b!==b)}
 takeDash(){const e=this.dashEv;this.dashEv=null;return e?e.dir:0}
 motion(name,facing,win=24){const seq=[];
  for(const h of this.hist.slice(-win)){const rx=h.dx*facing;let n;
   if(h.dy>0)n=rx>0?3:rx<0?1:2;else if(h.dy<0)n=rx>0?9:rx<0?7:8;else n=rx>0?6:rx<0?4:5;
   if(seq[seq.length-1]!==n)seq.push(n)}
  const pat=MOTIONS[name];let i=0;for(const n of seq)if(n===pat[i])i++;return i>=pat.length}
}
// Standard-Belegung. Buttons: L/M/H = leicht/mittel/schwer, S = Special, SUP = Super, DASH = Dash
export const BUTTON_KEYS={KeyJ:'L',KeyK:'M',KeyL:'H',KeyU:'S',KeyI:'SUP',KeyO:'DASH',KeyZ:'L',KeyX:'M',KeyC:'H',KeyV:'S',KeyB:'SUP',KeyN:'DASH'};
export const DIR_KEYS={left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],up:['KeyW','ArrowUp','Space'],down:['KeyS','ArrowDown']};
// 2-Spieler-Modus (eine Tastatur): P1 links (WASD + G H J / T Y / B), P2 rechts (Pfeile + K L ; / I O / P bzw. Ziffernblock 1 2 3 / 4 5 / 0)
export const VS1_BUTTONS={KeyG:'L',KeyH:'M',KeyJ:'H',KeyT:'S',KeyY:'SUP',KeyB:'DASH'};
export const VS1_DIRS={left:['KeyA'],right:['KeyD'],up:['KeyW'],down:['KeyS']};
export const VS2_BUTTONS={KeyK:'L',KeyL:'M',Semicolon:'H',KeyI:'S',KeyO:'SUP',KeyP:'DASH',Numpad1:'L',Numpad2:'M',Numpad3:'H',Numpad4:'S',Numpad5:'SUP',Numpad0:'DASH'};
export const VS2_DIRS={left:['ArrowLeft'],right:['ArrowRight'],up:['ArrowUp'],down:['ArrowDown']};
// Gamepad (Standard-Layout): Stick/Steuerkreuz = Bewegung, A=L, X=M, Y=H, B=Special, RB=Hyper, LB/RT=Dash
const PAD_BUTTONS={0:'L',2:'M',3:'H',1:'S',5:'SUP',4:'DASH',7:'DASH'};
export class KeyboardInput extends InputBuffer{
 constructor(target=(typeof window!=='undefined'?window:null),buttons=BUTTON_KEYS,dirs=DIR_KEYS){
  super();this.keys=new Set();this.pend=[];this.padIndex=-1;this.padPrev=new Set();this.buttons=buttons;this.dirs=dirs;
  if(target){target.addEventListener('keydown',e=>{
    if(e.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;   // Eingabefelder (z. B. Editor für die eigene Figur) nicht abfangen
    if(e.repeat)return;this.keys.add(e.code);const b=this.buttons[e.code];if(b)this.pend.push(b);
    if(this.buttons[e.code]||Object.values(this.dirs).some(a=>a.includes(e.code)))e.preventDefault()});
   target.addEventListener('keyup',e=>this.keys.delete(e.code));
   target.addEventListener('blur',()=>this.keys.clear())}}
 any(list){return list.some(c=>this.keys.has(c))}
 // Gamepad abfragen (padIndex >= 0): liefert Richtung + frisch gedrückte Buttons
 pollPad(){const gp=this.padIndex>=0&&typeof navigator!=='undefined'&&navigator.getGamepads?navigator.getGamepads()[this.padIndex]:null;if(!gp){this.padPrev.clear();return{dx:0,dy:0,pressed:[]}}
  const a=gp.axes,b=gp.buttons,pr=i=>!!(b[i]&&b[i].pressed),dx=(a[0]>.5||pr(15)?1:0)-(a[0]<-.5||pr(14)?1:0),dy=(a[1]>.5||pr(13)?1:0)-(a[1]<-.5||pr(12)?1:0),pressed=[],now=new Set();
  for(const i in PAD_BUTTONS)if(pr(+i)){now.add(+i);if(!this.padPrev.has(+i))pressed.push(PAD_BUTTONS[i])}this.padPrev=now;return{dx,dy,pressed}}
 // Aktuellen Eingabezustand lesen (Richtung + seit dem letzten Aufruf gedrückte Buttons), ohne ihn in den Puffer zu schreiben -> Online-Modus (core/netplay.js) verschickt ihn erst
 sample(){const d=this.dirs;
  const dx=(this.any(d.right)?1:0)-(this.any(d.left)?1:0),dy=(this.any(d.down)?1:0)-(this.any(d.up)?1:0);
  const pd=this.pollPad();return{dx:Math.max(-1,Math.min(1,dx+pd.dx)),dy:Math.max(-1,Math.min(1,dy+pd.dy)),pressed:[...this.pend.splice(0),...pd.pressed]}}
 tick(me,opp,game){const s=this.sample();this.feed(s.dx,s.dy,s.pressed,!!game&&(game.hitstop>0||game.superFlash>0))}
}
