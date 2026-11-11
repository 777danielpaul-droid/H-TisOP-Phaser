#!/usr/bin/env python3
# Importiert die ANUBIS-Posenbögen (assets/anubis/sheets/bogen_N.png, je 2x2 Posen) -> assets/anubis/atlas.webp + meta.json + meta.js
# Nutzt Atlas-Packer und Konstanten des Tiger-Importers (tools/import-tiger-sheets.py).
# Aufruf: python3 tools/import-kitsune-sheets.py   (das Build-Skript tools/build.mjs ruft das NICHT auf; das fertige Atlas liegt im Projekt)
# Frame-Namen: p_<Bogen>_<Zelle>  (Zelle 0-3 in Lesereihenfolge); Zusatz 'a' = dieselbe Pose an der Körpermitte statt an der Fußlinie verankert (Luft).
# Welche Frames in welcher Animation laufen: src/render/sprites.js (KITSUNE_ANIMS).
#
# Besonderheiten dieser Bögen (Gemini-Export):
#  - graue / weiße / hellgraue Hintergründe, Bogen 10 hat ein aufgemaltes Schachbrett (kein echtes Alpha)
#  - Bögen 6-10: schwarzes Trennkreuz in der Mitte, Beschriftungen ("LAUNCH", "FRAME 1: ..."), Ziffern + Eckmarken
#  -> werden vor dem Freistellen aus dem Bild entfernt (siehe SHEETS)
import os, sys, json, importlib.util
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

try: sys.stdout.reconfigure(encoding='utf-8')
except Exception: pass

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
spec = importlib.util.spec_from_file_location('tig', os.path.join(HERE, 'import-tiger-sheets.py'))
T = importlib.util.module_from_spec(spec); spec.loader.exec_module(T)
DIR = os.path.join(ROOT, 'assets', 'anubis'); SH = os.path.join(DIR, 'sheets')

STAND_H = T.STAND_H; AIR_CENTER = T.AIR_CENTER; A_BODY = T.A_BODY
REF = (1, 0)                       # Bogen 1, Zelle 0 = neutrale Kampfhaltung -> Maßstab für alle Bögen (alle Bögen sind 1024x1024, gleiche Figurengröße)

# Bogen 1-3, 5: echte Transparenz (RGBA) -> 'alpha'. Bogen 4 + 6: RGB mit aufgemaltem Schachbrett -> 'checker'.
#  1 Idle-Zyklus | 2 Kampfposen | 3 Kampfkombo (Jab, Jab, Tritt, Schwung) | 4 Treffer/Sturz | 5 Lauf/Sprung/Ducken | 6 Block
SHEETS = {1: dict(bg='alpha'), 2: dict(bg='alpha'), 3: dict(bg='alpha'), 4: dict(bg='checker'), 5: dict(bg='alpha'), 6: dict(bg='checker')}
AIR = {(4, 0), (4, 1), (5, 1), (5, 2)}     # fliegende Posen: zusätzlich eine an der Körpermitte verankerte Variante ('a')
SHEET_SC = {1: 1.0, 2: 0.9, 3: 0.9, 4: 1.0, 5: 1.0, 6: 1.0}   # Maßstab-Korrektur je Bogen (Gemini zeichnet die Figur je Bogen unterschiedlich groß)
DUP_TOL = 0
SKIP = {}

def find(n):
    for ext in ('.png', '.jpeg', '.jpg', '.webp'):
        p = os.path.join(SH, f'bogen_{n}{ext}')
        if os.path.exists(p): return p
    return None

# ---------- 1. Bild bereinigen ----------
def remove_cross(a, lo=506, hi=518):
    """Schwarzes Trennkreuz (4 px breit bei 510-513): Pixel aus den Nachbarspalten/-zeilen übernehmen (interpolieren)."""
    a = a.astype(np.float32)
    for x in range(lo + 3, hi - 3 + 1):
        t = (x - lo) / (hi - lo); a[:, x] = a[:, lo] * (1 - t) + a[:, hi] * t
    for y in range(lo + 3, hi - 3 + 1):
        t = (y - lo) / (hi - lo); a[y, :] = a[lo, :] * (1 - t) + a[hi, :] * t
    return np.clip(a, 0, 255).astype(np.uint8)

