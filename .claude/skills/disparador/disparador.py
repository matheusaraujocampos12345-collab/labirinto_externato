"""Disparador do lead-finder.

  rascunho          cria leads/mensagens.json para quem tem e-mail público e uma DOR citada
  conferir          checa as regras de cada mensagem (começa pela dor, sem link, sem preço...)
  mostrar           mostra TODAS as mensagens prontas, numeradas, para o dono aprovar
  aprovar --numeros 1,2 | --todas      marca como aprovadas
  cortar  --numeros 3                  tira da lista
  enviar --pode-enviar                 envia as aprovadas pelo Gmail (máx. por dia, com intervalo)
  sair --email x@y                     coloca na lista de não contatar
  checar-sair                          lê as respostas no Gmail e coloca quem pediu SAIR na lista
  registrar --numeros 1,2              marca como enviadas as que o dono mandou à mão (rascunhos do Gmail)
Use --simular para trabalhar em leads/exemplo/ sem enviar nada.
"""
import argparse
import email
import imaplib
import os
import random
import re
import smtplib
import sys
import time
from datetime import date
from email.message import EmailMessage

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lead-finder', 'scripts'))
import comum  # noqa: E402

C_ENVIADOS = ['data', 'email', 'perfil', 'rede', 'link', 'assunto']
C_NAO = ['data', 'email', 'perfil', 'motivo']
RE_LINK = re.compile(r'(https?://|www\.|\b[a-z0-9-]+\.(com|br|net|org|io|app|site|me|link)\b)', re.I)
RE_PRECO = re.compile(r'(R\$|\breais\b|\bpre[çc]os?\b|\bvalor(es)?\b|\bdesconto|\bgr[áa]tis\b|\bpromo[çc][ãa]o|\d+\s*mil\b)', re.I)
RE_VI_PERFIL = re.compile(r'\bvi\s+(o\s+|a\s+)?(seu|sua|teu|tua)\s+(perfil|post|instagram|tiktok|conta|p[áa]gina|v[íi]deo)', re.I)


def caminhos(simular):
    p = comum.pasta_leads(simular)
    return {k: os.path.join(p, v) for k, v in {'lista': 'lista.csv', 'msgs': 'mensagens.json',
                                               'env': 'enviados.csv', 'nao': 'nao-contatar.csv',
                                               'md': 'mensagens-para-aprovar.md'}.items()}


def citacao(campo_csv):
    m = re.match(r'^"(.*)" \((.*)\)$', campo_csv or '')
    return (m.group(1), m.group(2)) if m else ('', '')


def bloqueados(c):
    nao = comum.ler_csv(c['nao'])
    env = comum.ler_csv(c['env'])
    b_email = {r['email'].lower(): f'pediu para sair ({r["data"]})' for r in nao if r.get('email')}
    b_perfil = {r['perfil'].lower(): f'pediu para sair ({r["data"]})' for r in nao if r.get('perfil')}
    for r in env:
        b_email.setdefault(r['email'].lower(), f'já recebeu em {r["data"]}')
        b_perfil.setdefault(r['link'].lower(), f'já recebeu em {r["data"]}')
    return b_email, b_perfil, env


def motivo_bloqueio(m, b_email, b_perfil):
    return b_email.get(m['para'].lower()) or b_perfil.get(m['link'].lower()) or b_perfil.get(m['perfil'].lower())


def montar(m, cfg):
    assinatura = f'{cfg["remetente_nome"]}\n{cfg["empresa"]}'
    return f'{m["corpo"].strip()}\n\n{assinatura}\n\n{comum.LINHA_SAIR}'


