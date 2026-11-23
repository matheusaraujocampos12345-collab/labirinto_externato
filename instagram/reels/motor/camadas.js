// Projeção axonométrica (sem perspectiva) para desmontar uma cena em camadas planas.
// Cada camada é um plano (u, v) centrado em (0, 0). Como a projeção é afim,
// dá para desenhar texto e imagens direto no plano com setTransform.
//
//   const p = plano({ cx: 540, cy: 900, inclinacao: 0.9, giro: -0.5, altura: 120 });
//   ctx.save(); aplicarPlano(ctx, p); /* desenhe em (u, v) */ ctx.restore();

/** inclinacao = rotação em X (0 = de frente), giro = rotação em Z, altura = afastamento da camada. */
export function plano({ cx = 540, cy = 960, inclinacao = 0, giro = 0, altura = 0, escala = 1 } = {}) {
  const cz = Math.cos(giro), sz = Math.sin(giro);
  const cxr = Math.cos(inclinacao), sxr = Math.sin(inclinacao);
  return {
    a: escala * cz,
    b: escala * sz * cxr,
    c: -escala * sz,
    d: escala * cz * cxr,
    e: cx,
    f: cy - escala * altura * sxr,
  };
}

export function aplicarPlano(ctx, p) {
  ctx.transform(p.a, p.b, p.c, p.d, p.e, p.f);
}

export function pontoPlano(p, u, v) {
  return [p.a * u + p.c * v + p.e, p.b * u + p.d * v + p.f];
}
