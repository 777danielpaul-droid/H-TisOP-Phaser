// Controller (PS4/PS5/Xbox): Erkennung, Tastennamen, Menü-Navigation, Kampf-Eingabe. node tests/gamepad.test.js
import assert from'node:assert/strict';
import{readPad,padLabel,PadNav,menuKey}from'../src/core/gamepad.js';
import{KeyboardInput}from'../src/core/input.js';
const ok=m=>console.log('  ✓ '+m);
const pad=(o={})=>({index:0,connected:true,id:'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)',mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:18},(_,i)=>({pressed:(o.btn||[]).includes(i),value:0})),...o,buttons:undefined===o.buttons?Array.from({length:18},(_,i)=>({pressed:(o.btn||[]).includes(i),value:0})):o.buttons});
const setPads=v=>Object.defineProperty(globalThis,'navigator',{value:{getGamepads:()=>v},configurable:true});

{assert.equal(padLabel(pad()),'PS5-Controller');assert.equal(padLabel(pad({id:'Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)'})),'PS4-Controller');
 assert.equal(padLabel({id:'Xbox 360 Controller (045e)'}),'Xbox-Controller');ok('Beschriftung: PS5 / PS4 / Xbox')}
{const r=readPad(pad({btn:[0,3,14],axes:[0,-.9]}));assert.ok(r.down.has('cross')&&r.down.has('triangle')&&r.down.has('left'));assert.equal(r.dx,-1);assert.equal(r.dy,-1);ok('Standard-Belegung: ✕ △ Steuerkreuz, Stick')}
{const a=[0,0,0,0,0,0,0,0,0,1.28];a[9]=.71;const r=readPad(pad({mapping:'',btn:[1,0],axes:a}));assert.ok(r.down.has('cross')&&r.down.has('square'),'Quadrat/Kreuz bei roher Sony-Belegung');assert.equal(r.dx,-1);ok('Rohe Sony-Belegung (Firefox): Tasten + Hat-Steuerkreuz')}
{const n=new PadNav(),p=pad({btn:[15]});
 assert.equal(n.poll(0,[p],true).filter(e=>e.name==='right').length,1);assert.equal(n.poll(100,[p],true).length,0,'Halten: erst nach Verzögerung');
 assert.equal(n.poll(450,[p],true).length,1);assert.equal(n.poll(500,[p],true).length,0);assert.equal(n.poll(570,[p],true).length,1,'Wiederholung');
 const m=new PadNav();m.poll(0,[pad({btn:[0]})],false);assert.equal(m.poll(10,[pad({btn:[0]})],true).length,0,'beim Mitlesen gehaltene Taste löst nichts aus');ok('PadNav: Flanke, Wiederholung, Mitlesen')}
{assert.equal(menuKey('cross',{screen:'menu'}),'Enter');assert.equal(menuKey('circle',{screen:'menu'}),'Escape');assert.equal(menuKey('left',{screen:'start'}),'ArrowLeft');
 assert.equal(menuKey('cross',{screen:'fight'}),null);assert.equal(menuKey('options',{screen:'fight'}),'KeyM');
 assert.equal(menuKey('cross',{screen:'versus',who:1}),'KeyG');assert.equal(menuKey('cross',{screen:'versus',who:2}),'Enter');assert.equal(menuKey('left',{screen:'versus',who:2}),'ArrowLeft');
 assert.equal(menuKey('cross',{screen:'online',ask:false}),null);assert.equal(menuKey('cross',{screen:'online',ask:true}),'Enter');assert.equal(menuKey('options',{screen:'intro'}),'Enter');ok('Menü-Belegung je Bildschirm')}
{const kb=new KeyboardInput(null);kb.padIndex=0;
 setPads([pad({btn:[0,2,3,1,5],axes:[.9,0]})]);let s=kb.sample();assert.deepEqual(s.pressed.sort(),['H','L','M','S','SUP'].sort());assert.equal(s.dx,1);
 s=kb.sample();assert.equal(s.pressed.length,0,'gehalten = keine neue Eingabe');
 setPads([pad({btn:[0]})]);kb.syncPad();s=kb.sample();assert.equal(s.pressed.length,0,'syncPad: gehaltenes ✕ löst keinen Schlag aus');
 setPads([pad({btn:[4]}),pad({index:1,btn:[7]})]);kb.padPrev.clear();assert.deepEqual(kb.sample().pressed,['DASH']);ok('Kampf: ✕▢△○ R1 L1/R2, Flanke, syncPad')}
console.log('Gamepad-Tests bestanden');
