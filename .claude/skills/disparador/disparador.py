"""Disparador do lead-finder.

  rascunho          cria leads/mensagens.json para quem publicou e-mail ou WhatsApp e tem uma frase citada
                    (abre pela DOR; sem dor, pelo DESEJO; sem desejo, pela PERGUNTA da pessoa;
                     sem nada disso, por um FATO público do próprio negócio, apoiado numa citação)
  conferir          checa as regras de cada mensagem (começa pela frase, sem link, sem preço...)
  mostrar           mostra TODAS as mensagens prontas, numeradas, para o dono aprovar
  aprovar --numeros 1,2 | --todas      marca como aprovadas
  cortar  --numeros 3                  tira da lista
  enviar --pode-enviar                 envia as aprovadas de e-mail pelo Gmail (máx. por dia, com intervalo)
  whatsapp                             lista as aprovadas de WhatsApp com link pronto para o DONO enviar à mão
  registrar --numeros 1,2              marca como enviadas as que o dono mandou à mão
  sair --contato x                     coloca e-mail ou WhatsApp na lista de não contatar
  checar-sair                          lê as respostas no Gmail e coloca quem pediu SAIR na lista
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
import urllib.parse
from datetime import date
from email.message import EmailMessage

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lead-finder', 'scripts'))
import comum  # noqa: E402

C_ENVIADOS = ['data', 'canal', 'contato', 'perfil', 'rede', 'link', 'assunto']
C_NAO = ['data', 'contato', 'perfil', 'motivo']
ORDEM_ABERTURA = (('dor', 'dor'), ('sonho', 'desejo'), ('pergunta', 'pergunta'), ('fato', 'fato'))
ARTIGO = {'dor': 'pela dor', 'desejo': 'pelo desejo', 'pergunta': 'pela pergunta', 'fato': 'pelo fato'}
RE_LINK = re.compile(r'(https?://|www\.|\b[a-z0-9-]+\.(com|br|net|org|io|app|site|me|link)\b)', re.I)
RE_PRECO = re.compile(r'(R\$|\breais\b|\bpre[çc]os?\b|\bvalor(es)?\b|\bdesconto|\bgr[áa]tis\b|\bpromo[çc][ãa]o|\d+\s*mil\b)', re.I)
RE_VI_PERFIL = re.compile(r'\bvi\s+(o\s+|a\s+)?(seu|sua|teu|tua)\s+(perfil|post|instagram|tiktok|conta|p[áa]gina|v[íi]deo)', re.I)


def caminhos(simular):
    p = comum.pasta_leads(simular)
    return {k: os.path.join(p, v) for k, v in {'lista': 'lista.csv', 'msgs': 'mensagens.json',
                                               'env': 'enviados.csv', 'nao': 'nao-contatar.csv',
                                               'md': 'mensagens-para-aprovar.md',
                                               'wa': 'whatsapp-para-chamar.md'}.items()}


def citacao(campo_csv):
    m = re.match(r'^"(.*)" \((.*)\)$', campo_csv or '')
    return (m.group(1), m.group(2)) if m else ('', '')


def bloqueados(c):
    """Tudo que já recebeu ou pediu para sair, por contato, link e nome do perfil."""
    env = comum.ler_csv(c['env'])
    b = {}
    for r in comum.ler_csv(c['nao']):
        for k in (r.get('contato'), r.get('perfil')):
            if k:
                b[k.lower()] = f'pediu para sair ({r["data"]})'
    for r in env:
        for k in (r.get('contato'), r.get('link'), r.get('perfil')):
            if k:
                b.setdefault(k.lower(), f'já recebeu em {r["data"]}')
    return b, env


def motivo_bloqueio(m, b):
    for k in (m.get('email'), m.get('whatsapp'), m.get('link'), m.get('perfil')):
        if k and k.lower() in b:
            return b[k.lower()]
    return ''


def montar(m, cfg):
    assinatura = f'{cfg["remetente_nome"]}\n{cfg["empresa"]}'
    return f'{m["corpo"].strip()}\n\n{assinatura}\n\n{comum.LINHA_SAIR}'


def problemas(m, cfg):
    out = []
    corpo = m.get('corpo', '').strip()
    frase = comum.normalizar(m.get('abertura', ''))
    if not corpo:
        return ['corpo vazio']
    inicio = comum.normalizar(corpo).lstrip('"').lstrip()
    if not frase or not inicio.startswith(frase):
        out.append(f'não começa pela frase de abertura ({m.get("tipo_abertura", "?")})')
    if m.get('tipo_abertura') == 'fato' and not m.get('base_fato'):
        out.append('fato sem citação que o comprove')
    resto = comum.normalizar(corpo).replace(frase, '', 1)
    assunto = m.get('assunto', '') if m.get('canal') == 'email' else ''
    if RE_LINK.search(resto) or RE_LINK.search(assunto):
        out.append('tem link (proibido na primeira mensagem)')
    if RE_PRECO.search(resto) or RE_PRECO.search(assunto):
        out.append('fala de preço ou valor')
    if RE_VI_PERFIL.search(corpo) or RE_VI_PERFIL.search(assunto):
        out.append('usa "vi seu perfil" ou parecido')
    if not corpo.splitlines()[-1].strip().endswith('?'):
        out.append('não termina com pergunta')
    if len(comum.normalizar(corpo).split()) > 90:
        out.append('longa demais (mais de 90 palavras)')
    if comum.LINHA_SAIR in corpo or cfg['remetente_nome'] in corpo:
        out.append('não escreva assinatura nem a linha do SAIR: o script coloca sozinho')
    if m.get('canal') == 'email':
        a = m.get('assunto', '').strip()
        if not a or len(a) > 60 or a.isupper():
            out.append('assunto vazio, longo (máx. 60) ou em CAIXA ALTA')
    if cfg.get('_e_exemplo') and not m.get('_simulado'):
        out.append('falta o config.json com seu nome (copie do config.example.json)')
    return out


def cmd_rascunho(a, c, cfg):
    antigas = {m['perfil']: m for m in comum.ler_json(c['msgs'], [])}
    b, _ = bloqueados(c)
    msgs, fora = [], []
    for r in comum.ler_csv(c['lista']):
        abertura, link_ab, tipo, base = '', '', '', ''
        for campo, nome in ORDEM_ABERTURA:
            cit, lk = citacao(r.get(campo, ''))
            if campo == 'fato' and cit:  # o fato abre com a frase curta; a citação fica como prova
                if r.get('fato_frase'):
                    abertura, link_ab, tipo, base = r['fato_frase'], lk, nome, cit
                    break
                continue
            if cit:
                abertura, link_ab, tipo = cit, lk, nome
                break
        email_ = '' if r['email'] == 'sem contato' else r['email']
        whats = r.get('whatsapp', '')
        if not email_ and not whats:
            fora.append((r['perfil'], 'não publicou e-mail nem WhatsApp'))
            continue
        if not abertura:
            fora.append((r['perfil'], 'sem dor, desejo, pergunta nem fato público: sem frase para abrir'))
            continue
        m = antigas.get(r['perfil']) or {
            'perfil': r['perfil'], 'rede': r['rede'], 'link': r['link'], 'negocio': r['negocio'],
            'canal': 'email' if email_ else 'whatsapp', 'email': email_, 'whatsapp': whats,
            'para': email_ or whats, 'abertura': abertura, 'tipo_abertura': tipo, 'link_abertura': link_ab,
            'base_fato': base,
            'assunto': '', 'corpo': '', 'status': 'rascunho'}
        if a.simular:
            m['_simulado'] = True
        bloq = motivo_bloqueio(m, b)
        if bloq:
            fora.append((r['perfil'], bloq))
            continue
        msgs.append(m)
    for i, m in enumerate(msgs, 1):
        m['n'] = i
    comum.salvar_json(c['msgs'], msgs)
    print(f'{len(msgs)} mensagens para escrever em {comum.rel(c["msgs"])}')
    for m in msgs:
        print(f'  {m["n"]}. {m["perfil"]} · {m["canal"]} · abre {ARTIGO[m["tipo_abertura"]]}: "{m["abertura"]}"')
    for p, motivo in fora:
        print(f'  fora: {p} — {motivo}')


def cmd_conferir(a, c, cfg):
    msgs = comum.ler_json(c['msgs'], [])
    ruins = 0
    ativas = [m for m in msgs if m['status'] not in ('cortada', 'enviada')]
    for m in ativas:
        pr = problemas(m, cfg)
        ruins += bool(pr)
        print(f'  {m["n"]:>2}. {m["perfil"]:<28} ' + ('OK' if not pr else 'PROBLEMA: ' + '; '.join(pr)))
    print(f'\n{len(ativas) - ruins} ok · {ruins} com problema')
    return ruins


def cmd_mostrar(a, c, cfg):
    if cmd_conferir(a, c, cfg):
        raise SystemExit('Corrija as mensagens com problema antes de mostrar ao dono.')
    msgs = [m for m in comum.ler_json(c['msgs'], []) if m['status'] not in ('cortada', 'enviada')]
    partes = [f'# {len(msgs)} mensagens para aprovar', '']
    for m in msgs:
        canal = 'E-mail (sai pelo Gmail)' if m['canal'] == 'email' else 'WhatsApp (você envia à mão)'
        partes += [f'## {m["n"]}. {m["perfil"]} ({m["rede"]}) · {canal} · status: {m["status"]}',
                   f'Para: {m["para"]}  ']
        if m['canal'] == 'email':
            partes.append(f'Assunto: {m["assunto"]}  ')
        if m['tipo_abertura'] == 'fato':
            partes.append(f'Abre por um fato público, apoiado em: "{m["base_fato"]}" ({m["link_abertura"]})')
        else:
            partes.append(f'Abre {ARTIGO[m["tipo_abertura"]]}, citada de: {m["link_abertura"]}')
        partes += ['', '```', montar(m, cfg), '```', '']
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


def registrar_envio(c, m, b):
    reg = {'data': comum.agora(), 'canal': m['canal'], 'contato': m['para'], 'perfil': m['perfil'],
           'rede': m['rede'], 'link': m['link'], 'assunto': m.get('assunto', '')}
    comum.acrescentar_csv(c['env'], reg, C_ENVIADOS)
    for k in (m['para'], m['link'], m['perfil']):
        b[k.lower()] = f'já recebeu em {reg["data"]}'
    m['status'] = 'enviada'


def enviados_hoje(env, canal):
    hoje = date.today().isoformat()
    return sum(1 for r in env if r['data'].startswith(hoje) and r.get('canal', 'email') == canal)


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
    b, env = bloqueados(c)
    ja_hoje = enviados_hoje(env, 'email')
    limite = int(cfg.get('limite_diario', 20))
    fila = [m for m in msgs if m['status'] == 'aprovada' and m['canal'] == 'email']
    print(f'{len(fila)} e-mails aprovados · {ja_hoje} já enviados hoje · limite {limite}/dia')
    enviados_agora = 0
    for m in fila:
        bloq = motivo_bloqueio(m, b)
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
        registrar_envio(c, m, b)
        comum.salvar_json(c['msgs'], msgs)
        enviados_agora += 1
    print(f'\n{enviados_agora} enviados agora. Registro em {comum.rel(c["env"])}')


def cmd_whatsapp(a, c, cfg):
    """Monta a lista para o DONO mandar à mão. O script nunca envia nada pelo WhatsApp."""
    msgs = comum.ler_json(c['msgs'], [])
    b, env = bloqueados(c)
    vagas = int(cfg.get('limite_diario', 20)) - enviados_hoje(env, 'whatsapp')
    fila = [m for m in msgs if m['status'] == 'aprovada' and m['canal'] == 'whatsapp'
            and not motivo_bloqueio(m, b) and not problemas(m, cfg)][:max(0, vagas)]
    partes = [f'# WhatsApp para chamar hoje ({len(fila)})', '',
              'Toque no link: o WhatsApp abre com a mensagem pronta. Confira e envie.',
              'Depois diga ao Claude quais números você enviou, para registrar.', '']
    for m in fila:
        numero = re.sub(r'\D', '', m['whatsapp'])
        link = f'https://wa.me/{numero}?text=' + urllib.parse.quote(montar(m, cfg))
        partes += [f'## {m["n"]}. {m["perfil"]} · {m["whatsapp"]}', link, '']
    with open(c['wa'], 'w', encoding='utf-8') as f:
        f.write('\n'.join(partes))
    print('\n'.join(partes))
    print(f'Salvo em {comum.rel(c["wa"])}')


def cmd_registrar(a, c, cfg):
    msgs = comum.ler_json(c['msgs'], [])
    nums = {int(x) for x in (a.numeros or '').split(',') if x.strip()}
    if not nums:
        raise SystemExit('Informe --numeros com as mensagens que o dono já enviou.')
    b, _ = bloqueados(c)
    for m in msgs:
        if m['n'] in nums and m['status'] != 'enviada':
            if motivo_bloqueio(m, b):
                print(f'  {m["n"]}. {m["perfil"]}: já registrada ou bloqueada, não registrei de novo')
                continue
            registrar_envio(c, m, b)
            print(f'  {m["n"]}. {m["perfil"]} registrada como enviada ({m["canal"]})')
    comum.salvar_json(c['msgs'], msgs)


def cmd_sair(a, c, cfg):
    contato = a.contato or a.email
    if not contato:
        raise SystemExit('Informe --contato (e-mail ou WhatsApp)')
    comum.acrescentar_csv(c['nao'], {'data': comum.agora(), 'contato': contato.lower(), 'perfil': a.perfil or '',
                                     'motivo': a.motivo or 'pediu para sair'}, C_NAO)
    print(f'{contato} está na lista de não contatar. Nunca mais recebe nada.')


def checar_sair(c, env_vars):
    enviados = {r['contato'].lower() for r in comum.ler_csv(c['env']) if r.get('canal', 'email') == 'email'}
    ja = {r['contato'].lower() for r in comum.ler_csv(c['nao'])}
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
                    comum.acrescentar_csv(c['nao'], {'data': comum.agora(), 'contato': addr, 'perfil': '',
                                                     'motivo': 'respondeu SAIR'}, C_NAO)
                    novos += 1
                    break
    print(f'Respostas conferidas: {novos} pedido(s) novo(s) de SAIR.')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('cmd', choices=('rascunho', 'conferir', 'mostrar', 'aprovar', 'cortar', 'enviar', 'whatsapp',
                                    'registrar', 'sair', 'checar-sair'))
    ap.add_argument('--simular', action='store_true')
    ap.add_argument('--numeros')
    ap.add_argument('--todas', action='store_true')
    ap.add_argument('--pode-enviar', action='store_true')
    ap.add_argument('--contato')
    ap.add_argument('--email', help='o mesmo que --contato')
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
     'enviar': cmd_enviar, 'whatsapp': cmd_whatsapp, 'registrar': cmd_registrar,
     'sair': cmd_sair}[a.cmd](a, c, cfg)


if __name__ == '__main__':
    main()
