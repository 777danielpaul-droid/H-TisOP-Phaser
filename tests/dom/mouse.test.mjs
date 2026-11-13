import {JSDOM} from 'jsdom';import {loadImage} from 'canvas';import fakeIDB from 'fake-indexeddb';import fs from 'node:fs';
const html=fs.readFileSync('/home/claude/hitisop/dist/hitisop.html','utf8');
const errors=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){
 w.indexedDB=fakeIDB.indexedDB||fakeIDB;w.HTMLImageElement.prototype.decode=()=>Promise.resolve();w.URL.createObjectURL=()=>'blob:t';w.URL.revokeObjectURL=()=>{};
 w.createImageBitmap=async f=>{const img=await loadImage(Buffer.from(await f.arrayBuffer()));img.close=()=>{};return img};w.alert=m=>errors.push('ALERT '+m);w.confirm=()=>true;
 w.addEventListener('error',e=>errors.push('ERR '+e.message));w.HTMLCanvasElement.prototype.focus=()=>{};
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};}});
const w=dom.window,d=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)process.exitCode=1};
await sleep(1000);
const cv=d.getElementById('screen');cv.getBoundingClientRect=()=>({left:0,top:0,width:960,height:540});
const key=(code)=>w.dispatchEvent(new w.KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));
const mv=(x,y,tgt=cv)=>{const e=new w.MouseEvent('mousemove',{clientX:x,clientY:y,bubbles:true});Object.defineProperty(e,'movementX',{value:5});tgt.dispatchEvent(e)};
const click=(x,y)=>cv.dispatchEvent(new w.MouseEvent('click',{clientX:x,clientY:y,bubbles:true}));
const A=w.__arcade,R=w.__renderer;
console.log('intro active:',w.__intro.active,'state',A.state,'start hidden:',d.getElementById('start').classList.contains('hidden'));
if(w.__intro.active){key('Enter');await sleep(200)}
// Titelmenü -> Arcade starten per Klick
d.querySelector('#start [data-mode="arcade"]').click();await sleep(300);
ok(A.state==='select','Arcade-Charakterwahl erreicht');
// 1) Zeiger: sichtbar bei Bewegung, nach 2 s weg
mv(480,300);await sleep(150);
ok(d.body.classList.contains('curon')&&!d.body.classList.contains('nocur'),'Charakterwahl: Zeiger sichtbar bei Bewegung');
await sleep(2300);
ok(d.body.classList.contains('nocur'),'Charakterwahl: Zeiger nach 2 s Ruhe weg');
mv(481,301);await sleep(100);ok(!d.body.classList.contains('nocur'),'Zeiger kommt bei Bewegung wieder');
// 2) Hover-Ziel
mv(255,300);await sleep(200);ok(R.hov.want&&R.hov.want.w===156,'Hover: mittlere Figur hat Rahmen');ok(cv.style.cursor==='pointer','Hover: Zeiger = pointer');
mv(255+166,300);await sleep(200);ok(R.hov.want&&R.hov.want.w===116,'Hover: Seitenfigur');
mv(900,520);await sleep(200);ok(!R.hov.want,'Hover: leere Fläche = kein Rahmen');
mv(40,25);await sleep(200);ok(R.hov.want&&R.hov.want.h===26,'Hover: Modus-Leiste');
// 3) Klick Modus-Leiste -> 2 Spieler (3. Segment ~ x=14+318*.5..)
click(14+318/4*2+10,25);await sleep(100);ok(A.mode==='versus'&&A.pvp,'Klick auf Modus 2 Spieler');
// Stage-Rechtsklick zurück
A.vs.step=1;cv.dispatchEvent(new w.MouseEvent('contextmenu',{clientX:300,clientY:300,bubbles:true,cancelable:true}));await sleep(100);ok(A.vs.step===0,'Rechtsklick = zurück (Stage -> Figuren)');
click(14+10,25);await sleep(100);ok(A.mode==='arcade','Zurück auf Arcade');
// 4) Booster-Übersicht per Klick + Öffnen/Schließen
click(960-18-122-6-122+10,25);await sleep(150);ok(R.lootUi.open&&R.lootUi.mode==='main','Klick auf Booster-Zähler öffnet Übersicht');
mv(960/2+100,540-62+10);await sleep(200);ok(R.hov.want&&R.hov.want.w===186,'Hover: Schließen-Knopf');
click(960/2+100,540-62+10);await sleep(100);ok(!R.lootUi.open,'Klick auf Schließen');
// 5) End-Bildschirm-Knöpfe
A.state='gameover';A.t=40;await sleep(200);
ok(R.endBtns&&R.endBtns.length>=2&&R.endBtns[0].label==='NOCHMAL','Game Over: Knöpfe vorhanden');
const n=R.endBtns.length,x0=480-(n*214+(n-1)*16)/2;
mv(x0+214+16+100,540-78+15);await sleep(200);ok(R.endHot===1,'Hover auf 2. Knopf, endHot='+R.endHot);
click(x0+214+16+100,540-78+15);await sleep(150);ok(A.state==='select','Klick „Charakterwahl“ führt zur Auswahl');
cv.dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true}));
// 6) Im Kampf: kein Zeiger
d.querySelector('canvas');A.start('tiger');await sleep(400);
ok(A.state==='fight'&&!d.body.classList.contains('curon'),'Im Kampf: kein Menü-Zeiger');
ok(R.endBtns==null&&!R.hov.want,'Im Kampf: keine Hover-/End-Knöpfe');
ok(errors.length===0,'keine Laufzeitfehler: '+errors.slice(0,4).join(' | '));
process.exit(process.exitCode||0)
