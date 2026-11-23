#!/usr/bin/env python3
"""Prepara os quadros do vídeo da primeira tela.

Fonte: "Taking bread out of the oven", Coverr (enviado em 09/10/2020), Licença Coverr:
uso comercial e pessoal grátis, sem atribuição; pode editar; não pode revender o arquivo.
https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt

O arquivo original NÃO fica no repositório (a licença não deixa redistribuir o arquivo).
Este script baixa para uma pasta temporária, corrige a cor ("4 da manhã") e salva só o que o site usa.
O quadro vai INTEIRO (16:9, sem corte): a mão, a assadeira e o pão aparecem sempre por completo.
  video/m/000.webp ...  1080x608   telas em pé (celular e tablet)
  video/h/000.webp ...  1440x810   telas deitadas (computador)
  video/b/000.webp ...  192x108    o mesmo quadro desfocado, para preencher o resto da tela
  video/capa-b.jpg                 fundo desfocado do primeiro quadro (aparece antes do resto carregar)
  foto/pao-vapor.jpg               foto da seção de encomenda (segundo plano do mesmo vídeo)
Uso: python3 ferramentas/preparar_video.py [pasta-temporaria]
"""
import os, sys, json, shutil, subprocess, tempfile, urllib.request
import numpy as np
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
INI, FIM, N = 22, 200, 96      # 0,9 s a 8,3 s: um plano só, do forno escuro até o pão na assadeira
FOTO = 216                     # 9,0 s: o pão com vapor, no segundo plano do vídeo
bruto = os.path.join(TMP, 'bruto-original')
os.makedirs(bruto, exist_ok=True)
if not os.path.exists(os.path.join(bruto, f'{FOTO:04d}.png')):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', fonte, '-start_number', '0',
                    os.path.join(bruto, '%04d.png')], check=True)

def cor_4h(im, t):
    """'4 da manhã': contraste maior, sombra puxada para o azul da madrugada, luz quente no pão.
    No começo (pão ainda dentro do forno) a exposição sobe para o pão aparecer atrás da grade."""
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
    a = a * (1 - 0.30 * np.clip(r, 0, 1) ** 2.4)[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))

def abrir(q): return cor_4h(Image.open(os.path.join(bruto, f'{q:04d}.png')).convert('RGB'), q / FPS)

for d in ('m', 'h', 'b', 'v'):
    shutil.rmtree(os.path.join(RAIZ, 'video', d), ignore_errors=True)
for d in ('m', 'h', 'b'):
    os.makedirs(os.path.join(RAIZ, 'video', d), exist_ok=True)
nitido = lambda im: im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
quadros = [round(INI + (FIM - INI) * i / (N - 1)) for i in range(N)]
for i, q in enumerate(quadros):
    im = abrir(q)
    nitido(im.resize((1080, 608), Image.LANCZOS)).save(os.path.join(RAIZ, 'video', 'm', f'{i:03d}.webp'), quality=70, method=6)
    nitido(im.resize((1440, 810), Image.LANCZOS)).save(os.path.join(RAIZ, 'video', 'h', f'{i:03d}.webp'), quality=66, method=6)
    pequeno = im.resize((192, 108), Image.LANCZOS).filter(ImageFilter.GaussianBlur(4))
    pequeno.save(os.path.join(RAIZ, 'video', 'b', f'{i:03d}.webp'), quality=60, method=6)
    if i == 0:
        pequeno.save(os.path.join(RAIZ, 'video', 'capa-b.jpg'), quality=70)
for velho in ('capa-v.jpg', 'capa-h.jpg'):
    if os.path.exists(os.path.join(RAIZ, 'video', velho)): os.remove(os.path.join(RAIZ, 'video', velho))

os.makedirs(os.path.join(RAIZ, 'foto'), exist_ok=True)
abrir(FOTO).resize((1280, 720), Image.LANCZOS).save(os.path.join(RAIZ, 'foto', 'pao-vapor.jpg'), quality=82, optimize=True, progressive=True)

info = {'fonte': 'https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt', 'licenca': 'Coverr License',
        'quadros': N, 'trecho_em_segundos': [round(INI / FPS, 2), round(FIM / FPS, 2)], 'foto_em_segundos': round(FOTO / FPS, 2),
        'conjuntos': {'m': [1080, 608], 'h': [1440, 810], 'b': [192, 108]}}
with open(os.path.join(RAIZ, 'video', 'info.json'), 'w') as f:
    json.dump(info, f, ensure_ascii=False, indent=1)
print('ok', N, 'quadros')
