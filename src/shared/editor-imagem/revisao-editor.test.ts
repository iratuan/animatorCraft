import { describe, expect, it } from 'vitest';
import {
  Historico, adicionarCamada, apagarSelecao, camadaAtiva, clonarPixels, colarSobre, combinarMascaras, compor, contornoDeForma, cortarAoConteudo, criarMascara, criarPixels,
  desenharCaminho, deslocarMascara, duplicarCamada, espelhar, espelharDocumento, extrairSelecao, girar90, girarDocumento, inverterMascara, limitesDoConteudo, mascaraElipse,
  mascaraLaco, mascaraPorCor, mascaraRetangulo, mesclarAbaixo, moverCamada, novoDocumento, paletaDoSprite, preencher, preencherForma, prepararEdicao, recortar, redimensionar,
  redimensionarDocumento, redimensionarTela, removerCamada, restaurarInstantaneo, tirarInstantaneo, escreverCor, corDeHex, hexDeCor, type Cor, type Documento, type Pixels,
} from './index';

/**
 * Revisão de lançamento — editor de imagem: operações aleatórias (inclusive com valores absurdos) mantêm o documento coerente,
 * desfazer e refazer devolvem exatamente cada estado anterior, e as transformações têm as propriedades que se espera delas.
 */

let semente = 2024;
const rnd = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
const inteiro = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const escolha = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const cor = (): Cor => ({ r: inteiro(0, 255), g: inteiro(0, 255), b: inteiro(0, 255), a: escolha([255, 255, 128, 10]) });
const extremo = () => escolha([0, 1, -1, 0.5, 7, 63, 100, 500, -500, 1e6, -1e6, NaN, Infinity, -Infinity, 2.5]);
const coord = (d: Documento) => (rnd() < 0.7 ? inteiro(-5, Math.max(d.w, d.h) + 5) + rnd() : extremo());

const hash = (p: Pixels) => { let h = 2166136261 >>> 0; h = Math.imul(h ^ p.w, 16777619); h = Math.imul(h ^ p.h, 16777619); for (let i = 0; i < p.data.length; i++) h = Math.imul(h ^ p.data[i]!, 16777619); return h >>> 0; };
const hashDoc = (d: Documento) => `${d.w}x${d.h}|${d.camadas.map((c) => `${c.id}:${c.visivel}:${c.opacidade}:${hash(c.pixels)}`).join(',')}|${d.ativa}|${d.selecao ? hash({ w: d.selecao.w, h: d.selecao.h, data: new Uint8ClampedArray(d.selecao.data) }) : '-'}`;

function conferir(d: Documento, onde: string) {
  expect(Number.isInteger(d.w) && Number.isInteger(d.h) && d.w >= 1 && d.h >= 1, `${onde}: tamanho ${d.w}x${d.h}`).toBe(true);
  expect(d.camadas.length, onde).toBeGreaterThanOrEqual(1);
  expect(d.ativa >= 0 && d.ativa < d.camadas.length, `${onde}: camada ativa ${d.ativa}`).toBe(true);
  expect(new Set(d.camadas.map((c) => c.id)).size, `${onde}: ids repetidos`).toBe(d.camadas.length);
  for (const c of d.camadas) {
    expect(c.pixels.w === d.w && c.pixels.h === d.h && c.pixels.data.length === d.w * d.h * 4, `${onde}: camada ${c.nome} fora do tamanho`).toBe(true);
    expect(c.opacidade >= 0 && c.opacidade <= 1, `${onde}: opacidade ${c.opacidade}`).toBe(true);
  }
  if (d.selecao) expect(d.selecao.w === d.w && d.selecao.h === d.h && d.selecao.data.length === d.w * d.h, `${onde}: máscara fora do tamanho`).toBe(true);
  const c = compor(d);
  expect(c.w === d.w && c.h === d.h, `${onde}: compor`).toBe(true);
}

