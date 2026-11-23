#!/usr/bin/env python3
"""i12 · Padaria em uso: desenho de som (só efeitos, sem música).

Tudo é sintetizado aqui, com numpy (nenhum arquivo de som de fora).
Uso, da raiz do repositório:
    python3 instagram/reels/audio/i12_sfx.py          # gera audio/i12-sfx.wav
    python3 instagram/reels/audio/i12_sfx.py --video  # e também o vídeo com som e a prévia

Saída: 48 kHz, estéreo, 24 bits, 47,000 s (o mesmo tamanho do vídeo).
Mixagem: perto de -18 LUFS integrado, pico real abaixo de -1 dBTP (medido com o ebur128 do ffmpeg).
O ambiente (forno, cozinha, neon) é gerado em laço: o fim emenda no começo sem estalo.

Os tempos saem do roteiro, de cenas/i12.js e de cenas/i12-captura.mjs (conferidos nos quadros).
"""
import os
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000
DUR = 47.0
N = int(round(SR * DUR))
AQUI = os.path.dirname(os.path.abspath(__file__))
REELS = os.path.dirname(AQUI)
WAV = os.path.join(AQUI, 'i12-sfx.wav')
VIDEO = os.path.join(REELS, 'i12-padaria-em-uso.mp4')
VIDEO_SOM = os.path.join(REELS, 'i12-padaria-em-uso-com-som.mp4')
PREVIA = os.path.join(REELS, 'previas', 'i12-com-som.mp4')
ALVO_LUFS = -18.0
TETO_DBTP = -2.8  # margem: o AAC sobe o pico real em até ~1 dB

# ── eventos (segundos do vídeo) ────────────────────────────────
T = {
    'selo': 3.0,             # zoom no selo "Encomendas de Natal abertas"
    'assadeira': (7.15, 8.27),  # a mão puxa a assadeira (o filme do forno termina em 8,27 s)
    'placa': (7.467, 7.55),  # a placa PÃO QUENTE pisca e acende
    'pao': (8.27, 10.5),     # o pão parado na luz: a casca cantando
    'led': 10.5,             # painel da próxima fornada
    'led_muda': (11.0, 12.0),  # "faltam 12:16" → 12:15 → 12:14
    'natal': 13.0,           # luzes de Natal e o painel "11 dias"
    'natal2': 14.5,          # as lâmpadas piscando devagar
    'etapa': (16.0, 27.5, 33.0, 42.0),  # trocas de etapa (cortes)
    'aba': 17.0,             # toque na aba Natal
    'rolagem': ((17.5, 18.5), (24.0, 25.5)),  # a página desce
    'adicionar': (19.5, 21.5),  # "Adicionar" no panetone 1 kg e no chocotone
    'mais': 20.5,            # "+" (fica 2)
    'zap': 27.0,             # toque em "Encomendar pelo WhatsApp"
    'envio': 28.2,           # o balão da mensagem pronta entra
    'convite': 42.2,         # "Quer um site assim? Chama no direct."
    'volta': 45.5,           # o escuro sai e o gancho volta (loop)
}

rng_mestre = np.random.default_rng(1212)


def rng():
    return np.random.default_rng(int(rng_mestre.integers(1 << 31)))


# ── ferramentas ────────────────────────────────────────────────
def db(x):
    return 10 ** (x / 20)


def clamp(x, a=0.0, b=1.0):
    return np.minimum(b, np.maximum(a, x))


def suave(a, b, x):
    k = clamp((np.asarray(x, float) - a) / (b - a))
    return k * k * (3 - 2 * k)


def faixa(f, baixo=None, alto=None, ordem=2):
    """resposta de passa-faixa estilo Butterworth (só módulo)"""
    f = np.maximum(f, 1e-3)
    g = np.ones_like(f)
    if baixo:
        g = g / np.sqrt(1 + (baixo / f) ** (2 * ordem))
    if alto:
        g = g / np.sqrt(1 + (f / alto) ** (2 * ordem))
    return g


