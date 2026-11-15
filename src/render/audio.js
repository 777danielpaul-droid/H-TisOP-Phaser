
import{Stage}from'./stage.js';
// WebAudio-Soundbank. Samples liegen als Data-URI in window.__SFX__ (vom Build aus /sfx eingebettet, läuft also per Doppelklick).
// Browser starten Audio erst nach einer Nutzer-Geste -> unlock() beim ersten Tastendruck/Klick. Leichte Tonhöhen-Variation gegen Wiederholung,
// Mindestabstand je Sound (Mehrfachtreffer/Hyper-Beam) und Stimmen-Limit. Kompressor am Ausgang, damit geschichtete Treffer nicht übersteuern.
// Hintergrundmusik: Tracks (music/<name>.ogg, vom Build als Data-URI in window.__MUSIC__) laufen als Loop auf eigenem Bus (nicht durch Kompressor/Tiefpass der Effekte).
// 'menu' = Charakter-/Stage-Auswahl, 'fight' = Kämpfe. Pegel je Track relativ zur Gesamtlautstärke, damit Treffer-Sounds obenauf bleiben. Wechsel per Crossfade.
export const MUSIC_VOL={menu:.8,fight:.7},FADE_IN=.9,FADE_OUT=.7;
export const GAP={block_guard:45,body_fall:60,whoosh_light:40,whoosh_heavy:40,land:60,punch_light:35,punch_medium:35,punch_heavy:35,kick_light:35,kick_heavy:35,heavy_hit_impact:50,hit_critical:120,ko_hit:400,fw_finale:400,fw_rocket:150,ui_round_start:600};
export const newPl=()=>({items:[],on:false,shuf:false,order:null,i:0,a:null,g:null,fails:0,broken:false,stopT:0,loaded:null});
export class Sound{
 constructor(){this.vol=.7;this.muted=false;this.ctx=null;this.master=null;this.buf={};this.last={};this.voices=0;this.src=(typeof window!=='undefined'&&window.__SFX__)||{};
  this.msrc=(typeof window!=='undefined'&&window.__MUSIC__)||{};this.mbuf={};this.mvol=1;this.mmuted=false;this.want=null;this.cur=null;this.node=null;this.mbus=null;
  this.pl={menu:newPl(),fight:newPl()}}   // eigene Playlists (Menü / Kampf)
 get available(){return Object.keys(this.src).length>0||Object.keys(this.msrc).length>0}
 // Muss aus einer Nutzer-Geste heraus aufgerufen werden (keydown/pointerdown)
 unlock(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!this.available)return;
  if(!this.ctx){try{this.ctx=new AC()}catch(e){return}
   const c=this.ctx,comp=c.createDynamicsCompressor();this.master=c.createGain();if(c.createBiquadFilter){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6500;lp.Q.value=.5;this.master.connect(lp);lp.connect(comp)}else this.master.connect(comp);comp.connect(c.destination);this.mbus=c.createGain();const lim=c.createDynamicsCompressor();if(lim.threshold){lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.003;lim.release.value=.15}this.mbus.connect(lim);lim.connect(c.destination);   // Limiter: Musik-Regler bis 200 % ohne Übersteuern
   this.apply();
   for(const n in this.src)this.decode(n);
   const mn=Object.keys(this.msrc).sort((a,b)=>(a===this.want?-1:0)-(b===this.want?-1:0));for(const n of mn)this.decodeMusic(n)}
  if(this.ctx.state==='suspended')this.ctx.resume();
  if(this.node&&this.node.pl&&this.node.pl.a.paused){const r=this.node.pl.a.play();if(r&&r.catch)r.catch(()=>{})}}   // Playlist vor der ersten Eingabe vom Browser blockiert -> jetzt starten
 decode(n){try{const b64=this.src[n].split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
   const ok=b=>{this.buf[n]=b},bad=()=>{},p=this.ctx.decodeAudioData(u.buffer,ok,bad);if(p&&p.catch)p.catch(bad)}catch(e){}}
 apply(){const v=this.muted?0:this.vol;if(this.master)this.master.gain.value=v;if(this.mbus)this.mbus.gain.value=this.mmuted?0:v*this.mvol}
 // Musik getrennt von den Effekten: eigener Schalter + Regler (wirkt zusätzlich zur Gesamtlautstärke)
 setMusicVolume(v){this.mvol=Math.max(0,Math.min(2,v));this.apply()}
 setMusicMuted(m){this.mmuted=!!m;this.apply()}
 setVolume(v){this.vol=Math.max(0,Math.min(1,v));this.apply()}
 setMuted(m){this.muted=!!m;this.apply()}
 decodeMusic(n){try{const b64=this.msrc[n].split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
   const ok=b=>{this.mbuf[n]=b;if(this.want===n)this.startMusic()},bad=()=>{},p=this.ctx.decodeAudioData(u.buffer,ok,bad);if(p&&p.catch)p.catch(bad)}catch(e){}}
 // ---- Eigene Playlists (vom Spieler: Menü-Musik / Kampf-Musik) ----
 // Die Lieder werden als <audio> gestreamt (nicht komplett dekodiert, spart Speicher bei langen Songs) und über den Musik-Bus geleitet:
 // Musik-Regler, Stumm und Limiter wirken also auch hier. Ist für den gewünschten Bereich eine Playlist aktiv, ersetzt sie den eingebauten Track.
 plActive(k){const p=this.pl[k];return !!(p&&p.on&&p.items.length&&!p.broken)}
 // items: [{name,url}] · on: Playlist verwenden · shuf: zufällige Reihenfolge. Startet die Playlist neu (falls sie gerade läuft).
 setPlaylist(k,items,on,shuf){const p=this.pl[k];if(!p)return;const was=this.cur==='pl:'+k;
  clearTimeout(p.stopT);if(p.a){try{p.a.pause();p.a.removeAttribute('src');p.a.load()}catch(e){}}
  if(was){if(this.node){try{this.node.g.gain.cancelScheduledValues(0);this.node.g.gain.value=0}catch(e){}}this.node=null;this.cur=null}
  Object.assign(p,{items:items.slice(),on:!!on,shuf:!!shuf,order:null,i:0,fails:0,broken:false,loaded:null});this.startMusic()}
 plNow(k){const p=this.pl[k];if(!p||this.cur!=='pl:'+k||!p.order)return -1;return p.order[p.i]===undefined?-1:p.order[p.i]}   // Index des laufenden Liedes (oder -1)
 plShuffle(p){const o=p.items.map((_,i)=>i);if(p.shuf)for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]]}p.order=o;p.i=0}
 plLoad(p){if(!p.order||p.order.length!==p.items.length)this.plShuffle(p);const it=p.items[p.order[p.i]];if(!it)return false;if(p.loaded!==it.url){p.a.src=it.url;p.loaded=it.url}p.a.loop=p.items.length===1;return true}
 plNext(k){const p=this.pl[k];if(!p||!p.items.length||!p.a)return;p.i++;if(!p.order||p.i>=p.order.length){if(p.shuf)this.plShuffle(p);else p.i=0}if(this.plLoad(p)){const r=p.a.play();if(r&&r.catch)r.catch(()=>{})}}
 plFail(k){const p=this.pl[k];if(!p)return;if(++p.fails>=p.items.length){p.broken=true;if(this.cur==='pl:'+k){this.node=null;this.cur=null}this.startMusic();return}this.plNext(k)}   // kaputtes Lied überspringen; sind alle kaputt -> eingebaute Musik
 // Gewünschten Track setzen (null = keine Musik). Darf jederzeit aufgerufen werden (auch vor dem Unlock/Decode): läuft los, sobald Audio freigeschaltet und der Track dekodiert ist. Gleicher Track = keine Unterbrechung.
 music(name){this.want=name||null;this.startMusic()}
 startMusic(){const c=this.ctx,n=this.want;if(!c||!this.mbus)return;const upl=!!n&&this.plActive(n),key=upl?'pl:'+n:n;if(key===this.cur)return;
  if(!upl&&n&&!this.mbuf[n])return;   // noch nicht dekodiert: alter Track läuft weiter
  const t=c.currentTime,old=this.node;
  if(old){try{old.g.gain.cancelScheduledValues(t);old.g.gain.setValueAtTime(old.g.gain.value,t);old.g.gain.linearRampToValueAtTime(0,t+FADE_OUT)}catch(e){}
   if(old.pl){const op=old.pl;clearTimeout(op.stopT);op.stopT=setTimeout(()=>{try{op.a.pause()}catch(e){}},(FADE_OUT+.05)*1000)}   // Playlist bleibt an ihrer Stelle stehen (Menü ↔ Kampf)
   else{try{old.s.stop(t+FADE_OUT+.05)}catch(e){}old.s.onended=()=>{try{old.g.disconnect()}catch(e){}}}}
  this.node=null;this.cur=key;if(!n)return;
  const vol=MUSIC_VOL[n]===undefined?.4:MUSIC_VOL[n];
  if(upl){const p=this.pl[n];
   if(!p.a){p.a=new Audio();p.a.preload='auto';p.src=c.createMediaElementSource(p.a);p.g=c.createGain();p.src.connect(p.g);p.g.connect(this.mbus);
    p.a.onended=()=>this.plNext(n);p.a.onerror=()=>this.plFail(n);p.a.onplaying=()=>{p.fails=0}}
   clearTimeout(p.stopT);p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(0,t);p.g.gain.linearRampToValueAtTime(vol,t+FADE_IN);
   if(this.plLoad(p)){const r=p.a.play();if(r&&r.catch)r.catch(()=>{})}
   this.node={pl:p,g:p.g};return}
  const s=c.createBufferSource(),g=c.createGain();s.buffer=this.mbuf[n];s.loop=true;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+FADE_IN);s.connect(g);g.connect(this.mbus);s.start(t);this.node={s,g}}
 // Tab/Fenster nicht sichtbar: Audio anhalten statt im Hintergrund weiterzuspielen
 suspend(){if(this.ctx&&this.ctx.state==='running')this.ctx.suspend();for(const k in this.pl){const p=this.pl[k];if(p.a&&!p.a.paused)p.a.pause()}}   // <audio> läuft sonst lautlos weiter
 resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();if(this.node&&this.node.pl){const r=this.node.pl.a.play();if(r&&r.catch)r.catch(()=>{})}}
 play(name,o){const base=name;if(this.buf[name+'_b']&&Math.random()<.5)name+='_b';   // Varianten: <name>_b wechselt zufällig mit <name> (Schlag-Sounds)
  const c=this.ctx,b=this.buf[name];if(!c||!b||this.muted||this.vol<=0||c.state!=='running')return;
  const now=performance.now(),gap=GAP[base]||25;if(now-(this.last[base]===undefined?-1e9:this.last[base])<gap||this.voices>=28)return;this.last[base]=now;
  const vol=(o&&o.vol!==undefined)?o.vol:1,rate=(o&&o.rate)||1;
  const s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate*(.96+Math.random()*.08);g.gain.value=vol;s.connect(g);g.connect(this.master);
  this.voices++;s.onended=()=>{this.voices--;g.disconnect()};s.start()}
}
