/**
 * Sistema de formatação e destaque colorido nas falas dos personagens.
 * Permite sintaxe inline como:
 * - `[azul:x]` ou `[vermelho:erro]` (cores semânticas calibradas para contraste em fundo claro)
 * - `[#2563eb:termo]` (hexadecimal livre)
 * - `[marca:fórmula]` ou `[fundo-amarelo:termo]` (fundo estilo marca-texto suave)
 */

export interface PalavraFala {
  /** Texto puro visível da palavra (sem as tags de estilo). */
  texto: string;
  /** Cor do texto em formato CSS (hexadecimal). */
  cor?: string;
  /** Cor de fundo para efeito marca-texto/destaque. */
  fundo?: string;
}

export interface LinhaFala {
  palavras: PalavraFala[];
  largura: number;
  temDestaque: boolean;
}

/** Cores semânticas com alto contraste sobre o fundo branco/claro do balão de fala (WCAG AA). */
export const CORES_FALA: Record<string, string> = {
  azul: '#1d4ed8',     // blue-700
  blue: '#1d4ed8',
  vermelho: '#b91c1c', // red-700
  red: '#b91c1c',
  verde: '#15803d',    // green-700
  green: '#15803d',
  amarelo: '#b45309',  // amber-700 (dourado escuro de alta legibilidade em fundo branco)
  yellow: '#b45309',
  dourado: '#b45309',
  gold: '#b45309',
  laranja: '#c2410c',  // orange-700
  orange: '#c2410c',
  roxo: '#7e22ce',     // purple-700
  purple: '#7e22ce',
  violeta: '#7e22ce',
  ciano: '#0e7490',    // cyan-700
  cyan: '#0e7490',
  rosa: '#be185d',     // pink-700
  pink: '#be185d',
  cinza: '#4b5563',    // gray-600
  gray: '#4b5563',
  preto: '#111827',
  black: '#111827',
};

/** Paletas de destaque estilo marca-texto com fundo suave e texto com contraste. */
export const FUNDOS_FALA: Record<string, { fundo: string; cor: string }> = {
  marca: { fundo: '#fef08a', cor: '#854d0e' },
  destaque: { fundo: '#fef08a', cor: '#854d0e' },
  'marca-amarela': { fundo: '#fef08a', cor: '#854d0e' },
  'fundo-amarelo': { fundo: '#fef08a', cor: '#854d0e' },
  'marca-verde': { fundo: '#bbf7d0', cor: '#166534' },
  'fundo-verde': { fundo: '#bbf7d0', cor: '#166534' },
  'marca-azul': { fundo: '#bfdbfe', cor: '#1e40af' },
  'fundo-azul': { fundo: '#bfdbfe', cor: '#1e40af' },
  'marca-rosa': { fundo: '#fbcfe8', cor: '#9d174d' },
  'fundo-rosa': { fundo: '#fbcfe8', cor: '#9d174d' },
  'marca-laranja': { fundo: '#fed7aa', cor: '#9a3412' },
  'fundo-laranja': { fundo: '#fed7aa', cor: '#9a3412' },
  'marca-roxa': { fundo: '#e9d5ff', cor: '#6b21a8' },
  'fundo-roxo': { fundo: '#e9d5ff', cor: '#6b21a8' },
};

/** Identifica e resolve cor/fundo a partir do nome ou código hex. */
export function resolverEstiloFala(etiqueta: string): { cor?: string; fundo?: string } {
  const norm = etiqueta.trim().toLowerCase();
  if (FUNDOS_FALA[norm]) {
    return { fundo: FUNDOS_FALA[norm].fundo, cor: FUNDOS_FALA[norm].cor };
  }
  if (CORES_FALA[norm]) {
    return { cor: CORES_FALA[norm] };
  }
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(norm)) {
    return { cor: norm };
  }
  return {};
}

const REGEX_TAG_FALA = /\[([a-zA-Z0-9_#-]+):([^\]]+)\]/g;

/** Remove todas as tags de estilo e retorna o texto limpo para cálculos de timing e fala. */
export function removerMarcasFala(texto: string): string {
  if (!texto || !texto.includes('[')) return texto;
  return texto.replace(REGEX_TAG_FALA, '$2');
}

/** Transforma a fala em uma lista de palavras estruturadas com texto limpo e estilos visuais. */
export function parsearPalavrasFala(texto: string): PalavraFala[] {
  if (!texto) return [];
  if (!texto.includes('[')) {
    return texto.split(/\s+/).filter(Boolean).map((t) => ({ texto: t }));
  }

  const palavras: PalavraFala[] = [];
  const partes = texto.split(/(\[[a-zA-Z0-9_#-]+:[^\]]+\])/g);

  for (const parte of partes) {
    if (!parte) continue;
    const match = /^\[([a-zA-Z0-9_#-]+):([^\]]+)\]$/.exec(parte);
    if (match) {
      const estilo = resolverEstiloFala(match[1]!);
      const subPalavras = match[2]!.split(/\s+/).filter(Boolean);
      for (const p of subPalavras) {
        palavras.push({
          texto: p,
          ...(estilo.cor ? { cor: estilo.cor } : {}),
          ...(estilo.fundo ? { fundo: estilo.fundo } : {}),
        });
      }
    } else {
      const comecaComEspaco = /^\s/.test(parte);
      const subPalavras = parte.split(/\s+/).filter(Boolean);
      if (subPalavras.length === 0) continue;

      let idxInicio = 0;
      if (!comecaComEspaco && palavras.length > 0) {
        // Pontuação colada à palavra estilizada anterior (ex.: "[azul:x]," -> "x,")
        const primeira = subPalavras[0]!;
        if (/^[.,;:!?)\]]+$/.test(primeira)) {
          palavras[palavras.length - 1]!.texto += primeira;
          idxInicio = 1;
        } else if (/^[.,;:!?)\]]+/.test(primeira)) {
          const pont = /^[.,;:!?)\]]+/.exec(primeira)![0];
          palavras[palavras.length - 1]!.texto += pont;
          const resto = primeira.slice(pont.length);
          if (resto) {
            palavras.push({ texto: resto });
          }
          idxInicio = 1;
        }
      }

      for (let i = idxInicio; i < subPalavras.length; i++) {
        palavras.push({ texto: subPalavras[i]! });
      }
    }
  }

  return palavras;
}

/** Quebra o texto formatado da fala em linhas respeitando a largura máxima disponível no balão. */
export function quebrarLinhasFala(
  ctx: CanvasRenderingContext2D,
  textoCompleto: string,
  larguraMax: number,
): LinhaFala[] {
  const palavras = parsearPalavrasFala(textoCompleto);
  if (palavras.length === 0) return [];

  const linhas: LinhaFala[] = [];
  let atual: PalavraFala[] = [];

  for (const p of palavras) {
    const teste = [...atual, p];
    const textoTeste = teste.map((w) => w.texto).join(' ');
    const larguraTeste = ctx.measureText(textoTeste).width;

    if (larguraTeste > larguraMax && atual.length > 0) {
      const textoLinha = atual.map((w) => w.texto).join(' ');
      linhas.push({
        palavras: atual,
        largura: ctx.measureText(textoLinha).width,
        temDestaque: atual.some((w) => w.cor || w.fundo),
      });
      atual = [p];
    } else {
      atual = teste;
    }
  }

  if (atual.length > 0) {
    const textoLinha = atual.map((w) => w.texto).join(' ');
    linhas.push({
      palavras: atual,
      largura: ctx.measureText(textoLinha).width,
      temDestaque: atual.some((w) => w.cor || w.fundo),
    });
  }

  return linhas;
}