def filtrar(x, resp, circular=False):
    """filtro de fase zero no domínio da frequência; circular=True mantém o laço"""
    n = len(x)
    m = n if circular else int(2 ** np.ceil(np.log2(n + SR // 10)))
    X = np.fft.rfft(x, m)
    X *= resp(np.fft.rfftfreq(m, 1 / SR))
    return np.fft.irfft(X, m)[:n]


def ruido_laco(resp, r):
    """ruído colorido periódico em 47 s (emenda perfeita no loop)"""
    k = N // 2 + 1
    X = (r.standard_normal(k) + 1j * r.standard_normal(k)) * resp(np.fft.rfftfreq(N, 1 / SR))
    X[0] = 0
    x = np.fft.irfft(X, N)
    return x / np.sqrt(np.mean(x ** 2))


def svf_bp(x, fc, q):
    """passa-faixa de variável de estado (TPT) com frequência variando no tempo"""
    g = np.tan(np.pi * np.minimum(fc, SR * 0.45) / SR)
    k = 1.0 / q
    a1 = 1 / (1 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    out = np.empty(len(x))
    ic1 = ic2 = 0.0
    for i, (xi, b1, b2, b3) in enumerate(zip(x.tolist(), a1.tolist(), a2.tolist(), a3.tolist())):
        v3 = xi - ic2
        v1 = b1 * ic1 + b2 * v3
        v2 = ic2 + b2 * ic1 + b3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1
    return out


def eixo(dur):
    return np.arange(int(round(dur * SR))) / SR


def pico1(x):
    p = np.max(np.abs(x))
    return x / p if p > 0 else x


def pan(x, p):
    """mono → estéreo, potência constante; p de -1 (esq.) a 1 (dir.)"""
    th = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)])


mix = np.zeros((2, N))
CAMADAS = {}
NIVEIS = {}


def k_peso(x):
    """ponderação K da BS.1770 (a mesma do ebur128), aplicada pela FFT"""
    n = x.shape[-1]
    m = int(2 ** np.ceil(np.log2(n + SR)))
    z = np.exp(-1j * 2 * np.pi * np.fft.rfftfreq(m, 1 / SR) / SR)
    h1 = (1.53512485958697 - 2.69169618940638 * z + 1.19839281085285 * z ** 2) / (1 - 1.69065929318241 * z + 0.73248077421585 * z ** 2)
    h2 = (1 - 2 * z + z ** 2) / (1 - 1.99004745483398 * z + 0.99007225036621 * z ** 2)
    return np.fft.irfft(np.fft.rfft(x, m) * h1 * h2, m)[..., :n]


def lufs_m(x):
    """loudness momentânea máxima (janela de 400 ms), em LUFS"""
    x = x if x.ndim == 2 else pan(x, 0.0)
    y = np.sum(k_peso(np.pad(x, ((0, 0), (int(0.4 * SR), int(0.4 * SR))))) ** 2, axis=0)
    c = np.concatenate([[0], np.cumsum(y)])
    w = int(0.4 * SR)
    media = (c[w::SR // 10] - c[:-w:SR // 10][:len(c[w::SR // 10])]) / w
    return -0.691 + 10 * np.log10(np.max(media) + 1e-15)


def por(sinal, t0, alvo, nome, marca=None):
    """coloca um som (mono ou estéreo) no tempo t0, com loudness momentânea máxima = alvo (LUFS)"""
    s = sinal if sinal.ndim == 2 else pan(sinal, 0.0)
    s = s * db(alvo - lufs_m(s))
    i0 = int(round(t0 * SR))
    j0 = max(0, -i0)
    i1 = min(N, i0 + s.shape[1])
    mix[:, max(0, i0):i1] += s[:, j0:j0 + i1 - max(0, i0)]
    CAMADAS.setdefault(nome, []).append(round(t0 if marca is None else marca, 3))
    NIVEIS[nome] = max(alvo, NIVEIS.get(nome, -99))


def curva(pts, t):
    """envelope por pontos [(t, v), ...] com interpolação linear"""
    ts, vs = zip(*pts)
    return np.interp(t, ts, vs)


TT = np.arange(N) / SR

# ── 1. ambiente: forno e cozinha de madrugada (em laço) ───────
r = rng()
# ronco do queimador: ruído grave, cortado abaixo de 70 Hz (nada de vibrar o celular)
ronco = ruido_laco(lambda f: faixa(f, 70, 420, 2) / np.sqrt(np.maximum(f, 30) / 30), r)
# zumbido do forno: harmônicos da rede de 60 Hz, com respiração lenta (períodos que fecham em 47 s)
zumbido = np.zeros(N)
for h, a in [(120, 1.0), (180, 0.35), (240, 0.6), (360, 0.32), (480, 0.16), (600, 0.08)]:
    zumbido += a * np.sin(2 * np.pi * h * TT + r.uniform(0, 2 * np.pi))
zumbido *= 1 + 0.12 * np.sin(2 * np.pi * (5 / DUR) * TT) + 0.06 * np.sin(2 * np.pi * (13 / DUR) * TT + 1.3)
zumbido /= np.sqrt(np.mean(zumbido ** 2))
# exaustor ao longe e o ar da cozinha (um pouco de largura estéreo)
ar_m = ruido_laco(lambda f: faixa(f, 180, 3200, 1) / np.sqrt(np.maximum(f, 50) / 50), r)
ar_s = ruido_laco(lambda f: faixa(f, 300, 3200, 1) / np.sqrt(np.maximum(f, 50) / 50), r)

# nível do ambiente ao longo do vídeo (igual no começo e no fim, para o loop)
amb = curva([(0, 1.0), (10.48, 1.0), (10.52, 0.8), (15.98, 0.8), (16.02, 0.5), (35.0, 0.5), (41.9, 0.72),
             (42.0, 0.72), (42.3, 0.42), (45.5, 0.42), (46.2, 1.0), (DUR, 1.0)], TT)
ALVO_AMBIENTE = -33.0  # LUFS no começo: bem baixo, uns 15 LU abaixo dos efeitos
grave = ronco * db(-41) + zumbido * db(-45)
cama = np.stack([grave, grave]) + np.stack([ar_m + 0.35 * ar_s, ar_m - 0.35 * ar_s]) * db(-50)
cama *= db(ALVO_AMBIENTE - lufs_m(cama[:, SR:3 * SR]))
mix += cama * amb
NIVEIS['ambiente: forno + cozinha'] = ALVO_AMBIENTE
CAMADAS['ambiente: forno + cozinha'] = ['0–47 (laço)']

# ── 2. neon: o letreiro da primeira tela e a placa PÃO QUENTE ──
r = rng()
chiado = ruido_laco(lambda f: faixa(f, 2200, 7500, 2), r)
pulsos = np.abs(np.sin(2 * np.pi * 60 * TT)) ** 10  # descarga do gás: 120 vezes por segundo
tom_neon = np.zeros(N)
for k in range(2, 14):
    tom_neon += np.sin(2 * np.pi * 120 * k * TT + r.uniform(0, 6.28)) / k
tom_neon = filtrar(tom_neon, lambda f: faixa(f, 300, 2600, 2), circular=True)
tom_neon /= np.sqrt(np.mean(tom_neon ** 2))
neon = chiado * (0.25 + pulsos) * 0.55 + tom_neon * 0.5
neon *= db(-36.0 - lufs_m(neon[SR:3 * SR]))  # o chiado fica só um pouco acima do ambiente
# letreiro: aceso desde o primeiro quadro, mais baixo no zoom do selo, some com a rolagem
# (opacidade do site: 1 - suave(0,06; 0,24; p), p = rolagem do herói) e volta quando o escuro sai
p_heroi = (1 - np.cos(np.pi * clamp((TT - 5.4) / 3.6))) / 2
letreiro = np.where(TT < 10, 1 - suave(0.06, 0.24, p_heroi), 0.0)
letreiro *= curva([(0, 1), (2.98, 1), (3.02, 0.55), (4.98, 0.55), (5.02, 1), (DUR, 1)], TT)
letreiro = np.where(TT >= 42, curva([(42, 1), (42.3, 0), (45.5, 0), (46.2, 1), (DUR, 1)], TT), letreiro)
# placa PÃO QUENTE: pisca em 7,467 s, acende de vez em 7,55 s, sai no corte de 10,5 s
placa = np.zeros(N)
placa[(TT >= 7.467) & (TT < 7.50)] = 0.8
placa[(TT >= 7.55) & (TT < 10.5)] = 0.75
placa = filtrar(placa, lambda f: faixa(f, None, 120, 1))  # sem estalo nas bordas
mix += pan(neon * letreiro, -0.1)
mix += pan(neon * placa * db(-1), 0.3)
NIVEIS['neon do letreiro'] = -36.0
NIVEIS['neon da placa PÃO QUENTE'] = -37.0
CAMADAS['neon do letreiro'] = ['0–6,6', '45,5–47 (volta)']
CAMADAS['neon da placa PÃO QUENTE'] = ['7,47–10,5']


def faisca(r, dur=0.03):
    """o estalinho elétrico do neon acendendo"""
    t = eixo(dur)
    x = r.standard_normal(len(t)) * np.exp(-t / 0.006)
    x *= (r.random(len(t)) < 0.35)
    return filtrar(x, lambda f: faixa(f, 1800, 9000, 2))


r = rng()
por(pan(pico1(faisca(r)), 0.3), 7.467, -27, 'faísca da placa acendendo')
por(pan(pico1(faisca(r)), 0.3), 7.55, -25, 'faísca da placa acendendo')


# ── 3. a assadeira deslizando e o pão cantando ─────────────────
def assadeira(r, t0, t1):
    dur = t1 - t0 + 0.6
    t = eixo(dur)
    # quanto a assadeira anda (medido nos quadros: começa em 7,15, mais forte de 7,3 a 7,85, para em 8,27)
    vel = curva([(0, 0), (0.1, 0.55), (0.18, 0.95), (0.45, 1.0), (0.7, 0.85), (0.9, 0.62), (1.05, 0.5), (1.12, 0.0), (dur, 0)], t)
    aspereza = np.abs(filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 20, 90, 2)))
    aspereza /= aspereza.max()
    atrito = r.standard_normal(len(t)) * vel * (0.35 + 0.65 * aspereza)
    # modos da chapa de metal (picos estreitos) + o raspado largo
    modos = [(760, 40), (1180, 45), (1830, 55), (2610, 60), (3470, 70), (4690, 80), (6050, 90)]

    def resp(f):
        g = 0.22 * faixa(f, 1400, 8000, 2)
        for fc, q in modos:
            g = g + 1.0 / (1 + (q * (f / fc - fc / np.maximum(f, 1))) ** 2) * (fc / 2000) ** -0.3
        return g * faixa(f, 300, None, 2)
    x = pico1(filtrar(atrito, resp))
    # a assadeira passando pela grade do forno: tiquinhos metálicos irregulares
    tq = np.zeros(len(t))
    pos = 0.12
    while pos < 1.0:
        i = int(pos * SR)
        n = int(0.02 * SR)
        tt = np.arange(n) / SR
        f = r.uniform(2300, 4200)
        tq[i:i + n] += np.interp(pos, [0.12, 0.5, 1.0], [0.6, 1.0, 0.3]) * r.uniform(0.4, 1.0) * \
            np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006)
        pos += r.uniform(0.035, 0.075)
    x = x + 0.45 * pico1(tq)
    # o assentar no fim (8,27 s): batidinha abafada de metal
    i = int((t1 - t0) * SR)
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    pouso = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in [(310, 1, 0.05), (640, 0.6, 0.035), (1130, 0.4, 0.02), (2250, 0.25, 0.012)])
    pouso *= clamp(tt / 0.002)
    x[i:i + n] += 0.5 * pico1(pouso)
    # o bafo quente do forno, bem por baixo
    bafo = filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 150, 1100, 2)) * curva([(0, 0), (0.25, 1), (0.9, 0.6), (1.6, 0), (dur, 0)], t)
    x = x + 0.25 * pico1(bafo)
    return x


