import{H,W}from'../core/config.js';
import{pick}from'../core/loot.js';

import{Story}from'../core/story.js';

import{cover}from'./lootui.js';
import{Renderer}from'./renderer.js';
// Eigene Hintergründe (Bild oder Video). Die Dateien liegen als Blob in IndexedDB (große Videos passen nicht in localStorage),
// die Einstellungen (Abdunklung, Anpassung, Bewegung, Häuser) in localStorage. Nichts wird hochgeladen – alles bleibt im Browser.
// Slots: 'all' = gilt überall, 'title' = Titelmenü, 'select' = Auswahlbildschirme, 'fight' = Kampf (inkl. Story/Melee/Zwischenscreens).
// Ein Einzel-Slot (title/select/fight) kann: leer sein (= erbt 'all'), eine eigene Datei haben, oder auf 'off' stehen (= Originalhintergrund).
// Der Zeichencode läuft im Renderer (Canvas 2D): Videos/Bilder werden per drawImage als erste Ebene gezeichnet.
export const BG_SLOTS=['all','title','select','fight'];
export const BG_NAMES={all:'Überall',title:'Titelmenü',select:'Auswahlbildschirme',fight:'Kampf'};
export const BG_DEFAULTS={dim:.25,fit:'cover',parallax:true,houses:true};
export const BG_IMG_EXT=/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/i,BG_VID_EXT=/\.(mp4|m4v|webm|ogv|ogg|mov)$/i;
// Dateityp bestimmen: MIME zuerst, sonst Endung. -> 'image' | 'video' | null
export const bgKind=f=>{if(!f)return null;const t=(f.type||'').toLowerCase(),n=f.name||'';
 if(t.startsWith('image/'))return'image';if(t.startsWith('video/'))return'video';if(BG_IMG_EXT.test(n))return'image';if(BG_VID_EXT.test(n))return'video';return null};
