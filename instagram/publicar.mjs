#!/usr/bin/env node
// Robô de publicação da MACH no Instagram (API oficial da Meta — Instagram Graph API).
//
//   node instagram/publicar.mjs --testar   confere o calendário e mostra o que seria publicado (não publica nada)
//   node instagram/publicar.mjs            publica os posts "agendado" + "auto" cujo horário já passou
//   node instagram/publicar.mjs --verificar só confere se a chave da Meta funciona (lê o nome da conta, não publica)
//
// Variáveis de ambiente (só para publicar de verdade):
//   IG_ACCESS_TOKEN  chave do usuário do sistema "Mach Publicado System User" (login unificado da Meta),
//                    com instagram_basic + instagram_content_publish. Nunca em arquivo: só no segredo do GitHub.
//                    Pode ficar vazia se um proxy injetar a chave.
//   MEDIA_BASE_URL   endereço público onde ficam os arquivos do repositório (a API baixa as mídias de lá)
//   IG_USER_ID       padrão 17841419418755107 (@mach.sites). Não é segredo.
//   GRAPH_HOST       padrão graph.facebook.com
//   GRAPH_VERSION    padrão v27.0
//   AGORA            opcional, para simular outra data (ex.: 2026-11-26T12:05:00-03:00)
//   CALENDARIO       opcional, outro arquivo de calendário (padrão instagram/calendario.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..');
const CAL = process.env.CALENDARIO ? path.resolve(process.env.CALENDARIO) : path.join(AQUI, 'calendario.json');
const TESTAR = process.argv.includes('--testar');
const AGORA = new Date(process.env.AGORA || Date.now());
const HOST = process.env.GRAPH_HOST || 'graph.facebook.com';
const VER = process.env.GRAPH_VERSION || 'v27.0';
const IG = process.env.IG_USER_ID || '17841419418755107';
const TOKEN = process.env.IG_ACCESS_TOKEN || '';
const BASE = (process.env.MEDIA_BASE_URL || '').replace(/\/$/, '');

