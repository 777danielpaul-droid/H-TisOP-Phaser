// Figurenspezifische Movesets. Jede Figur überschreibt die Basis-Moves aus moves.js (nur die Felder, die sich ändern).
// Normals: norm({su,rc,dmg,reach}) = Startup/Recovery-Offset, Schadensfaktor, Reichweiten-Offset für alle Normals.
// Specials: eigene Werte + `info` (Kurztext im Menü) + optional v:{L,M,H} (Variante je nach Taste; Special-Taste U zählt als M).
const NORMALS=['5L','5M','5H','2L','2M','2H','jL','jM','jH','j8H','j2H'];
const norm=({su=0,rc=0,dmg=1,reach=0})=>{const o={};
 for(const k of NORMALS)o[k]=m=>({su:Math.max(2,m.su+su),rc:Math.max(3,m.rc+rc),dmg:Math.round(m.dmg*dmg),box:[m.box[0],m.box[1],Math.max(40,m.box[2]+reach),m.box[3]]});
 return o};
const P=o=>({y:-96,hs:20,bs:12,life:100,...o}); // Projektil mit Standardwerten

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
 super:{label:'Blitz-Kamehameha',info:'HYPER: Ein Blitz schlägt in H!T ein, lädt ihn auf – er schleudert den Blitzstrahl (12 Treffer + Launcher)',anim:'hyper',fx:'bolt',beam:0,glow:0,dmg:28,su:44,ac:48,rc:26,multi:4,minScale:.5,box:[40,-175,640,150],launch:{vx:6,vy:-14},inv:[0,50],hstop:2,shake:6}};

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
 super:{label:'Drachen-Feuersturm',info:'HYPER: Atmet einen langen Feuerstrom – 10 Treffer + Launcher',anim:'hyper',fx:'breath',beam:0,glow:0,dmg:30,su:24,ac:50,rc:26,multi:5,minScale:.5,box:[40,-235,520,210],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:6}};

