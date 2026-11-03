"""Trace the reference portrait into layered vector shapes for the avatar rig.

Every region (hair, skin, kurta, eyes, brows, mouth, jewelry) is traced
separately and split into tonal bands; each band becomes a vector path filled
with the mean colour of those pixels. Output: a JS module of path data.
"""
import json, sys
import numpy as np, cv2
from PIL import Image

SRC = '/Users/eshnya/DEPX/EshaniWebsite/eshani-somwanshi-portfolio-website/frontend/src/components/exploration/assets/avatar-3d.webp'
OUT = sys.argv[1] if len(sys.argv) > 1 else "x.js"

im = np.array(Image.open(SRC).convert('RGBA'))
rgb = im[:, :, :3]
A = im[:, :, 3] > 128
h, w = A.shape
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
H, S, V = [hsv[:, :, i].astype(int) for i in range(3)]
yy, xx = np.mgrid[0:h, 0:w]
blur = cv2.GaussianBlur(rgb, (0, 0), 1.6)
L = cv2.cvtColor(blur, cv2.COLOR_RGB2GRAY).astype(int)

def box(x0, y0, x1, y1):
    m = np.zeros_like(A); m[y0:y1, x0:x1] = True; return m

def largest(mask):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    if n <= 1: return mask
    i = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]); return lab == i

def fill_holes(mask):
    m = mask.astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(m); cv2.drawContours(out, cs, -1, 255, -1); return out > 0

def clean(mask, k=3):
    m = mask.astype(np.uint8)
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, ker); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, ker)
    return m > 0

