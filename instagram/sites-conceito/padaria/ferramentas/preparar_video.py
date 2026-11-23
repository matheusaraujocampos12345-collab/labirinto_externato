#!/usr/bin/env python3
"""Prepara os quadros do vídeo da primeira tela.

Fonte: "Taking bread out of the oven", Coverr (enviado em 09/10/2020), Licença Coverr:
uso comercial e pessoal grátis, sem atribuição; pode editar; não pode revender o arquivo.
https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt

O arquivo original NÃO fica no repositório (a licença não deixa redistribuir o arquivo).
Este script baixa para uma pasta temporária, corrige a cor ("4 da manhã"), recorta e
salva só os quadros que o site usa:
  video/v/000.webp ... (608x1080, vertical, celular e tablet em pé)
  video/h/000.webp ... (1280x720, horizontal, computador)
  video/capa-v.jpg e video/capa-h.jpg (primeiro quadro, para pintar a tela na hora)
Uso: python3 ferramentas/preparar_video.py [pasta-temporaria]
"""
import os, sys, json, subprocess, tempfile, urllib.request
from PIL import Image, ImageFilter

URL = 'https://cdn.coverr.co/videos/coverr-taking-bread-out-of-the-oven-1288/1080p.mp4'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(tempfile.gettempdir(), 'padaria-video')
os.makedirs(TMP, exist_ok=True)
fonte = os.path.join(TMP, 'coverr-1288.mp4')
if not os.path.exists(fonte):
    req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r, open(fonte, 'wb') as f:
        f.write(r.read())

FPS = 24
INI, FIM, N = 22, 236, 96          # quadros 22 a 236 do clipe (0,9 s a 9,8 s), 96 amostras
bruto = os.path.join(TMP, 'bruto-original')
os.makedirs(bruto, exist_ok=True)
if not os.path.exists(os.path.join(bruto, f'{FIM:04d}.png')):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', fonte, '-start_number', '0',
                    os.path.join(bruto, '%04d.png')], check=True)

import numpy as np
def cor_4h(im, t):
    """'4 da manhã': contraste maior, sombra puxada para o azul da madrugada, luz quente no pão.
    No começo (pão ainda dentro do forno) a exposição sobe um pouco para o pão aparecer."""
    a = np.asarray(im).astype(np.float32) / 255.0
    ganho = 1.0 + 1.0 * min(1.0, max(0.0, (3.0 - t) / 1.6))
    a = np.clip(a * ganho, 0, 1)
    a = np.clip((a - 0.5) * 1.12 + 0.5 - 0.035, 0, 1)
    L = (a * [0.2126, 0.7152, 0.0722]).sum(axis=2, keepdims=True)
    sombra, luz = (1 - L) ** 2.2, L ** 2
    a = a + sombra * np.array([-0.030, -0.006, 0.040]) + luz * np.array([0.030, 0.012, -0.030])
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / 1.42
    a = a * (1 - 0.32 * np.clip(r, 0, 1) ** 2.4)[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

# O recorte vertical acompanha o pão (centro x, de 0 a 1, ao longo do tempo em segundos)
CAMINHO = [(0.9, 0.55), (2.2, 0.55), (3.4, 0.56), (5.4, 0.60), (6.0, 0.70), (6.9, 0.68), (7.6, 0.58), (8.6, 0.52), (9.8, 0.50)]
def centro(t):
    for (t0, x0), (t1, x1) in zip(CAMINHO, CAMINHO[1:]):
        if t <= t1:
            k = max(0.0, min(1.0, (t - t0) / (t1 - t0)))
            k = k * k * (3 - 2 * k)
            return x0 + (x1 - x0) * k
    return CAMINHO[-1][1]

for d in ('v', 'h'):
    os.makedirs(os.path.join(RAIZ, 'video', d), exist_ok=True)
quadros = [round(INI + (FIM - INI) * i / (N - 1)) for i in range(N)]
for i, q in enumerate(quadros):
    im = cor_4h(Image.open(os.path.join(bruto, f'{q:04d}.png')).convert('RGB'), q / FPS)
    W, H = im.size
    cw = round(H * 9 / 16)
    cx = centro(q / FPS) * W
    x0 = int(max(0, min(W - cw, cx - cw / 2)))
    vert = im.crop((x0, 0, x0 + cw, H)).filter(ImageFilter.UnsharpMask(radius=1.4, percent=70, threshold=2))  # no celular o quadro é ampliado
    vert.save(os.path.join(RAIZ, 'video', 'v', f'{i:03d}.webp'), quality=72, method=6)
    im.resize((1280, 720), Image.LANCZOS).save(os.path.join(RAIZ, 'video', 'h', f'{i:03d}.webp'), quality=68, method=6)
    if i == 0:
        im.crop((x0, 0, x0 + cw, H)).resize((304, 540), Image.LANCZOS).save(os.path.join(RAIZ, 'video', 'capa-v.jpg'), quality=72)
        im.resize((960, 540), Image.LANCZOS).save(os.path.join(RAIZ, 'video', 'capa-h.jpg'), quality=72)

info = {'fonte': 'https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt', 'licenca': 'Coverr License',
        'quadros': N, 'trecho': [INI / FPS, FIM / FPS], 'vertical': [608, 1080], 'horizontal': [1280, 720]}
with open(os.path.join(RAIZ, 'video', 'info.json'), 'w') as f:
    json.dump(info, f, ensure_ascii=False, indent=1)
print('ok', N, 'quadros')
