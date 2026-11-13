// Verbindung zum H!TisOP-Server (server/server.js): Raum erstellen / beitreten / Schnellsuche, Nachrichten an den Gegner, Ping.
// Zustände: closed -> connecting -> open (verbunden, frei) -> hosting (Raum offen, wartet) | queued (Schnellsuche) -> paired (Gegner da)
// Kein DOM: WebSocket-Klasse und Uhr werden hereingereicht (Tests nutzen Node's WebSocket).
export function netServerUrl(loc=(typeof location!=='undefined'?location:null),over=(typeof window!=='undefined'?window.__ONLINE_URL__:null)){
 if(over)return String(over).replace(/^http/i,'ws').replace(/\/+$/,'')+'/ws';
 if(!loc||!/^https?:$/.test(loc.protocol))return null;   // Datei per Doppelklick geöffnet: kein Server bekannt
 return (loc.protocol==='https:'?'wss://':'ws://')+loc.host+'/ws'}
export class NetClient{
 constructor(o={}){this.url=o.url;this.WS=o.WS||(typeof WebSocket!=='undefined'?WebSocket:null);this.now=o.now||(()=>Date.now());
  this.state='closed';this.role=null;this.code=null;this.rtt=0;this.err='';this.ws=null;this.h={};this.pt=null;this.sentPings=0}
 on(ev,fn){this.h[ev]=fn;return this}
 emit(ev,a){const f=this.h[ev];if(f)f(a)}
 set(s){if(this.state!==s){this.state=s;this.emit('state',s)}}
 connect(){return new Promise((res,rej)=>{
  if(!this.url||!this.WS){this.err='nourl';return rej(new Error('nourl'))}
  if(this.ws&&this.state!=='closed')return res();
  this.set('connecting');let done=false;const ws=this.ws=new this.WS(this.url);
  const to=setTimeout(()=>{if(!done){done=true;try{ws.close()}catch(e){}this.set('closed');rej(new Error('timeout'))}},20000);   // Render-Gratis-Server braucht nach Pause bis zu ~1 Minute zum Aufwachen
  ws.onopen=()=>{};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
   if(m.t==='hello'&&!done){done=true;clearTimeout(to);this.set('open');res()}
   this.onMsg(m)};
  ws.onerror=()=>{};
  ws.onclose=()=>{clearTimeout(to);const was=this.state;this.stopPing();this.role=null;this.code=null;this.ws=null;this.set('closed');if(!done){done=true;rej(new Error('closed'))}else if(was!=='closed')this.emit('close')}})}
 onMsg(m){switch(m.t){
  case'hosted':this.code=m.code;this.set('hosting');break;
  case'queued':this.set('queued');break;
  case'paired':this.role=m.role;this.code=m.code||null;this.rtt=0;this.set('paired');this.startPing();break;
  case'left':this.stopPing();this.role=null;this.code=null;this.set('open');this.emit('left');break;
  case'idle':this.stopPing();this.role=null;this.code=null;if(this.state!=='closed')this.set('open');break;
  case'err':this.err=m.code||'err';this.emit('error',m);break;
  case'x':{const d=m.d;if(!d||typeof d.t!=='string')break;
   if(d.t==='p'){this.sendPeer({t:'q',ts:d.ts});break}   // Ping des Gegners beantworten
   if(d.t==='q'){const r=this.now()-d.ts;if(r>=0&&r<10000)this.rtt=this.rtt?this.rtt*.7+r*.3:r;this.emit('rtt',this.rtt);break}
   this.emit('peer',d);break}}}
 raw(o){if(this.ws&&this.ws.readyState===1)this.ws.send(JSON.stringify(o))}
 host(){this.err='';this.raw({t:'host'})}
 join(code){this.err='';this.raw({t:'join',code})}
 quick(){this.err='';this.raw({t:'quick'})}
 cancel(){this.raw({t:'cancel'})}
 bye(){this.raw({t:'bye'})}
 sendPeer(d){if(this.ws&&this.ws.readyState===1)this.ws.send(JSON.stringify({t:'x',d}))}
 startPing(){this.stopPing();const go=()=>this.sendPeer({t:'p',ts:this.now()});go();this.pt=setInterval(go,2000)}
 stopPing(){if(this.pt){clearInterval(this.pt);this.pt=null}}
 close(){this.stopPing();if(this.ws){try{this.ws.close()}catch(e){}}}
}
