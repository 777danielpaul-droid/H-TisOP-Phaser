// Sound-Zuordnung (Treffer, Schwung, Block, Wand, Bewegung, K.O.) mit Mock-Audio: node tests/sfx.test.js
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
import{Game}from'../src/core/game.js';import{Fighter}from'../src/core/fighter.js';import{InputBuffer}from'../src/core/input.js';import{CHARACTERS}from'../src/core/characters.js';
import{BASE_MOVES}from'../src/core/moves.js';import{strike,hitSounds,swingSound,comboStep}from'../src/core/sfx.js';
import{GROUND,WALL_R}from'../src/core/config.js';
const ok=n=>console.log('  ✓',n),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const names=l=>l.map(x=>x[0]);
// 1) Alle verwendeten Sounds existieren als Datei in /sfx
{const used=new Set();const add=l=>l.forEach(x=>used.add(x[0]));
 for(const k in BASE_MOVES){const m=BASE_MOVES[k];if(!m.box)continue;add([swingSound(m)]);add(hitSounds(m,{}));add(hitSounds(m,{launch:true}))}
 add(hitSounds({dmg:70,multi:4,super:true,anim:'special'},{launch:true}));add(hitSounds({dmg:70},{proj:true}));add(hitSounds({dmg:30},{proj:true}));
 for(const n of['ui_round_start','whoosh_heavy','hitstop_freeze','ko_hit','parry_clang','block_guard','dash','dodge','whiff_miss','ground_slam','body_fall','land','heavy_hit_full','heavy_hit_impact','heavy_hit_sweetener','hit_critical'])used.add(n);
 for(let h=2;h<=9;h++)used.add(comboStep(h));
 for(const n of used)assert.ok(fs.existsSync(path.join(root,'sfx',n+'.ogg')),'fehlt: sfx/'+n+'.ogg');ok(used.size+' verwendete Sounds vorhanden')}
// 2) Zuordnung Art/Stärke
assert.deepEqual(names(hitSounds(BASE_MOVES['5L'])),['punch_light']);assert.deepEqual(names(hitSounds(BASE_MOVES['5M'])),['kick_heavy']);assert.deepEqual(names(hitSounds({...BASE_MOVES['5M'],dmg:30})),['kick_light']);
assert.equal(strike(BASE_MOVES['5L']).kick,false);assert.equal(strike(BASE_MOVES['5M']).kick,true);
assert.deepEqual(names(hitSounds(BASE_MOVES['5H'])),['punch_heavy']);
assert.deepEqual(names(hitSounds(BASE_MOVES['2H'],{launch:true})),['punch_heavy','heavy_hit_impact']);
assert.ok(names(hitSounds(BASE_MOVES.super,{launch:true})).includes('heavy_hit_impact'));assert.ok(!names(hitSounds(BASE_MOVES.super,{})).includes('heavy_hit_impact'));
assert.ok(names(hitSounds(BASE_MOVES.airsp,{})).includes('kick_heavy'));assert.ok(names(hitSounds(BASE_MOVES.jH,{})).includes('heavy_hit_impact'),'harter Knockdown mit Impact');
assert.equal(swingSound(BASE_MOVES['5L'])[0],'whoosh_light');assert.equal(swingSound(BASE_MOVES['5H'])[0],'whoosh_heavy');assert.equal(swingSound(BASE_MOVES['2H'])[0],'heavy_hit_whoosh');
assert.equal(comboStep(2),'combo_step_01');assert.equal(comboStep(5),'combo_step_04');assert.equal(comboStep(20),'combo_step_04');ok('Schlag/Tritt/Launcher/Hyper/Combo korrekt zugeordnet');
// 3) Im Spiel
function setup(){const i1=new InputBuffer(),i2=new InputBuffer(),log=[];
 const p1=new Fighter({char:CHARACTERS.hero,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:i2});
 const g=new Game(p1,p2);g.audio={play:(n,o)=>log.push(n)};
 const tick=(pr=[],dx=0,dy=0,pr2=[],dx2=0)=>{const fz=g.hitstop>0||g.superFlash>0;i1.feed(dx,dy,pr,fz);i2.feed(dx2,0,pr2,fz);g.step()};
 while(g.phase!=='fight')tick();log.length=0;return{g,p1,p2,tick,log}}
