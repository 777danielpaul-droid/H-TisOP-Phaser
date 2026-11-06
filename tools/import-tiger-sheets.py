#!/usr/bin/env python3
"""Tiger-Sheets importieren: assets/tiger/sheets/*.png  ->  assets/tiger/atlas.webp + meta.json + meta.js

Ablauf (alles automatisch, nichts von Hand eintragen):
  1. Hintergrund entfernen (Chroma-Grün #00FF00; sonst Hintergrundfarbe der Ecken; PNG mit Transparenz bleibt wie es ist)
  2. Sheet in Frames schneiden (Raster aus GRID, mit automatischer Lückenerkennung)
  3. Größe angleichen: Frame 1 jedes Sheets = neutrale Kampfhaltung -> daraus der Maßstab (Standhöhe = STAND_H)
  4. Fußlinie + Körpermitte (horizontaler Schwerpunkt) je Frame verankern -> kein Rutschen/Springen
  5. Atlas packen, Animationen (ANIMS) in meta.json eintragen. Fehlende Sheets: die alten Tiger-Frames bleiben aktiv.
Außerdem: assets/tiger/sheets/_vorschau.png (Kontrollbild) und _bericht.txt (Warnungen).
Braucht: Pillow, numpy (+ scipy nur für den Notfall-Hintergrund).  Aufruf: python3 tools/import-tiger-sheets.py"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TDIR = os.path.join(ROOT, 'assets', 'tiger')
SHEETS_DIR = os.path.join(TDIR, 'sheets')
SRC_DIR = os.path.join(TDIR, 'source')
STAND_H = 300          # Standhöhe der Figur im Atlas (Quellpixel), alle Frames werden darauf normiert
AIR_CENTER = 105       # Körpermitte über der Fußlinie für fliegende Treffer-Frames
A_BODY, A_TRIM = 48, 8  # Alpha-Schwellen: Körper (Fußlinie/Höhe) bzw. Zuschnitt (inkl. Leuchten)
AW = 4096

# Sheet -> (Spalten, Zeilen). Lesereihenfolge: links->rechts, oben->unten. Zelle 1 (Index 0) = Referenz-Haltung für den Maßstab.
GRID = {'idle_1': (3, 2), 'idle_2': (3, 2), 'walk_1': (3, 2), 'walk_2': (3, 2), 'dash': (3, 2), 'jump': (3, 2), 'crouch': (3, 2),
        'punch': (3, 2), 'heavy': (3, 2), 'kick': (3, 2), 'crouch_atk': (3, 2), 'air_atk': (4, 2), 'claw': (4, 2), 'special': (4, 2),
        'hit': (3, 2), 'down': (4, 2), 'getup': (3, 2), 'block': (3, 2), 'win': (3, 2)}
# Neue Posen-Bögen (2x2 Posen, Figuren dürfen über Zellgrenzen ragen -> Erkennung per zusammenhängender Figur statt Raster)
POSE_SHEETS = {'neu_bewegung': (2, 2), 'neu_tritt': (2, 2), 'neu_schlag': (2, 2), 'neu_posen': (2, 2)}
GRID.update(POSE_SHEETS)
# Fliegende Treffer-Frames: Körpermitte statt Fußlinie verankern
CENTER = {('down', 1), ('down', 2), ('down', 3)}
# Spiel-Animation -> Frames (Sheet, [Zell-Indizes ab 0]) + Optionen (loop/fps/lean/bob/squash, wie in sprites.js)
ANIMS = {
    'idle':    dict(parts=[('idle_1', [0, 1, 2, 3, 4, 5]), ('idle_2', [1, 2, 3, 4, 5])], loop=1, fps=12),
    'walk':    dict(parts=[('walk_1', [1, 2, 3, 4, 5]), ('walk_2', [1, 2, 3, 4, 5])], loop=1, fps=16),
    'dash':    dict(parts=[('dash', [2, 3])], loop=1, fps=12, lean=.04),
    'airdash': dict(parts=[('dash', [4, 5])], loop=1, fps=12, lean=.1),
    'air':     dict(parts=[('jump', [1, 2, 3, 4, 5])]),
    'crouch':  dict(parts=[('crouch', [2, 3])], loop=1, fps=4),
    'cblock':  dict(parts=[('crouch', [4])]),
    'punch':   dict(parts=[('punch', [1, 2, 3, 4, 5])]),
    'heavy':   dict(parts=[('heavy', [1, 2, 3, 4, 5])]),
    'kick':    dict(parts=[('kick', [1, 2, 3, 4, 5])]),
    'cpunch':  dict(parts=[('crouch_atk', [1, 2, 2])]),
    'ckick':   dict(parts=[('crouch_atk', [3, 4, 4, 5])]),
    'jpunch':  dict(parts=[('air_atk', [1, 2, 2])]),
    'jkick':   dict(parts=[('air_atk', [3, 4, 5])]),
    'jheavy':  dict(parts=[('air_atk', [6, 7, 7])]),
    'upper':   dict(parts=[('claw', [1, 2, 3, 4, 5, 6, 7])]),
    'special': dict(parts=[('special', [1, 2, 3, 4, 5, 6, 7])]),
    'hit':     dict(parts=[('hit', [1, 2, 3, 4])]),
    'airhit':  dict(parts=[('down', [1, 2, 3])]),
    'kd':      dict(parts=[('down', [4, 5, 6, 7])]),
    'wakeup':  dict(parts=[('getup', [1, 2, 3, 4, 5])]),
    'block':   dict(parts=[('block', [2])]),
    'win':     dict(parts=[('win', [1, 2, 3, 4, 5])], loop=1, fps=5),
}
# Zuordnung der neuen Posen-Bögen (Zellen 0-3, Lesereihenfolge). Überschreibt die Animationen oben, sobald die Bögen vorhanden sind.
#   neu_bewegung: 0 Stand breit · 1 Knie hoch · 2 tiefer Tritt · 3 tiefe Hocke
#   neu_tritt:    0 Stand · 1 Knie-Heber · 2 hoher Tritt · 3 Sprung-Knie
#   neu_schlag:   0 Deckung · 1 Jab · 2 Gerade (weit) · 3 Deckung/Ausholen
#   neu_posen:    0 Stand · 1 Hakenschlag mit Wisch · 2 Schlag mit Wisch · 3 Ausholen (Rücken)
# Idle: 4 neutrale Haltungen als Ping-Pong-Schleife. IDLE_FPS = Tempo (vorher 10 fps, jetzt langsamer).
IDLE_FPS = 6.5
ANIMS_NEU = {
    'idle':    dict(parts=[('neu_schlag', [0]), ('neu_posen', [0]), ('neu_bewegung', [0]), ('neu_tritt', [0]), ('neu_bewegung', [0]), ('neu_posen', [0])], loop=1, fps=IDLE_FPS),
    'walk':    dict(parts=[('neu_schlag', [0]), ('neu_bewegung', [0]), ('neu_tritt', [0]), ('neu_posen', [0]), ('neu_tritt', [0]), ('neu_bewegung', [0])], loop=1, fps=14, bob=4, lean=.08),
    'dash':    dict(parts=[('neu_posen', [3])], lean=.1),
    'airdash': dict(parts=[('neu_tritt', [3])], lean=.2),
    'air':     dict(parts=[('neu_tritt', [3])], lean=.04),
    'crouch':  dict(parts=[('neu_bewegung', [3])]),
    'cblock':  dict(parts=[('neu_bewegung', [3])], squash=.95),
    'block':   dict(parts=[('neu_schlag', [3])]),
    'punch':   dict(parts=[('neu_schlag', [0, 1, 1, 0, 0])]),
    'heavy':   dict(parts=[('neu_schlag', [3, 2, 2, 2, 0])]),
    'kick':    dict(parts=[('neu_tritt', [1, 2, 2, 1, 0])]),
    'cpunch':  dict(parts=[('neu_schlag', [0, 1, 1, 0])], squash=.82),
    'ckick':   dict(parts=[('neu_bewegung', [3, 2, 2, 3])]),
    'jpunch':  dict(parts=[('neu_schlag', [1, 1, 1])]),
    'jkick':   dict(parts=[('neu_tritt', [3, 2, 2])]),
    'jheavy':  dict(parts=[('neu_posen', [1, 2, 2])]),
    'upper':   dict(parts=[('neu_posen', [3, 1, 2, 2])]),
    'special': dict(parts=[('neu_posen', [3, 1, 2, 2, 3])]),
}
# Alte Einzelframes (assets/tiger/source) bleiben als Rückfall im Atlas
LEG_SKIP = ('hit_light_',)
LEG_AIR = {'fall_00', 'fall_01', 'hit_heavy_02'}
LEG_AIR_CENTER = 92

report = []
def note(s):
    report.append(s); print(s)

# ---------- 1. Hintergrund ----------
def key_out(im):
    im = im.convert('RGBA'); a = np.array(im)
    if (a[:, :, 3] < 250).mean() > 0.02:
        return im, 'Transparenz'
    r, g, b = [a[:, :, i].astype(np.int16) for i in range(3)]
    d = g - np.maximum(r, b)
    if (d > 100).mean() > 0.15:                                   # Chroma-Grün
        a[:, :, 3] = (np.clip((70 - d) / 40.0, 0, 1) * 255).astype(np.uint8)
        a[:, :, 1] = np.where(d > 0, np.minimum(g, np.maximum(r, b)), g).astype(np.uint8)   # Grün-Saum entfernen
        return Image.fromarray(a), 'Chroma-Grün'
    h, w = a.shape[:2]                                            # Notlösung: Ecken-Hintergrund, nur was mit dem Rand verbunden ist
    edge = np.concatenate([a[0, :, :3], a[-1, :, :3], a[:, 0, :3], a[:, -1, :3]]).astype(np.int16)
    bg = np.median(edge, axis=0)
    mask = (np.abs(a[:, :, :3].astype(np.int16) - bg).max(axis=2) < 38)
    try:
        from scipy import ndimage
        lab, n = ndimage.label(mask)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        mask = np.isin(lab, list(border))
    except Exception:
        note('  Hinweis: scipy fehlt, Hintergrund wird ohne Randprüfung entfernt (am besten grünen Hintergrund #00FF00 verwenden)')
    a[:, :, 3] = np.where(mask, 0, 255).astype(np.uint8)
    return Image.fromarray(a), 'Hintergrundfarbe der Ecken'

# ---------- 2. Raster ----------
def runs_of(proj):
    on = proj > 0; runs = []; i = 0; n = len(on)
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            runs.append([i, j, int(proj[i:j].sum())]); i = j
        else: i += 1
    return runs

def pick_runs(proj, n):
    runs = runs_of(proj)
    if len(runs) > n:
        mx = max(r[2] for r in runs); big = [r for r in runs if r[2] >= 0.03 * mx]
        if len(big) >= n: runs = big
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        k = int(np.argmin(gaps)); runs[k][1] = runs[k + 1][1]; runs[k][2] += runs[k + 1][2]; del runs[k + 1]
    return runs if len(runs) == n else None

def bounds(runs, total, n):
    if runs is None: return [round(i * total / n) for i in range(n + 1)], False
    return [0] + [(runs[i][1] + runs[i + 1][0]) // 2 for i in range(n - 1)] + [total], True

def slice_sheet(im, cols, rows):
    a = np.array(im)[:, :, 3] > A_BODY; H, W = a.shape
    yb, ok_y = bounds(pick_runs(a.sum(axis=1), rows), H, rows); cells = []; ok_all = ok_y
    for r in range(rows):
        band = a[yb[r]:yb[r + 1]]
        xb, ok_x = bounds(pick_runs(band.sum(axis=0), cols), W, cols); ok_all = ok_all and ok_x
        for c in range(cols): cells.append((xb[c], yb[r], xb[c + 1], yb[r + 1]))
    return cells, ok_all

def slice_poses(im, n=4):
    """Posen-Bogen: jede zusammenhängende Figur (inkl. Schweif/Wisch-Effekt) wird eine Zelle, Nachbarfiguren werden maskiert.
    Rückgabe: Liste von RGBA-Bildern (Lesereihenfolge oben->unten, links->rechts) oder None (scipy fehlt / nicht n Figuren)."""
    try: from scipy import ndimage
    except Exception: return None
    a = np.array(im); al = a[:, :, 3] > 16
    for it in (10, 8, 6, 4, 3, 2):                       # größte Verschmelzung wählen, bei der noch n deutlich getrennte Figuren bleiben
        lab, cnt = ndimage.label(ndimage.binary_dilation(al, iterations=it))
        if cnt >= n:
            top = sorted(ndimage.sum(al, lab, range(1, cnt + 1)), reverse=True)
            if top[n - 1] > 0.3 * top[0] and (cnt == n or top[n] < 0.02 * top[0]): break
    else: return None
    sizes = ndimage.sum(al, lab, range(1, cnt + 1)); order = np.argsort(sizes)[::-1] + 1
    main = list(order[:n]); boxes = ndimage.find_objects(lab)
    def center(l): b = boxes[l - 1]; return ((b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2)
    owner = {l: l for l in main}
    for l in order[n:]:                                  # Splitter (z. B. losgelöster Effekt) -> nächste Hauptfigur
        cy, cx = center(l); owner[l] = min(main, key=lambda m: (center(m)[0] - cy) ** 2 + (center(m)[1] - cx) ** 2)
    out = []
    for m in main:
        mask = np.isin(lab, [l for l, o in owner.items() if o == m]) & (np.array(im)[:, :, 3] > 0)
        b = a.copy(); b[:, :, 3] = np.where(mask, a[:, :, 3], 0); out.append((center(m), Image.fromarray(b)))
    rows = sorted(out, key=lambda t: t[0][0]); half = [sorted(rows[i:i + 2], key=lambda t: t[0][1]) for i in range(0, n, 2)]
    return [img for grp in half for _, img in grp]

def measure(cell):
    a = np.array(cell)[:, :, 3]; h, w = a.shape
    ys, xs = np.where(a > A_TRIM); by, bx = np.where(a > A_BODY)
    if len(xs) == 0 or len(bx) == 0: return None
    col = (a > A_BODY).sum(axis=0); cs = np.cumsum(col)
    return dict(crop=(max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, w), min(ys.max() + 3, h)),
                top=int(by.min()), foot=int(by.max()) + 1, anchor=int(np.searchsorted(cs, cs[-1] / 2)),
                edge=bool(a[0].max() > A_BODY or a[-1].max() > A_BODY or a[:, 0].max() > A_BODY or a[:, -1].max() > A_BODY))

# ---------- Sheets lesen ----------
def find_sheets():
    out = {}
    if not os.path.isdir(SHEETS_DIR): return out
    for fn in sorted(os.listdir(SHEETS_DIR)):
        stem, ext = os.path.splitext(fn)
        if ext.lower() in ('.png', '.jpg', '.jpeg', '.webp') and not stem.startswith('_'):
            key = stem.lower().replace('-', '_').replace(' ', '_')
            if key in GRID: out[key] = os.path.join(SHEETS_DIR, fn)
            else: note(f'! Datei "{fn}" ignoriert (unbekannter Name). Erlaubt: ' + ', '.join(GRID))
    return out

def needed_cells():
    need = {}
    for an in list(ANIMS.values()) + list(ANIMS_NEU.values()):
        for sh, idx in an['parts']: need.setdefault(sh, set()).update(idx)
    return need

def build_sheet(key, path, need):
    cols, rows = GRID[key]; im, how = key_out(Image.open(path))
    imgs = slice_poses(im, cols * rows) if key in POSE_SHEETS else None
    if imgs is not None:
        cells = [(0, 0, im.width, im.height)] * len(imgs)
        note(f'- {key}: {im.size[0]}x{im.size[1]} px, Hintergrund: {how}, {len(imgs)} Posen als einzelne Figuren erkannt')
    else:
        cells, ok = slice_sheet(im, cols, rows); imgs = [im.crop(c) for c in cells]; cells = [(0, 0) + c.size for c in imgs]
        note(f'- {key}: {im.size[0]}x{im.size[1]} px, Hintergrund: {how}, Raster {cols}x{rows} ' + ('(Lücken erkannt)' if ok else '(gleichmäßig geteilt – Frames liegen evtl. nicht sauber in den Zellen)'))
    ms = [measure(c) for c in imgs]
    if ms[0] is None:
        note(f'  ! Zelle 1 ist leer – Sheet {key} übersprungen'); return None, None
    href = ms[0]['foot'] - ms[0]['top']; s = STAND_H / href
    if href < 200: note(f'  ! Niedrige Auflösung: Standhöhe nur {href} px (besser >= 300 px) – Bild wird hochgerechnet und wirkt weich. Gemini in höchster Auflösung nutzen.')
    frames = {}
    for i in sorted(need):
        if i >= len(imgs) or ms[i] is None:
            note(f'  ! Zelle {i + 1} ist leer/fehlt'); continue
        m = ms[i]
        if m['edge']: note(f'  ! Zelle {i + 1}: Figur berührt den Zellrand (evtl. abgeschnitten)')
        x0, y0, x1, y1 = m['crop']; cell = imgs[i].crop((x0, y0, x1, y1))
        img = cell.resize((max(1, round(cell.width * s)), max(1, round(cell.height * s))), Image.LANCZOS)
        if (key, i) in CENTER: ox, oy = -img.width // 2, -(AIR_CENTER + img.height // 2)
        else: ox, oy = round((x0 - m['anchor']) * s), round((y0 - m['foot']) * s)
        frames[f't_{key}_{i:02d}'] = dict(img=img, ox=ox, oy=oy)
    return frames, s

# ---------- Alte Einzelframes ----------
def legacy_frames():
    if not os.path.isdir(SRC_DIR): return {}
    raw = {}; bottoms = []
    for fn in sorted(os.listdir(SRC_DIR)):
        if not fn.endswith('.png') or fn.startswith(LEG_SKIP): continue
        im = Image.open(os.path.join(SRC_DIR, fn)).convert('RGBA'); al = np.array(im)[:, :, 3]; ys, xs = np.where(al > 8)
        if len(xs) == 0: continue
        cw, ch = im.size; bx0, bx1, by0, by1 = max(xs.min() - 2, 0), min(xs.max() + 3, cw), max(ys.min() - 2, 0), min(ys.max() + 3, ch)
        if fn.startswith('idle_'): bottoms.append(int(ys.max()) + 1)
        raw[fn[:-4]] = (im.crop((bx0, by0, bx1, by1)), bx0 - cw // 2, by0, al)
    BASE = int(np.median(bottoms)); ia = raw['idle_00'][3]; ys, _ = np.where(ia > A_BODY); s = STAND_H / (ys.max() + 1 - ys.min())
    out = {}
    for n, (img, ox, by0, _) in raw.items():
        im2 = img.resize((max(1, round(img.width * s)), max(1, round(img.height * s))), Image.LANCZOS)
        out[n] = dict(img=im2, ox=round(ox * s), oy=round((by0 - BASE) * s))
        if n in LEG_AIR: out[n + 'a'] = dict(img=im2, share=n, ox=-im2.width // 2, oy=-(round(LEG_AIR_CENTER * s) + im2.height // 2))
    return out

# ---------- Atlas ----------
def pack(frames):
    items = sorted([(n, f) for n, f in frames.items() if 'share' not in f], key=lambda t: -t[1]['img'].height)
    x = y = rowh = 0; pos = {}
    for n, f in items:
        w, h = f['img'].size
        if x + w > AW: x = 0; y += rowh + 2; rowh = 0
        pos[n] = (x, y); x += w + 2; rowh = max(rowh, h)
    atlas = Image.new('RGBA', (AW, y + rowh + 2), (0, 0, 0, 0)); meta = {}
    for n, f in items: atlas.paste(f['img'], pos[n])
    for n, f in frames.items():
        px, py = pos[f.get('share', n)]
        meta[n] = dict(x=px, y=py, w=f['img'].width, h=f['img'].height, ox=f['ox'], oy=f['oy'])
    return atlas, meta

def preview(frames, anims, sheets_found):
    P = .42; CW, CH = 250, 215; rows = []
    for key in GRID:
        if key not in sheets_found: continue
        names = sorted(n for n in frames if n.startswith('t_' + key + '_'))
        if names: rows.append((key, names))
    if not rows: return
    maxn = max(len(n) for _, n in rows); im = Image.new('RGB', (maxn * CW + 110, len(rows) * CH), (28, 28, 42)); d = ImageDraw.Draw(im)
    for r, (key, names) in enumerate(rows):
        base = r * CH + CH - 22; d.text((8, r * CH + 8), key, fill=(255, 220, 120))
        d.line([(110, base), (im.width, base)], fill=(90, 90, 120))
        for c, n in enumerate(names):
            f = frames[n]; cx = 110 + c * CW + CW // 2; d.line([(cx, r * CH + 20), (cx, base)], fill=(70, 70, 100))
            t = f['img'].resize((max(1, round(f['img'].width * P)), max(1, round(f['img'].height * P))), Image.LANCZOS)
            im.paste(t, (cx + round(f['ox'] * P), base + round(f['oy'] * P)), t); d.text((cx - CW // 2 + 6, base + 4), n, fill=(180, 180, 200))
    im.save(os.path.join(SHEETS_DIR, '_vorschau.png'))

def main():
    sheets = find_sheets()
    if not sheets:
        print('Keine Sheets in assets/tiger/sheets/ gefunden – nichts zu tun (Tiger bleibt unverändert).'); return 0
    note('Gefundene Sheets: ' + ', '.join(sheets)); need = needed_cells(); frames = legacy_frames(); scales = {}
    for key, path in sheets.items():
        fr, s = build_sheet(key, path, need[key])
        if fr: frames.update(fr); scales[key] = s
    if len(scales) > 1:
        med = float(np.median(list(scales.values())))
        for k, s in scales.items():
            if s / med > 1.35 or s / med < .74: note(f'  ! {k}: Maßstab weicht stark ab (Faktor {s / med:.2f}) – Zelle 1 war evtl. keine neutrale Haltung oder die Figur ist anders groß')
    anims = {}
    for name, spec in list(ANIMS.items()) + list(ANIMS_NEU.items()):   # ANIMS_NEU kommt zuletzt und überschreibt
        names = []
        for sh, idx in spec['parts']: names += [f't_{sh}_{i:02d}' for i in idx]
        if all(n in frames for n in names): anims[name] = dict({k: v for k, v in spec.items() if k != 'parts'}, frames=names)
    used = {n for a in anims.values() for n in a['frames']}
    frames = {n: f for n, f in frames.items() if n in used or not n.startswith('t_')}   # nicht benutzte Sheet-Frames (Referenzzellen) nicht in den Atlas
    note('Neue Animationen aktiv: ' + (', '.join(anims) or 'keine'))
    missing = [a for a in list(ANIMS) if a not in anims]
    if missing: note('Noch alte Behelfs-Animationen: ' + ', '.join(missing))
    atlas, meta = pack(frames)
    atlas.save(os.path.join(TDIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims=anims))
    open(os.path.join(TDIR, 'meta.json'), 'w').write(data)
    open(os.path.join(TDIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).tiger={meta:" + data + "};")
    note(f'Atlas {atlas.width}x{atlas.height}, {round(os.path.getsize(os.path.join(TDIR, "atlas.webp")) / 1024)} KB, {len(meta)} Frames')
    preview(frames, anims, sheets)
    open(os.path.join(SHEETS_DIR, '_bericht.txt'), 'w', encoding='utf-8').write('\n'.join(report) + '\n')
    return 0

if __name__ == '__main__': sys.exit(main())
