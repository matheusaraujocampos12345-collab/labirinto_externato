"""Coletor do lead-finder: busca posts e comentários PÚBLICOS no Instagram e no TikTok pela Apify.

Comandos:
  loja                 pesquisa os atores na Apify Store e mostra o preço por mil (não gasta crédito)
  resumo --perfis N    mostra a busca, os atores e a estimativa de custo (não gasta crédito)
  rodar --perfis N --confirmo-gasto   roda os atores (GASTA CRÉDITO, só depois do ok do dono)
  juntar               junta o que veio da Apify em leads/bruto.json
  simular              cria dados FICTÍCIOS em leads/exemplo/ para testar a cadeia
"""
import argparse
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lead-finder', 'scripts'))
import comum  # noqa: E402

REDES = ('instagram', 'tiktok')
ETAPAS = ('posts', 'comentarios', 'perfis')

# Atores escolhidos: os mais usados e mais bem avaliados de cada etapa (conferido na Store).
ESCOLHA = {
    'instagram': {'posts': 'apify/instagram-hashtag-scraper',
                  'comentarios': 'apify/instagram-comment-scraper',
                  'perfis': 'apify/instagram-profile-scraper'},
    'tiktok': {'posts': 'clockworks/tiktok-scraper',
               'comentarios': 'clockworks/tiktok-comments-scraper',
               'perfis': 'clockworks/tiktok-profile-scraper'},
}
BUSCA_LOJA = {
    ('instagram', 'posts'): 'instagram hashtag scraper', ('instagram', 'comentarios'): 'instagram comments scraper',
    ('instagram', 'perfis'): 'instagram profile scraper', ('tiktok', 'posts'): 'tiktok scraper',
    ('tiktok', 'comentarios'): 'tiktok comments scraper', ('tiktok', 'perfis'): 'tiktok profile scraper',
}
COMENTARIOS_POR_POST = 10
# Posts dos perfis de referência no Instagram: o robô de hashtag não lê perfil, então usamos o genérico.
ATOR_IG_PERFIS_REF = 'apify/instagram-scraper'
POSTS_POR_PERFIL_REF = 3
TETO_MINIMO_APIFY = 0.50  # a Apify não aceita teto menor que US$ 0,50 por execução


def arq(pasta, nome):
    return os.path.join(pasta, nome)


# ---------- loja ----------

def cmd_loja(a):
    cfg = comum.config()
    pasta = comum.pasta_leads()
    saida = {}
    for (rede, etapa), termo in BUSCA_LOJA.items():
        itens = comum.apify('GET', '/store', params={'search': termo, 'limit': 10}, com_token=False)['data']['items']
        escolhido = ESCOLHA[rede][etapa]
        linhas = []
        for it in itens:
            nome = f'{it["username"]}/{it["name"]}'
            s = it.get('stats') or {}
            p = comum.preco(it, cfg.get('plano_apify', 'FREE'))
            linhas.append({'ator': nome, 'titulo': it.get('title'), 'usuarios_30d': s.get('totalUsers30Days', 0),
                           'usuarios_total': s.get('totalUsers', 0),
                           'nota': round(s.get('actorReviewRating') or 0, 1), 'avaliacoes': s.get('actorReviewCount', 0),
                           'us_por_mil': p['por_mil'], 'us_inicio': p['inicio'], 'modelo': p['modelo'], 'obs': p['nota'],
                           'link': it.get('url')})
        top = next((l for l in linhas if l['ator'] == escolhido), None)
        if top is None:  # o escolhido sumiu da busca: pega o mais usado com nota boa
            boas = [l for l in linhas if rede in l['ator'] and (l['nota'] >= 4 or l['avaliacoes'] == 0)]
            top = max(boas or linhas, key=lambda l: l['usuarios_30d'])
        saida.setdefault(rede, {})[etapa] = {'escolhido': top, 'alternativas': [l for l in linhas if l is not top][:3]}
        print(f'\n{rede.upper()} · {etapa}')
        print(f'  ESCOLHIDO: {top["ator"]} · US${top["us_por_mil"]}/mil · {top["usuarios_30d"]} usuários no mês · '
              f'nota {top["nota"]} ({top["avaliacoes"]}) · {top["obs"]}')
        for l in saida[rede][etapa]['alternativas']:
            print(f'  outro: {l["ator"]} · US${l["us_por_mil"]}/mil · {l["usuarios_30d"]} usuários · nota {l["nota"]}')
    comum.salvar_json(arq(pasta, 'atores.json'), {'gerado_em': comum.agora(),
                                                  'plano': cfg.get('plano_apify', 'FREE'), 'redes': saida})
    print(f'\nSalvo em {comum.rel(arq(pasta, "atores.json"))}. Nada foi rodado, nenhum crédito gasto.')


