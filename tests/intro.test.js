// Intro-Video: Beim Beenden darf das Poster (Standbild des 1. Frames) nicht wieder aufblitzen. node tests/intro.test.js
import assert from'node:assert/strict';
import{Intro}from'../src/render/intro.js';
const log=[];const attrs={poster:'x',src:'blob:y'};
const v={paused:false,currentTime:1,pause(){this.paused=true},removeAttribute(k){log.push('rm:'+k);delete attrs[k]},load(){log.push('load')},play(){return Promise.resolve()}};
const cl=new Set(),root={classList:{add:c=>cl.add(c),remove:c=>cl.delete(c),toggle(){}},querySelector:q=>q==='video'?v:null};
globalThis.document={getElementById:()=>root};globalThis.window={__INTRO__:'data:video/mp4;base64,AAAA',__INTRO_POSTER__:'p'};globalThis.URL.createObjectURL=()=>'blob:y';
let done=0;const i=new Intro(()=>done++);i.start();assert.ok(i.active);
v.onplaying();assert.ok(!('poster'in attrs),'Poster verschwindet, sobald das Video läuft');
attrs.poster='x';log.length=0;i.finish();
assert.equal(done,1);assert.ok(cl.has('out'));assert.deepEqual(log,[],'beim Ausblenden wird das Video NICHT zurückgesetzt (sonst Poster-Flackern)');
await new Promise(r=>setTimeout(r,420));
assert.ok(cl.has('hidden'));assert.ok(log.includes('load')&&log.includes('rm:poster'),'erst nach dem Ausblenden zurücksetzen');
console.log('  ✓ Intro: kein Poster-Aufblitzen beim Übergang\nIntro-Tests bestanden');
