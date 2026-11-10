import{MODS}from'./movesets.js';
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
 wolf:{id:'wolf',name:'WOLF',desc:'(nicht im Arcade-Roster)',hp:1050,walk:.94,dmg:1.06,pal:'wolf',glow:'#ff3a55',mods:{'5H':{dmg:100}}}};
// Arcade: spielbare Figuren (Reihenfolge der Auswahl), Gegner-Reihenfolge (ohne die eigene Figur)
export const ROSTER=['tiger','st3g0','kitsune'];
export const LADDER=['tiger','st3g0','kitsune'];
