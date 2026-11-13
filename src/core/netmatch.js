import{Lockstep,NET,NetInput}from'./netplay.js';
import{SPEED}from'./config.js';
// Ablauf eines Online-Matches auf Basis von NetClient (Verbindung) + Lockstep (Rechnen). Kein DOM, kein Canvas -> headless testbar (tests/online.test.js).
//   pick   : beide wählen Figur + Farbe und drücken BEREIT; der Gastgeber (P1, links) wählt die Stage und startet
//   launch : beide zeigen ihre Start-Animation (Videos/Feuerwerk, dauert je Gerät unterschiedlich lang) und rufen danach launched()
//   wait   : eigenes Gerät fertig, wartet auf den Gegner ("rdy"); danach beginnt der Lockstep bei Frame 0
//   play   : Kampf läuft (auch der Ergebnisbildschirm); Revanche = beide drücken -> neue Epoche, gleiche Figuren, ohne Videos
// Epoche = laufende Nummer des Kampfes: Nachrichten einer anderen Epoche werden verworfen bzw. (zu früh) zurückgehalten.
// Hooks (alle optional): onChange(), onLaunch(cfg,{rematch}), onStart(), onEnd(reason: 'left'|'peer-left'|'disconnected'|'desync'|'timeout')
export class NetMatch{
 constructor(o){this.client=o.client;this.game=o.game;this.h=o.hooks||{};this.valid=o.valid||(()=>true);this.altSkin=o.altSkin||((id,k)=>k?0:1);this.now=o.now||(()=>Date.now());
  this.inputs=o.inputs||[new NetInput(),new NetInput()];this.role=this.client.role;this.slot=this.role==='host'?0:1;
  this.me={id:null,skin:0,ready:false};this.them={id:null,skin:0,ready:false};this.cfg=null;this.epoch=0;this.phase='pick';this.localReady=false;
  this.rdy=new Set();this.myRm=-1;this.theirRm=-1;this.early=new Map();this.ended=null;this.desync=null;
  this.ls=new Lockstep({game:this.game,inputs:this.inputs,slot:this.slot,sample:o.sample||(()=>5),send:d=>this.client.sendPeer(d),now:this.now,onDesync:i=>{this.desync=i;this.end('desync')}});
  this.client.on('peer',d=>this.onPeer(d)).on('left',()=>this.end('peer-left')).on('close',()=>this.end('disconnected'))}
 get host(){return this.role==='host'}
 get rtt(){return this.client.rtt}
 change(){if(this.h.onChange)this.h.onChange()}
 // ---- Auswahl ----
 sendPick(){this.client.sendPeer({t:'pick',id:this.me.id,skin:this.me.skin|0,ready:!!this.me.ready})}
 pick(id,skin=0){if(this.phase!=='pick')return;this.me.id=id;this.me.skin=skin|0;this.me.ready=false;this.sendPick();this.change()}
 setReady(b){if(this.phase!=='pick'||!this.me.id)return;this.me.ready=!!b;this.sendPick();this.change()}
 canStart(){return this.host&&this.phase==='pick'&&this.me.ready&&this.them.ready&&!!this.me.id&&!!this.them.id}
 hostStart(stage){if(!this.canStart())return false;const cfg={ids:[this.me.id,this.them.id],skins:[this.me.skin|0,this.them.skin|0],stage:stage|0,e:1};
  if(cfg.ids[0]===cfg.ids[1]&&cfg.skins[0]===cfg.skins[1])cfg.skins[1]=this.altSkin(cfg.ids[1],cfg.skins[1]);   // gleiche Figur in gleicher Farbe: Gast bekommt eine andere (wie im 2-Spieler-Modus)
  this.client.sendPeer({t:'go',cfg});this.begin(cfg,false);return true}
 begin(cfg,rematch){this.cfg=cfg;this.epoch=cfg.e;this.phase='launch';this.localReady=false;this.myRm=this.theirRm=-1;this.ls.stop();this.change();
  if(this.h.onLaunch)this.h.onLaunch(cfg,{rematch});else this.launched()}
 // Start-Animation fertig und das Spiel mit cfg vorbereitet (Arcade.startOnline) -> dem Gegner melden
 launched(){if(this.phase!=='launch')return;this.localReady=true;this.phase='wait';this.client.sendPeer({t:'rdy',e:this.epoch});this.change();this.tryStart()}
 tryStart(){if(this.phase!=='wait'||!this.localReady||!this.rdy.has(this.epoch))return;
  const rtt=this.client.rtt,frameMs=1000/(60*SPEED),d=rtt?Math.ceil(rtt/2/frameMs)+3:NET.delayDefault;   // halbe Laufzeit in Frames + 3 Frames Puffer gegen Schwankungen
  this.phase='play';this.ls.start(this.epoch,d);
  const q=this.early.get(this.epoch);if(q){for(const m of q)this.ls.recv(m)}for(const k of[...this.early.keys()])if(k<=this.epoch)this.early.delete(k);
  this.change();if(this.h.onStart)this.h.onStart()}
 // ---- Revanche ----
 requestRematch(){if(this.phase!=='play'||this.myRm===this.epoch)return;this.myRm=this.epoch;this.client.sendPeer({t:'rm',e:this.epoch});this.change();this.checkRematch()}
 get rematchWait(){return this.myRm===this.epoch&&this.theirRm!==this.epoch}
 checkRematch(){if(this.phase!=='play'||this.myRm!==this.epoch||this.theirRm!==this.epoch)return;this.rdy.delete(this.epoch);const cfg={...this.cfg,e:this.epoch+1};this.begin(cfg,true)}
 // ---- Nachrichten des Gegners ----
 onPeer(d){switch(d.t){
  case'pick':if(this.phase==='pick'&&typeof d.id==='string'&&this.valid(d.id)){this.them.id=d.id;this.them.skin=d.skin|0;this.them.ready=!!d.ready;this.change()}break;
  case'go':if(!this.host&&this.phase==='pick'&&d.cfg&&Array.isArray(d.cfg.ids)&&d.cfg.ids.every(i=>this.valid(i))){const c=d.cfg;this.begin({ids:[c.ids[0],c.ids[1]],skins:[c.skins[0]|0,c.skins[1]|0],stage:c.stage|0,e:c.e|0||1},false)}break;
  case'rdy':if(Number.isInteger(d.e)){this.rdy.add(d.e);this.tryStart()}break;
  case'rm':if(Number.isInteger(d.e)){this.theirRm=d.e;this.change();this.checkRematch()}break;
  case'i':case'h':if(this.phase==='play'&&d.e===this.epoch)this.ls.recv(d);
   else if(Number.isInteger(d.e)&&d.e>=this.epoch&&this.phase!=='closed'){const q=this.early.get(d.e)||[];if(q.length<400){q.push(d);this.early.set(d.e,q)}}break}}
 // ---- Takt (aus der Spielschleife) ----
 step(){return this.phase==='play'&&this.ls.step()}
 flush(){if(this.phase==='play')this.ls.flush()}   // einmal je Bildschirm-Frame nach dem Rechnen: verschickt die neu abgetasteten Eingaben gesammelt
 poll(){if(this.phase==='play'&&this.ls.stalledMs()>NET.stallDeadMs)this.end('timeout')}
 get stalledMs(){return this.phase==='play'?this.ls.stalledMs():0}
 leave(){if(this.ended)return;this.client.bye();this.end('left')}
 end(reason){if(this.ended)return;this.ended=reason;this.phase='closed';this.ls.stop();this.change();if(this.h.onEnd)this.h.onEnd(reason)}
}
