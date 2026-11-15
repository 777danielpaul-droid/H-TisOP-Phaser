// Intro-Video beim Spielstart (assets/intro/intro.mp4, vom Build als Data-URI in window.__INTRO__ eingebettet, läuft also per Doppelklick und online).
// KEIN Startknopf: das (stumme) Video läuft sofort los, Enter / Esc / Klick auf „Überspringen“ beendet es. Die Menümusik wird gleichzeitig angefordert;
// Browser geben Ton erst nach der ersten Eingabe frei -> bis dahin zeigt ein kleiner Hinweis „Beliebige Taste = Ton an“, danach setzt die Musik sofort ein.
export class Intro{
 constructor(onDone,beforePlay,audioOn){this.onDone=onDone||(()=>{});this.beforePlay=beforePlay||null;this.audioOn=audioOn||(()=>true);this.active=false;this.endedAt=-1e9;this.root=null;this.v=null;this.url=null;this._wd=0;this._hint=0}
 start(){try{return this._start()}catch(e){this.active=false;this.finish();return false}}   // jeder Fehler (kein DOM, kein Codec …) = ohne Intro weiter
 _start(){const d=typeof document!=='undefined'?document:null,src=typeof window!=='undefined'?window.__INTRO__:null;
  this.root=d&&d.getElementById('intro');
  if(!this.root||!src){this.finish();return false}
  const v=this.v=this.root.querySelector('video');
  this.active=true;this.root.classList.remove('hidden');
  try{const b64=src.split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);this.url=URL.createObjectURL(new Blob([u],{type:'video/mp4'}))}catch(e){this.url=src}   // Blob-URL: zuverlässiger als eine riesige Data-URI
  v.muted=true;v.playsInline=true;v.controls=false;v.loop=false;v.preload='auto';
  const ps=typeof window!=='undefined'&&window.__INTRO_POSTER__;if(ps)v.poster=ps;
  v.onplaying=()=>{try{v.removeAttribute('poster')}catch(e){}};   // Poster nur bis zum ersten echten Bild
  v.src=this.url;v.onended=()=>this.finish();v.onerror=()=>this.finish();
  const sk=this.root.querySelector('#intro-skip');if(sk)sk.onclick=()=>this.skip();
  try{if(this.beforePlay)this.beforePlay()}catch(e){}   // Audio vorbereiten + Menümusik anfordern (startet, sobald der Browser Ton erlaubt)
  const hint=this.root.querySelector('#intro-snd');
  if(hint){const upd=()=>{if(!this.active)return;const off=!this.audioOn();hint.classList.toggle('hidden',!off);if(off)this._hint=setTimeout(upd,250)};upd()}
  const p=v.play();if(p&&p.catch)p.catch(()=>this.finish());
  this._wd=setTimeout(()=>{if(this.active&&(!this.v||this.v.currentTime<=0))this.finish()},5000);   // Video startet nicht -> nicht hängen bleiben
  return true}
 skip(){if(this.active)this.finish()}
 // Taste: während des Videos überspringt Enter/Esc, alles andere wird verschluckt. true = Taste wurde hier verarbeitet.
 key(e){if(!this.active){if(typeof performance!=='undefined'&&performance.now()-this.endedAt<450&&(e.code==='Enter'||e.code==='NumpadEnter')){return true}return false}   // kurz nach dem Skip: gehaltenes Enter startet nicht gleich das Spiel
  if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Escape')this.skip();return true}
 finish(){const was=this.active;this.active=false;if(was)this.endedAt=typeof performance!=='undefined'?performance.now():-1e9;clearTimeout(this._wd);clearTimeout(this._hint);
  const v=this.v,url=this.url;this.url=null;
  // Video erst NACH dem Ausblenden zurücksetzen: ein sofortiges load() blendet kurz das Poster (Standbild des 1. Frames) wieder ein -> sichtbares Aufblitzen beim Übergang zum Demo-Fight
  const unload=()=>{if(v){try{v.removeAttribute('poster');v.removeAttribute('src');v.load()}catch(e){}}if(url&&url.startsWith('blob:')){try{URL.revokeObjectURL(url)}catch(e){}}};
  if(v){try{v.pause()}catch(e){}}   // beim Skip bleibt das aktuelle Bild stehen und wird überblendet
  if(this.root){try{this.root.classList.add('out');const r=this.root;setTimeout(()=>{try{r.classList.add('hidden')}catch(e){}unload()},350)}catch(e){unload()}}else unload();   // kurzes Ausblenden
  if(was||!this.root)this.onDone()}
}
