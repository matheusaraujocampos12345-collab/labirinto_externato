#!/usr/bin/env python3
"""Rodada 2: peças prontas da semana 1 para aprovação.
Gera pauta.json (rodada atual) e as prévias leves em PREVIAS (padrão: scratchpad passado como argumento).
Uso: python3 gerar_rodada2.py <pasta-das-previas>
"""
import json, pathlib, shutil, sys
from PIL import Image

AQUI = pathlib.Path(__file__).parent
REPO = AQUI.parent.parent
PREV = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / 'previas'
PREV.mkdir(parents=True, exist_ok=True)
r1 = json.loads((AQUI / 'pauta-r1.json').read_text(encoding='utf-8'))
faltando = []

def img(src, dest, largura):
    s = REPO / src
    if not s.exists():
        faltando.append(src); return None
    d = PREV / dest
    d.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(s).convert('RGB')
    im.thumbnail((largura, largura * 2))
    im.save(d, 'JPEG', quality=82, optimize=True)
    return 'previas/' + dest

def vid(src, dest):
    s = REPO / src
    if not s.exists():
        faltando.append(src); return None
    d = PREV / dest
    d.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(s, d)
    return 'previas/' + dest

def slides(pasta, prefixo):
    fs = sorted((REPO / pasta).glob('slide-*.jpg'))
    if not fs: faltando.append(pasta)
    return [img(str(f.relative_to(REPO)), f'{prefixo}/{f.name}', 540) for f in fs]

def legenda(pasta):
    f = REPO / pasta / 'legenda.txt'
    return f.read_text(encoding='utf-8').strip() if f.exists() else ''

R = 'instagram/reels/'
def reels(pid, arq, dia, quadro, titulo, gancho, leg, mudou=None):
    return {"id": f"p-{pid}", "numero": dia, "tipo": "reels", "quadro": quadro, "esforco": "pronto",
            "titulo": titulo, "gancho": gancho,
            "previa": vid(f'{R}previas/{pid}.mp4', f'{pid}.mp4'),
            "poster": img(f'{R}{pid}-capa.jpg', f'{pid}-capa.jpg', 540),
            "legenda": leg, "mudou": mudou,
            "roteiro": ["Sem música: você escolhe uma no app do Instagram na hora de publicar.", "Os cortes funcionam em qualquer música de ritmo médio."]}

def carrossel(pid, pasta, dia, quadro, titulo, gancho, mudou=None, tipo='carrossel'):
    return {"id": f"p-{pid}", "numero": dia, "tipo": tipo, "quadro": quadro, "esforco": "pronto",
            "titulo": titulo, "gancho": gancho, "galeria": slides(pasta, pid),
            "legenda": legenda(pasta), "mudou": mudou,
            "roteiro": ["Sai sozinho pela publicação automática quando o GitHub estiver ligado.", "Se quiser música, eu deixo no modo manual e você escolhe no app."]}

