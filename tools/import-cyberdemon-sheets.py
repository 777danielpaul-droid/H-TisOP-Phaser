#!/usr/bin/env python3
# Importiert die Cyberdämon-Sheets (Boss Kapitel 2) -> assets/cyberdemon/atlas.webp + meta.json + meta.js
#   assets/cyberdemon/sheets/atem.png    3x2 Atem-/Idle-Frames (Figur schaut nach LINKS)   -> Frames i_0 .. i_5
#   assets/cyberdemon/sheets/schlag.png  4x2 Schlagsequenz                                 -> Frames a_0 .. a_7 (Reihenfolge: Zeile für Zeile)
#      Zeile 1 (a_0-a_3): schaut nach LINKS (Ausfall, Aushol-Haltung, Schlag mit Spur, voller Schlag)
#      Zeile 2 (a_4-a_7): schaut nach RECHTS; a_4/a_5 sind im Sheet halbtransparent (Geister-Aushol-Frames) -> Alpha wird repariert
# Im Spiel schauen alle Sprites nach rechts: Frames, die im Sheet nach links schauen, werden beim Import gespiegelt.
# Fliegende Posen zusätzlich als 'a'-Variante (Körpermitte verankert). Animationen: src/render/sprites.js (CYBERDEMON_ANIMS)
# Neue/bessere Bögen: Datei in SHEETS eintragen (Name, Pfad, Spalten x Zeilen, welche Zeilen gespiegelt werden) und hier die Frame-Namen in sprites.js tauschen.
import os, sys, json, importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def load(n):
    s = importlib.util.spec_from_file_location(n, os.path.join(HERE, n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
T = load('import-tiger-sheets')
DIR = os.path.join(ROOT, 'assets', 'cyberdemon'); SH = os.path.join(DIR, 'sheets')

# Name, Datei, Spalten, Zeilen, Zeilen die nach links schauen (werden gespiegelt), Präfix, Alpha-Reparatur für (Zeile,Spalte)
SHEETS = [
    dict(file='atem.png', cols=3, rows=2, flip_rows={0, 1}, prefix='i', ghost=set(), k=1.0),
    dict(file='schlag.png', cols=4, rows=2, flip_rows={0}, prefix='a', ghost={(1, 0), (1, 1)}, k=1.2),
]
AIR = {'i_0', 'i_2', 'a_0', 'a_1', 'a_2', 'a_6'}   # Sprung/Treffer-Posen -> zusätzlich an der Körpermitte verankert
REF = 'i_0'                                   # neutrale Haltung = Maßstab (Standhöhe T.STAND_H)
A_SOLID = 200                                 # "feste" Pixel (ohne Schlagspuren/Glühen) für Fußlinie und Anker
FOOT_BAND = 26

def fix_ghost(arr):
    """Halbtransparente Geister-Frames: Farben stimmen, nur das Alpha ist zu niedrig (Median ~190) -> Pegel anheben, Rand bleibt weich."""
    a = arr[:, :, 3].astype(float)
    arr[:, :, 3] = np.clip((a - 30) / 120, 0, 1) * 255
    return arr

def find_cells(im, cols, rows):
    """Figuren per Zusammenhang (Alpha, leicht aufgeweitet, damit Schlagspuren dranbleiben); Sortierung: Zeile für Zeile, links nach rechts."""
    a = np.array(im)[:, :, 3]; m = a > 20
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=7))
    H = a.shape[0]; found = []
    for i in range(1, n + 1):
        sel = (lab == i) & m
        if sel.sum() < 8000: continue
        ys, xs = np.where(sel)
        found.append(dict(lab=i, cx=xs.mean(), cy=ys.mean(), n=int(sel.sum())))
    if len(found) != cols * rows: raise SystemExit('! erwartet %d Figuren, gefunden %d' % (cols * rows, len(found)))
    for f in found: f['row'] = min(rows - 1, int(f['cy'] / (H / rows)))
    found.sort(key=lambda f: (f['row'], f['cx']))
    return lab, found

