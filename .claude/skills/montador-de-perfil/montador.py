"""Montador de perfil do lead-finder (dor, sonho, objeção e pergunta, sempre citados).

  preparar   lê leads/bruto.json e cria leads/para-analisar.md (o Claude lê e decide)
  validar    confere leads/analise.json: toda citação precisa existir, letra por letra,
             no texto público de origem. Citação que não existe é APAGADA. Gera leads/perfis.json
Use --simular para trabalhar em leads/exemplo/.
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'lead-finder', 'scripts'))
import comum  # noqa: E402

CAMPOS = ('dor', 'sonho', 'objecao', 'pergunta', 'fato')
SINAIS_CONCORRENTE = r'(cria(mos)? sites?|web ?design|desenvolv\w+ de sites?|landing pages?|ag[êe]ncia|social media|' \
                     r'marketing digital|tr[áa]fego pago|programador|designer)'
SINAIS_ROBO = r'(ganhe seguidores|seguidores gr[áa]tis|sorteio|100% real|clique no link|renda extra|pix na hora)'


def pistas(p):
    out = []
    texto = f'{p.get("nome", "")} {p.get("bio", "")} {p.get("categoria", "")}'.lower()
    if re.search(SINAIS_CONCORRENTE, texto):
        out.append('concorrente?')
    if (p.get('seguidores') or 0) >= 100000 or p.get('verificado'):
        out.append('marca grande?')
    if re.search(SINAIS_ROBO, texto + ' ' + ' '.join(f['texto'].lower() for f in p.get('falas', []))):
        out.append('robô?')
    if p.get('eh_negocio') is False and not p.get('categoria'):
        out.append('pessoa física?')
    return out


def cmd_preparar(a):
    pasta = comum.pasta_leads(a.simular)
    bruto = comum.ler_json(os.path.join(pasta, 'bruto.json'))
    if not bruto:
        raise SystemExit('Falta bruto.json. Rode o coletor antes.')
    linhas = [f'# Perfis para analisar ({bruto["total"]})', '',
              'Para cada perfil: decida manter ou descartar e copie DOR, SONHO, OBJEÇÃO e PERGUNTA',
              'como citação literal de uma fala abaixo, com o link dela. Sem citação, deixe vazio.', '']
    for p in bruto['perfis']:
        linhas.append(f'## {p["id"]} · {p.get("nome", "")}')
        linhas.append(f'- link: {p["link"]} · seguidores: {p.get("seguidores")} · categoria: {p.get("categoria") or "-"}'
                      f' · conta comercial: {p.get("eh_negocio")}')
        linhas.append(f'- bio: {comum.normalizar(p.get("bio")) or "-"}')
        if pistas(p):
            linhas.append(f'- pistas automáticas: {", ".join(pistas(p))}')
        for i, f in enumerate(p.get('falas', []), 1):
            linhas.append(f'  {i}. [{f["tipo"]}] "{comum.normalizar(f["texto"])}" — {f["link"]}')
        linhas.append('')
    destino = os.path.join(pasta, 'para-analisar.md')
    with open(destino, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(linhas))
    print(f'{bruto["total"]} perfis em {comum.rel(destino)}. Agora o Claude escreve analise.json.')


def achar(citacao, link, falas, bio='', link_perfil=''):
    """Devolve (link_confirmado, motivo). A citação precisa estar numa fala ou na bio do próprio perfil."""
    c = comum.normalizar(citacao).strip('"').strip()
    if not c:
        return '', ''
    for f in falas:
        if f.get('link') == link and c in comum.normalizar(f['texto']):
            return link, ''
    for f in falas:
        if c in comum.normalizar(f['texto']):
            return f['link'], 'link corrigido para o post onde a frase aparece'
    if bio and c in comum.normalizar(bio):
        return link_perfil, '' if link == link_perfil else 'a frase está na bio: link trocado para o perfil'
    return None, 'apagada: a frase não aparece igual em nenhum texto público deste perfil'


def cmd_validar(a):
    pasta = comum.pasta_leads(a.simular)
    bruto = comum.ler_json(os.path.join(pasta, 'bruto.json'))
    analise = comum.ler_json(os.path.join(pasta, 'analise.json'))
    if not bruto or analise is None:
        raise SystemExit('Faltam bruto.json ou analise.json.')
    por_id = {p['id']: p for p in bruto['perfis']}
    saida, avisos = [], []
    for item in analise:
        p = por_id.get(item['id'])
        if not p:
            avisos.append(f'{item["id"]}: não está no bruto.json, ignorei')
            continue
        reg = {k: p.get(k) for k in ('id', 'rede', 'usuario', 'nome', 'link', 'bio', 'link_bio', 'outros_links',
                                     'categoria', 'seguidores', 'email_publico')}
        reg['status'] = item.get('status', 'descartado: sem análise')
        reg['negocio'] = item.get('negocio', '')
        for campo in CAMPOS:
            d = item.get(campo) or {}
            cit, link = (d.get('citacao') or '').strip(), (d.get('link') or '').strip()
            if not cit:
                reg[campo] = {'citacao': '', 'link': ''}
                continue
            ok, motivo = achar(cit, link, p.get('falas', []), p.get('bio', ''), p.get('link', ''))
            if ok is None:
                reg[campo] = {'citacao': '', 'link': ''}
                avisos.append(f'{p["id"]} · {campo}: "{cit}" {motivo}')
            else:
                reg[campo] = {'citacao': comum.normalizar(cit).strip('"'), 'link': ok}
                if campo == 'fato':
                    reg[campo]['frase'] = (d.get('frase') or '').strip()
                    if not reg[campo]['frase']:
                        avisos.append(f'{p["id"]} · fato: falta a frase curta que resume o fato')
                if motivo:
                    avisos.append(f'{p["id"]} · {campo}: {motivo}')
        saida.append(reg)
    comum.salvar_json(os.path.join(pasta, 'perfis.json'), saida)
    mantidos = [s for s in saida if s['status'] == 'manter']
    print(f'{len(saida)} perfis analisados · {len(mantidos)} mantidos · {len(saida) - len(mantidos)} descartados')
    for s in saida:
        marca = 'MANTER ' if s['status'] == 'manter' else 'fora   '
        print(f'  {marca} {s["usuario"]:<28} {s["status"] if s["status"] != "manter" else s["negocio"]}')
        if s['status'] == 'manter':
            for campo in CAMPOS:
                c = s[campo]
                if campo == 'fato' and c['citacao']:
                    print(f'           fato     {c.get("frase", "")}  [apoiado em: "{c["citacao"]}" — {c["link"]}]')
                    continue
                print(f'           {campo:<9}' + (f'"{c["citacao"]}" — {c["link"]}' if c['citacao'] else '(vazio)'))
    if avisos:
        print('\nTRAVA ANTI-INVENÇÃO:')
        for x in avisos:
            print('  ' + x)
    print(f'\nSalvo em {comum.rel(os.path.join(pasta, "perfis.json"))}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('cmd', choices=('preparar', 'validar'))
    ap.add_argument('--simular', action='store_true')
    a = ap.parse_args()
    (cmd_preparar if a.cmd == 'preparar' else cmd_validar)(a)


if __name__ == '__main__':
    main()
