"""Caçador de e-mail do lead-finder.

Só aceita e-mail que a pessoa PUBLICOU: campo de contato do perfil, bio, link na bio,
site da empresa (início, contato, rodapé). Não adivinha formato, não usa vazamento.
Também guarda o WhatsApp que a empresa publicou (link wa.me, bio ou post dela).
Gera leads/lista.csv. Use --simular para trabalhar em leads/exemplo/ sem acessar a internet.
"""
import argparse
import html
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.robotparser

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lead-finder', 'scripts'))
import comum  # noqa: E402

RE_EMAIL = re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
RE_ARROBA = re.compile(r'([A-Za-z0-9._%+-]+)\s*[\[(]\s*(?:at|arroba)\s*[\])]\s*([A-Za-z0-9.-]+\.[A-Za-z]{2,})', re.I)
AGREGADORES = ('linktr.ee', 'linktr.', 'beacons.ai', 'bio.link', 'linkin.bio', 'taplink', 'lnk.bio', 'msha.ke',
               'campsite.bio', 'linkbio', 'allmylinks')
REDES_SOCIAIS = ('instagram.com', 'tiktok.com', 'facebook.com', 'wa.me', 'whatsapp.com', 'youtube.com', 'youtu.be',
                 'twitter.com', 'x.com', 'google.com', 'goo.gl', 'ifood.com', 'spotify.com', 'linkedin.com',
                 'pinterest.com', 't.me', 'apple.com', 'play.google')
LIXO = ('sentry', 'wixpress.com', 'seudominio', 'seuemail', 'dominio.com', 'email.com', 'nome@', 'exemplo.com',
        'noreply', 'no-reply', 'naoresponda', 'nao-responda', 'donotreply')
PAGINAS_CONTATO = ('/contato', '/contact', '/fale-conosco')
NAO_SITES = ('app.google', 'calendly.com', 'forms.gle', 'docs.google', 'drive.google', 'bit.ly')
UA = 'Mozilla/5.0 (compatible; lead-finder/1.0; contato publico)'
MAX_PAGINAS = 6


def emails_no_texto(texto, simular):
    t = html.unescape(urllib.parse.unquote(texto or ''))
    achados = RE_EMAIL.findall(t) + [f'{a}@{b}' for a, b in RE_ARROBA.findall(t)]
    bons = []
    for e in achados:
        e = e.strip('.').lower()
        if re.search(r'\.(png|jpe?g|gif|webp|svg|css|js)$', e):
            continue
        if any(x in e for x in LIXO):
            continue
        if not simular and re.search(r'(^|[.@])example\.(com|org|net)$', e):
            continue
        if e not in bons:
            bons.append(e)
    return bons


class Leitor:
    def __init__(self, simular, pasta):
        self.simular = simular
        self.simuladas = comum.ler_json(os.path.join(pasta, 'paginas-simuladas.json'), {}) if simular else {}
        self.robots = {}
        self.ultimo = 0.0

    def pode(self, url):
        if self.simular:
            return True
        base = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlparse(url))
        if base not in self.robots:
            rp = urllib.robotparser.RobotFileParser(base + '/robots.txt')
            try:
                rp.read()
            except Exception:
                rp = None
            self.robots[base] = rp
        rp = self.robots[base]
        return True if rp is None else rp.can_fetch(UA, url)

    def resolver_atalho(self, url):
        """Abre um atalho de WhatsApp publicado (wa.link, wa.me/message) e vê para qual número ele leva."""
        if self.simular:
            return ''
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                final = r.geturl()
                corpo = r.read(200_000).decode('utf-8', errors='replace')
            return whats_em_links(final) or whats_em_links(corpo)
        except Exception:
            return ''

    def ler(self, url):
        if self.simular:
            return self.simuladas.get(url.rstrip('/'), '')
        if not self.pode(url):
            return ''
        espera = 1.0 - (time.time() - self.ultimo)
        if espera > 0:
            time.sleep(espera)
        self.ultimo = time.time()
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=10) as r:
                if 'html' not in (r.headers.get('Content-Type') or 'html'):
                    return ''
                return r.read(500_000).decode('utf-8', errors='replace')
        except Exception:
            return ''


