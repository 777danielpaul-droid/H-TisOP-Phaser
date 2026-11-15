// Eigene Playlists (render/audio.js) mit Mock-AudioContext + Mock-<audio>: Ersatz der eingebauten Musik, Weiterschalten, Fehler-Fallback, Fortsetzen.  node tests/playlist.test.js
import assert from'node:assert/strict';
const ok=n=>console.log('  ✓',n);
let pending=[],srcs=[];
const param=()=>({value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),Q:param(),type:''});
class AC{constructor(){this.currentTime=0;this.state='running';this.destination={}}
 createGain(){return node()}createDynamicsCompressor(){return node()}createBiquadFilter(){return node()}
 createBufferSource(){const s={...node(),buffer:null,loop:false,playbackRate:param(),start(){},stop(){}};return s}
 createMediaElementSource(a){srcs.push(a);return node()}
 decodeAudioData(u,okf){pending.push(()=>okf({}));return Promise.resolve()}resume(){this.state='running'}suspend(){this.state='suspended'}}
const auds=[];
class Audio{constructor(){this.paused=true;this.src='';this.loop=false;this.plays=0;auds.push(this)}play(){this.paused=false;this.plays++;return Promise.resolve()}pause(){this.paused=true}removeAttribute(){this.src=''}load(){}}
globalThis.window={AudioContext:AC,__SFX__:{x:'data:audio/ogg;base64,AAAA'},__MUSIC__:{menu:'data:audio/ogg;base64,AAAAAAAA',fight:'data:audio/ogg;base64,AAAAAAAAAAAA'}};
globalThis.Audio=Audio;globalThis.performance=globalThis.performance||{now:()=>Date.now()};
const{Sound}=await import('../src/render/audio.js');
const flush=()=>{const p=pending;pending=[];p.forEach(f=>f())};
const L=n=>Array.from({length:n},(_,i)=>({name:'t'+i,url:'blob:t'+i}));
const mk=()=>{const s=new Sound();s.unlock();flush();return s};
{const s=mk();s.setPlaylist('menu',L(3),true,false);s.music('menu');assert.equal(s.cur,'pl:menu','Playlist ersetzt eingebaute Menü-Musik');const a=s.pl.menu.a;assert.equal(a.src,'blob:t0');assert.equal(a.paused,false);ok('Menü-Playlist läuft statt der Original-Musik')}
{const s=mk();s.setPlaylist('menu',L(3),true,false);s.music('fight');assert.equal(s.cur,'fight','Kampf ohne eigene Playlist = Original');s.music('menu');assert.equal(s.cur,'pl:menu');ok('je Bereich getrennt (Kampf bleibt Original, wenn dort keine Playlist ist)')}
{const s=mk();s.setPlaylist('fight',L(3),true,false);s.music('fight');const a=s.pl.fight.a;a.onended();assert.equal(a.src,'blob:t1');a.onended();a.onended();assert.equal(a.src,'blob:t0','nach dem letzten Lied wieder von vorn');ok('Lieder laufen der Reihe nach, danach Wiederholung')}
{const s=mk();s.setPlaylist('fight',L(1),true,false);s.music('fight');assert.equal(s.pl.fight.a.loop,true);ok('ein einzelnes Lied läuft in Dauerschleife')}
{const s=mk();s.setPlaylist('fight',L(8),true,true);s.music('fight');const seen=new Set([s.pl.fight.a.src]);for(let i=0;i<7;i++){s.pl.fight.a.onended();seen.add(s.pl.fight.a.src)}assert.equal(seen.size,8,'Shuffle spielt jedes Lied genau einmal pro Runde');ok('zufällige Reihenfolge: jedes Lied einmal pro Runde')}
{const s=mk();s.setPlaylist('menu',L(2),false,false);s.music('menu');assert.equal(s.cur,'menu','ausgeschaltet = Original');s.setPlaylist('menu',L(2),true,false);assert.equal(s.cur,'pl:menu','Einschalten wirkt sofort');s.setPlaylist('menu',[],true,false);assert.equal(s.cur,'menu','leere Playlist = Original');ok('An/Aus/leer schaltet live zwischen Playlist und Original')}
{const s=mk();s.setPlaylist('menu',L(3),true,false);s.music('menu');const a=s.pl.menu.a;a.onended();a.currentTime=42;s.music('fight');assert.equal(s.cur,'fight');s.music('menu');assert.equal(a.src,'blob:t1','Menü-Playlist macht beim Zurückkommen am selben Lied weiter');ok('Wechsel Menü ↔ Kampf: Playlist läuft am selben Lied weiter')}
{const s=mk();s.setPlaylist('menu',L(3),true,false);s.music('menu');const a=s.pl.menu.a;a.onerror();assert.equal(a.src,'blob:t1','kaputtes Lied wird übersprungen');a.onerror();a.onerror();assert.equal(s.cur,'menu','alle Lieder kaputt = Original-Musik');ok('nicht abspielbare Lieder werden übersprungen, sonst Rückfall auf Original')}
{const s=mk();s.setPlaylist('menu',L(3),true,false);s.music('menu');assert.equal(s.plNow('menu'),0);s.pl.menu.a.onended();assert.equal(s.plNow('menu'),1);ok('plNow meldet das laufende Lied')}
{const s=mk();s.setPlaylist('menu',L(2),true,false);s.music('menu');const a=s.pl.menu.a;s.suspend();assert.equal(a.paused,true,'Tab im Hintergrund: Lied pausiert');s.resume();assert.equal(a.paused,false);ok('suspend/resume pausiert und setzt die Playlist fort')}
{const s=new Sound();s.setPlaylist('menu',L(2),true,false);s.music('menu');s.unlock();flush();assert.equal(s.cur,'pl:menu');ok('Playlist vor dem Unlock gesetzt startet nach der ersten Eingabe')}
console.log('playlist.test.js OK');
