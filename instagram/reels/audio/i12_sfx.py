#!/usr/bin/env python3
"""i12 · Padaria em uso: desenho de som (só efeitos, sem música).

Tudo é sintetizado aqui, com numpy (nenhum arquivo de som de fora).
Uso, da raiz do repositório:
    python3 instagram/reels/audio/i12_sfx.py          # gera audio/i12-sfx.wav
    python3 instagram/reels/audio/i12_sfx.py --video  # e também o vídeo com som e a prévia

Saída: 48 kHz, estéreo, 24 bits, com a mesma duração do vídeo.
Mixagem: perto de -18 LUFS integrado, pico real abaixo de -1 dBTP (medido com o ebur128 do ffmpeg).
O ambiente (forno, cozinha, neon) é gerado em laço: o fim emenda no começo sem estalo.

Os tempos saem de instagram/reels/i12-eventos.json (escrito pela gravação), as trocas de etapa de
cenas/i12-tempos.mjs e os cortes do próprio vídeo. Se o vídeo for reeditado, é só rodar de novo.
Onde o JSON e a tela não batem, vale o que foi conferido nos quadros (CONFERIDO, abaixo).
"""
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000
AQUI = os.path.dirname(os.path.abspath(__file__))
REELS = os.path.dirname(AQUI)
WAV = os.path.join(AQUI, 'i12-sfx.wav')
VIDEO = os.path.join(REELS, 'i12-padaria-em-uso.mp4')
VIDEO_SOM = os.path.join(REELS, 'i12-padaria-em-uso-com-som.mp4')
PREVIA = os.path.join(REELS, 'previas', 'i12-com-som.mp4')
EVENTOS = os.path.join(REELS, 'i12-eventos.json')
TEMPOS_JS = os.path.join(REELS, 'cenas', 'i12-tempos.mjs')
ALVO_LUFS = -18.0
TETO_DBTP = -2.8  # margem: o AAC sobe o pico real em até ~1 dB

# ── eventos: JSON da gravação, etapas da cena e cortes do vídeo ──
with open(EVENTOS, encoding='utf-8') as fh:
    EV = json.load(fh)
DUR = float(EV['duracao'])
FPS = float(EV.get('fps', 30))
N = int(round(SR * DUR))


def evento(nome):
    """todos os tempos de um evento do JSON, em ordem"""
    return sorted(float(e['t']) for e in EV['eventos'] if e['evento'] == nome)


# Conferido nos quadros da edição de 45 s. Cada ajuste só vale enquanto o JSON tiver o valor conferido;
# se o JSON mudar, o script usa o valor novo (com a mesma distância) e avisa para conferir de novo.
CONFERIDO = {
    # o JSON marca 3,6 s (a rolagem começa a sair do lugar); na tela, o letreiro some de 4,70 a 5,53 s,
    # a mão entra em 5,33 s, a assadeira desliza de 6,27 a 7,50 s (fim do filme do forno)
    # e a placa PÃO QUENTE pisca em 6,633 s e acende em 6,733 s (regra do site sobre a rolagem gravada)
    'assadeira': (3.6, {'letreiro_sai': (4.70, 5.53), 'desliza': 6.27, 'para': 7.50,
                        'placa_pisca': 6.633, 'placa_acende': 6.733}),
    # o traço encosta no pino em 36,55 s; em 37,5 s entram o zoom e o texto "6 minutos a pé."
    'pino': (37.5, 36.55),
}


def conferido(nome, valor_json):
    ref, valor = CONFERIDO[nome]
    if abs(valor_json - ref) < 1e-6:
        return valor
    print(f'Aviso: "{nome}" mudou no JSON ({ref} → {valor_json} s). Confira os tempos nos quadros.')
    desloca = lambda v: tuple(x - ref + valor_json for x in v) if isinstance(v, tuple) else v - ref + valor_json
    return {k: desloca(v) for k, v in valor.items()} if isinstance(valor, dict) else valor_json


def etapas_da_cena():
    """começo de cada etapa (01 Ver, 02 Escolher...), lido de cenas/i12-tempos.mjs"""
    try:
        with open(TEMPOS_JS, encoding='utf-8') as fh:
            m = re.search(r'ETAPAS\s*=\s*(\[\[.*?\]\])', fh.read(), re.S)
        return [float(a) for a, b, k in json.loads(m.group(1).replace('DURACAO', str(DUR))) if float(a) > 0]
    except (OSError, AttributeError, ValueError):
        return []


def cortes_do_video():
    """cortes secos: quadros que mudam quase inteiros de um para o outro"""
    w, h = 90, 160
    bruto = subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, '-vf', f'scale={w}:{h}', '-f', 'rawvideo',
                            '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
    q = np.frombuffer(bruto, np.uint8).reshape(-1, h, w).astype(np.int16)
    dif = np.abs(np.diff(q, axis=0)).mean(axis=(1, 2))
    return [round((i + 1) / FPS, 3) for i in np.flatnonzero(dif > 18)]


