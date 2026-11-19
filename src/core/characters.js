import{MODS}from'./movesets.js';
import{loadUnlocks,saveUnlock}from'./unlocks.js';



// Story-Modus-Gegner (Insektenkrieger): ohne Projektile; Specials sind Nahkampf (Sprungtritt, Wirbel, Sprintschlag). Nicht im Roster.
export const MANTIS_MODS={
 fireball:{label:'Sprungtritt',info:'Springender Tritt',anim:'kick',su:12,ac:6,rc:20,dmg:55,hs:24,bs:14,box:[10,-120,140,60],lunge:8,proj:undefined,glow:0},
 rising:{label:'Wirbel',info:'Drehangriff, trifft auch hinter ihm',anim:'heavy',su:9,ac:8,rc:22,dmg:60,hs:26,bs:16,box:[-90,-140,200,100],launch:null,inv:null,rise:undefined,glow:0},
 rush:{label:'Sprintschlag',info:'Stürmt vor',anim:'punch',su:8,ac:6,rc:16,dmg:50,box:[10,-124,110,60],lunge:8,glow:0},
 super:{cost:9999},airsuper:{cost:9999}};
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
 rabe:{id:'rabe',name:'KORVUS',desc:'Schwarzmarkthändler · Schattensicheln & Federsturm',unlockable:true,hp:980,walk:1.04,dmg:1.02,def:.98,jump:1.1,dash:1.1,airJumps:1,meter:1.05,pal:'tiger',glow:'#9d5cff',sprites:'rabe',defeat:true,mods:MODS.rabe,
  pros:'Schattensicheln (J/L), Federsturm gegen Cross-ups, Rabenflug als Anti-Air, hohe Sprünge, schneller Dash',cons:'Wenig Rüstung, Krallen-Rausch auf Block bestrafbar, Sicheln nur mittelschnell',
  ai:[{min:100,max:330,b:'S',dx:0,p:.15},{min:100,max:260,b:'S',dx:-1,p:.12},{min:90,max:260,b:'M',dx:1,p:.16},{min:90,max:260,b:'H',dx:1,p:.12},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 leon:{id:'leon',name:'LEON',desc:'Löwenkrieger · kraftvoll mit High-Kick-Launcher',unlockable:true,hp:1040,walk:1.05,dmg:1.05,def:.96,jump:1.02,dash:1.15,airJumps:1,meter:1,pal:'tiger',glow:'#ff9a22',sprites:'leon',defeat:true,mods:MODS.leon,
  pros:'Hohe HP, kraftvolle Normals, High-Kick-Launcher, weitreichende Spezialangriffe',cons:'Große Trefferfläche, Spezialangriffe erfordern gutes Timing',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.15},{min:100,max:260,b:'S',dx:1,p:.12},{min:90,max:250,b:'M',dx:1,p:.15},{min:90,max:260,b:'H',dx:1,p:.12},{min:140,max:320,b:'S',dx:0,dy:1,p:.1}]},
 leonBoss:{id:'leonBoss',name:'LEON',desc:'Löwenkrieger · Story-Boss Kapitel 1',storyBoss:true,hp:1300,walk:1.02,dmg:1.05,def:.94,jump:1.02,dash:1.15,airJumps:1,meter:1,pal:'tiger',glow:'#ff9a22',sprites:'leon',spriteScale:1.12,size:1.12,defeat:true,mods:MODS.leon,
  pros:'Hohe HP, kraftvolle Normals, High-Kick-Launcher, weitreichende Spezialangriffe',cons:'Große Trefferfläche, Spezialangriffe erfordern gutes Timing',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.16},{min:100,max:260,b:'S',dx:1,p:.14},{min:90,max:250,b:'M',dx:1,p:.16},{min:90,max:260,b:'H',dx:1,p:.14},{min:140,max:320,b:'S',dx:0,dy:1,p:.12}]},
 mantis:{id:'mantis',name:'MANTIS',desc:'Insektenkrieger',hp:190,walk:1,dmg:.6,def:1,jump:1,dash:1,airJumps:0,meter:.01,pal:'tiger',glow:'#7dff9a',sprites:'mantis',noSpecialBlock:true,defeat:true,mods:MANTIS_MODS,
  ai:[{min:100,max:300,b:'S',dx:0,p:.14},{min:90,max:220,b:'S',dx:1,p:.1},{min:90,max:240,b:'M',dx:1,p:.16}]},
 mantisAlpha:{id:'mantisAlpha',name:'ALPHA-MANTIS',desc:'Schwarm-Anführer',hp:650,walk:.92,dmg:.95,def:1,jump:1,dash:1,airJumps:0,meter:.01,pal:'tiger',glow:'#ff7a3a',sprites:'mantis',noSpecialBlock:true,spriteScale:1.25,size:1.25,defeat:true,mods:ALPHA_MODS,
  ai:[{min:100,max:320,b:'S',dx:0,p:.16},{min:90,max:240,b:'S',dx:1,p:.12},{min:90,max:260,b:'H',dx:1,p:.14}]},
 miniDemon:{id:'miniDemon',name:'MINI-A1LIEN',desc:'Kleiner Dämon des Kerns · Story-Gegner Kapitel 3',hp:380,walk:1.05,dmg:.75,def:1,jump:.9,dash:1,airJumps:0,meter:.01,pal:'tiger',glow:'#ff5a3a',sprites:'cyberdemon',spriteScale:.78,size:.78,noSpecialBlock:true,defeat:true,
  mods:{...MODS.cyberdemon,super:{cost:9999},airsuper:{cost:9999}},   // kein Hyper (wie Mantis); Specials/Normals vom großen Cyberdämon
  ai:[{min:100,max:300,b:'S',dx:-1,p:.12},{min:90,max:230,b:'M',dx:1,p:.16},{min:90,max:240,b:'H',dx:1,p:.12}]},
 cyberdemon:{id:'cyberdemon',name:'A1LIEN',desc:'Dämon des Kerns',storyBoss:true,hp:1350,walk:.88,dmg:1,def:.92,jump:.85,dash:.95,airJumps:0,meter:1,pal:'tiger',glow:'#ff2a44',sprites:'cyberdemon',spriteScale:1.22,size:1.22,defeat:true,mods:MODS.cyberdemon,
  pros:'Sehr viel HP, riesige Reichweite, rote Klauenwellen, Rüstungs-Ansturm, Blutrausch',cons:'Langsam, schwere Moves mit langem Startup, kein Doppelsprung',
  ai:[{min:100,max:340,b:'S',dx:-1,p:.16},{min:90,max:280,b:'M',dx:1,p:.18},{min:90,max:300,b:'H',dx:1,p:.14},{min:140,max:340,b:'S',dx:0,dy:1,p:.12}]},
 st3g0Boss:{id:'st3g0Boss',name:'ST3-G0',desc:'Panzer-Echse · Story-Boss Kapitel 2',storyBoss:true,hp:1350,walk:.95,dmg:1.05,def:.92,jump:.95,dash:1.05,airJumps:1,meter:1,pal:'tiger',glow:'#7dff4a',sprites:'st3g0',spriteScale:1.15,size:1.15,defeat:true,mods:MODS.st3g0,   // Kapitel-2-Endgegner: gleiche Moves/Sprites wie der spielbare ST3-G0 (eigene ID, damit die Boss-Logik nur ihn betrifft), mehr HP, etwas größer
  pros:'Viel HP, Rüstungs-Sprint, Schwanzfeger gegen Cross-ups, solide Reichweite',cons:'Mittleres Tempo, Welle nur mittelschnell, Sprint nach Block bestrafbar',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.16},{min:90,max:250,b:'M',dx:1,p:.16},{min:90,max:250,b:'H',dx:1,p:.14},{min:140,max:320,b:'S',dx:0,dy:1,p:.12}]},
 anubisBoss:{id:'anubisBoss',name:'ANUBIS',desc:'Wächter der Unterwelt · Story-Boss Kapitel 4',storyBoss:true,hp:1450,walk:1.05,dmg:1.08,def:.92,jump:1,dash:1.1,airJumps:1,meter:1.15,pal:'tiger',glow:'#ffd45a',sprites:'anubis',spriteScale:1.12,size:1.12,defeat:true,mods:MODS.anubis,   // Kapitel-4-Endgegner: gleiche Moves/Sprites wie der freischaltbare ANUBIS (eigene ID, damit die Boss-Logik nur ihn betrifft), mehr HP, etwas größer
  pros:'Viel HP, harte Normals, Seelenwellen, Schweifhieb gegen Cross-ups, Richterspruch mit Launcher',cons:'Etwas langsamere Sprünge, Richterspruch auf Block bestrafbar, keine Rüstung',
  ai:[{min:100,max:330,b:'S',dx:-1,p:.16},{min:90,max:260,b:'M',dx:1,p:.18},{min:90,max:270,b:'H',dx:1,p:.14},{min:140,max:320,b:'S',dx:0,dy:1,p:.12}]},
 wolf:{id:'wolf',name:'WOLF',desc:'(nicht im Arcade-Roster)',hp:1050,walk:.94,dmg:1.06,pal:'wolf',glow:'#ff3a55',mods:{'5H':{dmg:100}}}};
