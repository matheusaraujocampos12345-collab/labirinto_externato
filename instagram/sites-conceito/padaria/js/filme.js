/* Padaria Quatro Horas — o vídeo da primeira tela, quadro a quadro.
   Não é <video>: são 96 quadros leves (WebP) desenhados num canvas, para o vídeo andar para a
   frente e para trás junto com a rolagem, sem engasgar no celular.
   O quadro aparece sempre INTEIRO (nada de corte na mão ou na assadeira). O resto da tela é
   preenchido pelo mesmo quadro, desfocado: a luz do forno continua até a borda.
   Os quadros chegam em etapas (1 a cada 32, depois 1 a cada 16...); enquanto isso usa o mais perto. */
(function () {
  'use strict';
  function ordemProgressiva(n) {
    const ordem = [], visto = new Set();
    for (let passo = 32; passo >= 1; passo = Math.floor(passo / 2))
      for (let i = 0; i < n; i += passo) if (!visto.has(i)) { visto.add(i); ordem.push(i); }
    if (!visto.has(n - 1)) ordem.push(n - 1);
    return ordem;
  }
  function Conjunto(pasta, n) { this.pasta = pasta; this.n = n; this.imgs = new Array(n); this.ok = new Array(n).fill(false); }
  Conjunto.prototype.carregar = function (aoChegar) {
    const ordem = ordemProgressiva(this.n);
    let i = 0, ativos = 0, feitos = 0;
    return new Promise((resolve) => {
      const proximo = () => {
        while (ativos < 6 && i < ordem.length) {
          const k = ordem[i++], img = new Image();
          ativos++;
          img.decoding = 'async';
          img.src = `${this.pasta}/${String(k).padStart(3, '0')}.webp`;
          const fim = () => {
            ativos--; feitos++;
            this.imgs[k] = img; this.ok[k] = img.naturalWidth > 0; aoChegar();
            if (feitos === ordem.length) resolve(); else proximo();
          };
          (img.decode ? img.decode() : Promise.resolve()).then(fim, fim);
        }
      };
      proximo();
    });
  };
  Conjunto.prototype.perto = function (k) {
    for (let d = 0; d < this.n; d++) {
      if (k - d >= 0 && this.ok[k - d]) return k - d;
      if (k + d < this.n && this.ok[k + d]) return k + d;
    }
    return -1;
  };

  function Filme(canvas, { pasta = 'video', n = 96 } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.pasta = pasta; this.n = n; this.qual = null;
    this.borrado = new Conjunto(`${pasta}/b`, n);
    this.aux = document.createElement('canvas'); this.auxCtx = this.aux.getContext('2d');
    const marcar = () => { this.ultimo = null; };
    this.prontoBorrado = this.borrado.carregar(marcar);
  }
  Filme.prototype.tamanho = function (w, h, dpr) {
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    const qual = w / h > 1.05 ? 'h' : 'm';
    if (qual !== this.qual) {
      this.qual = qual;
      this.nitido = new Conjunto(`${this.pasta}/${qual}`, this.n);
      this.pronto = Promise.all([this.nitido.carregar(() => { this.ultimo = null; }), this.prontoBorrado]);
    }
    this.ultimo = null;
  };
  /* f: posição em quadros (pode ser fracionária); caixa: {x, y, w, h} em px CSS onde fica o quadro nítido;
     zoom (>= 1) aproxima do ponto foco {x, y} (0 a 1) sem sair do quadro */
  Filme.prototype.desenhar = function (f, caixa, zoom = 1, foco = { x: 0.5, y: 0.5 }) {
    f = Math.max(0, Math.min(this.n - 1, f));
    const chave = `${f.toFixed(3)}|${caixa.x.toFixed(1)},${caixa.y.toFixed(1)},${caixa.w.toFixed(1)}|${zoom.toFixed(4)}`;
    if (chave === this.ultimo) return;
    const i0 = Math.floor(f), a = f - i0, i1 = Math.min(this.n - 1, i0 + 1);
    const kb = this.borrado.perto(i0), kn = this.nitido.perto(i0);
    if (kb < 0 && kn < 0) return;
    this.ultimo = chave;
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height, d = this.dpr;
    c.fillStyle = '#05020A'; c.fillRect(0, 0, W, H);
    // 1. fundo: o quadro desfocado cobrindo a tela inteira, mais escuro
    const fundo = kb >= 0 ? this.borrado.imgs[kb] : this.nitido.imgs[kn];
    const s = Math.max(W / fundo.naturalWidth, H / fundo.naturalHeight) * 1.08;
    const fw = fundo.naturalWidth * s, fh = fundo.naturalHeight * s;
    c.imageSmoothingQuality = 'high';
    c.drawImage(fundo, (W - fw) / 2, (H - fh) / 2, fw, fh);
    c.fillStyle = 'rgba(5,2,10,.66)'; c.fillRect(0, 0, W, H);
    if (kn < 0) return;
    // 2. o quadro nítido, inteiro, com as bordas se desfazendo no fundo
    const bx = Math.round(caixa.x * d), by = Math.round(caixa.y * d), bw = Math.round(caixa.w * d), bh = Math.round(caixa.h * d);
    const A = this.aux, ac = this.auxCtx;
    if (A.width !== bw || A.height !== bh) { A.width = bw; A.height = bh; }
    ac.globalCompositeOperation = 'source-over'; ac.globalAlpha = 1;
    ac.clearRect(0, 0, bw, bh);
    ac.imageSmoothingQuality = 'high';
    const im0 = this.nitido.imgs[kn], iw = im0.naturalWidth, ih = im0.naturalHeight;
    const sw = iw / zoom, sh = ih / zoom;
    const sx = Math.max(0, Math.min(iw - sw, foco.x * iw - sw / 2)), sy = Math.max(0, Math.min(ih - sh, foco.y * ih - sh / 2));
    ac.drawImage(im0, sx, sy, sw, sh, 0, 0, bw, bh);
    if (a > 0.001 && kn === i0 && this.nitido.ok[i1]) { ac.globalAlpha = a; ac.drawImage(this.nitido.imgs[i1], sx, sy, sw, sh, 0, 0, bw, bh); ac.globalAlpha = 1; }
    ac.globalCompositeOperation = 'destination-in';
    const fv = Math.min(bh * 0.2, 90 * d), fl = caixa.x > 0.5 ? Math.min(bw * 0.08, 70 * d) : 0;
    let g = ac.createLinearGradient(0, 0, 0, bh);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fv / bh, '#000'); g.addColorStop(1 - fv / bh, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ac.fillStyle = g; ac.fillRect(0, 0, bw, bh);
    if (fl > 0) {
      g = ac.createLinearGradient(0, 0, bw, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fl / bw, '#000'); g.addColorStop(1 - fl / bw, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ac.fillStyle = g; ac.fillRect(0, 0, bw, bh);
    }
    c.drawImage(A, bx, by);
  };
  window.Filme = Filme;
})();
