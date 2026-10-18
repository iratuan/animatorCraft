import { semAcento } from '../util/texto';
/**
 * Gráficos simples para a lousa: funções y = f(x), barras e pizza. Tudo puro (sem canvas): o motor de desenho recebe pontos prontos.
 *   "Professor desenha o gráfico de y = x^2 no quadro."   ·   "... de y = sen(x) de -6 a 6"
 *   "Professor desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3."   ·   "... gráfico de pizza: Sim=70, Não=30."
 */
export type GraficoDef =
  | { tipo: 'funcao'; expr: string; xmin: number; xmax: number }
  | { tipo: 'barras' | 'pizza'; dados: { rotulo: string; valor: number }[] };

export const rotuloDoGrafico = (g: GraficoDef): string =>
  g.tipo === 'funcao' ? `gráfico de y = ${g.expr}` : `gráfico de ${g.tipo === 'barras' ? 'barras' : 'pizza'}: ${g.dados.map((d) => `${d.rotulo}=${d.valor}`).join(', ')}`;

// ---------------------------------------------------------------- avaliador de expressões (sem eval)

type Tok = { t: 'n'; v: number } | { t: 'x' } | { t: 'op'; v: string } | { t: 'f'; v: string } | { t: '(' } | { t: ')' };
const FUNCOES: Record<string, (v: number) => number> = {
  sen: Math.sin, sin: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan, raiz: Math.sqrt, sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
};

function tokenizar(expr: string): Tok[] {
  const s = semAcento(expr).replace(/\s+/g, '').replace(/²/g, '^2').replace(/³/g, '^3').replace(/×/g, '*').replace(/−/g, '-').replace(/,/g, '.');
  const toks: Tok[] = [];
  const implicita = () => { const u = toks[toks.length - 1]; if (u && (u.t === 'n' || u.t === 'x' || u.t === ')')) toks.push({ t: 'op', v: '*' }); };
  for (let i = 0; i < s.length;) {
    const c = s[i]!;
    const num = /^\d+(?:\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (num) { implicita(); toks.push({ t: 'n', v: parseFloat(num[0]) }); i += num[0].length; continue; }
    const id = /^[a-z]+/.exec(s.slice(i));
    if (id) {
      const nome = id[0];
      if (nome === 'x') { implicita(); toks.push({ t: 'x' }); i++; continue; }
      if (nome === 'pi') { implicita(); toks.push({ t: 'n', v: Math.PI }); i += 2; continue; }
      if (nome === 'e') { implicita(); toks.push({ t: 'n', v: Math.E }); i++; continue; }
      if (FUNCOES[nome]) { implicita(); toks.push({ t: 'f', v: nome }); i += nome.length; continue; }
      // "2x3"-tipo de colagem de letras (ex.: "xx"): separa em x
      if (/^x+$/.test(nome)) { for (let k = 0; k < nome.length; k++) { implicita(); toks.push({ t: 'x' }); } i += nome.length; continue; }
      throw new Error(`não conheço "${nome}"`);
    }
    if (c === '(') { implicita(); toks.push({ t: '(' }); i++; continue; }
    if (c === ')') { toks.push({ t: ')' }); i++; continue; }
    if ('+-*/^'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`símbolo inesperado "${c}"`);
  }
  return toks;
}

/** Compila "x^2 - 3x + 1" (ou "sen(x)", "2^x", "raiz(x)") numa função de x. Lança Error com a causa se não entender. */
export function compilarFuncao(expr: string): (x: number) => number {
  const toks = tokenizar(expr.replace(/^\s*y\s*=\s*/i, '').replace(/^\s*f\s*\(\s*x\s*\)\s*=\s*/i, ''));
  let p = 0;
  const olhar = () => toks[p];
  // precedência: + - < * / < ^ (direita) < unário
  const soma = (): ((x: number) => number) => {
    let a = produto();
    for (let o = olhar(); o && o.t === 'op' && (o.v === '+' || o.v === '-'); o = olhar()) { p++; const b = produto(), esq = a; a = o.v === '+' ? (x) => esq(x) + b(x) : (x) => esq(x) - b(x); }
    return a;
  };
  const produto = (): ((x: number) => number) => {
    let a = unario();
    for (let o = olhar(); o && o.t === 'op' && (o.v === '*' || o.v === '/'); o = olhar()) { p++; const b = unario(), esq = a; a = o.v === '*' ? (x) => esq(x) * b(x) : (x) => esq(x) / b(x); }
    return a;
  };
  const potencia = (): ((x: number) => number) => {
    const base = atomo();
    const o = olhar();
    if (o && o.t === 'op' && o.v === '^') { p++; const exp = unario(); return (x) => Math.pow(base(x), exp(x)); }
    return base;
  };
  const unario = (): ((x: number) => number) => {
    const o = olhar();
    if (o && o.t === 'op' && (o.v === '-' || o.v === '+')) { p++; const v = unario(); return o.v === '-' ? (x) => -v(x) : v; }
    return potencia();
  };
  const atomo = (): ((x: number) => number) => {
    const o = olhar();
    if (!o) throw new Error('a expressão termina antes da hora');
    p++;
    if (o.t === 'n') return () => o.v;
    if (o.t === 'x') return (x) => x;
    if (o.t === 'f') {
      const arg = unario();
      const f = FUNCOES[o.v]!;
      return (x) => f(arg(x));
    }
    if (o.t === '(') { const v = soma(); if (olhar()?.t !== ')') throw new Error('falta fechar o parêntese'); p++; return v; }
    throw new Error('expressão inválida');
  };
  const f = soma();
  if (p < toks.length) throw new Error('sobrou algo no fim da expressão');
  return f;
}

/** Pontos (x,y) da função, com buracos (null) onde não existe valor ou o salto é enorme (ex.: 1/x). Também devolve a faixa vertical sugerida. */
export function amostrarFuncao(g: Extract<GraficoDef, { tipo: 'funcao' }>, n = 240): { pontos: ({ x: number; y: number } | null)[]; ymin: number; ymax: number } {
  const f = compilarFuncao(g.expr);
  const bruto: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) { const x = g.xmin + ((g.xmax - g.xmin) * i) / n; const y = f(x); if (Number.isFinite(y)) bruto.push({ x, y }); }
  if (!bruto.length) throw new Error('a função não tem valores nesse intervalo');
  const ys = bruto.map((p) => p.y).sort((a, b) => a - b);
  const baixo = ys[Math.floor(ys.length * 0.02)]!, alto = ys[Math.ceil(ys.length * 0.98) - 1]!;
  let ymin = Math.min(baixo, 0), ymax = Math.max(alto, 0);
  if (ymax - ymin < 1e-6) { ymin -= 1; ymax += 1; }
  const folga = (ymax - ymin) * 0.08; ymin -= folga; ymax += folga;
  const pontos: ({ x: number; y: number } | null)[] = [];
  let ant: { x: number; y: number } | null = null;
  for (let i = 0; i <= n; i++) {
    const x = g.xmin + ((g.xmax - g.xmin) * i) / n, y = f(x);
    if (!Number.isFinite(y) || y < ymin - (ymax - ymin) || y > ymax + (ymax - ymin)) { pontos.push(null); ant = null; continue; }
    if (ant && Math.abs(y - ant.y) > (ymax - ymin) * 0.6) pontos.push(null);
    const p = { x, y }; pontos.push(p); ant = p;
  }
  return { pontos, ymin, ymax };
}