def problemas(m, cfg):
    out = []
    corpo = m.get('corpo', '').strip()
    dor = comum.normalizar(m.get('dor', ''))
    inicio = comum.normalizar(corpo).lstrip('"').lstrip()
    if not corpo:
        return ['corpo vazio']
    if not inicio.startswith(dor):
        out.append('não começa pela frase exata da dor')
    resto = comum.normalizar(corpo).replace(dor, '', 1)
    if RE_LINK.search(resto) or RE_LINK.search(m.get('assunto', '')):
        out.append('tem link (proibido na primeira mensagem)')
    if RE_PRECO.search(resto) or RE_PRECO.search(m.get('assunto', '')):
        out.append('fala de preço ou valor')
    if RE_VI_PERFIL.search(corpo) or RE_VI_PERFIL.search(m.get('assunto', '')):
        out.append('usa "vi seu perfil" ou parecido')
    if not corpo.splitlines()[-1].strip().endswith('?'):
        out.append('não termina com pergunta')
    if len(comum.normalizar(corpo).split()) > 90:
        out.append('longa demais (mais de 90 palavras)')
    if comum.LINHA_SAIR in corpo or cfg['remetente_nome'] in corpo:
        out.append('não escreva assinatura nem a linha do SAIR: o script coloca sozinho')
    a = m.get('assunto', '').strip()
    if not a or len(a) > 60 or a.isupper():
        out.append('assunto vazio, longo (máx. 60) ou em CAIXA ALTA')
    if cfg.get('_e_exemplo') and not m.get('_simulado'):
        out.append('falta o config.json com seu nome (copie do config.example.json)')
    return out


def cmd_rascunho(a, c, cfg):
    linhas = comum.ler_csv(c['lista'])
    antigas = {m['perfil']: m for m in comum.ler_json(c['msgs'], [])}
    b_email, b_perfil, _ = bloqueados(c)
    msgs, fora = [], []
    for r in linhas:
        dor, link_dor = citacao(r['dor'])
        if r['email'] == 'sem contato':
            fora.append((r['perfil'], 'sem e-mail público'))
            continue
        if not dor:
            fora.append((r['perfil'], 'sem DOR citada: não dá para escrever a primeira frase'))
            continue
        m = antigas.get(r['perfil']) or {'perfil': r['perfil'], 'rede': r['rede'], 'link': r['link'],
                                          'para': r['email'], 'negocio': r['negocio'], 'dor': dor,
                                          'link_dor': link_dor, 'assunto': '', 'corpo': '', 'status': 'rascunho'}
        if a.simular:
            m['_simulado'] = True
        bloq = motivo_bloqueio(m, b_email, b_perfil)
        if bloq:
            fora.append((r['perfil'], bloq))
            continue
        msgs.append(m)
    for i, m in enumerate(msgs, 1):
        m['n'] = i
    comum.salvar_json(c['msgs'], msgs)
    print(f'{len(msgs)} mensagens para escrever em {comum.rel(c["msgs"])}')
    for p, motivo in fora:
        print(f'  fora: {p} — {motivo}')


def cmd_conferir(a, c, cfg):
    msgs = comum.ler_json(c['msgs'], [])
    ruins = 0
    for m in msgs:
        if m['status'] == 'cortada':
            continue
        pr = problemas(m, cfg)
        ruins += bool(pr)
        print(f'  {m["n"]:>2}. {m["perfil"]:<28} ' + ('OK' if not pr else 'PROBLEMA: ' + '; '.join(pr)))
    print(f'\n{len(msgs) - ruins} ok · {ruins} com problema')
    return ruins


def cmd_mostrar(a, c, cfg):
    if cmd_conferir(a, c, cfg):
        raise SystemExit('Corrija as mensagens com problema antes de mostrar ao dono.')
    msgs = [m for m in comum.ler_json(c['msgs'], []) if m['status'] != 'cortada']
    partes = [f'# {len(msgs)} mensagens para aprovar', '']
    for m in msgs:
        partes += [f'## {m["n"]}. {m["perfil"]} ({m["rede"]}) · status: {m["status"]}',
                   f'Para: {m["para"]}  ', f'Assunto: {m["assunto"]}  ',
                   f'Dor citada de: {m["link_dor"]}', '', '```', montar(m, cfg), '```', '']
    with open(c['md'], 'w', encoding='utf-8') as f:
        f.write('\n'.join(partes))
    print('\n'.join(partes))
    comum.pede_ok('o dono aprova, edita ou corta cada mensagem. Nada é enviado antes de "pode enviar".')


