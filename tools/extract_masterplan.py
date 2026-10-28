"""
Extrai o masterplan de uma foto aérea (vista de cima) e gera assets/masterplan.js.

O arquivo gerado traz tudo que o showroom precisa para "vestir" o terreno 3D com a foto:
  - a imagem (JPEG embutido em base64, para abrir também por file://);
  - os polígonos dos lotes, detectados na própria imagem (vias, meio-fio e divisas);
  - máscaras do loteamento e da floresta (grades de baixa resolução);
  - portaria, saída da estrada e edificações (posições medidas na imagem).

Uso (precisa de numpy, pillow, scipy e opencv-python-headless):
  python3 tools/extract_masterplan.py caminho/da/foto.png

Coordenadas: o plano do showroom é em metros, +x = leste, +y = norte, origem no centro do
loteamento. A escala vem de METERS_PER_PX (calibrada pela testada típica dos lotes).
"""
import base64
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "masterplan.js"

WORK_W, WORK_H = 2752, 1536      # resolução de trabalho (metade da foto original 5504x3072)
METERS_PER_PX = 0.55             # na resolução de trabalho: testada típica ≈ 25 px ≈ 14 m
TEXTURE_W = 4096                 # largura da textura embutida

# Edificações e pontos medidos na imagem (pixels na resolução de trabalho).
# rect = (centro x, centro y, largura, profundidade, rotação em graus no sentido da imagem, altura em m)
BUILDINGS = [
    {"id": "clube", "rect": (1659, 825, 120, 53, -41.6, 7.5), "roof": "#8f949b", "wall": "#e7e2d8"},
    {"id": "piscina-a", "rect": (2085, 750, 34, 64, 0, 8.0), "roof": "#9a3b2c", "wall": "#efe9df"},
    {"id": "piscina-b", "rect": (2096, 802, 32, 45, 0, 5.5), "roof": "#e9e6df", "wall": "#f3efe7"},
    {"id": "casa-campo", "rect": (1936, 557, 38, 40, -10, 5.0), "roof": "#9fa3a8", "wall": "#ece6dc"},
    {"id": "portaria", "rect": (2266, 850, 22, 95, 0, 5.0), "roof": "#e8e8e4", "wall": "#d9d6cf"},
]
AMENITIES = {
    "deck": (1860, 830),      # lago central
    "clube": (1659, 825),
    "quadras": (2045, 615),   # campo de futebol + quadra de tênis
    "piscina": (2075, 780),
    "parque": (1073, 578),    # parque das lagoas
    "bosque": (1480, 690),    # mata preservada no miolo
}
GATE = (2268, 850)            # portaria
EXIT = (2745, 846)            # onde a estrada de acesso sai da foto (leste)


def load(path):
    src = cv2.imread(str(path))
    if src is None:
        sys.exit(f"não consegui abrir {path}")
    return src, cv2.resize(src, (WORK_W, WORK_H), interpolation=cv2.INTER_AREA)