r = rng()
a0, a1 = T['assadeira']
por(pan(assadeira(r, a0, a1), 0.05), a0, -15, 'assadeira deslizando')


def pao_cantando(r, t0, t1):
    dur = t1 - t0
    t = eixo(dur)
    x = np.zeros((2, len(t)))
    taxa = curva([(0, 4), (0.5, 26), (1.4, 22), (dur, 16)], t)  # estalos por segundo
    pos = 0.02
    while pos < dur - 0.01:
        i = int(pos * SR)
        n = int(r.uniform(0.0004, 0.0025) * SR)
        a = np.exp(r.uniform(np.log(0.05), 0.0)) ** 1.6
        e = r.standard_normal(n) * np.exp(-np.arange(n) / (n * 0.3))
        p = r.uniform(-0.45, 0.45)
        x[:, i:i + n] += pan(e * a, p)
        # às vezes um estalo vem em grupinho
        pos += r.exponential(1 / taxa[min(i, len(t) - 1)]) if r.random() > 0.25 else r.uniform(0.004, 0.012)
    x = np.stack([filtrar(c, lambda f: faixa(f, 2500, 11000, 2)) for c in x])
    x *= curva([(0, 0), (0.3, 1), (dur - 0.012, 1), (dur, 0)], t)  # para seco no corte de 10,5 s
    return x / np.max(np.abs(x))