// Welcher Eintrag gilt für einen Slot? Einzel-Slot > 'all'; 'off' = Original (null).
export const resolveSlot=(items,slot)=>{const e=items[slot];if(e&&e.off)return null;if(e)return slot;if(slot!=='all'&&items.all&&!items.all.off)return'all';return null};
export const bgClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const bgHasDoc=()=>typeof document!=='undefined'&&!!document.body;
export class Backdrop{
 constructor(){this.items={};this.media={};this.opts={...BG_DEFAULTS};this.persist=true;this.ready=false;this.onchange=null;this.db=null;this._timer=null;this.mem={};
  try{const o=JSON.parse(localStorage.getItem('hitisop.bg.opts')||'null');if(o&&typeof o==='object'){this.opts.dim=bgClamp(+o.dim,0,.9);if(isNaN(this.opts.dim))this.opts.dim=BG_DEFAULTS.dim;this.opts.fit=o.fit==='contain'?'contain':'cover';this.opts.parallax=o.parallax!==false;this.opts.houses=o.v===2?!!o.houses:true}}catch(e){}}
 saveOpts(){try{localStorage.setItem('hitisop.bg.opts',JSON.stringify({...this.opts,v:2}))}catch(e){}}
 setOpt(k,v){if(k==='dim')v=bgClamp(+v||0,0,.9);if(k==='fit')v=v==='contain'?'contain':'cover';if(k==='parallax'||k==='houses')v=!!v;this.opts[k]=v;this.saveOpts();this.emit()}
 emit(){if(this.onchange)try{this.onchange()}catch(e){}}
 // ---- IndexedDB (Blob je Slot) ----
 openDb(){return new Promise(res=>{try{const r=indexedDB.open('hitisop-bg',1);r.onupgradeneeded=()=>r.result.createObjectStore('bg');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);r.onblocked=()=>res(null)}catch(e){res(null)}})}
 idb(mode,fn){return new Promise(res=>{if(!this.db)return res(null);try{const tx=this.db.transaction('bg',mode),st=tx.objectStore('bg'),r=fn(st);tx.oncomplete=()=>res(r&&r.result!==undefined?r.result:true);tx.onerror=tx.onabort=()=>res(null)}catch(e){res(null)}})}
 async init(){if(this.ready)return;this.db=await this.openDb();this.persist=!!this.db;
  if(this.db)for(const s of BG_SLOTS){const e=await this.idb('readonly',st=>st.get(s));if(e&&(e.off||e.blob)){this.items[s]={name:e.name||'',kind:e.kind||null,off:!!e.off};if(!e.off)try{await this.load(s,e.blob,e.kind)}catch(err){delete this.items[s]}}}
  this.ready=true;this.startTimer();this.emit()}
 // ---- Medien laden ----
 // Videos: stumm, Endlosschleife, unsichtbar im DOM (sonst pausieren manche Browser). Bilder: große Bilder einmal auf max. 2560 px verkleinern; GIF/animiertes WebP werden in Frames zerlegt (siehe frames()).
 async load(slot,blob,kind){this.unload(slot);const url=URL.createObjectURL(blob);let m;
  try{
   if(kind==='video'){const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.loop=true;v.playsInline=true;v.autoplay=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');
    v.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1';document.body.appendChild(v);
    await new Promise((ok,no)=>{v.onloadeddata=ok;v.onerror=()=>no(new Error('Video kann von diesem Browser nicht abgespielt werden (Format/Codec).'));v.src=url;v.load()});
    if(!v.videoWidth)throw new Error('Video enthält kein Bild.');v.play().catch(()=>{});
    m={kind,el:v,src:()=>v,w:()=>v.videoWidth,h:()=>v.videoHeight,url,use:0}}
   else{const nm=this.items[slot]?this.items[slot].name:'',ty=(blob.type||'').toLowerCase()||(/\.gif$/i.test(nm)?'image/gif':/\.webp$/i.test(nm)?'image/webp':''),an=/^image\/(gif|webp)$/.test(ty)?await this.frames(blob,ty):null;
    if(an){URL.revokeObjectURL(url);m={kind,el:null,url:null,use:0,frames:an.fr,w:()=>an.w,h:()=>an.h,src:()=>{const x=(performance.now()%an.total);let f=an.fr[0];for(const q of an.fr){if(q.t0<=x)f=q.bmp;else break}return f}}}   // GIF / animiertes WebP: Frame nach Zeit wählen
    else{const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=()=>no(new Error('Bild kann nicht gelesen werden.'));im.src=url});
     if(!im.naturalWidth)throw new Error('Bild hat keine Größe (SVG ohne Maße?).');
     const k=Math.min(1,2560/Math.max(im.naturalWidth,im.naturalHeight*16/9)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*k));c.height=Math.max(1,Math.round(im.naturalHeight*k));
     c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);m={kind,el:null,src:()=>c,w:()=>c.width,h:()=>c.height,url:null,use:0}}}
  }catch(e){URL.revokeObjectURL(url);throw e}
  this.media[slot]=m}
 // Animierte Bilder (GIF / animiertes WebP) in Einzelframes zerlegen. Der Browser animiert <img> im Canvas nicht zuverlässig, daher eigene Zeitsteuerung.
 // Speichergrenze: max. 400 Frames und ca. 400 MB Bitmaps (Frames werden dafür verkleinert). Ohne ImageDecoder/bei Fehler: null => normales Standbild des ersten Frames.
 async frames(blob,type){try{if(typeof ImageDecoder==='undefined')return null;const dec=new ImageDecoder({data:await blob.arrayBuffer(),type});await dec.tracks.ready;const n=Math.min(dec.tracks.selectedTrack.frameCount||1,400);if(n<2){dec.close();return null}
   const f0=await dec.decode({frameIndex:0}),w0=f0.image.displayWidth,h0=f0.image.displayHeight,k=Math.min(1,2560/Math.max(w0,h0*16/9),Math.sqrt(4e8/(4*n*w0*h0))),w=Math.max(1,Math.round(w0*k)),h=Math.max(1,Math.round(h0*k)),fr=[];let t=0;
   for(let i=0;i<n;i++){const r=i?await dec.decode({frameIndex:i}):f0,vf=r.image,d=Math.max(20,(vf.duration||100000)/1000);fr.push({bmp:await createImageBitmap(vf,{resizeWidth:w,resizeHeight:h}),t0:t,d});t+=d;vf.close()}
   dec.close();return{fr,w,h,total:t}}catch(e){return null}}
 unload(slot){const m=this.media[slot];if(!m)return;if(m.kind==='video'){try{m.el.pause();m.el.removeAttribute('src');m.el.load()}catch(e){}}if(m.frames)for(const q of m.frames)try{q.bmp.close()}catch(e){}if(m.el&&m.el.parentNode)m.el.parentNode.removeChild(m.el);if(m.url)URL.revokeObjectURL(m.url);delete this.media[slot]}
 // ---- Bedienung (UI ruft das auf) ----
 // Datei einem Slot zuweisen. -> {ok,msg}
 async set(slot,file){if(!BG_SLOTS.includes(slot))return{ok:false,msg:'Unbekannter Bereich.'};const kind=bgKind(file);if(!kind)return{ok:false,msg:'Das ist kein Bild und kein Video.'};
  if(!bgHasDoc())return{ok:false,msg:'Kein Browser.'};const prev=this.items[slot];this.items[slot]={name:file.name,kind,off:false};
  try{await this.load(slot,file,kind)}catch(e){if(prev)this.items[slot]=prev;else delete this.items[slot];return{ok:false,msg:e.message||'Datei konnte nicht geladen werden.'}}
  let saved=false;if(this.persist)saved=(await this.idb('readwrite',st=>st.put({name:file.name,kind,type:file.type,off:false,blob:file},slot)))!==null;
  this.items[slot].mem=!saved;   // mem = nur im Arbeitsspeicher (Browser-Speicher fehlt oder ist voll) -> geht beim Schließen des Tabs verloren
  this.emit();return{ok:true,msg:(kind==='video'?'Video':'Bild')+' „'+file.name+'“ → '+BG_NAMES[slot]+(saved?'':' (nur für diese Sitzung gespeichert – Browser-Speicher nicht verfügbar oder voll)')}}
 // Einzel-Slot auf Original stellen (kein eigener Hintergrund, auch wenn 'all' gesetzt ist)
 async off(slot){if(slot==='all')return this.clear('all');this.unload(slot);this.items[slot]={name:'',kind:null,off:true};if(this.persist)await this.idb('readwrite',st=>st.put({off:true},slot));this.emit()}
 // Slot leeren: 'all' => Standard-Hintergründe, Einzel-Slot => erbt wieder von 'all'
 async clear(slot){this.unload(slot);delete this.items[slot];if(this.persist)await this.idb('readwrite',st=>st.delete(slot));this.emit()}
 // ---- Zeichnen ----
 // Welches Medium gilt jetzt für den Bereich? (null = Originalhintergrund; auch solange das Medium noch lädt)
 pick(area){const s=resolveSlot(this.items,area),m=s&&this.media[s];if(!m)return null;
  if(m.kind==='video'){const v=m.el;if(v.error||v.readyState<2||!v.videoWidth)return null;m.use=performance.now();if(v.paused&&!(typeof document!=='undefined'&&document.hidden))v.play().catch(()=>{})}
  else if(!m.w())return null;return m}
 has(area){return !!this.pick(area)}
 // Hintergrund im Bildschirmraum zeichnen (0,0)-(W,H). o.cam = Kamera für leichte Parallaxe (Kampf), o.dimAdd = zusätzliche Abdunklung (Menüs: Lesbarkeit).
 draw(g,W,H,area,o={}){const m=this.pick(area);if(!m)return false;const sw=m.w(),sh=m.h(),P=this.opts;
  if(P.fit==='contain'){g.fillStyle='#000';g.fillRect(-60,-60,W+120,H+120);const s=Math.min(W/sw,H/sh),dw=sw*s,dh=sh*s;g.drawImage(m.src(),(W-dw)/2,(H-dh)/2,dw,dh)}
  else{const c=o.cam,par=P.parallax&&c,mul=par?1.1+Math.max(0,(c.z||1)-1)*.25:1.04,k=Math.max(W/sw,H/sh)*mul,dw=sw*k,dh=sh*k;
   let dx=0,dy=0;if(par){dx=bgClamp(-(c.x-W/2)*.04,-(dw-W)/2,(dw-W)/2);dy=bgClamp(-(c.y-H/2)*.04,-(dh-H)/2,(dh-H)/2)}
   g.drawImage(m.src(),(W-dw)/2+dx,(H-dh)/2+dy,dw,dh)}
  const d=bgClamp(P.dim+(o.dimAdd||0),0,.95);if(d>0){g.fillStyle='rgba(5,2,12,'+d+')';g.fillRect(-60,-60,W+120,H+120)}return true}
 // Videos, die gerade nicht gebraucht werden (anderer Bereich aktiv), pausieren: spart GPU/CPU
 startTimer(){if(this._timer||typeof setInterval==='undefined')return;this._timer=setInterval(()=>{const n=performance.now();for(const s in this.media){const m=this.media[s];if(m.kind==='video'&&!m.el.paused&&n-m.use>1500)m.el.pause()}},1000)}
}