// ---------- KITSUNE: Neunschwanz-Fuchs – ausgewogen, Geisterfeuer, schneller Anti-Air ----------
// Stärke: flinker Anti-Air-Kick (Launcher), Schwanzpeitsche trifft auch hinter ihr, Geisterfeuer-Wellen (J/L), solide Normals.
// Schwäche: keine Rüstung, kein Teleport, Wellen nur mittelschnell, Hatz-Serie ist auf Block bestrafbar.
const kitsune={...norm({su:0,rc:-1,dmg:.98,reach:4}),
 fireball:{label:'Fuchsfeuer',info:'Violettes Geisterfeuer: J = schnell, L = stark',su:9,rc:16,proj:P({frame:9,y:-120,vx:10,w:96,h:64,dmg:46,hs:16,bs:9,life:76,look:'fire'}),
  v:{L:{su:7,rc:13,proj:P({frame:7,y:-120,vx:11,w:80,h:52,dmg:36,hs:14,bs:8,life:60,look:'fire'})},
     H:{su:12,rc:22,proj:P({frame:12,y:-120,vx:9,w:128,h:80,dmg:70,hs:20,bs:13,life:100,look:'fire'})}}},
 rising:{label:'Spiral-Tritt',info:'Schneller Anti-Air-Kick, Launcher',su:4,ac:8,rc:22,dmg:84,inv:[1,9],launch:{vx:2,vy:-16}},
 rush:{label:'Neun-Schwänze-Hatz',info:'3 Schläge + Launcher – auf Block bestrafbar',anim:'heavy',su:7,ac:12,rc:22,dmg:34,hs:18,bs:12,pb:3,multi:3,lunge:10,box:[10,-124,120,80],launch:{vx:3,vy:-13},hstop:4,shake:3,glow:1},
 back:{label:'Schwanzpeitsche',info:'Trifft auch hinter ihr (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:8,ac:5,rc:18,dmg:62,hs:22,bs:13,pb:4,box:[-150,-100,290,100],hard:false,hstop:6,shake:3,glow:1},
 airsp:{label:'Sturztritt',info:'Steiler Sturzangriff, Knockdown',su:6,dmg:78,box:[-10,-70,100,100],dive:{vx:3.2,vy:16},hard:true,land:12,hstop:8,shake:5},
 '6M':{label:'Doppelhaken',info:'Schneller Vorstoß-Poke',anim:'punch',su:7,ac:3,rc:13,dmg:52,lv:'mid',box:[10,-124,108,44],lunge:6,hs:21,bs:12},
 '6H':{label:'Fuchssprung',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:13,ac:4,rc:19,dmg:84,lv:'high',lunge:7,box:[10,-160,116,66],hs:26,bs:16,glow:1},
 super:{label:'Neunschwanz-Inferno',info:'HYPER: Neun Geisterfeuer-Schwänze fegen nach vorn – 9 Treffer + Launcher',anim:'hyper',fx:'tails',beam:0,dmg:32,su:16,ac:54,rc:26,multi:6,minScale:.5,box:[-40,-200,500,220],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:5}};

// ---------- ANUBIS: Endgegner – hart, viel HP, goldene Seelenwellen ----------
// Stärke: viel HP, harte Normals mit Reichweite, Seelenwellen (J/L), Schweifhieb trifft auch hinter ihm, Richterspruch mit Launcher.
// Schwäche: keine Rüstung, kein Teleport, Richterspruch ist auf Block bestrafbar, Wellen nur mittelschnell.
const anubis={...norm({su:0,rc:0,dmg:1.05,reach:8}),
 fireball:{label:'Seelenwelle',info:'Goldene Seelenwelle: J = schnell, L = stark',su:9,rc:16,proj:P({frame:9,y:-124,vx:10,w:100,h:66,dmg:50,hs:16,bs:9,life:80,look:'fire'}),
  v:{L:{su:7,rc:13,proj:P({frame:7,y:-124,vx:11,w:84,h:54,dmg:40,hs:14,bs:8,life:62,look:'fire'})},
     H:{su:13,rc:22,proj:P({frame:13,y:-124,vx:9,w:132,h:84,dmg:76,hs:20,bs:13,life:104,look:'fire'})}}},
 rising:{label:'Schakal-Sprung',info:'Unverwundbarer Anti-Air, Launcher',su:5,ac:8,rc:24,dmg:90,inv:[1,10],launch:{vx:2,vy:-17}},
 rush:{label:'Richterspruch',info:'3 harte Schläge + Launcher – auf Block bestrafbar',anim:'heavy',su:8,ac:12,rc:24,dmg:36,hs:18,bs:12,pb:3,multi:3,lunge:11,box:[10,-126,124,84],launch:{vx:3,vy:-13},hstop:4,shake:3,glow:1},
 back:{label:'Schweifhieb',info:'Trifft auch hinter ihm (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:8,ac:5,rc:19,dmg:66,hs:22,bs:13,pb:4,box:[-160,-100,300,100],hard:false,hstop:6,shake:3,glow:1},
 airsp:{label:'Sturzklaue',info:'Steiler Sturzangriff, Knockdown',su:6,dmg:82,box:[-10,-70,104,100],dive:{vx:3.2,vy:16},hard:true,land:12,hstop:8,shake:5},
 '6M':{label:'Doppelklaue',info:'Schneller Vorstoß-Poke',anim:'punch',su:7,ac:3,rc:13,dmg:54,lv:'mid',box:[10,-124,112,44],lunge:6,hs:21,bs:12},
 '6H':{label:'Anubis-Hieb',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:13,ac:4,rc:19,dmg:88,lv:'high',lunge:7,box:[10,-160,120,66],hs:26,bs:16,glow:1},
 super:{label:'Urteil der Maat',info:'HYPER: Ein goldener Seelenstrahl – 10 Treffer + Launcher',anim:'hyper',fx:'breath',beam:0,glow:0,dmg:30,su:20,ac:50,rc:26,multi:5,minScale:.5,box:[40,-200,540,210],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:6}};

// ---------- CYBERDÄMON: Story-Boss Kapitel 2 – riesig, zäh, rote Schlagwellen ----------
// Stärke: sehr viel HP, harte Normals mit großer Reichweite, Klauenwellen (J/L), Rüstungs-Ansturm, Stachelschlag trifft auch hinter ihm, Blutrausch (Hyper).
// Schwäche: langsam (Sprung, Dash), Startup der schweren Moves ist lang und auf Block bestrafbar, keine Luft-Sprünge.
const cyberdemon={...norm({su:1,rc:1,dmg:1.15,reach:16}),
 fireball:{label:'Klauenwelle',info:'Rote Schlagwelle: J = schnell, L = stark',su:10,rc:18,proj:P({frame:10,y:-120,vx:9.5,w:120,h:84,dmg:62,hs:18,bs:10,life:84,look:'claw'}),
  v:{L:{su:8,rc:14,proj:P({frame:8,y:-120,vx:10.5,w:100,h:70,dmg:46,hs:14,bs:8,life:66,look:'claw'})},
     H:{su:13,rc:24,proj:P({frame:13,y:-120,vx:8.5,w:150,h:100,dmg:84,hs:22,bs:14,life:110,look:'claw'})}}},
 rising:{label:'Höllenfahrt',info:'Unverwundbarer Anti-Air-Schlag, Launcher',su:6,ac:8,rc:26,dmg:95,inv:[1,10],launch:{vx:2,vy:-17}},
 rush:{label:'Kern-Ansturm',info:'RÜSTUNG: stürmt vor, Knockdown',anim:'heavy',su:10,ac:12,rc:26,dmg:100,lunge:10,armor:[3,12],hard:true,pb:6,box:[10,-140,150,110],hstop:8,shake:5,glow:1},
 back:{label:'Stachelschlag',info:'Trifft auch hinter ihm (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:9,ac:5,rc:20,dmg:72,hs:22,bs:14,pb:5,box:[-190,-110,380,110],hard:false,hstop:7,shake:4,glow:1},
 airsp:{label:'Sturzklaue',info:'Steiler Sturzangriff, Knockdown',su:8,dmg:90,box:[-10,-80,120,110],dive:{vx:3,vy:16},hard:true,land:16,hstop:9,shake:6},
 '6M':{label:'Doppelhieb',info:'Weiter Vorstoß-Poke',anim:'punch',su:8,ac:3,rc:14,dmg:64,lv:'mid',box:[10,-130,140,50],lunge:6,hs:22,bs:12},
 '6H':{label:'Dämonenhieb',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:15,ac:4,rc:20,dmg:92,lv:'high',lunge:7,box:[10,-190,140,80],hs:26,bs:16,glow:1},
 super:{label:'Blutrausch',info:'HYPER: Klauenhagel mit beiden Händen – 8 Treffer + Launcher',anim:'hyper',beam:0,glow:1,dmg:26,su:22,ac:46,rc:28,multi:5,minScale:.5,box:[20,-190,330,170],launch:{vx:5,vy:-13},inv:[0,30],hstop:2,shake:6,cost:100}};

// Air-Hyper je Figur: nur Name/Beschreibung (Werte stehen in moves.js `airsuper`); reicht für unterscheidbare Hyper-Banner
tiger.airsuper={label:'Klauen-Sturm',info:'HYPER in der Luft: Klauenhagel, am Ende rammt H!T den Gegner zu Boden'};
st3g0.airsuper={label:'Drachen-Sturz',info:'HYPER in der Luft: Schlagregen, Finale = Boden-Prall',dmg:32};
kitsune.airsuper={label:'Neunschwanz-Wirbel',info:'HYPER in der Luft: Schweif-Wirbel, Finale = Boden-Prall'};
anubis.airsuper={label:'Himmelsgericht',info:'HYPER in der Luft: Richterspruch aus der Höhe, Finale = Boden-Prall',dmg:32};
cyberdemon.airsuper={label:'Höllenregen',info:'HYPER in der Luft: Klauenregen, Finale = Boden-Prall',dmg:33};
// ---------- KORVUS (Rabe, Schwarzmarkthändler): Zoner/Trickser – Schattensicheln, Federsturm, hohe Sprünge ----------
// Stärke: Sichelwellen (J/L) halten auf Abstand, Federsturm trifft auch hinter ihm (Anti-Cross-up), Rabenflug = unverwundbarer Anti-Air, schneller Dash + hoher Sprung.
// Schwäche: keine Rüstung, kein Teleport, Krallen-Rausch ist auf Block bestrafbar, Sicheln nur mittelschnell.
const rabe={...norm({su:0,rc:-1,dmg:1.02,reach:6}),
 fireball:{label:'Schattensichel',info:'Violette Sichelwelle: J = schnell, L = stark',su:9,rc:16,proj:P({frame:9,y:-112,vx:11,w:100,h:72,dmg:50,hs:16,bs:9,life:72,look:'sickle'}),
  v:{L:{su:7,rc:13,proj:P({frame:7,y:-112,vx:12,w:84,h:58,dmg:38,hs:14,bs:8,life:58,look:'sickle'})},
     H:{su:13,rc:22,proj:P({frame:13,y:-112,vx:10,w:132,h:94,dmg:76,hs:20,bs:13,life:98,look:'sickle'})}}},
 rising:{label:'Rabenflug',info:'Unverwundbarer Anti-Air, Launcher',su:4,ac:8,rc:23,dmg:88,inv:[1,10],launch:{vx:2,vy:-17}},
 rush:{label:'Krallen-Rausch',info:'3 Hiebe + Launcher – auf Block bestrafbar',anim:'heavy',su:7,ac:12,rc:23,dmg:34,hs:18,bs:12,pb:3,multi:3,lunge:11,box:[10,-126,120,82],launch:{vx:3,vy:-13},hstop:4,shake:3,glow:1},
 back:{label:'Federsturm',info:'Trifft auch hinter ihm (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:8,ac:5,rc:19,dmg:64,hs:22,bs:13,pb:4,box:[-155,-100,300,100],hard:false,hstop:6,shake:3,glow:1},
 airsp:{label:'Sturzflug',info:'Steiler Sturzangriff, Knockdown',su:5,dmg:80,box:[-10,-70,100,100],dive:{vx:3.3,vy:17},hard:true,land:12,hstop:8,shake:5},
 '6M':{label:'Krallenstoß',info:'Schneller Vorstoß-Poke',anim:'punch',su:7,ac:3,rc:13,dmg:52,lv:'mid',box:[10,-124,108,44],lunge:6,hs:21,bs:12},
 '6H':{label:'Schnabelhieb',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:13,ac:4,rc:19,dmg:84,lv:'high',lunge:7,box:[10,-162,116,66],hs:26,bs:16,glow:1},
 super:{label:'Rabenschwarm',info:'HYPER: Ein Schwarm aus Schatten stürzt nach vorn – 9 Treffer + Launcher',anim:'hyper',beam:0,fx:'swarm',glow:1,dmg:30,su:20,ac:50,rc:26,multi:6,minScale:.5,box:[-20,-200,460,220],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:6}};

// ---------- LEON: Löwenkrieger – kraftvoll, Prankenhiebe, High-Kick-Launcher ----------
// Stärke: hohe HP, hoher Schaden, High-Kick-Launcher mit viel Reichweite, wuchtige Specials.
// Schwäche: mittleres Tempo, schwere Angriffe haben etwas mehr Startup.
const leon={...norm({su:0,rc:0,dmg:1.04,reach:6}),
 fireball:{label:'Solar-Pranke',info:'Goldene Schnittwelle: J = schnell, L = stark',su:9,rc:16,proj:P({frame:9,y:-120,vx:10.5,w:104,h:68,dmg:50,hs:16,bs:9,life:76,look:'claw'}),
  v:{L:{su:7,rc:13,proj:P({frame:7,y:-120,vx:11.5,w:84,h:54,dmg:40,hs:14,bs:8,life:60,look:'claw'})},
     H:{su:13,rc:22,proj:P({frame:13,y:-120,vx:9.5,w:132,h:84,dmg:74,hs:20,bs:13,life:100,look:'claw'})}}},
 rising:{label:'Löwen-Kick',info:'Unverwundbarer Aufwärts-Highkick, Launcher',su:4,ac:8,rc:23,dmg:88,inv:[1,9],launch:{vx:2,vy:-17}},
 rush:{label:'Pranken-Hagel',info:'3 wuchtige Prankenhiebe + Launcher – auf Block bestrafbar',anim:'heavy',su:7,ac:12,rc:23,dmg:35,hs:18,bs:12,pb:3,multi:3,lunge:11,box:[10,-126,122,82],launch:{vx:3,vy:-13},hstop:4,shake:3,glow:1},
 back:{label:'Mähnen-Feger',info:'Rundum-Tritt, trifft auch hinter ihm (Anti-Cross-up)',anim:'kick',crouch:false,lv:'mid',su:8,ac:5,rc:19,dmg:66,hs:22,bs:13,pb:4,box:[-160,-100,310,100],hard:false,hstop:6,shake:3,glow:1},
 airsp:{label:'Meteor-Tritt',info:'Steiler Sturztritt, Knockdown',su:5,dmg:82,box:[-10,-70,105,100],dive:{vx:3.3,vy:17},hard:true,land:12,hstop:8,shake:5},
 '6M':{label:'Löwen-Stoß',info:'Schneller Vorstoß-Poke',anim:'punch',su:7,ac:3,rc:13,dmg:54,lv:'mid',box:[10,-124,110,44],lunge:6,hs:21,bs:12},
 '6H':{label:'Prankenhieb',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:13,ac:4,rc:19,dmg:86,lv:'high',lunge:7,box:[10,-160,118,66],hs:26,bs:16,glow:1},
 super:{label:'Solar-Inferno',info:'HYPER: Prankenhagel mit Schockwellen-Stoß – 10 Treffer + Launcher',anim:'hyper',beam:0,glow:1,dmg:30,su:18,ac:52,rc:26,multi:5,minScale:.5,box:[30,-210,520,210],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:6}};
leon.airsuper={label:'Sternschnuppen-Sturz',info:'HYPER in der Luft: Sturzangriff mit Boden-Prall',dmg:32};

// ---------- URSUS: Bärenkrieger – Schwergewicht, Klauenhiebe, Body-Slam ----------
// Stärke: sehr hohe HP, hoher Schaden, wuchtige Normals mit viel Reichweite, Body-Slam und Klauen-Sturm mit Launcher.
// Schwäche: etwas langsam, große Trefferfläche, Spezialangriffe haben mehr Startup und sind auf Block bestrafbar.
const bear={...norm({su:1,rc:1,dmg:1.08,reach:8}),
 fireball:{label:'Erdschock',info:'Schockwelle am Boden: J = schnell, L = stark',su:10,rc:17,proj:P({frame:10,y:-70,vx:8.5,w:112,h:64,dmg:56,hs:17,bs:10,life:74,look:'claw'}),
  v:{L:{su:8,rc:14,proj:P({frame:8,y:-70,vx:9.5,w:92,h:52,dmg:44,hs:15,bs:9,life:60,look:'claw'})},
     H:{su:14,rc:23,proj:P({frame:14,y:-70,vx:7.5,w:140,h:80,dmg:80,hs:21,bs:14,life:100,look:'claw'})}}},
 rising:{label:'Bärenhieb',info:'Unverwundbarer Aufwärtshieb, Launcher',su:5,ac:8,rc:24,dmg:92,inv:[1,9],launch:{vx:2,vy:-16}},
 rush:{label:'Klauen-Sturm',info:'3 wuchtige Klauenhiebe + Launcher – auf Block bestrafbar',anim:'heavy',su:8,ac:12,rc:24,dmg:38,hs:18,bs:12,pb:3,multi:3,lunge:11,box:[10,-126,126,84],launch:{vx:3,vy:-13},hstop:4,shake:3,glow:1},
 back:{label:'Wirbel-Klaue',info:'Rundum-Hieb, trifft auch hinter ihm (Anti-Cross-up)',anim:'heavy',crouch:false,lv:'mid',su:9,ac:5,rc:20,dmg:70,hs:22,bs:13,pb:4,box:[-160,-110,320,110],hard:false,hstop:6,shake:3,glow:1},
 airsp:{label:'Body-Slam',info:'Wuchtiger Sturzangriff mit Boden-Prall, Knockdown',anim:'slam',su:6,dmg:90,box:[-10,-70,110,100],dive:{vx:3.1,vy:17},hard:true,land:14,hstop:9,shake:7},
 '6M':{label:'Pranken-Stoß',info:'Schneller Vorstoß-Poke',anim:'punch',su:8,ac:3,rc:14,dmg:58,lv:'mid',box:[10,-124,112,46],lunge:6,hs:21,bs:12},
 '6H':{label:'Überkopf-Hieb',info:'Überkopf-Angriff, trifft hoch',anim:'upper',su:14,ac:4,rc:20,dmg:92,lv:'high',lunge:7,box:[10,-160,120,68],hs:26,bs:16,glow:1},
 super:{label:'Bärenzorn',info:'HYPER: Klauensturm mit Erdbeben-Schlag – 10 Treffer + Launcher',anim:'hyper',beam:0,glow:1,dmg:32,su:19,ac:54,rc:27,multi:5,minScale:.5,box:[30,-210,520,210],launch:{vx:5,vy:-13},inv:[0,34],hstop:2,shake:7}};
bear.airsuper={label:'Meteor-Slam',info:'HYPER in der Luft: Sturzangriff mit gewaltigem Boden-Prall',dmg:36};

export const MODS={tiger,st3g0,kitsune,anubis,cyberdemon,rabe,leon,bear};
