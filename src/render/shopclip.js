// Transfer-Clip beim Betreten des Shops: die ersten 3,7 s des Händler-Videos (assets/shop/shopclip.mp4, vom Build als Data-URI in window.__SHOPCLIP__ eingebettet).
// Läuft als DOM-Overlay #shopclip über dem Spiel (mit Ton, Menümusik wird währenddessen leiser). Enter / Esc / Leertaste / Klick überspringt, andere Tasten werden verschluckt.
// Fehler (kein DOM, kein Codec, Video startet nicht) = Shop erscheint einfach ohne Clip.
export class ShopClip{
 constructor(duck,onDone){this.duck=duck||(()=>{});this.onDone=onDone||(()=>{});this.active=false;this.endedAt=-1e9;this.root=null;this.v=null;this.url=null;this._wd=0}
 start(){if(this.active)return true;try{return this._start()}catch(e){this.active=false;this._end(false);return false}}
 _start(){const d=typeof document!=='undefined'?document:null,src=typeof window!=='undefined'?window.__SHOPCLIP__:null;
  this.root=d&&d.getElementById('shopclip');if(!this.root||!src)return false;
  const v=this.v=this.root.querySelector('video');
  try{const b=atob(src.split(',')[1]),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);this.url=URL.createObjectURL(new Blob([u],{type:'video/mp4'}))}catch(e){this.url=src}
  this.active=true;this.root.classList.remove('hidden','out');
  v.muted=false;v.volume=1;v.playsInline=true;v.controls=false;v.loop=false;v.preload='auto';
  v.src=this.url;v.onended=()=>this.finish();v.onerror=()=>this.finish();
  const sk=this.root.querySelector('#shopclip-skip');if(sk)sk.onclick=e=>{e.stopPropagation();this.finish()};
  this.root.onclick=()=>this.finish();
  try{this.duck(true)}catch(e){}
  let p;try{v.currentTime=0;p=v.play()}catch(e){this.finish();return false}
  if(p&&p.catch)p.catch(()=>{try{v.muted=true;const q=v.play();if(q&&q.catch)q.catch(()=>this.finish())}catch(e){this.finish()}});   // Browser blockt Ton -> stumm abspielen statt hängen
  this._wd=setTimeout(()=>{if(this.active&&(!this.v||this.v.currentTime<=0))this.finish()},4000);
  return true}
 // true = Taste wurde hier verarbeitet (Enter/Esc/Leertaste überspringen, alles andere wird verschluckt; kurz danach gehaltenes Enter ignorieren)
 key(e){if(!this.active){return typeof performance!=='undefined'&&performance.now()-this.endedAt<350&&(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Space'||e.code==='Escape')}
  if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Escape'||e.code==='Space')this.finish();return true}
 skip(){if(this.active)this.finish()}
 finish(){const was=this.active;this.active=false;clearTimeout(this._wd);if(was)this.endedAt=typeof performance!=='undefined'?performance.now():-1e9;this._end(was)}
 _end(was){const v=this.v,url=this.url,r=this.root;this.url=null;
  try{this.duck(false)}catch(e){}
  if(v){try{v.pause()}catch(e){}}
  const unload=()=>{if(v){try{v.removeAttribute('src');v.load()}catch(e){}}if(url&&url.startsWith('blob:')){try{URL.revokeObjectURL(url)}catch(e){}}};
  if(r){try{r.classList.add('out');setTimeout(()=>{try{r.classList.add('hidden')}catch(e){}unload()},350)}catch(e){unload()}}else unload();
  if(was)this.onDone()}
}
