#!/usr/bin/env python3
"""Trilha sonora do anúncio, sintetizada do zero e sincronizada com out/timeline.json.

Atos 1–2: trilha genérica "de banco" (ukulele, glockenspiel, palmas) que acelera com os
cortes, distorce e some num glitch; corte seco; 1 s de silêncio absoluto.
Atos 3–4: grave e minimalista — pulsos de sub, piano esparso, pad escuro e whooshes
sutis sincronizados aos movimentos.

Uso: python3 scripts/make_audio.py [timeline.json] [saida.wav]
"""
import json
import os
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL_PATH = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'out', 'timeline.json')
OUT_PATH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'out', 'trilha.wav')

SR = 48000
DUR = 30.0
N = int(SR * DUR)
TL = json.load(open(TL_PATH))
RNG = np.random.default_rng(20261118)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def stereo():
    return np.zeros((2, N))


def place(bus, sig, t0, gain=1.0, pan=0.0):
    """Coloca um sinal mono (ou estéreo 2×n) no barramento com pan de potência constante."""
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        th = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)
    n = sig.shape[1]
    a, b = max(0, i0), min(N, i0 + n)
    if b <= a:
        return
    bus[:, a:b] += gain * sig[:, a - i0:b - i0]


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def fft_filter(x, lo=None, hi=None, order=2):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    H = np.ones_like(f)
    if lo:
        H *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    if hi:
        H *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * H, n)


def svf_sweep(x, f0, f1, q=1.2, mode='bp', curve=1.0):
    """Filtro de estado variável com frequência de corte varrendo f0→f1 (exponencial)."""
    n = len(x)
    pos = (np.arange(n) / max(1, n - 1)) ** curve
    fc = f0 * (f1 / f0) ** pos
    g = np.tan(np.pi * np.minimum(fc, SR * 0.45) / SR)
    k = 1 / q
    out = np.zeros(n)
    ic1 = ic2 = 0.0
    for i in range(n):
        gi = g[i]
        a1 = 1 / (1 + gi * (gi + k))
        v3 = x[i] - ic2
        v1 = a1 * ic1 + gi * a1 * v3
        v2 = ic2 + gi * v1
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1 if mode == 'bp' else (v2 if mode == 'lp' else x[i] - k * v1 - v2)
    return out


def env_ad(n, a, d_tau):
    t = np.arange(n) / SR
    e = np.exp(-t / d_tau)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


# ─────────────────────────────── instrumentos do Ato 1 ───────────────────────────────

def ks_pluck(freq, dur=0.9, decay=0.994, bright=0.7, seed=0):
    n = int(dur * SR)
    P = max(2, int(round(SR / freq)))
    r = np.random.default_rng(seed)
    y = np.zeros(n + P + 2)
    ex = r.uniform(-1, 1, P)
    for _ in range(int(round((1 - bright) * 5))):
        ex = 0.5 * (ex + np.roll(ex, 1))
    y[:P] = ex
    y[P] = decay * 0.5 * y[0]
    i = P + 1
    L = len(y)
    while i < L:
        j = min(i + P, L)
        y[i:j] = decay * 0.5 * (y[i - P:j - P] + y[i - P - 1:j - P - 1])
        i = j
    out = y[P:P + n]
    out *= np.minimum(1, (n - np.arange(n)) / (0.02 * SR))
    return out


def glock(freq, dur=1.1):
    t = tt(dur)
    s = (np.sin(2 * np.pi * freq * t) * np.exp(-t * 3.2)
         + 0.42 * np.sin(2 * np.pi * 2.756 * freq * t) * np.exp(-t * 8)
         + 0.2 * np.sin(2 * np.pi * 5.404 * freq * t) * np.exp(-t * 16)
         + 0.08 * np.sin(2 * np.pi * 8.933 * freq * t) * np.exp(-t * 28))
    return s * np.minimum(1, t / 0.0012)


