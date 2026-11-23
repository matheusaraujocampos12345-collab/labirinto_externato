#!/usr/bin/env python3
"""Monta ferramentas/paleta.html: dois quadros do vídeo com a marca do ponto onde cada cor
da paleta aparece de verdade, e a régua de cores embaixo. Serve para o quadro 'paleta' do
carrossel (captura/quadros/06-paleta.jpg). Uso: python3 ferramentas/montar_paleta.py"""
import os, json, numpy as np
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def quadro(i): return np.asarray(Image.open(os.path.join(RAIZ, 'video', 'v', f'{i:03d}.webp')).convert('RGB')).astype(float)
def hexrgb(h): return np.array([int(h[k:k + 2], 16) for k in (1, 3, 5)], float)

def achar(img, cor, caixa, k=15):
    """centro do trecho k x k (dentro da caixa) cuja média é mais perto da cor"""
    x0, y0, x1, y1 = caixa
    a = img[y0:y1, x0:x1]
    c = np.cumsum(np.cumsum(np.pad(a, ((1, 0), (1, 0), (0, 0))), 0), 1)
    media = (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
    d = ((media - hexrgb(cor)) ** 2).sum(-1)
    y, x = np.unravel_index(d.argmin(), d.shape)
    return (x0 + x + k // 2) / img.shape[1], (y0 + y + k // 2) / img.shape[0], float(np.sqrt(d.min()))

A, B = 6, 76
fa, fb = quadro(A), quadro(B)
marcas = {
    A: [('Forno', '#05020A', (60, 300, 540, 760)), ('Inox', '#2A2426', (0, 0, 608, 1080)), ('Luz do forno', '#E5AC68', (0, 240, 608, 960), 5)],
    B: [('Parede', '#563827', (0, 40, 608, 560)), ('Casca', '#9B6530', (20, 600, 260, 760)), ('Dourado', '#C18A4E', (360, 640, 600, 790)), ('Farinha', '#F8DCB3', (60, 470, 560, 640), 3), ('Brilho da assadeira', '#FAF1DF', (0, 700, 170, 820), 1)],
}
pontos = {}
for q, lista in marcas.items():
    img = fa if q == A else fb
    pontos[q] = []
    for nome, cor, caixa, *k in lista:
        x, y, erro = achar(img, cor, caixa, *k)
        pontos[q].append((nome, cor, x, y))
        print(f'quadro {q:3d}  {nome:13s} {cor}  em ({x:.2f}, {y:.2f})  diferença {erro:.1f}')

VIS = 940            # cada quadro aparece recortado em 608 x 940 (centro), para caber em 4:5
ORDEM = ['Forno', 'Inox', 'Parede', 'Casca', 'Dourado', 'Luz do forno', 'Farinha', 'Brilho da assadeira']
def marcadores(q, lado=None):
    out = ''
    for nome, cor, x, y in pontos[q]:
        yy = (y * 1080 - (1080 - VIS) / 2) / VIS
        out += f'<div class="m" style="left:{x*100:.1f}%;top:{yy*100:.1f}%"><i style="background:{cor}">{ORDEM.index(nome) + 1}</i></div>'
    return out

cores = [('Forno', '#05020A'), ('Inox', '#2A2426'), ('Parede', '#563827'), ('Casca', '#9B6530'), ('Dourado', '#C18A4E'),
         ('Luz do forno', '#E5AC68'), ('Farinha', '#F8DCB3'), ('Brilho', '#FAF1DF'), ('Painel', '#FF3B30')]
regua = ''.join(f'<li style="--c:{c}"><b>{k + 1 if k < 8 else ""}</b><span>{n}</span><em>{c}</em></li>' for k, (n, c) in enumerate(cores))
html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Paleta · Padaria Quatro Horas</title><link rel="stylesheet" href="../css/site.css">
<style>
body{{background:var(--forno);padding:20px 20px}} body::after{{opacity:.06}}
h1{{font-size:25px;max-width:none;line-height:1.04;margin-top:8px}} .sub{{margin-top:6px;font-size:12.5px;max-width:none}}
.par{{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}}
.q{{position:relative;aspect-ratio:608/940;background-size:cover;background-position:50% 50%;border:1px solid var(--inox)}} .q:first-child{{z-index:2}}
.q small{{position:absolute;left:8px;bottom:7px;font-size:9.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--farinha-2)}}
.m{{position:absolute;width:0;height:0}} .m i{{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px #000,0 2px 6px #000;font-style:normal;font-weight:700;font-size:9.5px;line-height:14px;text-align:center;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}}
.m span{{position:absolute;top:-9px;left:12px;white-space:nowrap;padding:2px 6px;background:rgb(5 2 10 / .82);font-size:9.5px;line-height:1.25;color:var(--farinha)}}
.m.e span{{left:auto;right:12px}} .m.cima span{{top:-40px}} .m.baixo span{{top:11px}} .m b{{display:block;font-size:10px}}
ul{{list-style:none;display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin-top:10px;height:62px}}
li{{background:var(--c);border:1px solid rgb(250 241 223 / .12);display:flex;flex-direction:column;justify-content:flex-end;padding:4px 3px;font-size:7.5px;line-height:1.15;color:#fff}}
li:nth-child(n+5):not(:last-child){{color:#1a1010}} li{{font-size:7px}} li span{{font-weight:700}} li b{{font-size:9px;margin-bottom:auto}} li em{{font-style:normal;opacity:.8}}
.nota{{margin-top:7px;font-size:10.5px;color:var(--farinha-3)}}
</style></head><body>
<p class="rot cor-luz">Padaria Quatro Horas · paleta</p>
<h1>As cores saíram do forno.</h1>
<p class="sub">Medidas nos quadros do vídeo da primeira tela.</p>
<div class="par">
  <div class="q" style="background-image:url(../video/v/{A:03d}.webp)">{marcadores(A, 'd')}<small>Forno às 4h</small></div>
  <div class="q" style="background-image:url(../video/v/{B:03d}.webp)">{marcadores(B, 'e')}<small>Pão na luz</small></div>
</div>
<ul>{regua}</ul>
<p class="nota">O vermelho é do painel de senha: é a única cor que não veio do vídeo.</p>
<script>window.__pronto = true;</script>
</body></html>'''
open(os.path.join(RAIZ, 'ferramentas', 'paleta.html'), 'w').write(html)
print('ok ferramentas/paleta.html')
