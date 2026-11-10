// WebAudio-Soundbank. Samples liegen als Data-URI in window.__SFX__ (vom Build aus /sfx eingebettet, läuft also per Doppelklick).
// Browser starten Audio erst nach einer Nutzer-Geste -> unlock() beim ersten Tastendruck/Klick. Leichte Tonhöhen-Variation gegen Wiederholung,
// Mindestabstand je Sound (Mehrfachtreffer/Hyper-Beam) und Stimmen-Limit. Kompressor am Ausgang, damit geschichtete Treffer nicht übersteuern.
// Hintergrundmusik: Tracks (music/<name>.ogg, vom Build als Data-URI in window.__MUSIC__) laufen als Loop auf eigenem Bus (nicht durch Kompressor/Tiefpass der Effekte).
// 'menu' = Charakter-/Stage-Auswahl, 'fight' = Kämpfe. Pegel je Track relativ zur Gesamtlautstärke, damit Treffer-Sounds obenauf bleiben. Wechsel per Crossfade.
const MUSIC_VOL={menu:.8,fight:.7},FADE_IN=.9,FADE_OUT=.7;
const GAP={block_guard:45,body_fall:60,whoosh_light:40,whoosh_heavy:40,land:60,punch_light:35,punch_medium:35,punch_heavy:35,kick_light:35,kick_heavy:35,heavy_hit_impact:50,hit_critical:120,ko_hit:400,fw_finale:400,fw_rocket:150,ui_round_start:600};
export class Sound{
 constructor(){this.vol=.7;this.muted=false;this.ctx=null;this.master=null;this.buf={};this.last={};this.voices=0;this.src=(typeof window!=='undefined'&&window.__SFX__)||{};
  this.msrc=(typeof window!=='undefined'&&window.__MUSIC__)||{};this.mbuf={};this.mvol=1;this.mmuted=false;this.want=null;this.cur=null;this.node=null;this.mbus=null}
 get available(){return Object.keys(this.src).length>0||Object.keys(this.msrc).length>0}
 // Muss aus einer Nutzer-Geste heraus aufgerufen werden (keydown/pointerdown)
 unlock(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!this.available)return;
  if(!this.ctx){try{this.ctx=new AC()}catch(e){return}
   const c=this.ctx,comp=c.createDynamicsCompressor();this.master=c.createGain();if(c.createBiquadFilter){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6500;lp.Q.value=.5;this.master.connect(lp);lp.connect(comp)}else this.master.connect(comp);comp.connect(c.destination);this.mbus=c.createGain();const lim=c.createDynamicsCompressor();if(lim.threshold){lim.threshold.value=-4;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.003;lim.release.value=.15}this.mbus.connect(lim);lim.connect(c.destination);   // Limiter: Musik-Regler bis 200 % ohne Übersteuern
   this.apply();
   for(const n in this.src)this.decode(n);
   const mn=Object.keys(this.msrc).sort((a,b)=>(a===this.want?-1:0)-(b===this.want?-1:0));for(const n of mn)this.decodeMusic(n)}
  if(this.ctx.state==='suspended')this.ctx.resume()}
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
 // Gewünschten Track setzen (null = keine Musik). Darf jederzeit aufgerufen werden (auch vor dem Unlock/Decode): läuft los, sobald Audio freigeschaltet und der Track dekodiert ist. Gleicher Track = keine Unterbrechung.
 music(name){this.want=name||null;this.startMusic()}
 startMusic(){const c=this.ctx,n=this.want;if(!c||!this.mbus||n===this.cur)return;if(n&&!this.mbuf[n])return;   // noch nicht dekodiert: alter Track läuft weiter
  const t=c.currentTime,old=this.node;
  if(old){try{old.g.gain.cancelScheduledValues(t);old.g.gain.setValueAtTime(old.g.gain.value,t);old.g.gain.linearRampToValueAtTime(0,t+FADE_OUT);old.s.stop(t+FADE_OUT+.05)}catch(e){}old.s.onended=()=>{try{old.g.disconnect()}catch(e){}}}
  this.node=null;this.cur=n;if(!n)return;
  const s=c.createBufferSource(),g=c.createGain();s.buffer=this.mbuf[n];s.loop=true;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(MUSIC_VOL[n]===undefined?.4:MUSIC_VOL[n],t+FADE_IN);s.connect(g);g.connect(this.mbus);s.start(t);this.node={s,g}}
 // Tab/Fenster nicht sichtbar: Audio anhalten statt im Hintergrund weiterzuspielen
 suspend(){if(this.ctx&&this.ctx.state==='running')this.ctx.suspend()}
 resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()}
 play(name,o){const base=name;if(this.buf[name+'_b']&&Math.random()<.5)name+='_b';   // Varianten: <name>_b wechselt zufällig mit <name> (Schlag-Sounds)
  const c=this.ctx,b=this.buf[name];if(!c||!b||this.muted||this.vol<=0||c.state!=='running')return;
  const now=performance.now(),gap=GAP[base]||25;if(now-(this.last[base]===undefined?-1e9:this.last[base])<gap||this.voices>=28)return;this.last[base]=now;
  const vol=(o&&o.vol!==undefined)?o.vol:1,rate=(o&&o.rate)||1;
  const s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.playbackRate.value=rate*(.96+Math.random()*.08);g.gain.value=vol;s.connect(g);g.connect(this.master);
  this.voices++;s.onended=()=>{this.voices--;g.disconnect()};s.start()}
}