def border_bg(a):
    """Hintergrundfarbe = Median der Randpixel, die nicht dunkel sind (Eckmarken/Linien ausgenommen)."""
    e = np.concatenate([a[16:20, 16:-16].reshape(-1, 3), a[-20:-16, 16:-16].reshape(-1, 3), a[16:-16, 16:20].reshape(-1, 3), a[16:-16, -20:-16].reshape(-1, 3)])
    e = e[e.mean(axis=1) > 90]
    return np.median(e, axis=0)

def erase_text(a, rects, thr=90):
    """Schwarze Schrift (max. Kanal < thr) im Rechteck durch den nächsten Nicht-Schrift-Pixel ersetzen (Hintergrund bzw. Schwanzfell)."""
    a = a.copy()
    for x0, y0, x1, y1 in rects:
        sub = a[y0:y1, x0:x1]; txt = sub.max(axis=2) < thr
        txt = ndi.binary_dilation(txt, iterations=3)
        idx = ndi.distance_transform_edt(txt, return_distances=False, return_indices=True)
        a[y0:y1, x0:x1] = sub[idx[0], idx[1]]
    return a

def clean_sheet(n, cfg):
    a = np.array(Image.open(find(n)).convert('RGB'))
    bgc = border_bg(a)
    if cfg.get('cross'): a = remove_cross(a)
    for x0, y0, x1, y1 in cfg.get('wipe', []): a[y0:y1, x0:x1] = bgc.astype(np.uint8)
    if cfg.get('text'): a = erase_text(a, cfg['text'])
    return a

# ---------- 2. Freistellen ----------
def local_std(lum, k=5):
    m1 = ndi.uniform_filter(lum, k); m2 = ndi.uniform_filter(lum * lum, k)
    return np.sqrt(np.maximum(m2 - m1 * m1, 0))

def key_out(rgb, mode, log=None):
    """Hintergrund -> Alpha. Randverbundene, flache Hintergrundflächen + eingeschlossene flache Taschen (zwischen Armen/Schwänzen) werden
    transparent; ein 3-px-Saum bekommt weiche Deckkraft (Hintergrundfarbe wird herausgerechnet)."""
    f = rgb.astype(np.int16); lum = f.mean(axis=2); sat = f.max(axis=2) - f.min(axis=2); std = local_std(lum.astype(np.float32))
    if mode == 'checker':
        cols = [np.array([255, 255, 255]), np.array([210, 210, 210])]
        dist = np.minimum.reduce([np.abs(f - c).max(axis=2) for c in cols]).astype(np.float32)
        cand = (sat <= 26) & (lum >= 188)          # Schachbrett: zwei helle Neutraltöne + Gitterlinien dazwischen -> nur Farbklasse, keine Flachheit
    else:
        bg = border_bg(rgb); dist = np.abs(f - bg).max(axis=2).astype(np.float32); light = bg.mean() > 225
        # weiß/hellgrau: alles Neutral-Helle nahe der Hintergrundfarbe (Figur hat dort dunkle Linien); mittelgrau: nur flache Flächen (Schwanzfell ist ähnlich grau)
        cand = ((dist <= 22) & (sat <= 14)) if light else ((dist <= 24) & (std < 6))
    lab, cnt = ndi.label(cand)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgm = np.isin(lab, list(border))
    # eingeschlossene Taschen (zwischen Armen/Schwänzen): beim Schachbrett nur reine Brettfarben (helles Gesichtsfell/Bandagen sind bläulich/cremig und bleiben),
    # danach 3 px aufweiten, damit die Gitterlinien zwischen den Feldern mitgehen
    tight = cand & (dist < 16) & (sat <= 14) & (std < 5) if mode == 'checker' else cand   # Bandagen haben Textur (std), Brettfelder sind flach
    lab2, cnt2 = ndi.label(tight & ~bgm); sizes = ndi.sum(tight & ~bgm, lab2, range(1, cnt2 + 1))
    pockets = [i + 1 for i, s in enumerate(sizes) if s >= (80 if mode == 'checker' else 30)]
    pm = np.isin(lab2, pockets)
    if mode == 'checker':      # reinweiße Brettfelder auch als kleine Taschen (zwischen Beinen/Armen); Bandagen werden nie so hell
        wh = (lum >= 243) & (sat <= 8) & ~bgm; lw, cw_ = ndi.label(wh); sw = ndi.sum(wh, lw, range(1, cw_ + 1))
        pm = pm | np.isin(lw, [i + 1 for i, v in enumerate(sw) if v >= 10])
    pm = ndi.binary_dilation(pm, iterations=3 if mode == 'checker' else 2) & cand
    bgm = bgm | pm
    if log: log(f'    Hintergrund: {mode}, {len(pockets)} eingeschlossene Taschen entfernt')
    near = ndi.binary_dilation(bgm, iterations=3) & ~bgm
    alpha = np.where(bgm, 0.0, 1.0).astype(np.float32)
    al = np.clip((dist - 16) / 38.0, 0, 1)
    if mode == 'checker' or (mode == 'flat' and bg.mean() > 225): al = np.where((lum > 196) & (sat <= 22), 0.0, al)   # heller Neutral-Rest am Rand = Hintergrund
    alpha = np.where(near, al, alpha)
    out = f.astype(np.float32)
    if mode == 'checker':
        bgcol = np.where((np.abs(f - 255).max(axis=2) < np.abs(f - 210).max(axis=2))[..., None], 255.0, 210.0) * np.ones(3)
    else:
        bgcol = np.broadcast_to(border_bg(rgb), f.shape)
    sel = near & (alpha > 0.02)
    out[sel] = (out[sel] - (1 - alpha[sel][:, None]) * bgcol[sel]) / np.maximum(alpha[sel][:, None], 0.05)
    rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