r = rng()
p0, p1 = T['pao']
por(pao_cantando(r, p0, p1), p0, -21, 'pão cantando (casca estalando)')


# ── 4. o painel de LED ────────────────────────────────────────
def bipe(f, dur=0.075):
    t = eixo(dur + 0.02)
    x = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * 2 * f * t) + 0.05 * np.sin(2 * np.pi * 3 * f * t)
    env = clamp(t / 0.003) * clamp((dur - t) / 0.018 + 0.0) * np.exp(-t / 0.12)
    return pico1(x * env)


por(bipe(1568), T['led'], -18, 'bipe do LED (aparece)')
for tm in T['led_muda']:
    por(bipe(1318, 0.05), tm, -22, 'bipe do LED (o número muda)')
por(bipe(1175, 0.06), T['natal'], -23, 'bipe do LED "11 dias"')


# ── 5. brilho de sino nas luzes de Natal ───────────────────────
def sino_fino(r, f0, decai=0.9):
    t = eixo(decai * 3.2)
    x = np.zeros(len(t))
    for razao, a, d in [(1.0, 1.0, 1.0), (2.76, 0.32, 0.45), (5.40, 0.12, 0.22)]:
        for dt, aa in [(0, 1.0), (1.3, 0.45)]:  # pares levemente desafinados = brilho
            x += a * aa * np.sin(2 * np.pi * (f0 * razao + dt) * t + r.uniform(0, 6.28)) * np.exp(-t / (decai * d))
    return pico1(x * clamp(t / 0.0015))


