#!/usr/bin/env python3
"""Teaser do lançamento do site da MACH — "Checklist de pré-voo" (Reels/Story 9:16, 16 s, sem áudio).

Usa cenas reais do site (anuncio-lancamento/cenas/*.png, 1080×1920) e monta cortes no ritmo de
120 bpm (meio segundo por tempo), para encaixar com a música escolhida no Instagram.

Saídas: anuncio-lancamento/teaser-lancamento-9x16.mp4 e capa-teaser-9x16.png
Uso: python3 anuncio-lancamento/teaser.py   (requer numpy, Pillow e ffmpeg)
"""
import math
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
W, H, FPS, DUR = 1080, 1920, 30, 16.0
NF = int(FPS * DUR)

FONTE_SAIRA = os.path.join(REPO, 'video-anuncio', 'vendor', 'fonts', 'Saira-300-normal.ttf')
FONTE_SAIRA_X = os.path.join(REPO, 'video-anuncio', 'vendor', 'fonts', 'Saira-500-expanded.ttf')
FONTE_MONO = '/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Medium.ttf'
if not os.path.exists(FONTE_MONO):
    FONTE_MONO = FONTE_SAIRA_X

ESTRATO = (10, 12, 15)
ALUMINIO = (223, 227, 231)
NEVOA = (138, 146, 155)
LARANJA = (255, 107, 26)

cena = {k: Image.open(os.path.join(ROOT, 'cenas', f)).convert('RGB') for k, f in [
    ('a', 'a-abertura.png'), ('b', 'b-pilha.png'), ('c', 'c-glitch.png'), ('d', 'd-pergunta.png'),
    ('e', 'e-barreira.png'), ('f', 'f-hangar.png'), ('g', 'g-pedido.png')]}
logo = Image.open(os.path.join(REPO, 'marca-mach', 'png', 'assinatura-escuro.png')).convert('RGBA')

fonte = {}