def limpar_url(u):
    """Tira o #trecho e a barra do fim, para não ler a mesma página duas vezes."""
    return urllib.parse.urldefrag(u.strip())[0].rstrip('/')


def links_da_pagina(base, pagina):
    out = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', pagina or '', re.I):
        if href.startswith(('mailto:', 'tel:', 'javascript:', '#')):
            continue
        u = limpar_url(urllib.parse.urljoin(base, href))
        if u.startswith('http') and u not in out:
            out.append(u)
    return out


def dominio(u):
    return urllib.parse.urlparse(u).netloc.lower().removeprefix('www.')


def raiz_do_site(u):
    p = urllib.parse.urlparse(u)
    return f'{p.scheme}://{p.netloc}'


def nao_e_site(u):
    d = dominio(u)
    return any(r in d for r in REDES_SOCIAIS + NAO_SITES)


RE_WA_LINK = re.compile(r'(?:wa\.me/|whatsapp\.com/send/?\?phone=)\+?(\d{10,13})', re.I)
RE_FONE_BR = re.compile(r'(?<![\d/])(?:\+?55[\s.-]?)?\(?([1-9]\d)\)?[\s.-]?(9\d{4})[\s.-]?(\d{4})(?![\d/])')


def whats_em_links(texto):
    """WhatsApp só a partir de link wa.me ou whatsapp.com/send (serve para páginas inteiras)."""
    t = html.unescape(urllib.parse.unquote(texto or ''))
    for m in RE_WA_LINK.finditer(t):
        d = m.group(1)
        d = d if d.startswith('55') else '55' + d
        if len(d) in (12, 13):
            return '+' + d
    return ''


def whats_no_texto(texto):
    """Link wa.me ou celular brasileiro escrito no texto (só para bio e posts do próprio perfil)."""
    achado = whats_em_links(texto)
    if achado:
        return achado
    m = RE_FONE_BR.search(html.unescape(texto or ''))
    return f'+55{m.group(1)}{m.group(2)}{m.group(3)}' if m else ''


def cacar(p, leitor, simular, posts_proprios=()):
    """Procura e-mail e WhatsApp PUBLICADOS. Devolve dict com o contato e a fonte de cada um."""
    r = {'email': '', 'fonte_email': '', 'whatsapp': '', 'fonte_whatsapp': ''}

    def achou_whats(numero, fonte):
        if numero and not r['whatsapp']:
            r['whatsapp'], r['fonte_whatsapp'] = numero, fonte

    for u in [p.get('link_bio')] + list(p.get('outros_links') or []):
        achou_whats(whats_em_links(u or ''), f'link do perfil ({p["link"]})')
    for u in [p.get('link_bio')] + list(p.get('outros_links') or []):
        if u and not r['whatsapp'] and re.search(r'(^|//)(wa\.link/|wa\.me/message/|api\.whatsapp\.com/message/)', u):
            achou_whats(leitor.resolver_atalho(u), f'atalho de WhatsApp no perfil ({u})')
    achou_whats(whats_no_texto(p.get('bio')), f'bio do perfil ({p["link"]})')
    for post in posts_proprios:
        achou_whats(whats_no_texto(post.get('texto')), f'post do próprio perfil ({post.get("link")})')

    if p.get('email_publico'):
        e = emails_no_texto(p['email_publico'], simular)
        if e:
            r['email'], r['fonte_email'] = e[0], f'contato público do perfil ({p["link"]})'
    if not r['email']:
        e = emails_no_texto(p.get('bio'), simular)
        if e:
            r['email'], r['fonte_email'] = e[0], f'bio do perfil ({p["link"]})'
    if r['email'] and r['whatsapp']:
        return r
    sementes = [p.get('link_bio')] + list(p.get('outros_links') or []) + re.findall(r'https?://[^\s"\'<>]+', p.get('bio') or '')
    fila = []
    for u in sementes:
        if u and not nao_e_site(u) and limpar_url(u) not in fila:
            fila.append(limpar_url(u))
    fila.sort(key=lambda u: 1 if any(ag in dominio(u) for ag in AGREGADORES) else 0)  # site próprio primeiro
    vistos, lidas = set(), 0
    while fila and lidas < MAX_PAGINAS and not (r['email'] and r['whatsapp']):
        url = fila.pop(0)
        if url in vistos or nao_e_site(url):
            continue
        vistos.add(url)
        pagina = leitor.ler(url)
        lidas += 1
        achou_whats(whats_em_links(pagina), url)
        achados = emails_no_texto(pagina, simular)
        if achados and not r['email']:
            site = dominio(url)
            achados.sort(key=lambda x: 0 if x.split('@')[1] == site or site.endswith('.' + x.split('@')[1])
                          or x.split('@')[1].endswith('.' + site) else 1)
            r['email'], r['fonte_email'] = achados[0], url
            continue
        links = links_da_pagina(url + '/', pagina)
        if any(ag in dominio(url) for ag in AGREGADORES):  # link na bio: segue para o site da empresa
            novos = [u for u in links if not nao_e_site(u) and not any(ag in dominio(u) for ag in AGREGADORES)][:3]
        else:
            mesmos = [u for u in links if dominio(u) == dominio(url) and re.search(r'contat|contact|fale|sobre|about', u, re.I)]
            novos = mesmos[:2] + [raiz_do_site(url) + c for c in PAGINAS_CONTATO][:2]
        fila = [u for u in novos if u not in vistos and u not in fila] + fila
    return r


