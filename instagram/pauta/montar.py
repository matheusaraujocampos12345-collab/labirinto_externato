#!/usr/bin/env python3
"""Monta a página de aprovação: injeta pauta.json em pagina.html e grava pauta-mach.html."""
import json, pathlib
aqui = pathlib.Path(__file__).parent
dados = json.loads((aqui / 'pauta.json').read_text(encoding='utf-8'))
js = json.dumps(dados, ensure_ascii=False).replace('</', '<\\/')
html = (aqui / 'pagina.html').read_text(encoding='utf-8').replace('__PAUTA__', js)
(aqui / 'pauta-mach.html').write_text(html, encoding='utf-8')
print('pauta-mach.html:', len(html) // 1024, 'KB ·', len(dados['ideias']), 'ideias ·', len(dados.get('referencias', [])), 'referências')
