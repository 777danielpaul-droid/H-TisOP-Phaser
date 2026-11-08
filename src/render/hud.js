import { ROUND, METER, COMBO_SCALE, EFFECT } from "../core/config.js";
import { drawPortrait } from "./sprites.js";
import { F_DISP, F_TECH, F_UI } from "./fonts.js";
import { THEMES } from "./stage.js";
// Flashy HUD (Canvas 2D, 960x540 logisch) – moderner Neon-Fighting-Look:
//  - Neon-Farben (Cyan, Magenta, Grün, Orange) statt altbackenem Gold
//  - Starker Glow + Chroma-Split für Banner und Combo-Zahlen
//  - Lebensbalken mit Gradient, Glow und Pulsing bei Treffern
//  - Timer als pulsender Ring, Combo-Zähler mit Glitch-Effekt
const SERIF = F_DISP,
  PI2 = Math.PI * 2;
const NEON_CYAN = "#00f3ff",
  NEON_MAG = "#ff00ff",
  NEON_GRN = "#00ff88",
  NEON_ORG = "#ffaa00",
  NEON_RED = "#ff3366",
  NEON_PUR = "#bb00ff";
const GOLD = "#ffd700",
  GOLD_HI = "#ffffff",
  GOLD_DIM = "#8a6d1a",
  VERM = "#ff3366";
