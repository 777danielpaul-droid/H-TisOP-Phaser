#!/usr/bin/env python3
# Importiert die ST3-G0-Posenbögen (assets/st3g0/sheets/bogen_N.jpeg|png, je 2x2 Posen) -> assets/st3g0/atlas.webp + meta.json + meta.js
# Nutzt Hintergrund-Entfernung, Figurenerkennung und Atlas-Packer des Tiger-Importers (tools/import-tiger-sheets.py).
# Aufruf: python3 tools/import-st3g0-sheets.py   (das Build-Skript tools/build.mjs ruft das NICHT auf; das fertige Atlas liegt im Projekt)
# Frame-Namen: p_<Bogen>_<Zelle>  (Zelle 0-3 in Lesereihenfolge). Welche Frames in welcher Animation laufen: src/render/sprites.js (ST3G0_ANIMS).
import os, sys, json, importlib.util
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location('tig', os.path.join(HERE, 'import-tiger-sheets.py'))
T = importlib.util.module_from_spec(spec); spec.loader.exec_module(T)
DIR = os.path.join(ROOT, 'assets', 'st3g0'); SH = os.path.join(DIR, 'sheets')

STAND_H = T.STAND_H; AIR_CENTER = T.AIR_CENTER; A_BODY = T.A_BODY
SKIP = {(2, 0): 'doppelt (identisch mit Bogen 1, Zelle 0)'}
AIR = {(3, 0), (6, 1)}               # fliegende Posen: an der Körpermitte statt an der Fußlinie verankern (Luft-Treffer, Flugkick)
REF_SHEET = 1                        # Bogen 1, Zelle 0 = neutrale Haltung -> Maßstab für alle Bögen (gleiche Auflösung)
ROWS = {5: (3, 2)}                   # Posen je Zeile, wenn nicht 2+2 (Bogen 5: 3 oben + 2 unten = 5 Posen)
GRID_SHEETS = {12}                   # Bögen mit Leucht-Aura: Figuren hängen über die Aura zusammen -> feste 2x2-Aufteilung statt Figurenerkennung
# Bögen 7-12 sind 1024x1024 (Bogen 1-6: 1264x848) -> Figur dort ~10 % größer. Maßstab = Standhöhe der Kampfhaltung in Quellpixeln (gemessen: 421)
REF_H = {n: 421 for n in range(7, 13)}
# Einzelne Posen kleiner/größer: (Bogen, Zelle) -> Faktor. Bogen 5: die drei Posen der oberen Reihe hat Gemini ca. 25 % kleiner gezeichnet als die untere Reihe
FRAME_SCALE = {(5, 0): 1.33, (5, 1): 1.33, (5, 2): 1.33}
CLIP_BURST = {(8, 2)}                # Lichtblitz am Faustschlag ist im Bogen an der Zellkante abgeschnitten -> gelblichen Blitz oben rechts entfernen, Schlieren bleiben

def find(n):
    for ext in ('.jpeg', '.jpg', '.png', '.webp'):
        p = os.path.join(SH, f'bogen_{n}{ext}')
        if os.path.exists(p): return p
    return None

def body_mask(arr):
    """Körper = grünliche Haut/Hose (ohne Staub-Wolken, Bandagen, Sterne) -> Fußlinie und Schwerpunkt ohne Staub messen."""
    r, g, b = [arr[:, :, i].astype(np.int16) for i in range(3)]
    return (arr[:, :, 3] > A_BODY) & (g > r + 6) & (g > b + 6)

def measure(cell):
    arr = np.array(cell); a = arr[:, :, 3]; h, w = a.shape
    ys, xs = np.where(a > T.A_TRIM); m = body_mask(arr); by, bx = np.where(m)
    rows = np.where(m.sum(axis=1) >= 3)[0]
    if len(xs) == 0 or len(bx) == 0 or len(rows) == 0: return None
    col = m.sum(axis=0); cs = np.cumsum(col)
    return dict(crop=(max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, w), min(ys.max() + 3, h)),
                top=int(rows.min()), foot=int(rows.max()) + 1, anchor=int(np.searchsorted(cs, cs[-1] / 2)),
                edge=bool(a[0].max() > A_BODY or a[-1].max() > A_BODY or a[:, 0].max() > A_BODY or a[:, -1].max() > A_BODY))