ideias = [
  carrossel('c01', 'instagram/posts/raio-x-primeira-tela', 'Seg 30/11 · 12h', 'raio-x', 'Raio-X de uma primeira tela', 'O que seu site diz nos primeiros segundos.'),
  reels('i04', 'i04-caixa-preta-1', 'Seg 30/11 · 19h', 'caixa-preta', 'Caixa-preta #1', 'Esse efeito está nos sites mais premiados do mundo. Abrimos a caixa-preta.',
        "Um efeito, três camadas e um motivo: o cliente lê no ritmo dele.\nQual efeito a gente abre na próxima?\n\n#siteanimado #webdesign #siteparaempresa"),
  reels('i01', 'i01-isso-nao-e-video', 'Ter 01/12 · 12h', 'isso-e-um-site', 'Isso não é vídeo', 'Isso não é vídeo. É um site.',
        "Isso é um site rodando no celular.\nComenta SITE que eu te mostro como ficaria o seu.\n\n#siteanimado #criacaodesites #siteparaempresa"),
  carrossel('c02', 'instagram/posts/checklist-contratar-site', 'Ter 01/12 · 19h', 'pra-salvar', 'Checklist antes de contratar', '8 perguntas antes de contratar um site.'),
  reels('i05', 'i05-em-30-segundos-parallax', 'Qua 02/12 · 12h', 'em-30-segundos', 'Em 30 segundos: parallax', 'Parallax. Você já viu. Só não sabia o nome.',
        "Parallax: camadas em velocidades diferentes. Dá profundidade sem pesar o site.\nQual termo eu explico na próxima?\n\n#webdesign #siteanimado #designdesites"),
  reels('i03', 'i03-feito-para-padaria', 'Qua 02/12 · 19h', 'feito-para', 'Feito para padaria (ep. 1)', 'Esse site é de uma padaria. Ninguém acredita.',
        "Padaria fictícia. Site de verdade.\nQual negócio ganha o próximo? Vota nos stories de domingo.\n\n#siteparapadaria #sitesobmedida #siteanimado"),
  carrossel('c04', 'instagram/posts/feito-para-padaria', 'Qui 03/12 · 12h', 'feito-para', 'Padaria: as decisões por trás', 'Por que o site da padaria tem um relógio de fornada.'),
  reels('i02', 'i02-o-site-que-todo-mundo-tem', 'Qui 03/12 · 19h', 'template-x-sob-medida', 'O site que todo mundo tem', 'Seu concorrente tem o mesmo site que você.',
        "Três barbearias. Um template. Ninguém lembra de nenhuma.\nSeu site é o quarto da fila?\n\n#siteparaempresa #sitesobmedida #criacaodesites"),
  reels('i06', 'i06-1-segundo-30-quadros', 'Sex 04/12 · 12h', 'isso-e-um-site', '1 segundo, 30 quadros', 'Um segundo de animação tem 30 desenhos. Olha um por um.',
        "Um segundo. Trinta quadros. Nenhum deles por acaso.\nÉ esse o cuidado que vai no seu site.\n\n#motiondesign #siteanimado #webdesign"),
  carrossel('c03', 'instagram/posts/mito-animacao-lenta', 'Sex 04/12 · 19h', 'pra-salvar', 'Mito ou verdade', 'Animação deixa o site lento?'),
  reels('i11', 'i11-do-zero-a-primeira-tela', 'Sáb 05/12 · 11h', 'caixa-preta', 'Do zero à primeira tela', 'Do zero à primeira tela.',
        "Do rascunho em caixas ao pão saindo do forno.\nCada etapa é uma decisão sobre o cliente de quem vai usar o site.\n\n#webdesign #siteparapadaria #bastidores",
        mudou="Era \"60 minutos contra o relógio\". Virou bastidores sem cronômetro: o tempo real foi outro, e mostrar \"site feito em X minutos\" desvaloriza o trabalho, como a pesquisa apontou."),
  carrossel('f02', 'instagram/posts/manifesto', 'Dom 29/11 · 19h', '', 'Manifesto', 'Se parece com todos, ninguém lembra.', tipo='foto'),
  carrossel('f01', 'instagram/posts/quadro-heroi-padaria', 'Reserva · semana 2', 'feito-para', 'Quadro-herói da padaria', 'Isso é a primeira tela de uma padaria.', tipo='foto'),
]
st = 'instagram/stories/semana-1/'
def story(pid, arqs, dia, titulo, gancho, como):
    return {"id": f"p-{pid}", "numero": dia, "tipo": "story", "quadro": "bancada", "esforco": "pronto",
            "titulo": titulo, "gancho": gancho, "galeria": [img(st + a, f'{pid}/{a}', 360) for a in arqs], "roteiro": como}
ideias += [
  story('s01', ['s01-bancada-modelo.jpg', 's01-bancada-exemplo-filme.jpg', 's01-bancada-exemplo-site.jpg', 's01-post-do-dia-modelo.jpg', 's01-post-do-dia-exemplo.jpg'],
        'Todo dia', 'Bancada do dia', 'Hoje na bancada.',
        ["Eu preencho o bastidor do dia e o \"post do dia\".", "Você põe o sticker de enquete e o de link no app (a publicação automática não coloca stickers)."]),
  story('s02', ['s02-sexta-do-site.jpg'], 'Sex 04/12', 'Sexta do site', 'Manda o link do seu site.', ["Você põe o sticker de caixinha no espaço do meio."]),
  story('s03', ['s03-domingo-enquete-1.jpg', 's03-domingo-enquete-2.jpg'], 'Dom 06/12', 'Domingo: você escolhe', 'Qual negócio ganha um site-conceito esta semana?', ["Você põe o sticker de enquete em cada tela."]),
  story('s04', ['s04-contagem.jpg'], 'Quando houver data', 'Contagem do lançamento', 'Contagem regressiva.', ["Você põe o sticker de contagem com a data do lançamento do site."]),
]
for i in ideias:
    if i.get('mudou') is None: i.pop('mudou', None)

