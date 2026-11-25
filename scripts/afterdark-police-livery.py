"""Paints the Port Aurora Police livery baked into the Afterdark 2020 Police Interceptor Utility
(evermile/assets/models/car-police-interceptor.glb).

The model's body has no texture coordinates of its own, so its build projects this 2 x 2 atlas onto the painted panels
the same way afterdark/src/escalade-wrap.js does: top-left = side facing +x (front of the car at the left), top-right =
side facing -x (front at the right), bottom-left = bonnet (front of the car at the bottom), bottom-right = tailgate.
Within each quadrant the horizontal axis runs along the panel and the vertical axis is height above the ground (roof at
the top; on the bonnet, distance back from its front edge). The artwork is composited over the car's black paint.
Run: python3 scripts/afterdark-police-livery.py <out.png>
"""
import math
import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 4096, 1536
QW, QH = W // 2, H // 2
S = QH / 576  # type sizes below are for a 576 px tall quadrant
PAINT = (13, 14, 17, 255)
# Along the side (u: 0 = front bumper, 1 = rear bumper; y: fraction of the roof height): the white field over the doors,
# the badge and lettering positions within it, and the unit number between the rear door and the tail lamp.
DOOR, FIELD, BADGE_AT, LETTER_AT, LETTER_SIZE, UNIT_AT = (0.316, 0.757), (0.27, 0.632), 0.12, 0.52, 0.74, (0.823, 0.57)
# Bonnet: heights of POLICE, the unit number and the gold rule; tailgate: POLICE, the department line, the chevron band.
HOOD, TAIL = (0.4, 0.7, 0.555), (0.565, 0.49, 0.445, 0.365)
# The bonnet and tailgate quadrants cover less of the car per pixel across than up, so their lettering is drawn flatter
# to read in proportion on the panel.
HOOD_SQUASH, TAIL_SQUASH = 0.51, 0.47
FONT = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
FONT2 = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
WHITE, BLACK, GOLD, BLUE, RED, AMBER = (246, 246, 242, 255), (14, 15, 18, 255), (201, 160, 62, 255), (24, 58, 138, 255), (196, 22, 32, 255), (246, 178, 20, 255)
DEPT, UNIT = 'PORT AURORA', '21'

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)


def font(path, size):
    return ImageFont.truetype(path, max(8, round(size * S)))


def text(x, y, s, f, fill, spacing=0, sy=1):
    """Centred text, letter-spaced; sy < 1 draws it on a scratch layer and pastes it squashed vertically."""
    global d
    if sy != 1:
        w = int(sum(d.textlength(ch, font=f) for ch in s) + spacing * len(s) + f.size * 2); h = int(f.size * 2)
        layer = Image.new('RGBA', (w, h), (0, 0, 0, 0)); keep, d = d, ImageDraw.Draw(layer)
        text(w / 2, h / 2, s, f, fill, spacing); d = keep
        layer = layer.resize((w, max(1, round(h * sy))), Image.LANCZOS)
        img.alpha_composite(layer, (round(x - w / 2), round(y - layer.height / 2)))
        return
    widths = [d.textlength(ch, font=f) for ch in s]
    cx = x - (sum(widths) + spacing * (len(s) - 1)) / 2
    for ch, w in zip(s, widths):
        d.text((cx, y), ch, font=f, fill=fill, anchor='lm')
        cx += w + spacing


def badge(cx, cy, r):
    """A gold-rimmed navy disc with a seven-point gold star."""
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GOLD)
    d.ellipse((cx - r * 0.86, cy - r * 0.86, cx + r * 0.86, cy + r * 0.86), fill=(30, 34, 52, 255))
    pts = [(cx + math.cos(math.pi / 2 + i * math.pi / 7) * r * (0.74 if i % 2 == 0 else 0.34),
            cy - math.sin(math.pi / 2 + i * math.pi / 7) * r * (0.74 if i % 2 == 0 else 0.34)) for i in range(14)]
    d.polygon(pts, fill=GOLD)
    d.ellipse((cx - r * 0.24, cy - r * 0.24, cx + r * 0.24, cy + r * 0.24), fill=(30, 34, 52, 255))


