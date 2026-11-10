// Zentrale Konstanten. Alle Zeiten in Frames (60 FPS), Distanzen in logischen Pixeln (960x540).
export const W=960,H=540,GROUND=470,WALL_L=110,WALL_R=850;
// Spam-Sperre: jede Angriffstaste (L/M/H/S) höchstens `max` Mal hintereinander; gesperrt, bis eine andere Taste benutzt wurde oder `reset` Frames seit dem letzten Einsatz vergangen sind (Hyper ist ausgenommen)
export const SPAM={max:3,reset:90};
export const PHYS={gravity:.7,jumpV:-20.5,superJumpV:-21.5,airJumpV:-17,hopV:-15.5,walk:4.2,back:3.4,airDrift:3.6,
 dash:12,dashFrames:13,airDash:11,airDashFrames:15,coyote:6,jumpBuffer:6,inputBuffer:10,cancelBuffer:10,juggleMax:8};
// Pop-up / "Feder-Effekt": Jeder normale Bodentreffer (ohne Launcher/Knockdown) hebt den Gegner kurz in die Luft, damit man hinterherspringen kann (MvC2-Gefühl).
// Stärke je Treffer nach Moveschaden (< mid = leicht, < heavy = mittel, sonst schwer), Projektile/Multi-Hits nutzen `multi`.
// vy = Start-Auftrieb (negativ = hoch), vx = Rückstoß in Schlagrichtung, grav = Schwerkraft-Faktor im Pop (kleiner = schwebt länger),
// cap = ab dieser Höhe (px) gibt es im Pop-up kaum noch Nachschub, reach = bis zu dieser Höhe (px) reicht die Hurtbox im Pop-up bis zum Boden (Tiefschläge treffen weiter), drag = horizontale Dämpfung je Frame (Gegner bleibt in Reichweite), land = Erholungs-Frames bei der Landung (kein Knockdown), mid/heavy = Schadensschwellen.
export const BOUNCE={L:{vy:-4.8,vx:1.2},M:{vy:-5.4,vx:1.6},H:{vy:-9.2,vx:3},multi:{vy:-4.6,vx:1},proj:{vy:-6.5,vx:1.6},grav:.62,drag:.93,land:10,cap:110,reach:80,mid:45,heavy:75};
// Melee-Modus (Smash-Stil): Schaden in %, Rückstoß wächst mit dem %-Wert, Stocks (Leben), offene Plattform ohne Wände.
// pl/pr = Plattformkanten, x0/x1/y0/y1 = Blast-Zonen (wer sie verlässt, verliert einen Stock), pctScale = Move-Schaden -> %,
// kbDiv = je höher, desto später fliegt man weit, base = Grund-Rückstoß je Trefferstärke (leicht/mittel/schwer), flinch = darunter bleibt man am Boden stehen.
export const MELEE={stocks:3,pl:150,pr:810,x0:-260,x1:1220,y0:-430,y1:GROUND+300,pctScale:.17,pctMax:999,kbDiv:85,base:[4.2,6.2,8.6],hard:9.5,flinch:6.4,
 stunBase:10,stunK:2.4,respawn:70,hover:100,inv:150,time:480};
