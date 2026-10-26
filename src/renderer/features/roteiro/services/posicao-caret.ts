/** Propriedades de texto e caixa que o espelho precisa copiar do textarea para quebrar as linhas do mesmo jeito. */
const PROPRIEDADES = [
  'boxSizing', 'width', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight',
  'textTransform', 'wordSpacing', 'textIndent', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'tabSize',
] as const;

/**
 * Coordenadas (em px, relativas ao canto do textarea) do ponto logo antes da posição `pos`.
 * Um textarea não informa onde está o cursor, então copia o texto até `pos` para um espelho invisível com a mesma fonte e largura.
 */
export function posicaoDoCaret(el: HTMLTextAreaElement, pos: number): { top: number; left: number; altura: number } {
  const estilo = getComputedStyle(el);
  const espelho = document.createElement('div');
  const destino = espelho.style as unknown as Record<string, string>;
  const origem = estilo as unknown as Record<string, string>;
  for (const p of PROPRIEDADES) destino[p] = origem[p] ?? '';
  espelho.style.position = 'absolute';
  espelho.style.visibility = 'hidden';
  espelho.style.top = '0';
  espelho.style.left = '0';
  espelho.style.whiteSpace = 'pre-wrap';
  espelho.style.overflowWrap = 'break-word';
  espelho.style.overflow = 'hidden';
  espelho.textContent = el.value.slice(0, pos);
  const marca = document.createElement('span');
  marca.textContent = el.value.slice(pos) || '.';
  espelho.appendChild(marca);
  document.body.appendChild(espelho);
  const altura = parseFloat(estilo.lineHeight) || parseFloat(estilo.fontSize) * 1.4 || 18;
  const resultado = { top: marca.offsetTop - el.scrollTop, left: marca.offsetLeft - el.scrollLeft, altura };
  document.body.removeChild(espelho);
  return resultado;
}
