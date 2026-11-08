// Figurenspezifische Movesets. Jede Figur überschreibt die Basis-Moves aus moves.js (nur die Felder, die sich ändern).
// Normals: norm({su,rc,dmg,reach}) = Startup/Recovery-Offset, Schadensfaktor, Reichweiten-Offset für alle Normals.
// Specials: eigene Werte + `info` (Kurztext im Menü) + optional v:{L,M,H} (Variante je nach Taste; Special-Taste U zählt als M).
const NORMALS=['5L','5M','5H','2L','2M','2H','jL','jM','jH'];
const norm=({su=0,rc=0,dmg=1,reach=0})=>{const o={};
 for(const k of NORMALS)o[k]=m=>({su:Math.max(2,m.su+su),rc:Math.max(3,m.rc+rc),dmg:Math.round(m.dmg*dmg),box:[m.box[0],m.box[1],Math.max(40,m.box[2]+reach),m.box[3]]});
 return o};
const P=o=>({y:-96,hs:20,bs:12,life:100,...o}); // Projektil mit Standardwerten

// ---------- MASTER: Allrounder – keine Schwäche, keine Extreme ----------
// Stärke: gute Werkzeuge für jede Lage (Welle, Reversal, Beinfeger, Überkopf, Sturzkick). Schwäche: nirgends Spitzenklasse.
const hero={
 fireball:{info:'Welle: J = schnell & schwach, L = langsam & stark',v:{
  L:{su:9,rc:14,proj:P({frame:9,vx:7,w:64,h:44,dmg:55,hs:18,bs:10})},
  H:{su:13,rc:24,proj:P({frame:13,vx:11,w:92,h:58,dmg:90,hs:24,bs:14})}}},
 rising:{info:'Unverwundbar am Start – Reversal und Anti-Air',v:{L:{inv:[1,8],dmg:75},H:{rc:26,dmg:110,inv:[1,14]}}},
 rush:{info:'Sprint-Schlag: schnelle Annäherung',v:{L:{lunge:7,rc:12,dmg:65},H:{lunge:11,su:9,dmg:95,rc:18}}},
 '6M':{info:'Überkopf: schlägt Ducken-Block'},
 '6H':{info:'Rückt vor, gute Reichweite'},
 back:{info:'Tiefer Beinfeger: Knockdown'},
 airsp:{info:'Diagonaler Sturzflug, schnell am Boden'}};

// ---------- PALM MASTER: Zäher Fernkämpfer/Griff-Charakter ----------
// Stärke: viel HP, hohe Reichweite, durchdringende Palmwelle, Rüstungs-Move, Griff, heilt sich.
// Schwäche: langsam (Laufen, Dash, Normals), nur 1 Doppelsprung ohne Hochsprung, Griff/Qi sind bei Fehlschlag sehr riskant.
const palm={...norm({su:2,rc:2,dmg:.95,reach:12}),
 fireball:{label:'Palmwelle',info:'Langsame Riesen-Welle, trifft mehrfach (durchdringt)',su:14,rc:22,
  proj:P({frame:14,y:-92,vx:5.5,w:112,h:98,dmg:34,hs:16,bs:10,life:150,pierce:16,look:'wave'}),
  v:{L:{su:11,rc:18,proj:P({frame:11,y:-92,vx:4.5,w:90,h:80,dmg:34,hs:14,bs:8,life:150,pierce:14,look:'wave'})},
     H:{su:17,rc:28,proj:P({frame:17,y:-92,vx:7.5,w:140,h:110,dmg:54,hs:18,bs:12,life:150,pierce:12,look:'wave'})}}},
 rising:{label:'Himmelspalme',info:'Unverwundbar, hoher Launcher',su:5,dmg:100,inv:[1,14],launch:{vx:2,vy:-19}},
 rush:{label:'Eisenpalme',info:'RÜSTUNG: steckt einen Treffer ein, großer Rückstoß',anim:'heavy',su:11,ac:6,rc:24,dmg:85,hs:26,bs:22,pb:9,box:[10,-130,120,80],lunge:5,armor:[3,12],hstop:9,shake:5,glow:1},
 back:{label:'Qi sammeln',info:'Heilt 25 HP + Meter – aber lange verwundbar',anim:'special',crouch:false,lv:'mid',su:8,ac:0,rc:34,dmg:0,box:null,hard:false,heal:25,gain:35,glow:1,hstop:0,shake:0},
 airsp:{label:'Luft-Palme',info:'Schießt eine Welle schräg nach unten',anim:'special',su:8,ac:1,rc:14,dmg:0,box:null,dive:null,glow:1,land:6,
  proj:P({frame:8,y:-60,vx:7,vy:4,w:62,h:52,dmg:55,hs:20,bs:12,life:70}),hstop:0,shake:0},
 '6M':{label:'Greifer',info:'GRIFF: unblockbar, Knockdown – bei Fehlschlag langes Recovery',anim:'upper',su:10,ac:3,rc:32,dmg:90,hs:30,pb:3,lv:'mid',unb:true,box:[0,-110,72,90],hard:true,lunge:0,hstop:10,shake:6,spc:false},
 '6H':{label:'Druckpalme',info:'Große Reichweite, starker Rückstoß',su:10,ac:4,rc:16,dmg:75,hs:30,bs:22,pb:12,box:[10,-130,146,60],lunge:2},
 super:{label:'Palm-Schockwelle',info:'Breiter Strahl, 1 Balken',dmg:32,box:[20,-160,420,110]}};