def F(caminho, tam):
    k = (caminho, tam)
    if k not in fonte:
        fonte[k] = ImageFont.truetype(caminho, tam)
    return fonte[k]


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, a, b):
    return clamp((t - a) / (b - a))


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_io(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


# ── fundo com riscos de ar (para abertura e encerramento) ──
def fundo_ceu(seed=5):
    rng = np.random.default_rng(seed)
    img = Image.new('RGB', (W, H), ESTRATO)
    d = ImageDraw.Draw(img, 'RGBA')
    for y in range(H):
        k = y / H
        c = (int(11 + 6 * (1 - k)), int(14 + 8 * (1 - k)), int(19 + 12 * (1 - k)))
        d.line([(0, y), (W, y)], fill=c)
    for _ in range(240):
        x, y, p = rng.random() * W, rng.random() * H, rng.random()
        ln = 30 + 180 * p * p
        d.line([(x, y - ln), (x, y)], fill=(214, 226, 240, int(255 * (0.03 + 0.14 * p * p))), width=1 + int(1.5 * p))
    return img


CEU = fundo_ceu()


# ── câmera: recorte com zoom em torno de um ponto ──
def camera(img, escala, fx=0.5, fy=0.5, dx=0.0, dy=0.0):
    cw, ch = W / escala, H / escala
    cx = clamp(fx * W + dx, cw / 2, W - cw / 2)
    cy = clamp(fy * H + dy, ch / 2, H - ch / 2)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return img.resize((W, H), Image.BICUBIC, box=box)


def glitch(img, forca, seed):
    rng = np.random.default_rng(seed)
    a = np.asarray(img).copy()
    sh = int(6 + 30 * forca)
    a[:, :, 0] = np.roll(a[:, :, 0], sh, axis=1)
    a[:, :, 2] = np.roll(a[:, :, 2], -sh, axis=1)
    for _ in range(int(4 + 14 * forca)):
        y = int(rng.random() * H)
        h = int(10 + rng.random() * 120)
        a[y:y + h] = np.roll(a[y:y + h], int((rng.random() - 0.5) * 200 * forca), axis=1)
    return Image.fromarray(a)


def varredura(img, p):
    """Faixa de luz diagonal passando pela cena."""
    if p <= 0 or p >= 1:
        return img
    a = np.asarray(img).astype(np.float32)
    yy, xx = np.mgrid[0:H:4, 0:W:4]
    pos = (xx + yy * 0.45) / (W + H * 0.45)
    d = np.abs(pos - (p * 1.4 - 0.2))
    m = np.clip(1 - d / 0.06, 0, 1) * 0.35
    m = np.kron(m, np.ones((4, 4)))[:H, :W]
    a = a + (255 - a) * m[:, :, None]
    return Image.fromarray(a.astype(np.uint8))


# ── texto ──
def texto_mascara(base, txt, fonte_, x, y, p, cor=ALUMINIO, centro=False):
    """Linha de texto revelada de baixo para cima por uma máscara."""
    if p <= 0:
        return
    bbox = fonte_.getbbox(txt)
    tw, th = bbox[2] - bbox[0], bbox[3]
    camada = Image.new('RGBA', (tw + 20, th + 24), (0, 0, 0, 0))
    off = int((1 - ease_out(p)) * (th + 24))
    ImageDraw.Draw(camada).text((-bbox[0], off), txt, font=fonte_, fill=cor)
    px = int(x - tw / 2) if centro else int(x)
    base.alpha_composite(camada, (px, int(y)))


def painel_checklist(base, n, item, p_ok, t_loc):
    """HUD inferior: 'Checklist de pré-voo', item atual, ✓ e losangos de progresso."""
    d = ImageDraw.Draw(base, 'RGBA')
    x0, y0, x1, y1 = 70, 1500, W - 70, 1690
    entra = ease_out(clamp(t_loc / 0.25))
    off = int((1 - entra) * 40)
    d.rectangle([x0, y0 + off, x1, y1 + off], fill=(10, 12, 15, int(215 * entra)), outline=(255, 107, 26, int(150 * entra)), width=2)
    mono_p = F(FONTE_MONO, 24)
    d.text((x0 + 34, y0 + 30 + off), 'CHECKLIST DE PRÉ-VOO', font=mono_p, fill=NEVOA + (int(255 * entra),))
    # losangos
    for k in range(5):
        cx, cy, r = x1 - 210 + k * 38, y0 + 44 + off, 9
        pts = [(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)]
        aceso = k < n - 1 or (k == n - 1 and p_ok > 0)
        if aceso:
            d.polygon(pts, fill=LARANJA + (int(255 * entra),))
        else:
            d.polygon(pts, outline=NEVOA + (int(255 * entra),), width=2)
    d.text((x0 + 34, y0 + 92 + off), f'{n:02d}', font=F(FONTE_MONO, 40), fill=LARANJA + (int(255 * entra),))
    d.text((x0 + 120, y0 + 84 + off), item, font=F(FONTE_SAIRA, 54), fill=ALUMINIO + (int(255 * entra),))
    if p_ok > 0:
        # ✓ desenhado com traço
        a = ease_out(p_ok)
        bx, by = x1 - 92, y0 + 112 + off
        p1, p2, p3 = (bx - 22, by), (bx - 6, by + 18), (bx + 26, by - 22)
        if a < 0.4:
            q = a / 0.4
            d.line([p1, (p1[0] + (p2[0] - p1[0]) * q, p1[1] + (p2[1] - p1[1]) * q)], fill=LARANJA, width=7)
        else:
            q = (a - 0.4) / 0.6
            d.line([p1, p2], fill=LARANJA, width=7)
            d.line([p2, (p2[0] + (p3[0] - p2[0]) * q, p2[1] + (p3[1] - p2[1]) * q)], fill=LARANJA, width=7)


def cantos(base, a=1.0, inset=40):
    d = ImageDraw.Draw(base, 'RGBA')
    c = LARANJA + (int(220 * a),)
    L = 60
    for (x, y, sx, sy) in [(inset, inset + 120, 1, 1), (W - inset, inset + 120, -1, 1), (inset, H - inset, 1, -1), (W - inset, H - inset, -1, -1)]:
        d.line([(x, y), (x + sx * L, y)], fill=c, width=4)
        d.line([(x, y), (x, y + sy * L)], fill=c, width=4)


# ── cenas no tempo ──
CENAS = [
    # (início, fim, chave, zoom ini, zoom fim, foco x, foco y, item do checklist)
    (2.0, 4.0, 'a', 2.1, 1.0, 0.5, 0.17, (1, 'Abertura')),
    (4.0, 5.5, 'b', 1.0, 1.1, 0.5, 0.55, (2, 'Sem template')),
    (5.5, 6.0, 'c', 1.1, 1.14, 0.5, 0.55, None),
    (6.0, 7.0, 'd', 1.0, 1.12, 0.5, 0.5, None),
    (7.2, 9.0, 'e', 1.3, 1.02, 0.5, 0.3, (3, 'Barreira do som')),
    (9.0, 11.0, 'f', 1.25, 1.12, 0.5, 0.32, (4, 'Projetos')),
    (11.0, 13.0, 'g', 1.32, 1.18, 0.5, 0.33, (5, 'Pedido pelo WhatsApp')),
]


def quadro(f):
    t = f / FPS
    # 0–2 s: abertura com texto
    if t < 2.0:
        img = CEU.copy().convert('RGBA')
        d = ImageDraw.Draw(img, 'RGBA')
        lp = ease_io(prog(t, 0.0, 0.7))
        cx = W / 2
        d.line([(cx - 420 * lp, 820), (cx + 420 * lp, 820)], fill=LARANJA, width=3)
        if t > 0.25:
            a = int(255 * prog(t, 0.25, 0.6))
            mono = F(FONTE_MONO, 26)
            txt = 'MACH · CHECKLIST DE PRÉ-VOO'
            tw = mono.getlength(txt)
            d.text((cx - tw / 2, 760), txt, font=mono, fill=NEVOA + (a,))
        texto_mascara(img, 'Algo está saindo', F(FONTE_SAIRA, 96), cx, 870, prog(t, 0.55, 1.15), centro=True)
        texto_mascara(img, 'do hangar.', F(FONTE_SAIRA, 96), cx, 985, prog(t, 0.7, 1.3), centro=True)
        saida = prog(t, 1.82, 2.0)
        img = img.convert('RGB')
        if saida > 0:
            img = Image.blend(img, Image.new('RGB', (W, H), (0, 0, 0)), saida)
        return img
    # 13–16 s: encerramento
    if t >= 13.0:
        lt = t - 13.0
        img = CEU.copy().convert('RGBA')
        d = ImageDraw.Draw(img, 'RGBA')
        a = prog(lt, 0.0, 0.5)
        lw = 760
        lg = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
        s = 0.92 + 0.08 * ease_out(a)
        lg2 = lg.resize((int(lg.width * s), int(lg.height * s)), Image.LANCZOS)
        al = lg2.split()[3].point(lambda v: int(v * a))
        lg2.putalpha(al)
        img.alpha_composite(lg2, (int(W / 2 - lg2.width / 2), int(560 - lg2.height / 2)))
        mono = F(FONTE_MONO, 26)
        if lt > 0.35:
            aa = int(255 * prog(lt, 0.35, 0.7))
            txt = 'CHECKLIST COMPLETO · PRONTO PARA DECOLAR'
            d.text((W / 2 - mono.getlength(txt) / 2, 820), txt, font=mono, fill=LARANJA + (aa,))
        texto_mascara(img, 'O site da MACH', F(FONTE_SAIRA, 104), W / 2, 900, prog(lt, 0.5, 1.1), centro=True)
        texto_mascara(img, 'Lançamento em breve.', F(FONTE_SAIRA, 76), W / 2, 1030, prog(lt, 0.7, 1.3), cor=(185, 192, 199), centro=True)
        if lt > 1.3:
            aa = int(255 * prog(lt, 1.3, 1.7))
            for txt, y, cor in [('@mach.sites', 1240, ALUMINIO), ('ATIVE AS NOTIFICAÇÕES', 1300, NEVOA)]:
                f_ = F(FONTE_MONO, 32 if txt.startswith('@') else 24)
                d.text((W / 2 - f_.getlength(txt) / 2, y), txt, font=f_, fill=cor + (aa,))
        img = img.convert('RGB')
        entra = prog(lt, 0.0, 0.18)
        if entra < 1:
            img = Image.blend(Image.new('RGB', (W, H), (0, 0, 0)), img, entra)
        return img
    # clarão do estrondo (7,0–7,2 s)
    if 7.0 <= t < 7.2:
        base = camera(cena['d'], 1.12)
        k = prog(t, 7.0, 7.08)
        return Image.blend(base, Image.new('RGB', (W, H), (255, 246, 238)), k)
    for (a, b, k, z0, z1, fx, fy, item) in CENAS:
        if a <= t < b:
            lt = t - a
            p = (t - a) / (b - a)
            z = z0 + (z1 - z0) * ease_io(p) if k != 'e' else z1 + (z0 - z1) * (1 - ease_out(prog(lt, 0, 1.2)))
            dx = dy = 0.0
            if k == 'e' and lt < 0.35:  # tremor depois do estrondo
                amp = 14 * (1 - lt / 0.35)
                dx, dy = amp * math.sin(lt * 90), amp * math.cos(lt * 70)
            if k == 'f':
                dy = -40 * ease_io(p)
            img = camera(cena[k], z, fx, fy, dx, dy)
            # entradas
            if k == 'a' and lt < 0.4:
                img = img.filter(ImageFilter.GaussianBlur(18 * (1 - lt / 0.4)))
            if k in ('b', 'g') and lt < 0.25:
                ant = {'b': camera(cena['a'], 1.0, 0.5, 0.17), 'g': camera(cena['f'], 1.12, 0.5, 0.32, 0, -40)}[k]
                q = ease_io(lt / 0.25)
                tela = Image.new('RGB', (W, H))
                if k == 'b':  # sobe, como rolagem
                    tela.paste(ant, (0, int(-q * H)))
                    tela.paste(img, (0, int((1 - q) * H)))
                else:  # entra da direita
                    tela.paste(ant, (int(-q * W), 0))
                    tela.paste(img, (int((1 - q) * W), 0))
                img = tela
            if k == 'c':
                img = glitch(img, 0.6 + 0.4 * math.sin(f * 1.7) ** 2, f)
            if k == 'd' and lt < 0.12:
                img = glitch(img, 0.5, f)
            if k == 'f':
                img = varredura(img, prog(lt, 0.4, 1.6))
            if k == 'e':
                img = Image.blend(Image.new('RGB', (W, H), (255, 246, 238)), img, prog(lt, 0.0, 0.45) * 0.5 + 0.5) if lt < 0.45 else img
            img = img.convert('RGBA')
            if item:
                n, nome = item
                painel_checklist(img, n, nome, prog(lt, 0.45, 0.85), lt)
                cantos(img, prog(lt, 0.0, 0.3))
            return img.convert('RGB')
    return Image.new('RGB', (W, H), (0, 0, 0))


def main():
    saida = os.path.join(ROOT, 'teaser-lancamento-9x16.mp4')
    cmd = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
           '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
           '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
           '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
           '-movflags', '+faststart', saida]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(NF):
        img = quadro(f)
        proc.stdin.write(img.tobytes())
        if f == int(15.2 * FPS):
            img.save(os.path.join(ROOT, 'capa-teaser-9x16.png'))
    proc.stdin.close()
    proc.wait()
    print('teaser →', saida)


if __name__ == '__main__':
    main()