def mudar_status(a, c, novo):
    msgs = comum.ler_json(c['msgs'], [])
    nums = None if a.todas else {int(x) for x in (a.numeros or '').split(',') if x.strip()}
    for m in msgs:
        if m['status'] != 'enviada' and (nums is None or m['n'] in nums):
            m['status'] = novo
    comum.salvar_json(c['msgs'], msgs)
    print(', '.join(f'{m["n"]}:{m["status"]}' for m in msgs))


def cmd_enviar(a, c, cfg):
    if not a.pode_enviar:
        raise SystemExit('Só envio com --pode-enviar, depois de o dono dizer "pode enviar".')
    env_vars = comum.ler_env()
    if not a.simular and not (env_vars.get('GMAIL_USER') and env_vars.get('GMAIL_APP_PASSWORD')):
        raise SystemExit('Faltam GMAIL_USER e GMAIL_APP_PASSWORD no .env (veja o README).')
    if not a.simular:
        try:
            checar_sair(c, env_vars)
        except Exception as e:  # sem IMAP não trava, mas avisa
            print(f'Aviso: não consegui ler as respostas no Gmail ({type(e).__name__}). Confira SAIR à mão.')
    msgs = comum.ler_json(c['msgs'], [])
    b_email, b_perfil, env = bloqueados(c)
    hoje = date.today().isoformat()
    ja_hoje = sum(1 for r in env if r['data'].startswith(hoje))
    limite = int(cfg.get('limite_diario', 20))
    fila = [m for m in msgs if m['status'] == 'aprovada']
    print(f'{len(fila)} aprovadas · {ja_hoje} já enviadas hoje · limite {limite}/dia')
    enviados_agora = 0
    for i, m in enumerate(fila):
        bloq = motivo_bloqueio(m, b_email, b_perfil)
        if bloq:
            print(f'  BLOQUEADO {m["perfil"]} <{m["para"]}>: {bloq}')
            continue
        if problemas(m, cfg):
            print(f'  PULEI {m["perfil"]}: a mensagem não passa na conferência')
            continue
        if ja_hoje + enviados_agora >= limite:
            print(f'Limite de {limite} por dia atingido. O resto fica para amanhã.')
            break
        if enviados_agora:
            minutos = random.uniform(cfg.get('intervalo_min_minutos', 3), cfg.get('intervalo_max_minutos', 7))
            print(f'  esperando {minutos:.1f} min...', flush=True)
            if not a.simular:
                time.sleep(minutos * 60)
        if a.simular:
            print(f'  [SIMULADO] enviaria para {m["para"]}: "{m["assunto"]}"')
        else:
            msg = EmailMessage()
            msg['From'] = f'{cfg["remetente_nome"]} <{env_vars["GMAIL_USER"]}>'
            msg['To'] = m['para']
            msg['Subject'] = m['assunto']
            msg['List-Unsubscribe'] = f'<mailto:{env_vars["GMAIL_USER"]}?subject=SAIR>'
            msg.set_content(montar(m, cfg))
            with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as s:
                s.login(env_vars['GMAIL_USER'], env_vars['GMAIL_APP_PASSWORD'])
                s.send_message(msg)
            print(f'  enviado para {m["para"]}', flush=True)
        reg = {'data': comum.agora(), 'email': m['para'], 'perfil': m['perfil'], 'rede': m['rede'],
               'link': m['link'], 'assunto': m['assunto']}
        comum.acrescentar_csv(c['env'], reg, C_ENVIADOS)
        b_email[m['para'].lower()] = f'já recebeu em {reg["data"]}'
        b_perfil[m['link'].lower()] = b_email[m['para'].lower()]
        m['status'] = 'enviada'
        comum.salvar_json(c['msgs'], msgs)
        enviados_agora += 1
    print(f'\n{enviados_agora} enviadas agora. Registro em {comum.rel(c["env"])}')


