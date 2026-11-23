#!/usr/bin/env python3
"""Mede as cores da paleta nos quadros do vídeo da primeira tela (video/v/*.webp).
Uso: python3 ferramentas/medir_cores.py
Cada cor vem de uma região escolhida à mão nos quadros (forno, pão, assadeira) e de um
agrupamento simples (k-means). O resultado é impresso; a paleta final está em captura/paleta.json.
"""
import os, colorsys, numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def q(i): return Image.open(os.path.join(RAIZ, 'video', 'v', f'{i:03d}.webp')).convert('RGB')

def kmeans(px, k, it=25, seed=4):
    rng = np.random.default_rng(seed)
    c = px[rng.choice(len(px), k, replace=False)].astype(float)
    for _ in range(it):
        lab = ((px[:, None] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([px[lab == j].mean(0) if (lab == j).any() else c[j] for j in range(k)])
    return c, np.bincount(lab, minlength=k) / len(px)

hexa = lambda c: '#%02X%02X%02X' % tuple(int(round(v)) for v in c)
def regiao(nome, quadros, caixa, k=4, filtro=None):
    px = np.concatenate([np.asarray(q(i).crop(caixa)).reshape(-1, 3) for i in quadros]).astype(float)
    if filtro is not None: px = px[filtro(px)]
    px = px[::7]
    c, w = kmeans(px, k)
    ordem = np.argsort([colorsys.rgb_to_hls(*(x / 255))[1] for x in c])
    print(f'\n{nome}')
    for j in ordem: print(f'  {hexa(c[j])}  {w[j]*100:5.1f}%')

L = lambda px: px @ np.array([0.2126, 0.7152, 0.0722])
regiao('Fundo do forno (quadros 0-12, miolo da imagem)', range(0, 13), (60, 100, 540, 900), 4)
regiao('Luz do forno nas grades e na porta (quadros 0-30, só os pontos claros)', range(0, 31), (0, 0, 608, 1080), 3, lambda p: L(p) > 120)
regiao('Casca do pão (quadros 70-95, faixa do pão)', range(70, 96), (40, 700, 560, 1000), 5, lambda p: (L(p) > 50) & (L(p) < 200))
regiao('Farinha por cima do pão (quadros 70-95, pontos mais claros)', range(70, 96), (40, 680, 560, 1000), 2, lambda p: L(p) > 200)
regiao('Inox da assadeira (quadros 45-60)', range(45, 61), (0, 820, 608, 880), 3)
regiao('Parede da padaria ao fundo (quadros 80-95, alto da imagem)', range(80, 96), (100, 60, 500, 500), 3)
