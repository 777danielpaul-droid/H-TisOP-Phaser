import{MODS}from'./movesets.js';
// Neue Kämpfer: einfach hier eintragen. Moves/Werte je Figur: movesets.js.
// Werte: hp, walk (Lauftempo), dmg (Schadensfaktor), def (erlittener Schaden: <1 = zäher), jump/dash (Faktoren), airJumps (Luft-Sprünge), meter (Meter-Gewinn),
// pros/cons = Stärken/Schwächen (Charakterwahl), ai = Werkzeuge der KI [{min,max,b,dx,dy,p}] (Abstand min..max, Taste, Richtung rel. zum Gegner, Chance). `mods` überschreibt Felder einzelner Moves (siehe moves.js).
// desc = Kurzbeschreibung für die Charakterwahl. size = Körpergröße (Hurt-/Hitboxen, Kamera). boss = nicht spielbar.
export const CHARACTERS={
 hero:{id:'hero',name:'MASTER',desc:'Kampfsport-Meister · ausgewogen',hp:1000,walk:1.03,dmg:1,def:1,jump:1,dash:1,airJumps:1,meter:1,pal:'hero',glow:'#ffb347',sprites:'hero',mods:MODS.hero,
  pros:'Für jede Lage ein Werkzeug (Welle, Reversal, Überkopf, Beinfeger)',cons:'Nirgends Spitzenklasse',
  ai:[{min:95,max:260,b:'M',dx:1,p:.12},{min:100,max:230,b:'H',dx:1,p:.1},{min:60,max:150,b:'S',dx:-1,p:.1}]},
 palm:{id:'palm',name:'PALM MASTER',desc:'Handflächen-Gelehrter · zäh',hp:990,walk:.92,dmg:1,def:1,jump:.95,dash:.9,airJumps:1,meter:1,pal:'palm',glow:'#7dffc8',sprites:'palm',mods:MODS.palm,
  pros:'Viel HP, große Reichweite, Rüstung, Griff, heilt sich',cons:'Langsam, riskante Specials bei Fehlschlag',
  ai:[{min:0,max:110,b:'M',dx:1,p:.12},{min:110,max:300,b:'H',dx:1,p:.1},{min:320,max:900,b:'S',dx:-1,p:.08},{min:130,max:320,b:'S',dx:0,dy:1,p:.08}]},
 tiger:{id:'tiger',name:'H!T',desc:'Wilder Brawler · schnell',hp:950,walk:1.22,dmg:1,def:1.05,jump:1,dash:1.3,airJumps:1,meter:1,pal:'tiger',glow:'#3fe0ff',sprites:'tiger',defeat:true,mods:MODS.tiger,
  pros:'Blitzschnelle Normals, Tempo & Dash, Teleport-Cross-up, Mehrfachtreffer',cons:'Wenig HP, kurze Reichweite, kaum Fernkampf',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.14},{min:90,max:260,b:'M',dx:1,p:.16},{min:90,max:260,b:'H',dx:1,p:.1},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 wolf:{id:'wolf',name:'WOLF',desc:'(nicht im Arcade-Roster)',hp:1050,walk:.94,dmg:1.06,pal:'wolf',glow:'#ff3a55',mods:{'5H':{dmg:100}}},
 witch:{id:'witch',name:'SORCERESS',desc:'Zauberin · Fernkampf',hp:940,walk:1,dmg:1.05,def:1.05,jump:1.05,dash:1,airJumps:2,meter:1.35,pal:'witch',glow:'#ff4a4a',sprites:'witch',mods:MODS.witch,
  pros:'Viele Projektile, Falle, Blink-Teleport, 3 Sprünge, schnelles Meter',cons:'Wenig HP, schwache Normals, kein Reversal',
  ai:[{min:0,max:170,b:'S',dx:-1,p:.34},{min:130,max:330,b:'S',dx:0,dy:1,p:.16},{min:170,max:360,b:'H',dx:1,p:.12},{min:120,max:300,b:'M',dx:1,p:.14}]},
 mino:{id:'mino',name:'MINOTAUR',desc:'Endgegner · gewaltig und brutal',boss:true,hp:1500,walk:.88,dmg:1.18,def:.85,jump:.8,dash:.8,airJumps:0,meter:1,size:1.25,pal:'mino',glow:'#ffb347',sprites:'mino',mods:MODS.mino,
  pros:'Riesige HP, Rüstung, Griff, gewaltiger Schaden',cons:'Langsam, lange Recoverys, kein Doppelsprung',
  ai:[{min:0,max:120,b:'H',dx:1,p:.16},{min:0,max:150,b:'S',dx:-1,p:.12},{min:140,max:340,b:'S',dx:0,dy:1,p:.2},{min:100,max:240,b:'M',dx:1,p:.12}]}};
// Arcade: spielbare Figuren (Reihenfolge der Auswahl), Gegner-Reihenfolge (ohne die eigene Figur), Endgegner
export const ROSTER=['hero','palm','witch','tiger'];
export const LADDER=['tiger','witch','palm','hero'];
export const BOSS='mino';
