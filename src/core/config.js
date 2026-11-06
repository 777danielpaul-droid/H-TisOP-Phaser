// Zentrale Konstanten. Alle Zeiten in Frames (60 FPS), Distanzen in logischen Pixeln (960x540).
export const W=960,H=540,GROUND=470,WALL_L=110,WALL_R=850;
export const PHYS={gravity:.7,jumpV:-20.5,superJumpV:-21.5,airJumpV:-17,walk:4.2,back:3.4,airDrift:3.6,
 dash:12,dashFrames:13,airDash:11,airDashFrames:15,coyote:6,jumpBuffer:6,inputBuffer:10,cancelBuffer:10,juggleMax:8};
export const SPEED=1.5; // Standard-Spieltempo (Logik-Schritte pro 1/60 s); im Menü einstellbar
export const COMBO_SCALE=[1,.95,.9,.85,.8,.7,.6,.5,.4,.3]; // Schadensskalierung je Treffer im Combo
export const METER={max:300,bar:100};
export const ROUND={time:99,wins:2,intro:120,ko:150,result:150};
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
export const CAMERA={minZoom:.65,maxZoom:1,marginX:150,headroom:80,lerpPos:.1,lerpZoom:.07};
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
