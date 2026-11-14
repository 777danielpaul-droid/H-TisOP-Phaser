#!/usr/bin/env python3
# Importiert den RABEN (Schwarzmarkthändler KORVUS, NPC + spielbare Figur) -> assets/rabe/atlas.webp + meta.json + meta.js
# Quellen (assets/rabe/sheets/):  idle.png (4 Posen, 2x2) · kampf.png (12 Kampfposen, 4x3) · sprechen.png (8 Sprechposen, 4x2)
# Nutzt Atlas-Packer und Konstanten des Tiger-Importers (tools/import-tiger-sheets.py). Aufruf: python3 tools/import-rabe-sheets.py
# Frame-Namen:  i_<0-3> Idle | t_<0-7> Sprechen/Gesten (NPC-Dialog) | c_<0-11> Kampfposen. Zusatz 'a' = dieselbe Pose an der Körpermitte statt an der Fußlinie verankert (Luft).
# Welche Frames in welcher Animation laufen: src/render/sprites.js (RABE_ANIMS).
#
# Besonderheiten der Bögen:
#  - idle.png + sprechen.png: echte Transparenz.
#  - kampf.png: "freigestellt", aber der Hintergrund ist nur halbtransparent (Alpha 1-200, Rauschen) -> harte Schwelle bei Alpha 190..250 (weicher Saum), Rest = 0.
#  - Figuren dürfen über Zellgrenzen ragen (Schlitzer, Aura, Staub) -> Zuordnung per zusammenhängender Figur (nahe Kleinteile gehören zur nächsten Figur).
import os, sys, json, importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location('tig', os.path.join(HERE, 'import-tiger-sheets.py'))
T = importlib.util.module_from_spec(spec); spec.loader.exec_module(T)
DIR = os.path.join(ROOT, 'assets', 'rabe'); SH = os.path.join(DIR, 'sheets')
STAND_H = T.STAND_H; AIR_CENTER = T.AIR_CENTER; A_BODY = T.A_BODY

# Bogen -> Datei, Präfix, Spalten x Zeilen, Hintergrund ('alpha' = echte Transparenz, 'soft' = halbtransparentes Rauschen entfernen)
SHEETS = [dict(file='idle.png', pre='i', cols=2, rows=2, bg='alpha'),
          dict(file='sprechen.png', pre='t', cols=4, rows=2, bg='alpha', thr=250),
          dict(file='kampf.png', pre='c', cols=4, rows=3, bg='soft')]
# Maßstab: Referenz-Pose je Bogen -> Standhöhe STAND_H (idle/sprechen: erste Zelle = aufrecht stehend).
# Der Kampfbogen hat keine aufrechte Pose (Zelle 0 = tiefe Kampfhaltung, Kopf ca. 1,76x kleiner gezeichnet als im Idle-Bogen) -> fester Faktor relativ zum Idle-Maßstab.
REF = {'i': (0, None), 't': (0, None), 'c': (0, 1.76)}
FRAME_SC = {}        # Einzelne Posen kleiner/größer: ('c', Zelle) -> Faktor
AIR = {('c', 3), ('c', 4), ('c', 5), ('c', 6), ('c', 10)}   # fliegende Posen (Luft-Tritt, Sprung-Klauen, Luft-Sichel, Dash, Luft-Treffer): zusätzlich eine Körpermitten-Variante ('a')

def load(cfg):
    im = Image.open(os.path.join(SH, cfg['file'])).convert('RGBA'); a = np.array(im)
    if cfg['bg'] == 'soft':
        al = a[..., 3].astype(np.float32); al = np.clip((al - 190) / 60.0, 0, 1) * 255; a[..., 3] = al.astype(np.uint8)
    return a

def slice_poses(a, cols, rows, thr=16):
    n = cols * rows; al = a[..., 3] > thr          # thr: nur zum Erkennen der Figuren (sprechen.png: Zeilen hängen über weiche Alpha-Säume zusammen -> 250)
    for it in (10, 8, 6, 4, 3, 2, 1, 0):
        lab, cnt = ndi.label(ndi.binary_dilation(al, iterations=it))
        if cnt >= n:
            top = sorted(ndi.sum(al, lab, range(1, cnt + 1)), reverse=True)
            if top[n - 1] > 0.25 * top[0] and (cnt == n or top[n] < 0.12 * top[0]): break
    else: return None
    sizes = ndi.sum(al, lab, range(1, cnt + 1)); order = np.argsort(sizes)[::-1] + 1
    main = list(order[:n]); boxes = ndi.find_objects(lab)
    def center(l): b = boxes[l - 1]; return ((b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2)
    owner = {l: l for l in main}
    for l in order[n:]:
        if (al & (lab == l)).sum() < 12: continue
        cy, cx = center(l); owner[l] = min(main, key=lambda m: (center(m)[0] - cy) ** 2 + (center(m)[1] - cx) ** 2)
    out = []
    for m in main:
        mask = np.isin(lab, [l for l, o in owner.items() if o == m]) & (a[..., 3] > 0)
        b = a.copy(); b[..., 3] = np.where(mask, a[..., 3], 0); out.append((center(m), Image.fromarray(b)))
    rws = sorted(out, key=lambda t: t[0][0]); res = []
    for r in range(rows): res += [img for _, img in sorted(rws[r * cols:(r + 1) * cols], key=lambda t: t[0][1])]
    return res

def measure(cell):
    arr = np.array(cell); a = arr[..., 3]; h, w = a.shape
    r, g, b = [arr[..., i].astype(np.int16) for i in range(3)]; lum = (r + g + b) / 3
    sat = arr[..., :3].max(axis=2).astype(np.int16) - arr[..., :3].min(axis=2)
    ys, xs = np.where(a > T.A_TRIM)
    body = (a > A_BODY) & ~((sat > 70) & (lum > 95))          # Fell/Kleidung/Linien, ohne leuchtende Effekte (Schlitzer, Aura, Funken)
    rows_ = np.where(body.sum(axis=1) >= 3)[0]
    if len(xs) == 0 or len(rows_) < 20: return None
    top, foot = int(rows_.min()), int(rows_.max()) + 1
    band = body.copy(); band[:max(top, foot - max(12, int((foot - top) * .2)))] = False   # Füße (untere 20 %): Körpermitte am Boden
    fy, fx = np.where(band); ay_, _ = np.where(body)
    return dict(crop=(max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, w), min(ys.max() + 3, h)),
                top=top, foot=foot, ax=int(np.median(fx)) if len(fx) > 20 else int(np.median(xs)), ay=int(np.median(ay_)),
                edge=bool(a[0].max() > A_BODY or a[-1].max() > A_BODY or a[:, 0].max() > A_BODY or a[:, -1].max() > A_BODY))