def segment(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    Ls = cv2.GaussianBlur(L, (3, 3), 0)
    u8 = lambda m: m.astype(np.uint8)

    # floresta = escura E texturizada (a faixa de lotes na sombra é escura mas lisa)
    mean = cv2.blur(L, (9, 9))
    std = np.sqrt(np.maximum(cv2.blur(L * L, (9, 9)) - mean * mean, 0))
    forest = (L < 70) | ((L < 118) & (std > 13))
    forest_soft = cv2.blur(u8(forest).astype(np.float32), (21, 21))

    # loteamento: maior região contínua sem floresta, fechada e com furos preenchidos
    dense = u8(forest_soft < 0.35)
    n, lc, st, _ = cv2.connectedComponentsWithStats(dense, 8)
    best = max(range(1, n), key=lambda i: st[i, cv2.CC_STAT_AREA])
    dev = u8(lc == best)
    dev = cv2.morphologyEx(dev, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)))
    dev_filled = u8(ndi.binary_fill_holes(dev))

    # vias: asfalto neutro + meio-fio branco (só a rede contínua)
    curb = Ls > 196
    asphalt = (B < 134) & (L > 118) & (L <= 196) & (A > 122) & (A < 142)   # asfalto real: b ≈ 128
    road = u8(asphalt | curb) & dev_filled
    road = cv2.morphologyEx(road, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lc, st, _ = cv2.connectedComponentsWithStats(road, 8)
    keep = np.zeros_like(road)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 6000:
            keep[lc == i] = 1
    road = keep

    water = u8((A < 121) & (L > 90)) & dev_filled
    water = cv2.morphologyEx(water, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))

    # chão de lote: amarelado (lotes ao sol) ou oliva acinzentado (lotes na sombra da encosta)
    lot_ground = (A >= 120) & (A < 142) & (((B >= 141) & (L > 105) & (L <= 200)) | ((B >= 134) & (L > 82) & (L <= 170)))
    lot_ground &= ~((B > 166) & (A < 127))   # gramado do parque (verde saturado) não é lote
    se = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    lines = (cv2.morphologyEx(Ls, cv2.MORPH_BLACKHAT, se) > 6) | (cv2.morphologyEx(Ls, cv2.MORPH_TOPHAT, se) > 7)
    lot_area = u8(lot_ground) & dev_filled & u8(1 - road) & u8(1 - water) & u8(~lines) & u8(~forest)
    lot_area = cv2.morphologyEx(lot_area, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    return dict(dev=dev_filled, road=road, water=water, forest=u8(forest), forest_soft=forest_soft, lot_area=lot_area)


def split_lots(lot_area):
    """Separa lotes que ficaram ligados por um "pescoço" onde a divisa não corta a faixa toda:
    núcleos = pontos a mais de 4,5 px da borda; cada lote cresce de volta a partir do seu núcleo."""
    dist = cv2.distanceTransform(lot_area, cv2.DIST_L2, 5)
    n, markers = cv2.connectedComponents((dist > 4.5).astype(np.uint8), connectivity=4)
    markers = markers.astype(np.int32)
    markers[lot_area == 0] = -1                        # fundo
    relief = (255 - np.clip(dist * 20, 0, 255)).astype(np.uint8)
    labels = ndi.watershed_ift(relief, markers)
    labels[lot_area == 0] = 0
    labels[labels < 0] = 0
    return labels


def lots_from(seg, cx, cy):
    road_pts = np.argwhere(seg["road"] > 0)            # (y, x)
    water_pts = np.argwhere(seg["water"] > 0)[::7]
    labels = split_lots(seg["lot_area"])
    # reenumera e mede cada região
    ids = np.unique(labels)
    ids = ids[ids > 0]
    lc = np.zeros(labels.shape, np.int32)
    for k, v in enumerate(ids, start=1):
        lc[labels == v] = k
    n = len(ids) + 1
    st = np.zeros((n, 5), np.int64)
    cent = np.zeros((n, 2))
    objs = ndi.find_objects(lc)
    for k in range(1, n):
        sl = objs[k - 1]
        ys, xs = np.nonzero(lc[sl] == k)
        st[k] = [sl[1].start, sl[0].start, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start, len(xs)]
        cent[k] = [xs.mean() + sl[1].start, ys.mean() + sl[0].start]
    to_plan = lambda x, y: [round((x - cx) * METERS_PER_PX, 2), round(-(y - cy) * METERS_PER_PX, 2)]
    lots = []
    grow = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    for i in range(1, n):
        a_px = st[i, cv2.CC_STAT_AREA]
        if not 250 < a_px < 6000:
            continue
        x, y, w, h = st[i, :4]
        pad = 4
        sub = (lc[max(y - pad, 0):y + h + pad, max(x - pad, 0):x + w + pad] == i).astype(np.uint8)
        sub = cv2.dilate(sub, grow)                        # devolve a espessura da divisa
        contours, _ = cv2.findContours(sub, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        c = max(contours, key=cv2.contourArea)
        # lote real é convexo: usa a envoltória e descarta formas tortas (gramados, sobras de via)
        hull = cv2.convexHull(c)
        if cv2.contourArea(c) / max(cv2.contourArea(hull), 1) < 0.6:
            continue
        poly = cv2.approxPolyDP(hull, 0.03 * cv2.arcLength(hull, True), True).reshape(-1, 2)
        if len(poly) < 4:
            poly = cv2.boxPoints(cv2.minAreaRect(c)).astype(np.int32)
        poly = poly + [max(x - pad, 0), max(y - pad, 0)]
        plan = [to_plan(px, py) for px, py in poly]
        area = abs(sum(plan[k][0] * plan[(k + 1) % len(plan)][1] - plan[(k + 1) % len(plan)][0] * plan[k][1] for k in range(len(plan)))) / 2
        if not 150 < area < 2600:
            continue
        (_, _), (rw, rh), _ = cv2.minAreaRect(c)
        ccx, ccy = cent[i]
        # frente = direção da via mais próxima
        d2 = (road_pts[:, 1] - ccx) ** 2 + (road_pts[:, 0] - ccy) ** 2
        ry, rx = road_pts[np.argmin(d2)]
        wd = np.min((water_pts[:, 1] - ccx) ** 2 + (water_pts[:, 0] - ccy) ** 2) ** 0.5 * METERS_PER_PX
        lots.append({
            "px": poly.astype(np.int32),
            "polygon": plan,
            "center": to_plan(ccx, ccy),
            "area": round(area),
            "front": round(min(rw, rh) * METERS_PER_PX, 1),
            "faceVec": [round(float(rx - ccx), 2), round(float(-(ry - ccy)), 2)],
            "lakeView": bool(wd < 140),
        })

    # sem sobreposição: aceita do maior para o menor; descarta fragmentos dentro de outro lote
    # e polígonos que invadem a via
    taken = np.zeros(seg["road"].shape, np.uint8)
    accepted = []
    for lot in sorted(lots, key=lambda l: -l["area"]):
        m = np.zeros_like(taken)
        cv2.fillPoly(m, [lot["px"]], 1)
        n_px = max(int(m.sum()), 1)
        if (m & taken).sum() / n_px > 0.25 or (m & seg["road"]).sum() / n_px > 0.08:
            continue
        taken |= m
        del lot["px"]
        accepted.append(lot)
    return accepted


def grid_b64(mask, w, h):
    small = cv2.resize(mask.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    return base64.b64encode(np.clip(small * 255, 0, 255).astype(np.uint8).tobytes()).decode()


def main():
    src, img = load(sys.argv[1] if len(sys.argv) > 1 else ROOT / "assets" / "masterplan-source.png")
    seg = segment(img)
    ys, xs = np.nonzero(seg["dev"])
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    to_plan = lambda x, y: [round((x - cx) * METERS_PER_PX, 2), round(-(y - cy) * METERS_PER_PX, 2)]

    lots = lots_from(seg, cx, cy)

    tex = cv2.resize(src, (TEXTURE_W, round(TEXTURE_W * src.shape[0] / src.shape[1])), interpolation=cv2.INTER_AREA)
    ok, jpg = cv2.imencode(".jpg", tex, [cv2.IMWRITE_JPEG_QUALITY, 84])
    assert ok

    dev_soft = cv2.GaussianBlur(seg["dev"].astype(np.float32), (0, 0), 12)
    data = {
        "image": "data:image/jpeg;base64," + base64.b64encode(jpg.tobytes()).decode(),
        # extremos da foto no plano: [xMin, yMin, xMax, yMax] (metros)
        "extent": [*to_plan(0, WORK_H), *to_plan(WORK_W, 0)],
        "devGrid": {"w": 172, "h": 96, "data": grid_b64(dev_soft, 172, 96)},
        "forestGrid": {"w": 344, "h": 192, "data": grid_b64(seg["forest_soft"] * (1 - seg["dev"]), 344, 192)},
        "gate": to_plan(*GATE),
        "exit": to_plan(*EXIT),
        "amenities": {k: to_plan(*p) for k, p in AMENITIES.items()},
        "buildings": [
            {
                "id": b["id"],
                "center": to_plan(b["rect"][0], b["rect"][1]),
                "size": [round(b["rect"][2] * METERS_PER_PX, 1), round(b["rect"][3] * METERS_PER_PX, 1)],
                "rot": round(np.deg2rad(b["rect"][4]), 4),
                "height": b["rect"][5],
                "roof": b["roof"],
                "wall": b["wall"],
            }
            for b in BUILDINGS
        ],
        "lots": lots,
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(
        "/* Gerado por tools/extract_masterplan.py — não editar à mão. */\n"
        f"window.MASTERPLAN = {json.dumps(data, separators=(',', ':'))};\n"
    )
    print(f"{len(lots)} lotes, extensão {data['extent']}, {OUT.stat().st_size / 1e6:.1f} MB -> {OUT}")


if __name__ == "__main__":
    main()