// ---------------------------------------------------------------- leitura da frase

const num = (s: string) => parseFloat(s.replace(',', '.'));

/** Lê o gráfico pedido numa frase ("... gráfico de y = x^2 de -3 a 3", "... gráfico de barras: A=1, B=2"). Devolve null se não for um gráfico. */
export function lerGrafico(frase: string): { grafico: GraficoDef } | { erro: string } | null {
  const m = /gr[aá]fico\s+(?:d[ea]\s+)?(.*)$/i.exec(frase);
  if (!m) return null;
  let resto = m[1]!.trim().replace(/\s+(?:no|na)\s+(?:quadro|lousa)\s*[.!?]?\s*$/i, '').replace(/[.!?]\s*$/, '').trim();
  const tipo = /^(barras?|pizza|setores?)\s*:?\s*(.*)$/i.exec(resto);
  if (tipo) {
    const dados = tipo[2]!.split(/[,;]/).map((p) => /^\s*(.+?)\s*[=:]\s*(-?\d+(?:[.,]\d+)?)\s*%?\s*$/.exec(p)).filter((x): x is RegExpExecArray => !!x).map((x) => ({ rotulo: x[1]!.trim(), valor: num(x[2]!) }));
    if (dados.length < 2) return { erro: 'Gráfico de barras/pizza precisa de pelo menos dois valores, assim: Maçã=5, Banana=8.' };
    return { grafico: { tipo: /^barra/i.test(tipo[1]!) ? 'barras' : 'pizza', dados } };
  }
  let xmin = -5, xmax = 5;
  const faixa = /\s+(?:de|entre)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a|e|ate)\s+(-?\d+(?:[.,]\d+)?)\s*$/i.exec(resto);
  if (faixa) { xmin = num(faixa[1]!); xmax = num(faixa[2]!); resto = resto.slice(0, faixa.index).trim(); }
  if (xmin >= xmax) return { erro: 'No gráfico, o início do intervalo precisa ser menor que o fim.' };
  try { compilarFuncao(resto); } catch (e) { return { erro: `Não entendi a função "${resto}": ${(e as Error).message}.` }; }
  return { grafico: { tipo: 'funcao', expr: resto.replace(/^\s*y\s*=\s*/i, ''), xmin, xmax } };
}