def brilho(r, notas, tempos, fortes, largura=0.45):
    dur = max(tempos) + 3.0
    x = np.zeros((2, int(dur * SR)))
    for f, tt, a in zip(notas, tempos, fortes):
        s = sino_fino(r, f, r.uniform(0.6, 1.0)) * a
        i = int(tt * SR)
        n = min(len(s), x.shape[1] - i)
        x[:, i:i + n] += pan(s[:n], r.uniform(-largura, largura))
    # um sopro de ar bem agudo por baixo
    t = np.arange(x.shape[1]) / SR
    ar = filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 6000, 13000, 2))
    ar = pico1(ar) * curva([(0, 0), (0.12, 0.16), (1.2, 0), (dur, 0)], t)
    x += np.stack([ar, np.roll(ar, 240)])  # 5 ms de diferença entre os lados: largura discreta
    return x / np.max(np.abs(x))


r = rng()
# notas espalhadas, sem formar melodia (tocadas quase juntas, como um brilho)
por(brilho(r, [3136, 2637, 3951, 2960, 3520, 2349], [0, 0.06, 0.13, 0.23, 0.36, 0.52], [1, 0.75, 0.6, 0.5, 0.4, 0.3]),
    T['natal'], -15, 'brilho de sino (luzes de Natal)')
por(brilho(r, [3730, 2794], [0, 0.11], [1, 0.6]), T['natal2'], -22, 'brilho de sino (lâmpadas piscando)')
por(brilho(r, [3322], [0], [1], 0.1), T['selo'], -23, 'brilho no selo de Natal')


# ── 6. toques na interface ─────────────────────────────────────
def clique(r, f=2300):
    t = eixo(0.04)
    n = r.standard_normal(len(t)) * np.exp(-t / 0.0011)
    n = filtrar(n, lambda fr: faixa(fr, 1500, 9000, 2))
    corpo = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.0028) * 0.7 + np.sin(2 * np.pi * 540 * t) * np.exp(-t / 0.006) * 0.3
    return pico1((pico1(n) * 0.8 + corpo) * clamp(t / 0.0003))


def pop(r, f0):
    t = eixo(0.16)
    f = f0 * (0.55 + 0.45 * clamp(t / 0.028) ** 0.6)  # a bolha sobe de tom e estoura macio
    fase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(fase) + 0.18 * np.sin(2 * fase)
    x *= clamp(t / 0.0025) * np.exp(-t / 0.04)
    c = clique(r, 2600)
    x[:len(c)] += 0.18 * c  # o contato do dedo, bem leve
    return pico1(x)


