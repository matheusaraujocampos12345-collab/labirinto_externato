"""Narração por voz de IA (Piper, offline) para os Reels.

Lê um roteiro JSON, fala cada linha, monta a faixa de áudio com as pausas e salva:
  voz.wav        a narração inteira
  linhas.json    início e fim de cada linha e os pedaços da legenda (1 a 2 palavras) com o tempo de cada um
  boca.json      abertura da boca do boneco por quadro (0 a 1), tirada do volume da voz

Uso:
  python3 instagram/reels/voz/narrar.py <roteiro.json> <modelo.onnx> <pasta de saída> [velocidade]

Roteiro: {"fps": 30, "inicio": 0.35, "fim": 1.2,
          "linhas": [{"texto": "o que aparece na legenda", "fala": "como a voz deve ler", "destaque": "palavra",
                      "pausa": 0.25, "secao": true}]}
"fala" é opcional: serve para ajustar a pronúncia (ex.: "sáite" para "site").
Vozes: https://huggingface.co/rhasspy/piper-voices (pt_BR: faber, cadu, jeff, edresson). Os modelos não ficam no repositório.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig


def pedacos(texto):
    """quebra a legenda em pedaços de 1 ou 2 palavras (palavras curtas andam juntas)"""
    palavras = texto.split()
    saida, i = [], 0
    while i < len(palavras):
        p = palavras[i]
        if i + 1 < len(palavras) and (len(p) <= 3 or len(palavras[i + 1]) <= 3) and len(p) + len(palavras[i + 1]) <= 13:
            saida.append(p + " " + palavras[i + 1])
            i += 2
        else:
            saida.append(p)
            i += 1
    return saida


def main():
    roteiro = json.load(open(sys.argv[1], encoding="utf-8"))
    modelo = sys.argv[2]
    saida = Path(sys.argv[3])
    velocidade = float(sys.argv[4]) if len(sys.argv) > 4 else 0.92
    saida.mkdir(parents=True, exist_ok=True)
    voz = PiperVoice.load(modelo)
    cfg = SynthesisConfig(length_scale=velocidade, noise_scale=0.6, noise_w_scale=0.7)
    sr = voz.config.sample_rate
    fps = roteiro.get("fps", 30)

    trilha = [np.zeros(int(roteiro.get("inicio", 0.35) * sr), dtype=np.int16)]
    t = roteiro.get("inicio", 0.35)
    linhas = []
    for ln in roteiro["linhas"]:
        if ln.get("secao") and linhas:
            # troca de parte: respiro maior (a fumaça passa aqui)
            pausa = int(0.35 * sr)
            trilha.append(np.zeros(pausa, dtype=np.int16))
            t += 0.35
        audio = np.concatenate([c.audio_int16_array for c in voz.synthesize(ln.get("fala", ln["texto"]), syn_config=cfg)])
        # corta silêncio do começo e do fim da fala
        nivel = np.abs(audio.astype(np.int32))
        ativo = np.where(nivel > 600)[0]
        if len(ativo):
            audio = audio[max(0, ativo[0] - int(0.02 * sr)): ativo[-1] + int(0.05 * sr)]
        dur = len(audio) / sr
        trechos = pedacos(ln["texto"])
        # tempo de cada pedaço proporcional ao número de letras
        pesos = [len(p) + 2 for p in trechos]
        total = sum(pesos)
        acc, chunks = 0, []
        for p, w in zip(trechos, pesos):
            chunks.append({"t": round(t + dur * acc / total, 3), "texto": p})
            acc += w
        linhas.append({"texto": ln["texto"], "ini": round(t, 3), "fim": round(t + dur, 3), "destaque": ln.get("destaque"), "secao": bool(ln.get("secao")), "pedacos": chunks})
        trilha.append(audio)
        t += dur
        pausa = ln.get("pausa", 0.25)
        trilha.append(np.zeros(int(pausa * sr), dtype=np.int16))
        t += pausa
    trilha.append(np.zeros(int(roteiro.get("fim", 1.2) * sr), dtype=np.int16))
    t += roteiro.get("fim", 1.2)
    audio = np.concatenate(trilha)

    with wave.open(str(saida / "voz.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(audio.tobytes())

    # boca: volume (RMS) por quadro, suavizado e normalizado
    passo = sr / fps
    n = int(len(audio) / passo) + 1
    rms = np.array([np.sqrt(np.mean(audio[int(i * passo): int((i + 1) * passo)].astype(np.float64) ** 2)) if int(i * passo) < len(audio) else 0 for i in range(n)])
    ref = np.percentile(rms[rms > 0], 95) if np.any(rms > 0) else 1
    boca = np.clip(rms / ref, 0, 1)
    boca = np.convolve(boca, [0.25, 0.5, 0.25], mode="same")
    json.dump([round(float(b), 3) for b in boca], open(saida / "boca.json", "w"))
    json.dump({"duracao": round(t, 3), "fps": fps, "linhas": linhas}, open(saida / "linhas.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"voz.wav: {t:.2f} s · {len(linhas)} linhas")


if __name__ == "__main__":
    main()
