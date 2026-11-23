#!/usr/bin/env python3
"""Rodada 3: peças refeitas depois dos ajustes da rodada 2. Uso: python3 gerar_rodada3.py <pasta-das-previas>"""
import json, pathlib, shutil, sys
from PIL import Image
AQUI = pathlib.Path(__file__).parent; REPO = AQUI.parent.parent
PREV = pathlib.Path(sys.argv[1]); PREV.mkdir(parents=True, exist_ok=True)
base = json.loads((AQUI / 'pauta-r2.json').read_text(encoding='utf-8'))
faltando = []
def img(src, dest, larg):
    s = REPO / src
    if not s.exists(): faltando.append(src); return None
    d = PREV / dest; d.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(s).convert('RGB'); im.thumbnail((larg, larg * 2)); im.save(d, 'JPEG', quality=82, optimize=True)
    return 'previas/' + dest
def vid(src, dest):
    s = REPO / src
    if not s.exists(): faltando.append(src); return None
    d = PREV / dest; d.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(s, d); return 'previas/' + dest
def legenda(pasta):
    f = REPO / pasta / 'legenda.txt'; return f.read_text(encoding='utf-8').strip() if f.exists() else ''
R = 'instagram/reels/'
NOTA_REELS = ["Sem música: você escolhe uma no app do Instagram na hora de publicar."]
def reels(pid, dia, quadro, titulo, gancho, leg, mudou):
    return {"id": f"r3-{pid}", "numero": dia, "tipo": "reels", "quadro": quadro, "esforco": "pronto", "titulo": titulo, "gancho": gancho,
            "previa": vid(f'{R}previas/{pid}.mp4', f'r3/{pid}.mp4'), "poster": img(f'{R}{pid}-capa.jpg', f'r3/{pid}-capa.jpg', 540),
            "legenda": leg, "mudou": mudou, "roteiro": NOTA_REELS}
def posts(pid, pasta, dia, quadro, titulo, gancho, mudou, tipo):
    fs = sorted((REPO / pasta).glob('slide-*.jpg'))
    if not fs: faltando.append(pasta)
    return {"id": f"r3-{pid}", "numero": dia, "tipo": tipo, "quadro": quadro, "esforco": "pronto", "titulo": titulo, "gancho": gancho,
            "galeria": [img(str(f.relative_to(REPO)), f'r3/{pid}/{f.name}', 540) for f in fs], "legenda": legenda(pasta), "mudou": mudou,
            "roteiro": ["Sai sozinho pelo robô, se você aprovar a data."]}
ideias = [
  reels('i03', 'Qua 02/12 · 19h', 'feito-para', 'Feito para padaria (ep. 1)', 'Esse site é de uma padaria. Ninguém acredita.',
        "Padaria fictícia. Site de verdade.\nQual negócio ganha o próximo? Vota nos stories de domingo.\n\n#siteparapadaria #sitesobmedida #siteanimado",
        "Site novo (Padaria Quatro Horas): pão real saindo do forno, cardápio de verdade e Natal."),
  posts('c04', 'instagram/posts/feito-para-padaria', 'Qui 03/12 · 12h', 'feito-para', 'Padaria: as decisões por trás',
        'Por que o site da padaria conta os dias até o Natal.', "Refeito com o site novo. Ganhou um slide de Natal e a capa nova.", 'carrossel'),
  reels('i02', 'Qui 03/12 · 19h', 'template-x-sob-medida', 'O site que todo mundo tem', 'Seu concorrente tem o mesmo site que você.',
        "Seis barbearias. Seis modelos. Ninguém lembra de nenhuma.\nSeu site é o sétimo da fila?\n\n#siteparaempresa #sitesobmedida #criacaodesites",
        "Agora são seis tipos de site genérico, e não um só. A barbearia sob medida ganhou letra de letreiro (estêncil)."),
  reels('i11', 'Sáb 05/12 · 11h', 'caixa-preta', 'Do zero à primeira tela', 'Do zero à primeira tela.',
        "Do rascunho em caixas ao pão saindo do forno.\nCada etapa é uma decisão sobre quem vai usar o site.\n\n#webdesign #siteparapadaria #bastidores",
        "Refeito com as etapas do site novo da padaria."),
  posts('f01', 'instagram/posts/quadro-heroi-padaria', 'Reserva · semana 2', 'feito-para', 'Quadro-herói da padaria',
        'Isso é a primeira tela de uma padaria.', "Primeira tela do site novo, com o selo de Natal.", 'foto'),
]
rot = dict(base['rotina'])
rot['resumo'] = "Semana de 30/11 a 05/12. Antes dela, o manifesto sai hoje, 23/11, ao meio-dia, e o teaser no sábado, 28/11."
rot['semana'] = [d for d in rot['semana'] if not d['dia'].startswith('Dom 29/11')]
pauta = dict(base)
pauta.update({"rodada": "Rodada 3 · peças refeitas · 23/11/2026",
              "instrucao": "São as 5 peças que você pediu para ajustar, já refeitas. Assista, passe os slides e aprove, peça ajuste ou recuse.",
              "tituloIdeias": "Peças refeitas", "subIdeias": "Padaria nova (com Natal) e o novo \"O site que todo mundo tem\".",
              "rotina": rot, "ideias": ideias})
(AQUI / 'pauta.json').write_text(json.dumps(pauta, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(ideias), 'peças · faltando:', faltando or 'nada')
