// WebAudio-Soundbank. Samples liegen als Data-URI in window.__SFX__ (vom Build aus /sfx eingebettet, läuft also per Doppelklick).
// Browser starten Audio erst nach einer Nutzer-Geste -> unlock() beim ersten Tastendruck/Klick. Leichte Tonhöhen-Variation gegen Wiederholung,
// Mindestabstand je Sound (Mehrfachtreffer/Hyper-Beam) und Stimmen-Limit. Kompressor am Ausgang, damit geschichtete Treffer nicht übersteuern.
const GAP={block_guard:45,body_fall:60,whoosh_light:40,whoosh_heavy:40,land:60,punch_light:35,punch_medium:35,punch_heavy:35,kick_light:35,kick_heavy:35,heavy_hit_impact:50,hit_critical:120,ko_hit:400,ui_round_start:600};
export class Sound{
 constructor(){this.vol=.7;this.muted=false;this.ctx=null;this.master=null;this.buf={};this.last={};this.voices=0;this.src=(typeof window!=='undefined'&&window.__SFX__)||{}}
 get available(){return Object.keys(this.src).length>0}
 // Muss aus einer Nutzer-Geste heraus aufgerufen werden (keydown/pointerdown)
 unlock(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!this.available)return;
  if(!this.ctx){try{this.ctx=new AC()}catch(e){return}
   const c=this.ctx,comp=c.createDynamicsCompressor();this.master=c.createGain();if(c.createBiquadFilter){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6500;lp.Q.value=.5;this.master.connect(lp);lp.connect(comp)}else this.master.connect(comp);comp.connect(c.destination);this.apply();
   for(const n in this.src)this.decode(n)}
  if(this.ctx.state==='suspended')this.ctx.resume()}
 decode(n){try{const b64=this.src[n].split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
   const ok=b=>{this.buf[n]=b},bad=()=>{},p=this.ctx.decodeAudioData(u.buffer,ok,bad);if(p&&p.catch)p.catch(bad)}catch(e){}}
 apply(){if(this.master)this.master.gain.value=this.muted?0:this.vol}
 setVolume(v){this.vol=Math.max(0,Math.min(1,v));this.apply()}
 setMuted(m){this.muted=!!m;this.apply()}
 play(name,o){const c=this.ctx,b=this.buf[name];if(!c||!b||this.muted||this.vol<=0||c.state!=='running')return;
  const now=performance.now(),gap=GAP[name]||25;if(now-(this.last[name]===undefined?-1e9:this.last[name])<gap||this.voices>=28)return;this.last[name]=now;
  const vol=(o&&o.vol!==undefined)?o.vol:1,rate=(o&&o.rate)||1;
  const s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate*(.96+Math.random()*.08);g.gain.value=vol;s.connect(g);g.connect(this.master);
  this.voices++;s.onended=()=>{this.voices--;g.disconnect()};s.start()}
}
