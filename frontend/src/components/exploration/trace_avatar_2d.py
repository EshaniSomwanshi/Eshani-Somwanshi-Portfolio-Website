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
# Face and neck/chest are separate areas (the jaw line splits them), so keep
# every large skin area, not just the biggest.
def big_parts(mask, min_area):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    keep = np.zeros_like(mask)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area: keep |= lab == i
    return keep
skin = fill_holes(morph(big_parts(morph(skin_c, cv2.MORPH_OPEN, 3), 600), cv2.MORPH_CLOSE, 25))  # 600: keeps the ears

brows = {}
for k, b in (('L', BROW_L), ('R', BROW_R)):
    brows[k] = dil(largest(box(*b) & A & (V < 95)), 3)

ears = {}
for k, b in (('L', EAR_L), ('R', EAR_R)):
    metal = box(*b) & A & (V > 50) & (S < 55)
    # Metal only (no hole-filling): the hair seen through the filigree stays
    # hair, so the jhumkas read as light silver, not dark blobs.
    body = largest(morph(metal, cv2.MORPH_CLOSE, 9))          # find the jhumka itself
    ears[k] = morph(metal, cv2.MORPH_CLOSE, 3) & dil(fill_holes(body), 3)

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
# Brows, jhumkas and the open mouth are painted out of the base: brows and
# jhumkas move, and the default mouth is a closed smile drawn in the component
# (the open smile appears on hover), so the skin under it must be clean.
paint = np.zeros(A.shape, bool)
for m in list(brows.values()) + [dil(fill_holes(morph(e, cv2.MORPH_CLOSE, 9)), 2) for e in ears.values()]:
    paint |= dil(m, 5)
paint |= dil(mouth, 9)
base_rgb = cv2.inpaint(rgb, paint.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)

# ---------------- flat palette + clean tracing ----------------
def quantize(img, mask, k, strong=True):
    if strong:   # big flat areas: flatten hard for clean shapes
        smooth = cv2.bilateralFilter(cv2.bilateralFilter(img, 9, 60, 9), 9, 60, 9)
    else:        # small detailed parts (jewellery, eyes): keep detail
        smooth = cv2.bilateralFilter(img, 5, 30, 5)
    lab = cv2.cvtColor(smooth, cv2.COLOR_RGB2LAB)
    pts = lab[mask].reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 50, 0.4)
    _, lbl, _ = cv2.kmeans(pts, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    labimg = np.full(mask.shape, 255, np.uint8); labimg[mask] = lbl.ravel()
    labimg = cv2.medianBlur(labimg, 5)
    labimg[~mask] = 255
    cols = []
    for i in range(k):
        px = img[labimg == i]
        cols.append('#%02x%02x%02x' % tuple(np.median(px, axis=0).astype(int)) if len(px) else '#000000')
    return labimg, cols

def soft(mask, sigma):
    """Blur-threshold a mask: removes stair-steps and nicks -> clean curves."""
    if sigma <= 0: return mask
    return cv2.GaussianBlur(mask.astype(np.float32), (0, 0), sigma) > 0.5

def layer(region, img=None, k=5, eps=1.2, min_area=30, grow=2, sigma=1.6, strong=True, drop_light=None):
    """Region-local flat palette, each colour a clean smoothed shape; biggest
    first, each grown a little so the smaller ones on top hide any seams."""
    img = rgb if img is None else img
    if region.sum() < k * 4: return []
    lab, palette = quantize(img, region, k, strong)
    areas = [((lab == i) & region).sum() for i in range(len(palette))]
    out = []
    for i in np.argsort(areas)[::-1]:
        if areas[i] < min_area: continue
        if drop_light is not None:
            r_, g_, b_ = (int(palette[i][j:j + 2], 16) for j in (1, 3, 5))
            if max(r_, g_, b_) > drop_light:
                continue  # light grey: leftover background specks on the hair edge
        m = (lab == i) & region
        if strong: m = morph(m, cv2.MORPH_OPEN, 3)   # detailed parts keep their small highlights
        if grow: m = dil(m, grow) & region
        m = soft(m, sigma) & region
        d = trace(m, eps, min_area)
        if d: out.append({'d': d, 'fill': palette[i]})
    return out

def lines(region, img=None, drop=38, eps=0.8, min_area=40, sigma=0.9, close=3):
    """Line art: pixels clearly darker than their surroundings, cleaned up:
    gaps closed, specks dropped, edges smoothed."""
    img = rgb if img is None else img
    g = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(int)
    local = cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY), 15).astype(int)
    m = region & (g < local - drop)
    m = morph(m, cv2.MORPH_CLOSE, close)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area: keep |= lab == i
    keep = soft(keep, sigma)
    if keep.sum() == 0: return []
    col = '#%02x%02x%02x' % tuple(np.median(img[keep & m] if (keep & m).any() else img[keep], axis=0).astype(int))
    return [{'d': trace(keep, eps, min_area), 'fill': col}]