def measure(arr):
    a = arr[:, :, 3]; h, w = a.shape; solid = a > A_SOLID
    ys, xs = np.where(a > T.A_TRIM)
    rows = np.where(solid.sum(axis=1) >= 3)[0]
    foot = int(rows.max()) + 1; top = int(rows.min())
    band = solid[max(0, foot - FOOT_BAND):foot]; bx = np.where(band.any(axis=0))[0]
    anchor = int((bx.min() + bx.max() + 1) / 2)   # Mitte zwischen den Füßen
    return dict(crop=(max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, w), min(ys.max() + 3, h)), top=top, foot=foot, anchor=anchor)

def main():
    cells = {}
    for sh in SHEETS:
        p = os.path.join(SH, sh['file'])
        if not os.path.exists(p): print('! fehlt:', p); return 1
        im = Image.open(p).convert('RGBA'); lab, found = find_cells(im, sh['cols'], sh['rows']); full = np.array(im)
        for idx, f in enumerate(found):
            ys, xs = np.where(lab == f['lab']); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            cell = full[y0:y1, x0:x1].copy(); cell[lab[y0:y1, x0:x1] != f['lab']] = 0   # Reste der Nachbarfiguren weg
            r, c = idx // sh['cols'], idx % sh['cols']
            if (r, c) in sh['ghost']: cell = fix_ghost(cell)
            if r in sh['flip_rows']: cell = cell[:, ::-1].copy()
            cells['%s_%d' % (sh['prefix'], idx)] = (Image.fromarray(cell), sh['k'])
            print('%s_%d  Zeile %d  %dx%d%s%s' % (sh['prefix'], idx, r, x1 - x0, y1 - y0, '  gespiegelt' if r in sh['flip_rows'] else '', '  Alpha repariert' if (r, c) in sh['ghost'] else ''))
    mets = {n: measure(np.array(im)) for n, (im, k) in cells.items()}
    m0 = mets[REF]; sc0 = T.STAND_H / (m0['foot'] - m0['top']); print('Maßstab', round(sc0, 3))
    frames = {}
    for n, (im, k) in sorted(cells.items()):
        m = mets[n]; sc = sc0 * k; x0, y0, x1, y1 = m['crop']; img = im.crop((x0, y0, x1, y1))
        img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
        frames[n] = dict(img=img, ox=round((x0 - m['anchor']) * sc), oy=round((y0 - m['foot']) * sc))
        if n in AIR: frames[n + 'a'] = dict(img=img, ox=-img.width // 2, oy=-(T.AIR_CENTER + img.height // 2), share=n)
    atlas, meta = T.pack(frames)
    atlas.save(os.path.join(DIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=T.STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))
    open(os.path.join(DIR, 'meta.json'), 'w').write(data)
    open(os.path.join(DIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).cyberdemon={meta:" + data + "};")
    # Kontrollbild: alle Frames auf dunklem Grund, Fußlinie (grün) + Anker (gelb)
    names = sorted(n for n in frames if not n.endswith('a')); CW, CH = 330, 330
    pv = Image.new('RGB', (CW * 7, CH * 2), (30, 36, 56)); d = ImageDraw.Draw(pv)
    for i, n in enumerate(names):
        f = frames[n]; cx, fy = (i % 7) * CW + CW // 2, (i // 7) * CH + CH - 28
        pv.paste(f['img'], (cx + f['ox'], fy + f['oy']), f['img'])
        d.line([(cx - CW // 2 + 4, fy), (cx + CW // 2 - 4, fy)], fill=(80, 200, 120)); d.line([(cx, fy - 40), (cx, fy + 8)], fill=(255, 220, 80)); d.text((cx - CW // 2 + 6, fy - CH + 36), n, fill=(255, 255, 255))
    pv.save(os.path.join(SH, '_vorschau.png'))
    print('Atlas', atlas.size, len(meta), 'Frames')
    return 0
sys.exit(main())