FORNO = conferido('assadeira', evento('assadeira')[0])
ABA = evento('toque-aba-natal')[0]
ADICIONAR = evento('adicionar')
MAIS = evento('mais')[0]
ZAP = evento('toque-whatsapp')[0]
MENSAGEM = evento('mensagem')[0]
BALAO = MENSAGEM + 0.2          # o balão sobe de MENSAGEM + 0,2 s (cenas/i12.js, balao())
CAMINHO = evento('caminho')[0]
PINO = conferido('pino', evento('pino')[0])
CONVITE = evento('convite')[0]
VOLTA = evento('volta')[0]
CORTES = cortes_do_video()
ETAPAS = etapas_da_cena()
TROCAS = [e for e in ETAPAS if any(abs(e - c) < 1.5 / FPS for c in CORTES)]  # whoosh só onde há corte
E_ESCOLHER = ETAPAS[0] if ETAPAS else ABA - 1.0
E_FIM = TROCAS[-1] if TROCAS else CONVITE - 0.3       # volta à primeira tela (escuro + convite)
LUZES = next((c for c in CORTES if FORNO['para'] < c < E_ESCOLHER), FORNO['para'] + 2.0)  # corte para o Natal
DESCE = (ABA + 0.3, ABA + 2.9)  # depois do toque na aba, a página desce até a seção (cenas/i12-captura.mjs)
print('Cortes no vídeo:', ', '.join(f'{c:g}' for c in CORTES), '· trocas de etapa com corte:', ', '.join(f'{c:g}' for c in TROCAS))

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
    """ruído colorido periódico na duração do vídeo (emenda perfeita no loop)"""
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
amb = curva([(0, 1.0), (LUZES - 0.02, 1.0), (LUZES + 0.02, 0.8), (E_ESCOLHER - 0.02, 0.8), (E_ESCOLHER + 0.02, 0.5),
             (CAMINHO, 0.5), (E_FIM - 0.1, 0.72), (E_FIM, 0.72), (E_FIM + 0.3, 0.42), (VOLTA - 0.1, 0.42),
             (VOLTA + 0.5, 1.0), (DUR, 1.0)], TT)
ALVO_AMBIENTE = -33.0  # LUFS no começo: bem baixo, uns 15 LU abaixo dos efeitos
grave = ronco * db(-41) + zumbido * db(-45)
cama = np.stack([grave, grave]) + np.stack([ar_m + 0.35 * ar_s, ar_m - 0.35 * ar_s]) * db(-50)
cama *= db(ALVO_AMBIENTE - lufs_m(cama[:, SR:3 * SR]))
mix += cama * amb
NIVEIS['ambiente: forno + cozinha'] = ALVO_AMBIENTE
CAMADAS['ambiente: forno + cozinha'] = [f'0–{DUR:g} (laço)']

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
# letreiro: aceso desde o primeiro quadro, some com a rolagem e volta quando o escuro sai (loop)
l0, l1 = FORNO['letreiro_sai']
letreiro = np.where(TT < LUZES, 1 - suave(l0, l1, TT), 0.0)
letreiro = np.where(TT >= E_FIM, curva([(E_FIM, 1), (E_FIM + 0.3, 0), (VOLTA - 0.1, 0), (VOLTA + 0.5, 1), (DUR, 1)], TT), letreiro)
# placa PÃO QUENTE: pisca um quadro, acende de vez e sai no corte para o Natal
placa = np.zeros(N)
placa[(TT >= FORNO['placa_pisca']) & (TT < FORNO['placa_pisca'] + 1 / FPS)] = 0.8
placa[(TT >= FORNO['placa_acende']) & (TT < LUZES)] = 0.75
placa = filtrar(placa, lambda f: faixa(f, None, 120, 1))  # sem estalo nas bordas
mix += pan(neon * letreiro, -0.1)
mix += pan(neon * placa * db(-1), 0.3)
NIVEIS['neon do letreiro'] = -36.0
NIVEIS['neon da placa PÃO QUENTE'] = -37.0
CAMADAS['neon do letreiro'] = [f'0–{l1:g}', f'{VOLTA - 0.1:g}–{DUR:g} (volta)']
CAMADAS['neon da placa PÃO QUENTE'] = [f"{FORNO['placa_acende']:g}–{LUZES:g}"]


def faisca(r, dur=0.03):
    """o estalinho elétrico do neon acendendo"""
    t = eixo(dur)
    x = r.standard_normal(len(t)) * np.exp(-t / 0.006)
    x *= (r.random(len(t)) < 0.35)
    return filtrar(x, lambda f: faixa(f, 1800, 9000, 2))