def kick():
    t = tt(0.4)
    f = 46 + 120 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8.5)
    s += 0.25 * RNG.uniform(-1, 1, len(t)) * np.exp(-t * 500)
    return np.tanh(1.6 * s)


def clap():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    noise = RNG.uniform(-1, 1, n)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.009, 0.018, 0.027]):
        tt_ = np.clip(t - off, 0, None)
        e += (t >= off) * np.exp(-tt_ * (170 if k < 3 else 20)) * (1 if k < 3 else 0.7)
    return fft_filter(noise * e, lo=900, hi=3200) * 1.6


def hat(dur=0.06, tau=0.018):
    n = int(dur * SR)
    return fft_filter(RNG.uniform(-1, 1, n), lo=7000) * env_ad(n, 0.0005, tau)


def bass(freq, dur=0.45):
    t = tt(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sin(6 * np.pi * freq * t)
    return s * env_ad(len(t), 0.004, 0.22) * np.minimum(1, (len(t) - np.arange(len(t))) / 400)


def key_click(gain=1.0, heavy=False):
    n = int((0.05 if heavy else 0.025) * SR)
    t = np.arange(n) / SR
    s = fft_filter(RNG.uniform(-1, 1, n), lo=1800, hi=9000) * np.exp(-t * (180 if heavy else 320))
    s += (0.9 if heavy else 0.4) * np.sin(2 * np.pi * (120 if heavy else 210) * t) * np.exp(-t * 90)
    return s * gain


def whoosh(dur, f0, f1, q=0.9, curve=1.0, attack=0.35, seed=None):
    n = int(dur * SR)
    noise = (np.random.default_rng(seed) if seed is not None else RNG).uniform(-1, 1, n)
    s = svf_sweep(noise, f0, f1, q=q, curve=curve)
    pos = np.arange(n) / n
    e = np.where(pos < attack, (pos / attack) ** 2, ((1 - pos) / (1 - attack)) ** 1.6)
    return s * e


# acordes (ukulele, afinação reentrante) e melodia de glockenspiel
UKE = {
    'C': [67, 60, 64, 72],
    'G': [67, 62, 67, 71],
    'Am': [69, 60, 64, 69],
    'F': [69, 60, 65, 69],
}
PROG = ['C', 'G', 'Am', 'F']
ROOT_ = {'C': 36, 'G': 43, 'Am': 45, 'F': 41}
MEL = {
    'C': [84, None, 79, None, 76, 79, 81, 79],
    'G': [83, None, 79, None, 74, 79, 81, 79],
    'Am': [84, None, 81, None, 76, 81, 83, 81],
    'F': [81, None, 77, None, 72, 77, 79, 76],
}
STRUM = ['D', None, 'D', 'U', None, 'U', 'D', 'U']


def build_act1():
    music = stereo()
    sfx = stereo()
    t_down = TL['sitesStart']
    t_glitch = TL['glitchStart']
    bpm0, bpm1 = 112.0, 192.0

    def bpm_at(t):
        if t < t_down:
            return bpm0
        x = min(1.0, (t - t_down) / (t_glitch - t_down))
        return bpm0 + (bpm1 - bpm0) * x ** 1.5

    def pitch_at(t):
        if t < t_down:
            return 1.0
        x = min(1.0, (t - t_down) / (t_glitch - t_down))
        return 2 ** (2.2 * x ** 2.2 / 12)

    # grade de colcheias: introdução (para trás a partir do 1º tempo) + parte principal
    events = []
    step0 = 30.0 / bpm0
    k = 1
    while t_down - k * step0 > 0.05:
        events.append((t_down - k * step0, -k))
        k += 1
    events.reverse()
    t = t_down
    idx = 0
    while t < t_glitch + 0.25:
        events.append((t, idx))
        t += 30.0 / bpm_at(t)
        idx += 1

    seed = 1
    for (t, i) in events:
        intro = i < 0
        pos8 = i % 8
        bar = (i // 8) % 4 if i >= 0 else 0
        chord = PROG[bar]
        p = pitch_at(t)
        # ukulele
        s = STRUM[pos8]
        if s and (not intro or t > 0.15):
            notes = UKE['C' if intro else chord]
            order = notes if s == 'D' else notes[::-1]
            g = (0.32 if s == 'D' else 0.22) * (0.55 if intro else 1.0)
            for j, m in enumerate(order):
                seed += 1
                place(music, ks_pluck(midi(m) * p, 0.7, 0.993, 0.75, seed), t + j * 0.007, g, pan=-0.25 + j * 0.06)
        if intro:
            continue
        # glockenspiel
        m = MEL[chord][pos8]
        if m is not None:
            place(music, glock(midi(m) * p), t, 0.16, pan=0.3)
        # bateria
        if pos8 in (0, 4):
            place(music, kick(), t, 0.85)
            place(music, bass(midi(ROOT_[chord]) * p), t, 0.42)
        if pos8 == 3:
            place(music, bass(midi(ROOT_[chord] + 7) * p, 0.3), t, 0.3)
        if pos8 in (2, 6):
            place(music, clap(), t, 0.42, pan=0.05)
        place(music, hat(), t, 0.12 if pos8 % 2 else 0.2, pan=0.4)
        place(music, hat(0.04, 0.01), t + 15.0 / bpm_at(t), 0.07, pan=0.45)

    # prato de "abertura" no primeiro site + subida
    n = int(1.6 * SR)
    crash = fft_filter(RNG.uniform(-1, 1, n), lo=4500) * env_ad(n, 0.002, 0.45)
    place(music, crash, t_down, 0.22, pan=-0.2)
    place(sfx, whoosh(0.42, 300, 6000, q=0.8, curve=0.6, attack=0.9), t_down - 0.4, 0.28)

    # cliques: mouse, teclas, Enter
    place(sfx, key_click(0.5), TL['clickT'], 0.6, pan=0.1)
    place(sfx, key_click(0.35), TL['clickT'] + 0.07, 0.6, pan=0.1)
    for j, kt in enumerate(TL['keyTimes']):
        place(sfx, key_click(0.55 + 0.25 * RNG.random()), kt, 0.55, pan=-0.15 + 0.3 * RNG.random())
    place(sfx, key_click(1.0, heavy=True), TL['enterT'], 0.75)

    # whooshes dos cortes (whip pan / slide)
    for c in TL['cuts'][1:]:
        d = max(0.12, min(0.3, c['dur'] * 0.6))
        pan = {'whipL': 0.6, 'whipR': -0.6}.get(c['trans'], 0.0)
        w = whoosh(d, 5000, 500, q=0.9, curve=0.8, attack=0.25)
        if c['trans'] in ('whipL', 'whipR'):
            # pan que acompanha o movimento
            th = np.linspace(pan, -pan, len(w))
            st = np.vstack([w * np.cos((th + 1) * np.pi / 4), w * np.sin((th + 1) * np.pi / 4)]) * np.sqrt(2)
            place(sfx, st, c['t'] - d * 0.25, 0.33)
        else:
            place(sfx, w, c['t'] - d * 0.25, 0.3)

    return music, sfx


def degrade(music):
    """Distorção crescente + bitcrush + oscilação de fita conforme acelera."""
    t = np.arange(N) / SR
    t0, t1 = 9.4, TL['glitchStart']
    x = np.clip((t - t0) / (t1 - t0), 0, 1)
    # oscilação de fita (wow)
    depth = 0.0035 * x ** 1.5
    idx = np.arange(N) + depth * SR * np.sin(2 * np.pi * 5.5 * t)
    for ch in range(2):
        music[ch] = np.interp(idx, np.arange(N), music[ch])
    # saturação
    drive = 1 + 5 * x ** 1.3
    music = np.tanh(music * drive) / np.tanh(drive) * (0.75 + 0.25 / drive)
    # sample-and-hold por blocos
    blk = int(0.05 * SR)
    for a in range(int(t0 * SR), int(t1 * SR) + int(0.3 * SR), blk):
        xx = min(1, max(0, (a / SR - t0) / (t1 - t0)))
        k = 1 + int(round(5 * xx ** 1.4))
        if k > 1:
            seg = music[:, a:a + blk]
            ii = (np.arange(seg.shape[1]) // k) * k
            music[:, a:a + blk] = seg[:, ii]
    # bitcrush
    bits = 16 - 10 * x ** 1.6
    q = 2 ** (bits - 1)
    music = np.round(music * q) / q
    return music


def glitch_section(music):
    """Gagueira digital, ruído e bipes até o corte seco."""
    a = TL['glitchStart']
    b = TL['blackStart']
    g = stereo()
    src = music[:, int((a - 0.24) * SR):int(a * SR)].copy()
    pos = a
    lens = [0.09, 0.09, 0.07, 0.06, 0.05, 0.045, 0.04, 0.035, 0.03, 0.03, 0.025, 0.02, 0.02, 0.018, 0.015,
            0.015, 0.012, 0.012, 0.01, 0.01, 0.01, 0.008, 0.008, 0.008, 0.006, 0.006, 0.006]
    k = 0
    while pos < b:
        L = lens[min(k, len(lens) - 1)]
        n = int(L * SR)
        off = int(RNG.random() * (src.shape[1] - n - 1))
        chunk = src[:, off:off + n].copy()
        r = RNG.random()
        if r < 0.35:  # repitch
            fac = RNG.choice([0.5, 0.75, 1.5, 2.0])
            ii = np.clip((np.arange(n) * fac).astype(int), 0, n - 1)
            chunk = chunk[:, ii]
        elif r < 0.55:  # ruído digital "sample-hold"
            hold = int(RNG.integers(4, 40))
            nz = RNG.uniform(-1, 1, n // hold + 1).repeat(hold)[:n]
            chunk = np.vstack([nz, nz]) * 0.6
        elif r < 0.7:  # bipe de dados
            f = RNG.uniform(700, 4200)
            sq = np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.35
            chunk = np.vstack([sq, sq])
        crush = 2 ** RNG.integers(2, 5)
        chunk = np.round(chunk * crush) / crush
        chunk *= np.minimum(1, (n - np.arange(n)) / 30)
        place(g, chunk, pos, 0.9 * (0.7 + 0.3 * RNG.random()))
        pos += L
        k += 1
    # zumbido grave de "travamento"
    n = int((b - a) * SR)
    tb = np.arange(n) / SR
    buzz = np.sign(np.sin(2 * np.pi * 55 * tb)) * 0.18 * np.linspace(0.3, 1, n)
    place(g, buzz, a, 1.0)
    # corte seco
    ib = int(b * SR)
    g[:, ib:] = 0
    fade = int(0.002 * SR)
    g[:, ib - fade:ib] *= np.linspace(1, 0, fade)
    return g


# ─────────────────────────────── instrumentos dos Atos 3–4 ───────────────────────────

def piano(freq, dur=4.0, vel=1.0):
    t = tt(dur)
    s = np.zeros_like(t)
    B = 0.00035
    for nh in range(1, 11):
        fn = freq * nh * np.sqrt(1 + B * nh * nh)
        if fn > 12000:
            break
        amp = (1 / nh ** 1.25) * (1 if nh > 1 else 1.2) * (0.6 + 0.4 * vel ** (nh * 0.5))
        tau = 3.2 / (1 + 0.55 * (nh - 1)) * (220 / max(freq, 110)) ** 0.35
        for det in (-0.0004, 0.0004):
            s += 0.5 * amp * np.sin(2 * np.pi * fn * (1 + det) * t + nh) * np.exp(-t / tau)
    ham = fft_filter(RNG.uniform(-1, 1, len(t)), hi=2500) * np.exp(-t * 120) * 0.08
    s = (s + ham) * np.minimum(1, t / 0.003)
    s *= np.minimum(1, (len(t) - np.arange(len(t))) / (0.3 * SR))
    return s * vel


def sub_pulse(f=36.71, dur=1.4, strong=1.0):
    t = tt(dur)
    fr = f * (1 + 1.2 * np.exp(-t * 35))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    s = np.sin(ph) + 0.55 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph)
    s = np.tanh(1.8 * s) * env_ad(len(t), 0.01, 0.42 * strong)
    return s


def pad(notes, dur, cutoff=650):
    t = tt(dur)
    s = np.zeros_like(t)
    for m in notes:
        f = midi(m)
        for det in (-0.006, 0.0, 0.0065):
            ph = (f * (1 + det) * t + RNG.random()) % 1.0
            s += 2 * ph - 1
    s = fft_filter(s, hi=cutoff, order=2) / (len(notes) * 3)
    n = len(t)
    a, r = int(1.2 * SR), int(1.5 * SR)
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[-r:] *= np.linspace(1, 0, r) ** 2
    return s * e


def soft_whoosh(dur, f0=250, f1=2600, gain=1.0, seed=None):
    w = whoosh(dur, f0, f1, q=0.7, curve=0.7, attack=0.55, seed=seed)
    w2 = whoosh(dur, f0 * 0.7, f1 * 0.8, q=0.7, curve=0.7, attack=0.55, seed=(seed or 0) + 99)
    n = len(w)
    th = np.linspace(-0.5, 0.5, n)
    st = np.vstack([w * np.cos((th + 1) * np.pi / 4), w2 * np.sin((th + 1) * np.pi / 4)]) * np.sqrt(2)
    return st * gain


def make_ir(rt=2.8, pre=0.02):
    n = int(rt * 1.2 * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n + int(pre * SR)))
    for ch in range(2):
        noise = np.random.default_rng(100 + ch).uniform(-1, 1, n)
        dark = fft_filter(noise, hi=2800)
        mix = np.exp(-t * 2.0)  # o brilho cai mais rápido que o corpo
        tail = (noise * mix + dark * (1 - mix)) * np.exp(-t * 6.9 / rt)
        ir[ch, int(pre * SR):] = tail
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


def convolve(x, ir):
    n = x.shape[1] + ir.shape[1] - 1
    nf = 1 << (n - 1).bit_length()
    out = np.zeros((2, N))
    for ch in range(2):
        y = np.fft.irfft(np.fft.rfft(x[ch], nf) * np.fft.rfft(ir[ch], nf), nf)[:N]
        out[ch] = y
    return out


def build_premium():
    A3, A4 = TL['a3'], TL['a4']
    dry = stereo()
    send = stereo()  # o que vai para o reverb

    def both(sig, t0, gain, pan=0.0, wet=0.6):
        place(dry, sig, t0, gain, pan)
        place(send, sig, t0, gain * wet, pan)

    # nota grave sob "E se o seu fosse diferente?"
    rev = TL['revealStart']
    both(piano(midi(38), 4.5, 0.55), rev + 0.03, 0.11, -0.1, 0.9)
    both(piano(midi(50), 4.5, 0.45), rev + 0.03, 0.09, 0.1, 0.9)
    # ar subindo para o Ato 3
    place(send, soft_whoosh(1.1, 200, 1800, 1.0, seed=1), 15.0, 0.1)
    place(dry, soft_whoosh(0.8, 300, 2400, 1.0, seed=2), A3['lightIn'] - 0.25, 0.06)

    # pulsos de sub (75 bpm) — "batimento" do Ato 3
    beat = 0.8
    t = A3['lightIn']
    k = 0
    while t < A4['lines'] - 0.05:
        strong = 1.0 if k % 2 == 0 else 0.6
        place(dry, sub_pulse(36.71 if t < 21.7 else 29.14, 1.3, strong), t, 0.36 * strong)
        t += beat
        k += 1

    # pad escuro: Dm → Bb → Dm(9)
    both(pad([38, 45, 53], A3['word2'] - A3['lightIn'] + 1.2, 600), A3['lightIn'], 0.085, 0, 0.7)
    both(pad([34, 41, 50], A4['lock'] - A3['word2'] + 0.8, 700), A3['word2'] - 0.35, 0.08, 0, 0.7)
    both(pad([38, 45, 52, 57], DUR - A4['lock'] + 0.2, 900), A4['lock'] - 0.1, 0.1, 0, 0.8)

    # piano esparso
    notes = [
        (A3['word1'] - 0.1, [62, 57], 0.75),
        (17.7, [65], 0.55),
        (A3['phoneIn'] + 0.05, [64, 60], 0.65),
        (19.25, [69], 0.5),
        (20.05, [67], 0.45),
        (A3['macro'] + 0.6, [72], 0.4),
        (A3['word2'], [58, 65, 69], 0.7),
        (A3['numbers'] + 0.05, [74], 0.45),
        (23.35, [72], 0.4),
        (24.15, [69], 0.4),
    ]
    for (t0, ms, v) in notes:
        for j, m in enumerate(ms):
            both(piano(midi(m), 4.5, v), t0 + j * 0.012, 0.16, -0.2 + 0.2 * j, 0.75)

    # whooshes sutis sincronizados aos movimentos
    cues = [
        (A3['word1'] - 0.15, 1.1, 300, 3000, 0.16),
        (A3['textOut'] - 0.1, 1.0, 350, 2500, 0.12),
        (A3['phoneIn'] - 0.05, 1.4, 180, 2200, 0.2),
        (A3['macro'] + 0.05, 1.5, 200, 1800, 0.17),
        (A3['rack'] - 0.1, 1.0, 300, 2600, 0.14),
        (A3['word2'] + 0.05, 1.0, 300, 3000, 0.12),
        (A3['end'] - 0.15, 0.9, 400, 2000, 0.1),
    ]
    for i, (t0, d, f0, f1, g) in enumerate(cues):
        w = soft_whoosh(d, f0, f1, 1.0, seed=10 + i)
        place(dry, w, t0, g)
        place(send, w, t0, g * 0.6)

    # tiques muito discretos dos números contando
    st = A3['numbers'] + 0.05
    last = -1
    for i in range(400):
        tt_ = st + i * 0.005
        c = 1 - 2 ** (-10 * min(1, (tt_ - st) / 1.7))
        v = int(round(60 * c))
        if v != last and v % 3 == 0:
            n = int(0.012 * SR)
            click = fft_filter(RNG.uniform(-1, 1, n), lo=3000) * np.exp(-np.arange(n) / SR * 600)
            place(dry, click, tt_, 0.05 * (1 - 0.6 * c), pan=0.2 * np.sin(i))
        last = v

    # Ato 4: subida (linhas convergindo) → impacto grave no encaixe do logo
    rise = int((A4['lock'] - A4['lines']) * SR)
    tr = np.arange(rise) / SR
    shimmer = np.zeros(rise)
    for m in (74, 81, 86, 93):
        f = midi(m) * (1 + 0.003 * np.sin(2 * np.pi * 5 * tr))
        shimmer += np.sin(2 * np.pi * np.cumsum(f) / SR)
    shimmer *= (tr / tr[-1]) ** 2.2 * 0.06
    rn = svf_sweep(RNG.uniform(-1, 1, rise), 200, 5000, q=1.0, curve=1.6) * (tr / tr[-1]) ** 2 * 0.5
    both(shimmer + rn, A4['lines'], 0.55, 0, 0.8)
    # impacto
    t = tt(3.5)
    f = 30 + 60 * np.exp(-t * 18)
    boom = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 1.3)
    boom += fft_filter(RNG.uniform(-1, 1, len(t)), hi=900) * np.exp(-t * 6) * 0.4
    both(boom, A4['lock'], 0.5, 0, 0.35)
    for j, m in enumerate([38, 45, 53, 57, 64]):
        both(piano(midi(m), 3.8, 0.7), A4['lock'] + j * 0.018, 0.14, -0.3 + 0.15 * j, 0.85)
    # estrondo sônico: onda N dupla (dois estalos secos)
    for k, dt in enumerate([0.0, 0.11]):
        n = int(0.12 * SR)
        tn = np.arange(n) / SR
        crack = fft_filter(RNG.uniform(-1, 1, n), lo=50, hi=3800) * np.exp(-tn * 48)
        thump = np.sin(2 * np.pi * 52 * tn) * np.exp(-tn * 20)
        both(np.tanh(1.6 * (0.9 * crack + thump)), A4['lock'] + dt, 0.42 if k == 0 else 0.3, 0, 0.55)
    # diamantes de choque acendendo (pós-combustão)
    for k in range(3):
        n = int(0.32 * SR)
        tn = np.arange(n) / SR
        fw = svf_sweep(RNG.uniform(-1, 1, n), 2400, 300, q=0.9, curve=0.6) * np.exp(-tn * 9)
        place(dry, fw, A4['diamonds'] + k * 0.12, 0.13 * (1 - 0.25 * k), pan=-0.1 + 0.1 * k)
        place(send, fw, A4['diamonds'] + k * 0.12, 0.06)
    both(piano(midi(76), 3.5, 0.45), A4['tagline'] + 0.05, 0.1, 0.2, 0.9)
    both(piano(midi(81), 3.0, 0.35), A4['handles'] + 0.05, 0.08, -0.2, 0.9)
    place(dry, soft_whoosh(0.9, 400, 3000, 1.0, seed=40), A4['tagline'] - 0.1, 0.08)

    wet = convolve(send, make_ir(3.0))
    return dry + wet * 0.55


def main():
    music, sfx = build_act1()
    music = degrade(music)
    gl = glitch_section(music)
    # Atos 1–2 terminam no corte seco
    ib = int(TL['glitchStart'] * SR)
    music[:, ib:] = 0
    sfx[:, int(TL['blackStart'] * SR):] = 0
    small = convolve(music, make_ir(0.6, 0.008))
    act12 = music + 0.12 * small
    act12[:, int(TL['blackStart'] * SR):] = 0
    act12 += sfx + gl

    prem = build_premium()
    # silêncio absoluto de 1 s após o corte
    a, b = int(TL['blackStart'] * SR), int(TL['revealStart'] * SR)
    prem[:, a:b] = 0
    # pequeno fade-in após o silêncio (evita clique)
    f = int(0.004 * SR)
    prem[:, b:b + f] *= np.linspace(0, 1, f)

    # Ato 3 bem mais baixo que o Ato 1 (contraste); Ato 4 ganha um pouco de presença
    tg = np.arange(N) / SR
    pg = 0.6 + 0.14 * np.clip((tg - TL['a4']['lines']) / (TL['a4']['lock'] - TL['a4']['lines']), 0, 1)
    mix = 0.78 * act12 + prem * pg
    mix[:, a:b] = 0
    # limitador suave e normalização (−1 dBFS)
    peak = np.max(np.abs(mix))
    mix = mix / peak * 1.25
    mix = np.tanh(mix) / np.tanh(1.25)
    mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
    mix[:, a:b] = 0
    # fade final
    fo = int(0.5 * SR)
    mix[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5

    def rms_db(t0, t1):
        seg = mix[:, int(t0 * SR):int(t1 * SR)]
        return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)

    print(f'RMS ato1 (2.5–12.9 s): {rms_db(2.5, 12.9):.1f} dBFS')
    print(f'RMS silêncio (13.7–14.6 s): {rms_db(13.7, 14.6):.1f} dBFS')
    print(f'RMS ato3 (16–25 s): {rms_db(16, 25):.1f} dBFS')
    print(f'RMS ato4 (25–30 s): {rms_db(25, 30):.1f} dBFS')

    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with wave.open(OUT_PATH, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print('trilha →', OUT_PATH)


if __name__ == '__main__':
    main()