def clean_pockets(im):
    """Vom Rand nicht erreichbare Hintergrund-Taschen (z. B. zwischen Arm und Körper) sind reinweiß -> ebenfalls transparent.
    Bandagen sind cremefarben/grau schattiert (< 244) und bleiben erhalten."""
    from scipy import ndimage
    a = np.array(im); mn = a[:, :, :3].min(axis=2); white = (a[:, :, 3] > 0) & (mn >= 244)
    lab, cnt = ndimage.label(white)
    if cnt == 0: return im, 0
    sz = ndimage.sum(white, lab, range(1, cnt + 1)); big = np.isin(lab, [i + 1 for i, v in enumerate(sz) if v >= 25])
    grow = ndimage.binary_dilation(big, iterations=2) & (mn >= 225) & (a[:, :, 3] > 0)
    a[:, :, 3] = np.where(grow, 0, a[:, :, 3]); return Image.fromarray(a), int((sz >= 25).sum())

def slice_poses(im, n=4, rows_n=None):
    """Wie T.slice_poses, aber losgelöste Effekte (Staubwolken) dürfen bis 6 % der Figurgröße haben (Tiger-Importer: 2 %).
    rows_n = Posen je Zeile (Standard: 2 pro Zeile), z. B. (3, 2) für 3 oben + 2 unten."""
    from scipy import ndimage
    rows_n = list(rows_n or [2] * (n // 2))
    a = np.array(im); al = a[:, :, 3] > 16
    for it in (10, 8, 6, 4, 3, 2):
        lab, cnt = ndimage.label(ndimage.binary_dilation(al, iterations=it))
        if cnt >= n:
            top = sorted(ndimage.sum(al, lab, range(1, cnt + 1)), reverse=True)
            if top[n - 1] > 0.3 * top[0] and (cnt == n or top[n] < 0.06 * top[0]): break
    else: return None
    sizes = ndimage.sum(al, lab, range(1, cnt + 1)); order = np.argsort(sizes)[::-1] + 1
    main = list(order[:n]); boxes = ndimage.find_objects(lab)
    def center(l): b = boxes[l - 1]; return ((b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2)
    owner = {l: l for l in main}
    for l in order[n:]:
        cy, cx = center(l); owner[l] = min(main, key=lambda m: (center(m)[0] - cy) ** 2 + (center(m)[1] - cx) ** 2)
    out = []
    for m in main:
        mask = np.isin(lab, [l for l, o in owner.items() if o == m]) & (a[:, :, 3] > 0)
        b = a.copy(); b[:, :, 3] = np.where(mask, a[:, :, 3], 0); out.append((center(m), Image.fromarray(b)))
    rows = sorted(out, key=lambda t: t[0][0]); res = []; i = 0
    for k in rows_n: res += [img for _, img in sorted(rows[i:i + k], key=lambda t: t[0][1])]; i += k
    return res

def defringe(im, iters=2, lo=214):
    """Heller JPEG-Saum um die Aura/Flügel: fast weiße Randpixel (an Transparenz grenzend) entfernen."""
    from scipy import ndimage
    a = np.array(im)
    for _ in range(iters):
        opaque = a[:, :, 3] > 0; edge = opaque & ndimage.binary_dilation(~opaque, iterations=1)
        a[:, :, 3] = np.where(edge & (a[:, :, :3].min(axis=2) >= lo), 0, a[:, :, 3])
    return Image.fromarray(a)

def drop_burst(img):
    """Cremefarbenen Lichtblitz (gelblich, r-b > 38) in der oberen rechten Ecke des Zuschnitts löschen."""
    a = np.array(img); h, w = a.shape[:2]; r, b = a[:, :, 0].astype(np.int16), a[:, :, 2].astype(np.int16)
    m = np.zeros((h, w), bool); m[:int(h * .36), int(w * .38):] = True
    a[:, :, 3] = np.where(m & (r > 190) & (r - b > 38), 0, a[:, :, 3]); return Image.fromarray(a)

def slice_grid(im, cols=2, rows=2):
    """Feste Aufteilung in Zellen (Bogen mit Aura): jede Zelle behält nur ihre eigenen Pixel."""
    a = np.array(im); H, W = a.shape[:2]; out = []
    for r in range(rows):
        for c in range(cols):
            b = a.copy(); m = np.zeros((H, W), bool); m[r * H // rows:(r + 1) * H // rows, c * W // cols:(c + 1) * W // cols] = True
            b[:, :, 3] = np.where(m, a[:, :, 3], 0); out.append(Image.fromarray(b))
    return out

def main():
    notes = []; log = lambda s: (notes.append(s), print(s))
    cells = {}; mets = {}; sheet_of = {}
    for n in range(1, 21):
        p = find(n)
        if not p: continue
        im, how = T.key_out(Image.open(p)); im, npk = clean_pockets(im)
        k = sum(ROWS.get(n, (2, 2)))
        imgs = slice_grid(defringe(im)) if n in GRID_SHEETS else slice_poses(im, k, ROWS.get(n))
        if imgs is None: log(f'! Bogen {n}: {k} Posen nicht erkannt - übersprungen'); continue
        log(f'- Bogen {n}: {im.size[0]}x{im.size[1]} px, Hintergrund: {how}, {npk} weiße Taschen entfernt, {k} Posen {"(Raster)" if n in GRID_SHEETS else "erkannt"}')
        for i, c in enumerate(imgs): cells[(n, i)] = c; mets[(n, i)] = measure(c); sheet_of[(n, i)] = n
    if (REF_SHEET, 0) not in cells: print('Bogen 1 fehlt - nichts zu tun'); return 1
    m0 = mets[(REF_SHEET, 0)]; href = m0['foot'] - m0['top']; s = STAND_H / href
    log(f'Maßstab: neutrale Haltung {href} px -> {STAND_H} (x{s:.3f})')
    if href < 300: log(f'! Niedrige Auflösung (Standhöhe {href} px): wirkt beim Hochskalieren leicht weich')
    frames = {}
    for (n, i), c in sorted(cells.items()):
        if (n, i) in SKIP: log(f'  Bogen {n} / Zelle {i + 1}: übersprungen, {SKIP[(n, i)]}'); continue
        m = mets[(n, i)]
        if m is None: log(f'  ! Bogen {n} / Zelle {i + 1}: leer'); continue
        if m['edge']: log(f'  ! Bogen {n} / Zelle {i + 1}: Figur berührt den Zellrand (evtl. abgeschnitten)')
        sc = STAND_H / REF_H[n] if n in REF_H else s   # Bögen mit anderer Auflösung: Maßstab aus fester Standhöhe
        sc *= FRAME_SCALE.get((n, i), 1)
        x0, y0, x1, y1 = m['crop']; img = c.crop((x0, y0, x1, y1))
        if (n, i) in CLIP_BURST: img = drop_burst(img)
        img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
        if (n, i) in AIR: ox, oy = -img.width // 2, -(AIR_CENTER + img.height // 2)
        else: ox, oy = round((x0 - m['anchor']) * sc), round((y0 - m['foot']) * sc)
        frames[f'p_{n}_{i}'] = dict(img=img, ox=ox, oy=oy)
    atlas, meta = T.pack(frames)
    atlas.save(os.path.join(DIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))   # Animationen: sprites.js
    open(os.path.join(DIR, 'meta.json'), 'w').write(data)
    open(os.path.join(DIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).st3g0={meta:" + data + "};")
    log(f'Atlas {atlas.width}x{atlas.height}, {round(os.path.getsize(os.path.join(DIR, "atlas.webp")) / 1024)} KB, {len(meta)} Frames')
    # Vorschau: alle Frames auf der Fußlinie (Kontrolle von Ausrichtung und Maßstab)
    P = .5; CW = 260; names = sorted(frames); cols = 6; rows = (len(names) + cols - 1) // cols; CH = 240
    pv = Image.new('RGB', (cols * CW, rows * CH), (28, 28, 42)); d = ImageDraw.Draw(pv)
    for k, nm in enumerate(names):
        f = frames[nm]; cx = (k % cols) * CW + CW // 2; base = (k // cols) * CH + CH - 28
        d.line([(cx - CW // 2, base), (cx + CW // 2, base)], fill=(90, 90, 120)); d.line([(cx, base - CH + 40), (cx, base)], fill=(70, 70, 100))
        t = f['img'].resize((max(1, round(f['img'].width * P)), max(1, round(f['img'].height * P))), Image.LANCZOS)
        pv.paste(t, (cx + round(f['ox'] * P), base + round(f['oy'] * P)), t); d.text((cx - CW // 2 + 6, base + 6), nm, fill=(255, 220, 120))
    pv.save(os.path.join(SH, '_vorschau.png'))
    open(os.path.join(SH, '_bericht.txt'), 'w', encoding='utf-8').write('\n'.join(notes) + '\n')
    return 0

if __name__ == '__main__': sys.exit(main())
