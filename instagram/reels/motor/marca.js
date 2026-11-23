// Sobreposição de texto da marca MACH para os Reels.
// Todo Reels usa estes blocos para ter o mesmo visual: títulos em Saira 300,
// texto em Hanken Grotesk, rótulos em JetBrains Mono maiúsculo espaçado,
// laranja só como acento e tudo dentro da zona segura do Instagram.
import { W, H, clamp, lerp, prog, ease } from './tempo.js';

export const COR = {
  fundo: '#0A0C0F', // estratosfera
  titanio: '#1B2026', // superfícies
  aluminio: '#DFE3E7', // texto
  nevoa: '#8A929B', // apoio, rótulos
  laranja: '#FF6B1A', // acento: no máximo um destaque por tela
  apagado: '#2C323A', // texto "desligado"
  linha: 'rgba(223,227,231,0.14)',
};

/** Zona segura num quadro 1080×1920: topo, rodapé e direita ficam sob a interface do Instagram. */
export const ZONA = { x0: 90, x1: 940, y0: 260, y1: 1440 };
/** Recorte 4:5 que o perfil mostra da capa (1080×1350, centralizado). */
export const RECORTE_4x5 = { y0: (H - 1350) / 2, y1: (H + 1350) / 2 };

export const FONTE = {
  titulo: (px, peso = 300) => `${peso} ${px}px "Saira", sans-serif`,
  expandida: (px, peso = 500) => `${peso} ${px}px "Saira Expandida", sans-serif`,
  texto: (px, peso = 400) => `${peso} ${px}px "Hanken Grotesk", sans-serif`,
  mono: (px, peso = 400) => `${peso} ${px}px "JetBrains Mono", monospace`,
};

const ESTILOS = {
  titulo: { fonte: FONTE.titulo, tamanho: 84, entrelinha: 1.14, espaco: -0.012, cor: COR.aluminio, peso: 300 },
  texto: { fonte: FONTE.texto, tamanho: 40, entrelinha: 1.42, espaco: 0, cor: COR.aluminio, peso: 400 },
  rotulo: { fonte: FONTE.mono, tamanho: 26, entrelinha: 1.55, espaco: 0.18, cor: COR.nevoa, peso: 400, caixa: 'alta' },
  marcacao: { fonte: FONTE.expandida, tamanho: 30, entrelinha: 1.3, espaco: 0.12, cor: COR.aluminio, peso: 500, caixa: 'alta' },
};

// ── registro de texto fora da zona segura (o motor lê e avisa) ──────────────
function registrar(texto, caixa) {
  const z = ZONA, folga = 2;
  if (caixa.x < z.x0 - folga || caixa.x + caixa.w > z.x1 + folga || caixa.y < z.y0 - folga || caixa.y + caixa.h > z.y1 + folga) {
    (window.__avisosZona ||= []).push({ texto: String(texto).slice(0, 60), caixa: [caixa.x, caixa.y, caixa.w, caixa.h].map(Math.round) });
  }
}

/** Mede um texto com espaçamento entre letras (px). */
export function medir(ctx, str, fonte, espaco = 0) {
  ctx.save();
  ctx.font = fonte;
  ctx.letterSpacing = `${espaco}px`;
  const w = ctx.measureText(str).width - (str.length ? espaco : 0);
  ctx.restore();
  return w;
}

