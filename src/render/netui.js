// Online-Lobby (DOM-Overlay über dem Spiel) + Statusleiste im Kampf. Kennt keine Netzwerk-Details: liest Zustand über ctx(), meldet Klicks über act().
//   ctx() -> { client, match, busy }            (NetClient / NetMatch aus core/, busy = Verbindung wird aufgebaut)
//   act(name, arg)                                quick | host | join(code) | cancel | close | leave | pickChar(id) | skin | ready | start(stageIndex|-1)
//   cat -> { chars():[{id,name,desc}], skins(id):[{i,name,owned}], skinOf(id), stages():[{i,name,open}] }
const NT_ERR={nourl:'Online geht nur, wenn du das Spiel über die Server-Adresse öffnest (z. B. die Render-Adresse oder http://localhost:3000) – nicht per Doppelklick auf die Datei.',
 timeout:'Der Server antwortet nicht. Beim ersten Mal braucht der Gratis-Server bis zu einer Minute zum Aufwachen – bitte nochmal versuchen.',closed:'Keine Verbindung zum Server.',
 noroom:'Diesen Raum gibt es nicht (mehr). Code prüfen?',taken:'In diesem Raum ist schon jemand.',busy:'Du bist schon in einem Raum oder in der Suche.',full:'Der Server ist gerade voll – bitte gleich nochmal.'};
