import { semAcento } from '../util/texto';
/**
 *   "Professor desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3."   ·   "... gráfico de pizza: Sim=70, Não=30."
 */
export type GraficoDef =
  | {
      tipo: 'funcao';
      expr: string;
      xmin: number;
      xmax: number;
      raizes?: boolean;
      areaIntegral?: { a: number; b: number };
      grade?: boolean;
      rotulo?: string;
    }
  | { tipo: 'barras' | 'pizza'; dados: { rotulo: string; valor: number }[] };

export const rotuloDoGrafico = (g: GraficoDef): string => {
  if (g.tipo !== 'funcao') {
    return `gráfico de ${g.tipo === 'barras' ? 'barras' : 'pizza'}: ${g.dados.map((d) => `${d.rotulo}=${d.valor}`).join(', ')}`;
  }
  let s = `gráfico de y = ${g.expr}`;
  if (g.raizes) s += ' (com raízes)';
  if (g.areaIntegral) s += ` (integral de ${g.areaIntegral.a} a ${g.areaIntegral.b})`;
  if (g.grade) s += ' (com grade)';
  return s;
};

// ---------------------------------------------------------------- avaliador de expressões (sem eval)

type Tok = { t: 'n'; v: number } | { t: 'x' } | { t: 'op'; v: string } | { t: 'f'; v: string } | { t: '(' } | { t: ')' };
const FUNCOES: Record<string, (v: number) => number> = {
  sen: Math.sin, sin: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan,
  asin: Math.asin, arcsin: Math.asin, acos: Math.acos, arccos: Math.acos, atan: Math.atan, arctan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  raiz: Math.sqrt, sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp,
  sign: Math.sign, sinal: Math.sign, floor: Math.floor, piso: Math.floor, ceil: Math.ceil, teto: Math.ceil,
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
      if (nome === 'e') { implicita(); toks.push({ t: 'n', v: Math.E }); i += 1; continue; }
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

/** Encontra numericamente as raízes de f(x) = 0 no intervalo dado via amostragem e bissecção. */
export function encontrarRaizes(expr: string, xmin: number, xmax: number, maxRaizes = 8): number[] {
  try {
    const f = compilarFuncao(expr);
    const raizes: number[] = [];
    const n = 300;
    const dx = (xmax - xmin) / n;
    let prevX = xmin;
    let prevY = f(prevX);

    for (let i = 1; i <= n && raizes.length < maxRaizes; i++) {
      const curX = xmin + i * dx;
      const curY = f(curX);

      if (Number.isFinite(prevY) && Number.isFinite(curY)) {
        if (Math.abs(curY) < 1e-7) {
          raizes.push(Number(curX.toFixed(4)));
        } else if (prevY * curY < 0) {
          // Bissecção para refinar a raiz
          let a = prevX, b = curX;
          for (let k = 0; k < 28; k++) {
            const m = (a + b) / 2;
            const ym = f(m);
            if (Math.abs(ym) < 1e-7 || (b - a) < 1e-5) {
              a = m;
              break;
            }
            if (f(a) * ym < 0) b = m;
            else a = m;
          }
          const r = Number(((a + b) / 2).toFixed(4));
          if (!raizes.some((existente) => Math.abs(existente - r) < 1e-3)) {
            raizes.push(r);
          }
        }
      }
      prevX = curX;
      prevY = curY;
    }
    return raizes.sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Calcula a integral numérica de f(x)dx de a até b usando a regra de Simpson composta. */
export function calcularIntegral(expr: string, a: number, b: number, passos = 120): number {
  try {
    const f = compilarFuncao(expr);
    if (a === b) return 0;
    const n = passos % 2 === 0 ? passos : passos + 1;
    const h = (b - a) / n;
    let soma = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      soma += (i % 2 === 0 ? 2 : 4) * f(x);
    }
    return Number(((h / 3) * soma).toFixed(4));
  } catch {
    return 0;
  }
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

  // Detecta opções adicionais avançadas de matemática
  const raizes = /\bcom\s+ra[ií]zes?\b/i.test(resto) || /\bdestacando\s+ra[ií]zes?\b/i.test(resto);
  if (raizes) resto = resto.replace(/\b(?:com|destacando)\s+ra[ií]zes?\b/i, '').trim();

  const grade = /\bcom\s+grade\b/i.test(resto) || /\bgrade\b/i.test(resto);
  if (grade) resto = resto.replace(/\b(?:com\s+)?grade\b/i, '').trim();

  let areaIntegral: { a: number; b: number } | undefined;
  const mArea = /\b(?:[aá]rea|integral)\s+(?:de|entre)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a|e|at[eé])\s+(-?\d+(?:[.,]\d+)?)\b/i.exec(resto);
  if (mArea) {
    areaIntegral = { a: num(mArea[1]!), b: num(mArea[2]!) };
    resto = resto.replace(mArea[0], '').trim();
  }

  let xmin = -5, xmax = 5;
  const faixa = /\s+(?:de|entre)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a|e|ate)\s+(-?\d+(?:[.,]\d+)?)\s*$/i.exec(resto);
  if (faixa) { xmin = num(faixa[1]!); xmax = num(faixa[2]!); resto = resto.slice(0, faixa.index).trim(); }
  if (xmin >= xmax) return { erro: 'No gráfico, o início do intervalo precisa ser menor que o fim.' };
  try { compilarFuncao(resto); } catch (e) { return { erro: `Não entendi a função "${resto}": ${(e as Error).message}.` }; }

  return {
    grafico: {
      tipo: 'funcao',
      expr: resto.replace(/^\s*y\s*=\s*/i, '').replace(/^\s*f\s*\(\s*x\s*\)\s*=\s*/i, ''),
      xmin,
      xmax,
      ...(raizes ? { raizes: true } : {}),
      ...(areaIntegral ? { areaIntegral } : {}),
      ...(grade ? { grade: true } : {}),
    },
  };
}