const TIPOS = new Set(['imagem', 'carrossel', 'reels', 'story']);
const ehVideo = (a) => /\.(mp4|mov)$/i.test(a);
const ehImagem = (a) => /\.(png|jpe?g)$/i.test(a);
const fmtData = (d) => (d ? new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }) : 'sem data');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/** Largura e altura de um PNG ou JPEG, lidas do cabeçalho. */
function tamanhoImagem(arquivo) {
  const b = fs.readFileSync(arquivo);
  if (b.length > 24 && b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Confere um post e devolve a lista de problemas (vazia = ok). */
function conferir(p, ids) {
  const erros = [];
  const avisos = [];
  if (!p.id) erros.push('sem id');
  if (ids.has(p.id)) erros.push(`id repetido "${p.id}"`);
  ids.add(p.id);
  if (!TIPOS.has(p.tipo)) erros.push(`tipo inválido "${p.tipo}"`);
  if (p.status !== 'rascunho' && Number.isNaN(Date.parse(p.data))) erros.push('data inválida');
  const arqs = p.arquivos || [];
  if (p.status !== 'rascunho') {
    if (p.tipo === 'carrossel' && (arqs.length < 2 || arqs.length > 10)) erros.push(`carrossel precisa de 2 a 10 arquivos (tem ${arqs.length})`);
    if (p.tipo !== 'carrossel' && arqs.length !== 1) erros.push(`${p.tipo} precisa de 1 arquivo (tem ${arqs.length})`);
    if (p.tipo === 'reels' && arqs[0] && !ehVideo(arqs[0])) erros.push('reels precisa de um vídeo .mp4');
  }
  for (const a of [...arqs, ...(p.capa ? [p.capa] : [])]) {
    const abs = path.join(REPO, a);
    if (!fs.existsSync(abs)) { erros.push(`arquivo não encontrado: ${a}`); continue; }
    if (!ehVideo(a) && !ehImagem(a)) erros.push(`formato não aceito: ${a}`);
    const mb = fs.statSync(abs).size / 1e6;
    if (ehImagem(a) && mb > 8) erros.push(`imagem acima de 8 MB: ${a}`);
    if (/\.png$/i.test(a)) erros.push(`a Meta só aceita imagem em JPEG: troque por .jpg (${a})`);
    if (ehVideo(a) && mb > 100) avisos.push(`vídeo grande (${mb.toFixed(0)} MB): ${a}`);
    const t = ehImagem(a) ? tamanhoImagem(abs) : null;
    if (t && a !== p.capa) {
      const r = t.w / t.h;
      if ((p.tipo === 'imagem' || p.tipo === 'carrossel') && (r < 0.79 || r > 1.92)) erros.push(`proporção ${t.w}×${t.h} fora do feed (de 4:5 a 1,91:1): ${a}`);
      if (p.tipo === 'story' && Math.abs(r - 9 / 16) > 0.02) avisos.push(`story fora de 9:16 (${t.w}×${t.h}): ${a}`);
    }
  }
  const leg = p.legenda || '';
  if (leg.length > 2200) erros.push(`legenda com ${leg.length} caracteres (máximo 2.200)`);
  if ((leg.match(/#[\p{L}\d_]+/gu) || []).length > 30) erros.push('mais de 30 hashtags');
  if ((leg.match(/@[\w.]+/g) || []).length > 20) erros.push('mais de 20 menções');
  return { erros, avisos };
}

async function graph(metodo, rota, params = {}) {
  const url = new URL(`https://${HOST}/${VER}/${rota}`);
  const corpo = new URLSearchParams(params);
  if (TOKEN) corpo.set('access_token', TOKEN);
  let res;
  if (metodo === 'GET') {
    corpo.forEach((v, k) => url.searchParams.set(k, v));
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: 'POST', body: corpo });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}

const urlDe = (arquivo) => `${BASE}/${arquivo.split('/').map(encodeURIComponent).join('/')}`;

async function esperarPronto(id) {
  for (let i = 0; i < 72; i++) {
    const r = await graph('GET', id, { fields: 'status_code,status' });
    if (r.status_code === 'FINISHED' || r.status_code === 'PUBLISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') throw new Error(`a Meta não processou a mídia: ${r.status || r.status_code}`);
    await dormir(5000);
  }
  throw new Error('tempo esgotado esperando a Meta processar a mídia');
}

async function publicar(p) {
  const legenda = p.legenda || '';
  let contentor;
  if (p.tipo === 'imagem') {
    contentor = await graph('POST', `${IG}/media`, { image_url: urlDe(p.arquivos[0]), caption: legenda });
  } else if (p.tipo === 'carrossel') {
    const filhos = [];
    for (const a of p.arquivos) {
      const item = await graph('POST', `${IG}/media`, ehVideo(a)
        ? { media_type: 'VIDEO', video_url: urlDe(a), is_carousel_item: 'true' }
        : { image_url: urlDe(a), is_carousel_item: 'true' });
      if (ehVideo(a)) await esperarPronto(item.id);
      filhos.push(item.id);
    }
    contentor = await graph('POST', `${IG}/media`, { media_type: 'CAROUSEL', children: filhos.join(','), caption: legenda });
  } else if (p.tipo === 'reels') {
    const params = { media_type: 'REELS', video_url: urlDe(p.arquivos[0]), caption: legenda, share_to_feed: 'true' };
    if (p.capa) params.cover_url = urlDe(p.capa);
    contentor = await graph('POST', `${IG}/media`, params);
  } else if (p.tipo === 'story') {
    const a = p.arquivos[0];
    contentor = await graph('POST', `${IG}/media`, ehVideo(a) ? { media_type: 'STORIES', video_url: urlDe(a) } : { media_type: 'STORIES', image_url: urlDe(a) });
  }
  await esperarPronto(contentor.id);
  const pub = await graph('POST', `${IG}/media_publish`, { creation_id: contentor.id });
  let permalink = '';
  try {
    permalink = (await graph('GET', pub.id, { fields: 'permalink' })).permalink || '';
  } catch { /* stories não têm link fixo */ }
  return { id: pub.id, permalink };
}

async function verificar() {
  if (!TOKEN) { console.error('Falta a chave IG_ACCESS_TOKEN.'); process.exit(1); }
  try {
    const r = await graph('GET', IG, { fields: 'username,media_count' });
    console.log(`Conexão com a Meta funcionando: @${r.username} (${r.media_count} posts).`);
  } catch (e) {
    console.error('A chave da Meta não funcionou: ' + e.message);
    process.exit(1);
  }
}

async function main() {
  const cal = JSON.parse(fs.readFileSync(CAL, 'utf8'));
  const ids = new Set();
  let problemas = 0;
  const vencidos = [];
  console.log(`\nCalendário MACH — ${fmtData(AGORA)} (${TESTAR ? 'modo teste, nada é publicado' : 'publicação'})\n`);
  for (const p of cal.posts) {
    const { erros, avisos } = conferir(p, ids);
    problemas += erros.length;
    const venceu = p.status === 'agendado' && Date.parse(p.data) <= AGORA.getTime();
    let acao;
    if (p.status === 'publicado') acao = `publicado ${p.permalink || ''}`.trim();
    else if (p.status === 'rascunho') acao = 'rascunho';
    else if (erros.length) acao = 'BLOQUEADO';
    else if (p.modo === 'manual') acao = venceu ? 'hora de publicar pelo app' : 'publicar pelo app';
    else acao = venceu ? 'publicar agora' : 'aguardando o horário';
    console.log(`${fmtData(p.data).padEnd(16)} ${p.tipo.padEnd(9)} ${p.id.padEnd(26)} ${acao}`);
    for (const e of erros) console.log(`   ✗ ${e}`);
    for (const a of avisos) console.log(`   ! ${a}`);
    if (venceu && p.modo !== 'manual' && !erros.length) vencidos.push(p);
  }
  console.log(`\n${cal.posts.length} posts · ${problemas ? problemas + ' problema(s)' : 'nenhum problema'} · ${vencidos.length} para publicar agora\n`);
  if (TESTAR) {
    if (!IG || !BASE) console.log('Para publicar de verdade faltam: ' + [!IG && 'IG_USER_ID', !BASE && 'MEDIA_BASE_URL', !TOKEN && 'IG_ACCESS_TOKEN (ou proxy)'].filter(Boolean).join(', ') + '.\n');
    process.exit(problemas ? 1 : 0);
  }
  if (!vencidos.length) return;
  if (!IG || !BASE) {
    console.error('Faltam IG_USER_ID e/ou MEDIA_BASE_URL. Nada foi publicado.');
    process.exit(1);
  }
  // Trava contra post repetido: se a mesma legenda já está no perfil (últimos 3 dias), não publica de novo.
  let recentes = [];
  try {
    const r = await graph('GET', `${IG}/media`, { fields: 'caption,timestamp,permalink', limit: '15' });
    recentes = (r.data || []).filter((m) => Date.now() - Date.parse(m.timestamp) < 3 * 864e5);
  } catch (e) {
    console.error('Não consegui ler os posts recentes; por segurança, nada será publicado agora: ' + e.message);
    return;
  }
  const mesmaLegenda = (a, b) => (a || '').trim() === (b || '').trim();
  for (const p of vencidos) {
    const igual = recentes.find((m) => p.legenda && mesmaLegenda(m.caption, p.legenda));
    if (igual) {
      Object.assign(p, { status: 'publicado', permalink: igual.permalink, nota: (p.nota || '') + ' Já estava no perfil; o robô não repetiu.' });
      console.log(`${p.id}: já está no perfil (${igual.permalink}). Não publiquei de novo.`);
      fs.writeFileSync(CAL, JSON.stringify(cal, null, 2) + '\n');
      continue;
    }
    try {
      console.log(`Publicando ${p.id}…`);
      const r = await publicar(p);
      Object.assign(p, { status: 'publicado', publicado_em: new Date().toISOString(), media_id: r.id, permalink: r.permalink });
      delete p.ultimo_erro;
      console.log(`  ✓ ${r.permalink || r.id}`);
    } catch (e) {
      p.ultimo_erro = `${new Date().toISOString()} ${e.message}`;
      console.error(`  ✗ ${e.message}`);
    }
    fs.writeFileSync(CAL, JSON.stringify(cal, null, 2) + '\n');
  }
}

(process.argv.includes('--verificar') ? verificar() : main()).catch((e) => {
  console.error(e);
  process.exit(1);
});
