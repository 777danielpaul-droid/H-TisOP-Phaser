import{H,W}from'../core/config.js';
import{pick}from'../core/loot.js';
import{Story}from'../core/story.js';

import{BG_NAMES,BG_SLOTS,bgKind,resolveSlot}from'./backdrop.js';
import{cover}from'./lootui.js';
import{R}from'./sprites.js';
import{Stage}from'./stage.js';
// Oberfläche für eigene Hintergründe (DOM, liegt über dem Canvas):
//  - Drag & Drop: Datei irgendwo ins Fenster ziehen (Titelmenü, Auswahl, Kampf, Menü …) => Hintergrund für ÜBERALL.
//    Ist das Panel offen, kann man die Datei auch auf eine Zeile ziehen => nur für diesen Bereich.
//  - Upload: Knopf links unten (Titelmenü + Auswahlbildschirme, Taste H), im Pausenmenü unter Optionen, oder im Panel selbst.
//  - Verwaltung: je Bereich Datei ersetzen, auf Original zurückstellen oder entfernen; Abdunklung, Anpassung, Bewegung.
// Der Editor für die eigene Figur (customstudio) hat eigenes Drag & Drop: solange er offen ist (hooks.blocked()), bleibt dieses Modul still.
export const BG_AREA_HELP={all:'gilt überall, wo unten nichts Eigenes steht',title:'Startseite mit den vier Spielmodi',select:'Charakter-, Stage- und Modus-Auswahl',fight:'Kampf, Story, Melee und die Bildschirme danach'};
export class BgPanel{
 constructor(bd,hooks={}){this.bd=bd;this.hooks=hooks;this.isOpen=false;this.root=null;this.dragging=false;this.pickSlot='all';this._raf=0;this._toastT=0;this.btnVis=null;this.thumbs={};
  bd.onchange=()=>{if(this.isOpen)this.refresh()}}
 busy(){return this.isOpen}
 mount(){if(this.root||typeof document==='undefined'||!document.body)return;const d=document,el=(t,c,h)=>{const e=d.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
  const r=this.root=el('div','','');r.id='bgpanel';r.className='hidden';r.tabIndex=-1;
  r.innerHTML=`<div class="bgbox"><h2>Eigener Hintergrund</h2>
   <p class="bgsub">Bild oder Video einfach <b>irgendwo ins Fenster ziehen</b> – oder hier hochladen. Es gilt dann im Titelmenü, in allen Auswahlbildschirmen und im Kampf. Videos laufen stumm in Dauerschleife. Alles bleibt in deinem Browser.</p>
   <div class="bgdrop" data-slot="all"><b>Bild / Video hierher ziehen</b><span>oder</span><button type="button" class="bgpick" data-slot="all">Datei wählen</button><small>JPG · PNG · WebP · GIF · MP4 · WebM</small></div>
   <div class="bgrows"></div>
   <div class="bgopts">
    <label>Abdunkeln <b class="bgdimv"></b><input type="range" class="bgdim" min="0" max="90" step="5"></label>
    <label>Anpassung <select class="bgfit"><option value="cover">Bildschirm füllen (zuschneiden)</option><option value="contain">Ganz zeigen (schwarze Ränder)</option></select></label>
    <label class="bgck"><input type="checkbox" class="bgpar"> Leichte Kamerabewegung (Parallaxe)</label>
    <label class="bgck"><input type="checkbox" class="bghouse"> Kampf-Häuser/Wände (begehbar) vor dem Hintergrund zeigen</label>
   </div>
   <div class="bgfoot"><span class="bgnote"></span><button type="button" class="bgclose">Fertig (Esc)</button></div>
   <input type="file" class="bgfile" accept="image/*,video/*,.mp4,.m4v,.webm,.ogv,.mov,.gif" hidden></div>`;
  d.body.appendChild(r);
  const q=s=>r.querySelector(s);this.rows=q('.bgrows');this.note=q('.bgnote');this.file=q('.bgfile');
  const rows=this.rows;for(const s of BG_SLOTS){const row=el('div','bgrow');row.dataset.slot=s;
   row.innerHTML=`<canvas width="128" height="72"></canvas><div class="bgtxt"><b>${BG_NAMES[s]}</b><span class="bgst"></span><small>${BG_AREA_HELP[s]}</small></div><div class="bgbtns"><button type="button" class="bgpick" data-slot="${s}">Hochladen</button>${s==='all'?'':'<button type="button" class="bgoff">Original</button>'}<button type="button" class="bgclr">${s==='all'?'Entfernen':'Wie „Überall“'}</button></div>`;
   rows.appendChild(row);this.thumbs[s]={cv:row.querySelector('canvas'),st:row.querySelector('.bgst'),off:row.querySelector('.bgoff'),clr:row.querySelector('.bgclr')};
   row.querySelector('.bgpick').onclick=()=>this.pick(s);const off=row.querySelector('.bgoff');if(off)off.onclick=()=>this.bd.off(s);row.querySelector('.bgclr').onclick=()=>this.bd.clear(s)}
  q('.bgdrop .bgpick').onclick=()=>this.pick('all');q('.bgclose').onclick=()=>this.close();
  r.addEventListener('mousedown',e=>{if(e.target===r)this.close()});
  this.file.onchange=async()=>{const f=this.file.files&&this.file.files[0];this.file.value='';if(f)await this.apply(this.pickSlot,f)};
  const dim=q('.bgdim'),dv=q('.bgdimv'),fit=q('.bgfit'),par=q('.bgpar'),hs=q('.bghouse');
  dim.oninput=()=>{this.bd.setOpt('dim',dim.value/100);dv.textContent=dim.value+' %'};fit.onchange=()=>this.bd.setOpt('fit',fit.value);par.onchange=()=>this.bd.setOpt('parallax',par.checked);hs.onchange=()=>this.bd.setOpt('houses',hs.checked);
  this.ctl={dim,dv,fit,par,hs};
  // Floating-Knopf (nur Titelmenü + Auswahl, siehe setBtn)
  const b=this.btn=el('button','hidden','🖼 Hintergrund <kbd>H</kbd>');b.id='bgbtn';b.type='button';b.title='Eigenes Bild oder Video als Hintergrund einfügen (oder einfach ins Fenster ziehen)';b.onclick=()=>this.open();d.body.appendChild(b);
  // Overlay beim Ziehen über das Fenster + Hinweis-Toast
  const ov=this.ov=el('div','hidden','<div><b></b><span></span></div>');ov.id='bgdrop';d.body.appendChild(ov);
  const t=this.toastEl=el('div','hidden','');t.id='bgtoast';d.body.appendChild(t);
  // Globales Drag & Drop
  const files=e=>e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files'),blocked=()=>this.hooks.blocked&&this.hooks.blocked();
  const rowOf=e=>{const n=e.target&&e.target.closest?e.target.closest('[data-slot]'):null;return this.isOpen&&n&&r.contains(n)?n:null};
  const hl=n=>{r.querySelectorAll('.over').forEach(x=>{if(x!==n)x.classList.remove('over')});if(n)n.classList.add('over')};
  const showOv=on=>{if(on){const open=this.isOpen;ov.querySelector('b').textContent=open?'Auf eine Zeile loslassen = nur dieser Bereich':'Loslassen = Hintergrund für überall';ov.querySelector('span').textContent=open?'sonst gilt es überall':'Bild oder Video';ov.classList.remove('hidden')}else{ov.classList.add('hidden');hl(null)}this.dragging=on};
  addEventListener('dragenter',e=>{if(blocked()||!files(e))return;e.preventDefault();showOv(true)});
  addEventListener('dragover',e=>{if(blocked()||!files(e))return;e.preventDefault();try{e.dataTransfer.dropEffect='copy'}catch(x){}if(!this.dragging)showOv(true);hl(rowOf(e))});
  addEventListener('dragleave',e=>{if(!this.dragging)return;if(!e.relatedTarget||e.clientX<=0&&e.clientY<=0)showOv(false)});
  addEventListener('dragend',()=>showOv(false));
  addEventListener('drop',async e=>{if(blocked()||!files(e))return;e.preventDefault();const row=rowOf(e),slot=row?row.dataset.slot:'all';showOv(false);
   const list=[...(e.dataTransfer.files||[])],f=list.find(x=>bgKind(x));if(!f){this.toast(list.length?'Das ist weder ein Bild noch ein Video.':'Keine Datei erkannt.',false);return}
   await this.apply(slot,f)});
  addEventListener('blur',()=>showOv(false));
  // Modal: solange das Panel offen ist, bekommt das Spiel keine Tasten
  addEventListener('keydown',e=>{if(!this.isOpen)return;if(e.code==='Escape'){e.preventDefault();this.close()}e.stopImmediatePropagation()},true);
  addEventListener('keyup',e=>{if(this.isOpen)e.stopImmediatePropagation()},true)}
 async apply(slot,file){const r=await this.bd.set(slot,file);this.toast(r.msg,r.ok);return r}
 pick(slot){this.pickSlot=slot;this.file.value='';this.file.click()}
 toast(msg,ok=true){const t=this.toastEl;if(!t)return;t.textContent=msg;t.className=ok?'ok':'err';clearTimeout(this._toastT);this._toastT=setTimeout(()=>t.classList.add('hidden'),ok?3500:6000)}
 open(){this.mount();if(!this.root)return;if(this.hooks.onOpen)this.hooks.onOpen();this.isOpen=true;this.root.classList.remove('hidden');this.syncCtl();this.refresh();this.root.focus();this.loop()}
 close(){if(!this.isOpen)return;this.isOpen=false;this.root.classList.add('hidden');cancelAnimationFrame(this._raf);if(this.hooks.onClose)this.hooks.onClose()}
 syncCtl(){const o=this.bd.opts,c=this.ctl;c.dim.value=String(Math.round(o.dim*100));c.dv.textContent=c.dim.value+' %';c.fit.value=o.fit;c.par.checked=!!o.parallax;c.hs.checked=!!o.houses}
 // Zeilen-Texte/Knöpfe aktualisieren
 refresh(){if(!this.root)return;const it=this.bd.items;
  for(const s of BG_SLOTS){const e=it[s],T=this.thumbs[s];let txt;
   if(e&&e.off)txt='Original-Hintergrund des Spiels';else if(e)txt=(e.kind==='video'?'Video: ':'Bild: ')+(e.name||'');else if(s==='all')txt='Standard (Level-Hintergründe des Spiels)';else txt=it.all&&!it.all.off?'Wie „Überall“':'Standard (Level-Hintergründe des Spiels)';
   T.st.textContent=txt;if(T.off)T.off.disabled=!!(e&&e.off);T.clr.disabled=!e}
  const mem=!this.bd.persist||Object.values(it).some(e=>e&&e.mem);this.note.textContent=mem?'Hinweis: Mindestens ein Hintergrund konnte nicht dauerhaft gespeichert werden (Browser-Speicher nicht verfügbar oder voll) und gilt nur bis zum Schließen des Tabs.':''}
 // Vorschau-Bilder (Videos laufen live mit)
 loop(){if(!this.isOpen)return;const bd=this.bd;for(const s of BG_SLOTS){const T=this.thumbs[s],g=T.cv.getContext('2d'),w=T.cv.width,h=T.cv.height,src=resolveSlot(bd.items,s),m=src&&bd.media[src];
   if(m&&(m.kind!=='video'||m.el.readyState>=2)&&m.w()){const k=Math.max(w/m.w(),h/m.h()),dw=m.w()*k,dh=m.h()*k;g.drawImage(m.src(),(w-dw)/2,(h-dh)/2,dw,dh);if(m.kind==='video'){m.use=performance.now();if(m.el.paused)m.el.play().catch(()=>{})}}
   else{g.fillStyle='#0b0718';g.fillRect(0,0,w,h);g.strokeStyle='#3a2a6b';g.lineWidth=1;for(let x=-h;x<w;x+=14){g.beginPath();g.moveTo(x,h);g.lineTo(x+h,0);g.stroke()}g.fillStyle='#8f95d8';g.font='bold 12px system-ui';g.textAlign='center';g.fillText('ORIGINAL',w/2,h/2+4)}}
  this._raf=requestAnimationFrame(()=>this.loop())}
 // Knopf links unten nur zeigen, wenn es passt (Titelmenü/Auswahl, kein anderes Overlay)
 setBtn(v){if(!this.btn||v===this.btnVis)return;this.btnVis=v;this.btn.classList.toggle('hidden',!v)}
}