def main():
    notes = []; log = lambda s: (notes.append(s), print(s))
    cells = {}; mets = {}
    for cfg in SHEETS:
        a = load(cfg); imgs = slice_poses(a, cfg['cols'], cfg['rows'], cfg.get('thr', 16))
        if imgs is None: log(f"! {cfg['file']}: {cfg['cols'] * cfg['rows']} Posen nicht erkannt"); return 1
        log(f"- {cfg['file']}: {len(imgs)} Posen erkannt")
        for i, c in enumerate(imgs): cells[(cfg['pre'], i)] = c; mets[(cfg['pre'], i)] = measure(c)
    # Maßstab: idle/sprechen = erste Zelle -> Standhöhe; Kampf = Idle-Maßstab x Faktor
    scale = {}
    for pre in ('i', 't'):
        m = mets[(pre, 0)]; scale[pre] = STAND_H / (m['foot'] - m['top']); log(f"Maßstab {pre}: Höhe {m['foot'] - m['top']} px -> {STAND_H} (x{scale[pre]:.3f})")
    scale['c'] = scale['i'] * REF['c'][1]; log(f"Maßstab c: x{scale['c']:.3f} (Idle x {REF['c'][1]})")
    frames = {}
    for (pre, i), c in sorted(cells.items()):
        m = mets[(pre, i)]
        if m is None: log(f'  ! {pre}_{i}: leer'); continue
        if m['edge']: log(f'  ! {pre}_{i}: berührt den Rand (evtl. abgeschnitten)')
        x0, y0, x1, y1 = m['crop']; img = c.crop((x0, y0, x1, y1)); ss = scale[pre] * FRAME_SC.get((pre, i), 1)
        img = img.resize((max(1, round(img.width * ss)), max(1, round(img.height * ss))), Image.LANCZOS)
        frames[f'{pre}_{i}'] = dict(img=img, ox=round((x0 - m['ax']) * ss), oy=round((y0 - m['foot']) * ss))
        if (pre, i) in AIR: frames[f'{pre}_{i}a'] = dict(img=img, share=f'{pre}_{i}', ox=round((x0 - m['ax']) * ss), oy=round((y0 - m['ay']) * ss - AIR_CENTER))
    atlas, meta = T.pack(frames)
    atlas.save(os.path.join(DIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))   # Animationen: sprites.js
    open(os.path.join(DIR, 'meta.json'), 'w').write(data)
    open(os.path.join(DIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).rabe={meta:" + data + "};")
    log(f'Atlas {atlas.width}x{atlas.height}, {round(os.path.getsize(os.path.join(DIR, "atlas.webp")) / 1024)} KB, {len(meta)} Frames')
    P = .5; CW = 260; names = [k for k in frames if not k.endswith('a')]; cols = 6; rws = (len(names) + cols - 1) // cols; CH = 240
    pv = Image.new('RGB', (cols * CW, rws * CH), (28, 28, 42)); d = ImageDraw.Draw(pv)
    for k, nm in enumerate(names):
        f = frames[nm]; cx = (k % cols) * CW + CW // 2; base = (k // cols) * CH + CH - 28
        d.line([(cx - CW // 2, base), (cx + CW // 2, base)], fill=(90, 90, 120)); d.line([(cx, base - CH + 40), (cx, base)], fill=(70, 70, 100))
        t = f['img'].resize((max(1, round(f['img'].width * P)), max(1, round(f['img'].height * P))), Image.LANCZOS)
        pv.paste(t, (cx + round(f['ox'] * P), base + round(f['oy'] * P)), t); d.text((cx - CW // 2 + 6, base + 6), nm, fill=(255, 220, 120))
    pv.save(os.path.join(SH, '_vorschau.png'))
    open(os.path.join(SH, '_bericht.txt'), 'w', encoding='utf-8').write('\n'.join(notes) + '\n')
    return 0

if __name__ == '__main__': sys.exit(main())