# ---------- plano e custo ----------

def plano(n, redes):
    por_rede = math.ceil(n / len(redes))
    posts = max(5, math.ceil(por_rede / 2))
    return {r: {'posts': posts, 'comentarios': posts * COMENTARIOS_POR_POST, 'perfis': por_rede} for r in redes}


def estimar(n, redes, atores):
    linhas, total = [], 0.0
    for rede, etapas in plano(n, redes).items():
        for etapa, qtd in etapas.items():
            info = atores['redes'][rede][etapa]['escolhido']
            custo = qtd * (info['us_por_mil'] or 0) / 1000 + (info['us_inicio'] or 0)
            total += custo
            linhas.append((rede, etapa, info['ator'], qtd, info['us_por_mil'], custo))
    return linhas, total


def carregar_atores(pasta):
    atores = comum.ler_json(arq(pasta, 'atores.json'))
    if not atores:
        raise SystemExit('Rode primeiro: python3 .claude/skills/coletor/coletor.py loja')
    return atores


def mostrar_busca(busca):
    print('\nO SITE EM 3 LINHAS')
    for l in busca.get('resumo', []):
        print('  ' + l)
    for rede in REDES:
        b = busca.get(rede) or {}
        print(f'\n{rede.upper()}')
        print('  hashtags: ' + ', '.join('#' + h for h in b.get('hashtags', [])))
        if b.get('palavras'):
            print('  palavras-chave: ' + ' · '.join(b['palavras']))
        for p in b.get('perfis', []):
            print(f'  perfil de referência: @{p["usuario"]} ({p.get("status", "a confirmar")}) {p.get("por_que", "")}')


def cmd_resumo(a):
    pasta = comum.pasta_leads()
    busca = comum.ler_json(arq(pasta, 'busca.json'))
    if not busca:
        raise SystemExit('Falta leads/busca.json (o Claude cria depois de ler o site).')
    atores = carregar_atores(pasta)
    mostrar_busca(busca)
    redes = [r for r in REDES if busca.get(r)]
    for n in sorted({a.perfis, comum.config().get('max_perfis', 300)}):
        linhas, total = estimar(n, redes, atores)
        print(f'\nESTIMATIVA PARA {n} PERFIS (plano {atores.get("plano")})')
        for rede, etapa, ator, qtd, pm, custo in linhas:
            print(f'  {rede:<9} {etapa:<11} {ator:<38} {qtd:>5} itens × US${pm}/mil = US${custo:.3f}')
        print(f'  TOTAL ≈ US${total:.2f}')
    comum.pede_ok('aprovar as buscas e o custo antes de rodar. Nenhum crédito foi gasto.')


# ---------- rodar (gasta crédito) ----------

