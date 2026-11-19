#!/usr/bin/env python3
# Importiert den RABEN (Schwarzmarkthändler KORVUS, NPC + spielbare Figur) -> assets/rabe/atlas.webp + meta.json + meta.js
# Quellen (assets/rabe/sheets/):  idle.png (4 Posen, 2x2) · kampf.png (12 Kampfposen, 4x3) · sprechen.png (8 Sprechposen, 4x2)
#   fall.png (Fallen 7 + Aufstehen 8 Posen, Beschriftungsbalken werden entfernt) · sprung.png (Sprung mit magischen Flügeln, 6+5+6 = 17 Posen)
# Nutzt Atlas-Packer und Konstanten des Tiger-Importers (tools/import-tiger-sheets.py). Aufruf: python3 tools/import-rabe-sheets.py
# Frame-Namen:  f_<0-6> Fallen | u_<0-7> Aufstehen | j_<0-16> Sprung mit Flügeln | i_<0-3> Idle | t_<0-7> Sprechen/Gesten (NPC-Dialog) | c_<0-11> Kampfposen. Zusatz 'a' = dieselbe Pose an der Körpermitte statt an der Fußlinie verankert (Luft).
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

# Bogen -> Datei, Präfix, Spalten x Zeilen, Hintergrund ('alpha' = echte Transparenz, 'soft' = halbtransparentes Rauschen entfernen, 'chroma' = grüner Chroma-Key)
SHEETS = [dict(file='idle.png', pre='i', cols=2, rows=2, bg='alpha'),
          dict(file='sprechen.png', pre='t', cols=4, rows=2, bg='alpha', thr=250),
          dict(file='kampf.png', pre='c', cols=4, rows=3, bg='soft'),
          dict(file='fall.png', custom='fall'),      # -> f_0..f_6 (Fallen), u_0..u_7 (Aufstehen)
          dict(file='sprung.png', custom='jump'),    # -> j_0..j_16 (Sprung: Absprung, Flügel öffnen, Gleiten, Flügel falten, Landung)
          dict(file='neu_sprite.png', pre='ns', cols=2, rows=2, bg='chroma'),
          dict(file='neu_angriff.png', pre='na', cols=2, rows=2, bg='chroma'),
          dict(file='neu_flug.png', pre='nf', cols=2, rows=2, bg='chroma'),
          dict(file='neu_kick.png', pre='nk', cols=2, rows=2, bg='chroma'),
          dict(file='neu_schlag.png', pre='nc', cols=2, rows=2, bg='chroma')]
# Maßstab: Referenz-Pose je Bogen -> Standhöhe STAND_H (idle/sprechen: erste Zelle = aufrecht stehend).
# Der Kampfbogen hat keine aufrechte Pose (Zelle 0 = tiefe Kampfhaltung, Kopf ca. 1,76x kleiner gezeichnet als im Idle-Bogen) -> fester Faktor relativ zum Idle-Maßstab.
REF = {'i': (0, None), 't': (0, None), 'c': (0, 1.76)}
FRAME_SC = {}        # Einzelne Posen kleiner/größer: ('c', Zelle) -> Faktor
AIR = {('c', 3), ('c', 4), ('c', 5), ('c', 6), ('c', 10)} | {('j', i) for i in range(3, 16)} | {('f', 0), ('f', 1), ('f', 2)} | {('nf', 0), ('nf', 1), ('nf', 2), ('nf', 3), ('nk', 1), ('nk', 2), ('nk', 3), ('nc', 1), ('nc', 2), ('nc', 3), ('na', 1), ('na', 2), ('ns', 1)}   # fliegende Posen: zusätzlich eine Körpermitten-Variante ('a')

def load(cfg):
    if cfg.get('bg') == 'chroma':
        im = Image.open(os.path.join(SH, cfg['file']))
        im_k, _ = T.key_out(im)
        return np.array(im_k)
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

def _split_seeded(a, bands, counts):
    """Figuren mit ineinander greifenden Effekten (Flügel): je Zeilenband die `n` größten dunklen Körper als Keime, alle übrigen Pixel gehen an den nächsten Körper."""
    out = []
    for (y0, y1), n in zip(bands, counts):
        sub = a[y0:y1].copy(); al = sub[..., 3]; rgb = sub[..., :3].astype(np.int16)
        lum = rgb.sum(axis=2) / 3; sat = rgb.max(axis=2) - rgb.min(axis=2)
        body = (al > 200) & (sat < 55) & (lum < 150)      # nur Fell/Leder/Kleidung (kein Blau/Violett der Flügel) als Keim
        lab, cnt = ndi.label(ndi.binary_dilation(body, iterations=6))
        sizes = ndi.sum(body, lab, range(1, cnt + 1)); order = list(np.argsort(sizes)[::-1][:n] + 1)
        if len(order) < n: raise SystemExit(f'! Zeile {y0}-{y1}: nur {len(order)} von {n} Körpern erkannt')
        keep = np.isin(lab, order) & body
        dist, (iy, ix) = ndi.distance_transform_edt(~keep, return_indices=True)
        owner = lab[iy, ix]; near = (al > 0) & (dist < 220)
        cx = {l: np.mean(np.where(lab == l)[1]) for l in order}
        for l in sorted(order, key=lambda l: cx[l]):
            m = near & (owner == l); img = sub.copy(); img[..., 3] = np.where(m, al, 0); out.append(Image.fromarray(img))
    return out