// ---------- SORCERESS: Glaskanone / Zonerin ----------
// Stärke: viele Projektile (Ring, Funkenregen, Blitz, Falle), Blink-Teleport, Doppel-Doppelsprung, lädt Meter schnell.
// Schwäche: wenig HP, nimmt mehr Schaden, schwache & kurze Normals, kein Reversal mit Unverwundbarkeit.
const witch={...norm({su:1,rc:1,dmg:.9,reach:-10}),
 fireball:{label:'Feuerring',info:'Großer Ring: J = schnell, L = langsam & riesig',proj:P({frame:11,vx:10.5,w:96,h:84,dmg:92}),v:{
  L:{su:9,rc:14,proj:P({frame:9,vx:13,w:68,h:56,dmg:58,hs:16,bs:10})},
  H:{su:16,rc:26,proj:P({frame:16,vx:7,w:136,h:116,dmg:125,hs:24,bs:16})}}},
 rising:{label:'Flammensäule',info:'Hohe Säule vor ihr (kaum Unverwundbarkeit)',anim:'upper',su:7,ac:10,rc:26,dmg:80,hs:36,bs:18,box:[30,-230,96,230],launch:{vx:1.8,vy:-17},inv:[3,6],rise:null,land:0,hstop:9,shake:4,glow:1},
 rush:{label:'Funkenregen',info:'3 Bogen-Projektile, deckt den Mittelraum ab',anim:'special',su:12,ac:1,rc:24,dmg:0,box:null,lunge:0,hstop:0,shake:0,glow:1,
  proj:[P({frame:12,y:-120,vx:6,vy:-7.5,grav:.45,w:58,h:50,dmg:42,hs:18,bs:10,life:90}),P({frame:15,y:-120,vx:8.5,vy:-5,grav:.45,w:58,h:50,dmg:42,hs:18,bs:10,life:90}),P({frame:18,y:-120,vx:11,vy:-3,grav:.45,w:58,h:50,dmg:42,hs:18,bs:10,life:90})]},
 back:{label:'Blink',info:'Teleportiert sie nach hinten (kurz unverwundbar)',anim:'dash',crouch:false,lv:'mid',su:8,ac:0,rc:16,dmg:0,box:null,hard:false,tp:{rel:'self',off:-300},inv:[1,12],hstop:0,shake:0},
 airsp:{label:'Luft-Ring',info:'Ring schräg nach unten',anim:'special',su:8,ac:1,rc:12,dmg:0,box:null,dive:null,glow:1,land:6,
  proj:P({frame:8,y:-70,vx:9,vy:4.5,w:80,h:70,dmg:70}),hstop:0,shake:0},
 '6M':{label:'Blitzschlag',info:'Blitz trifft weit vorn von oben (Überkopf)',anim:'special',su:14,ac:1,rc:22,dmg:0,box:null,lunge:0,glow:1,hstop:0,shake:0,
  proj:P({frame:14,ox:210,y:-105,vx:0,w:56,h:230,dmg:62,hs:24,bs:14,life:10,lv:'high',look:'bolt'})},
 '6H':{label:'Zauber-Falle',info:'Legt eine Rune ab (max. 1), explodiert bei Berührung',anim:'special',su:14,ac:1,rc:22,dmg:0,box:null,lunge:0,glow:1,hstop:0,shake:0,
  proj:P({frame:14,ox:130,y:-28,vx:0,w:92,h:70,dmg:62,hs:24,bs:12,life:420,pierce:40,uniq:'mine',look:'mine'})},
 super:{label:'Inferno-Strahl',info:'Extrem langer Strahl',dmg:34,box:[20,-150,720,92]}};

