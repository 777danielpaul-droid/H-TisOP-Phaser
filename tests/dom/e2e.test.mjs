// Ende-zu-Ende: gebautes Spiel (dist/hitisop.html) -> leerer Slot -> Editor -> Sheets droppen -> Speichern & kämpfen. Erst `node tools/build.mjs`, dann wie studio.test.mjs: node e2e.test.mjs
import {JSDOM} from 'jsdom';import {createCanvas,loadImage} from 'canvas';import fakeIDB from 'fake-indexeddb';import fs from 'node:fs';
const html=fs.readFileSync(new URL('../../dist/hitisop.html',import.meta.url),'utf8');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){
 w.indexedDB=fakeIDB.indexedDB||fakeIDB;w.HTMLImageElement.prototype.decode=()=>Promise.resolve();w.URL.createObjectURL=()=>'blob:t';w.URL.revokeObjectURL=()=>{};
 w.createImageBitmap=async f=>{const img=await loadImage(Buffer.from(await f.arrayBuffer()));img.close=()=>{};return img};w.alert=m=>errors.push('ALERT '+m);w.confirm=()=>true;
 w.addEventListener('error',e=>errors.push('ERR '+e.message));w.HTMLCanvasElement.prototype.focus=()=>{};}});
const w=dom.window,d=w.document;
function mkSheet(cols,rows,cw,ch){const c=createCanvas(cols*cw,rows*ch),g=c.getContext('2d');g.fillStyle='#00ff00';g.fillRect(0,0,c.width,c.height);
 for(let i=0;i<cols*rows;i++){const cx=(i%cols)*cw+cw/2,b=Math.floor(i/cols)*ch+ch-60;g.fillStyle='#d7552a';g.fillRect(cx-60,b-330,120,330);g.beginPath();g.arc(cx,b-370,45,0,7);g.fill()}return c.toBuffer('image/png')}
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),wait=async(fn,ms=20000)=>{const t=Date.now();while(Date.now()-t<ms){if(fn())return true;await sleep(100)}return false};
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1};
await sleep(800);console.log('Fehler beim Laden:',errors.slice(0,3));
const key=(code,type='keydown')=>{w.dispatchEvent(new w.KeyboardEvent(type,{code,bubbles:true,cancelable:true}))};
// Auswahl: 5 Mal nach rechts => eigener Slot; Enter => Editor
for(let i=0;i<4;i++)key('ArrowRight');key('Enter');await sleep(200);
const m=d.getElementById('studio');ok(m&&!m.classList.contains('hidden'),'Enter auf leerem Slot öffnet den Editor');
// Tippen im Namensfeld darf das Spiel nicht beeinflussen (M öffnet sonst das Menü)
const nm=m.querySelector('#st-name');nm.focus();nm.value='';nm.dispatchEvent(new w.KeyboardEvent('keydown',{code:'KeyM',bubbles:true,cancelable:true}));
ok(d.getElementById('menu').classList.contains('hidden'),'Taste M im Editor öffnet kein Pausenmenü');
// Sheets droppen
const F=(n,b)=>new w.File([b],n,{type:'image/png'});const ev=new w.Event('drop',{bubbles:true,cancelable:true});ev.dataTransfer={files:[F('idle_1.png',mkSheet(3,2,800,800)),F('walk_1.png',mkSheet(3,2,800,800))]};
m.querySelector('#st-drop').dispatchEvent(ev);await wait(()=>m.querySelectorAll('#st-anim option').length>0);
ok(m.querySelectorAll('#st-anim option').length>5,'Vorschau-Auswahl gefüllt');
nm.value='Pixel';m.querySelector('#st-fight').click();await wait(()=>m.classList.contains('hidden'));await sleep(1500);
ok(m.classList.contains('hidden'),'Editor geschlossen');
ok(w.document.getElementById('menu').classList.contains('hidden'),'Pausenmenü nicht offen (Kampf läuft)');
// Läuft der Kampf? Canvas verändert sich über die Zeit
const cv=d.querySelector('canvas');const snap=()=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
const a=snap();await sleep(1200);const b=snap();let diff=0;for(let i=0;i<a.length;i+=64)if(a[i]!==b[i])diff++;ok(diff>50,'Bild verändert sich (Kampf läuft), Diff='+diff);
// Bewegen/Schlagen mit der eigenen Figur (Fallback-Animationen) ohne Fehler
for(const c of['KeyD','KeyJ','KeyK','Space']){key(c);await sleep(60);key(c,'keyup')}await sleep(600);
ok(errors.length===0,'keine Laufzeitfehler: '+errors.slice(0,4).join(' | '));
process.exit(process.exitCode||0)