# ---------- 3. Posen ausschneiden ----------
def slice_poses(im, n=4):
    """Die n größten zusammenhängenden Figuren (inkl. Schwänze/Staub, nahe Kleinteile werden der nächsten Figur zugeordnet).
    Reihenfolge: 2 + 2 in Lesereihenfolge (oben links -> unten rechts)."""
    a = np.array(im); al = a[:, :, 3] > 16
    for it in (10, 8, 6, 4, 3, 2):
        lab, cnt = ndi.label(ndi.binary_dilation(al, iterations=it))
        if cnt >= n:
            top = sorted(ndi.sum(al, lab, range(1, cnt + 1)), reverse=True)
            if top[n - 1] > 0.3 * top[0] and (cnt == n or top[n] < 0.06 * top[0]): break
    else: return None
    sizes = ndi.sum(al, lab, range(1, cnt + 1)); order = np.argsort(sizes)[::-1] + 1
    main = list(order[:n]); boxes = ndi.find_objects(lab)
    def center(l): b = boxes[l - 1]; return ((b[0].start + b[0].stop) / 2, (b[1].start + b[1].stop) / 2)
    owner = {l: l for l in main}
    for l in order[n:]:
        if (al & (lab == l)).sum() < 300: continue          # Staub-/Beschriftungsreste
        cy, cx = center(l); owner[l] = min(main, key=lambda m: (center(m)[0] - cy) ** 2 + (center(m)[1] - cx) ** 2)
    out = []
    for m in main:
        mask = np.isin(lab, [l for l, o in owner.items() if o == m]) & (a[:, :, 3] > 0)
        b = a.copy(); b[:, :, 3] = np.where(mask, a[:, :, 3], 0); out.append((center(m), Image.fromarray(b)))
    rows = sorted(out, key=lambda t: t[0][0]); res = []
    for i in (0, 2): res += [img for _, img in sorted(rows[i:i + 2], key=lambda t: t[0][1])]
    return res

# ---------- 4. Messen ----------
def masks(arr):
    r, g, b = [arr[:, :, i].astype(np.int16) for i in range(3)]; lum = (r + g + b) / 3; a = arr[:, :, 3] > A_BODY
    body = a & (lum < 165)                                           # Fell, Kleidung, Linien (ohne helle Staub-/Schlierenwolken)
    purple = a & (b > g + 25) & (b > r + 25) & (lum < 170)           # blaue Schärpe/Schurz/Edelstein -> Körpermitte (ohne den Schwanz)
    return body, purple

def measure(cell):
    arr = np.array(cell); a = arr[:, :, 3]; h, w = a.shape
    ys, xs = np.where(a > T.A_TRIM); body, purple = masks(arr)
    rows = np.where(body.sum(axis=1) >= 3)[0]; py, px = np.where(purple)
    if len(xs) == 0 or len(rows) == 0 or len(px) < 30: return None
    return dict(crop=(max(xs.min() - 2, 0), max(ys.min() - 2, 0), min(xs.max() + 3, w), min(ys.max() + 3, h)),
                top=int(rows.min()), foot=int(rows.max()) + 1, ax=int(np.median(px)), ay=int(np.median(py)),
                edge=bool(a[0].max() > A_BODY or a[-1].max() > A_BODY or a[:, 0].max() > A_BODY or a[:, -1].max() > A_BODY))

