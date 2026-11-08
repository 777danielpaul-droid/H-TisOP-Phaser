// Hintergrundmusik (render/audio.js) mit Mock-AudioContext: Track-Wechsel, Crossfade, kein Neustart bei gleichem Track, Warten auf Decode.  node tests/music.test.js
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const ok=n=>console.log('  ✓',n),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// 0) Dateien vorhanden
for(const n of['menu','fight'])assert.ok(fs.existsSync(path.join(root,'music',n+'.ogg')),'fehlt: music/'+n+'.ogg');ok('music/menu.ogg + music/fight.ogg vorhanden');
// Mock
const started=[];let pending=[];
const param=()=>({value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),type:''});
class AC{constructor(){this.currentTime=0;this.state='running';this.destination={}}
 createGain(){return node()}createDynamicsCompressor(){return node()}createBiquadFilter(){return node()}
 createBufferSource(){const s={...node(),buffer:null,loop:false,playbackRate:param(),stopped:false,start(){started.push(s)},stop(){s.stopped=true}};return s}
 decodeAudioData(u,okf){pending.push(()=>okf({tag:'buf'+u.length}));return Promise.resolve()}
 resume(){this.state='running'}suspend(){this.state='suspended'}}
globalThis.window={AudioContext:AC,__SFX__:{x:'data:audio/ogg;base64,AAAA'},__MUSIC__:{menu:'data:audio/ogg;base64,AAAAAAAA',fight:'data:audio/ogg;base64,AAAAAAAAAAAA'}};
globalThis.performance=globalThis.performance||{now:()=>Date.now()};
const{Sound}=await import('../src/render/audio.js');
const flush=()=>{const p=pending;pending=[];p.forEach(f=>f())};
{const s=new Sound();s.music('menu');assert.equal(started.length,0,'vor Unlock keine Wiedergabe');
 s.unlock();assert.equal(started.length,0,'vor Decode keine Wiedergabe');flush();
 assert.equal(started.length,1,'nach Decode startet Menü-Musik');assert.equal(s.cur,'menu');assert.equal(started[0].loop,true,'Loop');ok('Menü-Track startet erst nach Unlock + Decode, als Loop')}
{started.length=0;pending=[];const s=new Sound();s.unlock();flush();s.music('menu');const n1=started.length;s.music('menu');s.music('menu');assert.equal(started.length,n1,'gleicher Track: kein Neustart');
 s.music('fight');assert.equal(started.length,n1+1,'Wechsel startet neuen Track');assert.equal(s.cur,'fight');assert.ok(started[n1-1].stopped,'alter Track wird ausgeblendet/gestoppt');
 s.music('fight');assert.equal(started.length,n1+1);s.music('menu');assert.equal(started.length,n1+2);ok('Wechsel Menü↔Kampf per Crossfade, gleicher Track läuft durch')}
{started.length=0;pending=[];const s=new Sound();s.unlock();s.music('fight');assert.equal(started.length,0);flush();assert.equal(started.length,1);assert.equal(s.cur,'fight');ok('Track, der noch dekodiert wird, startet sobald fertig')}
{const s=new Sound();s.unlock();flush();s.setMuted(true);assert.equal(s.mbus.gain.value,0,'Stumm gilt auch für Musik');s.setMuted(false);s.setVolume(.5);assert.equal(s.mbus.gain.value,.5);ok('Stumm/Lautstärke wirken auch auf die Musik')}
{const s=new Sound();s.unlock();flush();s.music('menu');s.suspend();assert.equal(s.ctx.state,'suspended');s.resume();assert.equal(s.ctx.state,'running');ok('suspend/resume (Tab-Wechsel)')}
{const s=new Sound();s.unlock();flush();s.setVolume(.8);s.setMusicVolume(.5);assert.equal(s.mbus.gain.value,.4);assert.equal(s.master.gain.value,.8,'Effekte unberührt');
 s.setMusicMuted(true);assert.equal(s.mbus.gain.value,0);assert.equal(s.master.gain.value,.8,'Musik aus, Effekte weiter an');
 s.setMusicMuted(false);assert.equal(s.mbus.gain.value,.4);s.setMuted(true);assert.equal(s.master.gain.value,0);assert.equal(s.mbus.gain.value,0);ok('Musik-Schalter/-Regler getrennt von den Effekten')}
{const s=new Sound();s.unlock();flush();s.setVolume(1);s.setMusicVolume(2);assert.equal(s.mbus.gain.value,2);s.setMusicVolume(5);assert.equal(s.mvol,2,'max 200 %');ok('Musik-Regler geht bis 200 %')}
