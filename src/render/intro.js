// Intro-Video mit Startknopf (Klick/Enter schaltet den Ton frei)
export class Intro{
 constructor(onDone,beforePlay){this.onDone=onDone||(()=>{});this.beforePlay=beforePlay||null;this.active=false;this.waiting=false;this.endedAt=-1e9;this.root=null;this.v=null;this.url=null;this._wd=0}
 start(){try{return this._start()}catch(e){this.active=false;this.waiting=false;this.finish();return false}}   // jeder Fehler (kein DOM, kein Codec …) = ohne Intro weiter
 // Zeigt zuerst den Startknopf. Erst der Klick/Enter (= Nutzer-Geste) gibt dem Browser den Ton frei und startet Video + Musik gemeinsam.
 _start(){const d=typeof document!=='undefined'?document:null,src=typeof window!=='undefined'?window.__INTRO__:null;
  this.root=d&&d.getElementById('intro');
  if(!this.root||!src){this.finish();return false}
  const v=this.v=this.root.querySelector('video');
  this.active=true;this.root.classList.remove('hidden');
  try{const b64=src.split(',')[1],bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);this.url=URL.createObjectURL(new Blob([u],{type:'video/mp4'}))}catch(e){this.url=src}   // Blob-URL: zuverlässiger als eine riesige Data-URI
  v.muted=true;v.playsInline=true;v.controls=false;v.loop=false;v.preload='auto';
  const ps=typeof window!=='undefined'&&window.__INTRO_POSTER__;   // Standbild = erster Frame; ohne Poster springt das Video selbst auf Frame 1
  if(ps)v.poster=ps;else v.addEventListener('loadeddata',()=>{if(this.waiting&&v.currentTime<.01){try{v.currentTime=.01}catch(e){}}},{once:true});
  v.src=this.url;
  v.onended=()=>this.finish();v.onerror=()=>this.finish();
  const sk=this.root.querySelector('#intro-skip')||this.root.querySelector('button');if(sk)sk.onclick=()=>this.skip();
  let go=this.root.querySelector('#intro-go');
  if(!go){const w=d.createElement('div');w.id='intro-start';w.innerHTML='<button type="button" id="intro-go">▶ START</button>';this.root.appendChild(w);go=w.querySelector('#intro-go')}
  this.waiting=true;this.root.classList.add('wait');
  go.onclick=()=>this.go();try{go.focus({preventScroll:true})}catch(e){}
  return true}
 go(){if(!this.active||!this.waiting)return;this.waiting=false;
  const go=this.root&&this.root.querySelector('#intro-go');if(go){go.disabled=true;go.textContent='…'}
  let r;try{r=this.beforePlay&&this.beforePlay()}catch(e){}   // läuft synchron im Klick: Audio freischalten
  Promise.resolve(r).catch(()=>{}).then(()=>{if(!this.active)return;this.root.classList.remove('wait');this._play()})}
 _play(){const v=this.v;const p=v.play();if(p&&p.catch)p.catch(()=>this.finish());
  this._wd=setTimeout(()=>{if(this.active&&(!this.v||this.v.currentTime<=0))this.finish()},5000)}   // Video startet nicht -> nicht hängen bleiben
 skip(){if(this.active&&!this.waiting)this.finish()}
 // Taste: Startbildschirm = Enter/Leertaste/Esc starten das Intro; während des Videos überspringt Enter/Esc. true = Taste wurde hier verarbeitet.
 key(e){if(!this.active){if(typeof performance!=='undefined'&&performance.now()-this.endedAt<450&&(e.code==='Enter'||e.code==='NumpadEnter')){return true}return false}   // kurz nach dem Skip: gehaltenes Enter startet nicht gleich das Spiel
  if(this.waiting){if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Space'||e.code==='Escape')this.go();return true}
  if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Escape')this.skip();return true}
 finish(){const was=this.active;this.active=false;this.waiting=false;if(was)this.endedAt=typeof performance!=='undefined'?performance.now():-1e9;clearTimeout(this._wd);
  if(this.v){try{this.v.pause();this.v.removeAttribute('src');this.v.load()}catch(e){}}
  if(this.url&&this.url.startsWith('blob:')){try{URL.revokeObjectURL(this.url)}catch(e){}}this.url=null;
  if(this.root){try{this.root.classList.add('out');const r=this.root;setTimeout(()=>{try{r.classList.add('hidden')}catch(e){}},350)}catch(e){}}   // kurzes Ausblenden
  if(was||!this.root)this.onDone()}
}