def sig(img):
    """Kleine Signatur (Alpha + Farbe, 48x48) zum Erkennen doppelter Posen."""
    bb = img.getbbox(); im = img.crop(bb); s = max(im.size)
    sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
    return np.array(sq.resize((48, 48), Image.LANCZOS)).astype(np.float32) / 255

def main():
    notes = []; log = lambda s: (notes.append(s), print(s))
    cells = {}; mets = {}
    for n in sorted(SHEETS):
        if not find(n): log(f'! Bogen {n}: Datei fehlt'); continue
        cfg = SHEETS[n]
        if cfg['bg'] == 'alpha': im = Image.open(find(n)).convert('RGBA')
        else: rgb = clean_sheet(n, cfg); im = key_out(rgb, cfg['bg'], log=lambda s: None)
        imgs = slice_poses(im, 4)
        if imgs is None: log(f'! Bogen {n}: 4 Posen nicht erkannt - übersprungen'); continue
        log(f'- Bogen {n}: Hintergrund {cfg["bg"]}{", Trennkreuz entfernt" if cfg.get("cross") else ""}{", Beschriftung entfernt" if cfg.get("text") else ""}, 4 Posen erkannt')
        for i, c in enumerate(imgs): cells[(n, i)] = c; mets[(n, i)] = measure(c)
    if REF not in cells: print('Referenzpose fehlt - nichts zu tun'); return 1
    m0 = mets[REF]; href = m0['foot'] - m0['top']; s = STAND_H / href
    log(f'Maßstab: neutrale Haltung {href} px -> {STAND_H} (x{s:.3f})')
    frames = {}; sigs = {}
    for (n, i), c in sorted(cells.items()):
        m = mets[(n, i)]
        if m is None: log(f'  ! Bogen {n} / Zelle {i + 1}: leer'); continue
        if (n, i) in SKIP: log(f'  Bogen {n} / Zelle {i + 1}: übersprungen, doppelt ({SKIP[(n, i)]} ist schon in einem früheren Bogen)'); continue
        if m['edge']: log(f'  ! Bogen {n} / Zelle {i + 1}: Figur berührt den Zellrand (evtl. abgeschnitten)')
        x0, y0, x1, y1 = m['crop']; img = c.crop((x0, y0, x1, y1))
        sg = sig(img)
        dup = next((k for k, v in sigs.items() if np.abs(v - sg).mean() < DUP_TOL), None)
        if dup: log(f'  Bogen {n} / Zelle {i + 1}: übersprungen, doppelt (identisch mit Bogen {dup[0]}, Zelle {dup[1] + 1})'); continue
        sigs[(n, i)] = sg
        ss = s * SHEET_SC[n]
        img = img.resize((max(1, round(img.width * ss)), max(1, round(img.height * ss))), Image.LANCZOS)
        frames[f'p_{n}_{i}'] = dict(img=img, ox=round((x0 - m['ax']) * ss), oy=round((y0 - m['foot']) * ss))
        if (n, i) in AIR:   # Luft-Variante: Körpermitte (Hüfte) fest auf AIR_CENTER über der Fußlinie
            frames[f'p_{n}_{i}a'] = dict(img=img, share=f'p_{n}_{i}', ox=round((x0 - m['ax']) * ss), oy=round((y0 - m['ay']) * ss - AIR_CENTER))
    atlas, meta = T.pack(frames)
    atlas.save(os.path.join(DIR, 'atlas.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
    data = json.dumps(dict(frames=meta, standH=STAND_H, atlas=[atlas.width, atlas.height], cell=472, anims={}))   # Animationen: sprites.js
    open(os.path.join(DIR, 'meta.json'), 'w').write(data)
    open(os.path.join(DIR, 'meta.js'), 'w').write("(window.__SPRITES__=window.__SPRITES__||{}).anubis={meta:" + data + "};")
    log(f'Atlas {atlas.width}x{atlas.height}, {round(os.path.getsize(os.path.join(DIR, "atlas.webp")) / 1024)} KB, {len(meta)} Frames')
    # Vorschau: alle Frames auf der Fußlinie (Kontrolle von Ausrichtung und Maßstab)
    P = .5; CW = 260; names = sorted(frames, key=lambda k: (int(k.split('_')[1]), k)); cols = 6; rows = (len(names) + cols - 1) // cols; CH = 240
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
