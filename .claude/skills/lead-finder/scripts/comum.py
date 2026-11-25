"""Peças comuns das skills do lead-finder.

Só biblioteca padrão do Python. Nunca imprime o token nem senhas.
"""
import csv
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime

AQUI = os.path.dirname(os.path.abspath(__file__))


def _achar_raiz():
    p = AQUI
    while p != os.path.dirname(p):
        if os.path.isdir(os.path.join(p, '.git')):
            return p
        p = os.path.dirname(p)
    return os.getcwd()


RAIZ = _achar_raiz()
PASTA_SKILL = os.path.join(RAIZ, '.claude', 'skills', 'lead-finder')
API = 'https://api.apify.com/v2'
LINHA_SAIR = 'Se não quiser receber mais, é só responder SAIR.'


# ---------- segredos e config ----------

def ler_env():
    """Lê .env da raiz; se faltar, usa site-mach/.env. Variáveis de ambiente vencem."""
    vals = {}
    for arq in (os.path.join(RAIZ, 'site-mach', '.env'), os.path.join(RAIZ, '.env')):
        if os.path.isfile(arq):
            with open(arq, encoding='utf-8') as f:
                for linha in f:
                    linha = linha.strip()
                    if not linha or linha.startswith('#') or '=' not in linha:
                        continue
                    k, v = linha.split('=', 1)
                    vals[k.strip()] = v.strip().strip('"').strip("'")
    for k in ('APIFY_TOKEN', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'):
        if os.environ.get(k):
            vals[k] = os.environ[k]
    return vals


def config():
    real = os.path.join(PASTA_SKILL, 'config.json')
    exemplo = os.path.join(PASTA_SKILL, 'config.example.json')
    arq = real if os.path.isfile(real) else exemplo
    with open(arq, encoding='utf-8') as f:
        c = json.load(f)
    c['_arquivo'] = os.path.relpath(arq, RAIZ)
    c['_e_exemplo'] = arq == exemplo
    return c


# ---------- pastas e arquivos ----------

def pasta_leads(simular=False):
    p = os.path.join(RAIZ, 'leads', 'exemplo') if simular else os.path.join(RAIZ, 'leads')
    os.makedirs(p, exist_ok=True)
    return p


def ler_json(caminho, padrao=None):
    if not os.path.isfile(caminho):
        return padrao
    with open(caminho, encoding='utf-8') as f:
        return json.load(f)


def salvar_json(caminho, dados):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)