PENDANT = (453, 972, 24)
pend = np.zeros(A.shape, np.uint8); cv2.circle(pend, PENDANT[:2], PENDANT[2], 1, -1); pend = (pend > 0) & A

kurta = fill_holes(largest(morph(A & (S < 45) & (V > 150) & (yy > 820) & ~skin_c, cv2.MORPH_CLOSE, 9)))
hair = A & ~skin & ~kurta

# Head vs body: the face above the jaw line rides with the head (with hair,
# features and jhumkas); neck, chest and kurta stay with the body.
JAW = [(0, 0), (895, 0), (895, 660), (612, 668), (560, 718), (500, 748), (455, 758),
       (410, 749), (352, 720), (300, 670), (0, 660)]
headpoly = np.zeros(A.shape, np.uint8); cv2.fillPoly(headpoly, [np.array(JAW, np.int32)], 1); headpoly = headpoly > 0
face = skin & headpoly
neck = (skin & ~headpoly) & ~pend

L = {}
L['hairBack'] = [{'d': trace(soft(fill_holes(largest(morph(A & ~kurta, cv2.MORPH_CLOSE, 9))), 3), 1.5, 200), 'fill': '#141317'}]
L['hair'] = layer(hair, base_rgb, 6, 1.0, 25, 2, 1.2, drop_light=110)  # hair is dark; anything lighter is fringe
L['face'] = layer(face, base_rgb, 5, 1.2, 60, 2, 2.2)
L['faceLines'] = lines(face, base_rgb, 45, 0.8, 50, 0.9)
L['body'] = layer(neck, base_rgb, 4, 1.2, 60, 2, 2.2) + layer(kurta, base_rgb, 3, 1.3, 60, 2, 2.0)
# the chain is a thin line on the chest: close its gaps harder, keep short bits
L['bodyLines'] = lines(neck, base_rgb, 35, 0.7, 12, 0.7, 5) + lines(kurta, base_rgb, 30, 0.7, 25, 0.7)
# hidden neck piece under the jaw, so the head can slide without a gap
under = np.zeros(A.shape, np.uint8)
cv2.fillPoly(under, [np.array([(372, 640), (538, 640), (538, 770), (372, 770)], np.int32)], 1)
L['neckUnder'] = [{'d': trace(under > 0, 1.0, 50), 'fill': '#c27a58'}]
L['pendant'] = layer(pend, rgb, 5, 0.7, 6, 1, 0.6, strong=False)
for k in ('L', 'R'):
    L['brow' + k] = layer(brows[k], rgb, 3, 0.9, 12, 1, 1.0)
    L['ear' + k] = layer(ears[k], rgb, 6, 0.7, 4, 1, 0.5, strong=False)
    e = eyes[k]
    L['eye' + k + 'Open'] = [{'d': trace(soft(e['open'], 1.2), 0.8, 20), 'fill': '#f6f1ee'}]
    L['eye' + k + 'Iris'] = layer(e['iris'], rgb, 5, 0.8, 8, 1, 0.8, strong=False)
    L['eye' + k + 'Lash'] = layer(e['lash'], rgb, 3, 0.8, 10, 1, 1.0)
L['mouthOpen'] = layer(mouth & A, rgb, 6, 0.8, 8, 1, 0.8, strong=False)
L['bindi'] = layer(bindi & A, rgb, 4, 0.6, 3, 1, 0.5, strong=False)

def lid_colour(k):
    cx, cy, r = IRIS[k]
    px = rgb[cy - 52:cy - 44, cx - 20:cx + 20].reshape(-1, 3)
    return '#%02x%02x%02x' % tuple(np.median(px, axis=0).astype(int))

meta = {'size': {'w': w, 'h': h}, 'iris': IRIS,
        'earPivot': {'L': [260, 594], 'R': [652, 594]},
        'mouthCenter': [456, 640], 'headPivot': [455, 720], 'lid': {'L': lid_colour('L'), 'R': lid_colour('R')}}
with open(OUT, 'w') as f:
    f.write('/* GENERATED by trace2.py from the 2D avatar drawing. Regenerate, do not hand-edit. */\n')
    f.write('export const META = ' + json.dumps(meta) + ';\n')
    f.write('export const LAYERS = ' + json.dumps(L) + ';\n')
print({k: len(v) for k, v in L.items()})
