import{InputBuffer}from'./input.js';
// Online-Kampf, Kern: Lockstep mit Eingabe-Verzögerung (kein Zustand wird übertragen, nur Tasten).
// Beide Geräte rechnen denselben Kampf (die Kampflogik ist deterministisch: nur + - * / und Vergleiche, kein Zufall im Ablauf).
// Pro Rechenschritt ("Frame") wird die Eingabe beider Spieler gebraucht. Die eigene Eingabe wird `delay` Frames im Voraus abgetastet und sofort
// verschickt; ein Frame wird erst gerechnet, wenn beide Eingaben da sind (sonst kurzes Warten). Alle 30 Frames wird ein Prüfwert verglichen (Desync-Erkennung).
// Dieser Teil kennt weder Netzwerk noch DOM (Senden/Abtasten kommen als Funktionen herein) -> headless testbar: tests/netplay.test.js
export const NET={resendMs:120,hashEvery:30,redundancy:4,delayMin:4,delayMax:16,delayDefault:6,stallWarnMs:350,stallDeadMs:12000,keep:40,maxBatch:32};
export const NEUTRAL=5;   // dx=0, dy=0, keine Taste
const NBTN=['L','M','H','S','SUP','DASH'];
// Eingabe eines Frames als kleine Zahl: Bits 0-1 = dx+1, 2-3 = dy+1, 4-9 = Buttons (L M H S SUP DASH). 'UP' entsteht beim Einspeisen aus dy (InputBuffer.feed).
export const encInput=(dx,dy,pressed=[])=>{let v=((dx<0?0:dx>0?2:1))|((dy<0?0:dy>0?2:1)<<2);for(const b of pressed){const i=NBTN.indexOf(b);if(i>=0)v|=16<<i}return v};
export const decInput=v=>({dx:(v&3)-1,dy:((v>>2)&3)-1,pressed:NBTN.filter((_,i)=>v&(16<<i))});
// Eingabepuffer eines Online-Spielers: bekommt den Frame-Wert vom Lockstep (cur) und füttert ihn wie die Tastatur
export class NetInput extends InputBuffer{
 constructor(){super();this.cur=NEUTRAL}
 tick(me,opp,game){const v=decInput(this.cur);this.feed(v.dx,v.dy,v.pressed,!!game&&(game.hitstop>0||game.superFlash>0))}
}
// Prüfwert des Kampfzustands (FNV-artig über gerundete Werte): gleiche Eingaben => gleicher Wert auf beiden Geräten
const nhMix=(h,n)=>{h^=(n|0);return Math.imul(h,16777619)>>>0};
const nhMixS=(h,s)=>{s=String(s);for(let i=0;i<s.length;i++)h=nhMix(h,s.charCodeAt(i));return h};
export function netHash(g){let h=2166136261;
 h=nhMix(h,g.round);h=nhMix(h,g.timeFrames);h=nhMix(h,g.pf);h=nhMix(h,g.hitstop);h=nhMix(h,g.superFlash);h=nhMixS(h,g.phase);h=nhMix(h,g.frame);
 for(const f of g.fighters){for(const v of[f.x,f.y,f.vx,f.vy,f.hp,f.meter])h=nhMix(h,Math.round(v*64));
  h=nhMix(h,f.wins);h=nhMix(h,f.stun);h=nhMix(h,f.mf);h=nhMix(h,f.sf);h=nhMix(h,f.comboHits);h=nhMix(h,f.facing);h=nhMixS(h,f.state);h=nhMixS(h,f.moveName)}
 h=nhMix(h,g.projectiles.length);for(const p of g.projectiles)h=nhMix(h,Math.round(p.x*64));
 return h}
