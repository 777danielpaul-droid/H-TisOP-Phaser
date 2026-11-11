import { ROUND, METER, COMBO_SCALE, EFFECT, SPAM } from "../core/config.js";
import { drawPortrait } from "./sprites.js";
import { F_DISP, F_TECH, F_UI } from "./fonts.js";
import { THEMES } from "./stage.js";
import { CHARACTERS } from "../core/characters.js";
// Kristall-HUD (Canvas 2D, 960x540 logisch): Eis-Blau, Violett und Lavendel, weiche Glanzkanten, Facetten statt Gold/Rot.
//  - Keine Textumrandungen und keine Rahmen/Ringe um die Ausrufe (ROUND, FIGHT, K.O. ...), dafür dezenter Glow
//  - Lebensbalken und Hyper-Meter mit Kristall-Facetten und wanderndem Glanzlicht
//  - Timer als feiner Ring, Combo-Zähler klein und klar
const SERIF = F_DISP,
  PI2 = Math.PI * 2;
const NEON_CYAN = "#7fe8ff",
  NEON_MAG = "#b98bff",
  NEON_GRN = "#9fe8ff",
  NEON_ORG = "#c9b8ff",
  NEON_RED = "#b98bff",
  NEON_PUR = "#a06bff";
// Kristall-Farben: ICE = Kante/Haarlinie, ICE_HI = Lichtpunkt, ICE_DIM = abgedunkelte Linien, CRYS = Edelstein-Violett
const ICE = "#b9c4ff",
  ICE_HI = "#eaf6ff",
  ICE_DIM = "#4a4c9a",
  CRYS = "#7b6bff";
// a = Kante/Glow, b = tiefer Verlauf, hi = Lichtpunkt, d = dunkle Tönung
const HPAL = [
  { a: "#6fe3ff", b: "#2f6bff", hi: "#ffffff", d: "#0a1233", glow: "#6fe3ff", kan: "" },
  { a: "#c28bff", b: "#6a3bff", hi: "#ffffff", d: "#1a0c3a", glow: "#b46bff", kan: "" },
];
const RANKS = [
  [20, "UNREAL!!!"],
  [16, "SAVAGE!!"],
  [13, "BRUTAL!"],
  [10, "AWESOME!"],
  [7, "EXCELLENT!"],
  [5, "GREAT!"],
  [3, "GOOD!"],
];
const comboCol = (h) =>
  h >= 16
    ? ["#e6d4ff", "#a06bff"]
    : h >= 10
      ? ["#d4e4ff", "#7fa0ff"]
      : h >= 5
        ? ["#cdf6ff", "#7fe8ff"]
        : ["#ffffff", "#9fe8ff"];
