// Anubis (Endgegner): Sprite-Frames vorhanden, Moveset vollständig, KI-Kampf läuft, Freischalt-Speicher. node tests/anubis.test.js
import assert from'node:assert/strict';
import fs from'node:fs';
import{Game}from'../src/core/game.js';
import{Fighter}from'../src/core/fighter.js';
import{InputBuffer}from'../src/core/input.js';
import{AIController}from'../src/core/ai.js';
import{Arcade}from'../src/core/arcade.js';
import{CHARACTERS,BOSS}from'../src/core/characters.js';
import{SPRITE_CHARS}from'../src/render/sprites.js';
const ok=n=>console.log('  ✓',n);
// 1) Jede Frame-Referenz der Animationen existiert im Atlas
const meta=JSON.parse(fs.readFileSync(new URL('../assets/anubis/meta.json',import.meta.url),'utf8')).frames,C=SPRITE_CHARS.anubis;
assert.ok(C&&CHARACTERS.anubis&&CHARACTERS.anubis.sprites==='anubis'&&BOSS==='anubis');
for(const[an,def]of Object.entries(C.anims))for(const f of def.frames)assert.ok(meta[f],`Anim ${an}: Frame ${f} fehlt im Atlas`);
for(const f of C.lie)assert.ok(meta[f],'Liegeframe '+f);
for(const an of['idle','walk','crouch','air','dash','punch','kick','heavy','special','hit','airhit','block','kd','wakeup','hyper','win','defeat'])assert.ok(C.anims[an],'Anim '+an);
ok('Anubis: alle '+Object.keys(C.anims).length+' Animationen verweisen auf vorhandene Atlas-Frames');
// 2) Moveset: alle 7 Specials + Hyper vorhanden
for(const k of['fireball','rising','rush','back','airsp','6M','6H','super']){assert.ok(CHARACTERS.anubis.mods[k]&&CHARACTERS.anubis.mods[k].label,'Move '+k)}
ok('Anubis: 7 Specials + Hyper');
// 3) Anubis (KI Stufe 2) gegen passiven Spieler: besiegt ihn in angemessener Zeit, ohne Fehler
{const i1=new InputBuffer(),ai=new AIController(2),p1=new Fighter({char:CHARACTERS.tiger,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.anubis,x:620,facing:-1,input:ai});
 const g=new Game(p1,p2);new Arcade(g,p1,p2,ai);let n=0;while(g.phase!=='match'&&n++<30000)g.step();assert.ok(p2.wins>=2&&p1.hp<=p1.maxHp,'Anubis gewinnt gegen passiven Gegner');assert.equal(p2.maxHp,1150)}
ok('Anubis: KI-Kampf läuft durch, 1150 HP');
// 4) Spielbar ohne KI: Hoch+Special etc. werfen keine Fehler (alle Moves einmal auslösen)
{const i1=new InputBuffer(),p1=new Fighter({char:CHARACTERS.anubis,x:340,facing:1,input:i1}),p2=new Fighter({char:CHARACTERS.tiger,x:620,facing:-1,input:new InputBuffer()});
 const g=new Game(p1,p2);new Arcade(g,p1,p2,new AIController(0));for(let i=0;i<120&&g.phase!=='fight';i++)g.step();
 for(const b of['L','M','H','S'])for(const dy of[0,-1,1]){i1.dx=0;i1.dy=dy;i1.buf.push({b,age:0});for(let k=0;k<60;k++)g.step()}}
ok('Anubis: alle Tasten/Richtungen lösen Moves ohne Fehler aus');
console.log('Anubis-Tests bestanden');
