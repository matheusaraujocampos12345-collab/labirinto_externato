/* Padaria Quatro Horas — o vídeo da primeira tela, quadro a quadro.
   Não é <video>: são 96 quadros leves (WebP) desenhados num canvas, para o vídeo andar
   para a frente e para trás junto com a rolagem, sem engasgar no celular.
   Carrega primeiro um quadro a cada 8, depois vai preenchendo; enquanto isso usa o mais perto. */
(function () {
  'use strict';
  function ordemProgressiva(n) {
    const ordem = [], visto = new Set();
    for (let passo = 32; passo >= 1; passo = Math.floor(passo / 2)) {
      for (let i = 0; i < n; i += passo) if (!visto.has(i)) { visto.add(i); ordem.push(i); }
    }
    if (!visto.has(n - 1)) ordem.push(n - 1);
    return ordem;
  }

  function Filme(canvas, { pasta = 'video', n = 96 } = {}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
    this.pasta = pasta; this.n = n; this.conjunto = null; this.imgs = []; this.ok = [];
    this.foco = 0.5;
  }
  Filme.prototype.tamanho = function (w, h, dpr) {
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    const conj = w / h > 1.05 ? 'h' : 'v';
    if (conj !== this.conjunto) this.carregar(conj);
    this.ultimo = null;
  };
  Filme.prototype.carregar = function (conj) {
    this.conjunto = conj;
    this.imgs = new Array(this.n); this.ok = new Array(this.n).fill(false);
    const ordem = ordemProgressiva(this.n);
    let i = 0, ativos = 0;
    this.pronto = new Promise((resolve) => {
      let feitos = 0;
      const proximo = () => {
        while (ativos < 6 && i < ordem.length) {
          const k = ordem[i++], img = new Image();
          ativos++;
          img.decoding = 'async';
          img.src = `${this.pasta}/${conj}/${String(k).padStart(3, '0')}.webp`;
          const fim = () => {
            ativos--; feitos++;
            if (conj === this.conjunto) { this.imgs[k] = img; this.ok[k] = img.naturalWidth > 0; this.ultimo = null; }
            if (feitos === ordem.length) resolve(); else proximo();
          };
          (img.decode ? img.decode() : Promise.resolve()).then(fim, fim);
        }
      };
      proximo();
    });
  };
  Filme.prototype.perto = function (k, dir) {
    for (let d = 0; d < this.n; d++) {
      const a = k - d * dir, b = k + d * dir;
      if (a >= 0 && a < this.n && this.ok[a]) return a;
      if (b >= 0 && b < this.n && this.ok[b]) return b;
    }
    return -1;
  };
  Filme.prototype.pintar = function (img, alfa) {
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(W / iw, H / ih), sw = W / s, sh = H / s;
    const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * this.foco)), sy = (ih - sh) / 2;
    c.globalAlpha = alfa;
    c.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    c.globalAlpha = 1;
  };
  /* f: posição em quadros (pode ser fracionária) */
  Filme.prototype.desenhar = function (f) {
    f = Math.max(0, Math.min(this.n - 1, f));
    const chave = f.toFixed(3);
    if (chave === this.ultimo) return;
    const i0 = Math.floor(f), i1 = Math.min(this.n - 1, i0 + 1), a = f - i0;
    const k0 = this.perto(i0, 1);
    if (k0 < 0) return;
    this.ultimo = chave;
    this.pintar(this.imgs[k0], 1);
    if (a > 0.001 && i1 !== i0 && this.ok[i1] && k0 === i0) this.pintar(this.imgs[i1], a);
  };
  window.Filme = Filme;
})();
