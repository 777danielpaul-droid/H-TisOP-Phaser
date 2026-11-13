#!/usr/bin/env python3
"""Siegerpose-Aura: Spritesheets (4 Frames, dunkler Hintergrund) -> assets/aura/<id>.webp (Streifen, additiv nutzbar) + <id>.json.
Hintergrund wird per Luminanz-Key entfernt (Hintergrundfarbe abziehen, Rest = Alpha), damit die Flammen mit 'lighter' sauber leuchten.
Aufruf: python3 tools/make-aura.py   (Pillow + numpy)"""
import json, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH = os.path.join(ROOT, 'assets/aura/sheets'); OUT = os.path.join(ROOT, 'assets/aura')
# id: (Datei, Hintergrundfarbe, Frame-Boxen (x0,y0,x1,y1) in Sheet-Pixeln, Rauschschwelle)
SHEETS = {
 'kitsune': ('kitsune_aura.jpeg', (0, 0, 0), [(20, 60, 340, 740), (360, 60, 690, 740), (700, 60, 1060, 740), (1060, 60, 1400, 740)], 10),
 'st3g0':   ('st3g0_aura.jpeg', (30, 34, 35), [(66, 140, 360, 620), (394, 140, 688, 620), (721, 140, 1015, 620), (1049, 140, 1343, 620)], 14),
}
def key(img, bg, thr):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    d = np.clip(a - np.array(bg, np.float32) - thr, 0, None)           # Hintergrund + Rauschen abziehen
    d = d * (255.0 / max(1.0, 255.0 - max(bg) - thr))
    al = np.clip(d.max(2) / 255.0, 0, 1)
    rgb = np.where(al[..., None] > 0.004, d / np.maximum(al[..., None] * 255.0, 1e-4), 0)   # entpremultipliziert
    out = np.dstack([np.clip(rgb, 0, 1) * 255, al * 255]).astype(np.uint8)
    return out
for cid, (fn, bg, boxes, thr) in SHEETS.items():
    im = Image.open(os.path.join(SH, fn)); frames = []
    for b in boxes:
        k = key(im.crop(b), bg, thr); al = k[..., 3] / 255.0
        ys, xs = np.nonzero(al > 0.3)
        bot = int(np.percentile(ys, 99.5)); low = ys > bot - (bot - ys.min()) * 0.6
        cxm = float(xs[low].mean()); frames.append((k, cxm, bot))
    hl = max(max(f[1], f[0].shape[1] - f[1]) for f in frames); W = int(hl * 2) + 8
    top = max(f[2] for f in frames); Hh = top + 10; H = Hh + 12
    strip = Image.new('RGBA', (W * 4, H), (0, 0, 0, 0))
    for i, (k, cxm, bot) in enumerate(frames):
        cell = Image.fromarray(k, 'RGBA'); strip.alpha_composite(cell, (i * W + int(W / 2 - cxm), Hh - bot))
    strip.save(os.path.join(OUT, cid + '.webp'), quality=88, method=6)
    jp = os.path.join(OUT, cid + '.json'); old = json.load(open(jp)) if os.path.exists(jp) else {}
    old.update({'w': W, 'h': H, 'n': 4, 'ax': W / 2, 'ay': Hh})    # ay = Fußlinie (Flammenunterkante) in der Zelle; k/i/front/fps/seq (Größe, Farbe, Vordergrund-Deckkraft, Takt, Reihenfolge) bleiben erhalten
    json.dump(old, open(jp, 'w'))
    strip.save('/tmp/aura_' + cid + '.png'); print(cid, W, H)