def cmd_registrar(a, c, cfg):
    msgs = comum.ler_json(c['msgs'], [])
    nums = {int(x) for x in (a.numeros or '').split(',') if x.strip()}
    if not nums:
        raise SystemExit('Informe --numeros com as mensagens que o dono já enviou.')
    b_email, b_perfil, _ = bloqueados(c)
    for m in msgs:
        if m['n'] in nums and m['status'] != 'enviada':
            if motivo_bloqueio(m, b_email, b_perfil):
                print(f'  {m["n"]}. {m["perfil"]}: já registrada ou bloqueada, não registrei de novo')
                continue
            comum.acrescentar_csv(c['env'], {'data': comum.agora(), 'email': m['para'], 'perfil': m['perfil'],
                                             'rede': m['rede'], 'link': m['link'], 'assunto': m['assunto']}, C_ENVIADOS)
            m['status'] = 'enviada'
            print(f'  {m["n"]}. {m["perfil"]} registrada como enviada')
    comum.salvar_json(c['msgs'], msgs)


def cmd_sair(a, c, cfg):
    if not a.email:
        raise SystemExit('Informe --email')
    comum.acrescentar_csv(c['nao'], {'data': comum.agora(), 'email': a.email.lower(), 'perfil': a.perfil or '',
                                     'motivo': a.motivo or 'pediu para sair'}, C_NAO)
    print(f'{a.email} está na lista de não contatar. Nunca mais recebe nada.')


def checar_sair(c, env_vars):
    enviados = {r['email'].lower() for r in comum.ler_csv(c['env'])}
    ja = {r['email'].lower() for r in comum.ler_csv(c['nao'])}
    novos = 0
    with imaplib.IMAP4_SSL('imap.gmail.com', timeout=30) as im:
        im.login(env_vars['GMAIL_USER'], env_vars['GMAIL_APP_PASSWORD'])
        im.select('INBOX', readonly=True)
        for addr in sorted(enviados - ja):
            _, ids = im.search(None, 'FROM', f'"{addr}"')
            for i in (ids[0] or b'').split()[-5:]:
                _, dados = im.fetch(i, '(RFC822)')
                msg = email.message_from_bytes(dados[0][1])
                texto = ''
                for parte in msg.walk():
                    if parte.get_content_type() == 'text/plain':
                        texto = parte.get_payload(decode=True).decode(parte.get_content_charset() or 'utf-8', 'replace')
                        break
                novo = []
                for linha in texto.splitlines():  # corta o trecho citado da nossa mensagem
                    if linha.startswith('>') or re.match(r'^(Em .* escreveu|On .* wrote)', linha.strip()):
                        break
                    novo.append(linha)
                if re.search(r'\bsair\b', ' '.join(novo), re.I) or re.search(r'\bsair\b', msg.get('Subject', ''), re.I):
                    comum.acrescentar_csv(c['nao'], {'data': comum.agora(), 'email': addr, 'perfil': '',
                                                     'motivo': 'respondeu SAIR'}, C_NAO)
                    novos += 1
                    break
    print(f'Respostas conferidas: {novos} pedido(s) novo(s) de SAIR.')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('cmd', choices=('rascunho', 'conferir', 'mostrar', 'aprovar', 'cortar', 'enviar', 'sair',
                                    'checar-sair', 'registrar'))
    ap.add_argument('--simular', action='store_true')
    ap.add_argument('--numeros')
    ap.add_argument('--todas', action='store_true')
    ap.add_argument('--pode-enviar', action='store_true')
    ap.add_argument('--email')
    ap.add_argument('--perfil')
    ap.add_argument('--motivo')
    a = ap.parse_args()
    c = caminhos(a.simular)
    cfg = comum.config()
    if a.simular:
        cfg = {**cfg, 'remetente_nome': 'Nome de Exemplo', 'empresa': 'MACH Estúdio'}
    if a.cmd == 'checar-sair':
        if a.simular:
            raise SystemExit('checar-sair precisa do Gmail de verdade.')
        return checar_sair(c, comum.ler_env())
    {'rascunho': cmd_rascunho, 'conferir': cmd_conferir, 'mostrar': cmd_mostrar,
     'aprovar': lambda a, c, cfg: mudar_status(a, c, 'aprovada'),
     'cortar': lambda a, c, cfg: mudar_status(a, c, 'cortada'),
     'enviar': cmd_enviar, 'sair': cmd_sair, 'registrar': cmd_registrar}[a.cmd](a, c, cfg)


if __name__ == '__main__':
    main()
