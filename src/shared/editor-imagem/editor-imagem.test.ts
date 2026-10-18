import { describe, expect, it } from 'vitest';
import {
  Historico, Traco, adicionarCamada, apagarSelecao, camadaAtiva, clonarPixels, colarSobre, combinarMascaras, compor, contornoDeForma, corDeHex, cortarAoConteudo,
  criarMascara, criarPixels, desenharCaminho, deslocarMascara, duplicarCamada, espelhar, espelharDocumento, extrairSelecao, girar90, girarDocumento, hexDeCor, inverterMascara,
  lerCor, limitesDoConteudo, limitesDaMascara, mascaraElipse, mascaraLaco, mascaraPorCor, mascaraRetangulo, mesclarAbaixo, moverCamada, novoDocumento, paletaDoSprite, preencher,
  preencherForma, prepararEdicao, redimensionar, redimensionarDocumento, redimensionarTela, removerCamada, restaurarInstantaneo, tirarInstantaneo, escreverCor, type Cor,
} from './index';

const VERMELHO: Cor = { r: 255, g: 0, b: 0, a: 255 };
const AZUL: Cor = { r: 0, g: 0, b: 255, a: 255 };
const preto = (w: number, h: number) => { const p = criarPixels(w, h); for (let i = 0; i < w * h; i++) escreverCor(p, i % w, (i / w) | 0, { r: 0, g: 0, b: 0, a: 255 }); return p; };
const opaco = (p: ReturnType<typeof criarPixels>) => { let n = 0; for (let i = 3; i < p.data.length; i += 4) if (p.data[i]! > 0) n++; return n; };

