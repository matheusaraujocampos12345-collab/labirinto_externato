#!/usr/bin/env python3
"""Monta ferramentas/paleta.html: dois quadros do vídeo (inteiros, 16:9) com o ponto exato onde
cada cor da paleta aparece, e a régua de cores embaixo. Vira o quadro captura/quadros/08-paleta.jpg.
Uso: python3 ferramentas/montar_paleta.py"""
import os, numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def quadro(i): return np.asarray(Image.open(os.path.join(RAIZ, 'video', 'm', f'{i:03d}.webp')).convert('RGB')).astype(float)
def hexrgb(h): return np.array([int(h[k:k + 2], 16) for k in (1, 3, 5)], float)

def achar(img, cor, caixa, k=5):
    """centro do trecho k x k (dentro da caixa, em frações) cuja média é mais perto da cor"""
    H, W = img.shape[:2]
    x0, y0, x1, y1 = int(caixa[0] * W), int(caixa[1] * H), int(caixa[2] * W), int(caixa[3] * H)
    a = img[y0:y1, x0:x1]
    c = np.cumsum(np.cumsum(np.pad(a, ((1, 0), (1, 0), (0, 0))), 0), 1)
    media = (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
    d = ((media - hexrgb(cor)) ** 2).sum(-1)
    y, x = np.unravel_index(d.argmin(), d.shape)
    return (x0 + x + k // 2) / W, (y0 + y + k // 2) / H, float(np.sqrt(d.min()))

A, B = 6, 88
ORDEM = ['Forno', 'Inox', 'Luz do forno', 'Parede', 'Casca', 'Dourado', 'Farinha', 'Brilho']
BUSCA = {
    A: [('Forno', '#05020A', (0.30, 0.30, 0.60, 0.80)), ('Inox', '#2A2426', (0.30, 0.05, 0.70, 0.45)), ('Luz do forno', '#E5AC68', (0.25, 0.0, 0.75, 1.0), 3)],
    B: [('Parede', '#563827', (0.36, 0.05, 0.62, 0.40)), ('Casca', '#9B6530', (0.30, 0.55, 0.60, 0.75)), ('Dourado', '#C18A4E', (0.62, 0.45, 0.78, 0.70)),
        ('Farinha', '#F8DCB3', (0.40, 0.40, 0.70, 0.60), 3), ('Brilho', '#FAF1DF', (0.30, 0.72, 0.60, 0.90), 1)],
}
pontos = {}
for q, lista in BUSCA.items():
    img = quadro(q)
    pontos[q] = []
    for nome, cor, caixa, *k in lista:
        x, y, erro = achar(img, cor, caixa, *k)
        pontos[q].append((nome, cor, x, y))
        print(f'quadro {q:3d}  {nome:13s} {cor}  em ({x:.2f}, {y:.2f})  diferença {erro:.1f}')

RECORTE = {A: 0.14, B: 0.27}          # cada quadro aparece recortado em quadrado: começa nessa fração da largura
LARG = 608 / 1080
def marcadores(q):
    x0 = RECORTE[q]
    return ''.join(f'<div class="m" style="left:{(x - x0) / LARG * 100:.1f}%;top:{y*100:.1f}%">'f'<i style="background:{cor}">{ORDEM.index(nome) + 1}</i></div>'
                   for nome, cor, x, y in pontos[q])

cores = [('Forno', '#05020A'), ('Inox', '#2A2426'), ('Luz do forno', '#E5AC68'), ('Parede', '#563827'), ('Casca', '#9B6530'),
         ('Dourado', '#C18A4E'), ('Farinha', '#F8DCB3'), ('Brilho', '#FAF1DF'), ('Painel', '#FF3B30')]
CLARAS = {'Luz do forno', 'Dourado', 'Farinha', 'Brilho'}
regua = ''.join(f'<li class="{"clara" if n in CLARAS else ""}" style="--c:{c}"><b>{k + 1 if k < 8 else ""}</b><span>{n}</span><em>{c}</em></li>' for k, (n, c) in enumerate(cores))
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Paleta · Padaria Quatro Horas</title><link rel="stylesheet" href="../css/site.css">
<style>
body{{background:var(--forno);padding:0 20px;min-height:540px;display:flex;flex-direction:column;justify-content:center}}
h1{{font-size:30px;max-width:none;line-height:1.05;margin-top:6px}} .sub{{margin-top:6px;font-size:13px;max-width:none}}
.par{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}}
.q{{position:relative;aspect-ratio:1;background-size:auto 100%;border-radius:6px;overflow:hidden}}
.q small{{position:absolute;left:8px;bottom:7px;padding:2px 6px;border-radius:3px;background:rgb(5 2 10 / .7);font-size:10px;font-weight:600;color:var(--farinha-2)}}
.m{{position:absolute;width:0;height:0}} .m i{{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px #000,0 2px 6px #000;font-style:normal;font-weight:700;font-size:9.5px;line-height:14px;text-align:center;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}}
ul{{list-style:none;display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin-top:12px;height:92px}}
li{{background:var(--c);border:1px solid rgb(250 241 223 / .12);border-radius:3px;display:flex;flex-direction:column;justify-content:flex-end;padding:5px 4px;font-size:7.5px;line-height:1.2;color:#fff}}
li.clara{{color:#1a1010}} li span{{font-weight:700}} li b{{font-size:9px;margin-bottom:auto}} li em{{font-style:normal;opacity:.8}}
.nota{{margin-top:8px;font-size:10.5px;color:var(--farinha-3)}}
</style></head><body>
<p class="sobre">Padaria Quatro Horas · paleta</p>
<h1>As cores saíram do forno.</h1>
<p class="sub">Cada cor foi medida num ponto dos quadros do vídeo da primeira tela.</p>
<div class="par">
  <div class="q" style="background-image:url(../video/m/{A:03d}.webp);background-position:{RECORTE[A] / (1 - LARG) * 100:.2f}% 0">{marcadores(A)}<small>Forno às 4h</small></div>
  <div class="q" style="background-image:url(../video/m/{B:03d}.webp);background-position:{RECORTE[B] / (1 - LARG) * 100:.2f}% 0">{marcadores(B)}<small>Pão na luz</small></div>
</div>
<ul>{regua}</ul>
<p class="nota">O vermelho é do painel de senha: é a única cor que não veio do vídeo.</p>
<script>window.__pronto = true;</script>
</body></html>'''
open(os.path.join(RAIZ, 'ferramentas', 'paleta.html'), 'w').write(html)
print('ok ferramentas/paleta.html')