def tique(r):
    t = eixo(0.03)
    x = np.sin(2 * np.pi * 3400 * t) * np.exp(-t / 0.0035) + 0.5 * np.sin(2 * np.pi * 5150 * t) * np.exp(-t / 0.0018)
    x += 0.4 * pico1(filtrar(r.standard_normal(len(t)) * np.exp(-t / 0.0008), lambda f: faixa(f, 3000, 12000, 2)))
    return pico1(x * clamp(t / 0.0002))


r = rng()
por(clique(r), T['aba'], -19, 'clique (aba Natal)')
por(pop(r, 720), T['adicionar'][0], -16, 'pop (Adicionar panetone)')
por(tique(r), T['mais'], -23, 'tique (+)')
por(pop(r, 860), T['adicionar'][1], -17, 'pop (Adicionar chocotone)')
por(clique(r, 1900), T['zap'], -18, 'clique (Encomendar pelo WhatsApp)')


# ── 7. whoosh nas trocas de etapa e a página descendo ──────────
def whoosh(r, antes, depois, f_ini, f_fim, p_ini, p_fim, q=1.4):
    dur = antes + depois
    t = eixo(dur)
    fc = f_ini * (f_fim / f_ini) ** (t / dur)
    x = svf_bp(r.standard_normal(len(t)), fc, q)
    corpo = filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 200, 900, 2))
    env = np.where(t < antes, (t / antes) ** 2.2, np.exp(-(t - antes) / (depois * 0.35)))
    x = pico1(x) + 0.25 * pico1(corpo)
    x *= env * clamp((dur - t) / 0.01)
    p = np.interp(t, [0, dur], [p_ini, p_fim])
    return pan(pico1(x), p)


r = rng()
WH = {16.0: (700, 3200, -0.25, 0.2, -18), 27.5: (2600, 600, 0.2, -0.15, -19),
      33.0: (600, 3600, -0.2, 0.25, -18), 42.0: (1800, 450, 0.15, -0.1, -21)}
for tc in T['etapa']:
    fi, ff, pi_, pf, g = WH[tc]
    antes = 0.26
    por(whoosh(r, antes, 0.2, fi, ff, pi_, pf), tc - antes, g, 'whoosh (troca de etapa)', marca=tc)


def deslize(r, t0, t1):
    """a página descendo: ar macio no ritmo da rolagem (curva suave do site)"""
    dur = t1 - t0
    t = eixo(dur)
    vel = np.sin(np.pi * t / dur) ** 2
    fc = 900 + 1500 * vel
    x = svf_bp(r.standard_normal(len(t)), fc, 0.9)
    return pan(pico1(x * vel), 0.0)


r = rng()
for a, b in T['rolagem']:
    por(deslize(r, a, b), a, -27, 'página descendo (ar macio)')


# ── 8. a mensagem sai (envio genérico) ─────────────────────────
def envio(r):
    t = eixo(0.4)
    fc = 1200 * (5200 / 1200) ** clamp(t / 0.16)
    sw = svf_bp(r.standard_normal(len(t)), fc, 2.0) * np.where(t < 0.1, (t / 0.1) ** 2, np.exp(-(t - 0.1) / 0.04))
    tb = t - 0.075
    f = 900 + 450 * clamp(tb / 0.04) ** 0.7
    fase = 2 * np.pi * np.cumsum(f) / SR
    gota = (np.sin(fase) + 0.1 * np.sin(2 * fase)) * (tb > 0) * clamp(tb / 0.004) * np.exp(-np.maximum(tb, 0) / 0.075)
    return pan(pico1(0.45 * pico1(sw) + gota), 0.05)


r = rng()
por(envio(r), T['envio'] - 0.075, -15, 'envio da mensagem (genérico)', marca=T['envio'])


# ── 9. o caminho no mapa: tom subindo e o toque no pino ────────
def desenho_mapa(t):
    """o quanto do caminho está desenhado (fórmula do próprio site: secoes.js)"""
    u = clamp((t - 33.0) / 2.5)
    topo = 680 - 475 * (1 - np.cos(np.pi * u)) / 2  # topo do mapa na tela, em px CSS (meta.json)
    e = suave(768 * 0.85, 768 * 0.35, topo)
    return 1 - (1 - e) ** 3


t_m = np.arange(int(33.3 * SR), int(35.2 * SR)) / SR
d = desenho_mapa(t_m)
CHEGADA = float(t_m[np.argmax(d >= 0.985)])  # a linha encosta no pino


