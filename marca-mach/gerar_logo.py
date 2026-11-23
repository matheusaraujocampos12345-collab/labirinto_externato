#!/usr/bin/env python3
"""Gera o logo MACH em SVG e a geometria usada no vídeo.

Saídas:
  svg/assinatura-*.svg   logotipo + diamantes sob o Λ + descritor ESTÚDIO
  svg/logotipo-*.svg     só a palavra MΛCH
  svg/simbolo-*.svg      Λ + diamantes de choque
  svg/avatar.svg         perfil de rede social (fundo estratosfera)
  ../video-anuncio/src/logoMach.js   mesma geometria para o renderizador do vídeo

Uso: python3 marca-mach/gerar_logo.py   (requer: pip install fonttools)
"""
import json
import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(ROOT, 'fontes', 'Saira-500-expanded.ttf')
VIDEO_JS = os.path.join(os.path.dirname(ROOT), 'video-anuncio', 'src', 'logoMach.js')

# ── cores da marca ───────────────────────────────────────────
ESTRATOSFERA = '#0A0C0F'
ALUMINIO = '#DFE3E7'
LARANJA = '#FF6B1A'        # sobre fundo escuro
LARANJA_CLARO = '#E85A0C'  # sobre fundo claro (mais contraste)

# ── geometria (unidades: altura das letras = 100) ───────────
STROKE = 7
HALF = STROKE / 2
BASE = 100 + HALF  # linha de corte inferior (pés retos)

# segmentos retos (para a animação de linhas convergindo no vídeo)
SEGMENTS = [
    # M
    (0, 100, 0, 0, False), (0, 0, 55, 72, False), (55, 72, 110, 0, False), (110, 0, 110, 100, False),
    # Λ (acento)
    (142, 100, 196, 0, True), (196, 0, 250, 100, True),
    # C (partes retas)
    (312, 0, 390, 0, False), (282, 30, 282, 70, False), (312, 100, 390, 100, False),
    # H
    (420, 0, 420, 100, False), (520, 0, 520, 100, False), (420, 50, 520, 50, False),
]
C_CORNERS = ['M282 30 Q282 0 312 0', 'M282 70 Q282 100 312 100']


def leg_ext(ax, ay, bx, by, y_to=108):
    t = (y_to - ay) / (by - ay)
    return ax + (bx - ax) * t


# pernas do Λ prolongadas abaixo da base e cortadas retas por um clipe
LAMBDA_PATH = f'M{leg_ext(196, 0, 142, 100):.2f} 108 L196 0 L{leg_ext(196, 0, 250, 100):.2f} 108'
LETTERS_PATH = ('M0 100 V0 L55 72 L110 0 V100 '
                'M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 '
                'M420 0 V100 M520 0 V100 M420 50 H520')

LAMBDA_CX = 196
# diamantes de choque: (cx, cy, meia-largura, meia-altura, opacidade)
DIAMONDS_REL = [(0, 128, 9, 14, 1.0), (0, 157, 6.5, 10, 0.62), (0, 180, 4.5, 7, 0.34)]


def diamond(cx, cy, hw, hh):
    return f'M{cx:g} {cy - hh:g} L{cx + hw:g} {cy:g} L{cx:g} {cy + hh:g} L{cx - hw:g} {cy:g} Z'


def diamonds_svg(cx, fill, dy=0, scale=1.0):
    out = []
    for (_, cy, hw, hh, op) in DIAMONDS_REL:
        out.append(f'<path d="{diamond(cx, dy + cy * scale, hw * scale, hh * scale)}" fill="{fill}" opacity="{op}"/>')
    return '\n    '.join(out)


# ── descritor "ESTÚDIO" em curvas (Saira Expanded Medium) ───
def descriptor_path(text='ESTÚDIO', cap=19.0, left=282 - HALF, right=520 + HALF, baseline=141.0):
    font = TTFont(FONT)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    s = cap / font['OS/2'].sCapHeight
    names = [cmap[ord(ch)] for ch in text]
    advs = [font['hmtx'][n][0] * s for n in names]
    bounds = []
    for n in names:
        bp = BoundsPen(gs)
        gs[n].draw(bp)
        bounds.append(bp.bounds)
    first_xmin = bounds[0][0] * s
    last_xmax = bounds[-1][2] * s
    span = sum(advs[:-1]) + last_xmax - first_xmin
    tracking = ((right - left) - span) / (len(names) - 1)
    x = left - first_xmin
    pen = SVGPathPen(gs)
    for n, adv in zip(names, advs):
        gs[n].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        x += adv + tracking
    return pen.getCommands(), tracking


