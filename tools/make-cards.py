#!/usr/bin/env python3
"""Erzeugt die Sammelkarten-Bilder assets/cards/<karten-id>.webp (600x840, Hochformat 5:7).

Je Karte: Hintergrund in der Figurenfarbe (Glow, Schraffur, Lichtstrahlen) + eine Kampfpose
der Figur aus ihrem Sprite-Atlas (assets/<sprite>/atlas.webp + meta.json).
Name/Seltenheit/Text zeichnet das Spiel selbst darüber (render/lootui.js, unteres Drittel wird abgedunkelt)
-> die Figur sitzt im oberen ~75 % der Karte.

Aufruf:  python3 tools/make-cards.py        (danach: node tools/build.mjs)
Neue Karte: Eintrag in CARDS unten (karten-id wie in src/core/loot.js, Sprite-Ordner, Frame-Name, Akzentfarbe).
"""
import json, math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H = 600, 840
FIG_BOX = (520, 520)      # größte Figurenbreite/-höhe in px (inkl. Effekte wie Schwung/Staub)
FOOT_Y = 640              # Fußlinie der Figur auf der Karte (Name-Leiste beginnt bei ~ 0.84*H)

# karten-id: (sprite-ordner, frame, akzentfarbe, größe-faktor)
CARDS = {
    'tiger':   ('tiger',   't_neu_posen_01', (63, 224, 255), 1.00),
    'st3g0':   ('st3g0',   'p_9_3',          (125, 255, 74), 1.00),
    'kitsune': ('kitsune', 'p_1_2',          (180, 107, 255), 1.00),
    'anubis':  ('anubis',  'p_3_3',          (255, 212, 90), 1.00),
    'alpha':   ('mantis',  'p_1_2',          (255, 122, 58), 1.00),
    'krieger': ('mantis',  'p_2_2',          (125, 255, 154), 1.00),
    'spaeher': ('mantis',  'p_3_1',          (150, 190, 255), 1.00),
    'sichel':  ('rabe',    'c_6',            (200, 120, 255), 1.00),
    'schwarm': ('rabe',    'c_8',            (181, 124, 255), 1.00),
    'korvus':  ('rabe',    'c_0',            (160, 110, 255), 1.00),
    'blutrausch': ('cyberdemon', 'a_3',      (255, 90, 50),   1.00),
    'cyberdemon': ('cyberdemon', 'i_2',      (255, 50, 70),   1.00),
    'blitz':   ('tiger',   't_neu_blitz_02', (95, 208, 255),  1.00),
    'larve':   ('mantis',  'p_1_0',          (140, 255, 120), .80),
    'koenigin': ('mantis', 'p_2_0',          (255, 80, 200),  1.00),
    'wirbel':  ('tiger',   't_neu_tritt_01', (63, 224, 255),  1.00),
    # --- Erweiterung: Spezialattacken, Hyper-Moves, Siegesposen ---
    'tigerklaue':   ('tiger',   't_neu_posen_02',  (63, 224, 255),  1.00),
    'flugtritt':    ('tiger',   't_neu_tritt_02',  (63, 224, 255),  1.00),
    'tiger_sieg':   ('tiger',   't_neu_sieg_01',   (63, 224, 255),  1.00),
    'siegesbruell': ('tiger',   't_neu_sieg_00',   (95, 208, 255),  1.00),
    'blitzladung':  ('tiger',   't_neu_blitz_03',  (95, 208, 255),  1.00),
    'feueratem':    ('st3g0',   'p_7_2',           (125, 255, 74),  1.00),
    'drachenfluegel': ('st3g0', 'p_12_0',          (90, 255, 200),  1.00),
    'drachenuppercut': ('st3g0', 'p_8_2',          (125, 255, 74),  1.00),
    'klauenhieb':   ('st3g0',   'p_9_3',           (150, 230, 80),  1.00),
    'fuchsfeuer':   ('kitsune', 'p_2_2',           (180, 107, 255), 1.00),
    'neunschwanz':  ('kitsune', 'p_14_3',          (140, 150, 255), 1.00),
    'meditation':   ('kitsune', 'p_14_2',          (180, 107, 255), 1.00),
    'fuchssprung':  ('kitsune', 'p_10_2',          (200, 120, 255), 1.00),
    'fuchshieb':    ('kitsune', 'p_12_2',          (180, 107, 255), 1.00),
    'seelenwelle':  ('anubis',  'p_3_1',           (255, 212, 90),  1.00),
    'goldsichel':   ('anubis',  'p_3_3',           (255, 200, 70),  1.00),
    'goldtritt':    ('anubis',  'p_3_2',           (255, 212, 90),  1.00),
    'schakalblock': ('anubis',  'p_6_2',           (230, 190, 80),  1.00),
    'rabendornen':  ('rabe',    'c_9',             (181, 124, 255), 1.00),
    'korvus_sieg':  ('rabe',    'c_11',            (160, 110, 255), 1.00),
    'fluegelsprung': ('rabe',   'j_8',             (110, 130, 255), 1.00),
    'klauenwelle':  ('cyberdemon', 'a_2',          (255, 60, 70),   1.00),
    'gegenhand':    ('cyberdemon', 'a_7',          (255, 90, 50),   1.00),
    'daemonenatem':  ('cyberdemon', 'i_4',          (255, 50, 70),   1.00),
}


