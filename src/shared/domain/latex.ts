const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', n: 'ⁿ', x: 'ˣ', '=': '⁼', '(': '⁽', ')': '⁾',
};
const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', n: 'ₙ', x: 'ₓ',
};
const SIMBOLOS: Record<string, string> = {
  cdot: '·', times: '×', div: '÷', pm: '±', neq: '≠', leq: '≤', geq: '≥', approx: '≈', infty: '∞',
  pi: 'π', theta: 'θ', alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', Delta: 'Δ', lambda: 'λ', mu: 'μ',
  omega: 'ω', Omega: 'Ω', sigma: 'σ', Sigma: 'Σ', rightarrow: '→', leftarrow: '←', to: '→', sum: 'Σ',
  degree: '°', circ: '°', ldots: '…', left: '', right: '',
};

function mapear(s: string, tabela: Record<string, string>): string {
  return [...s].map((c) => tabela[c] ?? c).join('');
}

/** Pega o argumento de um comando: `{...}` balanceado ou um único caractere. Retorna [argumento, resto]. */
function argumento(s: string): [string, string] {
  s = s.trimStart();
  if (s[0] !== '{') return [s.slice(0, 1), s.slice(1)];
  let nivel = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') nivel++;
    else if (s[i] === '}' && --nivel === 0) return [s.slice(1, i), s.slice(i + 1)];
  }
  return [s.slice(1), ''];
}

/**
 * Aproximação em texto de uma fórmula LaTeX (potências, frações, raízes, símbolos gregos).
 * Substitui a renderização real de LaTeX até a fase de escrita em traço.
 */
export function latexParaTexto(latex: string): string {
  let out = '';
  let resto = latex;
  while (resto.length) {
    const c = resto[0]!;
    if (c === '\\') {
      const nome = /^\\([a-zA-Z]+)/.exec(resto)?.[1];
      if (!nome) { out += resto[1] ?? ''; resto = resto.slice(2); continue; }
      resto = resto.slice(nome.length + 1);
      if (nome === 'frac') {
        const [a, r1] = argumento(resto);
        const [b, r2] = argumento(r1);
        const na = latexParaTexto(a), nb = latexParaTexto(b);
        out += `${/^\w+$/.test(na) ? na : `(${na})`}⁄${/^\w+$/.test(nb) ? nb : `(${nb})`}`;
        resto = r2;
      } else if (nome === 'sqrt') {
        const [a, r1] = argumento(resto);
        out += `√(${latexParaTexto(a)})`;
        resto = r1;
      } else {
        out += SIMBOLOS[nome] ?? nome;
      }
    } else if (c === '^' || c === '_') {
      const [a, r1] = argumento(resto.slice(1));
      const txt = latexParaTexto(a);
      out += mapear(txt, c === '^' ? SUP : SUB);
      resto = r1;
    } else if (c === '{' || c === '}') {
      resto = resto.slice(1);
    } else {
      out += c;
      resto = resto.slice(1);
    }
  }
  return out;
}
