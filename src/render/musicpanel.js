import{pick}from'../core/loot.js';
import{Story}from'../core/story.js';

import{Sound}from'./audio.js';
import{Stage}from'./stage.js';
// Eigene Musik: je eine Playlist für die MENÜ-Musik (Titelmenü, Auswahlbildschirme) und für die KAMPF-Musik (Kämpfe + Zwischenbildschirme).
//  - Lieder per „Lieder wählen“ oder Drag & Drop auf die jeweilige Spalte hinzufügen (MP3, OGG, WAV, M4A/AAC, FLAC, Opus – je nach Browser).
//  - Reihenfolge ändern (▲▼), einzelne Lieder oder alles entfernen, „Eigene Playlist verwenden“ an/aus, zufällige Reihenfolge.
//  - Gespeichert wird im Browser (IndexedDB, Dateien bleiben lokal auf dem Rechner). Die Wiedergabe übernimmt Sound.setPlaylist (render/audio.js).
// Ohne eigene Lieder bzw. mit ausgeschalteter Playlist läuft wie bisher die eingebaute Musik.
export const MP_KINDS=['menu','fight'],MP_NAMES={menu:'Menü-Musik',fight:'Kampf-Musik'},MP_HELP={menu:'Titelmenü, Charakter- und Stage-Auswahl',fight:'Kämpfe, Story, Melee und die Bildschirme danach'};
export const MP_DB='hitisop_music',MP_ST='tracks',MP_EXT=/\.(mp3|ogg|oga|opus|wav|m4a|aac|flac|weba|webm|mp4)$/i;
export const mpIdb=()=>new Promise((res,rej)=>{if(typeof indexedDB==='undefined')return rej(new Error('kein IndexedDB'));let q;try{q=indexedDB.open(MP_DB,1)}catch(e){return rej(e)}
 q.onupgradeneeded=()=>{q.result.createObjectStore(MP_ST,{keyPath:'id',autoIncrement:true})};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);q.onblocked=()=>rej(new Error('blockiert'))});
export const mpTx=(db,mode,fn)=>new Promise((res,rej)=>{let r;try{const t=db.transaction(MP_ST,mode);r=fn(t.objectStore(MP_ST));t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)}catch(e){rej(e)}});
export const mpFmt=s=>!isFinite(s)||s<=0?'':Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
export const mpIsAudio=f=>!!f&&((f.type&&f.type.startsWith('audio/'))||MP_EXT.test(f.name||''));
// Prüft, ob der Browser die Datei abspielen kann, und liest die Dauer
export const mpProbe=(url)=>new Promise(res=>{if(typeof Audio==='undefined')return res({ok:true,dur:0});const a=new Audio();let done=false;const end=(ok,dur)=>{if(done)return;done=true;clearTimeout(tm);a.onloadedmetadata=a.onerror=null;try{a.removeAttribute('src');a.load()}catch(e){}res({ok,dur})},tm=setTimeout(()=>end(false,0),10000);
 a.preload='metadata';a.onloadedmetadata=()=>end(true,a.duration);a.onerror=()=>end(false,0);a.src=url});
export const mpLs=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},mpSv=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

