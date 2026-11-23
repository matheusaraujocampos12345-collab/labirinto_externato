#!/usr/bin/env python3
"""Tira as cores da paleta de fotos reais de pão (Wikimedia Commons).
Uso: python3 extrair_cores.py <pasta-com-as-fotos>
As fotos não ficam no site: servem só para medir as cores.
  cob.jpg    = "Home made sourdough cob.jpg" (CC BY-SA 4.0), recorte 960 px
  slices.jpg = "Slices of sourdough bread.jpg" (CC BY 2.0), recorte 960 px
"""
import sys, colorsys, numpy as np
from PIL import Image

def kmeans(px, k, it=30, seed=7):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)].astype(float)
    for _ in range(it):
        d = ((px[:, None, :] - c[None]) ** 2).sum(-1)
        lab = d.argmin(1)
        c = np.array([px[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
    return c, np.bincount(lab, minlength=k) / len(px)

def hexa(c): return '#%02X%02X%02X' % tuple(int(round(v)) for v in c)

def regiao(nome, img, caixa, k, filtro=None):
    a = np.asarray(img.crop(caixa).convert('RGB')).reshape(-1, 3).astype(float)
    if filtro is not None: a = a[filtro(a)]
    a = a[::3]
    c, w = kmeans(a, k)
    ordem = np.argsort([colorsys.rgb_to_hls(*(x / 255))[1] for x in c])
    print(f'\n{nome}')
    for i in ordem:
        h, l, s = colorsys.rgb_to_hls(*(c[i] / 255))
        print(f'  {hexa(c[i])}  {w[i]*100:5.1f}%   luz {l:.2f}  sat {s:.2f}')

pasta = sys.argv[1] if len(sys.argv) > 1 else '.'
cob = Image.open(f'{pasta}/cob.jpg')        # 960 x 810
fat = Image.open(f'{pasta}/slices.jpg')     # 960 x 960
sat = lambda a: (a.max(1) - a.min(1)) > 40   # tira farinha e papel (cinza/branco)
regiao('Casca de cima (sem farinha), pão inteiro', cob, (120, 80, 820, 720), 6, sat)
regiao('Farinha polvilhada (quadrados claros)', cob, (420, 100, 820, 420), 3, lambda a: (a.max(1) - a.min(1)) < 40)
regiao('Miolo da fatia da frente', fat, (180, 520, 820, 760), 4)
regiao('Casca da borda da fatia', fat, (60, 800, 900, 860), 4, sat)
