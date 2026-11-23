/* Casca & Miolo — a primeira tela: forno de lenha, pá, pão e vapor.
   Pintura feita num shader WebGL2 (sem imagens). Tudo depende de (tempo, rolagem),
   então o mesmo quadro sai sempre igual: dá para filmar quadro a quadro. */
(function () {
  'use strict';

  const VERT = `#version 300 es
  in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

  const FRAG = `#version 300 es
  precision highp float;
  out vec4 outColor;
  uniform vec2 uRes;      // tamanho do canvas em px reais
  uniform float uDpr, uTime, uProg, uVel, uScroll;
  uniform vec4 uArch;     // centro x, base y, meia largura, altura (px CSS)
  uniform vec2 uSill;     // y da soleira, espessura do arco de tijolos
  uniform vec4 uLoaf;     // centro x, centro y, raio x, raio y
  uniform vec4 uPeel;     // centro x, centro y, meia largura, meia altura
  uniform float uFadeTop; // onde a parede do forno some no fundo da página
  uniform float uSteam;   // quantidade de vapor (0..1.5)

  const vec3 FORNO   = vec3( 31., 10.,  3.)/255.;
  const vec3 PESTANA = vec3( 68., 22.,  8.)/255.;
  const vec3 CESC    = vec3(102., 49., 22.)/255.;
  const vec3 CASCA   = vec3(131., 76., 36.)/255.;
  const vec3 PONTO   = vec3(162., 92., 26.)/255.;
  const vec3 DOURADO = vec3(177.,132., 85.)/255.;
  const vec3 ABERT   = vec3(207.,171.,134.)/255.;
  const vec3 FARINHA = vec3(245.,242.,236.)/255.;
  const vec3 FOGO    = vec3(1.0, 0.55, 0.20);

  float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
  float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
  float fbm3(vec2 p){ float v=0., a=.5; for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.07+vec2(3.1,1.3); a*=.5; } return v; }
  mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

  vec3 crust(float b){ // 0 = casca clara ... 1 = pestana
    vec3 c = mix(ABERT, DOURADO, smoothstep(0.0, .22, b));
    c = mix(c, PONTO,   smoothstep(.18, .42, b));
    c = mix(c, CASCA,   smoothstep(.38, .62, b));
    c = mix(c, CESC,    smoothstep(.58, .80, b));
    c = mix(c, PESTANA, smoothstep(.78, 1.0, b));
    return c;
  }

  // premultiplicado: pinta de trás para a frente
  void over(inout vec4 acc, vec3 c, float a){ acc.rgb = c*a + acc.rgb*(1.-a); acc.a = a + acc.a*(1.-a); }

  // ---- pão (elipsoide visto de cima, câmera a ~36 graus) ----
  const float PHI = 0.84;
  const float K = 0.56;      // o pão é mais baixo que largo
  const float ZB = -0.10;    // onde a base encosta na pá
  void cutParts(vec2 w, out float inCut, out float ear, out float along, out float dy){
    vec2 sc = rot(0.30) * (w - vec2(0.02, 0.02));
    along = sc.x;
    float curve = -0.04 + 0.42*sc.x*sc.x;
    dy = sc.y - curve + (noise(vec2(sc.x*14., 3.)) - .5)*0.022;
    float taper = smoothstep(0.86, 0.20, abs(sc.x));
    float hw = 0.14 * taper + 0.003;
    inCut = (1. - smoothstep(hw*0.62, hw, abs(dy))) * step(0.001, taper);
    // a orelha levanta do lado de trás do corte
    ear = smoothstep(hw*2.6, hw*1.0, dy) * (1. - smoothstep(hw*1.0, hw*0.72, dy)) * taper;
  }
  float cutH(vec2 w){ float ic, ea, al, dy; cutParts(w, ic, ea, al, dy); return ea*0.11 - ic*0.07; }

  float steamField(vec2 p, float H){
    vec2 o = vec2(uLoaf.x, uLoaf.y - uLoaf.z*0.55);
    vec2 s = p - o;
    float up = -s.y;
    if (up < -uLoaf.z*0.4) return 0.;
    float W = uLoaf.z;
    float tt = uTime*0.32 + uScroll*0.0022;
    // o vapor entorta quando a página anda (velocidade da rolagem) e balança devagar
    s.x += sin(up*0.010 - uTime*0.6)*10.*smoothstep(0., 240., up) - uVel*max(up,0.)*0.0011;
    float width = W*0.42 + max(up,0.)*0.30;
    float m = exp(-pow(s.x/width, 2.)*1.6) * smoothstep(-W*0.25, W*0.25, up) * exp(-max(up,0.)/(H*0.34));
    if (m < 0.003) return 0.;
    vec2 q = vec2(s.x/W*1.25, up/W*0.85 - tt);
    vec2 w = vec2(fbm3(q*1.2 + vec2(0., -tt*0.4)), fbm3(q*1.2 + vec2(5.2, 1.3 - tt*0.3)));
    float d = fbm(q*1.9 + w*2.4 + vec2(0., -tt*0.5));
    float wisps = smoothstep(0.32, 0.76, d);
    return wisps * m;
  }

  void main(){
    vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
    float W = uRes.x/uDpr, H = uRes.y/uDpr;
    vec4 acc = vec4(0.);

    float cx = uArch.x, baseY = uArch.y, aw = uArch.z, ah = uArch.w;
    float sillY = uSill.x, bt = uSill.y;
    vec2 q = p - vec2(cx, baseY);
    float yy = min(q.y, 0.) * aw/ah;
    float d = length(vec2(q.x, yy)) - aw;          // < 0 dentro da boca do forno
    float px = 1.0/uDpr;

    // ---------- parede do forno (fundo) ----------
    float wallA = smoothstep(uFadeTop - 90., uFadeTop + 30., p.y);
    if (wallA > 0.) {
      vec2 bp = p / vec2(54., 24.);
      bp.x += step(1., mod(floor(bp.y), 2.)) * 0.5;
      vec2 f = fract(bp);
      float mortar = 1. - smoothstep(0.0, 0.06, min(min(f.x, 1.-f.x)*54./24., min(f.y, 1.-f.y))*1.0);
      float tone = hash(floor(bp));
      vec3 wall = mix(FORNO*1.10, PESTANA*0.62, tone*0.6) * (1. - mortar*0.45);
      wall *= 0.85 + 0.25*fbm3(p*0.03);
      float spill = exp(-max(d, 0.)/85.) * smoothstep(sillY + 40., sillY - 20., p.y);
      wall += FOGO * spill * 0.30 * (0.9 + 0.1*sin(uTime*7.1 + sin(uTime*3.3)));
      over(acc, wall, wallA);
    }

    // ---------- boca do forno ----------
    bool inside = d < 0. && p.y < sillY;
    if (inside) {
      float floorY0 = baseY + (sillY - baseY)*0.10;
      float flick = 0.92 + 0.08*sin(uTime*6.3) * sin(uTime*2.7 + 1.3) + 0.05*(noise(vec2(uTime*3., 0.)) - .5);
      vec2 gc = vec2(cx - aw*0.10, baseY - ah*0.12);
      float g = exp(-length((p - gc)/vec2(aw*1.10, ah*0.85))*1.8) * flick;
      vec3 c = mix(vec3(0.09, 0.025, 0.008), vec3(0.62, 0.20, 0.05), g) + FOGO*g*g*0.75;
      // teto da cúpula mais escuro
      float iy = (p.y - baseY)/ah;
      c *= 0.55 + 0.45*smoothstep(-1.0, -0.15, iy);
      // fogo de lenha no fundo, à esquerda
      vec2 fq = (p - vec2(cx - aw*0.66, baseY - ah*0.02)) / (aw*0.34);
      {
        float n = fbm(vec2(fq.x*3.0, fq.y*2.2 + uTime*1.9));
        float shape = (1. - smoothstep(0.0, 0.85, abs(fq.x))) * smoothstep(-1.3, 0.1, fq.y) * (1. - smoothstep(0.1, 0.5, fq.y));
        float fl = smoothstep(0.45, 0.95, n*shape*1.25 + (fq.y + 0.3)*0.35*shape);
        c += mix(vec3(0.85,0.22,0.03), vec3(1.0,0.72,0.32), fl) * fl * 0.95;
        c += FOGO * shape * 0.10;
      }
      // chão de pedra do forno
      if (p.y > floorY0) {
        float ft = (p.y - floorY0)/(sillY - floorY0);
        vec3 fl = mix(vec3(0.30, 0.10, 0.03), vec3(0.46, 0.20, 0.08), g*1.2) * (0.85 + 0.3*fbm3(p*vec2(0.05, 0.12)));
        c = mix(c, fl, smoothstep(0., 0.25, ft));
      }
      float aa = clamp(-d/px*0.5, 0., 1.);
      over(acc, c, aa);
    }

    // ---------- arco de tijolos ----------
    if (d > -1. && d < bt + 1. && p.y < sillY) {
      float u;
      float N = 15.;
      if (q.y < 0.) { float ang = atan(q.x, -yy); u = ang/3.14159*N; }
      else u = sign(q.x)*(N*0.5 + q.y/22.);
      float m = 1. - smoothstep(0.035, 0.085, abs(fract(u + 0.5) - 0.5));
      float id = floor(u + 0.5);
      float inner = exp(-max(d,0.)/11.);
      vec3 b = mix(CESC*0.9, PESTANA*0.85, hash(vec2(id, 7.)));
      b *= 0.8 + 0.35*fbm3(vec2(u*3., d*0.15));
      b = b*(0.45 + 0.6*inner) + FOGO*inner*0.42;
      b = mix(b, FORNO*0.7, m);
      b = mix(b, FORNO*0.6, smoothstep(bt - 3., bt, d));
      float aa = clamp(min(d + 1., bt + 1. - d)/px*0.5, 0., 1.);
      over(acc, b, aa);
    }

    // ---------- bancada e soleira ----------
    if (p.y > sillY - 1.) {
      float t = p.y - sillY;
      vec3 c = mix(vec3(0.20, 0.08, 0.035), FORNO*1.05, smoothstep(0., 70., t));
      c *= 0.85 + 0.25*fbm3(p*vec2(0.02, 0.08));
      float lip = exp(-t/2.5) * exp(-pow((p.x - cx)/(aw*1.2), 2.));
      c += FOGO * lip * 0.55;
      c += FOGO * exp(-t/30.) * exp(-pow((p.x - cx)/(aw*1.1), 2.)) * 0.10;
      over(acc, c, clamp((p.y - sillY + 1.)/px*0.5, 0., 1.));
    }

    // ---------- pá de madeira (no plano da base do pão) ----------
    {
      float sp = sin(PHI), cp = cos(PHI);
      vec2 sv = vec2(p.x - uLoaf.x, -(p.y - uLoaf.y)) / uLoaf.z;
      float wy = (sv.y - ZB*cp)/sp;              // ponto no chão (plano da pá)
      float wyT = (sv.y - (ZB-0.07)*cp)/sp;      // mesma conta 7% abaixo: a espessura
      vec2 w = vec2(sv.x, wy);
      float persp = 1. + 0.06*max(-wy - 1., 0.);
      vec2 bq = vec2(w.x, w.y + 0.10) / vec2(1.17, 1.02);
      float ex = bq.y > 0. ? 2.3 : 4.0;
      float blade = pow(pow(abs(bq.x), ex) + pow(abs(bq.y), ex), 1./ex) - 1.;
      float hw = 0.11 * persp;
      float handle = (wy < -0.6) ? abs(w.x) - hw : 1e5;
      vec2 bqT = vec2(w.x, wyT + 0.10) / vec2(1.17, 1.02);
      float exT = bqT.y > 0. ? 2.3 : 4.0;
      float bladeT = pow(pow(abs(bqT.x), exT) + pow(abs(bqT.y), exT), 1./exT) - 1.;
      float handleT = (wyT < -0.6) ? abs(w.x) - hw : 1e5;
      float top = min(blade, handle);
      float side = min(bladeT, handleT);
      float pxw = 1.0/(uDpr*uLoaf.z);
      if (min(top, side) < pxw*2.) {
        float grain = noise(vec2(w.x*26., w.y*1.6))*0.6 + noise(vec2(w.x*90., w.y*4.))*0.4;
        vec3 wood = mix(DOURADO*0.88, ABERT*0.96, grain);
        wood = mix(wood, CASCA, smoothstep(0.62, 0.9, noise(w*vec2(9., 2.)))*0.30);
        wood = mix(wood, FARINHA, step(0.972, hash(floor(p*1.3))) * 0.5 * step(-0.6, wy));
        float light = 0.70 + 0.30*smoothstep(-1., 1., wy);
        light *= 1. - 0.5*smoothstep(-1., -3.5, wy);  // o cabo sai da luz do forno
        wood *= light * vec3(1.06, 0.95, 0.84);
        wood += FOGO * 0.20 * smoothstep(0.2, 1.1, wy);
        float rim = smoothstep(-0.04, 0.0, blade) * step(0.4, wy);
        wood += FOGO * rim * 0.6;
        // sombra do pão sobre a pá
        float sh = length(w / vec2(1.02, 0.98));
        wood *= 1. - 0.62*smoothstep(1.25, 0.85, sh);
        vec3 c = wood;
        float a = clamp(-top/pxw*0.5 + 0.5, 0., 1.);
        // borda (espessura) visível na frente
        float aSide = clamp(-side/pxw*0.5 + 0.5, 0., 1.) * (1. - a);
        vec3 edge = DOURADO*0.42 * (0.8 + 0.2*grain);
        over(acc, edge, aSide);
        over(acc, c, a);
      }
    }

    // ---------- pão ----------
    {
      vec2 sv = vec2(p.x - uLoaf.x, -(p.y - uLoaf.y)) / uLoaf.z;
      float sp = sin(PHI), cp = cos(PHI);
      vec3 D = vec3(0., cp, -sp), U = vec3(0., sp, cp);
      vec3 O = vec3(sv.x, 0., 0.) + sv.y*U - 4.*D;
      vec3 Os = vec3(O.xy, O.z/K), Ds = vec3(D.xy, D.z/K);
      float qa = dot(Ds,Ds), qb = dot(Os,Ds), qc = dot(Os,Os) - 1.;
      float disc = qb*qb - qa*qc;
      if (disc > -0.05) {
        float t = (-qb - sqrt(max(disc, 0.)))/qa;
        vec3 P = O + t*D;
        vec3 n = normalize(vec3(P.x, P.y, P.z/(K*K)));
        vec2 w = P.xy;
        float inCut, ear, along, dy;
        cutParts(w, inCut, ear, along, dy);
        float e = 0.01;
        vec2 gh = vec2(cutH(w+vec2(e,0.)) - cutH(w-vec2(e,0.)), cutH(w+vec2(0.,e)) - cutH(w-vec2(0.,e)))/(2.*e);
        float topness = clamp(n.z, 0., 1.);
        n = normalize(n - vec3(gh*1.6*topness, 0.));
        // casca enrugada
        vec2 tn = vec2(fbm3(w*7.), fbm3(w*7. + 4.1)) - .5;
        n = normalize(n + vec3(tn*0.45*(1.-inCut), 0.));

        float bake = 0.78 - 0.26*topness + (fbm(w*3.0 + 2.) - .5)*0.70;
        bake += ear*0.45 + smoothstep(0.25, -0.05, P.z)*0.22;
        bake = mix(bake, 0.06 + 0.30*fbm(vec2(along*8., dy*20.)), inCut);
        vec3 base = crust(clamp(bake, 0., 1.));
        float hwC = 0.14 * smoothstep(0.86, 0.20, abs(along)) + 0.003;
        // dentro do corte: mais escuro embaixo da orelha
        base *= mix(1.0, 0.55, inCut * smoothstep(0.0, hwC*0.95, dy));
        // crista da orelha pega luz
        float crest = exp(-pow((dy - hwC*1.12)/(hwC*0.28 + 1e-3), 2.)) * smoothstep(0.86, 0.3, abs(along));
        float bl = smoothstep(0.86, 0.95, noise(w*46.)) * (1.-inCut);
        base = mix(base, CESC, bl*0.30);
        // farinha do cesto de fermentação: linhas em espiral, falhadas
        float rr = length(w);
        float ang = atan(w.y, w.x);
        float ring = sin(rr*52. + ang*1.0 + fbm3(w*2.5)*4.)*0.5 + 0.5;
        float brk = smoothstep(0.30, 0.62, fbm(vec2(ang*3.0, rr*6.) + 11.));
        float patchy = smoothstep(0.30, 0.60, fbm(w*2.2 + 7.));
        float dust = smoothstep(0.35, 0.85, noise(w*95.)) * 0.7 + 0.3;
        float flour = smoothstep(0.62, 0.95, ring) * brk * patchy * dust;
        flour = max(flour, smoothstep(0.66, 0.92, fbm(w*5.0 + 3.))*0.40*patchy*dust);
        flour *= smoothstep(0.15, 0.55, topness) * (1. - smoothstep(0., 1., inCut*1.6 + ear*1.6));
        base = mix(base, FARINHA*0.90, clamp(flour, 0., 1.)*0.62);

        vec3 Lk = normalize(vec3(-0.55, -0.55, 0.80));
        vec3 Lo = normalize(vec3(0.15, 1.0, 0.30));
        vec3 V = vec3(0., -cp, sp);
        float dif = max(dot(n, Lk), 0.);
        float oven = pow(max(dot(n, Lo), 0.), 1.5);
        float fres = pow(1. - max(dot(n, V), 0.), 3.0);
        vec3 c = base * (0.22 + 0.92*dif);
        c += FOGO * oven * 0.42 * (0.92 + 0.08*sin(uTime*6.3)) * (1. - flour*0.5);
        c += FOGO * fres * 0.16;
        float spec = pow(max(dot(reflect(-Lk, n), V), 0.), 16.) * (1.-flour) * 0.12;
        c += spec;
        c += ABERT * crest * 0.30 * (0.5 + 0.5*dif);
        // oclusão perto da base
        c *= mix(1., 0.50, smoothstep(0.20, ZB, P.z));
        float cov = smoothstep(0., fwidth(disc)*1.5 + 1e-5, disc) * smoothstep(ZB, ZB + fwidth(P.z)*1.5 + 1e-5, P.z);
        over(acc, c, cov);
      }
    }

    // ---------- vapor ----------
    float st = steamField(p, H) * uSteam;
    if (st > 0.001) {
      float nearLoaf = exp(-max(uLoaf.y - p.y, 0.)/120.);
      st *= mix(0.55, 1., smoothstep(uFadeTop - 160., uFadeTop + 40., p.y));   // mais leve sobre o texto
      vec3 sc = mix(FARINHA, mix(FARINHA, vec3(1.0, 0.80, 0.62), 0.6), nearLoaf);
      over(acc, sc, clamp(st*0.85, 0., 0.78));
    }

    // grão de filme bem leve
    float gr = hash(p*uDpr + fract(uTime*13.7)*91.) - .5;
    acc.rgb += gr * 0.035 * acc.a;
    outColor = acc;
  }`;

  function Forno(canvas) {
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
    this.ok = !!gl;
    if (!gl) return;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uRes', 'uDpr', 'uTime', 'uProg', 'uVel', 'uScroll', 'uArch', 'uSill', 'uLoaf', 'uPeel', 'uFadeTop', 'uSteam'])
      this.u[n] = gl.getUniformLocation(pr, n);
    this.gl = gl; this.canvas = canvas;
  }

  Forno.prototype.tamanho = function (w, h, dpr) {
    if (!this.ok) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  };

  // Geometria da cena para o tamanho atual e o avanço da rolagem (prog 0..1)
  Forno.prototype.geometria = function (prog) {
    const w = this.w, h = this.h;
    const largo = w / h > 0.9;
    const e = prog * prog * (3 - 2 * prog);
    let cx, aw, ah, baseY, sillY, bt, fade;
    if (largo) {
      cx = w * 0.72; aw = Math.min(w * 0.22, h * 0.34); ah = aw * 0.92;
      baseY = h * 0.66; sillY = h * 0.78; bt = aw * 0.17; fade = baseY - ah - 40;
    } else {
      // o forno ocupa o espaço que sobra embaixo do texto
      const topo = (this.textoFim || h * 0.48) + 18;
      const livre = Math.max(120, h - topo);
      cx = w * 0.5; aw = Math.min(w * 0.40, livre * 0.50); ah = aw * 0.86;
      sillY = h - Math.min(h * 0.20, livre * 0.405); baseY = sillY - aw * 0.29;
      bt = aw * 0.17; fade = baseY - ah - 30;
    }
    const zoom = 1 + e * 0.10;
    // o pão vem para perto: desce e cresce
    const R = aw * 0.58 * (1 + e * 0.60);
    const lcx = cx;
    const lcy = sillY - R * 0.30 + e * h * 0.10;
    return {
      arch: [cx, baseY + (zoom - 1) * 30, aw * zoom, ah * zoom], sill: [sillY + (zoom - 1) * 30, bt * zoom],
      loaf: [lcx, lcy, R, 0], peel: [0, 0, 0, 0], fade: Math.max(fade, this.fadeMin || 0),
    };
  };

  Forno.prototype.desenhar = function (t, prog, vel, scroll, vapor) {
    if (!this.ok) return;
    const gl = this.gl, u = this.u, g = this.geometria(prog);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uDpr, this.canvas.width / this.w);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uProg, prog);
    gl.uniform1f(u.uVel, vel);
    gl.uniform1f(u.uScroll, scroll);
    gl.uniform4fv(u.uArch, g.arch);
    gl.uniform2fv(u.uSill, g.sill);
    gl.uniform4fv(u.uLoaf, g.loaf);
    gl.uniform4fv(u.uPeel, g.peel);
    gl.uniform1f(u.uFadeTop, g.fade);
    gl.uniform1f(u.uSteam, vapor == null ? 1 : vapor);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  window.Forno = Forno;
})();