// Arcade: spielbare Figuren (Reihenfolge der Auswahl), Gegner-Reihenfolge (ohne die eigene Figur)
export const ROSTER=['tiger','kitsune'];   // ST3-G0 und LEON sind nicht mehr von Anfang an wählbar (Leon: Story 1x durchspielen oder Shop; ST3-G0: 3 Durchläufe oder Shop)
export const LADDER=['tiger','kitsune'];
// Endgegner: steht in jedem Arcade-Durchlauf als letzte Stufe (außer man spielt ihn selbst) und ist Endboss von Story-Kapitel 4 ('anubisBoss'). Spielbar wird er per Shop-Kauf ODER nach 4 Durchläufen (CLEAR_UNLOCKS), nicht mehr durch einmaliges Durchspielen (Browser-Speicher, siehe unlocks.js).
export const BOSS='anubis';
// Freischaltbare Kämpfer: Anubis (Shop-Kauf ODER 4 Durchläufe), KORVUS der Rabe, A1LIEN (Kauf im Shop, Preis: CHAR_PRICE in loot.js; A1LIEN erst nach Kapitel 3, siehe CHAR_REQ), ST3-G0 (Shop-Kauf ODER 3 Durchläufe) und LEON (Shop-Kauf ODER 1x Story durchspielen = Kapitel 4 geschafft)
export const UNLOCKABLE=[BOSS,'rabe','cyberdemon','st3g0','leon'];
// Durchläufe: ein Durchlauf = Arcade geschafft ODER letztes Story-Kapitel (4) geschafft (Zähler in unlocks.js, Auswertung in arcade.js countClear). Nach n Durchläufen wird die Figur auch ohne Kauf freigeschaltet. Anzahlen hier ändern.
// ST3-G0 nach 3 Durchläufen, ANUBIS nach 4 Durchläufen.
export const CLEAR_UNLOCKS=[{id:'st3g0',n:3},{id:'anubis',n:4}];
export const CLEAR_UNLOCK=CLEAR_UNLOCKS[0];   // Rückwärtskompatibel (ST3-G0)
// LEON: wird auch ohne Kauf freigeschaltet, sobald die Story 1x durchgespielt wurde (letztes Kapitel = STORY_CHAPTERS geschafft).
export const STORY_CLEAR_UNLOCK={id:'leon',n:1};
for(const id of loadUnlocks())if(UNLOCKABLE.includes(id)&&CHARACTERS[id]&&!ROSTER.includes(id))ROSTER.push(id);
export const STORY_CHAPTERS=4;   // Anzahl Story-Kapitel = CHAPTERS.length in story.js (kann hier nicht importiert werden: Kreisimport; tests/story4.test.js prüft die Gleichheit)
if(loadUnlocks().includes('storydone'+STORY_CHAPTERS))unlockChar('leon');
// true = gerade neu freigeschaltet
export function unlockChar(id){if(!CHARACTERS[id]||ROSTER.includes(id))return false;ROSTER.push(id);saveUnlock(id);return true}