export class MusicStore{
 constructor(){this.lists={menu:[],fight:[]};this.on={menu:true,fight:true};this.shuf={menu:false,fight:false};this.persist=true;this.db=null;this.seq=0;this.memId=0;
  for(const k of MP_KINDS){this.on[k]=mpLs('tf_pl_on_'+k,'1')==='1';this.shuf[k]=mpLs('tf_pl_shuf_'+k,'0')==='1'}}
 async init(){try{this.db=await mpIdb();const all=await mpTx(this.db,'readonly',s=>s.getAll());
   for(const r of all||[]){if(!this.lists[r.list]||!r.blob)continue;this.lists[r.list].push({id:r.id,name:r.name,blob:r.blob,pos:r.pos||0,dur:r.dur||0,url:URL.createObjectURL(r.blob)});this.seq=Math.max(this.seq,r.pos||0)}
   for(const k of MP_KINDS)this.lists[k].sort((a,b)=>a.pos-b.pos)}catch(e){this.persist=false;this.db=null}}
 setOn(k,v){this.on[k]=!!v;mpSv('tf_pl_on_'+k,v?'1':'0')}
 setShuf(k,v){this.shuf[k]=!!v;mpSv('tf_pl_shuf_'+k,v?'1':'0')}
 async add(k,file){const url=URL.createObjectURL(file),pr=await mpProbe(url);if(!pr.ok){URL.revokeObjectURL(url);return{ok:false,msg:`„${file.name}“ kann dieser Browser nicht abspielen.`}}
  const name=(file.name||'Lied').replace(/\.[^.]+$/,''),pos=++this.seq,rec={list:k,name,blob:file,pos,dur:pr.dur},tr={name,blob:file,pos,dur:pr.dur,url};let mem=false;
  if(this.db){try{tr.id=await mpTx(this.db,'readwrite',s=>s.add(rec))}catch(e){mem=true}}else mem=true;
  if(mem){tr.id=--this.memId;this.persist=false}
  this.lists[k].push(tr);return{ok:true,name}}
 async remove(k,id){const l=this.lists[k],i=l.findIndex(t=>t.id===id);if(i<0)return;const[t]=l.splice(i,1);try{URL.revokeObjectURL(t.url)}catch(e){}if(this.db&&id>0){try{await mpTx(this.db,'readwrite',s=>s.delete(id))}catch(e){}}}
 async clear(k){for(const t of this.lists[k].slice())await this.remove(k,t.id)}
 async move(k,id,d){const l=this.lists[k],i=l.findIndex(t=>t.id===id),j=i+d;if(i<0||j<0||j>=l.length)return false;const a=l[i],b=l[j],pa=a.pos;a.pos=b.pos;b.pos=pa;l[i]=b;l[j]=a;
  if(this.db){for(const t of[a,b]){if(t.id>0){try{await mpTx(this.db,'readwrite',s=>s.put({id:t.id,list:k,name:t.name,blob:t.blob,pos:t.pos,dur:t.dur}))}catch(e){}}}}return true}
 // Für Sound.setPlaylist
 items(k){return this.lists[k].map(t=>({name:t.name,url:t.url}))}
}

