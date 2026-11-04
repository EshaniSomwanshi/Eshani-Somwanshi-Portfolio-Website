"""Trace the flat 2D avatar drawing into rig layers.

The drawing is reduced to its flat palette, then every colour area is traced
as a smooth vector shape. Shapes are split into layers by region so they can
move like the original avatar:
  hairBack (silhouette fill) + hair (sways)
  body     (face, neck, ears, kurta, necklace, nose: static)
  browL/R  (lift), eyeL/R: open (white), iris (tracks), lash (static)
  mouth    (widens on hover), earL/R (swing), bindi
Brows and earrings are painted out of the base first so nothing ghosts behind
them when they move.
Run: python trace2.py <cutout.png> <out.js>
"""
import json, sys
import numpy as np, cv2
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
im = np.array(Image.open(SRC).convert('RGBA'))
rgb = im[:, :, :3].copy()
A = im[:, :, 3] > 128
h, w = A.shape
yy, xx = np.mgrid[0:h, 0:w]
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
H, S, V = [hsv[:, :, i].astype(int) for i in range(3)]

# Drop the blue background fringe left on the outer hair edges.
edge = A & ~(cv2.erode(A.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0)
A &= ~(edge & (H > 85) & (H < 130) & (S > 30))

def box(x0, y0, x1, y1):
    m = np.zeros_like(A); m[y0:y1, x0:x1] = True; return m
def largest(mask):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if n <= 1: return mask
    return lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
def fill_holes(mask):
    m = mask.astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(m); cv2.drawContours(out, cs, -1, 255, -1); return out > 0
def morph(mask, op, k):
    return cv2.morphologyEx(mask.astype(np.uint8), op, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))) > 0
def dil(mask, k):
    return cv2.dilate(mask.astype(np.uint8), np.ones((k, k), np.uint8)) > 0

def smooth_path(pts):
    n = len(pts)
    f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
    d = [f"M{f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    return ' '.join(d) + 'Z'
def trace(mask, eps=0.9, min_area=6):
    m = mask.astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    parts = []
    for c in cs:
        if abs(cv2.contourArea(c)) < min_area: continue
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(ap) >= 3: parts.append(smooth_path([tuple(map(float, p)) for p in ap]))
    return ' '.join(parts)

# ---------------- measured feature regions ----------------
BROW_L = (296, 366, 420, 408); BROW_R = (496, 366, 620, 408)
EYE_L = (280, 418, 412, 510); EYE_R = (498, 418, 634, 510)
IRIS = {'L': (365, 471, 32), 'R': (548, 471, 32)}
MOUTH_POLY = [(350, 604), (380, 611), (420, 611), (455, 609), (490, 611), (530, 607), (562, 603),
              (558, 626), (522, 652), (490, 673), (455, 686), (420, 678), (390, 657), (364, 632)]
EAR_L = (214, 584, 308, 738); EAR_R = (604, 584, 698, 738)
BINDI = (456, 394, 15)

mouth = np.zeros(A.shape, np.uint8); cv2.fillPoly(mouth, [np.array(MOUTH_POLY, np.int32)], 1); mouth = mouth > 0
bindi = np.zeros(A.shape, np.uint8); cv2.circle(bindi, BINDI[:2], BINDI[2], 1, -1); bindi = bindi > 0

skin_c = A & (H <= 22) & (S > 60) & (V > 90)
skin = fill_holes(morph(largest(morph(skin_c, cv2.MORPH_OPEN, 3)), cv2.MORPH_CLOSE, 25))

brows = {}
for k, b in (('L', BROW_L), ('R', BROW_R)):
    brows[k] = dil(largest(box(*b) & A & (V < 95)), 3)

ears = {}
for k, b in (('L', EAR_L), ('R', EAR_R)):
    metal = box(*b) & A & (V > 50) & (S < 55)
    ears[k] = fill_holes(morph(largest(morph(metal, cv2.MORPH_CLOSE, 9)), cv2.MORPH_CLOSE, 9))
    ears[k] = dil(ears[k], 3) & box(*b)

eyes = {}
for k, b in (('L', EYE_L), ('R', EYE_R)):
    region = fill_holes(largest(box(*b) & A & ~skin_c))
    sclera = box(*b) & A & (V > 175) & (S < 40)
    cx, cy, r = IRIS[k]
    circ = np.zeros(A.shape, np.uint8); cv2.circle(circ, (cx, cy), r, 1, -1); circ = circ > 0
    opening = fill_holes(morph(sclera | (circ & region), cv2.MORPH_CLOSE, 11)) & region
    iris_core = np.zeros(A.shape, np.uint8); cv2.circle(iris_core, (cx, cy), r - 1, 1, -1); iris_core = iris_core > 0
    opening = morph(opening, cv2.MORPH_OPEN, 3)
    eyes[k] = {'region': region, 'open': opening, 'iris': iris_core & opening, 'lash': region & ~opening}

# ---------------- base image with movers painted out ----------------
paint = np.zeros(A.shape, bool)
for m in list(brows.values()) + list(ears.values()):
    paint |= dil(m, 5)
base_rgb = cv2.inpaint(rgb, paint.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA)

# ---------------- flat palette ----------------
def quantize(img, mask, k):
    smooth = cv2.bilateralFilter(img, 7, 40, 7)
    lab = cv2.cvtColor(smooth, cv2.COLOR_RGB2LAB)
    pts = lab[mask].reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.4)
    _, lbl, centers = cv2.kmeans(pts, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    labimg = np.full(mask.shape, 255, np.uint8); labimg[mask] = lbl.ravel()
    labimg = cv2.medianBlur(labimg, 3)
    labimg[~mask] = 255
    cols = []
    for i in range(k):
        px = img[labimg == i]
        cols.append('#%02x%02x%02x' % tuple(np.median(px, axis=0).astype(int)) if len(px) else '#000000')
    return labimg, cols


def layer(region, img=None, k=6, eps=0.9, min_area=6, grow=2):
    """Region-local flat palette (k colours), each colour as a shape; biggest
    first, each grown a little so the smaller ones on top hide any seams."""
    img = rgb if img is None else img
    if region.sum() < k * 4: return []
    lab, palette = quantize(img, region, k)
    out = []
    areas = [((lab == i) & region).sum() for i in range(len(palette))]
    for i in np.argsort(areas)[::-1]:
        if areas[i] < min_area: continue
        m = (lab == i) & region
        if grow: m = dil(m, grow) & region
        d = trace(m, eps, min_area)
        if d: out.append({'d': d, 'fill': palette[i]})
    return out

def lines(region, img=None, drop=38, eps=0.6, min_area=4):
    img = rgb if img is None else img
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(int)
    local = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY), 15).astype(int)
    m = region & (g < local - drop)
    m = morph(m, cv2.MORPH_CLOSE, 2)
    if m.sum() == 0: return []
    col = '#%02x%02x%02x' % tuple(np.median(img[m], axis=0).astype(int))
    return [{'d': trace(m, eps, min_area), 'fill': col}]