def slice_custom(kind, a):
    if kind == 'jump':   # 6 + 5 + 6 Posen (Zeile 2 hat nur 5), Flügel überlappen die Nachbarn
        return {('j', i): c for i, c in enumerate(_split_seeded(a, [(0, 350), (350, 690), (690, a.shape[0])], [6, 5, 6]))}
    # 'fall': Zeile 1 = 7 Fall-Posen, Zeile 2 = 8 Aufsteh-Posen; dunkle Beschriftungsbalken (niedrige Kästen) fliegen raus
    al = a[..., 3] > 20; lab, cnt = ndi.label(ndi.binary_dilation(al, iterations=3)); boxes = ndi.find_objects(lab); figs = []
    for l, b in enumerate(boxes, 1):
        h = b[0].stop - b[0].start
        if h < 60 or (al & (lab == l)).sum() < 400: continue
        figs.append(((b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2, l))
    r1 = sorted([f for f in figs if f[0] < 380], key=lambda f: f[1]); r2 = sorted([f for f in figs if f[0] >= 380], key=lambda f: f[1])
    if len(r1) != 7 or len(r2) != 8: raise SystemExit(f'! fall.png: {len(r1)}+{len(r2)} Posen statt 7+8')
    res = {}
    for pre, row in (('f', r1), ('u', r2)):
        for i, (_, _, l) in enumerate(row):
            m = (lab == l) & (a[..., 3] > 0); b = a.copy(); b[..., 3] = np.where(m, a[..., 3], 0); res[(pre, i)] = Image.fromarray(b)
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
        if cfg.get('custom'):
            got = slice_custom(cfg['custom'], np.array(Image.open(os.path.join(SH, cfg['file'])).convert('RGBA')))
            log(f"- {cfg['file']}: {len(got)} Posen erkannt")
            for k, c in got.items(): cells[k] = c; mets[k] = measure(c)
            continue
        a = load(cfg); imgs = slice_poses(a, cfg['cols'], cfg['rows'], cfg.get('thr', 16))
        if imgs is None: log(f"! {cfg['file']}: {cfg['cols'] * cfg['rows']} Posen nicht erkannt"); return 1
        log(f"- {cfg['file']}: {len(imgs)} Posen erkannt")
        for i, c in enumerate(imgs):
            cells[(cfg['pre'], i)] = c
            m = measure(c)
            if m and cfg.get('bg') == 'chroma':
                arr = np.array(c); a = arr[..., 3]
                r, g, b = [arr[..., k].astype(np.int16) for k in range(3)]; lum = (r + g + b) / 3
                sat = arr[..., :3].max(axis=2).astype(np.int16) - arr[..., :3].min(axis=2)
                body = (a > A_BODY) & ~((sat > 70) & (lum > 95))
                by, bx = np.where(body)
                if len(bx) > 0: m['ax'] = int(np.median(bx))
            mets[(cfg['pre'], i)] = m
    # Maßstab: idle/sprechen = erste Zelle -> Standhöhe; Kampf = Idle-Maßstab x Faktor
    scale = {}
    for pre in ('i', 't'):
        m = mets[(pre, 0)]; scale[pre] = STAND_H / (m['foot'] - m['top']); log(f"Maßstab {pre}: Höhe {m['foot'] - m['top']} px -> {STAND_H} (x{scale[pre]:.3f})")
    scale['c'] = scale['i'] * REF['c'][1]; log(f"Maßstab c: x{scale['c']:.3f} (Idle x {REF['c'][1]})")
    # Fall-/Sprungbogen: aufrechte Pose im selben Bogen (u_7 = fertig aufgestanden, j_0 = Ausgangshaltung) -> Standhöhe
    for pres, ref in ((('u', 'f'), ('u', 7)), (('j',), ('j', 0))):
        m = mets[ref]; sc = STAND_H / (m['foot'] - m['top'])
        for pre in pres: scale[pre] = sc
        log(f"Maßstab {'/'.join(pres)}: Höhe {m['foot'] - m['top']} px -> {STAND_H} (x{sc:.3f}, relativ zu Idle {sc / scale['i']:.2f})")
    # Neue Bögen (Gemini 1536x1024, Chroma): Referenz ns_0
    m_ns = mets.get(('ns', 0))
    if m_ns:
        sc_new = STAND_H / (m_ns['foot'] - m_ns['top'])
        for pre in ('ns', 'na', 'nf', 'nk', 'nc'): scale[pre] = sc_new
        log(f"Maßstab neu: Höhe {m_ns['foot'] - m_ns['top']} px -> {STAND_H} (x{sc_new:.3f})")
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