/** Quebra o texto em linhas que caibam na largura. "\n" força quebra. */
export function quebrar(ctx, texto, fonte, largura, espaco = 0) {
  const linhas = [];
  for (const par of String(texto).split('\n')) {
    const palavras = par.split(/\s+/).filter(Boolean);
    let atual = '';
    for (const p of palavras) {
      const teste = atual ? atual + ' ' + p : p;
      if (!atual || medir(ctx, teste, fonte, espaco) <= largura) atual = teste;
      else {
        linhas.push(atual);
        atual = p;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

/**
 * Bloco de texto da marca, com entrada e saída.
 *
 * op.texto        string ("\n" quebra linha) — quebra sozinho se houver op.largura
 * op.x, op.y      canto superior do bloco (y = topo da primeira linha)
 * op.estilo       'titulo' | 'texto' | 'rotulo' | 'marcacao'
 * op.tamanho      px · op.entrelinha · op.cor · op.espaco (em) · op.peso
 * op.alinhar      'left' | 'center' | 'right'
 * op.largura      largura máxima (padrão: até a borda da zona segura)
 * op.entra/op.sai segundos (sai opcional)
 * op.entrada      'mascara' (linha sobe de trás de uma máscara) | 'palavras' | 'fade' | 'corte'
 * op.saida        'mascara' | 'fade' | 'corte'
 * op.durEntrada   duração (padrão 0,7 s) · op.atraso entre linhas/palavras
 * op.destaque     trecho que fica laranja (um por tela)
 * op.painel       { cor, pad, borda } — painel atrás do texto, para ler sobre vídeo
 * op.sombra       true = sombra suave para ler sobre imagem
 * op.alfa         multiplicador de opacidade
 * Retorna a caixa { x, y, w, h, base } (base = y da última linha + altura).
 */
export function bloco(ctx, t, op) {
  const est = ESTILOS[op.estilo || 'titulo'];
  const tam = op.tamanho ?? est.tamanho;
  const peso = op.peso ?? est.peso;
  const fonte = est.fonte(tam, peso);
  const espaco = (op.espaco ?? est.espaco) * tam;
  const L = op.entrelinha ?? est.entrelinha;
  const alinhar = op.alinhar || 'left';
  const caixaAlta = (op.caixa ?? est.caixa) === 'alta';
  let texto = String(op.texto);
  if (caixaAlta) texto = texto.toLocaleUpperCase('pt-BR');
  const largura = op.largura ?? (alinhar === 'center' ? ZONA.x1 - ZONA.x0 : alinhar === 'right' ? (op.x ?? ZONA.x1) - ZONA.x0 : ZONA.x1 - (op.x ?? ZONA.x0));
  const linhas = quebrar(ctx, texto, fonte, largura, espaco);
  const x = op.x ?? (alinhar === 'center' ? W / 2 : ZONA.x0);
  const y = op.y ?? ZONA.y0;
  const alturaLinha = tam * L;
  const larguras = linhas.map((l) => medir(ctx, l, fonte, espaco));
  const wMax = Math.max(...larguras);
  const x0 = alinhar === 'center' ? x - wMax / 2 : alinhar === 'right' ? x - wMax : x;
  const caixa = { x: x0, y: y - tam * 0.12, w: wMax, h: alturaLinha * linhas.length, base: y + alturaLinha * linhas.length };

  const entra = op.entra ?? -1e9;
  const sai = op.sai ?? 1e9;
  if (t < entra || t >= sai + (op.saida === 'corte' ? 0 : op.durSaida ?? 0.5) + 0.6) return { ...caixa, visivel: false };

  const entrada = op.entrada || 'mascara';
  const saida = op.saida || 'mascara';
  const durE = op.durEntrada ?? (entrada === 'palavras' ? 0.5 : 0.7);
  const durS = op.durSaida ?? 0.45;
  const atraso = op.atraso ?? (entrada === 'palavras' ? 0.07 : 0.09);
  const cor = op.cor ?? est.cor;
  const alfaBase = op.alfa ?? 1;

  ctx.save();
  ctx.font = fonte;
  ctx.letterSpacing = `${espaco}px`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  if (op.sombra) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = tam * 0.5;
  }

  // painel atrás do texto
  if (op.painel) {
    const p = op.painel;
    const pad = p.pad ?? 24;
    const a = alfaBase * (entrada === 'corte' ? 1 : ease.outCubic(prog(t, entra, entra + 0.35))) * (saida === 'corte' ? (t < sai ? 1 : 0) : 1 - ease.inCubic(prog(t, sai, sai + durS + 0.2)));
    if (a > 0) {
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = a;
      ctx.fillStyle = p.cor ?? 'rgba(10,12,15,0.82)';
      ctx.fillRect(caixa.x - pad, caixa.y - pad * 0.6, caixa.w + pad * 2, caixa.h + pad * 1.2);
      if (p.borda !== false) {
        ctx.strokeStyle = p.borda ?? COR.linha;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(caixa.x - pad + 0.75, caixa.y - pad * 0.6 + 0.75, caixa.w + pad * 2 - 1.5, caixa.h + pad * 1.2 - 1.5);
      }
      ctx.restore();
    }
  }

  let palavraGlobal = 0;
  let algumVisivel = false;
  linhas.forEach((linha, i) => {
    const topo = y + i * alturaLinha;
    const base = topo + tam * (0.5 * (L - 1) + 0.8);
    const lx = alinhar === 'center' ? x - larguras[i] / 2 : alinhar === 'right' ? x - larguras[i] : x;

    // saída
    let dySaida = 0, aSaida = 1;
    if (t >= sai) {
      if (saida === 'corte') aSaida = 0;
      else if (saida === 'fade') aSaida = 1 - ease.inOutSine(prog(t, sai, sai + durS));
      else {
        const k = ease.inCubic(prog(t, sai + i * atraso * 0.6, sai + i * atraso * 0.6 + durS));
        dySaida = -k * alturaLinha * 1.05;
        aSaida = 1 - k * 0.3;
        if (k >= 1) aSaida = 0;
      }
    }
    if (aSaida <= 0) return;

    const palavras = linha.split(' ');
    let prefixo = '';
    palavras.forEach((pal, j) => {
      const px = lx + (j === 0 ? 0 : medir(ctx, prefixo + ' ', fonte, espaco) + espaco);
      prefixo = j === 0 ? pal : prefixo + ' ' + pal;
      let dy = 0, a = 1;
      if (entrada === 'palavras') {
        const st = entra + palavraGlobal * atraso;
        const k = ease.outCubic(prog(t, st, st + durE));
        a = k;
        dy = (1 - k) * tam * 0.28;
      } else if (entrada === 'fade') {
        const k = ease.outCubic(prog(t, entra, entra + durE));
        a = k;
        dy = (1 - k) * 14;
      } else if (entrada === 'mascara') {
        const st = entra + i * atraso;
        const k = ease.outQuart(prog(t, st, st + durE));
        dy = (1 - k) * alturaLinha * 1.05;
        a = k > 0 ? 1 : 0;
      }
      palavraGlobal++;
      const alfa = a * aSaida * alfaBase;
      if (alfa <= 0.002) return;
      algumVisivel = true;
      ctx.save();
      if (entrada === 'mascara' || (t >= sai && saida === 'mascara')) {
        ctx.beginPath();
        ctx.rect(lx - tam, topo - tam * 0.2, larguras[i] + tam * 2, alturaLinha + tam * 0.22);
        ctx.clip();
      }
      ctx.globalAlpha = alfa;
      const destacar = op.destaque && op.destaque.split(' ').includes(pal.replace(/[.,!?:;]/g, '')) ;
      ctx.fillStyle = destacar ? COR.laranja : cor;
      ctx.fillText(pal, px, base + dy + dySaida);
      ctx.restore();
    });
  });
  ctx.restore();
  if (algumVisivel) registrar(texto, caixa);
  return { ...caixa, visivel: algumVisivel };
}

/** Rótulo em JetBrains Mono, maiúsculo e espaçado. */
export function rotulo(ctx, t, op) {
  return bloco(ctx, t, { estilo: 'rotulo', entrada: 'fade', saida: 'fade', ...op });
}

/** "@mach.sites" pequeno em mono. Discreto: não rouba a cena. */
export function assinatura(ctx, t, op = {}) {
  return bloco(ctx, t, {
    estilo: 'rotulo',
    caixa: 'normal',
    texto: '@mach.sites',
    tamanho: 26,
    espaco: 0.08,
    cor: COR.nevoa,
    x: ZONA.x0,
    y: ZONA.y1 - 46,
    entrada: 'fade',
    saida: 'fade',
    durEntrada: 0.6,
    ...op,
  });
}

/**
 * Faixa de largura total para texto sobre vídeo ou site gravado: esconde o que passa por baixo
 * e abre/fecha a partir da linha do meio. Use a cor do próprio site (ex.: o escuro da padaria)
 * para a faixa não brigar com ele. Desenhe o texto por cima com bloco().
 * op: y, h, entra, sai, cor, linha, durEntrada, durSaida, saida ('fecha' | 'corte'), entrada ('abre' | 'corte')
 */
export function faixa(ctx, t, op) {
  const { y, h, entra = -1e9, sai = 1e9, cor = 'rgba(10,12,15,0.86)', linha = COR.linha, durEntrada = 0.35, durSaida = 0.3 } = op;
  if (t < entra) return 0;
  let k = op.entrada === 'corte' ? 1 : ease.outCubic(prog(t, entra, entra + durEntrada));
  if (t >= sai) k = op.saida === 'corte' ? 0 : k * (1 - ease.inCubic(prog(t, sai, sai + durSaida)));
  if (k <= 0) return 0;
  const hh = h * k, yy = y + (h - hh) / 2;
  ctx.save();
  ctx.fillStyle = cor;
  ctx.fillRect(0, yy, W, hh);
  ctx.fillStyle = linha;
  ctx.fillRect(0, yy, W, 1.5);
  ctx.fillRect(0, yy + hh - 1.5, W, 1.5);
  ctx.restore();
  return k;
}

/** Fundo da marca. */
export function fundo(ctx, cor = COR.fundo) {
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, W, H);
}

/** Cantoneiras de mira (HUD) em volta de um retângulo. */
export function cantoneiras(ctx, x, y, w, h, op = {}) {
  const { tam = 26, cor = COR.aluminio, alfa = 0.7, espessura = 2 } = op;
  if (alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alfa;
  ctx.strokeStyle = cor;
  ctx.lineWidth = espessura;
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(cx, cy + sy * tam);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * tam, cy);
  }
  ctx.stroke();
  ctx.restore();
}

/** Diamantes de choque (três losangos que vão sumindo), centrados em x, a partir de y. */
export function diamantes(ctx, x, y, escala = 1, alfa = 1, cor = COR.laranja) {
  const D = [[0, 14, 9, 14, 1], [0, 43, 6.5, 10, 0.75], [0, 66, 4.5, 7, 0.5]];
  ctx.save();
  ctx.fillStyle = cor;
  for (const [dx, dy, hw, hh, op] of D) {
    ctx.globalAlpha = alfa * op;
    ctx.beginPath();
    ctx.moveTo(x + dx * escala, y + (dy - hh) * escala);
    ctx.lineTo(x + (dx + hw) * escala, y + dy * escala);
    ctx.lineTo(x + dx * escala, y + (dy + hh) * escala);
    ctx.lineTo(x + (dx - hw) * escala, y + dy * escala);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Indicador de toque (dedo na tela): anel fino que afunda ao pressionar. */
export function dedo(ctx, x, y, op = {}) {
  const { alfa = 1, pressao = 0, raio = 46, cor = COR.aluminio } = op;
  if (alfa <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alfa;
  const r = raio * (1 - 0.12 * pressao);
  ctx.fillStyle = `rgba(223,227,231,${0.1 + 0.12 * pressao})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = cor;
  ctx.globalAlpha *= 0.85;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Vinheta suave nas bordas. */
export function vinheta(ctx, forca = 0.5) {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.28, W / 2, H * 0.5, H * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Desenha a zona segura e o recorte 4:5 (só para conferência: --grade). */
export function grade(ctx) {
  ctx.save();
  ctx.setLineDash([12, 10]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,0,200,0.9)';
  ctx.strokeRect(ZONA.x0, ZONA.y0, ZONA.x1 - ZONA.x0, ZONA.y1 - ZONA.y0);
  ctx.strokeStyle = 'rgba(0,200,255,0.8)';
  ctx.strokeRect(1, RECORTE_4x5.y0, W - 2, RECORTE_4x5.y1 - RECORTE_4x5.y0);
  ctx.restore();
}

export { clamp, lerp, prog, ease };