export class Lockstep{
 // game, inputs = [NetInput P1, NetInput P2], slot = 0 (Gastgeber = P1) | 1 (Gast = P2), sample() -> Zahl (encInput) der eigenen Tasten JETZT,
 // send(obj) -> an den Gegner, onDesync(info), now() -> ms
 constructor(o){this.game=o.game;this.inputs=o.inputs;this.slot=o.slot;this.sample=o.sample;this.send=o.send;this.onDesync=o.onDesync||(()=>{});this.now=o.now||(()=>Date.now());
  this.epoch=0;this.active=false;this.fr=0;this.sent=0;this.delay=NET.delayDefault;this.local=new Map();this.remote=new Map();this.lh=new Map();this.rh=new Map();this.stallAt=0;this.stepped=0;this.dirty=false;this.flushed=-1;this.resendAt=0}
 // Neuer Kampf (Epoche e): Zähler auf 0, die ersten `delay` Frames sind neutral (beide Seiten wissen das, wir schicken sie trotzdem mit)
 start(epoch,delay=NET.delayDefault){this.epoch=epoch;this.delay=Math.max(NET.delayMin,Math.min(NET.delayMax,delay|0));this.fr=0;this.sent=0;this.local.clear();this.remote.clear();this.lh.clear();this.rh.clear();this.stallAt=0;this.stepped=0;this.dirty=false;this.flushed=-1;
  for(const i of this.inputs){i.cur=NEUTRAL;i.clear()}
  for(let f=0;f<this.delay;f++)this.local.set(f,NEUTRAL);this.sent=this.delay;this.active=true;this.dirty=true;this.flush()}
 stop(){this.active=false}
 // Versand gesammelt: höchstens eine Nachricht pro Aufruf (die Spielschleife ruft flush() einmal je Bildschirm-Frame, auch nach mehreren gerechneten Frames).
 // Sie enthält mindestens die letzten `redundancy` Eingaben (Verlust-Schutz bei unzuverlässigen Leitungen) bzw. alle seit dem letzten Versand.
 flush(){if(!this.active||!this.dirty)return;this.dirty=false;const f=this.sent-1,n=Math.min(NET.maxBatch,Math.max(NET.redundancy,f-this.flushed)),a=[];
  for(let k=0;k<n&&f-k>=0;k++){const v=this.local.get(f-k);if(v===undefined)break;a.push(v)}this.flushed=f;this.send({t:'i',e:this.epoch,f,a})}
 recv(m){if(!this.active||m.e!==this.epoch)return;
  if(m.t==='i'&&Array.isArray(m.a)&&m.a.length<=64&&Number.isInteger(m.f)){for(let k=0;k<m.a.length;k++){const f=m.f-k;if(f>=this.fr&&!this.remote.has(f)&&Number.isInteger(m.a[k]))this.remote.set(f,m.a[k]&1023)}}
  else if(m.t==='h'&&Number.isInteger(m.f)){this.rh.set(m.f,m.h);this.check(m.f)}}
 hash(){const f=this.fr,h=netHash(this.game);this.lh.set(f,h);this.send({t:'h',e:this.epoch,f,h});this.check(f)}
 check(f){const a=this.lh.get(f),b=this.rh.get(f);if(a===undefined||b===undefined)return;this.lh.delete(f);this.rh.delete(f);if(a!==b)this.onDesync({frame:f,local:a,remote:b})}
 stalledMs(){return this.stallAt?this.now()-this.stallAt:0}
 // Versucht EINEN Frame zu rechnen. true = gerechnet (der Aufrufer ruft danach arcade.update()), false = wartet auf die Eingabe des Gegners
 step(){if(!this.active)return false;const fr=this.fr;
  if(this.sent<=fr+this.delay){const v=this.sample()&1023;this.local.set(this.sent,v);this.sent++;this.dirty=true}   // genau eine neue Abtastung pro gerechnetem Frame
  const l=this.local.get(fr),r=this.remote.get(fr);
  if(l===undefined||r===undefined){const t=this.now();if(!this.stallAt){this.stallAt=t;this.resendAt=t}
   else if(t-this.resendAt>=NET.resendMs){this.resendAt=t;this.flushed=this.sent-1-NET.maxBatch;this.dirty=true}   // wartet länger: letzte Eingaben nochmal schicken (falls eine Nachricht auf unzuverlässiger Leitung verloren ging)
   return false}
  this.stallAt=0;this.inputs[this.slot].cur=l;this.inputs[1-this.slot].cur=r;
  this.game.step();this.fr=fr+1;this.stepped++;
  this.local.delete(fr-NET.keep);this.remote.delete(fr-NET.keep);
  if(this.fr%NET.hashEvery===0)this.hash();
  return true}
}
