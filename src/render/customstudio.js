import{CHARACTERS}from'../core/characters.js';
import{CUS_SHEETS,CUS_ANIMS,CUS_ANIM_LABELS,CUS_ATLAS_W,CUS_STAND_H,CUS_AIR_CENTER,CUS_TEMPLATES,CUS_LIMITS,CUS_DEFAULT,CUS_MOVE_GROUPS,CUS_MOVE_KEYS,CUS_MAX_MOVE_FRAMES,CUS_ADJ_LIMITS,CUS_ADJ_DEFAULT,cusKeyOut,cusPlanSheet,cusBuildAnims,cusCompleteAnims,cusClean,cusMakeChar,cusPrompt,
 cusCleanMoves,cusCleanProps,cusFrameGeom,cusMoveAnims,cusMoveImgs,cusMoveName,cusNewId,cusPlanImage,cusPlanMoveSheet,cusMvMove,cusMvRemove,cusMvInsert,cusMvReplace}from'../core/custom.js';
import{registerSpriteChar}from'./sprites.js';
// Eigene Figur: Editor-Fenster (Upload der Sprite-Sheets, Vorschau, Werte, Speichern). Die Bildverarbeitung läuft komplett im Browser, gespeichert wird in IndexedDB.
// Reiter „Einzelne Moves“ (Move-Editor): jede Attacke/Bewegung bekommt eigene Frames (Sheet oder Einzelbilder), einzelne Frames sind austauschbar, löschbar und umsortierbar; Logik in core/custom.js (cusPlanMoveSheet, cusPlanImage, cusMoveAnims …).
// Logik (Hintergrund, Raster, Maßstab, Animationen): core/custom.js. Draußen nutzbar: studioOpen / studioIsOpen / studioLoadSaved / studioDelete / studioHas.
const STUDIO=(()=>{
 const S={open:false,profile:{...CUS_DEFAULT},desc:'',files:{},cache:{},built:null,saved:null,gen:0,timer:0,raf:0,url:null,ui:null,onDone:null,loose:[],
   moves:{},imgs:{},undo:[],redo:[],tab:'sheets',mv:{key:'punch',sel:0,hold:false,mode:'sheet',cols:3,rows:2,calib:true,append:false,pick:'import',hl:-1},ready:false,busy:false,over:[],adjSnap:null,packRaf:0};
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
 async function rebuild(){const my=++S.gen;setStatus('Verarbeite Bilder …');await decodeImgs();if(my!==S.gen)return;
  for(const sh of CUS_SHEETS){const f=S.files[sh.key];if(!f){delete S.cache[sh.key];continue}
   if(!S.cache[sh.key]||S.cache[sh.key].file!==f){S.cache[sh.key]={file:f,pending:true};refreshSlots();await tick();if(my!==S.gen)return;
    S.cache[sh.key]=await processSheet(sh.key,f);if(my!==S.gen)return;refreshSlots()}}
  repack();S.ready=true;refreshAll();setStatus('')}
 const schedule=()=>{clearTimeout(S.timer);S.timer=setTimeout(rebuild,250)};
 function setFile(key,file){if(file)S.files[key]=file;else delete S.files[key];schedule();refreshSlots()}
 function addFiles(list){S.loose=[];let first=null;
  for(const f of list){if(!/^image\//.test(f.type)&&!/\.(png|jpe?g|webp)$/i.test(f.name)){S.loose.push(f.name);continue}
   const k=keyFromName(f.name);if(!k)S.loose.push(f.name);else{S.files[k]=f;if(!first)first=k}}
  if(first)focusAnim(first);schedule();refreshSlots();refreshReport()}
  // ---- Move-Editor: eigene Frames je Animation (Reiter „Einzelne Moves“) ----
 // Daten: S.moves[key]={frames:[Frame],props} (Logik in core/custom.js), Bilder liegen in S.imgs[img]={canvas,blob}. Ein Move mit Frames überschreibt Sheet und Behelf.
 // Jede Änderung läuft durch edit(): vorbereiten (Sheets verarbeiten), Undo-Schritt merken, ändern, Atlas neu packen -> die Vorschau zeigt es sofort.
 const natCmp=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true});
 const isImg=f=>/^image\//.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name);
 const ovr=key=>S.moves[key]&&S.moves[key].frames.length?S.moves[key]:null;
 const canvasPng=c=>new Promise(r=>c.toBlob(r,'image/png'));
 async function blobCanvas(b){const bm=await createImageBitmap(b),c=mk(bm.width,bm.height);c.getContext('2d').drawImage(bm,0,0);if(bm.close)bm.close();return c}
 async function decodeImgs(){let lost=0;   // gespeicherte Frame-Bilder (Blobs) -> Canvas; fehlende Bilder werden samt Frame entfernt
  for(const id of cusMoveImgs(S.moves)){const e=S.imgs[id];if(e&&e.canvas)continue;try{if(!e||!e.blob)throw 0;e.canvas=await blobCanvas(e.blob)}catch(x){delete S.imgs[id];lost++}}
  if(lost){for(const k of Object.keys(S.moves)){S.moves[k].frames=S.moves[k].frames.filter(f=>S.imgs[f.img]);if(!S.moves[k].frames.length)delete S.moves[k]}setStatus(`${lost} Frame-Bild${lost>1?'er':''} fehlen im Speicher – die Frames wurden entfernt.`,1)}}
 const rc=new Map();   // skalierte Frame-Bilder zwischenspeichern
 function renderFrame(fr){const e=S.imgs[fr.img];if(!e||!e.canvas)return null;const g=cusFrameGeom(fr),src=e.canvas;if(src.width===g.dw&&src.height===g.dh)return src;
  const k=fr.img+'|'+g.dw+'x'+g.dh;let c=rc.get(k);if(!c){c=cropScale(src,{sx:0,sy:0,sw:src.width,sh:src.height,dw:g.dw,dh:g.dh});rc.set(k,c);if(rc.size>400)rc.delete(rc.keys().next().value)}return c}
 // Atlas aus Sheet-Frames + Move-Frames neu packen und Animationen bauen (Priorität: Move-Frames > Sheet > Behelf); nicht benutzte Frames fallen heraus
 function repack(){const list=[];for(const k in S.cache){const c=S.cache[k];if(c.frames)list.push(...c.frames)}
  const sheetReal=cusBuildAnims(new Set(list.map(f=>f.name))),ok={};
  for(const k in S.moves){const fr=S.moves[k].frames.filter(f=>renderFrame(f));if(fr.length)ok[k]={...S.moves[k],frames:fr}}
  const own=cusMoveAnims(ok);for(const k in ok)for(const f of ok[k].frames){const g=cusFrameGeom(f);list.push({name:cusMoveName(f.id),canvas:renderFrame(f),ox:g.ox,oy:g.oy})}
  S.over=Object.keys(own).filter(k=>sheetReal[k]);if(!list.length){S.built=null;return}
  const real={...sheetReal,...own},anims=cusCompleteAnims(real);let use=list;
  if(anims){const refs=new Set();for(const a of Object.values(anims))for(const n of a.frames)refs.add(n);use=list.filter(f=>refs.has(f.name));if(!use.length)use=list}
  const{canvas,frames}=pack(use);S.built={canvas,frames,real,anims}}
 async function prepare(){for(let i=0;i<3&&!S.ready;i++)await rebuild()}
 const schedulePack=()=>{cancelAnimationFrame(S.packRaf);S.packRaf=requestAnimationFrame(()=>{repack();refreshAll()})};
 function baseProps(key){const A=S.built,a=A&&(A.anims||A.real)[key];if(a){const p={...a};delete p.frames;return cusCleanProps(p)}const s=CUS_ANIMS[key];if(!s)return{};const p={...s};delete p.parts;return cusCleanProps(p)}
 // Move eigenständig machen: aktuelle Frames (aus Sheet oder Behelf) werden als eigene Bilder übernommen, nichts geht verloren
 function bake(key){if(ovr(key))return S.moves[key];const A=S.built,a=A&&(A.anims||A.real)[key],frames=[];
  if(a)for(const n of a.frames){const f=A.frames[n];if(!f)continue;const c=mk(f.w,f.h);c.getContext('2d').drawImage(A.canvas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const img=cusNewId();S.imgs[img]={canvas:c};
   frames.push({id:cusNewId(),img,w:f.w,h:f.h,ox:f.ox,oy:f.oy,air:f.ox===Math.floor(-f.w/2)&&f.oy===-(CUS_AIR_CENTER+(f.h>>1)),adj:{...CUS_ADJ_DEFAULT}})}
  return S.moves[key]={frames,props:baseProps(key)}}
 async function edit(fn){if(S.busy)return;S.busy=true;
  try{await prepare();const snap=JSON.stringify(S.moves),r=await fn();if(r===false)return;S.undo.push(snap);if(S.undo.length>40)S.undo.shift();S.redo=[];afterEdit()}
  catch(e){setStatus(String(e&&e.message||e),1)}finally{S.busy=false}}
 function afterEdit(){repack();S.mv.sel=Math.max(0,Math.min(S.mv.sel,curLen()-1));refreshAll()}
 const curLen=()=>{const A=curr(),o=ovr(S.mv.key),a=A&&A.anims[S.mv.key];return o?o.frames.length:a?a.frames.length:0};
 function undo(){if(S.busy||!S.undo.length)return;S.redo.push(JSON.stringify(S.moves));S.moves=JSON.parse(S.undo.pop());afterEdit()}
 function redo(){if(S.busy||!S.redo.length)return;S.undo.push(JSON.stringify(S.moves));S.moves=JSON.parse(S.redo.pop());afterEdit()}
 async function loadKeyed(file){const{c,x,w,h}=await decode(file),id=x.getImageData(0,0,w,h);cusKeyOut(id.data,w,h);x.putImageData(id,0,0);return{c,id,w,h}}
 const keepRes=p=>{const r=Math.min(1,2*p.dw/p.sw);return{sx:p.sx,sy:p.sy,sw:p.sw,sh:p.sh,dw:Math.max(1,Math.round(p.sw*r)),dh:Math.max(1,Math.round(p.sh*r))}}   // Bild in bis zu doppelter Spielauflösung behalten (Feinabstimmung bleibt scharf)
 const newFrame=(cv,p,air)=>{const img=cusNewId();S.imgs[img]={canvas:cv};return{id:cusNewId(),img,w:p.dw,h:p.dh,ox:p.ox,oy:p.oy,air:!!air,adj:{...CUS_ADJ_DEFAULT}}};
 async function frameFromFile(file,opts){const{c,id,w,h}=await loadKeyed(file),p=cusPlanImage(id.data,w,h,opts);if(p.error){c.width=c.height=0;throw new Error(file.name+': '+p.error)}
  const cv=cropScale(c,keepRes(p));c.width=c.height=0;return{frame:newFrame(cv,p,opts.air),scale:p.scale,notes:p.notes}}
 function refH(key){const A=curr();if(!A)return CUS_STAND_H;const a=A.anims[key]||A.anims.idle,nm=a&&(a.frames[Math.min(S.mv.sel,a.frames.length-1)]||a.frames[0]),f=nm&&A.frames[nm];return f?f.h:CUS_STAND_H}
 // Sheet für den gewählten Move importieren: ersetzt alle Frames des Moves (Rückgängig möglich)
 function importSheet(file){const key=S.mv.key,{cols,rows,calib}=S.mv;
  return edit(async()=>{const{c,id,w,h}=await loadKeyed(file),plan=cusPlanMoveSheet(id.data,w,h,cols,rows,{calib});
   if(plan.error){c.width=c.height=0;setStatus(plan.error,1);return false}
   const frames=plan.frames.slice(0,CUS_MAX_MOVE_FRAMES).map(f=>newFrame(cropScale(c,keepRes(f)),f,false));c.width=c.height=0;
   const o0=ovr(key);S.moves[key]={frames,props:o0?o0.props:baseProps(key)};S.mv.sel=0;S.mv.hold=false;
   setStatus(`${frames.length} Frames importiert`+(plan.notes.length?' · '+plan.notes.join(' · '):''),plan.notes.length&&0)})}
 // Einzelbilder: where = 'replace' (alle Frames ersetzen), 'end' (anhängen), 'after' (hinter dem gewählten Frame einfügen). Das erste Bild bestimmt den Maßstab, die übrigen folgen ihm.
 function addImages(files,where){files=files.filter(isImg).sort(natCmp);if(!files.length)return;const key=S.mv.key;
  return edit(async()=>{const o0=ovr(key),cur=o0&&o0.frames[S.mv.sel],targetH=cur?cusFrameGeom(cur).dh:refH(key),o=where==='replace'?{frames:[],props:o0?o0.props:baseProps(key)}:bake(key),out=[],notes=[];let scale=0;
   for(const f of files){if(out.length+(where==='replace'?0:o.frames.length)>=CUS_MAX_MOVE_FRAMES){notes.push(`Obergrenze von ${CUS_MAX_MOVE_FRAMES} Frames erreicht`);break}
    const r=await frameFromFile(f,scale?{scale}:{targetH});if(!scale)scale=r.scale;out.push(r.frame);notes.push(...r.notes.map(n=>f.name+': '+n))}
   if(!out.length)return false;
   if(where==='replace'){o.frames=out;S.moves[key]=o;S.mv.sel=0;S.mv.hold=false}else{const at=where==='end'?o.frames.length:S.mv.sel+1;o.frames=cusMvInsert(o.frames,at,...out);S.mv.sel=at}
   setStatus(`${out.length} Bild${out.length>1?'er':''} übernommen`+(notes.length?' · '+notes.join(' · '):''))})}
 function replaceFrame(file){const key=S.mv.key,i=S.mv.sel;   // ein einzelnes Frame austauschen, alles andere bleibt unberührt
  return edit(async()=>{const o=bake(key),old=o.frames[i];if(!old)return false;const r=await frameFromFile(file,{targetH:cusFrameGeom(old).dh,air:old.air});o.frames=cusMvReplace(o.frames,i,r.frame);
   setStatus(`Frame ${i+1} ersetzt`+(r.notes.length?' · '+r.notes.join(' · '):''))})}
 function importFiles(files){files=[...files].filter(isImg);if(!files.length)return;if(S.mv.mode==='sheet'){if(files.length>1)setStatus('Im Sheet-Modus wird nur die erste Datei genutzt – für mehrere Bilder „Einzelbilder“ wählen.');return importSheet(files[0])}return addImages(files,S.mv.append?'end':'replace')}
 function frameOp(kind,arg){const key=S.mv.key,i=S.mv.sel;
  return edit(()=>{const o=bake(key),f=o.frames[i];if(!f)return false;
   if(kind==='del'){o.frames=cusMvRemove(o.frames,i);if(!o.frames.length){delete S.moves[key];setStatus('Der Move hat keine eigenen Frames mehr – es gilt wieder das Sheet bzw. der Behelf.')}else S.mv.sel=Math.min(i,o.frames.length-1)}
   else if(kind==='dup'){if(o.frames.length>=CUS_MAX_MOVE_FRAMES)return false;o.frames=cusMvInsert(o.frames,i+1,{...f,id:cusNewId(),adj:{...f.adj}});S.mv.sel=i+1}
   else if(kind==='left'||kind==='right'){const j=i+(kind==='left'?-1:1);if(j<0||j>=o.frames.length)return false;o.frames=cusMvMove(o.frames,i,j);S.mv.sel=j}
   else if(kind==='drag'){if(arg<0||arg>=o.frames.length||arg===i)return false;o.frames=cusMvMove(o.frames,i,arg);S.mv.sel=arg}
   else if(kind==='adjreset')f.adj={...CUS_ADJ_DEFAULT}
   else if(kind==='copy'||kind==='move'){const dest=arg;if(!dest||dest===key)return false;const d=bake(dest);if(d.frames.length>=CUS_MAX_MOVE_FRAMES)return false;
    d.frames=cusMvInsert(d.frames,d.frames.length,{...f,id:cusNewId(),adj:{...f.adj}});
    if(kind==='move'){o.frames=cusMvRemove(o.frames,i);if(!o.frames.length)delete S.moves[key];else S.mv.sel=Math.min(i,o.frames.length-1)}
    setStatus(`Frame ${kind==='copy'?'kopiert':'verschoben'} nach „${CUS_ANIM_LABELS[dest]}“`)}})}
 function resetMove(){const key=S.mv.key;return edit(()=>{if(!ovr(key)){setStatus('Dieser Move hat keine eigenen Frames.');return false}delete S.moves[key];S.mv.sel=0;S.mv.hold=false;setStatus('Eigene Frames verworfen – es gilt wieder das Sheet bzw. der Behelf.')})}
 function setProps(p){const key=S.mv.key;return edit(()=>{const o=bake(key);if(!o.frames.length)return false;o.props=cusCleanProps({...o.props,...p})})}
 // Schieberegler: viele Eingaben in Folge ergeben nur einen Undo-Schritt (adjDone beim Loslassen)
 async function adjInput(fn){if(S.busy)return;await prepare();const snap=S.adjSnap||JSON.stringify(S.moves);S.adjSnap=snap;const key=S.mv.key;bake(key);const f=S.moves[key].frames[S.mv.sel];if(!f)return;fn(f);schedulePack()}
 function adjDone(){if(S.adjSnap){S.undo.push(S.adjSnap);if(S.undo.length>40)S.undo.shift();S.redo=[];S.adjSnap=null;refreshMoves()}}
 function setTab(t){const u=S.ui;S.tab=t;u.paneS.classList.toggle('hidden',t!=='sheets');u.paneM.classList.toggle('hidden',t!=='moves');u.tabS.classList.toggle('on',t==='sheets');u.tabM.classList.toggle('on',t==='moves');
  if(t==='moves'){setStatus('Bereite Moves vor …');prepare().then(()=>{setStatus('');refreshAll()}).catch(e=>setStatus(String(e&&e.message||e),1))}else refreshAll()}
 function drawThumb(cv,name){const A=curr(),g=cv.getContext('2d'),f=A&&A.frames[name];g.clearRect(0,0,cv.width,cv.height);if(!f)return;
  const k=Math.min((cv.width-4)/f.w,(cv.height-4)/f.h,1);g.imageSmoothingQuality='high';g.drawImage(A.img,f.x,f.y,f.w,f.h,(cv.width-f.w*k)/2,(cv.height-f.h*k)/2,f.w*k,f.h*k)}
 function hlFrame(i){const u=S.ui;if(!u||!u.mv||S.mv.hl===i)return;S.mv.hl=i;u.mv.th.forEach((d,k)=>d.classList.toggle('play',k===i))}
 function refreshMoves(){const u=S.ui;if(!u||!u.mv)return;const v=u.mv,key=S.mv.key,A=curr(),o=ovr(key),a=A?A.anims[key]:null,names=o?o.frames.map(f=>cusMoveName(f.id)):a?a.frames:[];
  for(const k of CUS_MOVE_KEYS){const c=v.chips[k],r=S.built&&S.built.real[k];c.className='mv-chip'+(k===key?' on':'')+(ovr(k)?' own':(r||(!S.built&&A&&A.anims[k]))?' sheet':' fb');c.title=ovr(k)?'eigene Frames':r?'aus einem Sheet':'Behelf'}
  const sh=CUS_ANIMS[key]&&CUS_SHEETS.find(s=>s.key===CUS_ANIMS[key].parts[0][0]);
  v.title.textContent=CUS_ANIM_LABELS[key];
  v.src.textContent=o?`Eigene Frames (${o.frames.length})`:S.built&&S.built.real[key]?`aus Sheet „${sh?sh.label:'?'}“ (${names.length} Frames)`:names.length?'Behelf – übernimmt Frames anderer Moves; sobald du etwas änderst, wird der Move eigenständig':'noch nicht belegt';
  v.strip.innerHTML='';v.th=[];S.mv.hl=-1;
  if(!names.length)v.strip.appendChild(el('div','mv-empty','Noch keine Frames – Sheet oder Einzelbilder importieren (Datei wählen oder hier hineinziehen).'));
  names.forEach((n,i)=>{const d=el('div','mv-th'+(i===S.mv.sel?' sel':'')),cv=document.createElement('canvas');cv.width=64;cv.height=76;d.appendChild(cv);d.appendChild(el('small',null,String(i+1)));d.draggable=true;d.dataset.i=i;d.title='Frame '+(i+1)+' – klicken zum Auswählen, ziehen zum Verschieben, Bild darauf ziehen zum Ersetzen';v.strip.appendChild(d);v.th.push(d);drawThumb(cv,n)});
  const f=o?o.frames[S.mv.sel]:null,adj=f?f.adj:CUS_ADJ_DEFAULT,has=names.length>0,p=o?o.props:a||{};
  v.s.value=Math.round(adj.s*100);v.x.value=adj.dx;v.y.value=adj.dy;v.vs.textContent=Math.round(adj.s*100)+' %';v.vx.textContent=adj.dx;v.vy.textContent=adj.dy;v.air.checked=!!(f&&f.air);
  for(const k of['s','x','y','air','left','right','repl','dup','del','adjreset','copy','move','to'])v[k].disabled=!has;
  v.left.disabled=!has||S.mv.sel<=0;v.right.disabled=!has||S.mv.sel>=names.length-1;
  v.fps.value=p.fps||12;v.loop.checked=!!p.loop;v.fps.disabled=!has||!p.loop;v.loop.disabled=!has;v.play.disabled=!has;v.play.textContent=S.mv.hold?'▶ Animation abspielen':'⏸ Frame anhalten';
  v.undo.disabled=!S.undo.length;v.redo.disabled=!S.redo.length;v.reset.disabled=!o;
  for(const op of v.to.options)op.disabled=op.value===key;if(v.to.value===key)v.to.value=CUS_MOVE_KEYS.find(k=>k!==key);
  v.cols.value=S.mv.cols;v.rows.value=S.mv.rows;v.calib.checked=S.mv.calib;v.append.checked=!!S.mv.append;
  v.root.querySelectorAll('[name=mv-mode]').forEach(r=>r.checked=r.value===S.mv.mode);v.root.querySelectorAll('.mv-opt').forEach(s=>s.classList.toggle('hidden',s.dataset.m!==S.mv.mode))}
 function selectMove(k){S.mv.key=k;S.mv.sel=0;S.mv.hold=false;refreshMoves();const u=S.ui;if(u.anim.querySelector(`option[value="${k}"]`))u.anim.value=k}
 function buildMoves(m,u){const P=u.paneM,v=u.mv={chips:{},th:[],root:P};
  P.innerHTML=`<div class="mv-groups"></div><div class="mv-box">
   <div class="mv-head"><b id="mv-title"></b><span id="mv-src" class="st-sm"></span></div>
   <div class="mv-imp"><span class="mv-seg"><label><input type="radio" name="mv-mode" value="sheet" checked> Sheet</label><label><input type="radio" name="mv-mode" value="single"> Einzelbilder</label></span>
    <span class="mv-opt" data-m="sheet">Raster <input id="mv-cols" type="number" min="1" max="8" value="3" title="Spalten"> × <input id="mv-rows" type="number" min="1" max="8" value="2" title="Zeilen"> <label title="Zelle 1 = neutrale Haltung: bestimmt die Größe und wird nicht mitimportiert"><input id="mv-calib" type="checkbox" checked> Zelle 1 = Kalibrierung</label></span>
    <span class="mv-opt hidden" data-m="single"><label title="Neue Bilder hinten anhängen statt alle Frames zu ersetzen"><input id="mv-append" type="checkbox"> anhängen</label></span>
    <button id="mv-pick">Datei(en) wählen …</button><button id="mv-reset" class="warn" title="Eigene Frames dieses Moves verwerfen (zurück auf Sheet bzw. Behelf)">Zurücksetzen</button></div>
   <div class="mv-strip" id="mv-strip"></div>
   <div class="mv-tools"><button id="mv-left" title="Frame nach links">◀</button><button id="mv-right" title="Frame nach rechts">▶</button><button id="mv-repl">Ersetzen …</button><button id="mv-ins">Einfügen …</button><button id="mv-dup">Duplizieren</button><button id="mv-del" class="warn">Löschen</button>
    <span class="mv-sp"></span><button id="mv-undo" title="Letzte Änderung rückgängig (Strg+Z)">↶</button><button id="mv-redo" title="Wiederholen (Strg+Y)">↷</button></div>
   <div class="mv-tools"><span>Frame nach</span><select id="mv-to"></select><button id="mv-copy">kopieren</button><button id="mv-move">verschieben</button></div>
   <div class="mv-adj"><label>Größe <b id="mv-vs"></b><input id="mv-s" type="range" min="${CUS_ADJ_LIMITS.s[0]*100}" max="${CUS_ADJ_LIMITS.s[1]*100}"></label><label>X <b id="mv-vx"></b><input id="mv-x" type="range" min="${CUS_ADJ_LIMITS.dx[0]}" max="${CUS_ADJ_LIMITS.dx[1]}"></label><label>Y <b id="mv-vy"></b><input id="mv-y" type="range" min="${CUS_ADJ_LIMITS.dy[0]}" max="${CUS_ADJ_LIMITS.dy[1]}"></label>
    <label class="mv-ck"><input id="mv-air" type="checkbox"> Luft-Pose (an der Körpermitte verankert)</label><button id="mv-adjreset">Feinabstimmung zurücksetzen</button></div>
   <div class="mv-anim"><label>Tempo <input id="mv-fps" type="number" min="1" max="60" title="Bilder pro Sekunde (nur bei Schleife)"> B/s</label><label><input id="mv-loop" type="checkbox"> Schleife</label><button id="mv-play">⏸ Frame anhalten</button></div>
   <input id="mv-file" type="file" accept="image/*" multiple hidden></div>`;
  const q=id=>P.querySelector('#'+id);Object.assign(v,{title:q('mv-title'),src:q('mv-src'),strip:q('mv-strip'),cols:q('mv-cols'),rows:q('mv-rows'),calib:q('mv-calib'),append:q('mv-append'),pick:q('mv-pick'),reset:q('mv-reset'),file:q('mv-file'),
   left:q('mv-left'),right:q('mv-right'),repl:q('mv-repl'),ins:q('mv-ins'),dup:q('mv-dup'),del:q('mv-del'),undo:q('mv-undo'),redo:q('mv-redo'),to:q('mv-to'),copy:q('mv-copy'),move:q('mv-move'),
   s:q('mv-s'),x:q('mv-x'),y:q('mv-y'),vs:q('mv-vs'),vx:q('mv-vx'),vy:q('mv-vy'),air:q('mv-air'),adjreset:q('mv-adjreset'),fps:q('mv-fps'),loop:q('mv-loop'),play:q('mv-play')});
  const gbox=P.querySelector('.mv-groups');
  for(const[title,keys]of CUS_MOVE_GROUPS){const g=el('div','mv-g'),row=el('div','mv-chips');g.appendChild(el('div','st-h',title));g.appendChild(row);
   for(const k of keys){const c=el('button','mv-chip',esc(CUS_ANIM_LABELS[k]));c.dataset.k=k;c.onclick=()=>selectMove(k);v.chips[k]=c;row.appendChild(c)}gbox.appendChild(g)}
  for(const k of CUS_MOVE_KEYS){const o=el('option',null,esc(CUS_ANIM_LABELS[k]));o.value=k;v.to.appendChild(o)}
  // Import
  P.querySelectorAll('[name=mv-mode]').forEach(r=>r.onchange=()=>{S.mv.mode=r.value;refreshMoves()});
  v.cols.onchange=()=>{S.mv.cols=Math.max(1,Math.min(8,+v.cols.value||3));refreshMoves()};v.rows.onchange=()=>{S.mv.rows=Math.max(1,Math.min(8,+v.rows.value||2));refreshMoves()};
  v.calib.onchange=()=>{S.mv.calib=v.calib.checked};v.append.onchange=()=>{S.mv.append=v.append.checked};
  const pick=what=>{S.mv.pick=what;v.file.multiple=what!=='replace';v.file.click()};
  v.pick.onclick=()=>pick('import');v.repl.onclick=()=>pick('replace');v.ins.onclick=()=>pick('after');
  v.file.onchange=()=>{const fs=[...v.file.files];v.file.value='';if(S.mv.pick==='replace')replaceFrame(fs[0]);else if(S.mv.pick==='after')addImages(fs,'after');else importFiles(fs)};
  v.reset.onclick=resetMove;
  // Frames bearbeiten
  v.left.onclick=()=>frameOp('left');v.right.onclick=()=>frameOp('right');v.dup.onclick=()=>frameOp('dup');v.del.onclick=()=>frameOp('del');v.adjreset.onclick=()=>frameOp('adjreset');
  v.copy.onclick=()=>frameOp('copy',v.to.value);v.move.onclick=()=>frameOp('move',v.to.value);v.undo.onclick=undo;v.redo.onclick=redo;
  v.s.oninput=()=>adjInput(f=>{f.adj.s=Math.min(CUS_ADJ_LIMITS.s[1],Math.max(CUS_ADJ_LIMITS.s[0],+v.s.value/100))});v.x.oninput=()=>adjInput(f=>{f.adj.dx=+v.x.value});v.y.oninput=()=>adjInput(f=>{f.adj.dy=+v.y.value});
  for(const k of['s','x','y'])v[k].onchange=adjDone;
  v.air.onchange=()=>edit(()=>{const f=bake(S.mv.key).frames[S.mv.sel];if(!f)return false;f.air=v.air.checked});
  v.fps.onchange=()=>setProps({fps:+v.fps.value||12});v.loop.onchange=()=>setProps({loop:v.loop.checked?1:0});
  v.play.onclick=()=>{S.mv.hold=!S.mv.hold;refreshMoves()};
  // Streifen: auswählen, ziehen = verschieben, Bild darauf ziehen = ersetzen
  const th=e=>e.target.closest&&e.target.closest('.mv-th');
  v.strip.addEventListener('click',e=>{const d=th(e);if(!d)return;S.mv.sel=+d.dataset.i;S.mv.hold=true;refreshMoves()});
  v.strip.addEventListener('dragstart',e=>{const d=th(e);if(!d)return;e.dataTransfer.setData('text/x-hitisop-frame',d.dataset.i);e.dataTransfer.effectAllowed='move'});
  P.addEventListener('dragover',e=>{e.preventDefault();P.classList.add('over')});P.addEventListener('dragleave',e=>{if(!P.contains(e.relatedTarget))P.classList.remove('over')});
  P.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();P.classList.remove('over');const dt=e.dataTransfer||{},files=[...(dt.files||[])],d=th(e),from=typeof dt.getData==='function'?dt.getData('text/x-hitisop-frame'):'';
   if(from!==''&&!files.length){if(d){S.mv.sel=+from;frameOp('drag',+d.dataset.i)}return}
   if(files.length){if(d){S.mv.sel=+d.dataset.i;replaceFrame(files[0])}else importFiles(files)}});
  // Tastatur (nur im Reiter, nicht beim Tippen in Feldern): Pfeile = Frame wählen, Entf = löschen, Strg+Z/Y = Rückgängig/Wiederholen
  addEventListener('keydown',e=>{if(!S.open||S.tab!=='moves')return;const t=e.target&&e.target.tagName;if(t==='INPUT'||t==='SELECT'||t==='TEXTAREA')return;
   if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();e.shiftKey?redo():undo()}else if((e.ctrlKey||e.metaKey)&&e.code==='KeyY'){e.preventDefault();redo()}
   else if(e.code==='ArrowLeft'||e.code==='ArrowRight'){const n=curLen();if(!n)return;e.preventDefault();S.mv.sel=Math.max(0,Math.min(n-1,S.mv.sel+(e.code==='ArrowLeft'?-1:1)));S.mv.hold=true;refreshMoves()}
   else if(e.code==='Delete'||e.code==='Backspace'){if(!curLen())return;e.preventDefault();frameOp('del')}});
  u.tabS.onclick=()=>setTab('sheets');u.tabM.onclick=()=>setTab('moves');u.anim.onchange=()=>{if(S.tab==='moves'&&CUS_MOVE_KEYS.includes(u.anim.value)&&u.anim.value!==S.mv.key){S.mv.key=u.anim.value;S.mv.sel=0;S.mv.hold=false;refreshMoves()}}}
 // ---- Figur aktivieren / speichern ----
 async function activate(p,meta,blob){CHARACTERS.custom=cusMakeChar(p,CHARACTERS[p.template]||CHARACTERS.tiger);
  const url=URL.createObjectURL(blob),img=new Image();img.src=url;
  try{await img.decode()}catch(e){await new Promise(r=>{img.onload=r;img.onerror=r})}
  if(S.url)URL.revokeObjectURL(S.url);S.url=url;
  registerSpriteChar('custom',{anims:meta.anims,fist:[104,-130],height:190});(window.__SPRITES__=window.__SPRITES__||{}).custom={meta,img}}
 const readForm=()=>{const u=S.ui;return cusClean({name:u.name.value,template:u.tpl.value,hp:u.hp.value,tempo:u.tempo.value,dmg:u.dmg.value,abwehr:u.abwehr.value,glow:u.glow.value})};
 async function save(fight){const p=readForm();let meta,blob;
  if(S.timer){clearTimeout(S.timer);S.timer=0;await rebuild()}
  if(S.built){if(!S.built.anims||!S.built.real.idle){setStatus('Es fehlt noch „Idle“ (Sheet „Idle – Teil 1“ oder eigene Frames im Reiter „Einzelne Moves“) – ohne das geht es nicht.',1);return}
   meta={frames:S.built.frames,standH:CUS_STAND_H,anims:S.built.anims};blob=await toBlob(S.built.canvas)}
  else if(S.saved){meta=S.saved.meta;blob=S.saved.atlasBlob}
  else{setStatus('Lade zuerst mindestens „Idle – Teil 1“ hoch.',1);return}
  setStatus('Speichere …');await activate(p,meta,blob);S.profile=p;S.desc=S.ui.desc.value;
  const mv=cusCleanMoves(S.moves),fb={};for(const id of cusMoveImgs(mv)){const e=S.imgs[id];if(!e)continue;if(!e.blob)e.blob=await canvasPng(e.canvas);fb[id]=e.blob}   // Move-Frames: Daten + Bilder (PNG)
  S.saved={profile:p,meta,atlasBlob:blob,files:{...S.files},moves:JSON.parse(JSON.stringify(mv))};
  try{await tx('readwrite',s=>s.put({v:2,profile:p,desc:S.desc,files:S.files,meta,atlas:blob,moves:mv,frameBlobs:fb},'fighter'))}
  catch(e){alert('Die Figur konnte nicht dauerhaft im Browser gespeichert werden (nur für diese Sitzung).')}
  close(true);if(S.onDone)S.onDone({saved:true,fight:!!fight})}
 async function loadSaved(){try{const r=await tx('readonly',s=>s.get('fighter'));if(!r||!r.meta||!r.atlas)return false;
   S.profile=cusClean(r.profile);S.desc=r.desc||'';S.files=r.files||{};S.moves=cusCleanMoves(r.moves);S.imgs={};S.undo=[];S.redo=[];S.ready=false;   // v1-Speicherstände haben keine Moves
    for(const id of cusMoveImgs(S.moves))if(r.frameBlobs&&r.frameBlobs[id])S.imgs[id]={blob:r.frameBlobs[id]};
    if(r.meta.anims){const a=cusCompleteAnims(r.meta.anims);if(a)r.meta.anims=a}   // neue Animationen (z. B. Hyper) bekommen einen Behelf, vorhandene bleiben unangetastet
    S.saved={profile:S.profile,meta:r.meta,atlasBlob:r.atlas,files:S.files,moves:JSON.parse(JSON.stringify(S.moves))};await activate(S.profile,r.meta,r.atlas);return true}catch(e){return false}}
 async function remove(){if(!confirm('Deine eigene Figur wirklich löschen?'))return;
  try{await tx('readwrite',s=>s.delete('fighter'))}catch(e){}
  delete CHARACTERS.custom;registerSpriteChar('custom',undefined);if(window.__SPRITES__)delete window.__SPRITES__.custom;
  S.saved=null;S.built=null;S.files={};S.cache={};S.moves={};S.imgs={};S.undo=[];S.redo=[];S.ready=false;S.profile={...CUS_DEFAULT};S.desc='';close(true);if(S.onDone)S.onDone({deleted:true})}
 // ---- Oberfläche ----
 function build(){const m=el('div');m.id='studio';m.className='hidden';
  const opts=CUS_TEMPLATES.map(t=>`<option value="${t[0]}">${t[1]} – ${t[2]}</option>`).join('');
  m.innerHTML=`<div class="panel st"><h1>EIGENE <span>FIGUR</span></h1>
  <p class="st-lead">Lade deine Sprite-Sheets hoch und kämpfe mit deinem eigenen Charakter. Nötig ist nur <b>Idle – Teil 1</b>; alles andere kannst du nach und nach nachliefern, bis dahin übernehmen Behelfe. Im Reiter <b>Einzelne Moves</b> bekommt jede Attacke und Bewegung eigene Bilder – einzelne Frames lassen sich dort austauschen, löschen und umsortieren.</p>
  <div class="st-cols"><div class="st-l"><div class="st-tabs tabs"><button id="st-tab-sheets" class="on">Sheets</button><button id="st-tab-moves">Einzelne Moves</button></div><div id="st-pane-sheets">
   <div class="st-drop" id="st-drop"><b>Sheets hier hineinziehen</b><br>oder <button id="st-pick">Dateien wählen</button><div class="st-sm">Dateinamen wie <code>idle_1.png</code>, <code>punch.png</code> … werden automatisch zugeordnet.</div></div>
   <input type="file" id="st-files" multiple accept="image/*" hidden><div id="st-slots" class="st-slots"></div></div><div id="st-pane-moves" class="hidden"></div></div>
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
  const q=id=>m.querySelector('#'+id),u={root:m,paneS:q('st-pane-sheets'),paneM:q('st-pane-moves'),tabS:q('st-tab-sheets'),tabM:q('st-tab-moves'),drop:q('st-drop'),pick:q('st-pick'),files:q('st-files'),slots:q('st-slots'),prev:q('st-prev'),anim:q('st-anim'),name:q('st-name'),tpl:q('st-tpl'),
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
  buildMoves(m,u);return u}
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
  if(S.over&&S.over.length)L.push(`<div class="mute">Eigene Frames haben Vorrang vor dem Sheet: ${S.over.map(k=>CUS_ANIM_LABELS[k]).map(esc).join(', ')} (im Reiter „Einzelne Moves“ zurücksetzbar).</div>`);
  S.ui.report.innerHTML=L.join('')}
 function fillAnims(){const u=S.ui,A=curr();if(!A)return;const old=u.anim.value;u.anim.innerHTML='';
  for(const k of Object.keys(CUS_ANIM_LABELS)){if(!A.anims[k])continue;const o=el('option');o.value=k;o.textContent=CUS_ANIM_LABELS[k]+(S.built&&!S.built.real[k]?' (Behelf)':'');u.anim.appendChild(o)}
  u.anim.value=A.anims[old]?old:A.anims.idle?'idle':Object.keys(A.anims)[0]||'';if(S.tab==='moves'&&A.anims[S.mv.key])u.anim.value=S.mv.key}
 function focusAnim(key){const u=S.ui;if(!u)return;S.focus=Object.keys(CUS_ANIMS).find(k=>CUS_ANIMS[k].parts[0][0]===key)||null}
 function refreshAll(){refreshSlots();refreshReport();fillAnims();refreshMoves();if(S.focus&&S.ui.anim.querySelector(`option[value="${S.focus}"]`)&&S.built&&S.built.real[S.focus]){S.ui.anim.value=S.focus;S.focus=null}}
 // aktuelle Daten für die Vorschau: frisch gebaut oder gespeichert
 function curr(){if(S.built)return{img:S.built.canvas,frames:S.built.frames,anims:S.built.anims||S.built.real};const sp=window.__SPRITES__&&window.__SPRITES__.custom;return sp&&S.saved?{img:sp.img,frames:sp.meta.frames,anims:sp.meta.anims}:null}
 function draw(){const u=S.ui,c=u.prev,g=c.getContext('2d'),W=c.width,H=c.height,floor=H-34;
  const bg=g.createRadialGradient(W/2,floor,10,W/2,floor-60,230);bg.addColorStop(0,'#2a1a5e');bg.addColorStop(1,'#0a0618');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='#3a2a6b';g.beginPath();g.moveTo(0,floor);g.lineTo(W,floor);g.stroke();
  const A=curr();if(!A){g.fillStyle='#9d8fd0';g.font='15px system-ui';g.textAlign='center';g.fillText('Vorschau erscheint nach dem ersten Sheet',W/2,H/2);return}
  const key=u.anim.value,a=A.anims[key]||A.anims.idle||Object.values(A.anims)[0];if(!a||!a.frames.length)return;const n=a.frames.length,t=performance.now()/1000;
  let idx=a.loop?Math.floor(t*(a.fps||12))%n:Math.min(n-1,Math.floor(((t%1.4)/1.4)*n));
  const mvOn=S.tab==='moves'&&key===S.mv.key;if(mvOn&&S.mv.hold)idx=Math.min(S.mv.sel,n-1);   // Move-Editor: gewähltes Frame einzeln zeigen
  hlFrame(mvOn?idx:-1);const fr=A.frames[a.frames[idx]];if(!fr)return;
  const k=.72;g.save();g.translate(W/2,floor);if(a.squash)g.scale(1,1-(1-a.squash)*.5);
  g.drawImage(A.img,fr.x,fr.y,fr.w,fr.h,fr.ox*k,fr.oy*k,fr.w*k,fr.h*k);g.restore()}
 const loop=()=>{if(!S.open)return;try{draw()}catch(e){}S.raf=requestAnimationFrame(loop)};
 function fillForm(){const u=S.ui,p=S.profile;u.name.value=p.name;u.tpl.value=p.template;u.hp.value=p.hp;u.tempo.value=p.tempo;u.dmg.value=p.dmg;u.abwehr.value=p.abwehr;u.glow.value=p.glow;u.desc.value=S.desc||'';
  for(const k of['hp','tempo','dmg','abwehr'])u[k].oninput()}
 function open(onDone){if(!S.ui)S.ui=build();S.onDone=onDone;S.loose=[];fillForm();refreshAll();fillAnims();S.ui.del.hidden=!S.saved;S.ui.root.classList.remove('hidden');S.open=true;setStatus('');if(S.tab==='moves')setTab('moves');cancelAnimationFrame(S.raf);loop()}
 function close(silent){if(!S.ui)return;S.open=false;cancelAnimationFrame(S.raf);S.ui.root.classList.add('hidden');if(!silent&&S.onDone)try{S.onDone({closed:true})}catch(e){}}
 return{open,isOpen:()=>S.open,loadSaved,has:()=>!!CHARACTERS.custom}
})();
export const studioOpen=cb=>STUDIO.open(cb);
export const studioIsOpen=()=>STUDIO.isOpen();
export const studioLoadSaved=()=>STUDIO.loadSaved();
export const studioHas=()=>STUDIO.has();