// ---------- TIGER: Rushdown – schnell, aggressiv, zerbrechlich ----------
// Stärke: sehr schnelle Normals, höchstes Lauf-/Dash-Tempo, Cross-up-Teleport, Mehrfachtreffer-Rush.
// Schwäche: wenig HP, nimmt mehr Schaden, kurze Reichweite, Welle hat kaum Reichweite, Rush ist auf Block sehr riskant.
const tiger={...norm({su:-1,rc:-2,dmg:.92,reach:-8}),
 fireball:{label:'Klauenwelle',info:'Schnelle, kurzlebige Welle (kaum Reichweite)',su:8,rc:14,proj:P({frame:8,y:-90,vx:12,w:64,h:36,dmg:48,hs:16,bs:10,life:34,look:'claw'}),
  v:{L:{su:7,rc:12,proj:P({frame:7,y:-90,vx:13,w:56,h:32,dmg:38,hs:14,bs:8,life:28,look:'claw'})},
     H:{su:11,rc:20,proj:P({frame:11,y:-90,vx:14,w:76,h:42,dmg:62,hs:18,bs:12,life:46,look:'claw'})}}},
 rising:{label:'Tiger-Uppercut',info:'Sehr schneller Reversal',su:3,rc:22,dmg:85,inv:[1,8]},
 rush:{label:'Klauenhatz',info:'3 schnelle Treffer + Launcher – auf Block sehr riskant',anim:'heavy',su:6,ac:12,rc:22,dmg:30,hs:18,bs:12,pb:2,multi:4,minScale:.6,lunge:12,box:[10,-124,110,80],launch:{vx:3,vy:-13},hstop:3,shake:2,glow:1},
 back:{label:'Hinterhalt',info:'Teleportiert hinter den Gegner (Cross-up)',anim:'dash',crouch:false,lv:'mid',su:12,ac:4,rc:14,dmg:55,hs:20,bs:12,pb:3,box:[10,-130,96,60],hard:false,lunge:0,tp:{rel:'opp',off:80,flip:1},inv:[1,12],hstop:6,shake:2},
 airsp:{label:'Sturz-Klaue',info:'Sehr steiler, schneller Sturzangriff',su:4,dmg:65,box:[0,-70,70,90],dive:{vx:3.5,vy:18},land:8},
 '6M':{label:'Doppel-Schlitzer',info:'Schneller Vorstoß-Poke',anim:'punch',su:6,ac:3,rc:12,dmg:46,lv:'mid',box:[10,-120,104,40],lunge:5,hs:20,bs:11},
 '6H':{label:'Raubtier-Sprung',info:'Überkopf-Sprungangriff, weit',anim:'upper',su:13,ac:4,rc:18,dmg:80,lv:'high',lunge:9,box:[10,-150,116,62],hs:26,bs:16,glow:1},
 super:{label:'Tigerhatz',info:'Nah-Flurry mit Sprung nach vorn',anim:'heavy',dmg:40,ac:26,rc:22,lunge:7,beam:0,multi:3,box:[10,-140,150,110],launch:{vx:4,vy:-14}}};

