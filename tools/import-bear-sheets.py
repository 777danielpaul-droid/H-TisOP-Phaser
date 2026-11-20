#!/usr/bin/env python3
# Importiert die BÄREN-Posenbögen (assets/bear/sheets/bogen_1..8.png, je 2x2 Posen) -> assets/bear/atlas.webp + meta.json + meta.js
# Nutzt Atlas-Packer und Konstanten des Tiger-Importers (tools/import-tiger-sheets.py), gleiches Vorgehen wie bei LEON (tools/import-leon-sheets.py).
# Aufruf: python3 tools/import-bear-sheets.py
# Frame-Namen: p_<Bogen>_<Zelle>  (Zelle 0-3 in Lesereihenfolge); Zusatz 'a' = dieselbe Pose an der Körpermitte statt an der Fußlinie verankert (Luft).
# Bögen:  1: Grundstellung, Klauen-Streck, Ausfall, Faust vor | 2: Ausholen, Klauenhieb (3 Stufen) | 3: Grundstellung, Knie heben, Low-Kick, Hocke
#         4: Grundstellung, Deckung hoch, Deckung, Volldeckung | 5: Grundstellung, Absprung, Sprung-Klauenhieb, Sturz-Klaue
#         6: Treffer, Rückwurf, Fallen, Liegen | 7: Ausholen, Flugsprung, Body-Slam (Einschlag), Liegen im Staub | 8: Sieges-Gebrüll (4 Posen)
# Welche Frames in welcher Animation laufen: src/render/sprites.js (BEAR_ANIMS).
import os, sys, json, importlib.util
import numpy as np
from PIL import Image, ImageDraw

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location('tig', os.path.join(HERE, 'import-tiger-sheets.py'))
T = importlib.util.module_from_spec(spec); spec.loader.exec_module(T)
DIR = os.path.join(ROOT, 'assets', 'bear'); SH = os.path.join(DIR, 'sheets')

STAND_H = T.STAND_H; AIR_CENTER = T.AIR_CENTER; A_BODY = T.A_BODY
SHEETS = 8
REF = (1, 0) # Bogen 1, Zelle 0 = neutrale Kampfhaltung
AIR = {(5, 0), (5, 1), (5, 2), (5, 3), (6, 1), (6, 2), (7, 1)}

def main():
    cells = {}; mets = {}
    for n in range(1, SHEETS + 1):
        p = os.path.join(SH, f'bogen_{n}.png')
        if not os.path.exists(p):
            print(f'! Bogen {n} fehlt: {p}')
            return 1
        im = Image.open(p)
        im_keyed, how = T.key_out(im)
        imgs = T.slice_poses(im_keyed, 4)
        if imgs is None:
            print(f'! Bogen {n}: 4 Posen nicht erkannt')
            return 1
        for i, c in enumerate(imgs):
            cells[(n, i)] = c
            mets[(n, i)] = T.measure(c)

    m0 = mets[REF]
    href = m0['foot'] - m0['top']
    s = STAND_H / href
    print(f'Maßstab: neutrale Haltung {href} px -> {STAND_H} (x{s:.4f})')

    frames = {}
    for (n, i), c in sorted(cells.items()):
        m = mets[(n, i)]
        x0, y0, x1, y1 = m['crop']
        img = c.crop((x0, y0, x1, y1))
        img_scaled = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
        ox = round((x0 - m['anchor']) * s)
        oy = round((y0 - m['foot']) * s)
        nm = f'p_{n}_{i}'
        frames[nm] = dict(img=img_scaled, ox=ox, oy=oy)
        if (n, i) in AIR:
            frames[nm + 'a'] = dict(img=img_scaled, share=nm, ox=-img_scaled.width // 2, oy=-(AIR_CENTER + img_scaled.height // 2))

    atlas, meta = T.pack(frames)
    os.makedirs(DIR, exist_ok=True)
    atlas_path = os.path.join(DIR, 'atlas.webp')
    atlas.save(atlas_path, 'WEBP', quality=90, alpha_quality=100, method=6)

    data = json.dumps(dict(frames=meta, standH=STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))
    with open(os.path.join(DIR, 'meta.json'), 'w') as f:
        f.write(data)
    with open(os.path.join(DIR, 'meta.js'), 'w') as f:
        f.write('(window.__SPRITES__=window.__SPRITES__||{}).bear={meta:' + data + '};')

    print(f'Atlas: {atlas.width}x{atlas.height}, {os.path.getsize(atlas_path)/1024:.1f} KB, {len(meta)} frames')

    # Vorschau
    cols = 6; names = sorted(frames.keys(), key=lambda k: (int(k.split('_')[1]), k))
    rows = (len(names) + cols - 1) // cols; CW, CH = 260, 240; P = 0.5
    pv = Image.new('RGB', (cols * CW, rows * CH), (28, 28, 42)); d = ImageDraw.Draw(pv)
    for k, nm in enumerate(names):
        f = frames[nm]; cx = (k % cols) * CW + CW // 2; base = (k // cols) * CH + CH - 28
        d.line([(cx - CW // 2, base), (cx + CW // 2, base)], fill=(90, 90, 120))
        d.line([(cx, base - CH + 40), (cx, base)], fill=(70, 70, 100))
        t = f['img'].resize((max(1, round(f['img'].width * P)), max(1, round(f['img'].height * P))), Image.LANCZOS)
        pv.paste(t, (cx + round(f['ox'] * P), base + round(f['oy'] * P)), t)
        d.text((cx - CW // 2 + 6, base + 6), nm, fill=(255, 220, 120))

    pv.save(os.path.join(SH, '_vorschau.png'))
    print('Vorschau gespeichert nach', os.path.join(SH, '_vorschau.png'))
    return 0

if __name__ == '__main__':
    sys.exit(main())
