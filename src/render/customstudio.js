import{CHARACTERS}from'../core/characters.js';
import{CUS_SHEETS,CUS_ANIMS,CUS_ANIM_LABELS,CUS_ATLAS_W,CUS_STAND_H,CUS_TEMPLATES,CUS_LIMITS,CUS_DEFAULT,cusKeyOut,cusPlanSheet,cusBuildAnims,cusCompleteAnims,cusClean,cusMakeChar,cusPrompt}from'../core/custom.js';
import{registerSpriteChar}from'./sprites.js';
// Eigene Figur: Editor-Fenster (Upload der Sprite-Sheets, Vorschau, Werte, Speichern). Die Bildverarbeitung läuft komplett im Browser, gespeichert wird in IndexedDB.
// Logik (Hintergrund, Raster, Maßstab, Animationen): core/custom.js. Draußen nutzbar: studioOpen / studioIsOpen / studioLoadSaved / studioDelete / studioHas.
const STUDIO=(()=>{
 const S={open:false,profile:{...CUS_DEFAULT},desc:'',files:{},cache:{},built:null,saved:null,gen:0,timer:0,raf:0,url:null,ui:null,onDone:null,loose:[]};
 const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
 const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tick=()=>new Promise(r=>setTimeout(r,0));
 const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
 // ---- Speicher (IndexedDB) ----
 const idb=()=>new Promise((ok,no)=>{try{const r=indexedDB.open('hitisop',1);r.onupgradeneeded=()=>r.result.createObjectStore('custom');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}});
 const tx=async(mode,fn)=>{const db=await idb();return new Promise((ok,no)=>{const t=db.transaction('custom',mode),r=fn(t.objectStore('custom'));t.oncomplete=()=>{db.close();ok(r&&r.result)};t.onerror=()=>{db.close();no(t.error)};t.onabort=()=>{db.close();no(t.error)}})};
 const toBlob=async c=>{let b=await new Promise(r=>c.toBlob(r,'image/webp',.92));if(!b)b=await new Promise(r=>c.toBlob(r,'image/png'));return b};
 // ---- Bildverarbeitung ----
 async function decode(file){const bm=await createImageBitmap(file),w=bm.width,h=bm.height;
  if(w*h>50e6){if(bm.close)bm.close();throw new Error('Bild zu groß (über 50 Megapixel)')}
  const c=mk(w,h),x=c.getContext('2d',{willReadFrequently:true});x.drawImage(bm,0,0);if(bm.close)bm.close();return{c,x,w,h}}
 function cropScale(src,f){let cur=mk(f.sw,f.sh);cur.getContext('2d').drawImage(src,f.sx,f.sy,f.sw,f.sh,0,0,f.sw,f.sh);   // schrittweise halbieren = weniger Treppchen als ein großer Sprung
  while(cur.width/2>=f.dw&&cur.height/2>=f.dh){const n=mk(Math.ceil(cur.width/2),Math.ceil(cur.height/2)),g=n.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(cur,0,0,cur.width,cur.height,0,0,n.width,n.height);cur=n}
  const o=mk(f.dw,f.dh),g=o.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(cur,0,0,cur.width,cur.height,0,0,f.dw,f.dh);return o}
 async function processSheet(key,file){const out={file,frames:[],notes:[],error:null};
  try{const{c,x,w,h}=await decode(file),id=x.getImageData(0,0,w,h);out.method=cusKeyOut(id.data,w,h);x.putImageData(id,0,0);
   const plan=cusPlanSheet(key,id.data,w,h);out.notes=plan.notes;
   if(plan.error)out.error=plan.error;else for(const f of plan.frames)out.frames.push({name:f.name,ox:f.ox,oy:f.oy,canvas:cropScale(c,f)});
   c.width=c.height=0}catch(e){out.error=String(e&&e.message||e)}
  return out}
 function pack(list){const items=[...list].sort((a,b)=>b.canvas.height-a.canvas.height);let x=0,y=0,rh=0;const pos=[];
  for(const f of items){const w=f.canvas.width,h=f.canvas.height;if(x+w>CUS_ATLAS_W){x=0;y+=rh+2;rh=0}pos.push([f,x,y]);x+=w+2;rh=Math.max(rh,h)}
  const cv=mk(CUS_ATLAS_W,Math.max(1,y+rh+2)),g=cv.getContext('2d'),frames={};
  for(const[f,px,py]of pos){g.drawImage(f.canvas,px,py);frames[f.name]={x:px,y:py,w:f.canvas.width,h:f.canvas.height,ox:f.ox,oy:f.oy}}
  return{canvas:cv,frames}}
 const keyFromName=name=>{const stem=name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');let best=null;
  for(const sh of CUS_SHEETS){const k=sh.key;if(stem===k||new RegExp('(^|_)'+k+'(_|$)').test(stem))if(!best||k.length>best.length)best=k}return best};
 // ---- Aufbau der Figur ----
 async function rebuild(){const my=++S.gen;setStatus('Verarbeite Bilder …');
  for(const sh of CUS_SHEETS){const f=S.files[sh.key];if(!f){delete S.cache[sh.key];continue}
   if(!S.cache[sh.key]||S.cache[sh.key].file!==f){S.cache[sh.key]={file:f,pending:true};refreshSlots();await tick();if(my!==S.gen)return;
    S.cache[sh.key]=await processSheet(sh.key,f);if(my!==S.gen)return;refreshSlots()}}
  const list=[];for(const k in S.cache){const c=S.cache[k];if(c.frames)list.push(...c.frames)}
  if(!list.length)S.built=null;else{const{canvas,frames}=pack(list),real=cusBuildAnims(new Set(Object.keys(frames)));S.built={canvas,frames,real,anims:cusCompleteAnims(real)}}
  refreshAll();setStatus('')}
 const schedule=()=>{clearTimeout(S.timer);S.timer=setTimeout(rebuild,250)};
 function setFile(key,file){if(file)S.files[key]=file;else delete S.files[key];schedule();refreshSlots()}
 function addFiles(list){S.loose=[];let first=null;
  for(const f of list){if(!/^image\//.test(f.type)&&!/\.(png|jpe?g|webp)$/i.test(f.name)){S.loose.push(f.name);continue}
   const k=keyFromName(f.name);if(!k)S.loose.push(f.name);else{S.files[k]=f;if(!first)first=k}}
  if(first)focusAnim(first);schedule();refreshSlots();refreshReport()}
 // ---- Figur aktivieren / speichern ----
 async function activate(p,meta,blob){CHARACTERS.custom=cusMakeChar(p,CHARACTERS[p.template]||CHARACTERS.tiger);
  const url=URL.createObjectURL(blob),img=new Image();img.src=url;
  try{await img.decode()}catch(e){await new Promise(r=>{img.onload=r;img.onerror=r})}
  if(S.url)URL.revokeObjectURL(S.url);S.url=url;
  registerSpriteChar('custom',{anims:meta.anims,fist:[104,-130],height:190});(window.__SPRITES__=window.__SPRITES__||{}).custom={meta,img}}
 const readForm=()=>{const u=S.ui;return cusClean({name:u.name.value,template:u.tpl.value,hp:u.hp.value,tempo:u.tempo.value,dmg:u.dmg.value,abwehr:u.abwehr.value,glow:u.glow.value})};
 async function save(fight){const p=readForm();let meta,blob;
  if(S.timer){clearTimeout(S.timer);S.timer=0;await rebuild()}
  if(S.built){if(!S.built.anims||!S.built.real.idle){setStatus('Es fehlt noch „Idle – Teil 1“ (idle_1) – ohne das geht es nicht.',1);return}
   meta={frames:S.built.frames,standH:CUS_STAND_H,anims:S.built.anims};blob=await toBlob(S.built.canvas)}
  else if(S.saved){meta=S.saved.meta;blob=S.saved.atlasBlob}
  else{setStatus('Lade zuerst mindestens „Idle – Teil 1“ hoch.',1);return}
  setStatus('Speichere …');await activate(p,meta,blob);S.profile=p;S.desc=S.ui.desc.value;
  S.saved={profile:p,meta,atlasBlob:blob,files:{...S.files}};
  try{await tx('readwrite',s=>s.put({v:1,profile:p,desc:S.desc,files:S.files,meta,atlas:blob},'fighter'))}
  catch(e){alert('Die Figur konnte nicht dauerhaft im Browser gespeichert werden (nur für diese Sitzung).')}
  close(true);if(S.onDone)S.onDone({saved:true,fight:!!fight})}
 async function loadSaved(){try{const r=await tx('readonly',s=>s.get('fighter'));if(!r||!r.meta||!r.atlas)return false;
   S.profile=cusClean(r.profile);S.desc=r.desc||'';S.files=r.files||{};S.saved={profile:S.profile,meta:r.meta,atlasBlob:r.atlas,files:S.files};await activate(S.profile,r.meta,r.atlas);return true}catch(e){return false}}
 async function remove(){if(!confirm('Deine eigene Figur wirklich löschen?'))return;
  try{await tx('readwrite',s=>s.delete('fighter'))}catch(e){}
  delete CHARACTERS.custom;registerSpriteChar('custom',undefined);if(window.__SPRITES__)delete window.__SPRITES__.custom;
  S.saved=null;S.built=null;S.files={};S.cache={};S.profile={...CUS_DEFAULT};S.desc='';close(true);if(S.onDone)S.onDone({deleted:true})}
 // ---- Oberfläche ----
 function build(){const m=el('div');m.id='studio';m.className='hidden';
  const opts=CUS_TEMPLATES.map(t=>`<option value="${t[0]}">${t[1]} – ${t[2]}</option>`).join('');
  m.innerHTML=`<div class="panel st"><h1>EIGENE <span>FIGUR</span></h1>
  <p class="st-lead">Lade deine Sprite-Sheets hoch und kämpfe mit deinem eigenen Charakter. Nötig ist nur <b>Idle – Teil 1</b>; alles andere kannst du nach und nach nachliefern, bis dahin übernehmen Behelfe.</p>
  <div class="st-cols"><div class="st-l">
   <div class="st-drop" id="st-drop"><b>Sheets hier hineinziehen</b><br>oder <button id="st-pick">Dateien wählen</button><div class="st-sm">Dateinamen wie <code>idle_1.png</code>, <code>punch.png</code> … werden automatisch zugeordnet.</div></div>
   <input type="file" id="st-files" multiple accept="image/*" hidden><div id="st-slots" class="st-slots"></div></div>
  <div class="st-r"><canvas id="st-prev" width="360" height="300"></canvas><select id="st-anim"></select>
   <div class="st-form">
    <label>Name<input id="st-name" maxlength="14" autocomplete="off"></label>
    <label>Moves wie<select id="st-tpl">${opts}</select></label>
    <label>Leben <b id="v-hp"></b><input id="st-hp" type="range" min="${CUS_LIMITS.hp[0]}" max="${CUS_LIMITS.hp[1]}" step="10"></label>
    <label>Tempo <b id="v-tempo"></b><input id="st-tempo" type="range" min="${CUS_LIMITS.tempo[0]}" max="${CUS_LIMITS.tempo[1]}"></label>
    <label>Schaden <b id="v-dmg"></b><input id="st-dmg" type="range" min="${CUS_LIMITS.dmg[0]}" max="${CUS_LIMITS.dmg[1]}"></label>
    <label>Abwehr <b id="v-abwehr"></b><input id="st-abwehr" type="range" min="${CUS_LIMITS.abwehr[0]}" max="${CUS_LIMITS.abwehr[1]}"></label>
    <label>Leucht-Farbe<input id="st-glow" type="color"></label></div>
   <div id="st-report" class="st-report"></div></div></div>
  <details class="st-help"><summary>So entstehen gute Sheets (mit Gemini)</summary>
   <p>Pro Sheet gibt es bei jeder Zeile den Knopf <b>Prompt</b>: Er kopiert einen fertigen Text für Gemini. Hänge dazu ein Bild deiner Figur an und lass es das Sheet erzeugen. Wichtig: <b>grüner Hintergrund (#00FF00)</b>, feste Zellenzahl (3×2 bzw. 4×2), <b>Zelle 1 = neutrale Kampfhaltung</b> (daraus wird die Größe berechnet), Figur blickt nach rechts, in jeder Zelle gleich groß und mit Abstand zum Rand. Höchste Auflösung wählen.</p>
   <label class="st-desc">Beschreibung deiner Figur (Englisch, wird in den Prompt eingesetzt)<textarea id="st-desc" rows="2" placeholder="a muscular red panda martial artist with a white-striped tail, black gi and orange belt"></textarea></label></details>
  <div class="foot st-foot"><span id="st-status" class="st-status"></span><span class="st-btns"><button id="st-del" class="warn">Figur löschen</button><button id="st-close">Schließen</button><button id="st-save">Speichern</button><button id="st-fight" class="primary">Speichern &amp; kämpfen!</button></span></div></div>`;
  document.body.appendChild(m);
  const q=id=>m.querySelector('#'+id),u={root:m,drop:q('st-drop'),pick:q('st-pick'),files:q('st-files'),slots:q('st-slots'),prev:q('st-prev'),anim:q('st-anim'),name:q('st-name'),tpl:q('st-tpl'),
   hp:q('st-hp'),tempo:q('st-tempo'),dmg:q('st-dmg'),abwehr:q('st-abwehr'),glow:q('st-glow'),report:q('st-report'),desc:q('st-desc'),status:q('st-status'),del:q('st-del'),rows:{}};
  u.pick.onclick=()=>u.files.click();u.files.onchange=()=>{addFiles([...u.files.files]);u.files.value=''};
  const stop=e=>{e.preventDefault();e.stopPropagation()};
  ['dragenter','dragover'].forEach(n=>u.drop.addEventListener(n,e=>{stop(e);u.drop.classList.add('over')}));
  ['dragleave','drop'].forEach(n=>u.drop.addEventListener(n,e=>{stop(e);u.drop.classList.remove('over')}));
  u.drop.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));
  m.addEventListener('dragover',e=>e.preventDefault());m.addEventListener('drop',e=>{e.preventDefault();if(!u.drop.contains(e.target))addFiles([...e.dataTransfer.files])});
  for(const k of['hp','tempo','dmg','abwehr'])u[k].oninput=()=>{m.querySelector('#v-'+k).textContent=u[k].value+(k==='hp'?'':' %')};
  const groups=[['Zum Start empfohlen',CUS_SHEETS.filter(s=>s.core)],['Weitere Bewegungen',CUS_SHEETS.filter(s=>!s.core)]];
  groups.forEach(([title,list],gi)=>{const box=gi?el('details','st-more'):el('div'),head=gi?el('summary',null,title):el('div','st-h',title);box.appendChild(head);
   for(const sh of list){const row=el('div','st-row'),inp=el('input');inp.type='file';inp.accept='image/*';inp.hidden=true;
    row.innerHTML=`<span class="st-n"><b>${sh.label}</b><small>${sh.c}×${sh.r}${sh.hint?' · '+sh.hint:''}</small></span><span class="st-s"></span><span class="st-b"><button data-a="p" title="Prompt für Gemini kopieren">Prompt</button><button data-a="c">Wählen</button><button data-a="x" title="Entfernen">✕</button></span>`;row.appendChild(inp);
    row.querySelector('[data-a=c]').onclick=()=>inp.click();inp.onchange=()=>{if(inp.files[0]){S.loose=[];S.files[sh.key]=inp.files[0];focusAnim(sh.key);schedule();refreshSlots()}inp.value=''};
    row.querySelector('[data-a=x]').onclick=()=>{setFile(sh.key,null);if(!Object.keys(S.files).length){S.built=null;S.cache={}}else schedule();refreshAll()};
    row.querySelector('[data-a=p]').onclick=async e=>{const t=cusPrompt(sh.key,u.desc.value);let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(x){const a=el('textarea');a.value=t;document.body.appendChild(a);a.select();try{ok=document.execCommand('copy')}catch(y){}a.remove()}
     const b=e.target;b.textContent=ok?'Kopiert ✓':'Fehler';setTimeout(()=>b.textContent='Prompt',1600)};
    u.rows[sh.key]={row,st:row.querySelector('.st-s')};box.appendChild(row)}
   u.slots.appendChild(box)});
  m.querySelector('#st-close').onclick=()=>close();m.querySelector('#st-save').onclick=()=>save(false);m.querySelector('#st-fight').onclick=()=>save(true);m.querySelector('#st-del').onclick=remove;
  m.addEventListener('mousedown',e=>{if(e.target===m)close()});
  addEventListener('keydown',e=>{if(S.open&&e.code==='Escape'){e.preventDefault();close()}});
  addEventListener('dragover',e=>{if(S.open)e.preventDefault()});addEventListener('drop',e=>{if(S.open)e.preventDefault()});
  return u}
 function setStatus(t,bad){if(!S.ui)return;S.ui.status.textContent=t;S.ui.status.classList.toggle('bad',!!bad)}
 function refreshSlots(){if(!S.ui)return;
  for(const sh of CUS_SHEETS){const r=S.ui.rows[sh.key],c=S.cache[sh.key],has=!!S.files[sh.key];let t='–',cls='';
   if(has){if(!c){const old=S.saved&&S.saved.files&&S.saved.files[sh.key]===S.files[sh.key];t=old?'✓ gespeichert':'…';cls=old?'ok':''}else if(c.pending)t='…',cls='';else if(c.error)t='✖ Fehler',cls='bad';else if(c.notes&&c.notes.length)t='⚠ '+c.notes.length+' Hinweis'+(c.notes.length>1?'e':''),cls='warn';else t='✓',cls='ok'}
   r.st.textContent=t;r.st.className='st-s '+cls;r.row.classList.toggle('has',has)}}
 function refreshReport(){if(!S.ui)return;const L=[];
  for(const sh of CUS_SHEETS){const c=S.cache[sh.key];if(!c||c.pending)continue;if(c.error)L.push(`<div class="bad"><b>${sh.label}:</b> ${esc(c.error)}</div>`);for(const n of c.notes||[])L.push(`<div class="warn"><b>${sh.label}:</b> ${esc(n)}</div>`)}
  if(S.loose.length)L.push(`<div class="warn">Nicht zugeordnet: ${S.loose.map(esc).join(', ')} – Dateinamen siehe Liste (z. B. idle_1.png).</div>`);
  if(S.built){const miss=Object.keys(CUS_ANIM_LABELS).filter(k=>!S.built.real[k]);
   if(!S.built.real.idle)L.push('<div class="bad">Es fehlt „Idle – Teil 1“ – ohne geht das Speichern nicht.</div>');
   else if(miss.length)L.push(`<div class="mute">Noch Behelfe: ${miss.map(k=>CUS_ANIM_LABELS[k]).join(', ')}</div>`);else L.push('<div class="ok">Alle Animationen sind eigene Frames.</div>')}
  S.ui.report.innerHTML=L.join('')}
 function fillAnims(){const u=S.ui,A=curr();if(!A)return;const old=u.anim.value;u.anim.innerHTML='';
  for(const k of Object.keys(CUS_ANIM_LABELS)){if(!A.anims[k])continue;const o=el('option');o.value=k;o.textContent=CUS_ANIM_LABELS[k]+(S.built&&!S.built.real[k]?' (Behelf)':'');u.anim.appendChild(o)}
  u.anim.value=A.anims[old]?old:'idle'}
 function focusAnim(key){const u=S.ui;if(!u)return;S.focus=Object.keys(CUS_ANIMS).find(k=>CUS_ANIMS[k].parts[0][0]===key)||null}
 function refreshAll(){refreshSlots();refreshReport();fillAnims();if(S.focus&&S.ui.anim.querySelector(`option[value="${S.focus}"]`)&&S.built&&S.built.real[S.focus]){S.ui.anim.value=S.focus;S.focus=null}}
 // aktuelle Daten für die Vorschau: frisch gebaut oder gespeichert
 function curr(){if(S.built&&S.built.anims)return{img:S.built.canvas,frames:S.built.frames,anims:S.built.anims};const sp=window.__SPRITES__&&window.__SPRITES__.custom;return sp&&S.saved?{img:sp.img,frames:sp.meta.frames,anims:sp.meta.anims}:null}
 function draw(){const u=S.ui,c=u.prev,g=c.getContext('2d'),W=c.width,H=c.height,floor=H-34;
  const bg=g.createRadialGradient(W/2,floor,10,W/2,floor-60,230);bg.addColorStop(0,'#2a1a5e');bg.addColorStop(1,'#0a0618');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='#3a2a6b';g.beginPath();g.moveTo(0,floor);g.lineTo(W,floor);g.stroke();
  const A=curr();if(!A){g.fillStyle='#9d8fd0';g.font='15px system-ui';g.textAlign='center';g.fillText('Vorschau erscheint nach dem ersten Sheet',W/2,H/2);return}
  const a=A.anims[u.anim.value]||A.anims.idle,n=a.frames.length,t=performance.now()/1000;
  const idx=a.loop?Math.floor(t*a.fps)%n:Math.min(n-1,Math.floor(((t%1.4)/1.4)*n)),fr=A.frames[a.frames[idx]];if(!fr)return;
  const k=.72;g.save();g.translate(W/2,floor);if(a.squash)g.scale(1,1-(1-a.squash)*.5);
  g.drawImage(A.img,fr.x,fr.y,fr.w,fr.h,fr.ox*k,fr.oy*k,fr.w*k,fr.h*k);g.restore()}
 const loop=()=>{if(!S.open)return;try{draw()}catch(e){}S.raf=requestAnimationFrame(loop)};
 function fillForm(){const u=S.ui,p=S.profile;u.name.value=p.name;u.tpl.value=p.template;u.hp.value=p.hp;u.tempo.value=p.tempo;u.dmg.value=p.dmg;u.abwehr.value=p.abwehr;u.glow.value=p.glow;u.desc.value=S.desc||'';
  for(const k of['hp','tempo','dmg','abwehr'])u[k].oninput()}
 function open(onDone){if(!S.ui)S.ui=build();S.onDone=onDone;S.loose=[];fillForm();refreshAll();fillAnims();S.ui.del.hidden=!S.saved;S.ui.root.classList.remove('hidden');S.open=true;setStatus('');cancelAnimationFrame(S.raf);loop()}
 function close(silent){if(!S.ui)return;S.open=false;cancelAnimationFrame(S.raf);S.ui.root.classList.add('hidden');if(!silent&&S.onDone)try{S.onDone({closed:true})}catch(e){}}
 return{open,isOpen:()=>S.open,loadSaved,has:()=>!!CHARACTERS.custom}
})();
export const studioOpen=cb=>STUDIO.open(cb);
export const studioIsOpen=()=>STUDIO.isOpen();
export const studioLoadSaved=()=>STUDIO.loadSaved();
export const studioHas=()=>STUDIO.has();