type Op = { nome: string; f: (d: Documento) => void };
const operacoes: Op[] = [
  { nome: 'pincel', f: (d) => { const p = prepararEdicao(d); desenharCaminho(p, Array.from({ length: inteiro(1, 6) }, () => ({ x: coord(d), y: coord(d), pressao: rnd() < 0.3 ? extremo() : rnd() })), { tamanho: rnd() < 0.8 ? inteiro(1, 80) : extremo(), dureza: rnd() < 0.8 ? inteiro(0, 100) : extremo(), opacidade: rnd() < 0.8 ? rnd() : extremo(), cor: cor(), modo: escolha(['pintar', 'apagar'] as const), serrilhado: rnd() < 0.2 }, d.selecao); } },
  { nome: 'balde', f: (d) => { const p = prepararEdicao(d); preencher(p, compor(d), coord(d), coord(d), cor(), escolha([0, 10, 128, 255, NaN]), rnd() < 0.5, d.selecao, escolha([0, 1, 2])); } },
  { nome: 'forma', f: (d) => { const p = prepararEdicao(d); contornoDeForma(p, escolha(['linha', 'retangulo', 'elipse'] as const), coord(d), coord(d), coord(d), coord(d), { tamanho: inteiro(1, 20), dureza: 80, opacidade: 1, cor: cor(), modo: 'pintar' }, d.selecao); } },
  { nome: 'forma cheia', f: (d) => { const p = prepararEdicao(d); preencherForma(p, escolha(['retangulo', 'elipse'] as const), coord(d), coord(d), coord(d), coord(d), cor(), rnd(), d.selecao); } },
  { nome: 'selecionar retângulo', f: (d) => { d.selecao = combinarMascaras(d.selecao, mascaraRetangulo(d.w, d.h, coord(d), coord(d), coord(d), coord(d)), escolha(['substituir', 'somar', 'subtrair', 'interseccao'] as const)); } },
  { nome: 'selecionar elipse', f: (d) => { d.selecao = combinarMascaras(d.selecao, mascaraElipse(d.w, d.h, coord(d), coord(d), coord(d), coord(d)), escolha(['substituir', 'somar'] as const)); } },
  { nome: 'selecionar laço', f: (d) => { d.selecao = mascaraLaco(d.w, d.h, Array.from({ length: inteiro(0, 8) }, () => ({ x: coord(d), y: coord(d) }))); } },
  { nome: 'varinha', f: (d) => { d.selecao = combinarMascaras(d.selecao, mascaraPorCor(compor(d), coord(d), coord(d), escolha([0, 30, 255, NaN]), rnd() < 0.5), 'substituir'); } },
  { nome: 'inverter seleção', f: (d) => { if (d.selecao) d.selecao = inverterMascara(d.selecao); } },
  { nome: 'deslocar seleção', f: (d) => { if (d.selecao) d.selecao = deslocarMascara(d.selecao, inteiro(-30, 30), inteiro(-30, 30)); } },
  { nome: 'limpar seleção', f: (d) => { d.selecao = null; } },
  { nome: 'apagar seleção', f: (d) => { if (d.selecao) apagarSelecao(prepararEdicao(d), d.selecao); } },
  { nome: 'recortar e colar', f: (d) => { if (!d.selecao) return; const e = extrairSelecao(camadaAtiva(d).pixels, d.selecao); if (!e) return; colarSobre(prepararEdicao(d), e.pixels, e.x + inteiro(-40, 40), e.y + inteiro(-40, 40), rnd()); } },
  { nome: 'nova camada', f: (d) => { if (d.camadas.length < 8) adicionarCamada(d); } },
  { nome: 'duplicar camada', f: (d) => { if (d.camadas.length < 8) duplicarCamada(d); } },
  { nome: 'remover camada', f: (d) => { removerCamada(d); } },
  { nome: 'mover camada', f: (d) => { moverCamada(d, escolha([1, -1] as const)); } },
  { nome: 'mesclar abaixo', f: (d) => { mesclarAbaixo(d); } },
  { nome: 'camada visível/opacidade', f: (d) => { const c = camadaAtiva(d); c.visivel = rnd() < 0.7; c.opacidade = rnd(); } },
  { nome: 'selecionar camada', f: (d) => { d.ativa = inteiro(0, d.camadas.length - 1); } },
  { nome: 'espelhar', f: (d) => espelharDocumento(d, rnd() < 0.5) },
  { nome: 'girar', f: (d) => girarDocumento(d, rnd() < 0.5) },
  { nome: 'redimensionar', f: (d) => redimensionarDocumento(d, escolha([1, 7, d.w * 2, d.w / 2, 600, extremo()]), escolha([1, 9, d.h * 2, d.h / 2, 600, extremo()])) },
  { nome: 'tela', f: (d) => redimensionarTela(d, escolha([1, 5, d.w + 20, d.w - 3, 600, extremo()]), escolha([1, 5, d.h + 20, d.h - 3, 600, extremo()]), escolha([0, -10, 10, extremo()]), escolha([0, -10, 10, extremo()])) },
  { nome: 'cortar ao conteúdo', f: (d) => { cortarAoConteudo(d, escolha([0, 2, 50])); } },
];

