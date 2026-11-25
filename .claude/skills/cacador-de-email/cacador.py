"""Caçador de e-mail do lead-finder.

Só aceita e-mail que a pessoa PUBLICOU: campo de contato do perfil, bio, link na bio,
site da empresa (início, contato, rodapé). Não adivinha formato, não usa vazamento.
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


def cacar(p, leitor, simular):
    """Devolve (email, fonte) ou ('', '')."""
    if p.get('email_publico'):
        e = emails_no_texto(p['email_publico'], simular)
        if e:
            return e[0], f'contato público do perfil ({p["link"]})'
    e = emails_no_texto(p.get('bio'), simular)
    if e:
        return e[0], f'bio do perfil ({p["link"]})'
    sementes = [p.get('link_bio')] + list(p.get('outros_links') or []) + re.findall(r'https?://[^\s"\'<>]+', p.get('bio') or '')
    fila = []
    for u in sementes:
        if u and not nao_e_site(u) and limpar_url(u) not in fila:
            fila.append(limpar_url(u))
    fila.sort(key=lambda u: 1 if any(ag in dominio(u) for ag in AGREGADORES) else 0)  # site próprio primeiro
    vistos, lidas = set(), 0
    while fila and lidas < MAX_PAGINAS:
        url = fila.pop(0)
        if url in vistos or nao_e_site(url):
            continue
        vistos.add(url)
        pagina = leitor.ler(url)
        lidas += 1
        achados = emails_no_texto(pagina, simular)
        if achados:
            site = dominio(url)
            achados.sort(key=lambda x: 0 if x.split('@')[1] == site or site.endswith('.' + x.split('@')[1])
                          or x.split('@')[1].endswith('.' + site) else 1)
            return achados[0], url
        links = links_da_pagina(url + '/', pagina)
        if any(ag in dominio(url) for ag in AGREGADORES):  # link na bio: segue para o site da empresa
            novos = [u for u in links if not nao_e_site(u) and not any(ag in dominio(u) for ag in AGREGADORES)][:3]
        else:
            mesmos = [u for u in links if dominio(u) == dominio(url) and re.search(r'contat|contact|fale|sobre|about', u, re.I)]
            novos = mesmos[:2] + [raiz_do_site(url) + c for c in PAGINAS_CONTATO][:2]
        fila = [u for u in novos if u not in vistos and u not in fila] + fila
    return '', ''


def fmt(c):
    return f'"{c["citacao"]}" ({c["link"]})' if c.get('citacao') else ''


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--simular', action='store_true')
    a = ap.parse_args()
    pasta = comum.pasta_leads(a.simular)
    perfis = comum.ler_json(os.path.join(pasta, 'perfis.json'))
    if perfis is None:
        raise SystemExit('Falta perfis.json. Rode o montador antes.')
    leitor = Leitor(a.simular, pasta)
    campos = ['perfil', 'rede', 'link', 'negocio', 'dor', 'sonho', 'objecao', 'email', 'fonte_email']
    destino = os.path.join(pasta, 'lista.csv')
    if os.path.exists(destino):
        os.remove(destino)
    com, sem = 0, 0
    for p in perfis:
        if p.get('status') != 'manter':
            continue
        email, fonte = cacar(p, leitor, a.simular)
        com, sem = (com + 1, sem) if email else (com, sem + 1)
        comum.acrescentar_csv(destino, {'perfil': p['usuario'], 'rede': p['rede'], 'link': p['link'],
                                        'negocio': p.get('negocio', ''), 'dor': fmt(p['dor']),
                                        'sonho': fmt(p['sonho']), 'objecao': fmt(p['objecao']),
                                        'email': email or 'sem contato', 'fonte_email': fonte}, campos)
        print(f'  {p["usuario"]:<28} {email or "sem contato":<42} {fonte}')
    print(f'\n{com} com e-mail público · {sem} sem contato · salvo em {comum.rel(destino)}')


if __name__ == '__main__':
    main()