def mix(c, d, t):
    return tuple(int(c[i] + (d[i] - c[i]) * t) for i in range(3))


def background(acc, seed):
    rnd = random.Random(seed)
    dark = mix(acc, (4, 8, 14), .88)
    mid = mix(acc, (6, 12, 20), .72)
    bg = Image.new('RGB', (W, H), dark)
    # senkrechter Verlauf
    px = ImageDraw.Draw(bg)
    for y in range(H):
        t = y / H
        px.line([(0, y), (W, y)], fill=mix(mix(acc, (3, 6, 10), .78), (2, 5, 9), t))
    # großer Glow hinter der Figur
    glow = Image.new('RGB', (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, 400
    for r in range(330, 0, -6):
        k = (1 - r / 330) ** 1.8
        gd.ellipse([cx - r, cy - r * 1.15, cx + r, cy + r * 1.15], fill=mix((0, 0, 0), acc, .62 * k))
    bg = ImageChops.add(bg, glow)
    # Lichtstrahlen von hinten
    rays = Image.new('RGB', (W, H), (0, 0, 0))
    rd = ImageDraw.Draw(rays)
    for i in range(14):
        a = rnd.uniform(0, math.tau)
        w = rnd.uniform(.03, .08)
        L = 900
        rd.polygon([(cx, cy), (cx + L * math.cos(a - w), cy + L * math.sin(a - w)),
                    (cx + L * math.cos(a + w), cy + L * math.sin(a + w))], fill=mix((0, 0, 0), acc, .13))
    rays = rays.filter(ImageFilter.GaussianBlur(5))
    bg = ImageChops.add(bg, rays)
    # diagonale Schraffur (leicht)
    hatch = Image.new('RGB', (W, H), (0, 0, 0))
    hd = ImageDraw.Draw(hatch)
    for x in range(-H, W, 22):
        hd.line([(x, H), (x + H, 0)], fill=mix((0, 0, 0), acc, .07), width=2)
    bg = ImageChops.add(bg, hatch)
    # Funken
    sp = Image.new('RGB', (W, H), (0, 0, 0))
    sd = ImageDraw.Draw(sp)
    for _ in range(60):
        x, y = rnd.randint(14, W - 14), rnd.randint(14, 700)
        r = rnd.choice([1, 1, 2, 2, 3])
        sd.ellipse([x - r, y - r, x + r, y + r], fill=mix((0, 0, 0), (255, 255, 255), rnd.uniform(.25, .7)))
    sp = ImageChops.add(sp, sp.filter(ImageFilter.GaussianBlur(3)))
    bg = ImageChops.add(bg, sp)
    # Boden-Schimmer unter den Füßen
    fl = Image.new('RGB', (W, H), (0, 0, 0))
    fd = ImageDraw.Draw(fl)
    for i in range(8):
        fd.ellipse([cx - 250 + i * 14, FOOT_Y - 20 + i * 2, cx + 250 - i * 14, FOOT_Y + 34 - i * 2],
                   fill=mix((0, 0, 0), acc, .05 + i * .012))
    bg = ImageChops.add(bg, fl.filter(ImageFilter.GaussianBlur(6)))
    # Vignette
    vg = Image.new('L', (W, H), 0)
    vd = ImageDraw.Draw(vg)
    vd.ellipse([-120, -80, W + 120, H + 160], fill=255)
    vg = vg.filter(ImageFilter.GaussianBlur(90))
    black = Image.new('RGB', (W, H), (1, 3, 6))
    bg = Image.composite(bg, black, vg)
    return bg


def sprite(sid, frame):
    atlas = Image.open(os.path.join(ROOT, 'assets', sid, 'atlas.webp')).convert('RGBA')
    f = json.load(open(os.path.join(ROOT, 'assets', sid, 'meta.json')))['frames'][frame]
    return atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), f


def make(cid, sid, frame, acc, size):
    bg = background(acc, cid).convert('RGBA')
    im, f = sprite(sid, frame)
    k = min(FIG_BOX[0] / im.width, FIG_BOX[1] / im.height) * size
    im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    # Fußlinie: oy ist negativ (Frame-Oberkante über der Fußlinie)
    foot_off = int((f['h'] + f['oy']) * k)   # Pixel unter der Fußlinie (Effekte)
    x = (W - im.width) // 2
    y = FOOT_Y - im.height + foot_off
    # Schatten + Rand-Glow in Akzentfarbe
    a = im.split()[3]
    halo = Image.new('RGBA', im.size, acc + (0,))
    halo.putalpha(a.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * .55)))
    shadow = Image.new('RGBA', im.size, (0, 0, 0, 0))
    shadow.putalpha(a.filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * .7)))
    bg.alpha_composite(halo, (x, y))
    bg.alpha_composite(shadow, (x + 6, y + 10))
    bg.alpha_composite(im, (x, y))
    out = bg.convert('RGB')
    path = os.path.join(ROOT, 'assets', 'cards', cid + '.webp')
    out.save(path, 'WEBP', quality=90, method=6)
    print(cid, '->', path, os.path.getsize(path) // 1024, 'KB')
    return out


def make_item(cid, kind, acc):
    """Item-Karten (Energydrink, Elixier, Hyper-Kristall): Motiv wird selbst gezeichnet (4x Supersampling)."""
    S = 3
    bg = background(acc, cid).convert('RGBA')
    L = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    cx, base = W * S // 2, 600 * S
    lite = mix(acc, (255, 255, 255), .55)
    dark = mix(acc, (0, 0, 0), .55)
    if kind == 'drink':      # Dose mit Blitz
        bw, bh = 190 * S, 330 * S
        x0, y0 = cx - bw // 2, base - bh
        d.rounded_rectangle([x0, y0, x0 + bw, base], radius=26 * S, fill=dark, outline=lite, width=4 * S)
        d.rounded_rectangle([x0 + 18 * S, y0 + 40 * S, x0 + bw - 18 * S, base - 40 * S], radius=18 * S, fill=acc)
        d.rectangle([x0 + 10 * S, y0, x0 + bw - 10 * S, y0 + 22 * S], fill=lite)
        d.ellipse([cx - 22 * S, y0 - 8 * S, cx + 22 * S, y0 + 14 * S], fill=(30, 40, 40))
        bolt = [(cx + 18 * S, y0 + 70 * S), (cx - 46 * S, y0 + 175 * S), (cx - 2 * S, y0 + 175 * S),
                (cx - 22 * S, y0 + 270 * S), (cx + 50 * S, y0 + 150 * S), (cx + 4 * S, y0 + 150 * S)]
        d.polygon(bolt, fill=(255, 255, 255))
    elif kind == 'elixir':   # Kolben mit Flüssigkeit und Blasen
        r = 125 * S
        ccy = base - r
        d.rectangle([cx - 34 * S, ccy - 215 * S, cx + 34 * S, ccy - 40 * S], fill=lite)
        d.ellipse([cx - r, ccy - r, cx + r, ccy + r], fill=lite)
        d.ellipse([cx - r + 10 * S, ccy - r + 10 * S, cx + r - 10 * S, ccy + r - 10 * S], fill=(12, 16, 28))
        liq = Image.new('RGBA', L.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(liq)
        ld.ellipse([cx - r + 10 * S, ccy - r + 10 * S, cx + r - 10 * S, ccy + r - 10 * S], fill=acc)
        ld.rectangle([0, 0, W * S, ccy - 25 * S], fill=(0, 0, 0, 0))
        L.alpha_composite(liq)
        d = ImageDraw.Draw(L)
        d.rectangle([cx - 24 * S, ccy - 205 * S, cx + 24 * S, ccy - 50 * S], fill=(12, 16, 28))
        d.rounded_rectangle([cx - 42 * S, ccy - 245 * S, cx + 42 * S, ccy - 205 * S], radius=10 * S, fill=(150, 100, 60))
        for bx, by, br in [(-40, 40, 14), (30, 10, 10), (-10, 85, 8), (55, 70, 12), (-65, -5, 7)]:
            d.ellipse([cx + (bx - br) * S, ccy + (by - br) * S, cx + (bx + br) * S, ccy + (by + br) * S], outline=lite, width=3 * S)
    else:                    # Hyper-Kristall
        top, bot, mid = base - 380 * S, base, base - 190 * S
        w2 = 150 * S
        pts = {'t': (cx, top), 'l': (cx - w2, mid), 'r': (cx + w2, mid), 'b': (cx, bot), 'tl': (cx - 55 * S, mid - 70 * S), 'tr': (cx + 55 * S, mid - 70 * S)}
        facets = [([pts['t'], pts['l'], pts['tl']], lite), ([pts['t'], pts['tl'], pts['tr']], mix(acc, (255, 255, 255), .25)),
                  ([pts['t'], pts['tr'], pts['r']], acc), ([pts['l'], pts['tl'], pts['b']], mix(acc, (0, 0, 0), .2)),
                  ([pts['tl'], pts['tr'], pts['b']], acc), ([pts['tr'], pts['r'], pts['b']], dark)]
        for poly, col in facets:
            d.polygon(poly, fill=col, outline=(255, 255, 255), width=3 * S)
    L = L.resize((W, H), Image.LANCZOS)
    a = L.split()[3]
    halo = Image.new('RGBA', (W, H), acc + (0,))
    halo.putalpha(a.filter(ImageFilter.GaussianBlur(22)).point(lambda v: int(v * .8)))
    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shadow.putalpha(a.filter(ImageFilter.GaussianBlur(10)).point(lambda v: int(v * .7)))
    bg.alpha_composite(halo)
    bg.alpha_composite(shadow, (6, 10))
    bg.alpha_composite(L)
    path = os.path.join(ROOT, 'assets', 'cards', cid + '.webp')
    bg.convert('RGB').save(path, 'WEBP', quality=90, method=6)
    print(cid, '->', path, os.path.getsize(path) // 1024, 'KB')


ITEM_CARDS = {'drink': ('drink', (125, 255, 154)), 'elixir': ('elixir', (185, 139, 255)), 'crystal': ('crystal', (255, 210, 63))}


if __name__ == '__main__':
    import sys
    force = '--force' in sys.argv    # ohne --force werden vorhandene Karten-Bilder nicht überschrieben (eigene Karten-Art bleibt)
    os.makedirs(os.path.join(ROOT, 'assets', 'cards'), exist_ok=True)
    have = lambda cid: os.path.exists(os.path.join(ROOT, 'assets', 'cards', cid + '.webp'))
    for cid, (sid, frame, acc, size) in CARDS.items():
        if force or not have(cid):
            make(cid, sid, frame, acc, size)
    for cid, (kind, acc) in ITEM_CARDS.items():
        if force or not have(cid):
            make_item(cid, kind, acc)