r = rng()
por(pan(pico1(faisca(r)), 0.3), FORNO['placa_pisca'], -27, 'faísca da placa acendendo')
por(pan(pico1(faisca(r)), 0.3), FORNO['placa_acende'], -25, 'faísca da placa acendendo')


# ── 3. a assadeira deslizando e o pão cantando ─────────────────
def assadeira(r, t0, t1):
    dur = t1 - t0 + 0.6
    t = eixo(dur)
    # quanto a assadeira anda (medido nos quadros: começa em 7,15, mais forte de 7,3 a 7,85, para em 8,27)
    k = (t1 - t0) / 1.12  # o desenho do movimento foi medido num deslize de 1,12 s; aqui estica para o tempo real
    vel = curva([(0, 0), (0.1 * k, 0.55), (0.18 * k, 0.95), (0.45 * k, 1.0), (0.7 * k, 0.85), (0.9 * k, 0.62),
                 (1.05 * k, 0.5), (t1 - t0, 0.0), (dur, 0)], t)
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
    while pos < (t1 - t0) - 0.12:
        i = int(pos * SR)
        n = int(0.02 * SR)
        tt = np.arange(n) / SR
        f = r.uniform(2300, 4200)
        tq[i:i + n] += np.interp(pos / k, [0.12, 0.5, 1.0], [0.6, 1.0, 0.3]) * r.uniform(0.4, 1.0) * \
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
a0, a1 = FORNO['desliza'], FORNO['para']
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
p0, p1 = FORNO['para'], LUZES
por(pao_cantando(r, p0, p1), p0, -21, 'pão cantando (casca estalando)')


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
    LUZES, -15, 'brilho de sino (luzes de Natal)')
por(brilho(r, [3730, 2794], [0, 0.11], [1, 0.6]), LUZES + 2.0, -22, 'brilho de sino (lâmpadas piscando)')


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
por(clique(r), ABA, -19, 'clique (aba Natal)')
por(pop(r, 720), ADICIONAR[0], -16, 'pop (Adicionar panetone)')
por(tique(r), MAIS, -23, 'tique (+)')
por(pop(r, 860), ADICIONAR[1], -17, 'pop (Adicionar chocotone)')
por(clique(r, 1900), ZAP, -18, 'clique (Encomendar pelo WhatsApp)')


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
# com a rolagem mais lenta, o whoosh ficou mais macio: mais longo, mais aberto e 3 dB mais baixo
SUBIDA = [(700, 2800, -0.2, 0.15), (600, 3200, -0.15, 0.2)]
for k, tc in enumerate(TROCAS):
    fi, ff, pi_, pf = (1600, 450, 0.1, -0.1) if tc == E_FIM else SUBIDA[k % 2]  # o último desce para o escuro
    antes = 0.34
    por(whoosh(r, antes, 0.26, fi, ff, pi_, pf, q=1.0), tc - antes, -21, 'whoosh macio (troca de etapa)', marca=tc)


def deslize(r, t0, t1):
    """a página descendo: ar macio no ritmo da rolagem (curva suave do site)"""
    dur = t1 - t0
    t = eixo(dur)
    vel = np.sin(np.pi * t / dur) ** 2
    fc = 900 + 1500 * vel
    x = svf_bp(r.standard_normal(len(t)), fc, 0.9)
    return pan(pico1(x * vel), 0.0)


r = rng()
por(deslize(r, *DESCE), DESCE[0], -28, 'página descendo (ar macio)')


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
por(envio(r), BALAO - 0.075, -15, 'envio da mensagem (genérico)', marca=BALAO)


# ── 9. o caminho no mapa: tom subindo e o toque no pino ────────
t_m = np.arange(int((CAMINHO - 0.05) * SR), int((PINO + 0.5) * SR)) / SR
d = suave(CAMINHO, PINO, t_m)  # o quanto do caminho já foi desenhado
CHEGADA = PINO


def tom_subindo(t, d):
    f = 294 * 2 ** d  # Ré 4 → Ré 5, no ritmo do traço
    env = clamp((t - CAMINHO) / 0.25) * np.where(t < CHEGADA, 0.55 + 0.45 * d, np.exp(-(t - CHEGADA) / 0.09))
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


por(tom_subindo(t_m, d), t_m[0], -17, 'tom subindo (caminho no mapa)', marca=CAMINHO)
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
por(sininho_porta(r), CONVITE, -14, 'sininho da porta (convite)')


def volta(r):
    """ar que cresce enquanto o escuro sai e a primeira tela volta"""
    t = eixo(1.0)
    x = filtrar(r.standard_normal(len(t)), lambda f: faixa(f, 250, 3500, 2))
    env = np.where(t < 0.55, (t / 0.55) ** 3, np.exp(-(t - 0.55) / 0.12))
    return pan(pico1(x * env), 0.0)


r = rng()
por(volta(r), VOLTA - 0.45, -25, 'ar do loop voltando', marca=VOLTA)


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