def fmt(c):
    return f'"{c["citacao"]}" ({c["link"]})' if c and c.get('citacao') else ''


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--simular', action='store_true')
    a = ap.parse_args()
    pasta = comum.pasta_leads(a.simular)
    perfis = comum.ler_json(os.path.join(pasta, 'perfis.json'))
    if perfis is None:
        raise SystemExit('Falta perfis.json. Rode o montador antes.')
    bruto = comum.ler_json(os.path.join(pasta, 'bruto.json'), {'perfis': []})
    posts = {b['id']: [f for f in b.get('falas', []) if f.get('tipo') == 'post'] for b in bruto['perfis']}
    leitor = Leitor(a.simular, pasta)
    campos = ['perfil', 'rede', 'link', 'negocio', 'dor', 'sonho', 'objecao', 'pergunta', 'fato', 'fato_frase',
              'email', 'fonte_email', 'whatsapp', 'fonte_whatsapp']
    destino = os.path.join(pasta, 'lista.csv')
    if os.path.exists(destino):
        os.remove(destino)
    n_email = n_whats = n_sem = 0
    for p in perfis:
        if p.get('status') != 'manter':
            continue
        r = cacar(p, leitor, a.simular, posts.get(p['id'], []))
        n_email += bool(r['email'])
        n_whats += bool(r['whatsapp'] and not r['email'])
        n_sem += not (r['email'] or r['whatsapp'])
        comum.acrescentar_csv(destino, {'perfil': p['usuario'], 'rede': p['rede'], 'link': p['link'],
                                        'negocio': p.get('negocio', ''), 'dor': fmt(p.get('dor')),
                                        'sonho': fmt(p.get('sonho')), 'objecao': fmt(p.get('objecao')),
                                        'pergunta': fmt(p.get('pergunta')), 'fato': fmt(p.get('fato')),
                                        'fato_frase': (p.get('fato') or {}).get('frase', '') if fmt(p.get('fato')) else '',
                                        'email': r['email'] or 'sem contato', 'fonte_email': r['fonte_email'],
                                        'whatsapp': r['whatsapp'], 'fonte_whatsapp': r['fonte_whatsapp']}, campos)
        contato = r['email'] or (f'WhatsApp {r["whatsapp"]}' if r['whatsapp'] else 'sem contato')
        print(f'  {p["usuario"]:<28} {contato:<40} {r["fonte_email"] or r["fonte_whatsapp"]}')
    print(f'\n{n_email} com e-mail · {n_whats} só com WhatsApp · {n_sem} sem contato · salvo em {comum.rel(destino)}')


if __name__ == '__main__':
    main()
