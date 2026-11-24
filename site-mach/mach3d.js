/* MACH Estúdio — 3D em WebGL puro (nenhuma biblioteca)
   ─────────────────────────────────────────────
   1) Abertura: as letras MΛCH em 3D sobre um espelho d'água; a rolagem guia a câmera.
   2) Como funciona: o símbolo Λ vai do traço ao sólido conforme os passos passam.
   Este arquivo só é carregado quando o 3D faz sentido (veja o <head> do index.html).
   Se o WebGL falhar, a classe "gl" sai do <html> e o CSS mostra a imagem estática. */
(function () {
  'use strict';
  var raiz = document.documentElement;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var suave = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var ALTA = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';

  function semGL() {
    raiz.classList.remove('gl');
    ['s1', 's2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.removeAttribute('style'); el.classList.remove('live'); }
    });
  }

  function programa(gl, vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      gl.attachShader(p, sh);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var out = { p: p }, i, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { var u = gl.getActiveUniform(p, i).name; out[u] = gl.getUniformLocation(p, u); }
    n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < n; i++) { var a = gl.getActiveAttrib(p, i).name; out[a] = gl.getAttribLocation(p, a); }
    return out;
  }
  function buffer(gl, arr) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW); return b; }
  /* matrizes 4×4 em ordem de coluna */
  function mul(a, b) { var o = new Array(16), c, r; for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }

  /* ══════════ 1) ABERTURA: MΛCH sobre um espelho d'água ══════════ */
  function abertura() {
    var hero = document.getElementById('topo'), canvas = document.getElementById('gl');
    var stages = ['s1', 's2'].map(function (id) { return document.getElementById(id); });
    if (!hero || !canvas) return;
    var gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) { semGL(); return; }

    var solido, agua, brilho, estrelas;
    try {
      /* As letras: metal escovado que reflete um estúdio de luzes. uFlip = 1 desenha o reflexo na água. */
      solido = programa(gl,
        'attribute vec3 aPos; attribute vec3 aNor; attribute float aLet; attribute float aKind;' +
        'uniform mat4 uVP; uniform float uIntro, uFlip, uT; varying vec3 vW, vN; varying float vKind, vY;' +
        'void main(){ float k = clamp((uIntro - aLet * 0.17) / 1.15, 0.0, 1.0); k = 1.0 - pow(1.0 - k, 3.0);' +
        ' vec3 p = aPos; p.y -= (1.0 - k) * 1.3; vY = p.y; vec3 n = aNor;' +
        ' if (uFlip > 0.5) { p.y = -1.0 - p.y; n.y = -n.y; p.x += sin(p.y * 15.0 + uT * 1.5) * 0.016 * clamp((-0.5 - p.y) * 1.6, 0.0, 1.0); }' +
        ' vW = p; vN = n; vKind = aKind; gl_Position = uVP * vec4(p, 1.0); }',
        ALTA + 'varying vec3 vW, vN; varying float vKind, vY; uniform vec3 uCam; uniform float uFlip, uT;' +
        'vec3 env(vec3 d){ float a = sin(uT * 0.23) * 0.55; float c = cos(a), s = sin(a); d.xz = mat2(c, -s, s, c) * d.xz;' +
        ' vec3 e = mix(vec3(.016, .018, .024), vec3(.10, .11, .13), smoothstep(-.3, .9, d.y));' +
        ' e += vec3(1.0, .98, .96) * smoothstep(.955, .995, dot(d, normalize(vec3(.35, .75, .55)))) * 1.7;' +
        ' e += vec3(.87, .89, .91) * smoothstep(.08, .0, abs(d.y - .30)) * smoothstep(-.3, .7, d.x) * .8;' +
        ' e += vec3(.87, .89, .91) * smoothstep(.05, .0, abs(d.y + .08)) * smoothstep(.2, -.8, d.x) * .4;' +
        ' e += vec3(1.0, .42, .10) * smoothstep(.8, 1.0, dot(d, normalize(vec3(-.9, .1, -.3)))) * .5;' +
        ' return e; }' +
        'void main(){ if (vY < -0.5) discard;' +
        ' vec3 N = normalize(vN), V = normalize(uCam - vW), R = reflect(-V, N);' +
        ' float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);' +
        ' vec3 base = mix(vec3(.875, .89, .906), vec3(1.0, .42, .10), vKind);' +
        ' float d1 = max(dot(N, normalize(vec3(.35, .8, .6))), 0.0), d2 = max(dot(N, normalize(vec3(-.75, .2, .5))), 0.0);' +
        ' vec3 c = base * (.09 + .80 * d1 + .30 * d2);' +
        ' c += env(R) * mix(vec3(.5), vec3(.9, .45, .2), vKind) * (.3 + .95 * fr);' +
        ' float near = exp(-pow(length(vW.xy - vec2(-.59, .0)) * .85, 2.0));' +
        ' c += vec3(1.0, .42, .10) * (1.0 - vKind) * near * .09 + vec3(1.0, .42, .10) * vKind * .30;' +
        ' float a = uFlip > 0.5 ? .46 * smoothstep(-1.6, -.5, vW.y) : 1.0;' +
        ' gl_FragColor = vec4(c * a, a); }');
      /* A água: escurece um pouco o reflexo, pega o brilho laranja do Λ e some ao longe. */
      agua = programa(gl,
        'attribute vec3 aPos; uniform mat4 uVP; varying vec3 vW; void main(){ vW = aPos; gl_Position = uVP * vec4(aPos, 1.0); }',
        ALTA + 'varying vec3 vW; uniform vec3 uCam; uniform float uT;' +
        'void main(){ vec3 V = normalize(uCam - vW); float fr = pow(1.0 - max(V.y, 0.0), 4.0);' +
        ' float d = length(vW.xz - vec2(-.59, .0));' +
        ' float w = sin(d * 9.0 - uT * 1.4) * .5 + .5;' +
        ' vec3 c = vec3(.04, .047, .06) * fr * 1.5 + vec3(1.0, .42, .10) * exp(-d * d * .8) * (.16 + .05 * w);' +
        ' float a = .42 + .4 * fr; float far = smoothstep(30.0, 7.0, length(vW.xz - uCam.xz));' +
        ' gl_FragColor = vec4(c, a) * far; }');
      brilho = programa(gl,
        'attribute vec3 aPos; uniform mat4 uVP; uniform vec2 uOff; uniform float uFlip;' +
        'void main(){ vec3 p = aPos; if (uFlip > 0.5) p.y = -1.0 - p.y; vec4 q = uVP * vec4(p, 1.0); q.xy += uOff * q.w; gl_Position = q; }',
        'precision mediump float; uniform vec4 uColor; void main(){ gl_FragColor = uColor; }');
      /* O céu da estratosfera: pontos pequenos e nítidos. */
      estrelas = programa(gl,
        'attribute vec3 aPos; attribute float aSeed; uniform mat4 uVP; uniform float uT, uDpr; varying float vA;' +
        'void main(){ gl_Position = uVP * vec4(aPos, 1.0); gl_PointSize = uDpr * (1.0 + 1.9 * aSeed); vA = .3 + .7 * (.5 + .5 * sin(uT * (.5 + aSeed) + aSeed * 40.0)); }',
        'precision mediump float; varying float vA; void main(){ vec2 d = gl_PointCoord - .5; if (dot(d, d) > .25) discard; gl_FragColor = vec4(vec3(.87, .89, .91) * vA, vA); }');
    } catch (err) { semGL(); return; }

    /* As quatro letras, cada uma montada com barras retas extrudadas (o "A" é o Λ, sem travessão). */
    var T = 0.115, CHAO = -0.5, Z = 0.19, OX = -2.37, malha = [];
    function prisma(poly, letra, tipo) {
      var n = poly.length, i, area = 0;
      for (i = 0; i < n; i++) { var p = poly[i], q = poly[(i + 1) % n]; area += p[0] * q[1] - q[0] * p[1]; }
      if (area < 0) poly = poly.slice().reverse();
      function v(pt, z, nx, ny, nz) { malha.push(pt[0], pt[1], z, nx, ny, nz, letra, tipo); }
      for (i = 1; i < n - 1; i++) {
        v(poly[0], Z, 0, 0, 1); v(poly[i], Z, 0, 0, 1); v(poly[i + 1], Z, 0, 0, 1);
        v(poly[0], -Z, 0, 0, -1); v(poly[i + 1], -Z, 0, 0, -1); v(poly[i], -Z, 0, 0, -1);
      }
      for (i = 0; i < n; i++) {
        var a = poly[i], b = poly[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), nx = dy / l, ny = -dx / l;
        v(a, Z, nx, ny, 0); v(b, Z, nx, ny, 0); v(b, -Z, nx, ny, 0); v(a, Z, nx, ny, 0); v(b, -Z, nx, ny, 0); v(a, -Z, nx, ny, 0);
      }
    }
    function ret(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
    function poe(polys, dx, letra, tipo) { polys.forEach(function (p) { prisma(p.map(function (q) { return [q[0] + dx + OX, q[1] + CHAO]; }), letra, tipo); }); }
    var vy = 0.34, h = 0.15, hv = h * (1 - vy) / 0.5, ha = 0.135, c = 0.26, w = 0.95;
    poe([ret(0, 0, T, 1), ret(1 - T, 0, 1, 1), [[0, 1], [0.5, vy], [0.5, vy + hv], [h, 1]], [[1, 1], [1 - h, 1], [0.5, vy + hv], [0.5, vy]]], 0, 0, 0);
    poe([[[0, 0], [ha, 0], [0.5, 1 - ha * 2], [0.5, 1]], [[1 - ha, 0], [1, 0], [0.5, 1], [0.5, 1 - ha * 2]]], 1.28, 1, 1);
    poe([ret(c, 1 - T, w, 1), ret(c, 0, w, T), ret(0, c, T, 1 - c), [[0, 1 - c], [T, 1 - c], [c, 1 - T], [c, 1]], [[0, c], [c, 0], [c, T], [T, c]]], 2.56, 2, 0);
    poe([ret(0, 0, T, 1), ret(w - T, 0, w, 1), ret(T, 0.5 - T / 2, w - T, 0.5 + T / 2)], 3.79, 3, 0);

    var anel = [], k, AX = -0.59;
    for (k = 0; k < 160; k++) {
      var a0 = k / 160 * 6.28319, a1 = (k + 1) / 160 * 6.28319;
      anel.push(AX + Math.cos(a0) * 0.92, 0.04 + Math.sin(a0) * 0.92, -0.5, AX + Math.cos(a1) * 0.92, 0.04 + Math.sin(a1) * 0.92, -0.5);
    }
    var ceu = [];
    for (k = 0; k < 760; k++) ceu.push((Math.random() - 0.5) * 64, 0.15 + Math.pow(Math.random(), 1.6) * 20, -4 - Math.random() * 34, Math.random());
    var mar = [-60, CHAO, -60, 60, CHAO, -60, 60, CHAO, 60, -60, CHAO, -60, 60, CHAO, 60, -60, CHAO, 60];
    var bMalha = buffer(gl, malha), bAnel = buffer(gl, anel), bCeu = buffer(gl, ceu), bMar = buffer(gl, mar), TRIS = malha.length / 8;

    function persp(fov, asp, sobe) { var t = 1 / Math.tan(fov / 2), n = 0.1, f = 90, nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, -sobe, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }
    function olha(e, t) {
      var zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2], l = Math.sqrt(zx * zx + zy * zy + zz * zz); zx /= l; zy /= l; zz /= l;
      var xx = zz, xz = -zx, xl = Math.sqrt(xx * xx + xz * xz) || 1; xx /= xl; xz /= xl;
      var yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
      return [xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
    }
    var asp = 1, dpr = 1, CHAVES = [];
    function rota() {
      /* Dois enquadramentos, os dois com a palavra MΛCH inteira: um de leve pela esquerda e outro de frente.
         e = onde a câmera está, t = para onde olha, u = quanto a cena sobe na tela (o texto fica embaixo).
         "cabe" é a distância em que a palavra ocupa cerca de 82% da largura da tela. */
      var alto = asp < 1, fov = alto ? 0.8 : 0.62;
      var cabe = Math.max(alto ? 4.6 : 6.2, (4.74 * (alto ? 1.22 : 1.9) / 2) / (asp * Math.tan(fov / 2)));
      CHAVES = alto ? [
        { p: 0, e: [-cabe * 0.2, 0.3, cabe * 1.04], t: [0.12, 0, 0], u: [sobeCel, 0, 0] },
        { p: 1, e: [0, cabe * 0.12, cabe], t: [0, 0, 0], u: [sobeCel, 0, 0] }
      ] : [
        { p: 0, e: [-cabe * 0.36, 0.25, cabe * 0.95], t: [0.35, 0.05, 0], u: [0.5, 0, 0] },
        { p: 1, e: [0, cabe * 0.14, cabe], t: [0, 0, 0], u: [0.44, 0, 0] }
      ];
      CHAVES.fov = fov;
    }
    /* no celular em pé, a palavra fica no terço de cima, acima do texto */
    var sobeCel = 0.42;
    function spline(a, b, c2, d, u) { return 0.5 * ((2 * b) + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u); }
    function aoLongo(p, chave) {
      var i = 0; while (i < CHAVES.length - 2 && p > CHAVES[i + 1].p) i++;
      var u = clamp((p - CHAVES[i].p) / (CHAVES[i + 1].p - CHAVES[i].p), 0, 1);
      var k0 = CHAVES[Math.max(0, i - 1)][chave], k1 = CHAVES[i][chave], k2 = CHAVES[i + 1][chave], k3 = CHAVES[Math.min(CHAVES.length - 1, i + 2)][chave];
      return [spline(k0[0], k1[0], k2[0], k3[0], u), spline(k0[1], k1[1], k2[1], k3[1], u), spline(k0[2], k1[2], k2[2], k3[2], u)];
    }
    function tamanho() {
      var cw = canvas.clientWidth, ch = canvas.clientHeight, d = Math.min(window.devicePixelRatio || 1, 2);
      if (cw * ch * d * d > 2.6e6) d = Math.sqrt(2.6e6 / (cw * ch)); /* nitidez sem pesar no aparelho */
      var W = Math.round(cw * d), H = Math.round(ch * d);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, canvas.width, canvas.height); asp = canvas.width / Math.max(1, canvas.height); dpr = d; rota();
    }

    var quer = 0, atual = 0, visivel = true, rodando = false, nasceu = 0, mx = 0, my = 0, wx = 0, wy = 0;
    function leRolagem() { var r = hero.getBoundingClientRect(), vao = hero.offsetHeight - window.innerHeight; quer = vao > 0 ? clamp(-r.top / vao, 0, 1) : 0; }
    function pintaTextos(p) {
      var o = [1 - suave(0.1, 0.36, p), suave(0.4, 0.68, p)];
      for (var i = 0; i < stages.length; i++) {
        stages[i].style.opacity = o[i].toFixed(3);
        stages[i].style.transform = 'translate3d(0,' + ((1 - o[i]) * (i === 0 ? -16 : 20)).toFixed(1) + 'px,0)';
        stages[i].classList.toggle('live', o[i] > 0.6);
      }
    }
    function atrib(loc, n, passo, off) { if (loc === undefined || loc < 0) return; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, passo, off); }
    function letras(VP, olho, t, intro, flip) {
      gl.useProgram(solido.p); gl.bindBuffer(gl.ARRAY_BUFFER, bMalha);
      atrib(solido.aPos, 3, 32, 0); atrib(solido.aNor, 3, 32, 12); atrib(solido.aLet, 1, 32, 24); atrib(solido.aKind, 1, 32, 28);
      gl.uniformMatrix4fv(solido.uVP, false, VP); gl.uniform3fv(solido.uCam, olho);
      gl.uniform1f(solido.uT, t); gl.uniform1f(solido.uIntro, intro); gl.uniform1f(solido.uFlip, flip);
      gl.drawArrays(gl.TRIANGLES, 0, TRIS);
    }
    function aro(VP, flip, alfa) {
      gl.useProgram(brilho.p); gl.bindBuffer(gl.ARRAY_BUFFER, bAnel); atrib(brilho.aPos, 3, 12, 0);
      gl.uniformMatrix4fv(brilho.uVP, false, VP); gl.uniform1f(brilho.uFlip, flip);
      var ox = 2 / canvas.width, oy = 2 / canvas.height, n = dpr > 1.5 ? 3 : 2, i, j;
      gl.uniform4f(brilho.uColor, alfa, 0.42 * alfa, 0.1 * alfa, alfa);
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) { gl.uniform2f(brilho.uOff, (i - (n - 1) / 2) * ox, (j - (n - 1) / 2) * oy); gl.drawArrays(gl.LINES, 0, 320); }
      var f = alfa * 0.16;
      gl.uniform4f(brilho.uColor, f, 0.42 * f, 0.1 * f, f);
      for (i = 0; i < 8; i++) { gl.uniform2f(brilho.uOff, Math.cos(i * 0.785) * ox * 3.2, Math.sin(i * 0.785) * oy * 3.2); gl.drawArrays(gl.LINES, 0, 320); }
    }
    function quadro(agora) {
      if (!visivel) { rodando = false; return; }
      if (!nasceu) nasceu = agora;
      atual += (quer - atual) * 0.085; if (Math.abs(quer - atual) < 0.0004) atual = quer;
      mx += (wx - mx) * 0.05; my += (wy - my) * 0.05;
      var t = agora / 1000, intro = (agora - nasceu) / 1000;
      var olho = aoLongo(atual, 'e'), alvo = aoLongo(atual, 't');
      olho[0] += Math.sin(t * 0.3) * 0.05 + mx * 0.4; olho[1] = Math.max(-0.3, olho[1] + Math.sin(t * 0.23) * 0.025 - my * 0.2);
      var VP = mul(persp(CHAVES.fov, asp, aoLongo(atual, 'u')[0]), olha(olho, alvo));
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(estrelas.p); gl.bindBuffer(gl.ARRAY_BUFFER, bCeu); atrib(estrelas.aPos, 3, 16, 0); atrib(estrelas.aSeed, 1, 16, 12);
      gl.uniformMatrix4fv(estrelas.uVP, false, VP); gl.uniform1f(estrelas.uT, t); gl.uniform1f(estrelas.uDpr, dpr);
      gl.drawArrays(gl.POINTS, 0, 760);

      gl.enable(gl.DEPTH_TEST);
      aro(VP, 1, 0.3 * suave(0.9, 2.2, intro));            /* o reflexo primeiro… */
      letras(VP, olho, t, intro, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(agua.p); gl.bindBuffer(gl.ARRAY_BUFFER, bMar); atrib(agua.aPos, 3, 12, 0);  /* …a água por cima… */
      gl.uniformMatrix4fv(agua.uVP, false, VP); gl.uniform3fv(agua.uCam, olho); gl.uniform1f(agua.uT, t);
      gl.depthMask(false); gl.drawArrays(gl.TRIANGLES, 0, 6); gl.depthMask(true);
      letras(VP, olho, t, intro, 0);                         /* …e por fim as letras e o anel. */
      gl.blendFunc(gl.ONE, gl.ONE);
      aro(VP, 0, 0.75 * suave(0.9, 2.2, intro));
      pintaTextos(atual);
      requestAnimationFrame(quadro);
    }
    function acorda() { if (!rodando && visivel) { rodando = true; requestAnimationFrame(quadro); } }
    tamanho(); leRolagem(); atual = quer; pintaTextos(atual); acorda();
    window.addEventListener('scroll', function () { leRolagem(); acorda(); }, { passive: true });
    window.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') { wx = e.clientX / window.innerWidth - 0.5; wy = e.clientY / window.innerHeight - 0.5; } }, { passive: true });
    var deNovo, lw = canvas.clientWidth, lh = canvas.clientHeight;
    window.addEventListener('resize', function () {
      clearTimeout(deNovo);
      deNovo = setTimeout(function () { if (canvas.clientWidth !== lw || canvas.clientHeight !== lh) { lw = canvas.clientWidth; lh = canvas.clientHeight; tamanho(); leRolagem(); } }, 160);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; acorda(); }).observe(hero);
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visivel = false; semGL(); });
  }

  /* ══════════ 2) COMO FUNCIONA: o símbolo Λ do traço ao sólido ══════════
     Só liga quando a seção chega perto da tela. */
  function simbolo() {
    var sec = document.getElementById('como'), cv = document.getElementById('obj'), trilho = document.getElementById('trilho');
    if (!sec || !cv || !trilho) return;
    function plano() { sec.classList.add('plano'); }
    var ligado = false;
    function liga() {
      if (ligado) return;
      ligado = true;
      var g = cv.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
      if (!g) { plano(); return; }
      var solido, traco;
      try {
        solido = programa(g,
          'attribute vec3 aPos; attribute vec3 aNor; uniform mat4 uM; uniform mat3 uN; varying vec3 vN;' +
          'void main(){ vN = uN * aNor; gl_Position = uM * vec4(aPos, 1.0); }',
          'precision mediump float; varying vec3 vN; uniform float uFill, uGlow;' +
          'void main(){ vec3 n = normalize(vN); float d = max(dot(n, normalize(vec3(.45, .7, .6))), 0.0);' +
          ' float rim = pow(1.0 - abs(n.z), 2.2);' +
          ' vec3 base = mix(vec3(.62, .26, .06), vec3(1.0, .42, .10), uGlow);' +
          ' vec3 c = base * (.2 + .8 * d) + vec3(1.0, .6, .3) * rim * (.2 + .6 * uGlow);' +
          ' gl_FragColor = vec4(c * uFill, uFill); }');
        traco = programa(g,
          'attribute vec3 aPos; attribute float aT; uniform mat4 uM; uniform vec2 uOff; varying float vT;' +
          'void main(){ vT = aT; vec4 p = uM * vec4(aPos, 1.0); p.xy += uOff * p.w; gl_Position = p; }',
          'precision mediump float; varying float vT; uniform float uDraw, uAlpha; uniform vec3 uColor;' +
          'void main(){ if (vT > uDraw) discard; gl_FragColor = vec4(uColor * uAlpha, uAlpha); }');
      } catch (err) { plano(); return; }

      /* O Λ da MACH: duas barras que se encontram no topo, e os três diamantes de choque embaixo. */
      var tri = [], lin = [], LINHAS = 0;
      function prisma(poly, prof, pula) {
        var n = poly.length, i, j, a, b;
        for (i = 1; i < n - 1; i++) {
          [[0, i, i + 1, prof, 1], [0, i + 1, i, -prof, -1]].forEach(function (f) {
            for (j = 0; j < 3; j++) { var v = poly[f[j]]; tri.push(v[0], v[1], f[3], 0, 0, f[4]); }
          });
        }
        for (i = 0; i < n; i++) {
          a = poly[i]; b = poly[(i + 1) % n];
          if (i !== pula) {
            var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy), nx = dy / l, ny = -dx / l;
            [[a, prof], [b, prof], [b, -prof], [a, prof], [b, -prof], [a, -prof]].forEach(function (q) { tri.push(q[0][0], q[0][1], q[1], nx, ny, 0); });
            lin.push(a[0], a[1], prof, 0, b[0], b[1], prof, 0, a[0], a[1], -prof, 0, b[0], b[1], -prof, 0);
          }
          lin.push(a[0], a[1], prof, 0, a[0], a[1], -prof, 0);
        }
      }
      var sobe = 0.58;
      function ergue(p) { return p.map(function (v) { return [v[0], v[1] + sobe]; }); }
      prisma(ergue([[-1, -1], [-0.7, -1], [0, 0.5], [0, 1]]), 0.24, 2);
      prisma(ergue([[0.7, -1], [1, -1], [0, 1], [0, 0.5]]), 0.24, 2);
      [[-1.46, 0.17, 0.25], [-1.88, 0.12, 0.17], [-2.18, 0.08, 0.115]].forEach(function (d) {
        prisma(ergue([[0, d[0] - d[2]], [d[1], d[0]], [0, d[0] + d[2]], [-d[1], d[0]]]), 0.12, -1);
      });
      LINHAS = lin.length / 4;
      for (var k = 0; k < LINHAS; k++) lin[k * 4 + 3] = (k >> 1) / (LINHAS / 2); /* a ordem em que os traços aparecem */
      var aneis = [];
      for (k = 0; k < 96; k++) {
        var a0 = k / 96 * 6.28319, a1 = (k + 1) / 96 * 6.28319;
        aneis.push(Math.cos(a0) * 1.95, Math.sin(a0) * 1.95, 0, 0, Math.cos(a1) * 1.95, Math.sin(a1) * 1.95, 0, 0);
      }
      var bTri = buffer(g, tri), bLin = buffer(g, lin), bAnel = buffer(g, aneis);

      function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
      function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
      function poe(s, z) { return [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, z, 1]; }
      function persp(asp) { var t = 1 / Math.tan(0.349), n = 0.1, f = 40, nf = 1 / (n - f); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]; }

      var asp = 1, px = 1;
      function tamanho() {
        var d = Math.min(window.devicePixelRatio || 1, 2), w = Math.round(cv.clientWidth * d), h = Math.round(cv.clientHeight * d);
        if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
        g.viewport(0, 0, cv.width, cv.height); asp = cv.width / Math.max(1, cv.height); px = d;
      }
      function tracos(buf, quantos, M, desenho, alfa, cor) {
        g.useProgram(traco.p); g.bindBuffer(g.ARRAY_BUFFER, buf);
        g.enableVertexAttribArray(traco.aPos); g.vertexAttribPointer(traco.aPos, 3, g.FLOAT, false, 16, 0);
        g.enableVertexAttribArray(traco.aT); g.vertexAttribPointer(traco.aT, 1, g.FLOAT, false, 16, 12);
        g.uniformMatrix4fv(traco.uM, false, M); g.uniform1f(traco.uDraw, desenho); g.uniform1f(traco.uAlpha, alfa); g.uniform3fv(traco.uColor, cor);
        var ox = 2 / cv.width, oy = 2 / cv.height, n = px > 1.5 ? 4 : 2; /* traço mais grosso: o mesmo desenho deslocado um pixel */
        for (var i = 0; i < n; i++) { g.uniform2f(traco.uOff, (i & 1) * ox, (i >> 1) * oy); g.drawArrays(g.LINES, 0, quantos); }
      }

      var quer = 0, atual = 0, visivel = false, rodando = false;
      function le() { quer = clamp(trilho.scrollLeft / Math.max(1, trilho.scrollWidth - trilho.clientWidth), 0, 1); }
      function quadro(agora) {
        if (!visivel) { rodando = false; return; }
        atual += (quer - atual) * 0.08; if (Math.abs(quer - atual) < 0.0004) atual = quer;
        var t = agora / 1000, desenho = suave(-0.25, 0.36, atual), cheio = suave(0.42, 0.68, atual), luz = suave(0.74, 0.98, atual);
        var escala = Math.min(1, asp * 1.12) * (1 + luz * 0.06);
        var R = mul(rotX(0.22 + Math.sin(t * 0.5) * 0.05), rotY(t * 0.3 + atual * 7.6));
        var P = persp(asp), M = mul(P, mul(poe(escala, -6.4), R));
        g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
        g.enable(g.BLEND); g.blendFunc(g.ONE, g.ONE_MINUS_SRC_ALPHA); g.enable(g.DEPTH_TEST);
        if (cheio > 0.01) {
          g.useProgram(solido.p); g.bindBuffer(g.ARRAY_BUFFER, bTri);
          g.enableVertexAttribArray(solido.aPos); g.vertexAttribPointer(solido.aPos, 3, g.FLOAT, false, 24, 0);
          g.enableVertexAttribArray(solido.aNor); g.vertexAttribPointer(solido.aNor, 3, g.FLOAT, false, 24, 12);
          g.uniformMatrix4fv(solido.uM, false, M); g.uniformMatrix3fv(solido.uN, false, [R[0], R[1], R[2], R[4], R[5], R[6], R[8], R[9], R[10]]);
          g.uniform1f(solido.uFill, cheio); g.uniform1f(solido.uGlow, luz);
          g.enable(g.POLYGON_OFFSET_FILL); g.polygonOffset(1, 1);
          g.drawArrays(g.TRIANGLES, 0, tri.length / 6);
          g.disable(g.POLYGON_OFFSET_FILL);
          g.disableVertexAttribArray(solido.aNor);
        }
        tracos(bLin, LINHAS, M, desenho, 0.95 - cheio * 0.45, [0.875, 0.89, 0.906]);
        var Ma = mul(P, mul(poe(escala * (1 + luz * 0.1), -6.4), mul(rotX(1.12), rotY(t * 0.22))));
        tracos(bAnel, 192, Ma, 2, 0.3 + luz * 0.55, luz > 0.5 ? [1.0, 0.42, 0.1] : [0.54, 0.57, 0.61]);
        requestAnimationFrame(quadro);
      }
      function acorda() { if (!rodando && visivel) { rodando = true; tamanho(); requestAnimationFrame(quadro); } }
      trilho.addEventListener('scroll', function () { le(); acorda(); }, { passive: true });
      window.addEventListener('resize', function () { tamanho(); le(); });
      new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; if (visivel) { le(); acorda(); } }).observe(sec);
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); visivel = false; plano(); });
      le(); atual = quer;
    }
    if ('IntersectionObserver' in window) {
      var perto = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { perto.disconnect(); liga(); } }, { rootMargin: '100% 0px' });
      perto.observe(sec);
    } else liga();
  }

  function iniciar() {
    if (!raiz.classList.contains('gl')) return;
    abertura();
    if (raiz.classList.contains('gl')) simbolo();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
