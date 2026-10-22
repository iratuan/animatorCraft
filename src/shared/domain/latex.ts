const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  a: 'ᵃ', b: 'ᵇ', c: 'ᶜ', d: 'ᵈ', e: 'ᵉ', f: 'ᶠ', g: 'ᵍ', h: 'ʰ', i: 'ⁱ', j: 'ʲ', k: 'ᵏ', l: 'ˡ',
  m: 'ᵐ', n: 'ⁿ', o: 'ᵒ', p: 'ᵖ', r: 'ʳ', s: 'ˢ', t: 'ᵗ', u: 'ᵘ', v: 'ᵛ', w: 'ʷ', x: 'ˣ', y: 'ʸ', z: 'ᶻ',
  A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', I: 'ᴵ', J: 'ᴶ', K: 'ᴷ', L: 'ᴸ', M: 'ᴹ', N: 'ᴺ',
  O: 'ᴼ', P: 'ᴾ', R: 'ᴿ', T: 'ᵀ', U: 'ᵁ', V: 'ⱽ', W: 'ᵂ',
  '∞': '᪲',
};

const SUB: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ',
  s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ',
};

const SIMBOLOS: Record<string, string> = {
  // Operadores e relações
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓',
  neq: '≠', ne: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥',
  approx: '≈', infty: '∞', equiv: '≡', sim: '∼', propto: '∝',
  rightarrow: '→', leftarrow: '←', to: '→', Rightarrow: '⇒', Leftarrow: '⇐',
  leftrightarrow: '↔', Leftrightarrow: '⇔',
  sum: '∑', prod: '∏', int: '∫', iint: '∬', iiint: '∭', oint: '∮',
  partial: '∂', nabla: '∇',
  degree: '°', circ: '°', ldots: '…', cdots: '…',
  left: '', right: '', big: '', Big: '', bigg: '', Bigg: '',
  forall: '∀', exists: '∃', nexists: '∄',
  in: '∈', notin: '∉', ni: '∋',
  subset: '⊂', supset: '⊃', subseteq: '⊆', supseteq: '⊇',
  cup: '∪', cap: '∩', emptyset: '∅', varnothing: '∅',
  perp: '⊥', parallel: '∥', angle: '∠',
  // Letras gregas minúsculas
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'θ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ',
  rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ',
  upsilon: 'υ', phi: 'φ', varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
  // Letras gregas maiúsculas
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ',
  Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  // Funções matemáticas
  sin: 'sen', cos: 'cos', tan: 'tan', tg: 'tg',
  sec: 'sec', csc: 'cossec', cot: 'cotg', cotg: 'cotg',
  arcsin: 'arcsen', arccos: 'arccos', arctan: 'arctan',
  sinh: 'senh', cosh: 'cosh', tanh: 'tanh',
  ln: 'ln', log: 'log', exp: 'exp', lim: 'lim',
  max: 'max', min: 'min', det: 'det', dim: 'dim', ker: 'ker',
  // Espaçamentos e formatações
  quad: '  ', qquad: '    ',
  displaystyle: '', textstyle: '', scriptstyle: '',
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
 * Converte uma fórmula LaTeX em texto matemático elegante de alta fidelidade visual para a lousa.
 * Trata integrais, potências, frações, raízes, letras gregas e comandos de espaçamento.
 */
export function latexParaTexto(latex: string): string {
  let out = '';
  let resto = latex.trim();

  // Remove delimitadores $$ ou $ se existirem
  if (resto.startsWith('$$') && resto.endsWith('$$')) resto = resto.slice(2, -2).trim();
  else if (resto.startsWith('$') && resto.endsWith('$')) resto = resto.slice(1, -1).trim();

  while (resto.length) {
    const c = resto[0]!;

    if (c === '\\') {
      // Espaçamentos especiais do LaTeX: \, \; \: \  \!
      const prox = resto[1];
      if (prox === ',' || prox === ';' || prox === ':' || prox === ' ') {
        out += ' ';
        resto = resto.slice(2);
        continue;
      }
      if (prox === '!') {
        resto = resto.slice(2);
        continue;
      }
      if (prox === '\\') {
        out += '\n';
        resto = resto.slice(2);
        continue;
      }
      if (prox === '{' || prox === '}' || prox === '%' || prox === '&' || prox === '#') {
        out += prox;
        resto = resto.slice(2);
        continue;
      }

      const nome = /^\\([a-zA-Z]+)/.exec(resto)?.[1];
      if (!nome) {
        out += resto[1] ?? '';
        resto = resto.slice(2);
        continue;
      }

      resto = resto.slice(nome.length + 1);

      if (nome === 'frac') {
        const [a, r1] = argumento(resto);
        const [b, r2] = argumento(r1);
        const na = latexParaTexto(a).trim(), nb = latexParaTexto(b).trim();
        const naFmt = /^[a-zA-Z0-9α-ωΑ-Ω√()]+$/.test(na) ? na : `(${na})`;
        const nbFmt = /^[a-zA-Z0-9α-ωΑ-Ω]+$/.test(nb) ? nb : `(${nb})`;
        out += `${naFmt}⁄${nbFmt}`;
        resto = r2;
      } else if (nome === 'sqrt') {
        resto = resto.trimStart();
        let indice = '';
        if (resto.startsWith('[')) {
          const fecha = resto.indexOf(']');
          if (fecha > 0) {
            indice = resto.slice(1, fecha);
            resto = resto.slice(fecha + 1);
          }
        }
        const [a, r1] = argumento(resto);
        const rad = latexParaTexto(a);
        if (indice === '3') out += `∛(${rad})`;
        else if (indice === '4') out += `∜(${rad})`;
        else if (indice) out += `${mapear(indice, SUP)}√(${rad})`;
        else out += `√(${rad})`;
        resto = r1;
      } else if (nome === 'vec') {
        const [a, r1] = argumento(resto);
        out += `${latexParaTexto(a)}⃗`;
        resto = r1;
      } else if (nome === 'overline' || nome === 'bar') {
        const [a, r1] = argumento(resto);
        out += `${latexParaTexto(a)}̅`;
        resto = r1;
      } else if (nome === 'text' || nome === 'mathrm' || nome === 'mathbf' || nome === 'mathit' || nome === 'textbf') {
        const [a, r1] = argumento(resto);
        out += a;
        resto = r1;
      } else {
        const simb = SIMBOLOS[nome];
        if (simb !== undefined) {
          out += simb;
        } else {
          out += nome;
        }
      }
    } else if (c === '^' || c === '_') {
      const [a, r1] = argumento(resto.slice(1));
      const txt = latexParaTexto(a);
      if (c === '^' && (txt === '∞' || txt === 'infty')) {
        out += '^∞';
      } else {
        out += mapear(txt, c === '^' ? SUP : SUB);
      }
      resto = r1;
    } else if (c === '{' || c === '}') {
      resto = resto.slice(1);
    } else {
      out += c;
      resto = resto.slice(1);
    }
  }

  // Limpa espaços duplicados e ajusta espaçamento em torno de operadores
  return out.replace(/\s+/g, ' ').trim();
}

export interface ItemCatalogoLatex {
  rotulo: string;
  latex: string;
  descricao?: string;
}

export interface CategoriaCatalogoLatex {
  id: string;
  nome: string;
  itens: ItemCatalogoLatex[];
}

export const CATALOGO_LATEX: CategoriaCatalogoLatex[] = [
  {
    id: 'calculo',
    nome: 'Cálculo',
    itens: [
      { rotulo: 'Integral Definida', latex: '\\int_{a}^{b} f(x)\\,dx', descricao: 'Área sob a curva de f(x)' },
      { rotulo: 'Integral Indefinida', latex: '\\int f(x)\\,dx = F(x) + C', descricao: 'Primitiva com constante C' },
      { rotulo: 'Derivada Simples', latex: '\\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}', descricao: 'Definição formal de derivada' },
      { rotulo: 'Derivada Parcial', latex: '\\frac{\\partial f}{\\partial x}', descricao: 'Derivada parcial em x' },
      { rotulo: 'Limite com Infinito', latex: '\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e', descricao: 'Definição do número de Euler' },
      { rotulo: 'Soma de Riemann', latex: '\\sum_{i=1}^{n} f(x_i^*)\\,\\Delta x', descricao: 'Aproximação da integral' },
      { rotulo: 'Teorema Fundamental', latex: '\\int_a^b f(x)\\,dx = F(b) - F(a)', descricao: 'Teorema Fundamental do Cálculo' },
      { rotulo: 'Série de Taylor', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x - a)^n', descricao: 'Expansão em série em torno de a' },
    ],
  },
  {
    id: 'algebra_linear',
    nome: 'Álgebra Linear',
    itens: [
      { rotulo: 'Matriz 2x2', latex: 'A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', descricao: 'Matriz quadrada de ordem 2' },
      { rotulo: 'Matriz 3x3', latex: 'M = \\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}', descricao: 'Matriz quadrada de ordem 3' },
      { rotulo: 'Determinante 2x2', latex: '\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc', descricao: 'Cálculo de determinante 2x2' },
      { rotulo: 'Sistema Linear', latex: '\\begin{cases} a_1 x + b_1 y = c_1 \\\\ a_2 x + b_2 y = c_2 \\end{cases}', descricao: 'Sistema de duas equações' },
      { rotulo: 'Produto Escalar', latex: '\\vec{u} \\cdot \\vec{v} = \\|\\vec{u}\\| \\|\\vec{v}\\| \\cos(\\theta)', descricao: 'Produto interno de vetores' },
      { rotulo: 'Autovalor e Autovetor', latex: 'A \\vec{v} = \\lambda \\vec{v}', descricao: 'Equação de autovalores' },
    ],
  },
  {
    id: 'trigonometria_geometria',
    nome: 'Geometria & Trig',
    itens: [
      { rotulo: 'Identidade Trig Fundamental', latex: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1', descricao: 'Círculo trigonométrico' },
      { rotulo: 'Lei dos Cossenos', latex: 'c^2 = a^2 + b^2 - 2ab \\cos(C)', descricao: 'Triângulos arbitrários' },
      { rotulo: 'Teorema de Pitágoras', latex: 'a^2 + b^2 = c^2', descricao: 'Triângulo retângulo' },
      { rotulo: 'Fórmula de Euler', latex: 'e^{i\\theta} = \\cos(\\theta) + i\\sin(\\theta)', descricao: 'Relação trigonométrica complexa' },
      { rotulo: 'Área do Círculo', latex: 'A = \\pi r^2', descricao: 'Área em função do raio' },
    ],
  },
  {
    id: 'famosas',
    nome: 'Fórmulas Notáveis',
    itens: [
      { rotulo: 'Fórmula de Bhaskara', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', descricao: 'Raízes da equação de 2º grau' },
      { rotulo: 'Identidade de Euler', latex: 'e^{i\\pi} + 1 = 0', descricao: 'A equação mais bela da matemática' },
      { rotulo: 'Equivalência Massa-Energia', latex: 'E = mc^2', descricao: 'Teoria da Relatividade de Einstein' },
      { rotulo: 'Integral de Gauss', latex: '\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}', descricao: 'Integral da curva normal' },
      { rotulo: 'Distribuição Normal', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}', descricao: 'Curva do sino gaussiana' },
      { rotulo: 'Segunda Lei de Newton', latex: '\\vec{F}_{res} = m \\cdot \\vec{a} = \\frac{d\\vec{p}}{dt}', descricao: 'Princípio fundamental da dinâmica' },
    ],
  },
];

export interface SimboloMatematico {
  rotulo: string;
  codigo: string;
  categoria: 'operador' | 'grego' | 'relacao' | 'calculo' | 'estrutura';
}

export const SIMBOLOS_PALETA: SimboloMatematico[] = [
  // Estruturas
  { rotulo: 'Fração', codigo: '\\frac{a}{b}', categoria: 'estrutura' },
  { rotulo: 'Raiz Quadrada', codigo: '\\sqrt{x}', categoria: 'estrutura' },
  { rotulo: 'Raiz N-ésima', codigo: '\\sqrt[n]{x}', categoria: 'estrutura' },
  { rotulo: 'Potência', codigo: 'x^{2}', categoria: 'estrutura' },
  { rotulo: 'Índice/Sub', codigo: 'x_{i}', categoria: 'estrutura' },
  { rotulo: 'Parênteses', codigo: '\\left( x \\right)', categoria: 'estrutura' },
  { rotulo: 'Colchetes', codigo: '\\left[ x \\right]', categoria: 'estrutura' },
  { rotulo: 'Chaves', codigo: '\\left\\{ x \\right\\}', categoria: 'estrutura' },
  // Operadores e relações
  { rotulo: '±', codigo: '\\pm', categoria: 'operador' },
  { rotulo: '×', codigo: '\\times', categoria: 'operador' },
  { rotulo: '÷', codigo: '\\div', categoria: 'operador' },
  { rotulo: '·', codigo: '\\cdot', categoria: 'operador' },
  { rotulo: '≠', codigo: '\\neq', categoria: 'relacao' },
  { rotulo: '≤', codigo: '\\leq', categoria: 'relacao' },
  { rotulo: '≥', codigo: '\\geq', categoria: 'relacao' },
  { rotulo: '≈', codigo: '\\approx', categoria: 'relacao' },
  { rotulo: '∞', codigo: '\\infty', categoria: 'operador' },
  { rotulo: '→', codigo: '\\to', categoria: 'relacao' },
  // Cálculo
  { rotulo: '∫', codigo: '\\int', categoria: 'calculo' },
  { rotulo: '∬', codigo: '\\iint', categoria: 'calculo' },
  { rotulo: '∮', codigo: '\\oint', categoria: 'calculo' },
  { rotulo: '∑', codigo: '\\sum_{i=1}^{n}', categoria: 'calculo' },
  { rotulo: '∏', codigo: '\\prod_{i=1}^{n}', categoria: 'calculo' },
  { rotulo: 'lim', codigo: '\\lim_{x \\to 0}', categoria: 'calculo' },
  { rotulo: '∂', codigo: '\\partial', categoria: 'calculo' },
  { rotulo: '∇', codigo: '\\nabla', categoria: 'calculo' },
  // Letras gregas
  { rotulo: 'α', codigo: '\\alpha', categoria: 'grego' },
  { rotulo: 'β', codigo: '\\beta', categoria: 'grego' },
  { rotulo: 'γ', codigo: '\\gamma', categoria: 'grego' },
  { rotulo: 'δ', codigo: '\\delta', categoria: 'grego' },
  { rotulo: 'Δ', codigo: '\\Delta', categoria: 'grego' },
  { rotulo: 'θ', codigo: '\\theta', categoria: 'grego' },
  { rotulo: 'λ', codigo: '\\lambda', categoria: 'grego' },
  { rotulo: 'μ', codigo: '\\mu', categoria: 'grego' },
  { rotulo: 'π', codigo: '\\pi', categoria: 'grego' },
  { rotulo: 'σ', codigo: '\\sigma', categoria: 'grego' },
  { rotulo: 'Σ', codigo: '\\Sigma', categoria: 'grego' },
  { rotulo: 'ω', codigo: '\\omega', categoria: 'grego' },
  { rotulo: 'Ω', codigo: '\\Omega', categoria: 'grego' },
];