export const SPEED=1.5; // Standard-Spieltempo (Logik-Schritte pro 1/60 s); im Menü einstellbar
export const COMBO_SCALE=[1,.95,.9,.85,.8,.7,.6,.5,.4,.3]; // Schadensskalierung je Treffer im Combo
export const METER={max:300,bar:100};
export const ROUND={time:99,wins:2,intro:120,ko:150,result:260};   // result = Siegesfeier nach dem Rundenende (Frames)
// Weltgrenzen: Der Hintergrund reicht über den Bildschirm (0..960 x 0..540) hinaus, damit die Kamera herauszoomen/hochschwenken kann.
export const WORLD={x0:-1020,y0:-360,x1:1980,y1:540}; // 3000 px breit: reicht über beide voll geöffnete Gebäude (Gasse 740 + 2×BARRIER.width) hinaus
// Gasse zwischen zwei Hochhäusern: Start in der engen Gasse (WALL_L..WALL_R), jede Seite hat eine brechbare Wand (steps.L / steps.R = Durchbrüche je Seite).
// Hinter jeder Wand liegt ein Innenraum (Breite `width`; links Spielhalle, rechts Lobby), seine Rückwand ist unzerstörbar. hp = Haltbarkeit der Wand.
// Schaden: Treffer auf einen in die Ecke gedrängten Gegner (hitMul x Moveschaden, Launcher/harte Treffer x heavyMul, geblockt x blockMul)
// + Aufprall mit Tempo > impactV (impactMul je Tempo-Einheit). Neustart bei jeder Runde.
export const BARRIER={steps:{L:1,R:1},width:1000,hp:[300],hitMul:.9,heavyMul:1.5,blockMul:.35,impactV:3,impactMul:14,breakVx:7,breakVy:-8};
// Gebäude-Innenräume: top = Oberkante der Erdgeschoss-Wand (y), ceil = Unterkante der Decke im Innenraum (y). Im Gebäude stößt der Kopf an die Decke
// (Sprunghöhe begrenzt); vom Hof aus kommt man nur unterhalb der Decke durch die Bresche. Größeres ceil = mehr Luft zum Springen (top und ceil gemeinsam verschieben).
export const HOUSE={top:150,ceil:168};
// Kamera: zoom/lerp-Werte. minZoom 0.65 = maximal herausgezoomt (zeigt ~1.5x so viel Welt).
export const CAMERA={minZoom:.65,maxZoom:1,marginX:150,headroom:80,lerpPos:.1,lerpZoom:.07,
  // Hyper-Kamerafahrt: Die Kamera zoomt auf den Angreifer und bleibt im Zoom, solange der Hyper-Move läuft (Freeze + Strahl + Nachlauf).
  // zoom = Ziel-Zoom (÷ Figurengröße^.5), lift = Fokus über dem Boden-Ursprung, bias = Anteil Richtung Gegner (0 = nur Angreifer),
  // margin = Mindestrand links/rechts, damit der Gegner im Bild bleibt, inF/outF = Frames für Hin-/Rückfahrt, lead = Frames VOR Ende der aktiven Move-Phase, ab denen schon rausgezoomt wird (Gegner fliegt beim letzten Treffer weg), maxF = Sicherheitsgrenze
  cine:{zoom:1.25,lift:90,bias:.3,margin:170,inF:12,outF:16,lead:28,maxF:240,lerpPos:.16,lerpZoom:.14}};
// Visuelle Effekte: alle Zeiten in Frames (60 FPS).
export const EFFECT={
  hitShake:3,          // Basis-Screen-Shake pro Treffer
  hitFlash:6,          // Frames: Opfer blitzt weiß auf
  comboShake:6,        // Screen-Shake bei Combo-Treffern (ab 2 Hits)
  comboFlash:10,       // Frames: Combo-Blitz am Opfer
  koShake:14,          // Screen-Shake bei K.O.
  koFlash:26,          // Frames: K.O.-Blitz (Opfer)
  screenFlash:12,      // Frames: Vollbild-Flash bei K.O. / Super-Start
  winShake:10,         // Screen-Shake bei Runden-Sieg
  superShake:12,       // Screen-Shake bei Super-Start
  koSlow:64,           // Frames Zeitlupe beim K.O. (Ausblenden von .28× zurück auf 1×)
  koSlowMin:.28,       // niedrigste Zeitskala in der Zeitlupe
  punchSmall:.008, punchMid:.02, punchBig:.036,   // Kamera-Zoom-Punch je Trefferstärke
  kickSmall:4, kickBig:10,                        // Kamera-Rückstoß in Schlagrichtung (px)
};

// Grafik-Qualität (Optionen-Menü → "Grafik"). 0 = Niedrig, 1 = Mittel, 2 = Hoch. "Auto" wählt selbst anhand der Bildrate (siehe main.js).
// fx = Faktor für Partikelmengen, maxW/dpr = Obergrenze der Canvas-Auflösung, bloom/aberr/grain = Nachbearbeitung,
// glow = Boden-Lichtpfützen, rays = Anzahl Strahlen im Sieger-Finale/Impact-Frame (Faktor), dust = Faktor Staubpartikel, shadow = shadowBlur (Leuchten) an/aus.
export const GFX_PRESETS=[
 {name:'Niedrig',fx:.25,maxW:1280,dpr:1,bloom:0,aberr:false,grain:false,glow:false,rays:.35,dust:.2,shadow:false,fireworks:.35},
 {name:'Mittel', fx:.55,maxW:1920,dpr:1.25,bloom:.35,aberr:false,grain:false,glow:true,rays:.65,dust:.5,shadow:true,fireworks:.65},
 {name:'Hoch',   fx:1,  maxW:3200,dpr:2,bloom:1,aberr:true,grain:true,glow:true,rays:1,dust:1,shadow:true,fireworks:1}];
export const GFX={level:2,...GFX_PRESETS[2]};
export const setGfx=l=>{l=Math.max(0,Math.min(2,l|0));Object.assign(GFX,{level:l},GFX_PRESETS[l]);return GFX};