export class MusicPanel{
 constructor(store,hooks={}){this.store=store;this.hooks=hooks;this.isOpen=false;this.root=null;this.btn=null;this.btnVis=null;this.pickKind='menu';this._tm=0;this._poll=0;this.busyAdd=false}
 busy(){return this.isOpen}
 mount(){if(this.root||typeof document==='undefined'||!document.body)return;const d=document,el=(t,c,h)=>{const e=d.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
  const r=this.root=el('div','hidden','');r.id='musicpanel';r.tabIndex=-1;
  const col=k=>`<div class="mpcol" data-kind="${k}"><h3>${MP_NAMES[k]}<small>${MP_HELP[k]}</small></h3>
    <div class="mpdrop" data-kind="${k}"><b>Lieder hierher ziehen</b><button type="button" class="mpadd">Lieder wählen</button><small>MP3 · OGG · WAV · M4A · FLAC – auch mehrere auf einmal</small></div>
    <ul class="mplist"></ul>
    <div class="mpopts"><label><input type="checkbox" class="mpon"> Eigene Playlist verwenden</label><label><input type="checkbox" class="mpshuf"> Zufällige Reihenfolge</label><button type="button" class="mpclr">Alle entfernen</button></div></div>`;
  r.innerHTML=`<div class="mpbox"><h2>Eigene Musik</h2>
   <p class="mpsub">Stelle dir <b>eine Playlist für das Menü</b> und <b>eine für die Kämpfe</b> zusammen. Die Lieder laufen der Reihe nach und fangen danach wieder von vorn an. Ohne eigene Lieder (oder wenn die Playlist ausgeschaltet ist) spielt die Original-Musik. Lautstärke und Ein/Aus der Musik: Pausenmenü (M) → Optionen. Alle Dateien bleiben lokal in deinem Browser.</p>
   <div class="mpcols">${MP_KINDS.map(col).join('')}</div>
   <div class="mpfoot"><span class="mpnote"></span><button type="button" class="mpclose">Fertig (Esc)</button></div>
   <input type="file" class="mpfile" accept="audio/*,.mp3,.ogg,.oga,.opus,.wav,.m4a,.aac,.flac,.weba" multiple hidden></div>`;
  d.body.appendChild(r);
  const q=s=>r.querySelector(s);this.note=q('.mpnote');this.file=q('.mpfile');this.cols={};
  for(const k of MP_KINDS){const c=r.querySelector(`.mpcol[data-kind="${k}"]`);this.cols[k]={root:c,list:c.querySelector('.mplist'),on:c.querySelector('.mpon'),shuf:c.querySelector('.mpshuf'),clr:c.querySelector('.mpclr'),drop:c.querySelector('.mpdrop')};
   c.querySelector('.mpadd').onclick=()=>this.pick(k);
   this.cols[k].on.onchange=()=>{this.store.setOn(k,this.cols[k].on.checked);this.changed(k)};
   this.cols[k].shuf.onchange=()=>{this.store.setShuf(k,this.cols[k].shuf.checked);this.changed(k)};
   this.cols[k].clr.onclick=async()=>{await this.store.clear(k);this.refresh();this.changed(k);this.toast(MP_NAMES[k]+': Playlist geleert.',true)};
   this.cols[k].list.addEventListener('click',async e=>{const b=e.target.closest('button'),li=e.target.closest('li[data-id]');if(!b||!li)return;const id=+li.dataset.id;
    if(b.classList.contains('mprm'))await this.store.remove(k,id);else if(b.classList.contains('mpup'))await this.store.move(k,id,-1);else if(b.classList.contains('mpdn'))await this.store.move(k,id,1);else return;this.refresh();this.changed(k)})}
  q('.mpclose').onclick=()=>this.close();
  r.addEventListener('mousedown',e=>{if(e.target===r)this.close()});
  this.file.onchange=async()=>{const fs=[...(this.file.files||[])];this.file.value='';if(fs.length)await this.addFiles(this.pickKind,fs)};
  // Drag & Drop: auf eine Spalte ziehen. Außerhalb der Spalten nichts tun (verhindert, dass der Browser die Datei öffnet).
  const files=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files'),colOf=e=>{const n=e.target&&e.target.closest?e.target.closest('.mpcol'):null;return n&&r.contains(n)?n.dataset.kind:null};
  const hl=k=>{for(const x of MP_KINDS)this.cols[x].drop.classList.toggle('over',x===k)};
  addEventListener('dragover',e=>{if(!this.isOpen||!files(e))return;e.preventDefault();try{e.dataTransfer.dropEffect='copy'}catch(x){}hl(colOf(e))});
  addEventListener('dragleave',e=>{if(this.isOpen&&(!e.relatedTarget))hl(null)});
  addEventListener('drop',async e=>{if(!this.isOpen||!files(e))return;e.preventDefault();const k=colOf(e);hl(null);const list=[...(e.dataTransfer.files||[])];
   if(!k){this.toast('Bitte direkt auf „Menü-Musik“ oder „Kampf-Musik“ ziehen.',false);return}
   const au=list.filter(mpIsAudio);if(!au.length){this.toast(list.length?'Das sind keine Audio-Dateien.':'Keine Datei erkannt.',false);return}await this.addFiles(k,au)});
  addEventListener('blur',()=>hl(null));
  // Modal: solange das Panel offen ist, bekommt das Spiel keine Tasten
  addEventListener('keydown',e=>{if(!this.isOpen)return;if(e.code==='Escape'){e.preventDefault();this.close()}e.stopImmediatePropagation()},true);
  addEventListener('keyup',e=>{if(this.isOpen)e.stopImmediatePropagation()},true);
  // Floating-Knopf (Titelmenü + Auswahl), über dem Hintergrund-Knopf
  const b=this.btn=el('button','hidden','♪ Eigene Musik <kbd>N</kbd>');b.id='musicbtn';b.type='button';b.title='Eigene Playlist für Menü- und Kampfmusik einrichten';b.onclick=()=>this.open();d.body.appendChild(b)}
 pick(k){this.pickKind=k;this.file.value='';this.file.click()}
 async addFiles(k,fs){if(this.busyAdd)return;this.busyAdd=true;let ok=0,bad=[];
  try{for(let i=0;i<fs.length;i++){this.toast(`Lade Lied ${i+1} von ${fs.length} …`,true,true);if(!mpIsAudio(fs[i])){bad.push(fs[i].name);continue}const r=await this.store.add(k,fs[i]);if(r.ok)ok++;else bad.push(fs[i].name)}}finally{this.busyAdd=false}
  this.refresh();if(ok)this.changed(k);
  const mem=!this.store.persist;
  if(bad.length)this.toast((ok?`${ok} hinzugefügt. `:'')+(bad.length===1?`„${bad[0]}“ wurde übersprungen (nicht abspielbar).`:`${bad.length} Dateien übersprungen (nicht abspielbar oder keine Audio-Datei).`),false);
  else this.toast(`${ok} ${ok===1?'Lied':'Lieder'} zu „${MP_NAMES[k]}“ hinzugefügt.`+(mem?' Achtung: nur für diese Sitzung gespeichert.':''),true)}
 changed(k){if(this.hooks.onChange)this.hooks.onChange(k)}
 toast(msg,ok=true,keep=false){if(!this.note)return;this.note.textContent=msg;this.note.className='mpnote '+(ok?'ok':'err');clearTimeout(this._tm);if(!keep)this._tm=setTimeout(()=>{this.note.textContent='';this.note.className='mpnote'},ok?4000:7000)}
 open(){this.mount();if(!this.root)return;if(this.hooks.onOpen)this.hooks.onOpen();this.isOpen=true;this.root.classList.remove('hidden');this.refresh();this.root.focus();
  clearInterval(this._poll);this._poll=setInterval(()=>this.markNow(),800)}
 close(){if(!this.isOpen)return;this.isOpen=false;this.root.classList.add('hidden');clearInterval(this._poll);if(this.hooks.onClose)this.hooks.onClose()}
 refresh(){if(!this.root)return;const st=this.store;
  for(const k of MP_KINDS){const C=this.cols[k],l=st.lists[k];C.on.checked=!!st.on[k];C.shuf.checked=!!st.shuf[k];C.clr.disabled=!l.length;C.on.disabled=C.shuf.disabled=!l.length;
   C.list.innerHTML=l.length?l.map((t,i)=>`<li data-id="${t.id}" data-i="${i}"><span class="mpn">${i+1}</span><span class="mpt"></span><span class="mpd">${mpFmt(t.dur)}</span><button type="button" class="mpup" ${i?'':'disabled'} title="nach oben">▲</button><button type="button" class="mpdn" ${i<l.length-1?'':'disabled'} title="nach unten">▼</button><button type="button" class="mprm" title="entfernen">✕</button></li>`).join(''):'<li class="mpempty">Noch keine Lieder – es spielt die Original-Musik.</li>';
   C.list.querySelectorAll('li[data-i]').forEach(li=>{li.querySelector('.mpt').textContent=l[+li.dataset.i].name;li.querySelector('.mpt').title=l[+li.dataset.i].name})}
  this.markNow()}
 // Markiert das Lied, das gerade läuft
 markNow(){if(!this.root||!this.isOpen)return;for(const k of MP_KINDS){const now=this.hooks.now?this.hooks.now(k):-1;this.cols[k].list.querySelectorAll('li[data-i]').forEach(li=>li.classList.toggle('now',+li.dataset.i===now))}}
 setBtn(v){if(!this.btn||v===this.btnVis)return;this.btnVis=v;this.btn.classList.toggle('hidden',!v)}
}