Q = r1['rotina']['quadros']
rotina = {
  "titulo": "Calendário da semana 1",
  "resumo": "De 30/11 a 05/12, mais o manifesto no domingo 29/11. Os 3 posts já agendados desta semana (24, 26 e 28/11) continuam.",
  "numeros": [
    {"valor": "11", "rotulo": "posts na semana", "nota": "7 Reels e 4 carrosséis, mais o manifesto no domingo."},
    {"valor": "4", "rotulo": "modelos de stories", "nota": "Eu preparo as telas; você põe os stickers no app."},
  ],
  "colunas": ["12h", "19h", "Stories"],
  "semana": [
    {"dia": "Dom 29/11", "slots": [None, {"tipo": "foto", "texto": "Manifesto"}, {"tipo": "story", "texto": "Bancada"}]},
    {"dia": "Seg 30/11", "slots": [{"tipo": "carrossel", "texto": "Raio-X de uma primeira tela"}, {"tipo": "reels", "texto": "Caixa-preta #1"}, {"tipo": "story", "texto": "Bancada"}]},
    {"dia": "Ter 01/12", "slots": [{"tipo": "reels", "texto": "Isso não é vídeo"}, {"tipo": "carrossel", "texto": "Checklist antes de contratar"}, {"tipo": "story", "texto": "Bancada"}]},
    {"dia": "Qua 02/12", "slots": [{"tipo": "reels", "texto": "Parallax em 30 s"}, {"tipo": "reels", "texto": "Feito para padaria"}, {"tipo": "story", "texto": "Bancada"}]},
    {"dia": "Qui 03/12", "slots": [{"tipo": "carrossel", "texto": "Padaria: as decisões"}, {"tipo": "reels", "texto": "O site que todo mundo tem"}, {"tipo": "story", "texto": "Bancada"}]},
    {"dia": "Sex 04/12", "slots": [{"tipo": "reels", "texto": "1 segundo, 30 quadros"}, {"tipo": "carrossel", "texto": "Mito ou verdade"}, {"tipo": "story", "texto": "Sexta do site"}]},
    {"dia": "Sáb 05/12", "slots": [{"tipo": "reels", "texto": "Do zero à primeira tela", "nota": "11h"}, None, {"tipo": "story", "texto": "Leve"}]},
    {"dia": "Dom 06/12", "slots": [None, None, {"tipo": "story", "texto": "Você escolhe o nicho"}]},
  ],
  "notaTabela": "Reels: ficam prontos e você só escolhe a música e publica. Carrosséis e fotos: saem sozinhos quando o GitHub estiver ligado; até lá, agendamos pelo próprio Instagram.",
  "quadros": Q, "porque": [], "regras": [],
  "idDecisao": "calendario-s1",
  "rotuloDecisao": "Sua decisão sobre o calendário da semana 1",
  "placeholderDecisao": "Ex.: troque a ordem de quarta, mude um horário…",
}
pauta = dict(r1)
pauta.update({
  "rodada": "Rodada 2 · peças da semana 1 · 23/11/2026",
  "instrucao": "Agora são as peças prontas. Assista, passe os slides e leia a legenda. Toque em Aprovar, Ajustar ou Não gostei. O que for aprovado entra no calendário.",
  "tituloIdeias": "Peças da semana 1",
  "subIdeias": "Vídeos, carrosséis, fotos e stories na ordem em que vão ao ar.",
  "rotina": rotina, "ideias": ideias,
})
(AQUI / 'pauta.json').write_text(json.dumps(pauta, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(ideias), 'peças ·', 'faltando:', faltando or 'nada')