def ler_csv(caminho):
    if not os.path.isfile(caminho):
        return []
    with open(caminho, encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def acrescentar_csv(caminho, linha, campos):
    novo = not os.path.isfile(caminho)
    with open(caminho, 'a', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=campos)
        if novo:
            w.writeheader()
        w.writerow({k: linha.get(k, '') for k in campos})


def agora():
    return datetime.now().strftime('%Y-%m-%d %H:%M')


def rel(caminho):
    return os.path.relpath(caminho, RAIZ)


# ---------- Apify ----------

def apify(metodo, caminho, params=None, corpo=None, com_token=True, timeout=120):
    url = API + caminho
    if params:
        url += '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, method=metodo)
    req.add_header('Accept', 'application/json')
    if com_token:
        token = ler_env().get('APIFY_TOKEN')
        if not token:
            raise SystemExit('Falta o APIFY_TOKEN no .env (raiz ou site-mach/.env).')
        req.add_header('Authorization', 'Bearer ' + token)
    if corpo is not None:
        req.data = json.dumps(corpo).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        msg = e.read().decode('utf-8', errors='replace')[:400]
        raise SystemExit(f'A Apify respondeu {e.code}: {msg}')
    except urllib.error.URLError as e:
        raise SystemExit(f'Não consegui falar com a Apify: {e.reason}')


def preco(item, plano='FREE'):
    """Resume o preço de um ator da Store. Devolve dict com por_mil (US$) quando der."""
    info = item.get('currentPricingInfo') or {}
    modelo = info.get('pricingModel') or 'FREE'
    out = {'modelo': modelo, 'por_mil': None, 'inicio': 0.0, 'nota': ''}

    def valor_tier(d, chave_tier, chave_simples):
        tiers = d.get(chave_tier)
        if isinstance(tiers, dict) and tiers:
            t = tiers.get(plano) or tiers.get('FREE') or next(iter(tiers.values()))
            for k in ('tieredEventPriceUsd', 'tieredPricePerUnitUsd', 'pricePerUnitUsd'):
                if isinstance(t, dict) and k in t:
                    return t[k]
        return d.get(chave_simples)

    if modelo == 'PAY_PER_EVENT':
        eventos = ((info.get('pricingPerEvent') or {}).get('actorChargeEvents')) or {}
        principal, extras = None, []
        for nome, ev in eventos.items():
            p = valor_tier(ev, 'eventTieredPricingUsd', 'eventPriceUsd') or 0
            titulo = ev.get('eventTitle') or nome
            if ev.get('isOneTimeEvent') or 'start' in nome.lower():
                out['inicio'] += p
            elif ev.get('isPrimaryEvent') and principal is None:
                principal = (titulo, p)
            else:
                extras.append((titulo, p))
        if principal is None and extras:
            principal = extras.pop(0)
        if principal:
            out['por_mil'] = round(principal[1] * 1000, 2)
            out['nota'] = f'cobra por "{principal[0]}"'
        if extras:
            out['nota'] += '; extras: ' + ', '.join(f'{t} US${p * 1000:.2f}/mil' for t, p in extras)
    elif modelo == 'PRICE_PER_DATASET_ITEM':
        p = valor_tier(info, 'tieredPricing', 'pricePerUnitUsd')
        if p is not None:
            out['por_mil'] = round(p * 1000, 2)
        out['nota'] = 'cobra por resultado'
    elif modelo == 'FLAT_PRICE_PER_MONTH':
        out['nota'] = f'aluguel de US${info.get("pricePerUnitUsd")}/mês + uso da plataforma'
    else:
        out['nota'] = 'grátis, paga só o uso da plataforma (varia)'
    return out


def rodar_ator(ator, entrada, max_itens, teto_usd, espera_max=900):
    """Roda um ator com teto de itens e de gasto. GASTA CRÉDITO."""
    caminho = '/acts/' + ator.replace('/', '~') + '/runs'
    params = {'maxItems': max_itens, 'maxTotalChargeUsd': teto_usd}
    run = apify('POST', caminho, params=params, corpo=entrada)['data']
    run_id = run['id']
    print(f'  rodando {ator} (execução {run_id})...', flush=True)
    inicio = time.time()
    while run.get('status') in ('READY', 'RUNNING'):
        if time.time() - inicio > espera_max:
            apify('POST', f'/actor-runs/{run_id}/abort')
            raise SystemExit('Demorou demais: parei a execução para não gastar à toa.')
        time.sleep(8)
        run = apify('GET', f'/actor-runs/{run_id}')['data']
    itens = apify('GET', f'/datasets/{run["defaultDatasetId"]}/items',
                  params={'clean': 'true', 'format': 'json', 'limit': max_itens}, timeout=300)
    gasto = run.get('usageTotalUsd')
    print(f'  status: {run.get("status")} · {len(itens)} resultados · gasto informado: US${gasto}')
    return itens, run.get('status'), gasto


# ---------- texto ----------

def normalizar(t):
    t = unicodedata.normalize('NFC', t or '')  # o mesmo "ú" pode vir escrito de dois jeitos no Unicode
    t = t.replace('“', '"').replace('”', '"').replace('’', "'")
    return re.sub(r'\s+', ' ', t).strip()


def pede_ok(msg):
    print('\n' + '=' * 60)
    print('PARADA PARA APROVAÇÃO: ' + msg)
    print('=' * 60)


if __name__ == '__main__':
    env = ler_env()
    print('APIFY_TOKEN:', 'encontrado' if env.get('APIFY_TOKEN') else 'FALTANDO')
    print('GMAIL_USER:', 'encontrado' if env.get('GMAIL_USER') else 'faltando')
    print('GMAIL_APP_PASSWORD:', 'encontrado' if env.get('GMAIL_APP_PASSWORD') else 'faltando')
    print('config:', config()['_arquivo'])
    sys.exit(0)