def side(ox, front_left):
    X = lambda u: ox + (u if front_left else 1 - u) * QW
    Y = lambda y: (1 - y) * QH
    (u0, u1), (f0, f1) = DOOR, FIELD
    x0, x1 = sorted((X(u0), X(u1)))
    d.rectangle((x0, Y(f1), x1, Y(f0)), fill=WHITE)  # white doors from the sill to the waistline
    a0, a1 = sorted((X(0.04), X(0.97)))  # gold and blue pinstripes along the sill, the length of the body
    d.rectangle((a0, Y(f0 + 0.015), a1, Y(f0)), fill=GOLD)
    d.rectangle((a0, Y(f0), a1, Y(f0 - 0.015)), fill=BLUE)
    k = lambda t: f0 + (f1 - f0) * t  # height within the white field
    badge(X(u0 + (u1 - u0) * BADGE_AT), Y(k(0.55)), 58 * S * 0.85)
    mid = X(u0 + (u1 - u0) * LETTER_AT)
    text(mid, Y(k(0.79)), DEPT, font(FONT2, 40 * 0.81), BLACK, spacing=10 * S)
    text(mid, Y(k(0.49)), 'POLICE', font(FONT, 128 * LETTER_SIZE), BLACK, spacing=6 * S)
    text(mid, Y(k(0.2)), 'TO PROTECT AND SERVE', font(FONT2, 26 * 0.85), (60, 62, 70, 255), spacing=6 * S * 0.81)
    text(X(UNIT_AT[0]), Y(UNIT_AT[1]), UNIT, font(FONT, 92), WHITE)  # unit number, white on black


side(0, True)
side(QW, False)

# bonnet (bottom-left quadrant, image rows QH..H, its front edge at the bottom): POLICE, a gold rule, the unit number
hx, hy = QW / 2, H
text(hx, hy - QH * HOOD[0], 'POLICE', font(FONT, 150), WHITE, spacing=10 * S, sy=HOOD_SQUASH)
text(hx, hy - QH * HOOD[1], UNIT, font(FONT, 120), WHITE, sy=HOOD_SQUASH)
d.rectangle((hx - 420 * S, hy - QH * (HOOD[2] + 0.01), hx + 420 * S, hy - QH * (HOOD[2] - 0.01)), fill=GOLD)

# tailgate (bottom-right quadrant): POLICE, the department, and red and amber chevrons below
tx, Y = QW + QW / 2, (lambda y: H - y * QH)
text(tx, Y(TAIL[0]), 'POLICE', font(FONT, 108), WHITE, spacing=8 * S, sy=TAIL_SQUASH)
text(tx, Y(TAIL[1]), DEPT + ' · ' + UNIT, font(FONT2, 36), (220, 220, 214, 255), spacing=8 * S, sy=TAIL_SQUASH)
top, bottom = int(Y(TAIL[2])), int(Y(TAIL[3]))
band = Image.new('RGBA', (int(W - QW - 160 * S), bottom - top), AMBER)
bd = ImageDraw.Draw(band)
step, hgt = int(90 * S * TAIL_SQUASH), bottom - top
for k in range(-4, band.width // step + 4):
    x = k * step
    bd.polygon([(x, hgt), (x + step / 2, hgt), (x + step / 2 + hgt, 0), (x + hgt, 0)], fill=RED)
img.alpha_composite(band, (int(QW + 80 * S), top))

out = sys.argv[1] if len(sys.argv) > 1 else 'police-interceptor-livery.png'
Image.alpha_composite(Image.new('RGBA', img.size, PAINT), img).convert('RGB').save(out)
print('wrote', out, img.size)
