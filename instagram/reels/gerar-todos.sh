#!/usr/bin/env bash
# Gera os Reels (vídeo, capa e prévia de cada um).
# Uso, da raiz do repositório: bash instagram/reels/gerar-todos.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
M=instagram/reels/motor
C=instagram/reels/cenas
Q=instagram/reels/.quadros
# o i01 é gravado do site da MACH antes de montar
[ -f $Q/i01-site/meta.json ] || node $M/capturar.mjs $C/i01-captura.mjs
# o i03 e o i11 usam a rolagem do site-conceito da padaria, em quadros
if [ ! -f $Q/padaria-rolagem/q_00584.png ]; then
  mkdir -p $Q/padaria-rolagem
  ffmpeg -loglevel error -y -i instagram/sites-conceito/padaria/captura/rolagem-bruta.mp4 -start_number 0 $Q/padaria-rolagem/q_%05d.png
fi
# o i12 grava o site da padaria em uso (toques reais no cardápio)
[ -f $Q/i12-site/meta.json ] || node $C/i12-captura.mjs --workers 2
for r in i01 i02 i03 i04 i05 i06 i11 i12; do
  node $M/render.mjs $C/$r.js --workers 2
done