def entrada(rede, etapa, busca, alvos, qtd):
    if rede == 'instagram' and etapa == 'posts':
        tags = busca.get('hashtags', [])
        return {'hashtags': tags, 'resultsType': 'posts', 'resultsLimit': max(1, math.ceil(qtd / max(1, len(tags))))}
    if rede == 'instagram' and etapa == 'posts_perfis_ref':
        return {'directUrls': [f'https://www.instagram.com/{p["usuario"]}/' for p in busca.get('perfis', [])],
                'resultsType': 'posts', 'resultsLimit': POSTS_POR_PERFIL_REF, 'addParentData': False}
    if rede == 'instagram' and etapa == 'comentarios':
        return {'directUrls': alvos, 'resultsLimit': COMENTARIOS_POR_POST, 'includeNestedComments': False}
    if rede == 'instagram' and etapa == 'perfis':
        return {'usernames': alvos, 'includeAboutSection': False}
    sem_extras = {'shouldDownloadVideos': False, 'shouldDownloadCovers': False, 'shouldDownloadAvatars': False,
                  'shouldDownloadSlideshowImages': False, 'downloadSubtitlesOptions': 'NEVER_DOWNLOAD_SUBTITLES'}
    if rede == 'tiktok' and etapa == 'posts':
        n_fontes = len(busca.get('hashtags', [])) + len(busca.get('palavras', [])) + len(busca.get('perfis', []))
        return {'hashtags': busca.get('hashtags', []), 'searchQueries': busca.get('palavras', []),
                'profiles': [p['usuario'] for p in busca.get('perfis', [])], 'searchSection': '/video',
                'resultsPerPage': max(1, math.ceil(qtd / max(1, n_fontes))), 'shouldDownloadMusicCovers': False,
                **sem_extras}
    if rede == 'tiktok' and etapa == 'comentarios':
        return {'postURLs': alvos, 'commentsPerPost': COMENTARIOS_POR_POST, 'maxRepliesPerComment': 0}
    if rede == 'tiktok' and etapa == 'perfis':
        return {'profiles': alvos, 'resultsPerPage': 1, 'profileScrapeSections': ['videos'], **sem_extras}
    raise ValueError((rede, etapa))


def g(d, *chaves, padrao=''):
    """Pega o primeiro campo que existir (os atores mudam nomes de campo)."""
    for c in chaves:
        cur = d
        for parte in c.split('.'):
            cur = cur.get(parte) if isinstance(cur, dict) else None
        if cur not in (None, ''):
            return cur
    return padrao


