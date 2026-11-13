#!/usr/bin/env python3
# Importiert die Mantis-Posenbögen (assets/mantis/sheets/bogen_N.jpeg, je 2x2 Posen) -> assets/mantis/atlas.webp + meta.json + meta.js
# Frame-Namen: p_<Bogen>_<Zelle>; fliegende Posen zusätzlich als 'a'-Variante (Körpermitte verankert). Animationen: src/render/sprites.js (MANTIS_ANIMS)
import os, sys, json, importlib.util
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def load(n):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
T = load('import-tiger-sheets'); S = load('import-st3g0-sheets')
DIR = os.path.join(ROOT, 'assets', 'mantis'); SH = os.path.join(DIR, 'sheets')
AIR = {(2, 1), (2, 2), (1, 2), (4, 0)}   # Absprung, Sprung, Flugtritt, Treffer-Pose -> zusätzlich an der Körpermitte verankert
REF = (4, 3)                              # neutrale Haltung = Maßstab
def main():
    cells = {}; mets = {}
    for n in range(1, 5):
        p = os.path.join(SH, f'bogen_{n}.jpeg'); im, how = T.key_out(Image.open(p)); im, _ = S.clean_pockets(im)
        imgs = S.slice_poses(im, 4)
        if imgs is None: print('! Bogen', n, 'nicht erkannt'); return 1
        for i, c in enumerate(imgs): cells[(n, i)] = c; mets[(n, i)] = S.measure(c)
        print('Bogen', n, how)
    m0 = mets[REF]; sc = T.STAND_H / (m0['foot'] - m0['top']); print('Maßstab', round(sc, 3))
    frames = {}
    for (n, i), c in sorted(cells.items()):
        m = mets[(n, i)]
        if m is None: print('leer', n, i); continue
        x0, y0, x1, y1 = m['crop']; img = c.crop((x0, y0, x1, y1)); img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
        frames[f'p_{n}_{i}'] = dict(img=img, ox=round((x0 - m['anchor']) * sc), oy=round((y0 - m['foot']) * sc))
        if (n, i) in AIR: frames[f'p_{n}_{i}a'] = dict(img=img, ox=-img.width // 2, oy=-(T.AIR_CENTER + img.height // 2))
    atlas, meta = T.pack(frames)
    atlas.save(os.path.join(DIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=T.STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))
    open(os.path.join(DIR, 'meta.json'), 'w').write(data)
    open(os.path.join(DIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).mantis={meta:" + data + "};")
    print('Atlas', atlas.size, len(meta), 'Frames')
    return 0
sys.exit(main())