describe('pincel e borracha', () => {
  it('pinta um traço com a cor, dentro do diâmetro, e deixa o resto intacto', () => {
    const p = criarPixels(40, 20);
    desenharCaminho(p, [{ x: 5, y: 10 }, { x: 35, y: 10 }], { tamanho: 6, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    expect(lerCor(p, 20, 10)).toEqual(VERMELHO);
    expect(lerCor(p, 20, 11).a).toBe(255);
    expect(lerCor(p, 20, 16).a).toBe(0);
    expect(lerCor(p, 0, 10).a).toBe(0);
    expect(lerCor(p, 38, 10).a).toBe(0);
  });

  it('a opacidade vale para o traço inteiro: cruzar por cima de si mesmo não escurece', () => {
    const p = criarPixels(40, 40);
    desenharCaminho(p, [{ x: 5, y: 20 }, { x: 35, y: 20 }, { x: 5, y: 20 }, { x: 20, y: 5 }, { x: 20, y: 35 }], { tamanho: 8, dureza: 100, opacidade: 0.5, cor: VERMELHO, modo: 'pintar' });
    expect(Math.abs(lerCor(p, 20, 20).a - 127.5)).toBeLessThan(1.5); // cruzamento
    expect(Math.abs(lerCor(p, 10, 20).a - 127.5)).toBeLessThan(1.5); // trecho percorrido duas vezes
  });

  it('dureza baixa dá borda suave; dureza 100 dá borda firme', () => {
    const macio = criarPixels(60, 30), duro = criarPixels(60, 30);
    const ponto = [{ x: 30, y: 15 }];
    desenharCaminho(macio, ponto, { tamanho: 24, dureza: 0, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    desenharCaminho(duro, ponto, { tamanho: 24, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    const meio = (p: ReturnType<typeof criarPixels>) => { const v = []; for (let x = 30; x < 42; x++) v.push(lerCor(p, x, 15).a); return v; };
    expect(meio(macio)[0]).toBeGreaterThan(245);
    expect(meio(macio).filter((a) => a > 10 && a < 245).length).toBeGreaterThan(5); // degradê longo
    expect(meio(duro).filter((a) => a > 10 && a < 245).length).toBeLessThanOrEqual(2); // transição de 1 px
  });

  it('o lápis (serrilhado) não tem meios-tons', () => {
    const p = criarPixels(30, 30);
    desenharCaminho(p, [{ x: 5, y: 5 }, { x: 25, y: 20 }], { tamanho: 5, dureza: 50, opacidade: 1, cor: AZUL, modo: 'pintar', serrilhado: true });
    for (let i = 3; i < p.data.length; i += 4) expect([0, 255]).toContain(p.data[i]);
  });

  it('a borracha apaga e respeita a opacidade', () => {
    const p = preto(30, 30);
    desenharCaminho(p, [{ x: 15, y: 15 }], { tamanho: 10, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'apagar' });
    expect(lerCor(p, 15, 15).a).toBe(0);
    expect(lerCor(p, 1, 1).a).toBe(255);
    const q = preto(30, 30);
    desenharCaminho(q, [{ x: 15, y: 15 }], { tamanho: 10, dureza: 100, opacidade: 0.5, cor: VERMELHO, modo: 'apagar' });
    expect(Math.abs(lerCor(q, 15, 15).a - 127.5)).toBeLessThan(1.5);
  });

  it('a seleção protege o que está fora dela', () => {
    const p = criarPixels(40, 20), m = mascaraRetangulo(40, 20, 0, 0, 20, 20);
    desenharCaminho(p, [{ x: 2, y: 10 }, { x: 38, y: 10 }], { tamanho: 6, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' }, m);
    expect(lerCor(p, 10, 10).a).toBe(255);
    expect(lerCor(p, 30, 10).a).toBe(0);
  });

  it('a pressão da caneta muda a espessura', () => {
    const fino = criarPixels(40, 40), grosso = criarPixels(40, 40);
    desenharCaminho(fino, [{ x: 20, y: 20, pressao: 0.25 }], { tamanho: 20, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    desenharCaminho(grosso, [{ x: 20, y: 20, pressao: 1 }], { tamanho: 20, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    expect(opaco(grosso)).toBeGreaterThan(opaco(fino) * 8);
  });

  it('o traço devolve o retângulo alterado e nunca escreve fora da imagem', () => {
    const p = criarPixels(20, 20), t = new Traco(p, { tamanho: 30, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    t.mover(-5, -5); t.mover(30, 30);
    const r = t.aplicar()!;
    expect(r.x).toBeGreaterThanOrEqual(0); expect(r.x + r.w).toBeLessThanOrEqual(20); expect(r.y + r.h).toBeLessThanOrEqual(20);
    expect(t.aplicar()).toBeNull();
  });

  it('desenhar sobre pixels existentes mistura corretamente (over)', () => {
    const p = criarPixels(10, 10);
    for (let i = 0; i < 100; i++) escreverCor(p, i % 10, (i / 10) | 0, AZUL);
    desenharCaminho(p, [{ x: 5, y: 5 }], { tamanho: 6, dureza: 100, opacidade: 0.5, cor: VERMELHO, modo: 'pintar' });
    const c = lerCor(p, 5, 5);
    expect(c.a).toBe(255);
    expect(Math.abs(c.r - 127.5)).toBeLessThan(2); expect(Math.abs(c.b - 127.5)).toBeLessThan(2);
  });
});

describe('balde e varinha mágica', () => {
  const quadro = () => { // 20x10: esquerda branca, parede preta na coluna 10, direita branca
    const p = criarPixels(20, 10);
    for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) escreverCor(p, x, y, x === 10 ? { r: 0, g: 0, b: 0, a: 255 } : { r: 255, g: 255, b: 255, a: 255 });
    return p;
  };
  it('preenche só a região ligada, sem atravessar a parede', () => {
    const p = quadro();
    preencher(p, clonarPixels(p), 3, 3, VERMELHO, 10, true, null, 0);
    expect(lerCor(p, 0, 0)).toEqual(VERMELHO);
    expect(lerCor(p, 9, 9)).toEqual(VERMELHO);
    expect(lerCor(p, 10, 5)).toEqual({ r: 0, g: 0, b: 0, a: 255 });
    expect(lerCor(p, 15, 5)).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  });
  it('não contíguo pinta todas as regiões parecidas', () => {
    const p = quadro();
    preencher(p, clonarPixels(p), 3, 3, VERMELHO, 10, false, null, 0);
    expect(lerCor(p, 15, 5)).toEqual(VERMELHO);
    expect(lerCor(p, 10, 5).r).toBe(0);
  });
  it('a tolerância decide o que conta como "parecido"', () => {
    const p = criarPixels(10, 1);
    for (let x = 0; x < 10; x++) escreverCor(p, x, 0, { r: 100 + x * 10, g: 100, b: 100, a: 255 });
    expect(mascaraPorCor(p, 0, 0, 5).data.filter((v) => v).length).toBe(1);
    expect(mascaraPorCor(p, 0, 0, 25).data.filter((v) => v).length).toBe(3);
    expect(mascaraPorCor(p, 0, 0, 255).data.filter((v) => v).length).toBe(10);
  });
  it('regiões transparentes são "iguais" mesmo com RGB diferente guardado', () => {
    const p = criarPixels(6, 1);
    escreverCor(p, 0, 0, { r: 10, g: 20, b: 30, a: 0 }); escreverCor(p, 1, 0, { r: 200, g: 0, b: 0, a: 0 });
    expect(mascaraPorCor(p, 0, 0, 0).data[1]).toBe(255);
  });
  it('respeita a seleção e a expansão não invade a parede por cima', () => {
    const p = quadro(), m = mascaraRetangulo(20, 10, 0, 0, 5, 10);
    preencher(p, clonarPixels(p), 2, 2, VERMELHO, 10, true, m, 0);
    expect(lerCor(p, 2, 2)).toEqual(VERMELHO);
    expect(lerCor(p, 7, 2)).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    const q = quadro();
    preencher(q, clonarPixels(q), 3, 3, VERMELHO, 10, true, null, 1);
    expect(lerCor(q, 10, 5).a).toBe(255); // a parede continua opaca
    expect(lerCor(q, 10, 5).r).toBeGreaterThan(100); // mas ganhou um pouco de tinta na borda (meio a meio)
  });
  it('clique fora da imagem não faz nada', () => { const p = criarPixels(5, 5); expect(preencher(p, p, -1, 2, VERMELHO, 0, true)).toBeNull(); });
});

describe('seleção', () => {
  it('retângulo, elipse e laço cobrem o que devem', () => {
    const r = mascaraRetangulo(20, 20, 5, 5, 10, 8);
    expect(limitesDaMascara(r)).toEqual({ x: 5, y: 5, w: 10, h: 8 });
    const e = mascaraElipse(40, 40, 10, 10, 20, 20);
    expect(e.data[20 * 40 + 20]).toBe(255); expect(e.data[11 * 40 + 11]).toBe(0);
    const t = mascaraLaco(20, 20, [{ x: 2, y: 2 }, { x: 18, y: 2 }, { x: 2, y: 18 }]);
    expect(t.data[5 * 20 + 5]).toBe(255); expect(t.data[15 * 20 + 15]).toBe(0);
  });
  it('retângulo arrastado "ao contrário" funciona e é cortado nas bordas', () => {
    expect(limitesDaMascara(mascaraRetangulo(20, 20, 15, 15, -10, -10))).toEqual({ x: 5, y: 5, w: 10, h: 10 });
    expect(limitesDaMascara(mascaraRetangulo(20, 20, 15, 15, 30, 30))).toEqual({ x: 15, y: 15, w: 5, h: 5 });
  });
  it('somar, subtrair, interseccionar e inverter', () => {
    const a = mascaraRetangulo(10, 10, 0, 0, 6, 10), b = mascaraRetangulo(10, 10, 4, 0, 6, 10);
    expect(limitesDaMascara(combinarMascaras(a, b, 'somar'))).toEqual({ x: 0, y: 0, w: 10, h: 10 });
    expect(limitesDaMascara(combinarMascaras(a, b, 'subtrair'))).toEqual({ x: 0, y: 0, w: 4, h: 10 });
    expect(limitesDaMascara(combinarMascaras(a, b, 'interseccao'))).toEqual({ x: 4, y: 0, w: 2, h: 10 });
    expect(limitesDaMascara(inverterMascara(a))).toEqual({ x: 6, y: 0, w: 4, h: 10 });
    expect(combinarMascaras(null, a, 'somar')).toBe(a);
  });
  it('extrair copia só a seleção e apagar deixa transparente', () => {
    const p = preto(10, 10), m = mascaraRetangulo(10, 10, 2, 3, 4, 4);
    const ex = extrairSelecao(p, m)!;
    expect(ex).toMatchObject({ x: 2, y: 3 }); expect(ex.pixels.w).toBe(4); expect(lerCor(ex.pixels, 0, 0).a).toBe(255);
    apagarSelecao(p, m);
    expect(lerCor(p, 3, 4).a).toBe(0); expect(lerCor(p, 0, 0).a).toBe(255);
    expect(extrairSelecao(p, criarMascara(10, 10))).toBeNull();
  });
  it('deslocar move a máscara e perde o que sai da imagem', () => {
    const m = deslocarMascara(mascaraRetangulo(10, 10, 6, 6, 4, 4), 3, 3);
    expect(limitesDaMascara(m)).toEqual({ x: 9, y: 9, w: 1, h: 1 });
  });
});

describe('formas', () => {
  it('linha, retângulo e elipse (contorno) e preenchidos', () => {
    const p = criarPixels(50, 50);
    contornoDeForma(p, 'retangulo', 10, 10, 40, 40, { tamanho: 3, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    expect(lerCor(p, 25, 10).a).toBe(255); expect(lerCor(p, 25, 25).a).toBe(0);
    const q = criarPixels(50, 50);
    preencherForma(q, 'retangulo', 10, 10, 40, 40, AZUL, 1);
    expect(lerCor(q, 25, 25)).toEqual(AZUL); expect(lerCor(q, 5, 5).a).toBe(0);
    const e = criarPixels(50, 50);
    preencherForma(e, 'elipse', 10, 10, 40, 40, AZUL, 1);
    expect(lerCor(e, 25, 25).a).toBe(255); expect(lerCor(e, 11, 11).a).toBeLessThan(40);
    const l = criarPixels(50, 50);
    contornoDeForma(l, 'linha', 0, 0, 49, 49, { tamanho: 3, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    expect(lerCor(l, 25, 25).a).toBe(255); expect(lerCor(l, 40, 10).a).toBe(0);
  });
});

describe('camadas e composição', () => {
  it('compõe de baixo para cima, com opacidade e visibilidade', () => {
    const d = novoDocumento(4, 4);
    preencherForma(camadaAtiva(d).pixels, 'retangulo', 0, 0, 4, 4, VERMELHO, 1);
    const c2 = adicionarCamada(d);
    preencherForma(c2.pixels, 'retangulo', 0, 0, 4, 4, AZUL, 1);
    expect(lerCor(compor(d), 1, 1)).toEqual(AZUL);
    c2.opacidade = 0.5;
    const meio = lerCor(compor(d), 1, 1);
    expect(meio.a).toBe(255); expect(Math.abs(meio.r - 127.5)).toBeLessThan(2);
    c2.visivel = false;
    expect(lerCor(compor(d), 1, 1)).toEqual(VERMELHO);
    expect(lerCor(compor(d, true), 1, 1).r).toBeGreaterThan(100); // incluindo ocultas
  });
  it('adicionar, duplicar, mover, remover e mesclar', () => {
    const d = novoDocumento(4, 4);
    adicionarCamada(d, 'B'); adicionarCamada(d, 'C');
    expect(d.camadas.map((c) => c.nome)).toEqual(['Sprite', 'B', 'C']); expect(d.ativa).toBe(2);
    duplicarCamada(d); expect(d.camadas.map((c) => c.nome)).toEqual(['Sprite', 'B', 'C', 'C cópia']);
    expect(moverCamada(d, 1)).toBe(false);
    expect(moverCamada(d, -1)).toBe(true); expect(d.camadas.map((c) => c.nome)).toEqual(['Sprite', 'B', 'C cópia', 'C']);
    expect(removerCamada(d)).toBe(true); expect(d.camadas.length).toBe(3);
    const u = novoDocumento(2, 2); expect(removerCamada(u)).toBe(false); expect(mesclarAbaixo(u)).toBe(false);
  });
  it('mesclar abaixo soma as duas e respeita a opacidade da de cima', () => {
    const d = novoDocumento(4, 4);
    const c = adicionarCamada(d); preencherForma(c.pixels, 'retangulo', 0, 0, 4, 4, VERMELHO, 1); c.opacidade = 0.5;
    expect(mesclarAbaixo(d)).toBe(true);
    expect(d.camadas.length).toBe(1);
    expect(Math.abs(lerCor(d.camadas[0]!.pixels, 1, 1).a - 127.5)).toBeLessThan(2);
    expect(d.camadas[0]!.opacidade).toBe(1);
  });
  it('prepararEdicao troca o buffer (instantâneos antigos não são afetados)', () => {
    const d = novoDocumento(4, 4);
    const antes = tirarInstantaneo(d);
    desenharCaminho(prepararEdicao(d), [{ x: 2, y: 2 }], { tamanho: 3, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    expect(lerCor(camadaAtiva(d).pixels, 2, 2).a).toBe(255);
    expect(lerCor(antes.camadas[0]!.pixels, 2, 2).a).toBe(0);
    restaurarInstantaneo(d, antes);
    expect(lerCor(camadaAtiva(d).pixels, 2, 2).a).toBe(0);
  });
});

describe('histórico', () => {
  it('desfaz, refaz, descarta o refazer em ação nova e respeita o limite', () => {
    const h = new Historico<number>(0, 3);
    h.registrar(1); h.registrar(2);
    expect(h.desfazer()).toBe(1); expect(h.desfazer()).toBe(0); expect(h.desfazer()).toBeNull();
    expect(h.refazer()).toBe(1);
    h.registrar(9);
    expect(h.podeRefazer).toBe(false); expect(h.atual).toBe(9);
    h.registrar(10); h.registrar(11); // passa do limite de 3: o mais antigo cai
    expect(h.tamanho).toBe(3);
    expect(h.desfazer()).toBe(10); expect(h.desfazer()).toBe(9); expect(h.desfazer()).toBeNull();
  });
  it('fluxo completo no documento: pintar, camada nova, desfazer tudo e refazer', () => {
    const d = novoDocumento(10, 10), h = new Historico(tirarInstantaneo(d));
    desenharCaminho(prepararEdicao(d), [{ x: 5, y: 5 }], { tamanho: 4, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' }); h.registrar(tirarInstantaneo(d));
    adicionarCamada(d); h.registrar(tirarInstantaneo(d));
    desenharCaminho(prepararEdicao(d), [{ x: 2, y: 2 }], { tamanho: 4, dureza: 100, opacidade: 1, cor: AZUL, modo: 'pintar' }); h.registrar(tirarInstantaneo(d));
    expect(d.camadas.length).toBe(2);
    restaurarInstantaneo(d, h.desfazer()!); expect(lerCor(compor(d), 2, 2).a).toBe(0); expect(d.camadas.length).toBe(2);
    restaurarInstantaneo(d, h.desfazer()!); expect(d.camadas.length).toBe(1); expect(lerCor(compor(d), 5, 5)).toEqual(VERMELHO);
    restaurarInstantaneo(d, h.desfazer()!); expect(lerCor(compor(d), 5, 5).a).toBe(0);
    restaurarInstantaneo(d, h.refazer()!); restaurarInstantaneo(d, h.refazer()!); restaurarInstantaneo(d, h.refazer()!);
    expect(lerCor(compor(d), 2, 2)).toEqual(AZUL); expect(lerCor(compor(d), 5, 5)).toEqual(VERMELHO);
  });
});

describe('transformações', () => {
  const marcado = () => { const p = criarPixels(4, 2); escreverCor(p, 0, 0, VERMELHO); escreverCor(p, 3, 1, AZUL); return p; };
  it('espelhar e girar movem os pixels certos', () => {
    expect(lerCor(espelhar(marcado(), true), 3, 0)).toEqual(VERMELHO);
    expect(lerCor(espelhar(marcado(), false), 0, 1)).toEqual(VERMELHO);
    const h = girar90(marcado(), true); expect([h.w, h.h]).toEqual([2, 4]);
    expect(lerCor(h, 1, 0)).toEqual(VERMELHO); expect(lerCor(h, 0, 3)).toEqual(AZUL);
    const a = girar90(marcado(), false); expect(lerCor(a, 0, 3)).toEqual(VERMELHO); expect(lerCor(a, 1, 0)).toEqual(AZUL);
    const volta = girar90(girar90(marcado(), true), false);
    expect(Array.from(volta.data)).toEqual(Array.from(marcado().data));
  });
  it('redimensionar preserva a cor e não suja a borda transparente', () => {
    const p = criarPixels(4, 4);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) escreverCor(p, x, y, VERMELHO);
    const g = redimensionar(p, 8, 8);
    expect(lerCor(g, 1, 1)).toEqual(VERMELHO);
    expect(lerCor(g, 7, 7).a).toBe(0);
    const borda = lerCor(g, 3, 3); // na fronteira vermelho/transparente: a cor continua vermelha (só o alfa cai)
    if (borda.a > 0) expect(borda.r).toBe(255);
    expect([redimensionar(p, 1, 1).w, redimensionar(p, 0, 0).h]).toEqual([1, 1]);
  });
  it('documento: espelhar, girar, redimensionar, tela e cortar ao conteúdo', () => {
    const d = novoDocumento(10, 6);
    preencherForma(camadaAtiva(d).pixels, 'retangulo', 2, 1, 5, 4, VERMELHO, 1);
    adicionarCamada(d); // as camadas viajam juntas
    girarDocumento(d, true); expect([d.w, d.h]).toEqual([6, 10]); expect(d.camadas.every((c) => c.pixels.w === 6)).toBe(true);
    girarDocumento(d, false); espelharDocumento(d, true);
    expect(lerCor(compor(d), 7, 2)).toEqual(VERMELHO);
    redimensionarDocumento(d, 20, 12); expect([d.w, d.h]).toEqual([20, 12]);
    redimensionarTela(d, 30, 20, 5, 5); expect([d.w, d.h]).toEqual([30, 20]);
    expect(cortarAoConteudo(d, 0)).toBe(true);
    const lim = limitesDoConteudo(compor(d))!;
    expect(lim).toMatchObject({ x: 0, y: 0 }); expect(lim.w).toBe(d.w); expect(lim.h).toBe(d.h);
    expect(cortarAoConteudo(novoDocumento(5, 5))).toBe(false);
  });
  it('colarSobre respeita posição negativa, borda e máscara', () => {
    const dest = criarPixels(6, 6), src = preto(4, 4);
    colarSobre(dest, src, -2, -2);
    expect(lerCor(dest, 1, 1).a).toBe(255); expect(lerCor(dest, 2, 2).a).toBe(0);
    const d2 = criarPixels(6, 6); colarSobre(d2, src, 4, 4);
    expect(lerCor(d2, 5, 5).a).toBe(255); expect(lerCor(d2, 3, 3).a).toBe(0);
    const d3 = criarPixels(6, 6); colarSobre(d3, src, 0, 0, 1, mascaraRetangulo(6, 6, 0, 0, 2, 6));
    expect(lerCor(d3, 1, 1).a).toBe(255); expect(lerCor(d3, 3, 1).a).toBe(0);
  });
});

describe('paleta e cores', () => {
  it('paleta do sprite traz as cores dominantes sem repetir tons parecidos', () => {
    const p = criarPixels(20, 10);
    for (let i = 0; i < 200; i++) escreverCor(p, i % 20, (i / 20) | 0, i < 120 ? { r: 240, g: 190, b: 150, a: 255 } : i < 180 ? { r: 20, g: 90, b: 40, a: 255 } : { r: 0, g: 0, b: 0, a: 0 });
    const pal = paletaDoSprite(p);
    expect(pal.length).toBe(2);
    expect(pal[0]).toMatchObject({ r: 240, g: 190, b: 150 });
  });
  it('hex ida e volta', () => { expect(hexDeCor(corDeHex('#ff8800'))).toBe('#ff8800'); expect(corDeHex('#f80')).toMatchObject({ r: 255, g: 136, b: 0 }); });
});


describe('cancelar um traço', () => {
  it('devolve a camada ao estado de antes (gesto virou pinça)', () => {
    const p = criarPixels(30, 30), t = new Traco(p, { tamanho: 10, dureza: 100, opacidade: 1, cor: VERMELHO, modo: 'pintar' });
    t.mover(15, 15); t.aplicar();
    expect(lerCor(p, 15, 15).a).toBe(255);
    t.cancelar();
    expect(opaco(p)).toBe(0);
  });
});

describe('histórico com limite variável', () => {
  it('reduzir o limite descarta os passos mais antigos sem quebrar o desfazer', () => {
    const h = new Historico<number>(0, 50);
    for (let i = 1; i <= 10; i++) h.registrar(i);
    h.limite = 4; h.registrar(11);
    expect(h.tamanho).toBe(4);
    expect(h.atual).toBe(11);
    expect(h.desfazer()).toBe(10); expect(h.desfazer()).toBe(9); expect(h.desfazer()).toBe(8); expect(h.desfazer()).toBeNull();
    expect(h.refazer()).toBe(9);
  });
});