def alvos_da_etapa(rede, etapa, pasta, busca, qtd):
    if etapa == 'posts':
        return None
    bruto = comum.ler_json(arq(pasta, f'apify/{rede}-posts.json'), [])
    if etapa == 'comentarios':
        com_coment = [p for p in bruto if int(g(p, 'commentsCount', 'commentCount', padrao=0) or 0) > 0]
        com_coment.sort(key=lambda p: -int(g(p, 'commentsCount', 'commentCount', padrao=0) or 0))
        return [g(p, 'url', 'webVideoUrl') for p in com_coment][:max(1, qtd // COMENTARIOS_POR_POST)]
    # perfis: quem comentou com frase de verdade primeiro, depois autores dos posts
    refs = {p['usuario'].lower() for p in busca.get('perfis', [])}
    coments = comum.ler_json(arq(pasta, f'apify/{rede}-comentarios.json'), [])
    vistos, ordem = set(), []
    coments.sort(key=lambda c: -len(g(c, 'text')))
    for c in coments:
        u = g(c, 'ownerUsername', 'owner.username', 'uniqueId', 'user.uniqueId')
        if u and len(g(c, 'text').split()) >= 4 and u.lower() not in refs and u not in vistos:
            vistos.add(u)
            ordem.append(u)
    for p in bruto:
        u = g(p, 'ownerUsername', 'authorMeta.name')
        if u and u.lower() not in refs and u not in vistos:
            vistos.add(u)
            ordem.append(u)
    return ordem[:qtd]


def cmd_rodar(a):
    cfg = comum.config()
    pasta = comum.pasta_leads()
    busca = comum.ler_json(arq(pasta, 'busca.json'))
    if not busca or not busca.get('aprovado'):
        raise SystemExit('A busca ainda não foi aprovada pelo dono (leads/busca.json → "aprovado": true).')
    if not a.confirmo_gasto:
        raise SystemExit('Isto gasta crédito da Apify. Só rode com --confirmo-gasto depois do ok do dono.')
    if a.perfis > cfg.get('max_perfis', 300):
        raise SystemExit(f'Máximo combinado é {cfg.get("max_perfis", 300)} perfis.')
    atores = carregar_atores(pasta)
    redes = [r for r in REDES if busca.get(r)] if a.rede == 'todas' else [a.rede]
    linhas, total = estimar(a.perfis, redes, atores)
    teto_total = min(cfg.get('teto_gasto_usd_por_rodada', 2.0), round(total * 1.5 + 0.05, 2))
    print(f'Estimativa: US${total:.2f} · teto de segurança: US${teto_total:.2f}')
    gasto_total = 0.0
    etapas = ETAPAS if a.etapa == 'todas' else [a.etapa]
    for rede in redes:
        qtds = plano(a.perfis, redes)[rede]
        for etapa in etapas:
            ator = atores['redes'][rede][etapa]['escolhido']['ator']
            alvos = alvos_da_etapa(rede, etapa, pasta, busca[rede], qtds[etapa])
            if alvos is not None and not alvos:
                print(f'  {rede}/{etapa}: nada para buscar, pulei.')
                continue
            ent = entrada(rede, etapa, busca[rede], alvos, qtds[etapa])
            teto = max(TETO_MINIMO_APIFY, round(teto_total - gasto_total, 2))
            itens, status, gasto = comum.rodar_ator(ator, ent, qtds[etapa], teto)
            gasto_total += float(gasto or 0)
            if rede == 'instagram' and etapa == 'posts' and busca[rede].get('perfis'):
                ent = entrada(rede, 'posts_perfis_ref', busca[rede], None, 0)
                n = POSTS_POR_PERFIL_REF * len(busca[rede]['perfis'])
                extra, _, gasto = comum.rodar_ator(ATOR_IG_PERFIS_REF, ent, n, TETO_MINIMO_APIFY)
                gasto_total += float(gasto or 0)
                itens += [x for x in extra if x.get('url') and x.get('ownerUsername')]
            itens = [x for x in itens if not x.get('error')]
            comum.salvar_json(arq(pasta, f'apify/{rede}-{etapa}.json'), itens)
            if gasto_total >= teto_total:
                print('Teto de gasto atingido: parei aqui.')
                break
    print(f'\nGasto total informado pela Apify: US${gasto_total:.3f}')
    cmd_juntar(a)


# ---------- juntar ----------

def cmd_juntar(a):
    cfg = comum.config()
    pasta = comum.pasta_leads()
    busca = comum.ler_json(arq(pasta, 'busca.json'), {})
    perfis = {}
    for rede in REDES:
        posts = comum.ler_json(arq(pasta, f'apify/{rede}-posts.json'), [])
        coments = comum.ler_json(arq(pasta, f'apify/{rede}-comentarios.json'), [])
        dados = comum.ler_json(arq(pasta, f'apify/{rede}-perfis.json'), [])
        for d in dados:
            if rede == 'instagram':
                u = g(d, 'username')
                if not u or d.get('private'):
                    continue
                links = [x.get('url') for x in d.get('externalUrls') or [] if isinstance(x, dict)]
                p = {'nome': g(d, 'fullName'), 'bio': g(d, 'biography'),
                     'link_bio': g(d, 'externalUrl') or (links[0] if links else ''),
                     'outros_links': links, 'categoria': g(d, 'businessCategoryName'),
                     'eh_negocio': d.get('isBusinessAccount'), 'seguidores': g(d, 'followersCount', padrao=0),
                     'verificado': bool(d.get('verified')),
                     'email_publico': g(d, 'publicEmail', 'businessEmail', 'public_email'),
                     'link': f'https://www.instagram.com/{u}/'}
                proprios = [{'tipo': 'post', 'texto': g(x, 'caption'), 'link': g(x, 'url'), 'data': g(x, 'timestamp')}
                            for x in d.get('latestPosts') or [] if g(x, 'caption')]
            else:
                m = d.get('authorMeta') or {}
                u = m.get('name')
                if not u or m.get('privateAccount'):
                    continue
                p = {'nome': m.get('nickName', ''), 'bio': m.get('signature', ''), 'link_bio': m.get('bioLink') or '',
                     'outros_links': [], 'categoria': '', 'eh_negocio': m.get('commerceUserInfo', {}).get('commerceUser')
                     if isinstance(m.get('commerceUserInfo'), dict) else None,
                     'seguidores': m.get('fans', 0), 'verificado': bool(m.get('verified')), 'email_publico': '',
                     'link': f'https://www.tiktok.com/@{u}'}
                proprios = [{'tipo': 'post', 'texto': g(d, 'text'), 'link': g(d, 'webVideoUrl'),
                             'data': g(d, 'createTimeISO')}] if g(d, 'text') else []
            chave = f'{rede}:{u.lower()}'
            perfis[chave] = {'id': chave, 'rede': rede, 'usuario': u, **p, 'falas': proprios}
        for c in coments:
            u = g(c, 'ownerUsername', 'owner.username', 'uniqueId', 'user.uniqueId')
            chave = f'{rede}:{(u or "").lower()}'
            if chave in perfis and g(c, 'text'):
                perfis[chave]['falas'].append({'tipo': 'comentario', 'texto': g(c, 'text'),
                                               'link': g(c, 'postUrl', 'videoWebUrl', 'inputUrl', 'url'),
                                               'data': g(c, 'timestamp', 'createTimeISO')})
        for po in posts:
            u = g(po, 'ownerUsername', 'authorMeta.name')
            chave = f'{rede}:{(u or "").lower()}'
            texto, link = g(po, 'caption', 'text'), g(po, 'url', 'webVideoUrl')
            if chave in perfis and texto and all(f['link'] != link for f in perfis[chave]['falas']):
                perfis[chave]['falas'].append({'tipo': 'post', 'texto': texto, 'link': link,
                                               'data': g(po, 'timestamp', 'createTimeISO')})
    lista = list(perfis.values())[:cfg.get('max_perfis', 300)]
    saida = {'gerado_em': comum.agora(), 'site': busca.get('site', ''), 'total': len(lista), 'perfis': lista}
    comum.salvar_json(arq(pasta, 'bruto.json'), saida)
    print(f'{len(lista)} perfis salvos em {comum.rel(arq(pasta, "bruto.json"))}')


# ---------- simular (dados fictícios) ----------

def cmd_simular(a):
    pasta = comum.pasta_leads(simular=True)
    P = 'https://www.instagram.com/p/EXEMPLO'
    T = 'https://www.tiktok.com/@exemplo/video/000'
    perfis = [
        ('instagram', 'exemplo_padaria_01', 'Exemplo Padaria 01', 'Padaria artesanal. Pães de fermentação natural. '
         'Contato: contato@padaria01.example.com', '', 'Padaria', True, 2100,
         [('comentario', 'Meu cardápio é um PDF no WhatsApp e ninguém abre. Queria que o cliente já mandasse o '
           'pedido pronto.', P + '01'),
          ('comentario', 'Mas site não fica caro demais pra padaria pequena?', P + '02')]),
        ('instagram', 'exemplo_barbearia_02', 'Exemplo Barbearia 02', 'Barbearia clássica · agende pelo link',
         'https://barbearia02.example.com', 'Barbearia', True, 3400,
         [('comentario', 'Perco cliente porque passo o dia respondendo horário no direct.', P + '03'),
          ('comentario', 'Sonho com a agenda enchendo sozinha enquanto eu corto.', P + '04')]),
        ('tiktok', 'exemplo_confeitaria_03', 'Exemplo Confeitaria 03', 'Bolos sob encomenda 🎂 link na bio',
         'https://linktr.example.com/confeitaria03', '', None, 870,
         [('comentario', 'Todo mundo me pede catálogo e eu fico mandando foto por foto.', T + '05')]),
        ('instagram', 'exemplo_estudio_04', 'Exemplo Estúdio de Tatuagem 04', 'Tattoo fineline. Orçamento por e-mail.',
         'https://estudio04.example.com', 'Tatuador', True, 5200,
         [('comentario', 'Queria um portfólio bonito, que mostre meu traço melhor que o feed.', P + '06'),
          ('comentario', 'Já paguei um site uma vez e ficou com cara de template.', P + '07')]),
        ('instagram', 'exemplo_agencia_web_05', 'Exemplo Agência Web 05', 'Criamos sites e landing pages 🚀',
         'https://agencia05.example.com', 'Web designer', True, 15000,
         [('post', 'Seu site precisa vender! Chama no direct.', P + '08')]),
        ('tiktok', 'exemplo_hamburgueria_06', 'Exemplo Hamburgueria 06', 'Smash burger · delivery próprio', '', '',
         None, 1200,
         [('comentario', 'O app de delivery come metade do meu lucro.', T + '09')]),
        ('instagram', 'exemplo_rede_nacional_07', 'Exemplo Rede Nacional 07', 'A maior rede de cafés do país.',
         'https://rede07.example.com', 'Restaurante', True, 2400000,
         [('post', 'Novo menu de Natal chegando!', P + '10')]),
        ('tiktok', 'exemplo_sorteios_robo_08', 'sorteio premios 100% real', 'GANHE SEGUIDORES GRÁTIS clique',
         '', '', None, 40,
         [('comentario', 'ganhe seguidores gratis link na bio 🔥🔥🔥', T + '11')]),
        ('instagram', 'exemplo_pessoa_09', 'Exemplo Pessoa 09', 'Amo viajar e café ☕', '', '', False, 310,
         [('comentario', 'Que lindo esse site!', P + '12')]),
        ('instagram', 'exemplo_floricultura_10', 'Exemplo Floricultura 10', 'Flores e presentes. Entregamos na cidade.',
         '', 'Floricultura', True, 1900,
         [('post', 'Promoção de buquês esta semana.', P + '13')]),
    ]
    lista = []
    for rede, u, nome, bio, link_bio, cat, neg, seg, falas in perfis:
        base = 'https://www.instagram.com/' if rede == 'instagram' else 'https://www.tiktok.com/@'
        lista.append({'id': f'{rede}:{u}', 'rede': rede, 'usuario': u, 'nome': nome, 'bio': bio, 'link_bio': link_bio,
                      'outros_links': [], 'categoria': cat, 'eh_negocio': neg, 'seguidores': seg, 'verificado': False,
                      'email_publico': '', 'link': base + u + ('/' if rede == 'instagram' else ''),
                      'falas': [{'tipo': t, 'texto': x, 'link': l, 'data': '2026-11-20'} for t, x, l in falas]})
    comum.salvar_json(arq(pasta, 'bruto.json'), {'gerado_em': comum.agora(), 'site': 'EXEMPLO', 'ficticio': True,
                                                'total': len(lista), 'perfis': lista})
    paginas = {
        'https://barbearia02.example.com': '<footer>Rua Exemplo, 10 · <a href="mailto:agenda@barbearia02.example.com">'
                                           'agenda@barbearia02.example.com</a></footer>',
        'https://linktr.example.com/confeitaria03': '<a href="https://confeitaria03.example.com">Meu site</a>',
        'https://confeitaria03.example.com': '<p>Encomendas pelo WhatsApp.</p><a href="/contato">Contato</a>',
        'https://confeitaria03.example.com/contato': '<p>Escreva para: encomendas@confeitaria03.example.com</p>',
        'https://estudio04.example.com': '<p>Portfólio</p><img src="logo@2x.png"><p>sem e-mail aqui</p>',
    }
    comum.salvar_json(arq(pasta, 'paginas-simuladas.json'), paginas)
    print(f'10 perfis FICTÍCIOS em {comum.rel(arq(pasta, "bruto.json"))} (nenhum dado real, nada gasto).')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('loja')
    r = sub.add_parser('resumo')
    r.add_argument('--perfis', type=int, default=10)
    r = sub.add_parser('rodar')
    r.add_argument('--perfis', type=int, default=10)
    r.add_argument('--rede', choices=REDES + ('todas',), default='todas')
    r.add_argument('--etapa', choices=ETAPAS + ('todas',), default='todas')
    r.add_argument('--confirmo-gasto', action='store_true')
    sub.add_parser('juntar')
    sub.add_parser('simular')
    a = ap.parse_args()
    {'loja': cmd_loja, 'resumo': cmd_resumo, 'rodar': cmd_rodar, 'juntar': cmd_juntar,
     'simular': cmd_simular}[a.cmd](a)


if __name__ == '__main__':
    main()