def tom_subindo(t, d):
    f = 294 * 2 ** d  # Ré 4 → Ré 5, no ritmo do traço
    env = clamp((t - 33.38) / 0.18) * np.where(t < CHEGADA, 0.55 + 0.45 * d, np.exp(-(t - CHEGADA) / 0.09))
    x = np.zeros((2, len(t)))
    for desaf, p in [(1.0, -0.22), (1.004, 0.22)]:
        fase = 2 * np.pi * np.cumsum(f * desaf) / SR
        s = np.sin(fase) + 0.28 * np.sin(2 * fase) + 0.1 * np.sin(3 * fase)
        x += pan(s * env, p)
    return x / np.max(np.abs(x))


def toque_grave(r):
    t = eixo(0.9)
    cai = 1 + 0.04 * np.exp(-t / 0.02)
    x = np.zeros(len(t))
    for razao, a, dd in [(1, 1.0, 0.26), (2, 0.55, 0.15), (3, 0.28, 0.09), (4.2, 0.12, 0.05)]:
        x += a * np.sin(2 * np.pi * 147 * razao * np.cumsum(cai) / SR) * np.exp(-t / dd)
    x += 0.15 * pico1(filtrar(r.standard_normal(len(t)) * np.exp(-t / 0.004), lambda f: faixa(f, 300, 2500, 2)))
    x = filtrar(x * clamp(t / 0.003), lambda f: faixa(f, 110, None, 3))  # sem grave que faça o celular vibrar
    return pico1(x)


por(tom_subindo(t_m, d), t_m[0], -16, 'tom subindo (caminho no mapa)')
r = rng()
por(toque_grave(r), CHEGADA, -15, 'toque grave (chegou no pino)')


# ── 10. o sininho da porta e o loop voltando ───────────────────
def sininho_porta(r):
    """dois sininhos de latão numa tira de mola: a porta abre e eles batem algumas vezes"""
    dur = 3.2
    t = eixo(dur)
    x = np.zeros((2, len(t)))
    sinos = [(1870, -0.15, [0, 0.11, 0.21, 0.33, 0.46, 0.62, 0.81]), (2290, 0.15, [0.05, 0.16, 0.27, 0.4, 0.55, 0.72])]
    for f0, p, batidas in sinos:
        for k, tb in enumerate(batidas):
            a = 0.78 ** k * r.uniform(0.75, 1.0)
            i = int(tb * SR)
            tt = t[:len(t) - i]
            s = np.zeros(len(tt))
            for razao, aa, dd in [(1.0, 1.0, 1.5), (1.506, 0.42, 0.8), (2.0, 0.4, 0.7), (2.64, 0.26, 0.4), (3.37, 0.15, 0.25), (4.11, 0.08, 0.16)]:
                s += aa * np.sin(2 * np.pi * f0 * razao * (1 + r.uniform(-0.0006, 0.0006)) * tt + r.uniform(0, 6.28)) * np.exp(-tt / dd)
            s *= clamp(tt / 0.0012)
            s[:int(0.002 * SR)] += r.standard_normal(int(0.002 * SR)) * 0.25  # o badalo
            x[:, i:] += pan(s * a, p)
    balanço = 1 + 0.12 * np.sin(2 * np.pi * 5.2 * t) * np.exp(-t / 0.8)
    x *= balanço * clamp((dur - t) / 0.3)
    return x / np.max(np.abs(x))


r = rng()
por(sininho_porta(r), T['convite'], -14, 'sininho da porta (convite)')


def volta(r):
    """ar que cresce enquanto o escuro sai e a primeira tela volta"""
    t = eixo(1.0)
    x = filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 250, 3500, 2))
    env = np.where(t < 0.55, (t / 0.55) ** 3, np.exp(-(t - 0.55) / 0.12))
    return pan(pico1(x * env), 0.0)


r = rng()
por(volta(r), T['volta'] - 0.45, -25, 'ar do loop voltando', marca=T['volta'])


