import{Arcade}from'./arcade.js';
import{H,W}from'./config.js';
import{MODS}from'./movesets.js';
import{Story}from'./story.js';
import{loadUnlocks,saveUnlock}from'./unlocks.js';



import{R}from'../render/sprites.js';
// Story-Modus-Gegner (Insektenkrieger): ohne Projektile; Specials sind Nahkampf (Sprungtritt, Wirbel, Sprintschlag). Nicht im Roster.
export const MANTIS_MODS={
 fireball:{label:'Sprungtritt',info:'Springender Tritt',anim:'kick',su:12,ac:6,rc:20,dmg:55,hs:24,bs:14,box:[10,-120,140,60],lunge:8,proj:undefined,glow:0},
 rising:{label:'Wirbel',info:'Drehangriff, trifft auch hinter ihm',anim:'heavy',su:9,ac:8,rc:22,dmg:60,hs:26,bs:16,box:[-90,-140,200,100],launch:null,inv:null,rise:undefined,glow:0},
 rush:{label:'Sprintschlag',info:'Stürmt vor',anim:'punch',su:8,ac:6,rc:16,dmg:50,box:[10,-124,110,60],lunge:8,glow:0},
 super:{cost:9999}};
export const ALPHA_MODS={...MANTIS_MODS,'5H':{dmg:110,box:[5,-132,140,50]},'5M':{dmg:65,box:[10,-105,120,40]}};
// Neue Kämpfer: einfach hier eintragen. Moves/Werte je Figur: movesets.js.
// Werte: hp, walk (Lauftempo), dmg (Schadensfaktor), def (erlittener Schaden: <1 = zäher), jump/dash (Faktoren), airJumps (Luft-Sprünge), meter (Meter-Gewinn),
// pros/cons = Stärken/Schwächen (Charakterwahl), ai = Werkzeuge der KI [{min,max,b,dx,dy,p}] (Abstand min..max, Taste, Richtung rel. zum Gegner, Chance). `mods` überschreibt Felder einzelner Moves (siehe moves.js).
// desc = Kurzbeschreibung für die Charakterwahl. size = Körpergröße (Hurt-/Hitboxen, Kamera).
export const CHARACTERS={
 tiger:{id:'tiger',name:'H!T',desc:'Wilder Brawler · schnell',hp:950,walk:1.22,dmg:1,def:1.05,jump:1,dash:1.3,airJumps:1,meter:1,pal:'tiger',glow:'#3fe0ff',sprites:'tiger',defeat:true,mods:MODS.tiger,
  pros:'Blitzschnelle Normals, Tempo & Dash, Teleport-Cross-up, Mehrfachtreffer',cons:'Wenig HP, kurze Reichweite, kaum Fernkampf',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.14},{min:90,max:260,b:'M',dx:1,p:.16},{min:90,max:260,b:'H',dx:1,p:.1},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 st3g0:{id:'st3g0',name:'ST3-G0',desc:'Panzer-Echse · zäh mit Schwanz-Konter',hp:1020,walk:.95,dmg:1.02,def:.95,jump:.95,dash:1.05,airJumps:1,meter:1,pal:'tiger',glow:'#7dff4a',sprites:'st3g0',defeat:true,mods:MODS.st3g0,
  pros:'Viel HP, Rüstungs-Sprint, Schwanzfeger gegen Cross-ups, solide Reichweite',cons:'Mittleres Tempo, Welle nur mittelschnell, Sprint nach Block bestrafbar',
  ai:[{min:100,max:320,b:'S',dx:-1,p:.14},{min:90,max:240,b:'M',dx:1,p:.14},{min:90,max:240,b:'H',dx:1,p:.12},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 kitsune:{id:'kitsune',name:'KITSUNE',desc:'Neunschwanz-Fuchs · Geisterfeuer & Kontertritte',hp:990,walk:1,dmg:1,def:.98,jump:1.05,dash:1,airJumps:1,meter:1,pal:'tiger',glow:'#b46bff',sprites:'kitsune',defeat:true,mods:MODS.kitsune,
  pros:'Ausgewogen, schneller Anti-Air-Kick, Schwanzpeitsche gegen Cross-ups, Geisterfeuer-Wellen',cons:'Keine Rüstung, kein Teleport, Wellen nur mittelschnell',
  ai:[{min:100,max:320,b:'S',dx:-1,p:.14},{min:90,max:250,b:'M',dx:1,p:.15},{min:90,max:250,b:'H',dx:1,p:.11},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 anubis:{id:'anubis',name:'ANUBIS',desc:'Wächter der Unterwelt · Endgegner',boss:true,hp:1150,walk:1.05,dmg:1.08,def:.93,jump:1,dash:1.1,airJumps:1,meter:1.15,pal:'tiger',glow:'#ffd45a',sprites:'anubis',defeat:true,mods:MODS.anubis,
  pros:'Viel HP, harte Normals, Seelenwellen, Schweifhieb gegen Cross-ups, Richterspruch mit Launcher',cons:'Etwas langsamere Sprünge, Richterspruch auf Block bestrafbar, keine Rüstung',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.16},{min:90,max:260,b:'M',dx:1,p:.18},{min:90,max:270,b:'H',dx:1,p:.14},{min:140,max:320,b:'S',dx:0,dy:1,p:.12}]},
 mantis:{id:'mantis',name:'MANTIS',desc:'Insektenkrieger',hp:190,walk:1,dmg:.6,def:1,jump:1,dash:1,airJumps:0,meter:.01,pal:'tiger',glow:'#7dff9a',sprites:'mantis',noSpecialBlock:true,defeat:true,mods:MANTIS_MODS,
  ai:[{min:100,max:300,b:'S',dx:0,p:.14},{min:90,max:220,b:'S',dx:1,p:.1},{min:90,max:240,b:'M',dx:1,p:.16}]},
 mantisAlpha:{id:'mantisAlpha',name:'ALPHA-MANTIS',desc:'Schwarm-Anführer',hp:650,walk:.92,dmg:.95,def:1,jump:1,dash:1,airJumps:0,meter:.01,pal:'tiger',glow:'#ff7a3a',sprites:'mantis',noSpecialBlock:true,spriteScale:1.25,size:1.25,defeat:true,mods:ALPHA_MODS,
  ai:[{min:100,max:320,b:'S',dx:0,p:.16},{min:90,max:240,b:'S',dx:1,p:.12},{min:90,max:260,b:'H',dx:1,p:.14}]},
 wolf:{id:'wolf',name:'WOLF',desc:'(nicht im Arcade-Roster)',hp:1050,walk:.94,dmg:1.06,pal:'wolf',glow:'#ff3a55',mods:{'5H':{dmg:100}}}};
// Arcade: spielbare Figuren (Reihenfolge der Auswahl), Gegner-Reihenfolge (ohne die eigene Figur)
export const ROSTER=['tiger','st3g0','kitsune'];
export const LADDER=['tiger','st3g0','kitsune'];
// Endgegner: steht in jedem Arcade-Durchlauf als letzte Stufe (außer man spielt ihn selbst); wer das Arcade einmal schafft, schaltet ihn als spielbaren Kämpfer frei (Browser-Speicher, siehe unlocks.js).
export const BOSS='anubis';
for(const id of loadUnlocks())if(id===BOSS&&CHARACTERS[id]&&!ROSTER.includes(id))ROSTER.push(id);
// true = gerade neu freigeschaltet
export function unlockChar(id){if(!CHARACTERS[id]||ROSTER.includes(id))return false;ROSTER.push(id);saveUnlock(id);return true}