describe('editor de imagem: operações aleatórias', () => {
  it('2000 operações em sequência (com valores absurdos) mantêm o documento sempre coerente', () => {
    let falhas = 0;
    for (let rodada = 0; rodada < 25; rodada++) {
      const base = criarPixels(inteiro(1, 60), inteiro(1, 60));
      for (let i = 0; i < base.w * base.h; i++) escreverCor(base, i % base.w, (i / base.w) | 0, rnd() < 0.5 ? cor() : { r: 0, g: 0, b: 0, a: 0 });
      const d = novoDocumento(base.w, base.h, base);
      for (let passo = 0; passo < 80; passo++) {
        const op = escolha(operacoes);
        try { op.f(d); } catch (e) { falhas++; throw new Error(`rodada ${rodada} passo ${passo}: ${op.nome} lançou ${(e as Error).message}`); }
        conferir(d, `rodada ${rodada} passo ${passo} (${op.nome})`);
      }
    }
    expect(falhas).toBe(0);
  });

  it('desfazer e refazer devolvem exatamente cada estado (mesmo com camadas, seleção e transformações)', () => {
    for (let rodada = 0; rodada < 10; rodada++) {
      const d = novoDocumento(inteiro(8, 40), inteiro(8, 40));
      const h = new Historico(tirarInstantaneo(d), 200);
      const marcas = [hashDoc(d)];
      const seguras = operacoes.filter((o) => !['varinha', 'selecionar camada'].includes(o.nome) || true);
      for (let passo = 0; passo < 40; passo++) {
        escolha(seguras).f(d);
        h.registrar(tirarInstantaneo(d));
        marcas.push(hashDoc(d));
      }
      // volta passo a passo até o começo
      for (let k = marcas.length - 2; k >= 0; k--) {
        const s = h.desfazer()!;
        restaurarInstantaneo(d, s);
        expect(hashDoc(d), `rodada ${rodada} desfazendo para o passo ${k}`).toBe(marcas[k]);
      }
      expect(h.podeDesfazer).toBe(false);
      for (let k = 1; k < marcas.length; k++) {
        restaurarInstantaneo(d, h.refazer()!);
        expect(hashDoc(d), `rodada ${rodada} refazendo para o passo ${k}`).toBe(marcas[k]);
      }
      expect(h.podeRefazer).toBe(false);
    }
  });

  it('uma ação nova depois de desfazer descarta o refazer, e o limite do histórico descarta os mais antigos', () => {
    const h = new Historico(0, 5);
    for (let i = 1; i <= 4; i++) h.registrar(i);
    expect(h.desfazer()).toBe(3); expect(h.desfazer()).toBe(2);
    h.registrar(99);
    expect(h.podeRefazer).toBe(false);
    expect(h.atual).toBe(99);
    for (let i = 0; i < 20; i++) h.registrar(100 + i);
    expect(h.tamanho).toBeLessThanOrEqual(5);
    let n = 0; while (h.desfazer() !== null) n++;
    expect(n).toBe(4); // o estado mais antigo guardado é o limite
    h.limite = 2; h.registrar(1); h.registrar(2); h.registrar(3);
    expect(h.tamanho).toBeLessThanOrEqual(2);
  });

  it('o instantâneo não é alterado por edições posteriores (copy-on-write)', () => {
    const d = novoDocumento(20, 20);
    const antes = tirarInstantaneo(d), hAntes = hash(antes.camadas[0]!.pixels);
    desenharCaminho(prepararEdicao(d), [{ x: 10, y: 10 }, { x: 15, y: 15 }], { tamanho: 8, dureza: 100, opacidade: 1, cor: { r: 255, g: 0, b: 0, a: 255 }, modo: 'pintar' });
    expect(hash(antes.camadas[0]!.pixels)).toBe(hAntes);
    expect(hash(camadaAtiva(d).pixels)).not.toBe(hAntes);
    restaurarInstantaneo(d, antes);
    expect(hash(camadaAtiva(d).pixels)).toBe(hAntes);
  });
});