const until=(f,n=200)=>{let k=0;while(!f()&&k++<n);return f()};
{const{g,p1,p2,tick,log}=setup();p2.x=p1.x+70;tick(['L']);until(()=>log.some(n=>n.startsWith('punch')),60,tick);for(let k=0;k<30;k++)tick();
 assert.ok(log.includes('whoosh_light'),'Schwung '+log);assert.ok(log.includes('punch_light'),'Leichter Schlag '+log);assert.ok(log.indexOf('whoosh_light')<log.indexOf('punch_light'));ok('5L: Schwung → Treffer ('+log.join(', ')+')')}
{const{g,p1,p2,tick,log}=setup();p2.x=p1.x+70;tick(['M']);for(let k=0;k<30;k++)tick();assert.ok(log.some(n=>n.startsWith('kick')),'Tritt '+log);ok('5M: Tritt-Sound ('+log.join(', ')+')')}
{const{g,p1,p2,tick,log}=setup();p2.x=p1.x+400;tick(['H']);for(let k=0;k<40;k++)tick();assert.ok(log.includes('whoosh_heavy'),log);assert.ok(log.includes('whiff_miss'),'Fehlschlag '+log);ok('5H ins Leere: Whoosh + Fehlschlag')}
{const{g,p1,p2,tick,log}=setup();p2.x=p1.x+70;for(let k=0;k<4;k++)tick([],0,0,[],1);tick(['L'],0,0,[],1);for(let k=0;k<40;k++)tick([],0,0,[],1);assert.ok(log.includes('block_guard'),'Block '+log);assert.ok(!log.some(n=>n.startsWith('punch')),'kein Treffer-Sound beim Block');ok('Block: block_guard ('+log.join(', ')+')')}
{const{g,p1,tick,log}=setup();tick([],1);tick([],1);tick(['DASH'],1);for(let k=0;k<5;k++)tick([],1);assert.ok(log.includes('dash'),'Dash '+log);ok('Dash: dash')}
{const{g,p1,tick,log}=setup();tick(['UP']);for(let k=0;k<80;k++)tick();assert.ok(log.includes('land'),'Landung '+log);ok('Sprung-Landung: land')}
{const{g,p1,p2,tick,log}=setup();g.startSuper(p1);g.knockout(p2,p1);assert.ok(log.includes('heavy_hit_impact')&&log.includes('ko_hit'));ok('Hyper-Freeze + K.O.')}
{const{g,p2,log}=setup(),A=g.arena;p2.x=A.r;A.hitWall(g,p2,1e6);assert.ok(log.includes('heavy_hit_impact')&&log.includes('ground_slam'),log);log.length=0;p2.x=A.r;A.hitWall(g,p2,1);assert.ok(log.includes('body_fall'));ok('Wand: Bruch + Aufprall')}
{const{g,p1,p2,tick,log}=setup();p2.y=GROUND-60;p2.vy=8;p2.state='tumble';p2.hard=true;until(()=>p2.state==='knockdown',60,()=>g.simulate(false));while(p2.state!=='knockdown'&&p2.y<GROUND)g.simulate(false);assert.ok(log.includes('ground_slam'),log);ok('Harter Knockdown: ground_slam')}
// 4) Ohne Audio (headless) läuft alles ohne Fehler
{const i1=new InputBuffer(),i2=new InputBuffer(),g=new Game(new Fighter({char:CHARACTERS.hero,x:340,facing:1,input:i1}),new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:i2}));
 for(let k=0;k<400;k++){i1.feed(0,0,k%30===10?['M']:[],false);i2.feed(0,0,[],false);g.step()}ok('ohne game.audio: keine Fehler')}
console.log('Sound-Tests bestanden');