PENDANT = (453, 972, 24)
pend = np.zeros(A.shape, np.uint8); cv2.circle(pend, PENDANT[:2], PENDANT[2], 1, -1); pend = (pend > 0) & A

kurta = fill_holes(largest(morph(A & (S < 45) & (V > 150) & (yy > 820) & ~skin_c, cv2.MORPH_CLOSE, 9)))
# Everything that isn't skin, kurta or pendant is hair (so no skin-coloured
# fringe is left along the hair's outer edge).
hair = A & ~skin & ~kurta

L = {}
L['hairBack'] = [{'d': trace(fill_holes(largest(morph(A & ~kurta, cv2.MORPH_CLOSE, 9))), 1.5, 200), 'fill': '#141317'}]
L['hair'] = layer(hair, base_rgb, 6, 1.0, 10)
skin_area = A & ~hair & ~kurta & ~pend
L['body'] = layer(skin_area, base_rgb, 10, 0.9, 6) + layer(kurta, base_rgb, 4, 1.0, 10)
L['lines'] = lines(skin_area, base_rgb, 45) + lines(kurta, base_rgb, 30)
L['pendant'] = layer(pend, rgb, 5, 0.6, 3, 1)
for k in ('L', 'R'):
    L['brow' + k] = layer(brows[k], rgb, 3, 0.8, 4, 1)
    L['ear' + k] = layer(ears[k], rgb, 6, 0.7, 3, 1)
    e = eyes[k]
    L['eye' + k + 'Open'] = [{'d': trace(e['open'], 0.7, 20), 'fill': '#f6f1ee'}]
    L['eye' + k + 'Iris'] = layer(e['iris'], rgb, 5, 0.7, 3, 1)
    L['eye' + k + 'Lash'] = layer(e['lash'], rgb, 3, 0.7, 3, 1)
L['mouth'] = layer(mouth & A, rgb, 6, 0.7, 3, 1)
L['bindi'] = layer(bindi & A, rgb, 4, 0.6, 2, 1)

def lid_colour(k):
    cx, cy, r = IRIS[k]
    px = rgb[cy - 52:cy - 44, cx - 20:cx + 20].reshape(-1, 3)
    return '#%02x%02x%02x' % tuple(np.median(px, axis=0).astype(int))

meta = {'size': {'w': w, 'h': h}, 'iris': IRIS,
        'earPivot': {'L': [260, 594], 'R': [652, 594]},
        'mouthCenter': [456, 640], 'lid': {'L': lid_colour('L'), 'R': lid_colour('R')}}
with open(OUT, 'w') as f:
    f.write('/* GENERATED by trace2.py from the 2D avatar drawing. Regenerate, do not hand-edit. */\n')
    f.write('export const META = ' + json.dumps(meta) + ';\n')
    f.write('export const LAYERS = ' + json.dumps(L) + ';\n')
print({k: len(v) for k, v in L.items()})