DESCRIPTOR, TRACKING = descriptor_path()


# ── montagem dos SVGs ───────────────────────────────────────
def wordmark_group(letter_color, accent_color, uid):
    return f'''<clipPath id="pe-{uid}"><rect x="-40" y="-40" width="620" height="{40 + BASE}"/></clipPath>
  <g fill="none" stroke-width="{STROKE}" stroke-linejoin="miter" stroke-miterlimit="4">
    <path d="{LETTERS_PATH}" stroke="{letter_color}" stroke-linecap="square"/>
    <path d="{LAMBDA_PATH}" stroke="{accent_color}" stroke-linecap="butt" clip-path="url(#pe-{uid})"/>
  </g>'''


def svg_doc(view, body, title, bg=None):
    x, y, w, h = view
    bg_rect = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>\n  ' if bg else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" role="img" aria-label="{title}">
  <title>{title}</title>
  {bg_rect}{body}
</svg>
'''


VARIANTS = {
    # nome: (cor das letras, cor do acento, fundo de prévia)
    'escuro': (ALUMINIO, LARANJA),
    'claro': (ESTRATOSFERA, LARANJA_CLARO),
    'branco': ('#FFFFFF', '#FFFFFF'),
    'preto': ('#000000', '#000000'),
}

VIEW_WORD = (-14, -16, 548, 128)
VIEW_SIGN = (-14, -16, 548, 220)


def build():
    os.makedirs(os.path.join(ROOT, 'svg'), exist_ok=True)
    files = []
    for name, (lc, ac) in VARIANTS.items():
        uid = name
        word = wordmark_group(lc, ac, uid)
        # logotipo
        files.append((f'logotipo-{name}.svg', svg_doc(VIEW_WORD, word, 'MACH')))
        # assinatura completa
        body = word + f'''
  <g>
    {diamonds_svg(LAMBDA_CX, ac)}
  </g>
  <path d="{DESCRIPTOR}" fill="{lc}"/>'''
        files.append((f'assinatura-{name}.svg', svg_doc(VIEW_SIGN, body, 'MACH Estúdio')))
        # símbolo
        sym = symbol_body(lc if name in ('branco', 'preto') else ac, ac, uid)
        files.append((f'simbolo-{name}.svg', svg_doc((-22, -24, 152, 232), sym, 'Símbolo MACH')))
    # avatar quadrado (perfil)
    av = symbol_body(LARANJA, LARANJA, 'av', ox=0, oy=0)
    files.append(('avatar.svg', svg_doc((-111, -76, 330, 330), av, 'Avatar MACH', bg=ESTRATOSFERA)))
    for fn, txt in files:
        with open(os.path.join(ROOT, 'svg', fn), 'w') as f:
            f.write(txt)
    return [fn for fn, _ in files]


SYM_STROKE = 9


def symbol_body(lambda_color, diamond_color, uid, ox=0, oy=0):
    half = SYM_STROKE / 2
    l = f'M{leg_ext(54, 0, 0, 100):.2f} 108 L54 0 L{leg_ext(54, 0, 108, 100):.2f} 108'
    return f'''<clipPath id="ps-{uid}"><rect x="-40" y="-40" width="200" height="{40 + 100 + half}"/></clipPath>
  <path d="{l}" fill="none" stroke="{lambda_color}" stroke-width="{SYM_STROKE}" stroke-linejoin="miter" clip-path="url(#ps-{uid})"/>
  <g>
    {diamonds_svg(54, diamond_color, dy=0, scale=1.0)}
  </g>'''


def write_video_geometry():
    data = {
        'stroke': STROKE,
        'base': BASE,
        'segments': [list(s) for s in SEGMENTS],
        'cCorners': C_CORNERS,
        'lettersPath': LETTERS_PATH,
        'lambdaPath': LAMBDA_PATH,
        'lambdaCx': LAMBDA_CX,
        'diamonds': [[LAMBDA_CX, cy, hw, hh, op] for (_, cy, hw, hh, op) in DIAMONDS_REL],
        'descriptor': DESCRIPTOR,
        'view': list(VIEW_SIGN),
        'colors': {'estratosfera': ESTRATOSFERA, 'aluminio': ALUMINIO, 'laranja': LARANJA},
    }
    with open(VIDEO_JS, 'w') as f:
        f.write('// Gerado por marca-mach/gerar_logo.py — não editar à mão.\n')
        f.write('export const LOGO = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n')


if __name__ == '__main__':
    out = build()
    write_video_geometry()
    print(f'{len(out)} SVGs em marca-mach/svg · tracking do descritor = {TRACKING:.2f}')
    print('geometria →', VIDEO_JS)