# ── mixagem final: loudness, pico real e gravação ──────────────
def grava_wav(caminho, x):
    x = np.clip(x, -1, 1 - 2 ** -23)
    q = np.round(x.T * (2 ** 23 - 1)).astype('<i4').reshape(-1)
    b = q.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(caminho, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


def mede(caminho):
    """loudness integrado e pico real, pelo ebur128 do ffmpeg"""
    out = subprocess.run(['ffmpeg', '-nostats', '-hide_banner', '-i', caminho, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    resumo = out[out.rfind('Summary:'):]
    i = float(re.search(r'I:\s+(-?[\d.]+) LUFS', resumo).group(1))
    lra = float(re.search(r'LRA:\s+(-?[\d.]+) LU', resumo).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', resumo).group(1))
    return i, lra, tp


def pico_real(x):
    """pico com sobreamostragem 4× (aproximação do true peak)"""
    picos = []
    for c in x:
        X = np.fft.rfft(c)
        y = np.fft.irfft(np.concatenate([X, np.zeros(len(X) * 3)]), len(c) * 4) * 4
        picos.append(np.abs(y))
    return np.max(picos, axis=0)


def limita(x, teto_db):
    """reduz só os poucos picos que passam do teto, com curva suave (ataque 3 ms, volta 40 ms)"""
    teto = db(teto_db)
    p4 = pico_real(x)
    p = p4.reshape(-1, 4).max(axis=1)
    precisa = np.minimum(1.0, teto / np.maximum(p, 1e-9))
    if precisa.min() >= 1.0:
        return x
    g = np.ones(N)
    ataque, volta_ = int(0.003 * SR), int(0.04 * SR)
    idx = np.flatnonzero(precisa < 1.0)
    grupos = np.split(idx, np.flatnonzero(np.diff(idx) > ataque) + 1)  # picos vizinhos viram um grupo só
    for gr in grupos:
        i0, i1 = gr[0], gr[-1]
        alvo = precisa[i0:i1 + 1].min()
        a, b = max(0, i0 - ataque), min(N, i1 + volta_)
        janela = np.ones(b - a)
        janela[:i0 - a] = 0.5 - 0.5 * np.cos(np.pi * np.arange(i0 - a) / max(1, i0 - a))
        janela[i1 - a:] = 0.5 + 0.5 * np.cos(np.pi * np.arange(b - i1) / max(1, b - i1))
        g[a:b] = np.minimum(g[a:b], 1 - (1 - alvo) * janela)
    return x * g


tmp = os.path.join(AQUI, '.i12-tmp.wav')
saida = mix.copy()
lufs0 = None
for _ in range(4):
    grava_wav(tmp, saida)
    lufs, lra, tp = mede(tmp)
    lufs0 = lufs if lufs0 is None else lufs0
    if abs(lufs - ALVO_LUFS) < 0.1 and tp <= TETO_DBTP:
        break
    saida = limita(saida * db(ALVO_LUFS - lufs), TETO_DBTP - 0.3)
os.replace(tmp, WAV)
lufs, lra, tp = mede(WAV)
print(f'Áudio: {os.path.relpath(WAV, os.path.dirname(REELS))}  {N / SR:.3f} s, 48 kHz, estéreo, 24 bits')
print(f'Loudness: {lufs:.1f} LUFS integrado · LRA {lra:.1f} LU · pico real {tp:.1f} dBTP')
ajuste = ALVO_LUFS - lufs0
print(f'Sons, tempos (s) e loudness momentânea máxima de cada um no arquivo final (ajuste geral {ajuste:+.1f} dB):')
for nome, ts in CAMADAS.items():
    print(f'  {nome}: ' + ', '.join(str(x).replace('.', ',') for x in ts) + f'  ·  {NIVEIS[nome] + ajuste:.0f} LUFS')

# ── vídeo com som e prévia (opcional) ──────────────────────────
if '--video' in sys.argv:
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', VIDEO, '-i', WAV, '-map', '0:v:0', '-map', '1:a:0',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                    '-movflags', '+faststart', VIDEO_SOM], check=True)
    kbps = int(2.85 * 8 * 1000 / DUR) - 96  # cabe em ~3 MB junto com o som
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', VIDEO, '-i', WAV, '-map', '0:v:0', '-map', '1:a:0',
                    '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-x264-params', 'aq-mode=3',
                    '-maxrate', f'{kbps}k', '-bufsize', f'{kbps * 2}k', '-profile:v', 'high',
                    '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', PREVIA], check=True)
    for c in (VIDEO_SOM, PREVIA):
        print(f'{os.path.relpath(c, os.path.dirname(REELS))}: {os.path.getsize(c) / 1e6:.1f} MB')