describe('editor de imagem: propriedades das transformações', () => {
  const aleatoria = (w = inteiro(1, 37), h = inteiro(1, 37)) => { const p = criarPixels(w, h); for (let i = 0; i < w * h; i++) escreverCor(p, i % w, (i / w) | 0, cor()); return p; };
  it('espelhar duas vezes e girar quatro vezes devolvem a imagem; girar para um lado e para o outro também', () => {
    for (let k = 0; k < 30; k++) {
      const p = aleatoria();
      expect(hash(espelhar(espelhar(p, true), true))).toBe(hash(p));
      expect(hash(espelhar(espelhar(p, false), false))).toBe(hash(p));
      let g = p; for (let i = 0; i < 4; i++) g = girar90(g, true);
      expect(hash(g)).toBe(hash(p));
      expect(hash(girar90(girar90(p, true), false))).toBe(hash(p));
      const meio = girar90(p, true); expect(meio.w).toBe(p.h); expect(meio.h).toBe(p.w);
    }
  });
  it('redimensionar para o mesmo tamanho não muda nada; nunca gera tamanho inválido', () => {
    for (let k = 0; k < 20; k++) { const p = aleatoria(); expect(hash(redimensionar(p, p.w, p.h))).toBe(hash(p)); }
    const p = aleatoria(10, 10);
    for (const [w, h] of [[0, 0], [-5, 3], [0.2, 100], [1, 1], [3, 1000]] as const) { const r = redimensionar(p, w, h); expect(r.w).toBeGreaterThanOrEqual(1); expect(r.data.length).toBe(r.w * r.h * 4); }
  });
  it('redimensionar uma cor lisa mantém a cor, inclusive nas bordas transparentes', () => {
    const p = criarPixels(8, 8);
    for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) escreverCor(p, x, y, { r: 200, g: 40, b: 40, a: 255 });
    const r = redimensionar(p, 21, 17);
    for (let i = 0; i < r.data.length; i += 4) if (r.data[i + 3]! > 0) { expect(Math.abs(r.data[i]! - 200)).toBeLessThanOrEqual(1); expect(Math.abs(r.data[i + 1]! - 40)).toBeLessThanOrEqual(1); }
  });
  it('recortar e colar de volta devolve a região; colar fora da tela não faz nada nem lança', () => {
    const p = aleatoria(30, 30), r = recortar(p, 5, 6, 10, 9);
    const destino = criarPixels(30, 30);
    colarSobre(destino, r, 5, 6);
    expect(hash(recortar(destino, 5, 6, 10, 9))).toBe(hash(r));
    const antes = hash(destino);
    for (const [x, y] of [[-100, 0], [0, -100], [100, 0], [0, 100], [-9, -8], [Infinity, 0], [NaN, NaN]]) expect(() => colarSobre(destino, r, x as number, y as number)).not.toThrow();
    expect(antes).toBeTypeOf('number');
    const fora = recortar(p, -10, -10, 20, 20); // metade fora: a parte de fora fica transparente
    expect(fora.data[3]).toBe(0);
  });
  it('compor com uma camada opaca e visível é a própria camada; camada oculta não aparece; opacidade 0 some', () => {
    const p = aleatoria(12, 12); for (let i = 3; i < p.data.length; i += 4) p.data[i] = 255;
    const d = novoDocumento(12, 12, p);
    expect(hash(compor(d))).toBe(hash(p));
    adicionarCamada(d); desenharCaminho(camadaAtiva(d).pixels, [{ x: 6, y: 6 }], { tamanho: 8, dureza: 100, opacidade: 1, cor: { r: 1, g: 2, b: 3, a: 255 }, modo: 'pintar' });
    expect(hash(compor(d))).not.toBe(hash(p));
    camadaAtiva(d).visivel = false; expect(hash(compor(d))).toBe(hash(p));
    camadaAtiva(d).visivel = true; camadaAtiva(d).opacidade = 0; expect(hash(compor(d))).toBe(hash(p));
    expect(hash(compor(d, true))).toBe(hash(p)); // incluirOcultas ainda respeita opacidade 0
  });
  it('mesclar abaixo equivale ao resultado composto (camadas visíveis, com opacidade)', () => {
    for (let k = 0; k < 15; k++) {
      const d = novoDocumento(16, 16, aleatoria(16, 16)); d.camadas[0]!.opacidade = rnd();
      adicionarCamada(d, 'b', aleatoria(16, 16)); camadaAtiva(d).opacidade = rnd();
      const esperado = compor(d);
      mesclarAbaixo(d);
      expect(d.camadas.length).toBe(1);
      const obtido = compor(d);
      let maior = 0; for (let i = 0; i < obtido.data.length; i++) maior = Math.max(maior, Math.abs(obtido.data[i]! - esperado.data[i]!));
      expect(maior, `rodada ${k}`).toBeLessThanOrEqual(2);
    }
  });
  it('cortar ao conteúdo: tela vazia devolve false e nada muda; com conteúdo, a imagem composta é a mesma recortada', () => {
    const vazio = novoDocumento(10, 10);
    const h0 = hashDoc(vazio);
    expect(cortarAoConteudo(vazio)).toBe(false); expect(hashDoc(vazio)).toBe(h0);
    const d = novoDocumento(40, 30);
    desenharCaminho(d.camadas[0]!.pixels, [{ x: 12, y: 8 }, { x: 20, y: 14 }], { tamanho: 5, dureza: 100, opacidade: 1, cor: { r: 9, g: 9, b: 9, a: 255 }, modo: 'pintar' });
    const antes = compor(d), lim = limitesDoConteudo(antes)!;
    expect(cortarAoConteudo(d, 0)).toBe(true);
    expect([d.w, d.h]).toEqual([lim.w, lim.h]);
    expect(hash(compor(d))).toBe(hash(recortar(antes, lim.x, lim.y, lim.w, lim.h)));
  });
  it('a paleta do sprite ignora o transparente e não repete tons parecidos', () => {
    expect(paletaDoSprite(criarPixels(10, 10))).toEqual([]);
    const p = criarPixels(10, 10);
    for (let i = 0; i < 100; i++) escreverCor(p, i % 10, (i / 10) | 0, i < 50 ? { r: 250, g: 10, b: 10, a: 255 } : i < 90 ? { r: 252, g: 12, b: 8, a: 255 } : { r: 10, g: 10, b: 250, a: 255 });
    const pal = paletaDoSprite(p);
    expect(pal.length).toBe(2);
    expect(paletaDoSprite(aleatoria(40, 40), 5).length).toBeLessThanOrEqual(5);
  });
  it('cores em hexadecimal: ida e volta, abreviado e lixo', () => {
    for (let k = 0; k < 50; k++) { const c = { ...cor(), a: 255 }; expect(corDeHex(hexDeCor(c))).toEqual(c); }
    expect(corDeHex('#f80')).toEqual({ r: 255, g: 136, b: 0, a: 255 });
    expect(corDeHex('nada')).toEqual({ r: 0, g: 0, b: 0, a: 255 });
    expect(hexDeCor({ r: 300, g: -5, b: 12.4, a: 255 })).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('editor de imagem: tamanho e desempenho', () => {
  it('imagem de 2048×2048: balde, composição, seleção e varinha terminam em tempo razoável e sem estourar a pilha', () => {
    const t0 = Date.now();
    const d = novoDocumento(2048, 2048);
    for (let y = 0; y < 2048; y++) for (let x = 0; x < 2048; x += 64) escreverCor(d.camadas[0]!.pixels, x, y, { r: 0, g: 0, b: 0, a: 255 }); // grade de paredes
    const p = prepararEdicao(d);
    preencher(p, compor(d), 10, 10, { r: 255, g: 0, b: 0, a: 255 }, 10, true, null, 1);
    expect(p.data[(10 * 2048 + 10) * 4]).toBe(255);
    const m = mascaraPorCor(compor(d), 100, 100, 10, true);
    expect(m.data.some((v) => v)).toBe(true);
    adicionarCamada(d); duplicarCamada(d); mesclarAbaixo(d);
    expect(compor(d).data.length).toBe(2048 * 2048 * 4);
    expect(Date.now() - t0).toBeLessThan(20_000);
  }, 60_000);
  it('máscara grande: operações de seleção mantêm o tamanho', () => {
    const a = mascaraElipse(1000, 800, 10, 10, 900, 700), b = mascaraRetangulo(1000, 800, 100, 100, 300, 300);
    for (const op of ['somar', 'subtrair', 'interseccao', 'substituir'] as const) expect(combinarMascaras(a, b, op).data.length).toBe(800_000);
    expect(inverterMascara(criarMascara(5, 5)).data.every((v) => v === 255)).toBe(true);
    expect(clonarPixels(criarPixels(3, 3)).data.length).toBe(36);
  });
});
