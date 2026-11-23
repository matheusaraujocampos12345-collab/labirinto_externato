#!/usr/bin/env python3
"""Mede as cores da paleta nos quadros do vídeo da primeira tela (video/m/*.webp, 1080x608).
Uso: python3 ferramentas/medir_cores.py
Cada cor vem de uma região do quadro (forno, pão, assadeira) e de um agrupamento simples (k-means).
O resultado é impresso; a paleta final está em captura/paleta.json e o quadro com os pontos sai de
ferramentas/montar_paleta.py.
"""
import os, colorsys, numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def q(i): return Image.open(os.path.join(RAIZ, 'video', 'm', f'{i:03d}.webp')).convert('RGB')

def kmeans(px, k, it=25, seed=4):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)].astype(float)
    for _ in range(it):
        lab = ((px[:, None] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([px[lab == j].mean(0) if (lab == j).any() else c[j] for j in range(k)])
    return c, np.bincount(lab, minlength=k) / len(px)

hexa = lambda c: '#%02X%02X%02X' % tuple(int(round(v)) for v in c)
def regiao(nome, quadros, caixa, k=4, filtro=None):
    """caixa em frações do quadro: (x0, y0, x1, y1)"""
    px = []
    for i in quadros:
        im = q(i); W, H = im.size
        x0, y0, x1, y1 = caixa
        px.append(np.asarray(im.crop((int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H)))).reshape(-1, 3))
    px = np.concatenate(px).astype(float)
    if filtro is not None: px = px[filtro(px)]
    px = px[::5]
    c, w = kmeans(px, k)
    ordem = np.argsort([colorsys.rgb_to_hls(*(x / 255))[1] for x in c])
    print(f'\n{nome}')
    for j in ordem: print(f'  {hexa(c[j])}  {w[j]*100:5.1f}%')

L = lambda px: px @ np.array([0.2126, 0.7152, 0.0722])
regiao('Fundo do forno (quadros 0-12)', range(0, 13), (0.30, 0.10, 0.70, 0.90), 4)
regiao('Luz do forno nas grades (quadros 0-30, só os pontos claros)', range(0, 31), (0.25, 0.0, 0.75, 1.0), 3, lambda p: L(p) > 120)
regiao('Casca do pão (quadros 80-95)', range(80, 96), (0.40, 0.45, 0.85, 0.72), 5, lambda p: (L(p) > 50) & (L(p) < 200))
regiao('Farinha em cima do pão (quadros 80-95, pontos claros)', range(80, 96), (0.40, 0.42, 0.85, 0.65), 2, lambda p: L(p) > 200)
regiao('Parede ao fundo (quadros 85-95, alto)', range(85, 96), (0.05, 0.0, 0.55, 0.35), 3)
