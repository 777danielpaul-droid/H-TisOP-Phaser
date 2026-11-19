// Entwicklerkonsole: Strg+Alt+D öffnet/schließt ein Panel oben im Fenster (Eingabezeile + kleiner Ausgabebereich).
//  - Befehle stehen in einer Tabelle: devUi.add(name, beschreibung, fn). fn(args) liefert den Ausgabetext; ein Wurf wird als Fehler angezeigt.
//  - Modal wie die anderen Panels: solange sie offen ist, bekommt das Spiel keine Tasten (main.js pausiert dann auch den Kampf).
//  - Die Story-/Cheat-Befehle stehen in core/devcmds.js.
export const DEV_TOGGLE=e=>e.code==='KeyD'&&!!e.ctrlKey&&!!e.altKey&&!e.shiftKey&&!e.metaKey;
export class DevConsole{
 constructor(hooks={}){this.hooks=hooks;this.isOpen=false;this.root=null;this.out=null;this.inp=null;this.cmds=new Map();this.log=[];
  this.add('help','Zeigt alle Befehle',()=>'Verfügbare Befehle:\n'+[...this.cmds.values()].map(c=>'  '+(c.name+(c.usage?' '+c.usage:'')).padEnd(22)+c.desc).join('\n')+'\nSchließen: Esc oder Strg+Alt+D')}
 add(name,desc,fn,usage=''){const n=String(name).toLowerCase();this.cmds.set(n,{name:n,desc,fn,usage})}
 print(text,cls=''){for(const t of String(text).split('\n')){this.log.push({t,cls});if(this.log.length>100)this.log.shift();
   if(this.out){const d=document.createElement('div');d.textContent=t;if(cls)d.className=cls;this.out.appendChild(d);while(this.out.childNodes.length>100)this.out.removeChild(this.out.firstChild)}}
  if(this.out)this.out.scrollTop=this.out.scrollHeight}
 exec(line){line=String(line||'').trim();if(!line)return;this.print('> '+line,'dc-in');
  const a=line.split(/\s+/),n=a.shift().toLowerCase(),c=this.cmds.get(n);
  if(!c){this.print(`Unbekannter Befehl: „${n}“. „help“ zeigt alle Befehle.`,'dc-err');return}
  try{const r=c.fn(a);if(r!=null&&r!=='')this.print(r)}catch(e){this.print('Fehler: '+(e&&e.message||e),'dc-err')}}
 submit(){const v=this.inp?this.inp.value:'';if(this.inp)this.inp.value='';this.exec(v)}
 // 0 = Taste gehört nicht der Konsole, 1 = verschlucken (Spiel bekommt sie nicht, Tippen ins Feld bleibt möglich), 2 = erledigt (zusätzlich preventDefault)
 key(e){if(DEV_TOGGLE(e)){if(!this.isOpen&&this.hooks.blocked&&this.hooks.blocked())return 0;if(this.isOpen)this.close();else this.open();return 2}
  if(!this.isOpen)return 0;
  if(e.code==='Escape'){this.close();return 2}
  if(e.code==='Enter'||e.code==='NumpadEnter'){this.submit();return 2}
  return 1}
 busy(){return this.isOpen}
 open(){this.mount();if(this.isOpen)return;this.isOpen=true;if(this.hooks.onOpen)this.hooks.onOpen();if(this.root){this.root.classList.remove('hidden');this.inp.focus()}}
 close(){if(!this.isOpen)return;this.isOpen=false;if(this.root){this.root.classList.add('hidden');this.inp.blur()}if(this.hooks.onClose)this.hooks.onClose()}
 mount(){if(this.root||typeof document==='undefined'||!document.body)return;const d=document,r=this.root=d.createElement('div');r.id='devcon';r.className='hidden';
  r.innerHTML='<div class="dcbox"><div class="dchead">DEV<span>KONSOLE</span><small>Esc / Strg+Alt+D schließt</small></div><div class="dcout"></div><div class="dcrow"><span>&gt;</span><input class="dcin" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Befehl eingeben … (help)"></div></div>';
  this.out=r.querySelector('.dcout');this.inp=r.querySelector('.dcin');d.body.appendChild(r);
  this.print('H!TisOP Dev-Konsole – „help“ zeigt alle Befehle.','dc-hint');
  r.addEventListener('mousedown',e=>{if(e.target===r)this.close()});
  // Capture-Phase: läuft vor den Spiel-Handlern; geschluckte Tasten erreichen das Spiel nicht (Tippen ins Feld funktioniert trotzdem)
  addEventListener('keydown',e=>{const k=this.key(e);if(k===2)e.preventDefault();if(k)e.stopImmediatePropagation()},true);
  addEventListener('keyup',e=>{if(this.isOpen)e.stopImmediatePropagation()},true)}
}