const NT_END={'peer-left':'Dein Gegner hat das Spiel verlassen.','disconnected':'Die Verbindung wurde getrennt.','desync':'Die beiden Spiele sind auseinandergelaufen (Desync). Bitte nochmal starten – falls das öfter passiert: beide Seiten sollten dieselbe Spiel-Version nutzen.','timeout':'Der Gegner hat sich zu lange nicht gemeldet.','left':''};
const ntEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const netMessage=(code)=>NT_ERR[code]||NT_END[code]||'';
export class NetUi{
 constructor(o){this.o=o;this.el=document.getElementById('net');this.body=document.getElementById('nt-body');this.bar=document.getElementById('netbar');this.isOpen=false;this.key='';this.msg='';this.bad=false;this.stage=0;this.barKey=''}
 mount(){if(!this.el)return;
  this.el.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||b.disabled)return;this.click(b.dataset.k,b.dataset.v,b)});
  this.el.addEventListener('keydown',e=>{if(!this.isOpen)return;if(e.code==='Escape'){e.preventDefault();e.stopPropagation();this.o.act(this.key==='pick'?'leave':this.key==='menu'?'close':'cancel')}
   else if(e.code==='Enter'&&e.target&&e.target.id==='nt-code'){e.preventDefault();this.click('join')}
   e.stopPropagation()},true)}
 open(msg,bad){this.msg=msg||'';this.bad=!!bad;this.isOpen=true;this.key='';if(this.el)this.el.classList.remove('hidden');this.render()}
 close(){this.isOpen=false;this.key='';if(this.el)this.el.classList.add('hidden')}
 say(msg,bad){this.msg=msg||'';this.bad=!!bad;const m=document.getElementById('nt-msg');if(m){m.textContent=this.msg;m.classList.toggle('bad',this.bad)}}
 click(k,v,b){const o=this.o;switch(k){
  case'quick':case'host':case'cancel':case'close':case'leave':case'ready':case'skin':o.act(k);break;
  case'join':{const i=document.getElementById('nt-code');o.act('join',i?i.value:'');break}
  case'pickChar':o.act('pickChar',v);break;
  case'stage':this.stage=+v;this.render();break;
  case'start':o.act('start',this.stage);break;
  case'copy':{const i=document.getElementById('nt-link');if(i){i.select();try{navigator.clipboard.writeText(i.value).then(()=>{if(b)b.textContent='KOPIERT ✔'},()=>{document.execCommand&&document.execCommand('copy')})}catch(e){try{document.execCommand('copy');if(b)b.textContent='KOPIERT ✔'}catch(_){}}}break}}}
 // Welcher Bildschirm? Nur neu aufbauen, wenn er wechselt (sonst Eingabefeld/Fokus weg); sonst Bestandteile gezielt aktualisieren
 screen(){const{client,match,busy}=this.o.ctx();
  if(match&&match.phase==='pick')return'pick';if(client&&client.state==='hosting')return'host';if(client&&client.state==='queued')return'queue';if(busy)return'connecting';return'menu'}
 render(){if(!this.isOpen||!this.body)return;const{client,match}=this.o.ctx(),key=this.screen();
  if(key==='pick'){const f=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.k+'|'+(document.activeElement.dataset.v||''):'';
   this.body.innerHTML=this.pick(match);this.key=key;if(f){const el=[...this.body.querySelectorAll('[data-k]')].find(x=>x.dataset.k+'|'+(x.dataset.v||'')===f);if(el)el.focus()}return}
  if(key===this.key){this.patch(client,match);return}
  this.key=key;let h='';
  if(key==='menu')h=`<p class="nt-sub">Kämpfe über das Internet gegen einen Freund – jeder an seinem eigenen Gerät.</p>
   <div class="nt-menu"><button class="primary" data-k="quick">Schnellsuche</button><small>trifft automatisch auf jemanden, der gerade auch sucht</small>
   <button data-k="host">Raum erstellen</button><small>du bekommst einen Code (und Link) für deinen Freund</small>
   <div class="nt-join"><input id="nt-code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" spellcheck="false"><button data-k="join">Raum beitreten</button></div></div>
   <p id="nt-msg" class="nt-msg"></p><div class="nt-foot"><button data-k="close">Zurück</button></div>`;
  else if(key==='connecting')h=`<p class="nt-wait">Verbinde mit dem Server<span class="dots"></span></p><p class="nt-sub">Beim ersten Mal kann das bis zu einer Minute dauern (der Gratis-Server wacht erst auf).</p><p id="nt-msg" class="nt-msg"></p><div class="nt-foot"><button data-k="cancel">Abbrechen</button></div>`;
  else if(key==='queue')h=`<p class="nt-wait">Suche einen Gegner<span class="dots"></span></p><p class="nt-sub">Sobald jemand anderes „Schnellsuche“ drückt, geht es los.</p><div class="nt-foot"><button data-k="cancel">Abbrechen</button></div>`;
  else if(key==='host'){const link=this.link(client.code);
   h=`<p class="nt-sub">Gib deinem Freund diesen Code – oder schick ihm den Link:</p><div class="nt-code">${ntEsc(client.code||'')}</div>
   <div class="nt-linkrow"><input id="nt-link" readonly value="${ntEsc(link)}"><button data-k="copy">Link kopieren</button></div>
   <p class="nt-wait">Warte auf Mitspieler<span class="dots"></span></p><div class="nt-foot"><button data-k="cancel">Raum schließen</button></div>`}
  this.body.innerHTML=h;this.patch(client,match);
  const first=this.body.querySelector(key==='menu'?'[data-k=quick]':'button');if(first&&key!=='connecting')try{first.focus()}catch(e){}}
 patch(){const m=document.getElementById('nt-msg');if(m){m.textContent=this.msg;m.classList.toggle('bad',this.bad)}}
 link(code){try{const u=new URL(location.href);u.search='?room='+code;u.hash='';return u.toString()}catch(e){return code}}
 pick(match){const o=this.o,cat=o.cat,me=match.me,th=match.them,host=match.host,both=match.me.ready&&match.them.ready;
  const chars=cat.chars().map(c=>`<button data-k="pickChar" data-v="${ntEsc(c.id)}" class="${me.id===c.id?'on':''}" title="${ntEsc(c.desc||'')}">${ntEsc(c.name)}</button>`).join('');
  const sk=me.id?cat.skins(me.id):[],skn=sk.find(s=>s.i===me.skin),skinBtn=sk.length>1?`<button data-k="skin">Farbe: ${ntEsc(skn?skn.name:'–')}</button>`:'';
  const nm=id=>{const c=cat.chars().find(x=>x.id===id);return c?c.name:id};
  const ping=match.rtt?Math.round(match.rtt)+' ms':'…';
  let stage='';
  if(both&&host){stage=`<div class="nt-stage"><h2>STAGE</h2><div class="nt-stages">${cat.stages().map(s=>`<button data-k="stage" data-v="${s.i}" class="${this.stage===s.i?'on':''}" ${s.open?'':'disabled'}>${ntEsc(s.name)}${s.open?'':' 🔒'}</button>`).join('')}<button data-k="stage" data-v="-1" class="${this.stage===-1?'on':''}">ZUFALL</button></div><button class="primary nt-go" data-k="start">KAMPF STARTEN</button></div>`}
  else if(both)stage=`<div class="nt-stage"><p class="nt-wait">Der Gastgeber wählt die Stage<span class="dots"></span></p></div>`;
  return `<div class="nt-top">VERBUNDEN · PING <b>${ping}</b> · DU BIST <b>SPIELER ${host?1:2}</b> (${host?'links':'rechts'}) · ${host?'DU WÄHLST DIE STAGE':'DER GASTGEBER WÄHLT DIE STAGE'}</div>
   <div class="nt-cols"><div class="nt-col"><h2>DU</h2><div class="nt-chars">${chars}</div><div class="nt-actions">${skinBtn}<button class="${me.ready?'on':'primary'}" data-k="ready" ${me.id?'':'disabled'}>${me.ready?'✔ BEREIT (nochmal klicken = ändern)':'BEREIT'}</button></div></div>
   <div class="nt-col they"><h2>GEGNER</h2><div class="nt-them ${th.ready?'rdy':''}">${th.id?`<b>${ntEsc(nm(th.id))}</b><span>${th.ready?'✔ BEREIT':'wählt …'}</span>`:'<span>wählt …</span>'}</div></div></div>
   ${stage}<p id="nt-msg" class="nt-msg"></p><div class="nt-foot"><button data-k="leave">Verlassen</button></div>`}
 // ---- Statusleiste (oben, klein) und große Hinweise in der Mitte, solange der Kampf läuft ----
 setBar(top,mid,cls){if(!this.bar)return;const k=top+'|'+mid+'|'+cls;if(k===this.barKey)return;this.barKey=k;
  this.bar.classList.toggle('hidden',!top&&!mid);this.bar.className=(!top&&!mid?'hidden ':'')+(cls||'');
  this.bar.innerHTML=(top?`<div class="nb-top">${top}</div>`:'')+(mid?`<div class="nb-mid">${mid}</div>`:'')}
}