// a = Kante/Glow, b = tiefer Verlauf, hi = Lichtpunkt, d = dunkle Tönung
const HPAL = [
  {
    a: "#00f3ff",
    b: "#0088cc",
    hi: "#ffffff",
    d: "#001a33",
    glow: "#00f3ff",
    kan: "武",
  },
  {
    a: "#ff3366",
    b: "#cc0044",
    hi: "#ffffff",
    d: "#330011",
    glow: "#ff3366",
    kan: "闘",
  },
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
    ? ["#ff3366", "#ff00ff"]
    : h >= 10
      ? ["#ffaa00", "#ffd700"]
      : h >= 5
        ? ["#00f3ff", "#00ff88"]
        : ["#ffffff", "#00f3ff"];
const KAN = ["", "壱", "弐", "参"];
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
    if (!bare) {
      g.lineWidth = Math.max(2.5, size / 12);
      g.strokeStyle = "#020104";
      g.strokeText(s, x, y);
      // zweiter, dickerer Schatten-Outline für mehr Tiefe
      g.lineWidth = Math.max(4, size / 6);
      g.strokeStyle = "#000000";
      g.strokeText(s, x, y);
    }
    if (glow) {
      g.shadowColor = glow;
      g.shadowBlur = size * 0.7;
      // doppelter Glow-Layer
      g.fillStyle = f;
      g.fillText(s, x, y);
      g.shadowBlur = size * 1.1;
      g.globalAlpha = 0.5;
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
    if (chroma) {
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.6;
      // drei Chroma-Layer für stärkeren Glitch-Effekt
      this.fancy(
        g,
        s,
        x - chroma * 1.5,
        y,
        size,
        ["#ff00ff", "#ff00ff"],
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
        ["#00f3ff", "#00f3ff"],
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
        ["#ffff00", "#ffff00"],
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
        off = 1 + 1.8 * (0.5 + 0.5 * Math.sin(t * 0.22 + i * 0.9));
      g.shadowBlur = 0;
      g.lineWidth = Math.max(3, size / 7);
      g.strokeStyle = "#020104";
      g.strokeText(c, cx, yy);
      g.save();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.55;
      g.fillStyle = "#ff00ff";
      g.fillText(c, cx - off, yy);
      g.fillStyle = "#00f3ff";
      g.fillText(c, cx + off, yy);
      g.restore();
      g.shadowColor = pal[1];
      g.shadowBlur = size * (0.5 + 0.25 * Math.sin(t * 0.2 + i));
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
  // Seigaiha-Wellen als feines Muster
  pattern(g) {
    if (this.wave) return this.wave;
    const c = document.createElement("canvas");
    c.width = 24;
    c.height = 12;
    const x = c.getContext("2d");
    x.strokeStyle = "#d8b8671c";
    x.lineWidth = 0.8;
    for (const [cx, cy] of [
      [12, 12],
      [0, 0],
      [24, 0],
    ])
      for (const r of [11, 8, 5, 2]) {
        x.beginPath();
        x.arc(cx, cy, r, 0, PI2);
        x.stroke();
      }
    return (this.wave = g.createPattern(c, "repeat"));
  }
  // Hanko-Siegel: Zinnober-Quadrat mit Kanji
  seal(g, x, y, s, ch, al = 1, rot = 0) {
    g.save();
    g.globalAlpha = al;
    g.translate(x, y);
    g.rotate(rot);
    g.shadowColor = "#ff3a2a";
    g.shadowBlur = s * 0.5;
    g.fillStyle = VERM;
    g.beginPath();
    g.roundRect
      ? g.roundRect(-s / 2, -s / 2, s, s, s * 0.14)
      : g.rect(-s / 2, -s / 2, s, s);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = "#ffd8c8";
    g.globalAlpha = al * 0.7;
    g.lineWidth = Math.max(0.7, s * 0.05);
    g.strokeRect(-s / 2 + s * 0.1, -s / 2 + s * 0.1, s * 0.8, s * 0.8);
    g.globalAlpha = al;
    g.font = `700 ${s * 0.62}px ${SERIF}`;
    g.textAlign = "center";
    g.fillStyle = "#fff0e6";
    g.fillText(ch, 0, s * 0.22);
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
    gr.addColorStop(0, "#0a0709f0");
    gr.addColorStop(0.6, "#0a0709c0");
    gr.addColorStop(1, "#0a070900");
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
      gl.addColorStop(0.5, "#f6e7b41c");
      gl.addColorStop(1, "#fff0");
      g.fillStyle = gl;
      g.fillRect(gx - 40, y0, 80, y1 - y0);
    }
    g.restore();
    const hl = g.createLinearGradient(x0, 0, x1, 0);
    hl.addColorStop(
      0,
      alarm > 0 ? `rgba(255,90,70,${0.5 + 0.5 * alarm})` : GOLD,
    );
    hl.addColorStop(1, "#d8b86700");
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
    g.strokeStyle = al ? `rgba(255,90,70,${0.55 + 0.45 * alarm})` : GOLD;
    g.shadowColor = al ? "#ff5a46" : P.glow;
    g.shadowBlur = 6 + 4 * Math.sin(t * 0.08 + i * 2);
    para(g, x - 2, y - 2, w + 4, h + 4, sk);
    g.stroke();
    g.shadowBlur = 0;
    g.globalAlpha = 0.5;
    g.strokeStyle = GOLD_DIM;
    para(g, x - 5, y - 5, w + 10, h + 10, sk);
    g.stroke();
    g.globalAlpha = 1;
    dia(g, x - 10, y + h / 2, 2.4);
    g.fillStyle = al ? "#ff5a46" : GOLD;
    g.fill();
    // Skala: 30 Haarstriche, jeder 3. länger
    g.strokeStyle = GOLD_DIM;
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
    tg.addColorStop(0, "#020102");
    tg.addColorStop(1, "#150a0c");
    g.fillStyle = tg;
    g.fill();
    g.clip();
    if (lag > p + 0.002) {
      const lg = g.createLinearGradient(x, 0, x + w * lag + sk, 0);
      lg.addColorStop(0, "#7a2408");
      lg.addColorStop(1, "#ffb340");
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
        g.fillStyle = "#ff1030";
        g.fillRect(x, y, fw + sk, h);
        g.globalAlpha = 1;
      }
      g.restore();
    }
    g.strokeStyle = "#05030cc0";
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
    sb.addColorStop(0, "#0a0709");
    sb.addColorStop(1, "#0a070900");
    g.fillStyle = sb;
    g.fill();
    g.restore();
    g.save();
    g.beginPath();
    g.arc(cx, cy, r - 1.2, 0, PI2);
    g.clip();
    const bg = g.createRadialGradient(cx, cy - 6, 2, cx, cy, r);
    bg.addColorStop(0, P.d);
    bg.addColorStop(1, "#030205");
    g.fillStyle = bg;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (!drawPortrait(g, f.char, cx, cy + 4, r * 2.05, i === 1)) {
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
      g.fillStyle = "#ff1a40";
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.globalAlpha = 1;
    }
    if (alarm > 0) {
      g.globalAlpha = alarm * 0.25;
      g.fillStyle = "#ff1030";
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      g.globalAlpha = 1;
    }
    g.restore();
    const rg = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rg.addColorStop(0, GOLD_HI);
    rg.addColorStop(0.5, GOLD);
    rg.addColorStop(1, GOLD_DIM);
    g.save();
    g.strokeStyle = alarm > 0 ? `rgba(255,80,60,${0.6 + 0.4 * alarm})` : rg;
    g.lineWidth = 1.8;
    g.beginPath();
    g.arc(cx, cy, r, 0, PI2);
    g.stroke();
    g.lineWidth = 0.8;
    g.strokeStyle = GOLD;
    g.globalAlpha = 0.8;
    g.beginPath();
    g.arc(cx, cy, r + 4.5, 0, PI2);
    g.stroke();
    g.globalAlpha = 0.45;
    g.beginPath();
    g.arc(cx, cy, r - 4, 0, PI2);
    g.stroke();
    g.globalAlpha = 0.9;
    g.strokeStyle = GOLD;
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
    g.lineWidth = 2.6;
    g.strokeStyle = "#070408";
    g.strokeText(nm, nx, ny);
    const ng = g.createLinearGradient(0, ny - 12, 0, ny + 2);
    ng.addColorStop(0, "#ffffff");
    ng.addColorStop(1, GOLD_HI);
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
    lg.addColorStop(0, GOLD);
    lg.addColorStop(1, "#d8b86700");
    g.fillStyle = lg;
    g.fillRect(Math.min(ex, ex + m * 70), ny - 4.5, 70, 0.9);
    dia(g, ex, ny - 4, 2.2);
    g.fillStyle = P.a;
    g.shadowColor = P.glow;
    g.shadowBlur = 6;
    g.fill();
    g.restore();
    // Siege: Hanko 勝 (gewonnen) bzw. dünner Goldrahmen
    for (let k = 0; k < ROUND.wins; k++) {
      const on = k < f.wins,
        px = mx(HB.x + HB.w - 8 - k * 19),
        py = 60;
      if (on) {
        this.seal(g, px, py, 15, "勝", 1, m * (k ? 0.05 : -0.06));
      } else {
        g.save();
        g.strokeStyle = GOLD_DIM;
        g.lineWidth = 0.9;
        g.setLineDash([2, 2]);
        g.strokeRect(px - 7, py - 7, 14, 14);
        g.restore();
      }
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
      col = low ? "#ff5a46" : "#7ff0d0";
    g.save();
    g.translate(cx, cy);
    g.scale(pu, pu);
    g.save();
    for (const s of [-1, 1]) {
      const lg = g.createLinearGradient(s * 38, 0, s * 80, 0);
      lg.addColorStop(0, GOLD);
      lg.addColorStop(1, "#d8b86700");
      g.strokeStyle = lg;
      g.lineWidth = 0.9;
      g.beginPath();
      g.moveTo(s * 38, 0);
      g.lineTo(s * 80, 0);
      g.stroke();
      dia(g, s * 42, 0, 2);
      g.fillStyle = GOLD;
      g.fill();
    }
    g.restore();
    const ig = g.createRadialGradient(0, -6, 2, 0, 0, 30);
    ig.addColorStop(0, "#1c1216");
    ig.addColorStop(1, "#050304");
    g.save();
    g.shadowColor = "#000";
    g.shadowBlur = 14;
    g.fillStyle = ig;
    g.beginPath();
    g.arc(0, 0, 27, 0, PI2);
    g.fill();
    g.restore();
    const rg = g.createLinearGradient(0, -30, 0, 30);
    rg.addColorStop(0, GOLD_HI);
    rg.addColorStop(0.5, GOLD);
    rg.addColorStop(1, GOLD_DIM);
    g.strokeStyle = rg;
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, 28, 0, PI2);
    g.stroke();
    g.lineWidth = 0.7;
    g.globalAlpha = 0.55;
    g.strokeStyle = GOLD;
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
      g.strokeStyle = lit ? (major ? "#fff" : col) : GOLD_DIM;
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
      g.strokeStyle = "#ff5a46";
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
      low ? ["#fff", "#ff8a7a"] : ["#ffffff", "#e6dcc0"],
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
      lg.addColorStop(0, GOLD);
      lg.addColorStop(1, "#d8b86700");
      g.fillStyle = lg;
      g.fillRect(Math.min(cx + s * 48, cx + s * 92), ry - 3.5, 44, 0.8);
      dia(g, cx + s * 45, ry - 3.2, 2);
      g.fillStyle = GOLD;
      g.fill();
    }
    g.restore();
    this.lab(g, "ROUND " + game.round, cx + 2, ry, 9.5, GOLD_HI, "center", 4);
    // Stage-Anzeige (Arcade): STAGE n / total bzw. FINAL BOSS
    const A = game.arcade;
    if (A && A.mode === "versus") {
      const th = THEMES[(game.stageIndex || 0) % THEMES.length];
      this.lab(g, "2 SPIELER · " + th.name, cx + 2, ry + 16, 9, "#c9b88a", "center", 4);
    } else if (A && A.opponents.length) {
      const boss = A.isBoss;
      this.lab(
        g,
        boss ? "FINAL BOSS" : `STAGE ${A.stage + 1} / ${A.total}`,
        cx + 2,
        ry + 16,
        9,
        boss ? "#ff8a7a" : "#c9b88a",
        "center",
        4,
        boss ? "#ff3a2a" : null,
        boss ? "700" : "500",
      );
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
      g.strokeStyle = full ? P.a : "#333";
      if (full) {
        g.shadowColor = P.glow;
        g.shadowBlur = 12 + 10 * pu;
      }
      para(g, x - 2, SY - 2, SW + 4, SH + 4, SK);
      g.stroke();
      g.restore();
      g.save();
      para(g, x, SY, SW, SH, SK);
      g.fillStyle = "#020104";
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
          fg.addColorStop(0, "#333");
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
      lv > 0 ? P.a : "#555",
      al,
      5,
      lv > 0 ? P.glow : null,
      "700",
    );
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
      g.fillStyle = "#0a050a";
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
    tg.addColorStop(0, "rgba(3,1,6,.82)");
    tg.addColorStop(1, "rgba(3,1,6,0)");
    g.fillStyle = tg;
    g.fillRect(0, 0, W, 130);
    const bg = g.createLinearGradient(0, H - 110, 0, H);
    bg.addColorStop(0, "rgba(3,1,6,0)");
    bg.addColorStop(1, "rgba(3,1,6,.78)");
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
    fs.forEach((f, i) => this.player(g, i, f, t));
    this.timer(g, game, t);
    fs.forEach((f, i) => this.hyper(g, i, f, t));
    if (b.input && b.input.P) {
      const nm = "KI · " + b.input.P.name.toUpperCase();
      g.save();
      const lg = g.createLinearGradient(W - 150, 0, W - 22, 0);
      lg.addColorStop(0, "#d8b86700");
      lg.addColorStop(1, GOLD);
      g.fillStyle = lg;
      g.fillRect(W - 150, 96, 128, 0.8);
      g.restore();
      this.lab(g, nm, W - 24, 92, 9, "#c9b88a", "right", 3);
    }
    if (game.arcade && game.arcade.mode === "versus") {
      this.lab(g, "SPIELER 1", 24, 92, 9, "#7df3ff", "left", 3);
      this.lab(g, "SPIELER 2", W - 24, 92, 9, "#ff8ae6", "right", 3);
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
        y = 206;
      const ox = (Math.random() - 0.5) * pp * 8,
        oy = (Math.random() - 0.5) * pp * 6,
        num = String(c.hits),
        nw = this.mw(g, num, 84, 500);
      g.save();
      g.globalAlpha = fade;
      g.translate(x + ox, y + oy);
      g.scale(sc, sc);
      g.rotate(-dir * 0.04);
      g.translate(-x, -y);
      // Combo-Zahl – keine Box, nur Glow-Text
      this.big(g, num, x, y, 84, cc, al, cc[1], t, false, 2 + pp * 3, 500);
      this.sparks(g, x + (dir * nw) / 2, y - 30, nw / 2 + 34, 38, t, 3 + Math.min(6, c.hits >> 1), 21 + i, cc[1]);
      const hx = x + dir * (nw + 14),
        lbl = c.hits >= 10 ? "HIT COMBO" : "HITS";
      this.fancy(
        g,
        lbl,
        hx,
        y - 34,
        15,
        ["#fff", GOLD_HI],
        al,
        null,
        t,
        false,
        false,
        600,
        6,
      );
      // Rang (GOOD! GREAT! EXCELLENT! ...)
      const rk = RANKS.find((r) => c.hits >= r[0]);
      if (rk) {
        const rs = 18 + Math.min(6, c.hits * 0.3),
          ry = y + 30;
        this.glitz(
          g,
          rk[1],
          x,
          ry,
          rs,
          c.hits >= 16 ? ["#fff", "#ff9a7a"] : ["#fff", GOLD_HI],
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
        y + 54,
        17,
        ["#fff", GOLD_HI],
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
  hair(g, y, u, col = GOLD, h = 1) {
    const { W } = this;
    g.save();
    const w = W * 0.6 * hclamp(u, 0, 1),
      gr = g.createLinearGradient(W / 2 - w / 2, 0, W / 2 + w / 2, 0);
    gr.addColorStop(0, col + "00");
    gr.addColorStop(0.5, col);
    gr.addColorStop(1, col + "00");
    g.fillStyle = gr;
    g.fillRect(W / 2 - w / 2, y - h / 2, w, h);
    if (u > 0.8) {
      dia(g, W / 2 - (w / 2) * 0.92, y, 3);
      g.fillStyle = col;
      g.fill();
      dia(g, W / 2 + (w / 2) * 0.92, y, 3);
      g.fill();
    }
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
    g.fillStyle = "#020104";
    g.fillRect(0, 0, W, h);
    g.fillRect(0, H - h, W, h);
    const gl = g.createLinearGradient(0, 0, W, 0);
    gl.addColorStop(0, "#d8b86700");
    gl.addColorStop(0.5, GOLD);
    gl.addColorStop(1, "#d8b86700");
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
        this.hair(g, 196, e);
        this.hair(g, 306, e);
        g.translate(W / 2 + dir * (1 - e) * 500 + out * -dir * 400, 251);
        g.scale(1 + (1 - e) * 0.3, 1 + (1 - e) * 0.3);
        const rg = g.createRadialGradient(0, -16, 10, 0, -16, 300);
        rg.addColorStop(0, "#05030acc");
        rg.addColorStop(1, "#05030a00");
        g.fillStyle = rg;
        g.fillRect(-300, -80, 600, 160);
        this.big(
          g,
          "ROUND " + game.round,
          0,
          0,
          58,
          ["#ffffff", "#00f3ff"],
          "center",
          "#00f3ff",
          t,
          false,
          2.5,
          500,
          14,
        );
        this.sparks(g, 0, -20, 170, 32, t, 7, 31);
        g.restore();
      } else {
        const u = hclamp((pf - 72) / 14, 0, 1),
          e = easeOutBack(u),
          sc = 2.4 - 1.4 * e;
        if (pf < 84) {
          g.fillStyle = `rgba(255,240,220,${(1 - (pf - 72) / 12) * 0.5})`;
          g.fillRect(0, 0, W, H);
        }
        this.enso(
          g,
          W / 2,
          236,
          150 + u * 30,
          86 + u * 14,
          Math.min(1, u * 2.2),
          NEON_MAG,
          18,
          1 - u * 0.55,
        );
        g.save();
        g.globalCompositeOperation = "lighter";
        g.strokeStyle = "#00f3ff";
        g.lineWidth = 0.9;
        for (let k = 0; k < 22; k++) {
          const a = (k / 22) * PI2 + 0.1,
            r0 = 80 + u * 170,
            r1 = r0 + 30 + u * 200;
          g.globalAlpha = (1 - u) * 0.8;
          g.beginPath();
          g.moveTo(W / 2 + Math.cos(a) * r0, 250 + Math.sin(a) * r0 * 0.5);
          g.lineTo(W / 2 + Math.cos(a) * r1, 250 + Math.sin(a) * r1 * 0.5);
          g.stroke();
        }
        g.restore();
        g.save();
        g.translate(W / 2, 262);
        g.scale(sc, sc);
        g.rotate((1 - e) * -0.08);
        this.big(
          g,
          "FIGHT!",
          0,
          0,
          84,
          ["#ffffff", "#ffd9a0"],
          "center",
          "#ff4a3a",
          t,
          false,
          2 + (1 - u) * 5,
          700,
          6,
        );
        this.sparks(g, 0, -28, 190, 44, t, 12, 33, "#ffd9a0");
        g.restore();
      }
    }
    if (ph === "ko" && !game.timedOut) {
      if (pf < 12) {
        g.fillStyle = `rgba(255,240,230,${(1 - pf / 12) * 0.75})`;
        g.fillRect(0, 0, W, H);
      }
      const e = easeOutBack(hclamp(pf / 10, 0, 1)),
        jx = pf < 40 ? (Math.random() - 0.5) * 8 : 0;
      this.enso(
        g,
        W / 2 + jx,
        238,
        190,
        118,
        hclamp(pf / 16, 0, 1),
        VERM,
        26,
        0.95,
        -2.4,
      );
      g.save();
      g.translate(W / 2 + jx, 288);
      g.scale(0.4 + 0.6 * e + Math.sin(pf * 0.2) * 0.015, 0.4 + 0.6 * e);
      g.globalCompositeOperation = "lighter";
      this.fancy(
        g,
        "K.O.",
        -4,
        0,
        132,
        ["#ff2a3a", "#ff2a3a"],
        "center",
        null,
        t,
        false,
        true,
        700,
        6,
      );
      this.fancy(
        g,
        "K.O.",
        4,
        0,
        132,
        ["#20e0ff", "#20e0ff"],
        "center",
        null,
        t,
        false,
        true,
        700,
        6,
      );
      g.globalCompositeOperation = "source-over";
      this.sparks(g, 0, -46, 170, 56, t, 12, 35);
      this.fancy(
        g,
        "K.O.",
        0,
        0,
        132,
        ["#ffffff", "#00f3ff"],
        "center",
        "#ff3366",
        t,
        false,
        false,
        700,
        6,
      );
      g.restore();
    }
    if (ph === "result") {
      const e = easeOutBack(hclamp(pf / 16, 0, 1)),
        k = hclamp(pf / 20, 0, 1),
        nm = game.winner ? game.winner.char.name + " WINS" : "DRAW";
      this.hair(g, 124, k);
      this.hair(g, 188, k);
      g.save();
      g.translate(W / 2, 158);
      g.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e);
      this.glitz(g, nm, 0, 0, 34, ["#ffffff", "#00f3ff"], t, "center", 5, 3);
      if (game.timedOut)
        this.lab(g, "TIME UP", 0, 24, 12, "#d6c8ff", "center", 8, "#00f3ff", "600");
      g.restore();
    }
    const A = game.arcade;
    if (ph === "match" && A && A.state !== "fight") {
      const e = easeOutBack(hclamp(A.t / 20, 0, 1)),
        k = hclamp(A.t / 20, 0, 1),
        st = A.state,
        bad = st === "gameover",
        col = bad ? "#ff6a52" : GOLD,
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
            ? "NÄCHSTER GEGNER:  " +
              A.opponentName(A.stage + 1) +
              (A.stage + 1 >= A.total - 1 ? "   ·   ENDGEGNER" : "")
            : st === "victory"
              ? "Du hast den Minotaurus besiegt!"
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
      this.hair(g, 122, k, col);
      this.hair(g, 204, k, col);
      g.translate(W / 2, 158);
      g.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e);
      this.glitz(
        g,
        title,
        0,
        0,
        st === "victory" ? 30 : 36,
        bad ? ["#ffffff", "#ff3366"] : ["#ffffff", "#00f3ff"],
        t,
        "center",
        5,
        5,
      );
      this.lab(g, sub, 0, 28, 12, bad ? "#ffb0a0" : "#e0e0ff", "center", 4, bad ? "#ff3366" : "#00f3ff", "600");
      g.restore();
      if (Math.sin(t * 0.15) > -0.2)
        this.lab(g, pr, W / 2, 226, 11, "#00f3ff", "center", 5, "#ff00ff", "600");
    } else if (ph === "match") {
      const w = game.fighters.find((f) => f.wins >= ROUND.wins),
        e = easeOutBack(hclamp(pf / 20, 0, 1)),
        P = HPAL[game.fighters.indexOf(w)];
      g.save();
      const hu = hclamp(pf / 24, 0, 1);
      this.hair(g, 124, hu, P.a);
      this.hair(g, 180, hu, P.a);
      g.translate(W / 2, 160);
      g.scale(0.6 + 0.4 * e, 0.6 + 0.4 * e);
      const nm = w.char.name + " WINS THE MATCH";
      this.glitz(g, nm, 0, 0, 30, ["#ffffff", GOLD_HI], t, "center", 4, 7);
      g.restore();
      if (Math.sin(t * 0.15) > -0.2) {
        g.save();
        g.strokeStyle = GOLD;
        g.lineWidth = 1;
        g.fillStyle = "#120b0c";
        g.beginPath();
        g.roundRect
          ? g.roundRect(W / 2 - 104, 196, 56, 20, 2)
          : g.rect(W / 2 - 104, 196, 56, 20);
        g.fill();
        g.stroke();
        g.restore();
        this.lab(
          g,
          "ENTER",
          W / 2 - 76,
          210,
          10.5,
          GOLD_HI,
          "center",
          2,
          null,
          "600",
        );
        this.lab(
          g,
          "REMATCH",
          W / 2 - 38,
          210,
          12,
          "#e6dcc0",
          "left",
          6,
          P.glow,
          "500",
        );
      }
    }
  }
  // ---------- Super-Cinematic ----------
  flash(g, game) {
    if (game.superFlash <= 0) return;
    const { W, H } = this,
      t = game.superFlash / 42,
      f = game.superOwner,
      col = f.char.glow || "#fff",
      [ox, oy] = game.camera.toScreen(f.x, f.y - 80);
    g.save();
    g.fillStyle = `rgba(5,0,10,${0.72 * Math.min(1, t * 2)})`;
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
    this.enso(
      g,
      0,
      -10,
      170 * e,
      40 * e,
      hclamp((1 - t) * 3, 0, 1),
      VERM,
      10,
      0.7,
      -2.8,
    );
    g.fillStyle = "#020104c8";
    g.fillRect(-W * 0.5 * e, -46, W * e, 70);
    this.hair(g, -46, e, GOLD);
    this.hair(g, 24, e, GOLD);
    g.scale(0.7 + 0.3 * e, 0.7 + 0.3 * e);
    this.big(
      g,
      game.superName ? game.superName.toUpperCase() : "HYPER " + f.char.name + " BEAM",
      0,
      0,
      42,
      ["#ffffff", GOLD_HI],
      "center",
      col,
      game.frame,
      false,
      2.5,
      600,
      8,
    );
    g.restore();
  }
}