def smooth_path(pts):
    """Closed Catmull-Rom through pts -> cubic Bezier path string."""
    n = len(pts)
    if n < 3: return ''
    f = lambda v: f"{v:.1f}".rstrip('0').rstrip('.')
    d = [f"M{f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    return ' '.join(d) + 'Z'

def trace(mask, eps=1.1, min_area=18):
    m = mask.astype(np.uint8) * 255
    cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    parts = []
    for c in cs:
        if abs(cv2.contourArea(c)) < min_area: continue
        ap = cv2.approxPolyDP(c, eps, True).reshape(-1, 2)
        if len(ap) < 3: continue
        parts.append(smooth_path([tuple(p) for p in ap]))
    return ' '.join(parts)

def hexcol(pix):
    if len(pix) == 0: return None
    c = np.median(pix, axis=0).astype(int); return '#%02x%02x%02x' % tuple(c)

def bands(region, thresholds, eps=1.1, min_area=18, k=3, Limg=None, src=None):
    """Base fill = whole region in its darkest band colour, then each lighter
    band stacked on top. Returns list of {d, fill}."""
    Lx = L if Limg is None else Limg
    sx = rgb if src is None else src
    out = []
    edges = [-1] + thresholds + [256]
    for i in range(len(edges) - 1):
        lo = edges[i]
        lvl = region & (Lx > lo) if i > 0 else region
        band_pix = sx[region & (Lx > edges[i]) & (Lx <= edges[i + 1])]
        col = hexcol(band_pix)
        if col is None: continue
        if i > 0: lvl = clean(lvl, k)
        d = trace(lvl, eps, min_area)
        if d: out.append({'d': d, 'fill': col})
    return out

def zones(region, src, k, eps=1.2, min_area=40, kclean=5):
    """Colour zones: base = whole region in its mean colour, then k colour
    clusters (Lab k-means on src) as shapes, dark to light."""
    out = []
    pix = src[region].reshape(-1, 3).astype(np.float32)
    if len(pix) == 0: return out
    out.append({'d': trace(region, eps, min_area), 'fill': hexcol(src[region])})
    lab = cv2.cvtColor(src.reshape(1, -1, 3), cv2.COLOR_RGB2LAB).reshape(src.shape)
    lp = lab[region].reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
    _, labels, centers = cv2.kmeans(lp, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    labimg = np.full(region.shape, -1, int); labimg[region] = labels.ravel()
    order = np.argsort(centers[:, 0])
    for ci in order:
        m = clean(labimg == ci, kclean)
        m = (cv2.dilate(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0) & region
        d = trace(m, eps, min_area)
        if d: out.append({'d': d, 'fill': hexcol(src[labimg == ci])})
    return out

shapes = {}

# ---------- regions ----------
face_zone = (xx > 250) & (xx < 660) & (yy > 230) & (yy < 780)
skin_raw = A & (((H <= 22) & (S > 70) & (V > 85)) | ((H <= 15) & (S > 140) & (V > 35)) | (face_zone & (H <= 20) & (S > 130) & (V > 50)))
skin = fill_holes(clean(largest(clean(skin_raw, 5)), 21))
kurta = fill_holes(clean(largest(clean(A & (S < 70) & (V > 110) & (yy > 760) & ~skin_raw, 5)), 15))

# feature boxes (measured on the gridded zooms)
EYE_L = (292, 340, 414, 424); EYE_R = (500, 340, 620, 424)
BROW_L = (280, 290, 420, 345); BROW_R = (490, 290, 630, 345)
MOUTH = (355, 520, 560, 610)
EAR_L = (205, 500, 315, 655); EAR_R = (595, 500, 705, 655)
CHEST = (320, 730, 580, 925)

ears = box(*EAR_L) | box(*EAR_R)
# Metal: low saturation of any hue, or the cool purple/blue cast the
# shadowed left jhumka picks up. Skin hues (0-22) at skin saturation are not
# metal, so the stud is found even where it sits over the cheek.
metal = A & ears & (V > 50) & ((S < 70) | ((H >= 95) & (H <= 178)))
metal &= ~((H <= 22) & (S > 110))
cols = np.zeros_like(A)
cols[:, 215:306] = True; cols[:, 600:701] = True
earring = clean(metal & cols, 3)

hair = A & ~skin & ~kurta
hair = fill_holes(largest(clean(hair, 5)))  # fills behind earrings too

# ---------- hair: dark base + sheen bands ----------

# ---------- kurta ----------
shapes['kurta'] = bands(kurta, [150, 165, 178, 190, 200, 210, 220, 230], eps=1.2, min_area=20)

# ---------- skin (face, neck, chest): tonal bands give the 3D modelling ----------
# Paint the features out of a copy of the image first, so the skin bands
# trace only skin shading (eyes/brows/mouth/bindi would otherwise carve
# odd blocks into the tones).
# Features are hand-coded in the component (measured), so here they only need
# painting out of the skin. Polygons follow the measured outlines.
POLYS = {
    'eyeL': [(292, 386), (300, 372), (318, 360), (345, 352), (372, 352), (396, 362), (412, 382), (412, 402), (396, 414), (362, 420), (330, 414), (306, 402)],
    'eyeR': [(504, 382), (514, 364), (536, 352), (562, 351), (588, 356), (606, 368), (618, 384), (608, 402), (580, 416), (548, 420), (522, 414), (506, 402)],
    'browL': [(288, 312), (292, 300), (320, 289), (350, 287), (385, 290), (414, 298), (416, 310), (406, 314), (370, 305), (330, 304), (296, 315)],
    'browR': [(618, 312), (614, 300), (586, 289), (556, 287), (521, 290), (496, 298), (494, 310), (504, 314), (540, 305), (580, 304), (614, 315)],
    'mouth': [(364, 534), (380, 528), (420, 524), (450, 523), (490, 524), (530, 525), (552, 528), (546, 540), (528, 566), (500, 588), (470, 598), (440, 599), (410, 590), (386, 568), (372, 548)],
}
feat_mask = np.zeros(A.shape, np.uint8)
for pts in POLYS.values():
    cv2.fillPoly(feat_mask, [np.array(pts, np.int32)], 1)
cv2.circle(feat_mask, (456, 311), 16, 1, -1)
feat_mask |= cv2.dilate(earring.astype(np.uint8), np.ones((5, 5), np.uint8))
feat_mask = cv2.dilate(feat_mask, np.ones((7, 7), np.uint8)) > 0
clean_rgb = cv2.inpaint(rgb, feat_mask.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
clean_rgb = cv2.GaussianBlur(clean_rgb, (0, 0), 3.2)
Lskin = cv2.cvtColor(clean_rgb, cv2.COLOR_RGB2GRAY).astype(int)
shapes['skin'] = zones(skin, clean_rgb, 28, eps=1.4, min_area=40, kclean=5)

# Hair, with the jhumkas painted out so the swinging earrings don't reveal
# a ghost earring in the hair underneath.
ear_mask = cv2.dilate(earring.astype(np.uint8), np.ones((7, 7), np.uint8)) * 255
hair_rgb = cv2.inpaint(rgb, ear_mask, 7, cv2.INPAINT_TELEA)
Lhair = cv2.cvtColor(cv2.GaussianBlur(hair_rgb, (0, 0), 1.6), cv2.COLOR_RGB2GRAY).astype(int)
shapes['hair'] = bands(hair, [30, 40, 52, 66, 82, 100, 120, 142], eps=1.0, min_area=10, k=1, Limg=Lhair, src=hair_rgb)

# ---------- necklace: silver chain + sapphire pendant in the chest box ----------
chest = box(*CHEST) & skin_raw.copy()
silver = box(*CHEST) & A & (S < 70) & (V > 140) & ~kurta
blue = box(*CHEST) & A & (H >= 95) & (H <= 135) & (S > 80)
shapes['chain'] = [{'d': trace(clean(silver, 1), 0.8, 4), 'fill': hexcol(rgb[silver]) or '#cfd4dc'}]
shapes['pendant'] = bands(clean(blue, 1) , [80, 130], eps=0.8, min_area=4, k=1)

feat = {}

# ---------- earrings (each its own group; pivot at the top of the stud) ----------
for name, b in (('earL', EAR_L), ('earR', EAR_R)):
    m = earring & box(*b)
    # keep every real piece (stud + bell), not just the biggest
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= 25: keep |= lab == i
    m = fill_holes(keep)
    ys, xs = np.nonzero(m)
    feat[name] = {'px': float(xs[ys == ys.min()].mean()), 'py': float(ys.min())}
    shapes[name] = bands(m, [95, 135, 175, 210], eps=0.8, min_area=6, k=1)

shapes_count = {k: len(v) for k, v in shapes.items()}
with open(OUT, 'w') as f:
    f.write('/* GENERATED by tracing the reference portrait (gen.py). Do not\n')
    f.write('   hand-edit path data; regenerate instead. */\n')
    f.write('export const SIZE = ' + json.dumps({'w': w, 'h': h}) + ';\n')
    f.write('export const FEATURES = ' + json.dumps(feat, indent=1) + ';\n')
    f.write('export const SHAPES = ' + json.dumps(shapes) + ';\n')
print(json.dumps(shapes_count), json.dumps(feat))
