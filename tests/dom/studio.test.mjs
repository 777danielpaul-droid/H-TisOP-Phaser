// UI-Test des Editors für die eigene Figur (simulierter Browser). Einmalig: cd tests/dom && npm i jsdom canvas fake-indexeddb ; dann: node studio.test.mjs
import {JSDOM} from 'jsdom';
import {createCanvas, loadImage, Image as NImage} from 'canvas';
import 'fake-indexeddb/auto';
const dom=new JSDOM('<!doctype html><body><canvas id="game"></canvas></body>',{pretendToBeVisual:true,url:'http://localhost/'});
const w=dom.window;
Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
Object.assign(globalThis,{window:w,document:w.document,requestAnimationFrame:w.requestAnimationFrame.bind(w),cancelAnimationFrame:w.cancelAnimationFrame.bind(w),
 Image:w.Image,addEventListener:w.addEventListener.bind(w),alert:m=>console.log('ALERT:',m),confirm:()=>true,File:w.File,Blob:w.Blob,Event:w.Event});
w.HTMLImageElement.prototype.decode=()=>Promise.resolve();
w.URL.createObjectURL=()=>'blob:test';w.URL.revokeObjectURL=()=>{};globalThis.URL.createObjectURL=()=>'blob:test';globalThis.URL.revokeObjectURL=()=>{};
globalThis.createImageBitmap=async f=>{const buf=Buffer.from(await f.arrayBuffer());const img=await loadImage(buf);img.close=()=>{};return img};
// Test-Sheets: grüner Hintergrund, in jeder Zelle ein „Kämpfer“ (Körper + Kopf + Arm bei Zelle 3)
function mkSheet(cols,rows,cw,ch){const c=createCanvas(cols*cw,rows*ch),g=c.getContext('2d');g.fillStyle='#00ff00';g.fillRect(0,0,c.width,c.height);
 for(let i=0;i<cols*rows;i++){const cx=(i%cols)*cw+cw/2+(i*7%30-15),b=Math.floor(i/cols)*ch+ch-60;g.fillStyle='#2a5bd7';g.fillRect(cx-60,b-330,120,330);g.fillStyle='#e8e8ff';g.beginPath();g.arc(cx,b-370,45,0,7);g.fill();
  if(i===2||i===3){g.fillStyle='#2a5bd7';g.fillRect(cx+60,b-290,170+i*20,40)}}
 return c.toBuffer('image/png')}
const F=(n,buf)=>new w.File([buf],n,{type:'image/png'});
const idle=F('Tiger_idle_1.png',mkSheet(3,2,800,800)),punch=F('punch.png',mkSheet(3,2,800,800)),bad=F('foto.png',mkSheet(3,2,200,200));
const S=await import(new URL('../../src/render/customstudio.js',import.meta.url));
const C=await import(new URL('../../src/core/characters.js',import.meta.url));
let done=null;S.studioOpen(r=>{done=r});
const m=document.getElementById('studio');
const ok=(c,msg)=>{if(!c){console.error('FAIL:',msg);process.exitCode=1}else console.log('ok  ',msg)};
ok(m&&!m.classList.contains('hidden')&&S.studioIsOpen(),'Editor offen');
ok(m.querySelectorAll('.st-row').length===19,'19 Slots');
// Drop mehrerer Dateien (Name wird automatisch zugeordnet; „foto.png“ nicht)
const drop=m.querySelector('#st-drop'),ev=new w.Event('drop',{bubbles:true,cancelable:true});ev.dataTransfer={files:[idle,punch,bad]};drop.dispatchEvent(ev);
const wait=async(fn,ms=30000)=>{const t=Date.now();while(Date.now()-t<ms){if(fn())return true;await new Promise(r=>setTimeout(r,100))}return false};
const stOf=k=>[...m.querySelectorAll('.st-row')].find(r=>r.querySelector('b').textContent===k).querySelector('.st-s').textContent;
await wait(()=>m.querySelectorAll('#st-anim option').length>0&&/^(✓|⚠|✖)/.test(stOf('Leichter Schlag')));
console.log('Idle:',stOf('Idle – Teil 1'),'| Schlag:',stOf('Leichter Schlag'));
ok(/^(✓|⚠)/.test(stOf('Idle – Teil 1')),'Idle-Sheet verarbeitet');ok(/^(✓|⚠)/.test(stOf('Leichter Schlag')),'Schlag-Sheet verarbeitet');
console.log('Report:',m.querySelector('#st-report').textContent.replace(/\s+/g,' ').slice(0,300));
ok(/foto\.png/.test(m.querySelector('#st-report').textContent),'unbekannter Dateiname gemeldet');
const opts=[...m.querySelectorAll('#st-anim option')].map(o=>o.textContent);console.log('Animationen:',opts.join(', '));
ok(opts.includes('Idle')&&opts.includes('Schlag')&&opts.some(o=>/Behelf/.test(o)),'Auswahl mit echten Animationen + Behelfen');
// Preview zeichnet etwas
const pv=m.querySelector('#st-prev');await new Promise(r=>setTimeout(r,300));const pd=pv.getContext('2d').getImageData(0,0,pv.width,pv.height).data;let lit=0;for(let i=0;i<pd.length;i+=4)if(pd[i+2]>150&&pd[i]<90)lit++;ok(lit>500,'Vorschau zeigt die Figur ('+lit+' px)');
// Werte setzen und speichern
m.querySelector('#st-name').value='rex';m.querySelector('#st-tpl').value='tiger';const hp=m.querySelector('#st-hp');hp.value='1150';
m.querySelector('#st-fight').click();
await wait(()=>done&&done.saved);
ok(done&&done.saved&&done.fight,'Speichern & kämpfen meldet zurück');ok(!S.studioIsOpen(),'Editor geschlossen');
const ch=C.CHARACTERS.custom;ok(ch&&ch.name==='REX'&&ch.hp===1150&&ch.sprites==='custom'&&ch.mods===C.CHARACTERS.tiger.mods,'Figur registriert (Name, HP, Tiger-Moves)');
const sp=window.__SPRITES__.custom,M=sp.meta;ok(M&&M.standH===300,'Sprite-Meta da');
let bad2=0;for(const [k,a] of Object.entries(M.anims))for(const n of a.frames)if(!M.frames[n])bad2++;ok(bad2===0,'alle Animations-Frames im Atlas ('+Object.keys(M.anims).length+' Anims, '+Object.keys(M.frames).length+' Frames)');
let inside=Object.values(M.frames).every(f=>f.x+f.w<=4096&&f.w>0&&f.h>0);ok(inside,'Frames liegen im Atlas');
ok(M.anims.idle.frames.length===6&&M.anims.punch.frames.length===5,'Idle 6 Frames, Schlag 5 Frames');
// Persistenz
delete C.CHARACTERS.custom;const loaded=await S.studioLoadSaved();ok(loaded&&C.CHARACTERS.custom&&C.CHARACTERS.custom.name==='REX','aus IndexedDB wiedergeladen');
// Erneut öffnen: Slots als gespeichert, Löschen sichtbar
S.studioOpen(()=>{});ok(/^✓/.test(stOf('Idle – Teil 1')),'Slot zeigt vorhandenes Sheet');ok(!m.querySelector('#st-del').hidden,'Löschen-Knopf sichtbar');
// Löschen
let d2=null;S.studioOpen(r=>{d2=r});m.querySelector('#st-del').click();await wait(()=>d2&&d2.deleted);ok(d2&&d2.deleted&&!C.CHARACTERS.custom,'Figur gelöscht');
process.exit(process.exitCode||0);
