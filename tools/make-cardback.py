#!/usr/bin/env python3
"""Zeichnet die Kartenrückseite assets/cards/back.webp (600x840): violette Kristall-Raute im Doppelrahmen.
Aufruf:  python3 tools/make-cardback.py   (danach: node tools/build.mjs)"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
W, H, S = 600, 840, 2                      # S = Supersampling
CX, CY = W / 2, H / 2
LAV = (226, 205, 255)                      # Linienfarbe (helles Lavendel)
WHT = (250, 244, 255)


def P(pts):
    return [(x * S, y * S) for x, y in pts]


def line(d, pts, w, col=LAV):
    d.line(P(pts), fill=col, width=max(1, int(w * S)), joint='curve')


def poly(d, pts, w, col=LAV):
    line(d, list(pts) + [pts[0], pts[1]], w, col)


def glow(layer, r, k=1.0):
    return ImageChops.add(layer, layer.filter(ImageFilter.GaussianBlur(r * S)).point(lambda v: min(255, int(v * k))))


def main():
    rnd = random.Random(7)
    # --- Hintergrund: violetter Verlauf mit hellem Kern ---
    bg = Image.new('RGB', (W * S, H * S), (22, 4, 64))
    px = bg.load()
    for y in range(0, H * S):
        for x in range(0, W * S):
            dx, dy = (x / S - CX) / 300, (y / S - CY) / 420
            d = min(1.0, math.hypot(dx, dy))
            t = (1 - d) ** 1.6
            px[x, y] = (int(34 + 165 * t), int(8 + 52 * t), int(88 + 150 * t))
    # --- feine Risse/Funken im Hintergrund ---
    cr = Image.new('RGB', bg.size, (0, 0, 0))
    cd = ImageDraw.Draw(cr)
    for _ in range(34):
        x, y = rnd.uniform(50, W - 50), rnd.uniform(50, H - 50)
        a = rnd.uniform(0, math.tau)
        L = rnd.uniform(20, 70)
        cd.line(P([(x, y), (x + L * math.cos(a), y + L * math.sin(a))]), fill=(70, 40, 130), width=S)
    bg = ImageChops.add(bg, cr.filter(ImageFilter.GaussianBlur(1)))

    L = Image.new('RGB', bg.size, (0, 0, 0))    # Linienebene (wird mit Glow addiert)
    d = ImageDraw.Draw(L)

    # --- Doppelrahmen ---
    d.rounded_rectangle([12 * S, 12 * S, (W - 12) * S, (H - 12) * S], radius=26 * S, outline=LAV, width=11 * S)
    d.rounded_rectangle([32 * S, 32 * S, (W - 32) * S, (H - 32) * S], radius=16 * S, outline=LAV, width=3 * S)
    # Eck-Ornamente (Kreis + Spirale)
    for ox, oy in [(62, 62), (W - 62, 62), (62, H - 62), (W - 62, H - 62)]:
        d.ellipse([(ox - 17) * S, (oy - 17) * S, (ox + 17) * S, (oy + 17) * S], outline=LAV, width=3 * S)
        d.ellipse([(ox - 6) * S, (oy - 6) * S, (ox + 6) * S, (oy + 6) * S], outline=WHT, width=2 * S)
    # Zierleisten oben/unten (kleine Dreiecke)
    for sy, sg in [(70, 1), (H - 70, -1)]:
        line(d, [(CX - 150, sy), (CX + 150, sy)], 2)
        poly(d, [(CX - 32, sy), (CX, sy + 26 * sg), (CX + 32, sy)], 2)
        poly(d, [(CX - 150, sy), (CX - 120, sy + 18 * sg), (CX - 90, sy)], 2)
        poly(d, [(CX + 90, sy), (CX + 120, sy + 18 * sg), (CX + 150, sy)], 2)

    # --- große Kristall-Geometrie um die Raute ---
    for sx in (-1, 1):
        ex = CX + sx * 240                                   # linke/rechte Spitze
        for sy in (-1, 1):
            m = CY + sy * (CY - 128)                         # Höhe der Dreiecksspitze (oben/unten)
            poly(d, [(CX + sx * 245, CY + sy * 255), (CX + sx * 92, CY + sy * 215), (CX + sx * 78, m)], 2.2)   # Dreieck
            line(d, [(CX + sx * 78, m), (ex, CY)], 2.2)                      # Kante Dreieck -> Spitze
            line(d, [(CX + sx * 245, CY + sy * 255), (CX + sx * 262, CY + sy * 160)], 2.2)
            line(d, [(CX + sx * 262, CY + sy * 160), (ex, CY)], 2.2)
            line(d, [(CX + sx * 78, m), (CX + sx * 10, CY + sy * 245)], 2)
            line(d, [(CX + sx * 262, CY + sy * 330), (CX + sx * 150, CY + sy * 300), (CX + sx * 20, CY + sy * 372)], 2)
        line(d, [(ex, CY), (CX + sx * 140, H - 135)], 2.2)
        line(d, [(ex, CY), (CX + sx * 140, 135)], 2.2)

    # --- verschachtelte Rauten ---
    def diamond(hw, hh, w, col=WHT):
        poly(d, [(CX, CY - hh), (CX + hw, CY), (CX, CY + hh), (CX - hw, CY)], w, col)

    diamond(232, 248, 5.5)
    diamond(214, 228, 2, LAV)
    diamond(176, 188, 5)
    diamond(158, 168, 2, LAV)
    diamond(118, 126, 3)
    # Mittellinien
    line(d, [(CX, CY - 248), (CX, CY + 248)], 1.4, (170, 120, 240))
    line(d, [(CX - 232, CY), (CX + 232, CY)], 1.4, (170, 120, 240))

    # --- Blüten-Blätter um den Kern ---
    for i in range(8):
        a = i * math.tau / 8
        pts = []
        for k in range(0, 21):
            t = k / 20
            r = 14 + 78 * math.sin(t * math.pi) ** .9
            off = 18 * math.sin(t * math.pi) * (1 if i % 2 else -1) * .5
            ang = a + off / 90
            pts.append((CX + (14 + t * 78) * math.cos(ang), CY + (14 + t * 78) * math.sin(ang) * 1.08))
        line(d, pts, 1.8, (235, 215, 255))
    d.ellipse([(CX - 58) * S, (CY - 58) * S, (CX + 58) * S, (CY + 58) * S], outline=(190, 140, 255), width=2 * S)

    lines = glow(L, 2.5, .55)
    lines = glow(lines, 9, .35)
    img = ImageChops.screen(bg, lines)

    # --- heller Kern ---
    core = Image.new('RGB', bg.size, (0, 0, 0))
    cdr = ImageDraw.Draw(core)
    cdr.polygon(P([(CX, CY - 40), (CX + 28, CY), (CX, CY + 32), (CX - 28, CY)]), fill=(255, 255, 255))
    core = glow(glow(core, 7, 1.0), 20, .7)
    img = ImageChops.screen(img, core)
    # Rahmen nochmal scharf drüber
    sharp = ImageDraw.Draw(img)
    sharp.rounded_rectangle([12 * S, 12 * S, (W - 12) * S, (H - 12) * S], radius=26 * S, outline=LAV, width=9 * S)
    sharp.rounded_rectangle([32 * S, 32 * S, (W - 32) * S, (H - 32) * S], radius=16 * S, outline=LAV, width=3 * S)

    out = img.resize((W, H), Image.LANCZOS)
    path = os.path.join(ROOT, 'assets', 'cards', 'back.webp')
    out.save(path, 'WEBP', quality=92, method=6)
    print('->', path, os.path.getsize(path) // 1024, 'KB')


if __name__ == '__main__':
    main()