const KAN = ["", "I", "II", "III"];
const easeOutBack = (u) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
};
const hclamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hpath = (g, pts) => {
  g.beginPath();
  pts.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.closePath();
};
const para = (g, x, y, w, h, sk) => {
  g.beginPath();
  g.moveTo(x + sk, y);
  g.lineTo(x + sk + w, y);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
};
const dia = (g, x, y, r) => {
  g.beginPath();
  g.moveTo(x, y - r);
  g.lineTo(x + r, y);
  g.lineTo(x, y + r);
  g.lineTo(x - r, y);
  g.closePath();
};
const hn = (k) => {
  const s = Math.sin(k * 12.9898) * 43758.5453;
  return s - Math.floor(s);
}; // deterministisches Rauschen
// Geometrie der Lebensbalken (lokal für P1, P2 wird gespiegelt)
const HB = { x: 94, y: 30, w: 300, h: 9, sk: 8 };
export class Hud {
  constructor(W, H) {
    this.W = W;
    this.H = H;
    this.lag = [1, 1];
    this.hold = [0, 0];
    this.prev = [1, 1];
    this.hitFlash = [0, 0];
    this.pop = [0, 0];
    this.prevHits = [0, 0];
    this.wave = null;
  }
  // ---------- Text ----------
  fancy(
    g,
    s,
    x,
    y,
    size,
    grad,
    align = "center",
    glow,
    t = 0,
    italic = false,
    bare = false,
    weight = 600,
    sp = 0,
  ) {
    g.save();
    g.font = `${italic ? "italic " : ""}${weight} ${size}px ${this._fam || SERIF}`;
    g.textAlign = align;
    g.lineJoin = "round";
    if ("letterSpacing" in g) g.letterSpacing = sp + "px";
    const f = g.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.1);
    f.addColorStop(0, grad[0]);
    f.addColorStop(1, grad[1]);
    // Kristall: keine Umrandung um die Schrift, nur weicher Glow
    if (glow) {
      g.shadowColor = glow;
      g.shadowBlur = size * 0.45;
      g.fillStyle = f;
      g.fillText(s, x, y);
      g.shadowBlur = size * 0.8;
      g.globalAlpha = 0.35;
      g.fillText(s, x, y);
    } else {
      g.fillStyle = f;
      g.fillText(s, x, y);
    }
    g.restore();
  }
  // Mit starkem Chroma-Split + Glow (nur Banner/Combo-Zahl)
  big(
    g,
    s,
    x,
    y,
    size,
    grad,
    align,
    glow,
    t,
    italic,
    chroma = 0,
    weight = 600,
    sp = 0,
  ) {
    chroma *= 0.4; // Kristall: nur ein Hauch Lichtbrechung
    if (chroma) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.35;
      // drei Chroma-Layer für stärkeren Glitch-Effekt
      this.fancy(
        g,
        s,
        x - chroma * 1.5,
        y,
        size,
        ["#b98bff", "#b98bff"],
        align,
        null,
        t,
        italic,
        true,
        weight,
        sp,
      );
      this.fancy(
        g,
        s,
        x + chroma * 1.5,
        y,
        size,
        ["#7fe8ff", "#7fe8ff"],
        align,
        null,
        t,
        italic,
        true,
        weight,
        sp,
      );
      this.fancy(
        g,
        s,
        x,
        y - chroma * 0.7,
        size,
        ["#9b7bff", "#9b7bff"],
        align,
        null,
        t,
        italic,
        true,
        weight,
        sp,
      );
      g.restore();
    }
    this.fancy(
      g,
      s,
      x,
      y,
      size,
      grad,
      align,
      glow,
      t,
      italic,
      false,
      weight,
      sp,
    );
  }
  // Flashy-Text: Buchstaben wippen, Chroma-Split pulsiert, ein Glanzlicht wandert durch die Schrift, Funkeln drumherum
  glitz(g, s, x, y, size, pal, t, align = "center", sp = 3, seed = 1) {
    g.save();
    g.font = `600 ${size}px ${this._fam || SERIF}`;
    g.textAlign = "left";
    g.lineJoin = "round";
    if ("letterSpacing" in g) g.letterSpacing = "0px";
    const chars = [...s],
      ws = chars.map((c) => {
        const m = g.measureText(c);
        return (m ? m.width : size * 0.55) + sp;
      }),
      total = ws.reduce((a, b) => a + b, 0) - sp,
      x0 = align === "center" ? x - total / 2 : align === "right" ? x - total : x,
      sweep = ((t * 0.022) % 2.2) - 0.6,
      grad = g.createLinearGradient(0, y - size * 0.85, 0, y + size * 0.1);
    grad.addColorStop(0, pal[0]);
    grad.addColorStop(1, pal[1]);
    let cx = x0;
    chars.forEach((c, i) => {
      const yy = y + Math.sin(t * 0.12 + i * 0.7) * size * 0.035,
        off = 0.5 + 1 * (0.5 + 0.5 * Math.sin(t * 0.22 + i * 0.9));
      g.shadowBlur = 0;
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.3;
      g.fillStyle = "#b98bff";
      g.fillText(c, cx - off, yy);
      g.fillStyle = "#7fe8ff";
      g.fillText(c, cx + off, yy);
      g.restore();
      g.shadowColor = pal[1];
      g.shadowBlur = size * (0.3 + 0.15 * Math.sin(t * 0.2 + i));
      g.fillStyle = grad;
      g.fillText(c, cx, yy);
      const rel = (cx + ws[i] / 2 - x0) / Math.max(1, total),
        b = Math.max(0, 1 - Math.abs(rel - sweep) / 0.16);
      if (b > 0) {
        g.shadowBlur = 0;
        g.save();
        g.globalCompositeOperation = "lighter";
        g.globalAlpha = b * 0.9;
        g.fillStyle = "#fff";
        g.fillText(c, cx, yy);
        g.restore();
      }
      cx += ws[i];
    });
    g.restore();
    this.sparks(g, x0 + total / 2, y - size * 0.32, total / 2 + size * 0.4, size * 0.55, t, Math.max(4, Math.round(total / 40)), seed);
  }
  // Funkelnde Vierzack-Sterne, die an wechselnden Stellen auf- und abblenden
  sparks(g, cx, cy, rx, ry, t, n, seed = 1, col = "#ffffff") {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = col;
    g.fillStyle = "#fff";
    g.lineWidth = 1;
    g.shadowColor = col;
    g.shadowBlur = 6;
    for (let k = 0; k < n; k++) {
      const cyc = 46 + hn(seed * 7 + k) * 40,
        tt = t + hn(seed + k * 3.1) * cyc,
        u = (tt % cyc) / cyc,
        slot = Math.floor(tt / cyc),
        px = cx + (hn(seed * 13.7 + k * 5.3 + slot * 1.7) * 2 - 1) * rx,
        py = cy + (hn(seed * 3.3 + k * 8.1 + slot * 2.9) * 2 - 1) * ry,
        a = Math.sin(u * Math.PI),
        r = (3 + hn(k + seed) * 5) * a;
      g.globalAlpha = a;
      g.beginPath();
      g.moveTo(px - r * 2, py);
      g.lineTo(px + r * 2, py);
      g.moveTo(px, py - r * 2);
      g.lineTo(px, py + r * 2);
      g.stroke();
      g.beginPath();
      g.arc(px, py, r * 0.3, 0, PI2);
      g.fill();
    }
    g.restore();
  }
  txt(g, s, x, y, size, col, align = "center", glow) {
    const o = this._fam;
    this._fam = F_UI;
    this.fancy(g, s, x, y, size, [col, col], align, glow, 0, false, false, 600);
    this._fam = o;
  }
  // ---------- Kristall-Bausteine für Menüs (gleiche Formensprache wie das Kampf-HUD) ----------
  // Haarlinie mit Raute an den Enden; fade = 'r' (läuft nach rechts aus) | 'l' | null
  kRule(g, x1, x2, y, col = ICE, fade = null, al = 1) {
    g.save();
    g.globalAlpha = al;
    const gr = g.createLinearGradient(x1, 0, x2, 0);
    gr.addColorStop(0, fade === "l" ? col + "00" : col);
    gr.addColorStop(1, fade === "r" ? col + "00" : col);
    g.strokeStyle = gr;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x1 + 5, y);
    g.lineTo(x2 - 5, y);
    g.stroke();
    g.fillStyle = col;
    if (fade !== "l") {
      dia(g, x1, y, 2.4);
      g.fill();
    }
    if (fade !== "r") {
      dia(g, x2, y, 2.4);
      g.fill();
    }
    g.restore();
  }
  // Senkrechte Haarlinie mit Rauten (Trenner zwischen Liste und Profil)
  kVRule(g, x, y1, y2, col = ICE, al = 1) {
    g.save();
    g.globalAlpha = al;
    const gr = g.createLinearGradient(0, y1, 0, y2);
    gr.addColorStop(0, col + "00");
    gr.addColorStop(0.12, col);
    gr.addColorStop(0.88, col);
    gr.addColorStop(1, col + "00");
    g.strokeStyle = gr;
    g.shadowColor = col;
    g.shadowBlur = 6;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y1);
    g.lineTo(x, y2);
    g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = col;
    dia(g, x, y1 + 8, 2.6);
    g.fill();
    dia(g, x, y2 - 8, 2.6);
    g.fill();
    g.restore();
  }
  // Abgeschrägtes Rechteck (Pfad)
  kChamfer(g, x, y, w, h, c = 10) {
    g.beginPath();
    g.moveTo(x + c, y);
    g.lineTo(x + w, y);
    g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h);
    g.lineTo(x, y + h);
    g.lineTo(x, y + c);
    g.closePath();
  }
  // Eckklammern mit Raute (Rahmen um Porträts / Karten)
  kBrackets(g, x, y, w, h, len = 14, col = ICE, al = 1) {
    g.save();
    g.globalAlpha = al;
    g.strokeStyle = col;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y + len);
    g.lineTo(x, y);
    g.lineTo(x + len, y);
    g.moveTo(x + w - len, y + h);
    g.lineTo(x + w, y + h);
    g.lineTo(x + w, y + h - len);
    g.stroke();
    g.fillStyle = col;
    dia(g, x, y, 2.4);
    g.fill();
    dia(g, x + w, y + h, 2.4);
    g.fill();
    g.restore();
  }
  // Schräge Platte (Knöpfe, Reiter, Umschalter): on = aktiv (Farbe + Glanz), sonst dunkle Mulde mit Haarlinie
  kPlate(g, x, y, w, h, o = {}) {
    const { col = ICE, on = false, al = 1, sk = 8, t = 0 } = o;
    g.save();
    g.globalAlpha = al;
    para(g, x, y, w, h, sk);
    const f = g.createLinearGradient(0, y, 0, y + h);
    if (on) {
      f.addColorStop(0, col + "55");
      f.addColorStop(1, col + "16");
    } else {
      f.addColorStop(0, "#0b0c2ad8");
      f.addColorStop(1, "#05061ad8");
    }
    g.fillStyle = f;
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = on ? col : ICE_DIM;
    if (on) {
      g.shadowColor = col;
      g.shadowBlur = 8 + 3 * Math.sin(t * 0.08);
    }
    g.stroke();
    g.shadowBlur = 0;
    if (on) {
      g.save();
      para(g, x, y, w, h, sk);
      g.clip();
      const sh = g.createLinearGradient(0, y, 0, y + h);
      sh.addColorStop(0, "#ffffff48");
      sh.addColorStop(0.4, "#ffffff08");
      sh.addColorStop(1, "#0000");
      g.fillStyle = sh;
      g.fillRect(x, y, w + sk, h);
      const sc = ((t * 0.012) % 1.8) * (w + 80) - 40 + x,
        sg = g.createLinearGradient(sc - 14, 0, sc + 14, 0);
      sg.addColorStop(0, "#fff0");
      sg.addColorStop(0.5, "#ffffff50");
      sg.addColorStop(1, "#fff0");
      g.fillStyle = sg;
      g.fillRect(sc - 14, y, 28, h);
      g.restore();
    } else {
      g.globalAlpha = al * 0.4;
      g.strokeStyle = ICE_DIM;
      para(g, x - 3, y - 3, w + 6, h + 6, sk);
      g.stroke();
    }
    g.restore();
  }
  // Wertebalken im Kristall-Stil (schräge Mulde, Verlauf, Facettenstreifen, Glanz, Segmentstriche)
  kBar(g, x, y, w, h, v, col, t = 0, sk = 5) {
    v = hclamp(v, 0, 1);
    g.save();
    para(g, x, y, w, h, sk);
    const tg = g.createLinearGradient(0, y, 0, y + h);
    tg.addColorStop(0, "#04051a");
    tg.addColorStop(1, "#0a0c2a");
    g.fillStyle = tg;
    g.fill();
    g.strokeStyle = ICE_DIM;
    g.globalAlpha = 0.8;
    g.lineWidth = 0.8;
    g.stroke();
    g.globalAlpha = 1;
    g.save();
    para(g, x, y, w, h, sk);
    g.clip();
    const fw = w * v;
    if (fw > 0.5) {
      const fg = g.createLinearGradient(x, 0, x + fw + sk, 0);
      fg.addColorStop(0, col + "66");
      fg.addColorStop(0.75, col);
      fg.addColorStop(1, "#ffffff");
      g.fillStyle = fg;
      para(g, x, y, fw, h, sk);
      g.fill();
      const sh = g.createLinearGradient(0, y, 0, y + h);
      sh.addColorStop(0, "#ffffff70");
      sh.addColorStop(0.35, "#ffffff10");
      sh.addColorStop(1, "#00000060");
      g.fillStyle = sh;
      g.fillRect(x, y, fw + sk, h);
      for (let fx = x - h; fx < x + fw + h; fx += 9) {
        g.fillStyle = ((fx / 9) | 0) % 2 ? "#ffffff14" : "#00000020";
        g.beginPath();
        g.moveTo(fx, y + h);
        g.lineTo(fx + h, y);
        g.lineTo(fx + h + 4.5, y);
        g.lineTo(fx + 4.5, y + h);
        g.closePath();
        g.fill();
      }
      const sc = ((t * 0.012 + x * 0.01) % 1.9) * (fw + 60) - 30 + x,
        sg = g.createLinearGradient(sc - 12, 0, sc + 12, 0);
      sg.addColorStop(0, "#fff0");
      sg.addColorStop(0.5, "#ffffff80");
      sg.addColorStop(1, "#fff0");
      g.fillStyle = sg;
      g.fillRect(sc - 12, y, 24, h);
    }
    g.strokeStyle = "#05061ac0";
    g.lineWidth = 1;
    for (let k = 1; k < 10; k++) {
      const f = k / 10;
      g.beginPath();
      g.moveTo(x + sk + w * f, y);
      g.lineTo(x + w * f, y + h);
      g.stroke();
    }
    g.restore();
    if (fw > 3) {
      g.fillStyle = "#fff";
      g.shadowColor = col;
      g.shadowBlur = 6;
      dia(g, x + sk * 0.5 + fw, y + h / 2, 2);
      g.fill();
    }
    g.restore();
  }
  // Untertitel mit auslaufenden Haarlinien und Rauten links/rechts (wie „ROUND 1“ im HUD)
  kSub(g, s, cx, y, size, col, sp = 4, t = 0) {
    const tw = s.length * (size * 0.56 + sp);
    this.lab(g, s, cx + sp / 2, y, size, col, "center", sp, null, "700");
    const gap = tw / 2 + 16;
    this.kRule(g, cx - gap - 72, cx - gap, y - size * 0.36, ICE, "l", 0.85);
    this.kRule(g, cx + gap, cx + gap + 72, y - size * 0.36, ICE, "r", 0.85);
  }
  // Text in anderer Schrift (z. B. F_TECH für Logo/Ziffern)
  fam(f, fn) {
    const o = this._fam;
    this._fam = f;
    try {
      fn();
    } finally {
      this._fam = o;
    }
  }
  lab(
    g,
    s,
    x,
    y,
    size,
    col,
    align = "left",
    sp = 1.5,
    glow = null,
    weight = "500",
  ) {
    g.save();
    g.font = `${weight} ${size}px ${F_UI}`;
    g.textAlign = align;
    if ("letterSpacing" in g) g.letterSpacing = sp + "px";
    if (glow) {
      g.shadowColor = glow;
      g.shadowBlur = size * 0.8;
    }
    g.fillStyle = col;
    g.fillText(s, x, y);
    g.restore();
  }
  mw(g, s, size, weight = 600) {
    g.save();
    g.font = `${weight} ${size}px ${this._fam || F_UI}`;
    const m = g.measureText(s);
    g.restore();
    return m ? m.width : s.length * size * 0.55;
  }
  // ---------- Dekor ----------
  // Kristallgitter als feines Muster (Rauten-Facetten)
  pattern(g) {
    if (this.wave) return this.wave;
    const c = document.createElement("canvas");
    c.width = 28;
    c.height = 16;
    const x = c.getContext("2d");
    x.strokeStyle = "#b9c4ff1c";
    x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(28, 16);
    x.moveTo(28, 0);
    x.lineTo(0, 16);
    x.stroke();
    x.fillStyle = "#ffffff08";
    x.beginPath();
    x.moveTo(14, 0);
    x.lineTo(28, 8);
    x.lineTo(14, 16);
    x.closePath();
    x.fill();
    return (this.wave = g.createPattern(c, "repeat"));
  }
  // Edelstein (ersetzt das Siegel): facettierte Raute in Eis-/Violett-Verlauf
  seal(g, x, y, s, ch, al = 1, rot = 0) {
    const r = s * 0.62;
    g.save();
    g.globalAlpha = al;
    g.translate(x, y);
    g.rotate(rot);
    g.shadowColor = ICE;
    g.shadowBlur = s * 0.55;
    const gr = g.createLinearGradient(-r, -r, r, r);
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(0.35, "#8fe9ff");
    gr.addColorStop(0.7, CRYS);
    gr.addColorStop(1, "#3a2f9a");
    g.fillStyle = gr;
    hpath(g, [[0, -r], [r * 0.78, -r * 0.2], [0, r], [-r * 0.78, -r * 0.2]]);
    g.fill();
    g.shadowBlur = 0;
    // Facetten
    g.fillStyle = "#ffffff55";
    hpath(g, [[0, -r], [r * 0.78, -r * 0.2], [0, -r * 0.2]]);
    g.fill();
    g.fillStyle = "#1a126048";
    hpath(g, [[0, -r * 0.2], [r * 0.78, -r * 0.2], [0, r]]);
    g.fill();
    g.strokeStyle = "#ffffffb0";
    g.lineWidth = Math.max(0.6, s * 0.05);
    hpath(g, [[0, -r], [r * 0.78, -r * 0.2], [0, r], [-r * 0.78, -r * 0.2]]);
    g.stroke();
    g.beginPath();
    g.moveTo(-r * 0.78, -r * 0.2);
    g.lineTo(r * 0.78, -r * 0.2);
    g.moveTo(0, -r);
    g.lineTo(0, r);
    g.globalAlpha = al * 0.45;
    g.stroke();
    g.restore();
  }
  // Totenkopf (Rundensieg): on = Kristall-Verlauf mit Glow, sonst nur dunkler Umriss
  skull(g, x, y, s, on, P, rot = 0) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    const shape = () => {
      g.beginPath();
      g.moveTo(-s * 0.24, s * 0.5);
      g.lineTo(-s * 0.24, s * 0.3);
      g.bezierCurveTo(-s * 0.54, s * 0.14, -s * 0.5, -s * 0.54, 0, -s * 0.54);
      g.bezierCurveTo(s * 0.5, -s * 0.54, s * 0.54, s * 0.14, s * 0.24, s * 0.3);
      g.lineTo(s * 0.24, s * 0.5);
      g.closePath();
    };
    const eyes = (fill) => {
      for (const e of [-1, 1]) {
        g.beginPath();
        g.ellipse(e * s * 0.2, -s * 0.07, s * 0.13, s * 0.15, 0, 0, PI2);
        fill ? g.fill() : g.stroke();
      }
      g.beginPath();
      g.moveTo(0, s * 0.08);
      g.lineTo(-s * 0.06, s * 0.21);
      g.lineTo(s * 0.06, s * 0.21);
      g.closePath();
      fill ? g.fill() : g.stroke();
    };
    if (on) {
      g.shadowColor = P.glow;
      g.shadowBlur = s * 0.55;
      const gr = g.createLinearGradient(0, -s * 0.54, 0, s * 0.5);
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(0.55, P.a);
      gr.addColorStop(1, P.b);
      g.fillStyle = gr;
      shape();
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "#04051a";
      eyes(true);
      // Zähne
      g.strokeStyle = "#04051a";
      g.lineWidth = Math.max(0.7, s * 0.05);
      g.beginPath();
      for (const tx of [-0.08, 0.08]) {
        g.moveTo(tx * s, s * 0.33);
        g.lineTo(tx * s, s * 0.5);
      }
      g.stroke();
    } else {
      g.globalAlpha = 0.6;
      g.strokeStyle = ICE_DIM;
      g.lineWidth = 1;
      shape();
      g.stroke();
      eyes(false);
    }
    g.restore();
  }
  // Ensō: offener Pinselkreis, u = Fortschritt 0..1
  enso(g, cx, cy, rx, ry, u, col, wMax, al = 1, a0 = -2.2) {
    const N = 46,
      n = Math.floor(N * hclamp(u, 0, 1));
    g.save();
    g.lineCap = "round";
    g.strokeStyle = col;
    for (let s = 0; s < n; s++) {
      const a = a0 + (s / N) * PI2 * 0.93,
        b = a0 + ((s + 1.6) / N) * PI2 * 0.93,
        k = s / N,
        w = wMax * (0.25 + 0.75 * Math.pow(1 - k, 0.8)) * (0.85 + 0.3 * hn(s));
      g.globalAlpha = al * (0.55 + 0.45 * (1 - k));
      g.lineWidth = w;
      g.beginPath();
      g.ellipse(
        cx,
        cy,
        rx + (hn(s + 9) - 0.5) * 2,
        ry + (hn(s + 4) - 0.5) * 2,
        0,
        a,
        b,
      );
      g.stroke();
    }
    g.restore();
  }
  // Pinselstrich (ausgefranst, mit Trockenpinsel-Auslauf), von (0,0) nach rechts
  brush(g, w, h, col, al) {
    g.save();
    g.globalAlpha = al;
    g.fillStyle = col;
    g.beginPath();
    const N = 26;
    for (let k = 0; k <= N; k++) {
      const u = k / N,
        yy =
          -h / 2 +
          (hn(k) - 0.5) * h * 0.16 +
          (u > 0.86 ? (u - 0.86) * h * 1.4 : 0);
      k ? g.lineTo(u * w, yy) : g.moveTo(0, yy);
    }
    for (let k = N; k >= 0; k--) {
      const u = k / N,
        yy =
          h / 2 +
          (hn(k + 40) - 0.5) * h * 0.18 -
          (u > 0.86 ? (u - 0.86) * h * 1.4 : 0);
      g.lineTo(u * w, yy);
    }
    g.closePath();
    g.fill();
    g.globalAlpha = al * 0.6;
    for (let s = 0; s < 5; s++) {
      const yy = -h * 0.32 + s * h * 0.16;
      g.fillRect(w * 0.78, yy, w * (0.12 + 0.12 * hn(s + 70)), 1.1);
    }
    g.restore();
  }
  // Tusche-Platte: verläuft nach innen ins Nichts, mit Wellenmuster und Gold-Haarlinien oben/unten
  plate(g, x0, y0, x1, y1, sk, t, seed, alarm = 0) {
    g.save();
    hpath(g, [
      [x0, y0],
      [x1, y0],
      [x1 - sk, y1],
      [x0, y1],
    ]);
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, "#080a1cf0");
    gr.addColorStop(0.6, "#080a1cc0");
    gr.addColorStop(1, "#080a1c00");
    g.fillStyle = gr;
    g.fill();
    g.clip();
    const wp = this.pattern(g);
    if (wp) {
      g.fillStyle = wp;
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
    const u = (t * 0.004 + seed * 0.5) % 1.8;
    if (u < 1) {
      const gx = x0 + u * (x1 - x0),
        gl = g.createLinearGradient(gx - 40, 0, gx + 40, 0);
      gl.addColorStop(0, "#fff0");
      gl.addColorStop(0.5, "#c9d4ff1c");
      gl.addColorStop(1, "#fff0");
      g.fillStyle = gl;
      g.fillRect(gx - 40, y0, 80, y1 - y0);
    }
    g.restore();
    const hl = g.createLinearGradient(x0, 0, x1, 0);
    hl.addColorStop(
      0,
      alarm > 0 ? `rgba(190,170,255,${0.5 + 0.5 * alarm})` : ICE,
    );
    hl.addColorStop(1, "#b9c4ff00");
    g.fillStyle = hl;
    g.fillRect(x0, y0, x1 - x0, 1);
    g.fillRect(x0, y1, x1 - x0 - sk, 1);
  }
  // ---------- Lebensbalken (lokale Koordinaten, P2 wird gespiegelt) ----------
  hpBar(g, i, p, lag, t, alarm) {
    const P = HPAL[i],
      { x, y, w, h, sk } = HB,
      al = alarm > 0;
    // Doppelrahmen (Klinge)
    g.save();
    g.lineWidth = 1;
    g.strokeStyle = al ? `rgba(190,170,255,${0.55 + 0.45 * alarm})` : ICE;
    g.shadowColor = al ? "#d9b8ff" : P.glow;
    g.shadowBlur = 6 + 4 * Math.sin(t * 0.08 + i * 2);
    para(g, x - 2, y - 2, w + 4, h + 4, sk);
    g.stroke();
    g.shadowBlur = 0;
    g.globalAlpha = 0.5;
    g.strokeStyle = ICE_DIM;
    para(g, x - 5, y - 5, w + 10, h + 10, sk);
    g.stroke();
    g.globalAlpha = 1;
    dia(g, x - 10, y + h / 2, 2.4);
    g.fillStyle = al ? "#d9b8ff" : ICE;
    g.fill();
    // Skala: 30 Haarstriche, jeder 3. länger
    g.strokeStyle = ICE_DIM;
    g.globalAlpha = 0.85;
    g.lineWidth = 0.8;
    for (let k = 0; k <= 30; k++) {
      const bx = x + (w * k) / 30,
        major = k % 3 === 0;
      g.beginPath();
      g.moveTo(bx + 1, y + h + 8);
      g.lineTo(bx - 0.3, y + h + (major ? 13 : 11));
      g.stroke();
    }
    g.restore();
    // Mulde
    g.save();
    para(g, x, y, w, h, sk);
    const tg = g.createLinearGradient(0, y, 0, y + h);
    tg.addColorStop(0, "#04051a");
    tg.addColorStop(1, "#0a0c2a");
    g.fillStyle = tg;
    g.fill();
    g.clip();
    if (lag > p + 0.002) {
      const lg = g.createLinearGradient(x, 0, x + w * lag + sk, 0);
      lg.addColorStop(0, "#3a2f8a");
      lg.addColorStop(1, "#cfc4ff");
      g.globalAlpha = 0.85 + 0.15 * Math.sin(t * 1.3);
      g.fillStyle = lg;
      para(g, x, y, w * lag, h, sk);
      g.fill();
      g.globalAlpha = 1;
    }
    if (p > 0.001) {
      const fw = w * p,
        fg = g.createLinearGradient(x, 0, x + fw + sk, 0);
      fg.addColorStop(0, P.b);
      fg.addColorStop(0.75, P.a);
      fg.addColorStop(1, P.hi);
      g.fillStyle = fg;
      para(g, x, y, fw, h, sk);
      g.fill();
      g.save();
      para(g, x, y, fw, h, sk);
      g.clip();
      const sh = g.createLinearGradient(0, y, 0, y + h);
      sh.addColorStop(0, "#ffffff80");
      sh.addColorStop(0.3, "#ffffff10");
      sh.addColorStop(0.6, "#00000000");
      sh.addColorStop(1, "#00000070");
      g.fillStyle = sh;
      g.fillRect(x, y, fw + sk, h);
      for (let fx = x - h; fx < x + fw + h; fx += 11) {
        g.fillStyle = ((fx / 11) | 0) % 2 ? "#ffffff14" : "#00000020";
        g.beginPath();
        g.moveTo(fx, y + h);
        g.lineTo(fx + h, y);
        g.lineTo(fx + h + 5.5, y);
        g.lineTo(fx + 5.5, y + h);
        g.closePath();
        g.fill();
      }
      const sc = ((t * 0.014 + i * 0.4) % 1.9) * (fw + 80) - 40,
        sg = g.createLinearGradient(sc - 18, 0, sc + 18, 0);
      sg.addColorStop(0, "#fff0");
      sg.addColorStop(0.5, "#ffffff80");
      sg.addColorStop(1, "#fff0");
      g.fillStyle = sg;
      g.fillRect(sc - 18, y, 36, h);
      const sc2 = ((t * 0.009 + i * 0.7 + 0.5) % 1.9) * (fw + 80) - 40,
        sg2 = g.createLinearGradient(sc2 - 8, 0, sc2 + 8, 0);
      sg2.addColorStop(0, "#fff0");
      sg2.addColorStop(0.5, "#ffffffd0");
      sg2.addColorStop(1, "#fff0");
      g.fillStyle = sg2;
      g.fillRect(sc2 - 8, y, 16, h);
      if (p < 0.28) {
        g.globalAlpha = alarm * 0.5;
        g.fillStyle = "#9b7bff";
        g.fillRect(x, y, fw + sk, h);
        g.globalAlpha = 1;
      }
      g.restore();
    }
    g.strokeStyle = "#05061ac0";
    g.lineWidth = 1;
    for (let k = 1; k < 10; k++) {
      const f = k / 10;
      g.beginPath();
      g.moveTo(x + sk + w * f, y);
      g.lineTo(x + w * f, y + h);
      g.stroke();
    }
    if (this.hitFlash[i] > 0) {
      g.globalAlpha = this.hitFlash[i] * 0.85;
      g.fillStyle = "#fff";
      g.fillRect(x - 4, y, w + sk + 8, h);
      g.globalAlpha = 1;
    }
    g.restore();
    // Funke an der Spitze (vierzackiger Stern)
    if (p > 0.01 && p < 0.995) {
      const ex = x + sk * 0.5 + w * p,
        ey = y + h / 2,
        pz = 1.15 + 0.6 * Math.sin(t * 0.3 + i * 2);
      g.save();
      g.globalCompositeOperation = "lighter";
      g.strokeStyle = P.hi;
      g.shadowColor = P.glow;
      g.shadowBlur = 8;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(ex - 9 * pz, ey);
      g.lineTo(ex + 9 * pz, ey);
      g.moveTo(ex, ey - 8 * pz);
      g.lineTo(ex, ey + 8 * pz);
      g.stroke();
      g.globalAlpha = 0.7;
      g.beginPath();
      g.arc(ex, ey, 2, 0, PI2);
      g.fillStyle = "#fff";
      g.fill();
      g.restore();
    }
  }
  // ---------- Portrait: Goldring mit Ticks und Siegel ----------
  portrait(g, i, f, cx, cy, r, t, alarm) {
    const P = HPAL[i],
      hf = this.hitFlash[i],
      m = i ? -1 : 1;
    g.save();
    g.beginPath();
    g.arc(cx, cy, r + 6, 0, PI2);
    const sb = g.createRadialGradient(cx, cy, r - 4, cx, cy, r + 8);
    sb.addColorStop(0, "#080a1c");
    sb.addColorStop(1, "#080a1c00");
    g.fillStyle = sb;
    g.fill();
    g.restore();
    g.save();
    g.beginPath();
    g.arc(cx, cy, r - 1.2, 0, PI2);
    g.clip();
    const bg = g.createRadialGradient(cx, cy - 6, 2, cx, cy, r);
    bg.addColorStop(0, P.d);
    bg.addColorStop(1, "#04051a");
    g.fillStyle = bg;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (!drawPortrait(g, f.char, cx, cy + 4, r * 2.05, i === 1, f.skin | 0)) {
      g.save();
      g.font = `600 ${r * 1.3}px ${SERIF}`;
      g.textAlign = "center";
      g.fillStyle = P.a;
      g.shadowColor = P.glow;
      g.shadowBlur = 10;
      g.fillText(f.char.name[0], cx, cy + r * 0.42);
      g.restore();
    }
    const tint = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    tint.addColorStop(0, P.glow + "26");
    tint.addColorStop(0.5, "#0000");
    tint.addColorStop(1, "#00000090");
    g.fillStyle = tint;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (f.state === "ko") {
      g.fillStyle = "#000000a0";
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    if (hf > 0) {
      g.globalAlpha = hf * 0.65;
      g.fillStyle = "#c9b8ff";
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.globalAlpha = 1;
    }
    if (alarm > 0) {
      g.globalAlpha = alarm * 0.25;
      g.fillStyle = "#9b7bff";
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.globalAlpha = 1;
    }
    g.restore();
    const rg = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rg.addColorStop(0, ICE_HI);
    rg.addColorStop(0.5, ICE);
    rg.addColorStop(1, ICE_DIM);
    g.save();
    g.strokeStyle = alarm > 0 ? `rgba(190,170,255,${0.6 + 0.4 * alarm})` : rg;
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(cx, cy, r, 0, PI2);
    g.stroke();
    g.lineWidth = 0.8;
    g.strokeStyle = ICE;
    g.globalAlpha = 0.8;
    g.beginPath();
    g.arc(cx, cy, r + 4.5, 0, PI2);
    g.stroke();
    g.globalAlpha = 0.45;
    g.beginPath();
    g.arc(cx, cy, r - 4, 0, PI2);
    g.stroke();
    g.globalAlpha = 0.9;
    g.strokeStyle = ICE;
    for (let k = 0; k < 32; k++) {
      const a = (k * PI2) / 32,
        l = k % 8 === 0 ? 5 : k % 4 === 0 ? 3.2 : 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * (r + 4.5), cy + Math.sin(a) * (r + 4.5));
      g.lineTo(
        cx + Math.cos(a) * (r + 4.5 + l),
        cy + Math.sin(a) * (r + 4.5 + l),
      );
      g.stroke();
    }
    g.restore();
    this.seal(g, cx + m * r * 0.82, cy + r * 0.9, 13, P.kan, 1, m * 0.1);
  }
  // ---------- Spieler-Block ----------
  player(g, i, f, t) {
    const { W } = this,
      P = HPAL[i],
      p = f.hp / f.maxHp,
      hf = this.hitFlash[i],
      alarm = p < 0.28 && p > 0 ? 0.35 + 0.65 * Math.sin(t * 0.35) ** 2 : 0,
      m = i ? -1 : 1,
      mx = (v) => (i ? W - v : v),
      al = i ? "right" : "left";
    const rx = (Math.random() - 0.5) * hf * hf * 5,
      ry = (Math.random() - 0.5) * hf * hf * 3;
    g.save();
    g.translate(rx, ry);
    g.save();
    if (i) {
      g.translate(W, 0);
      g.scale(-1, 1);
    }
    this.hpBar(g, i, p, this.lag[i], t, alarm);
    g.restore();
    this.portrait(g, i, f, mx(50), 46, 27, t, alarm);
    // Name: feine Serife, weite Laufweite, hauchdünne Linie mit Raute dahinter
    const nx = mx(HB.x + 4),
      ny = 63,
      nm = f.char.name;
    g.save();
    g.font = `500 17px ${SERIF}`;
    g.textAlign = al;
    if ("letterSpacing" in g) g.letterSpacing = "4px";
    g.lineJoin = "round";
    const ng = g.createLinearGradient(0, ny - 12, 0, ny + 2);
    ng.addColorStop(0, "#ffffff");
    ng.addColorStop(1, ICE_HI);
    g.fillStyle = ng;
    g.shadowColor = P.glow;
    g.shadowBlur = 6;
    g.fillText(nm, nx, ny);
    const nm0 = g.measureText(nm),
      nwd = nm0 ? nm0.width : nm.length * 11,
      nsx = (i ? nx - nwd : nx) + nwd * (((t * 0.02 + i * 0.5) % 2.4) - 0.7),
      nsg = g.createLinearGradient(nsx - 22, 0, nsx + 22, 0);
    nsg.addColorStop(0, "#fff0");
    nsg.addColorStop(0.5, "#ffffff");
    nsg.addColorStop(1, "#fff0");
    g.shadowBlur = 0;
    g.globalCompositeOperation = "lighter";
    g.fillStyle = nsg;
    g.fillText(nm, nx, ny);
    g.globalCompositeOperation = "source-over";
    const nw = g.measureText(nm);
    g.restore();
    const ex = nx + m * ((nw ? nw.width : nm.length * 11) + 8);
    g.save();
    const lg = g.createLinearGradient(ex, 0, ex + m * 70, 0);
    lg.addColorStop(0, ICE);
    lg.addColorStop(1, "#b9c4ff00");
    g.fillStyle = lg;
    g.fillRect(Math.min(ex, ex + m * 70), ny - 4.5, 70, 0.9);
    dia(g, ex, ny - 4, 2.2);
    g.fillStyle = P.a;
    g.shadowColor = P.glow;
    g.shadowBlur = 6;
    g.fill();
    g.restore();
    // Rundensiege: Totenköpfe (gewonnen = leuchtend, noch offen = dunkle Umrisse)
    for (let k = 0; k < ROUND.wins; k++) {
      const on = k < f.wins,
        px = mx(HB.x + HB.w - 10 - k * 22);
      this.skull(g, px, 60, 19, on, P, m * (k ? 0.05 : -0.06));
    }
    g.restore();
  }
  // ---------- Timer: feine Ring-Uhr ----------
  timer(g, game, t) {
    const { W } = this,
      cx = W / 2,
      cy = 42,
      sec = Math.max(0, Math.ceil(game.timeFrames / 60)),
      frac = hclamp(game.timeFrames / (ROUND.time * 60), 0, 1),
      low = sec <= 10 && game.phase === "fight",
      pu = low ? 1 + 0.05 * Math.sin(t * 0.5) : 1,
      col = low ? "#d9b8ff" : "#8fe9ff";
    g.save();
    g.translate(cx, cy);
    g.scale(pu, pu);
    g.save();
    for (const s of [-1, 1]) {
      const lg = g.createLinearGradient(s * 38, 0, s * 80, 0);
      lg.addColorStop(0, ICE);
      lg.addColorStop(1, "#b9c4ff00");
      g.strokeStyle = lg;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(s * 38, 0);
      g.lineTo(s * 80, 0);
      g.stroke();
      dia(g, s * 42, 0, 2);
      g.fillStyle = ICE;
      g.fill();
    }
    g.restore();
    const ig = g.createRadialGradient(0, -6, 2, 0, 0, 30);
    ig.addColorStop(0, "#14163a");
    ig.addColorStop(1, "#04051a");
    g.save();
    g.shadowColor = "#000";
    g.shadowBlur = 14;
    g.fillStyle = ig;
    g.beginPath();
    g.arc(0, 0, 27, 0, PI2);
    g.fill();
    g.restore();
    const rg = g.createLinearGradient(0, -30, 0, 30);
    rg.addColorStop(0, ICE_HI);
    rg.addColorStop(0.5, ICE);
    rg.addColorStop(1, ICE_DIM);
    g.strokeStyle = rg;
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, 28, 0, PI2);
    g.stroke();
    g.lineWidth = 0.7;
    g.globalAlpha = 0.55;
    g.strokeStyle = ICE;
    g.beginPath();
    g.arc(0, 0, 22.5, 0, PI2);
    g.stroke();
    g.globalAlpha = 1;
    // 60 Haarstriche (verbleibende Zeit leuchtet)
    for (let k = 0; k < 60; k++) {
      const a = (k * PI2) / 60 - Math.PI / 2,
        major = k % 5 === 0,
        lit = k / 60 < frac,
        r0 = major ? 31.5 : 33,
        r1 = 36;
      g.strokeStyle = lit ? (major ? "#fff" : col) : ICE_DIM;
      g.globalAlpha = lit ? 0.95 : 0.55;
      g.lineWidth = major ? 1.1 : 0.7;
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.stroke();
    }
    g.globalAlpha = 1;
    if (frac > 0.002) {
      g.save();
      g.lineCap = "round";
      g.shadowColor = col;
      g.shadowBlur = 6;
      g.strokeStyle = col;
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, 25, -Math.PI / 2, -Math.PI / 2 + PI2 * frac);
      g.stroke();
      g.restore();
    }
    if (low) {
      g.save();
      const u = (t * 0.04) % 1;
      g.globalAlpha = (1 - u) * 0.5;
      g.strokeStyle = "#d9b8ff";
      g.lineWidth = 1;
      g.beginPath();
      g.arc(0, 0, 37 + u * 20, 0, PI2);
      g.stroke();
      g.restore();
    }
    g.restore();
    this.fancy(
      g,
      String(sec).padStart(2, "0"),
      cx,
      cy + 8 * pu,
      23 * pu,
      low ? ["#fff", "#e6d4ff"] : ["#ffffff", "#d9e4ff"],
      "center",
      col,
      t,
      false,
      false,
      500,
      1,
    );
    // Rundenschild: Haarlinien mit Rauten
    const ry = 90;
    g.save();
    for (const s of [-1, 1]) {
      const lg = g.createLinearGradient(cx + s * 48, 0, cx + s * 92, 0);
      lg.addColorStop(0, ICE);
      lg.addColorStop(1, "#b9c4ff00");
      g.fillStyle = lg;
      g.fillRect(Math.min(cx + s * 48, cx + s * 92), ry - 3.5, 44, 0.8);
      dia(g, cx + s * 45, ry - 3.2, 2);
      g.fillStyle = ICE;
      g.fill();
    }
    g.restore();
    this.lab(g, "ROUND " + game.round, cx + 2, ry, 9.5, ICE_HI, "center", 4);
    // Stage-Anzeige (Arcade): STAGE n / total
    const A = game.arcade;
    if (A && A.mode === "versus") {
      const th = THEMES[(game.stageIndex || 0) % THEMES.length];
      this.lab(g, "2 SPIELER · " + th.name, cx + 2, ry + 16, 9, "#b9c4ff", "center", 4);
    } else if (A && A.opponents.length) {
      this.lab(g, A.isBoss() ? "ENDGEGNER" : `STAGE ${A.stage + 1} / ${A.total}`, cx + 2, ry + 16, 9, "#b9c4ff", "center", 4, null, "500");
    }
  }
  // ---------- Hyper-Meter ----------
  hyper(g, i, f, t) {
    const { W, H } = this,
      P = HPAL[i],
      lv = Math.floor(f.meter / METER.bar),
      X0 = 30,
      SW = 76,
      GAP = 9,
      SK = 5,
      SY = H - 31,
      SH = 6,
      mx = (v) => (i ? W - v : v),
      al = i ? "right" : "left";
    g.save();
    if (i) {
      g.translate(W, 0);
      g.scale(-1, 1);
    }
    for (let k = 0; k < 3; k++) {
      const fill = hclamp((f.meter - k * METER.bar) / METER.bar, 0, 1),
        x = X0 + k * (SW + GAP),
        full = fill >= 1,
        pu = 0.5 + 0.5 * Math.sin(t * 0.25 + k);
      g.save();
      g.lineWidth = 0.9;
      g.strokeStyle = full ? P.a : "#3a3f7a";
      if (full) {
        g.shadowColor = P.glow;
        g.shadowBlur = 12 + 10 * pu;
      }
      para(g, x - 2, SY - 2, SW + 4, SH + 4, SK);
      g.stroke();
      g.restore();
      g.save();
      para(g, x, SY, SW, SH, SK);
      g.fillStyle = "#03041a";
      g.fill();
      g.clip();
      if (fill > 0) {
        const fw = SW * fill,
          fg = g.createLinearGradient(x, 0, x + fw + SK, 0);
        if (full) {
          fg.addColorStop(0, P.b);
          fg.addColorStop(0.7, P.a);
          fg.addColorStop(1, "#fff");
        } else {
          fg.addColorStop(0, "#3a3f7a");
          fg.addColorStop(1, P.a);
        }
        g.fillStyle = fg;
        para(g, x, SY, fw, SH, SK);
        g.fill();
        const sh = g.createLinearGradient(0, SY, 0, SY + SH);
        sh.addColorStop(0, "#ffffff90");
        sh.addColorStop(0.5, "#ffffff20");
        sh.addColorStop(1, "#00000000");
        g.fillStyle = sh;
        g.fillRect(x, SY, fw + SK, SH);
        for (let fx = x - SH; fx < x + fw + SH; fx += 8) {
          g.fillStyle = ((fx / 8) | 0) % 2 ? "#ffffff14" : "#00000020";
          g.beginPath();
          g.moveTo(fx, SY + SH);
          g.lineTo(fx + SH, SY);
          g.lineTo(fx + SH + 4, SY);
          g.lineTo(fx + 4, SY + SH);
          g.closePath();
          g.fill();
        }
        if (full) {
          g.globalCompositeOperation = "lighter";
          g.globalAlpha = 0.25 + 0.3 * pu;
          g.fillStyle = P.a;
          g.fillRect(x, SY, SW + SK, SH);
          g.globalAlpha = 0.8;
          const sx = x + ((t * 3 + k * 40) % (SW + 40)) - 15;
          g.fillStyle = "#fff";
          g.fillRect(sx, SY, 5, SH);
          g.shadowColor = P.glow;
          g.shadowBlur = 20 * (0.7 + 0.3 * Math.sin(t * 0.2));
          g.fillRect(x, SY, SW + SK, SH);
          g.shadowBlur = 0;
        }
      }
      g.restore();
      if (k < 2) {
        dia(g, x + SW + SK / 2 + GAP / 2, SY + SH / 2, 2.5);
        g.fillStyle = P.a;
        g.shadowColor = P.glow;
        g.shadowBlur = 6;
        g.fill();
        g.shadowBlur = 0;
      }
    }
    g.restore();
    const lx = mx(30);
    this.lab(
      g,
      "HYPER",
      lx,
      H - 41,
      10,
      lv > 0 ? P.a : "#6a6fb0",
      al,
      5,
      lv > 0 ? P.glow : null,
      "700",
    );
    // Spam-Sperre: drei Kristalle zeigen, wie oft dieselbe Taste hintereinander benutzt wurde (voll = gesperrt)
    const sp = f.spam;
    if (sp && sp.n > 0 && sp.t < SPAM.reset) {
      const locked = sp.n >= SPAM.max;
      g.save();
      for (let k = 0; k < SPAM.max; k++) {
        dia(g, mx(112 + k * 11), H - 45, 3.4);
        if (k < sp.n) {
          g.fillStyle = locked ? "#9b7bff" : P.a;
          g.shadowColor = locked ? "#9b7bff" : P.glow;
          g.shadowBlur = locked ? 8 : 4;
          g.fill();
        } else {
          g.strokeStyle = ICE_DIM;
          g.lineWidth = 0.9;
          g.stroke();
        }
      }
      g.restore();
    }
    if (lv > 0) {
      const on = lv < 3 || Math.sin(t * 0.25) > -0.3;
      if (on)
        this.lab(
          g,
          KAN[lv],
          mx(30 + 3 * SW + 2 * GAP + SK),
          H - 40,
          16,
          lv >= 3 ? "#fff" : P.a,
          i ? "left" : "right",
          0,
          lv >= 3 ? NEON_PUR : P.glow,
          "800",
        );
    }
    if (!i && lv > 0) {
      const on = Math.sin(t * 0.3) > -0.2,
        kx = 30,
        ky = H - 80;
      g.save();
      g.globalAlpha = on ? 1 : 0.5;
      g.strokeStyle = P.a;
      g.lineWidth = 1.5;
      g.shadowColor = P.glow;
      g.shadowBlur = 12;
      g.fillStyle = "#080a24";
      g.beginPath();
      g.roundRect ? g.roundRect(kx, ky, 18, 18, 3) : g.rect(kx, ky, 18, 18);
      g.fill();
      g.stroke();
      g.restore();
      g.save();
      g.globalAlpha = on ? 1 : 0.5;
      this.lab(g, "I", kx + 9, ky + 13, 12, "#fff", "center", 0, null, "800");
      this.lab(
        g,
        "HYPER READY",
        kx + 28,
        ky + 13,
        11,
        P.a,
        "left",
        4,
        P.glow,
        "700",
      );
      g.restore();
    }
  }
  // ---------- Hauptzeichnung ----------
  draw(g, game) {
    const { W, H } = this,
      [a, b] = game.fighters,
      t = game.frame,
      fs = [a, b];
    fs.forEach((f, i) => {
      const p = f.hp / f.maxHp;
      if (p < this.prev[i] - 0.001) {
        this.hitFlash[i] = 1;
        this.hold[i] = 22;
      }
      this.prev[i] = p;
      this.hitFlash[i] = Math.max(0, this.hitFlash[i] - 0.07);
      if (this.hold[i] > 0) this.hold[i]--;
      else this.lag[i] = Math.max(p, this.lag[i] - 0.006);
      if (this.lag[i] < p) this.lag[i] = p;
    });
    g.save();
    const tg = g.createLinearGradient(0, 0, 0, 130);
    tg.addColorStop(0, "rgba(4,6,24,.82)");
    tg.addColorStop(1, "rgba(4,6,24,0)");
    g.fillStyle = tg;
    g.fillRect(0, 0, W, 130);
    const bg = g.createLinearGradient(0, H - 110, 0, H);
    bg.addColorStop(0, "rgba(4,6,24,0)");
    bg.addColorStop(1, "rgba(4,6,24,.78)");
    g.fillStyle = bg;
    g.fillRect(0, H - 110, W, 110);
    g.restore();
    if (game.phase === "ko" && !game.timedOut)
      this.letterbox(
        g,
        hclamp(game.pf / 14, 0, 1) * (1 - hclamp((game.pf - 132) / 18, 0, 1)),
      );
    else if (game.phase === "result" && !game.timedOut)
      this.letterbox(g, 1 - hclamp(game.pf / 14, 0, 1));
    if (!game.melee) {
      fs.forEach((f, i) => this.player(g, i, f, t));
      this.timer(g, game, t);
    }
    fs.forEach((f, i) => this.hyper(g, i, f, t));
    if (b.input && b.input.P) {
      const nm = "KI · " + b.input.P.name.toUpperCase();
      g.save();
      const lg = g.createLinearGradient(W - 150, 0, W - 22, 0);
      lg.addColorStop(0, "#b9c4ff00");
      lg.addColorStop(1, ICE);
      g.fillStyle = lg;
      g.fillRect(W - 150, 96, 128, 0.8);
      g.restore();
      this.lab(g, nm, W - 24, 92, 9, "#b9c4ff", "right", 3);
    }
    if (game.arcade && game.arcade.mode === "versus") {
      this.lab(g, "SPIELER 1", 24, 92, 9, "#7df3ff", "left", 3);
      this.lab(g, "SPIELER 2", W - 24, 92, 9, "#c9a0ff", "right", 3);
    }
    this.combos(g, game, t);
    this.banners(g, game, t);
  }
  // ---------- Combo-Zähler (clean, ohne Boxen) ----------
  combos(g, game, t) {
    const { W } = this;
    game.fighters.forEach((v, i) => {
      const att = i ? 0 : 1,
        c =
          v.comboHits >= 2
            ? { hits: v.comboHits, dmg: v.comboDmg }
            : v.comboShow.t > 0 && v.comboShow.hits >= 2
              ? v.comboShow
              : null;
      if (!c) {
        this.prevHits[i] = 0;
        return;
      }
      if (c.hits > this.prevHits[i]) {
        this.pop[i] = 1;
        game.shake = Math.max(game.shake, EFFECT.comboShake);
      }
      this.prevHits[i] = c.hits;
      this.pop[i] = Math.max(0, this.pop[i] - 0.07);
      const dir = att === 0 ? 1 : -1,
        x = att === 0 ? 44 : W - 44,
        al = att === 0 ? "left" : "right",
        pp = this.pop[i],
        sc = 1 + pp * 0.4,
        cc = comboCol(c.hits),
        fade = v.comboHits >= 2 ? 1 : hclamp(v.comboShow.t / 25, 0, 1),
        y = 190;
      const ox = (Math.random() - 0.5) * pp * 8,
        oy = (Math.random() - 0.5) * pp * 6,
        num = String(c.hits),
        nw = this.mw(g, num, 46, 500);
      g.save();
      g.globalAlpha = fade;
      g.translate(x + ox, y + oy);
      g.scale(sc, sc);
      g.rotate(-dir * 0.04);
      g.translate(-x, -y);
      // Combo-Zahl – keine Box, nur Glow-Text
      this.big(g, num, x, y, 46, cc, al, cc[1], t, false, 1 + pp * 2, 500);
      this.sparks(g, x + (dir * nw) / 2, y - 16, nw / 2 + 20, 22, t, 2 + Math.min(3, c.hits >> 2), 21 + i, cc[1]);
      const hx = x + dir * (nw + 10),
        lbl = c.hits >= 10 ? "HIT COMBO" : "HITS";
      this.fancy(
        g,
        lbl,
        hx,
        y - 18,
        11,
        ["#fff", ICE_HI],
        al,
        null,
        t,
        false,
        false,
        600,
        4,
      );
      // Rang (GOOD! GREAT! EXCELLENT! ...)
      const rk = RANKS.find((r) => c.hits >= r[0]);
      if (rk) {
        const rs = 13 + Math.min(3, c.hits * 0.15),
          ry = y + 31;
        this.glitz(
          g,
          rk[1],
          x,
          ry,
          rs,
          c.hits >= 16 ? ["#fff", "#cdb4ff"] : ["#fff", "#bfe9ff"],
          t,
          al,
          3,
          11 + i,
        );
      }
      // Schaden (ohne Diamanten-Skala, ohne "DMG"-Box)
      const dv = String(c.dmg);
      this.fancy(
        g,
        dv,
        x,
        y + 52,
        12,
        ["#fff", ICE_HI],
        al,
        null,
        t,
        false,
        false,
        600,
        1,
      );
      g.restore();
    });
  }
  // ---------- Banner / Phasen ----------
  // Haarlinie (nur noch vereinzelt genutzt; Ausrufe haben keine Rahmen mehr)
  hair(g, y, u, col = ICE, h = 1) {
    const { W } = this;
    g.save();
    const w = W * 0.6 * hclamp(u, 0, 1),
      gr = g.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
    gr.addColorStop(0, col + "00");
    gr.addColorStop(0.5, col);
    gr.addColorStop(1, col + "00");
    g.fillStyle = gr;
    g.fillRect(W / 2 - w / 2, y - h / 2, w, h);
    g.restore();
  }
  streak(g, y, u, col, h = 1) {
    this.hair(g, y, u, col, h);
  }
  letterbox(g, k) {
    const { W, H } = this,
      h = 44 * k;
    if (h <= 0) return;
    g.save();
    g.fillStyle = "#03041a";
    g.fillRect(0, 0, W, h);
    g.fillRect(0, H - h, W, h);
    const gl = g.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, "#b9c4ff00");
    gl.addColorStop(0.5, ICE);
    gl.addColorStop(1, "#b9c4ff00");
    g.fillStyle = gl;
    g.fillRect(0, h, W, 1);
    g.fillRect(0, H - h - 1, W, 1);
    g.restore();
  }
  banners(g, game, t) {
    const { W, H } = this,
      ph = game.phase,
      pf = game.pf;
    if (ph === "intro") {
      if (pf < 72) {
        const u = hclamp(pf / 18, 0, 1),
          e = easeOutBack(u),
          out = pf > 58 ? hclamp((pf - 58) / 14, 0, 1) : 0,
          dir = game.round % 2 ? -1 : 1;
        g.save();
        g.globalAlpha = 1 - out;
        g.translate(W / 2 + dir * (1 - e) * 500 + out * -dir * 400, 251);
        g.scale(1 + (1 - e) * 0.2, 1 + (1 - e) * 0.2);
        this.big(g, game.melee ? "MELEE" : "ROUND " + game.round, 0, 0, 34, ["#ffffff", "#9fe8ff"], "center", "#8f7bff", t, false, 1, 500, 8);
        this.sparks(g, 0, -12, 100, 16, t, 4, 31);
        g.restore();
      } else {
        const u = hclamp((pf - 72) / 14, 0, 1),
          e = easeOutBack(u),
          sc = 1.6 - 0.6 * e;
        if (pf < 84) {
          g.fillStyle = `rgba(200,225,255,${(1 - (pf - 72) / 12) * 0.25})`;
          g.fillRect(0, 0, W, H);
        }
        // Kristallsplitter-Strahlen (ohne Ring/Rahmen)
        g.save();
        g.globalCompositeOperation = "lighter";
        g.strokeStyle = "#9fe8ff";
        g.lineWidth = 0.9;
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * PI2 + 0.1,
            r0 = 50 + u * 90,
            r1 = r0 + 20 + u * 90;
          g.globalAlpha = (1 - u) * 0.5;
          g.beginPath();
          g.moveTo(W / 2 + Math.cos(a) * r0, 258 + Math.sin(a) * r0 * 0.5);
          g.lineTo(W / 2 + Math.cos(a) * r1, 258 + Math.sin(a) * r1 * 0.5);
          g.stroke();
        }
        g.restore();
        g.save();
        g.translate(W / 2, 266);
        g.scale(sc, sc);
        this.big(g, "FIGHT!", 0, 0, 48, ["#ffffff", "#bfe9ff"], "center", "#7b6bff", t, false, 1 + (1 - u) * 2, 600, 4);
        this.sparks(g, 0, -16, 110, 22, t, 6, 33, "#bfe9ff");
        g.restore();
      }
    }
    if (ph === "ko" && !game.timedOut) {
      if (pf < 12) {
        g.fillStyle = `rgba(215,230,255,${(1 - pf / 12) * 0.5})`;
        g.fillRect(0, 0, W, H);
      }
      const e = easeOutBack(hclamp(pf / 10, 0, 1)),
        jx = pf < 40 ? (Math.random() - 0.5) * 4 : 0,
        txt = game.melee ? "GAME!" : "K.O.";
      g.save();
      g.translate(W / 2 + jx, 270);
      g.scale(0.5 + 0.5 * e, 0.5 + 0.5 * e);
      // Kristall-Brechung: zwei versetzte Schichten, dann die Hauptschrift ohne Rahmen
      g.globalCompositeOperation = "lighter";
      this.fancy(g, txt, -2, 0, 68, ["#b98bff", "#b98bff"], "center", null, t, false, true, 700, 3);
      this.fancy(g, txt, 2, 0, 68, ["#6fe3ff", "#6fe3ff"], "center", null, t, false, true, 700, 3);
      g.globalCompositeOperation = "source-over";
      this.fancy(g, txt, 0, 0, 68, ["#ffffff", "#9fe8ff"], "center", "#8f7bff", t, false, false, 700, 3);
      this.sparks(g, 0, -24, 90, 28, t, 6, 35);
      g.restore();
    }
    if (ph === "result") {
      const e = easeOutBack(hclamp(pf / 16, 0, 1)),
        nm = game.winner ? game.winner.char.name + " WINS" : "DRAW";
      g.save();
      g.translate(W / 2, 158);
      g.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e);
      this.glitz(g, nm, 0, 0, 22, ["#ffffff", "#9fe8ff"], t, "center", 4, 3);
      if (game.timedOut)
        this.lab(g, "TIME UP", 0, 20, 11, "#cfd8ff", "center", 6, "#7b6bff", "600");
      g.restore();
    }
    const A = game.arcade;
    if (ph === "match" && A && A.state !== "fight") {
      const e = easeOutBack(hclamp(A.t / 20, 0, 1)),
        st = A.state,
        bad = st === "gameover",
        title =
          st === "clear"
            ? "STAGE CLEAR"
            : st === "victory"
              ? "ARCADE GESCHAFFT"
              : st === "vsover"
                ? "SPIELER " + (game.fighters[0].wins > game.fighters[1].wins ? 1 : 2) + " GEWINNT"
                : "GAME OVER",
        sub =
          st === "clear"
            ? (A.isBoss(A.stage + 1) ? "ENDGEGNER:  " : "NÄCHSTER GEGNER:  ") + A.opponentName(A.stage + 1)
            : st === "victory"
              ? (A.newUnlock ? "NEUER KÄMPFER FREIGESCHALTET:  " + CHARACTERS[A.newUnlock].name : "Du hast alle Gegner besiegt!")
              : st === "vsover"
                ? (game.fighters[0].wins > game.fighters[1].wins ? game.fighters[0] : game.fighters[1]).char.name + " besiegt " + (game.fighters[0].wins > game.fighters[1].wins ? game.fighters[1] : game.fighters[0]).char.name + "   ·   " + game.fighters[0].wins + " : " + game.fighters[1].wins
                : "Gegner:  " + A.opponentName(),
        pr =
          st === "clear"
            ? "ENTER  weiter"
            : st === "victory"
              ? "ENTER  Charakterwahl"
              : st === "vsover"
                ? "ENTER  Revanche   ·   ESC  Kämpferwahl"
                : "ENTER  nochmal   ·   ESC  Charakterwahl";
      g.save();
      g.translate(W / 2, 158);
      g.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e);
      this.glitz(g, title, 0, 0, st === "victory" ? 20 : 24, bad ? ["#ffffff", "#b79cff"] : ["#ffffff", "#9fe8ff"], t, "center", 4, 5);
      this.lab(g, sub, 0, 24, 11, bad ? "#d9ccff" : "#d6e4ff", "center", 3, bad ? "#8f7bff" : "#6fe3ff", "600");
      g.restore();
      if (Math.sin(t * 0.15) > -0.2)
        this.lab(g, pr, W / 2, 218, 11, "#9fe8ff", "center", 4, "#8f7bff", "600");
    } else if (ph === "match") {
      const w = game.fighters.find((f) => f.wins >= ROUND.wins),
        e = easeOutBack(hclamp(pf / 20, 0, 1)),
        P = HPAL[game.fighters.indexOf(w)];
      g.save();
      g.translate(W / 2, 160);
      g.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e);
      this.glitz(g, w.char.name + " WINS THE MATCH", 0, 0, 20, ["#ffffff", "#bfe9ff"], t, "center", 3, 7);
      g.restore();
      if (Math.sin(t * 0.15) > -0.2)
        this.lab(g, "ENTER  ·  REMATCH", W / 2, 206, 11, "#cfd8ff", "center", 5, P.glow, "600");
    }
  }
  // ---------- Super-Cinematic ----------
  flash(g, game) {
    if (game.superFlash <= 0) return;
    const { W, H } = this,
      t = game.superFlash / 42,
      f = game.superOwner,
      col = HPAL[Math.max(0, game.fighters.indexOf(f)) % 2].glow,
      [ox, oy] = game.camera.toScreen(f.x, f.y - 80);
    g.save();
    g.fillStyle = `rgba(6,6,28,${0.72 * Math.min(1, t * 2)})`;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = col;
    g.lineWidth = 1.2;
    g.globalAlpha = 0.5 * t;
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * PI2 + game.frame * 0.02;
      g.beginPath();
      g.moveTo(ox + Math.cos(a) * 60, oy + Math.sin(a) * 60);
      g.lineTo(ox + Math.cos(a) * 1000, oy + Math.sin(a) * 1000);
      g.stroke();
    }
    g.globalAlpha = 0.3 * t;
    g.fillStyle = col;
    for (let k = 0; k < 5; k++) {
      const yy = 110 + k * 52 + ((game.frame * 14) % 52);
      g.fillRect(0, yy % H, W, 2);
    }
    g.restore();
    this.letterbox(g, hclamp((1 - t) * 6, 0, 1) * hclamp(t * 4, 0, 1));
    const e = easeOutBack(hclamp((1 - t) * 5, 0, 1));
    g.save();
    g.translate(W / 2, 160);
    g.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e);
    this.big(g, game.superName ? game.superName.toUpperCase() : "HYPER " + f.char.name + " BEAM", 0, 0, 26, ["#ffffff", "#bfe9ff"], "center", col, game.frame, false, 1, 600, 5);
    g.restore();
  }
}
