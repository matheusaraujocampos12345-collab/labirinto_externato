#!/usr/bin/env bash
# Gera o vídeo final: quadros (Chromium headless) + trilha (Python) → MP4 H.264/AAC.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT_MP4="${OUT_MP4:-anuncio-mach-30s.mp4}"

node scripts/export-timeline.mjs
node scripts/render.mjs --out out/frames "$@"
python3 scripts/make_audio.py

ffmpeg -y -hide_banner -loglevel warning -stats \
  -framerate 30 -i out/frames/f_%04d.png \
  -i out/trilha.wav \
  -map 0:v -map 1:a \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -r 30 -g 30 \
  -c:a aac -b:a 192k -ar 48000 \
  -movflags +faststart -shortest \
  "$OUT_MP4"

echo "Vídeo pronto: $OUT_MP4"