// ---------- MINOTAURUS (Endgegner): Panzer ----------
// Stärke: riesige HP, Rüstung bei Heavy/Special, Griff, gewaltiger Schaden, große Reichweite.
// Schwäche: langsam, springt kaum/kein Doppelsprung, große Hurtbox, sehr lange Recoverys (bestrafbar), Rüstung hält nur 1 Treffer pro Move.
const mino={...norm({su:2,rc:2,dmg:1.15,reach:20}),
 '5H':{dmg:120,armor:[7,10]},
 fireball:{label:'Brüll-Schockwelle',info:'Breite, flache Welle',su:14,rc:26,proj:P({frame:14,y:-52,vx:7,w:130,h:84,dmg:85,hs:22,bs:14,life:100,look:'shock'})},
 rising:{label:'Hörner-Stoß',info:'RÜSTUNG statt Unverwundbarkeit, Launcher',su:8,ac:8,rc:24,dmg:110,inv:null,armor:[2,9],rise:{vx:2,vy:-16},box:[0,-190,100,190]},
 rush:{label:'Stier-Rammen',info:'RÜSTUNG, Knockdown – lange Recovery',su:10,ac:12,rc:28,dmg:115,lunge:11,armor:[4,16],hard:true,pb:8,box:[10,-130,140,110],hstop:10,shake:7,glow:1},
 back:{label:'Axt-Wirbel',info:'Trifft auch nach hinten (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:9,ac:5,rc:22,dmg:85,hs:26,bs:18,pb:6,box:[-130,-150,270,130],hard:false,hstop:8,shake:5,glow:1},
 airsp:{label:'Hammer-Sprung',info:'Wuchtiger Sturz, Knockdown',su:10,dmg:105,box:[-10,-70,116,100],dive:{vx:2.5,vy:17},hard:true,land:20,hstop:10,shake:8},
 '6M':{label:'Kopfnuss',info:'Überkopf mit Rüstung',anim:'heavy',su:14,ac:4,rc:18,dmg:75,lv:'high',armor:[5,9],box:[10,-190,112,80],lunge:0,hstop:8,shake:4},
 '6H':{label:'Todesgriff',info:'GRIFF: unblockbar, sehr hoher Schaden',anim:'upper',su:10,ac:3,rc:30,dmg:135,unb:true,hard:true,box:[0,-120,84,100],lunge:0,hstop:12,shake:8,spc:false,hs:30},
 super:{label:'Erdbeben-Strahl',info:'Breiter, langer Strahl',dmg:32,box:[20,-130,460,120]}};

// ---------- ST3-G0: Panzer-Echse – zäh, Reichweite, Schwanz-Konter ----------
// Stärke: viel HP, Rüstungs-Sprint, Schwanzfeger trifft auch hinter ihm, solide Normals mit etwas mehr Reichweite, Dornen-Wellen.
// Schwäche: mittleres Tempo (kein Mix-up-Teleport, kein Reversal wie beim Tiger), Welle nur mittelschnell, Sprint ist nach Block bestrafbar.
const st3g0={...norm({su:1,rc:0,dmg:1.03,reach:6}),
 fireball:{label:'Feuer-Atem',info:'Spuckt eine Feuerwelle: J = schnell, L = stark',su:10,rc:18,proj:P({frame:10,y:-150,vx:9,w:110,h:70,dmg:54,hs:18,bs:10,life:80,look:'fire'}),
  v:{L:{su:8,rc:14,proj:P({frame:8,y:-150,vx:10,w:90,h:56,dmg:40,hs:14,bs:8,life:60,look:'fire'})},
     H:{su:13,rc:24,proj:P({frame:13,y:-150,vx:8,w:140,h:86,dmg:78,hs:22,bs:14,life:110,look:'fire'})}}},
 rising:{label:'Schwanz-Wirbel',info:'Unverwundbarer Anti-Air-Schlag, Launcher',su:5,ac:8,rc:24,dmg:90,inv:[1,10],launch:{vx:2,vy:-17}},
 rush:{label:'Panzer-Sprint',info:'RÜSTUNG: Schulter-Rammen, Knockdown',anim:'heavy',su:9,ac:12,rc:24,dmg:95,lunge:10,armor:[3,12],hard:true,pb:6,box:[10,-130,130,100],hstop:8,shake:5,glow:1},
 back:{label:'Schwanzfeger',info:'Trifft auch hinter ihm (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:8,ac:5,rc:20,dmg:70,hs:22,bs:14,pb:5,box:[-170,-100,320,100],hard:false,hstop:7,shake:4,glow:1},
 airsp:{label:'Rammsturz',info:'Steiler Sturzangriff, Knockdown',su:8,dmg:90,box:[-10,-70,110,100],dive:{vx:3,vy:17},hard:true,land:16,hstop:9,shake:6},
 '6M':{label:'Dornen-Haken',info:'Schneller Vorstoß-Haken',anim:'punch',su:8,ac:3,rc:14,dmg:60,lv:'mid',box:[10,-130,110,50],lunge:6,hs:22,bs:12},
 '6H':{label:'Stachelkopf',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:14,ac:4,rc:20,dmg:88,lv:'high',lunge:6,box:[10,-170,118,70],hs:26,bs:16,glow:1},
 super:{label:'Platten-Strahl',info:'Sehr langer Strahl, hoher Schaden',dmg:34,box:[20,-140,640,100]}};

export const MODS={hero,palm,witch,tiger,mino,st3g0};
