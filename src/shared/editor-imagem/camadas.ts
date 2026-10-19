import { clonarPixels, colarSobre, criarPixels, espelhar, girar90, redimensionar, sobreporPixel, type Mascara, type Pixels } from './pixels';
import { clonarMascara } from './selecao';

export interface Camada { id: number; nome: string; visivel: boolean; /** 0..1 */ opacidade: number; pixels: Pixels }
export interface Documento { w: number; h: number; camadas: Camada[]; ativa: number; proximoId: number; selecao: Mascara | null }

export const LIMITE_LADO = 2048;

export function novoDocumento(w: number, h: number, base?: Pixels, nomeBase = 'Sprite'): Documento {
  const p = base ? clonarPixels(base) : criarPixels(w, h);
  return { w: p.w, h: p.h, camadas: [{ id: 1, nome: nomeBase, visivel: true, opacidade: 1, pixels: p }], ativa: 0, proximoId: 2, selecao: null };
}

export const camadaAtiva = (d: Documento): Camada => d.camadas[d.ativa]!;

/**
 * Antes de alterar os pixels de uma camada, troca o buffer por uma cópia: os instantâneos do histórico guardam o buffer antigo
 * por referência (sem copiar tudo), então a alteração nunca os corrompe.
 */
export function prepararEdicao(d: Documento, indice = d.ativa): Pixels {
  const c = d.camadas[indice]!;
  c.pixels = clonarPixels(c.pixels);
  return c.pixels;
}

export function adicionarCamada(d: Documento, nome?: string, pixels?: Pixels): Camada {
  const c: Camada = { id: d.proximoId++, nome: nome ?? `Camada ${d.proximoId - 1}`, visivel: true, opacidade: 1, pixels: pixels ?? criarPixels(d.w, d.h) };
  d.camadas.splice(d.ativa + 1, 0, c);
  d.ativa = d.ativa + 1;
  return c;
}
export function duplicarCamada(d: Documento): Camada {
  const o = camadaAtiva(d), c: Camada = { id: d.proximoId++, nome: `${o.nome} cópia`, visivel: o.visivel, opacidade: o.opacidade, pixels: clonarPixels(o.pixels) };
  d.camadas.splice(d.ativa + 1, 0, c);
  d.ativa += 1;
  return c;
}
/** Remove a camada ativa (o documento sempre mantém pelo menos uma). */
export function removerCamada(d: Documento): boolean {
  if (d.camadas.length <= 1) return false;
  d.camadas.splice(d.ativa, 1);
  d.ativa = Math.min(d.ativa, d.camadas.length - 1);
  return true;
}
/** `delta` +1 sobe a camada (para a frente), -1 desce. */
export function moverCamada(d: Documento, delta: 1 | -1): boolean {
  const j = d.ativa + delta;
  if (j < 0 || j >= d.camadas.length) return false;
  const [c] = d.camadas.splice(d.ativa, 1);
  d.camadas.splice(j, 0, c!);
  d.ativa = j;
  return true;
}
/** Mescla a camada ativa na de baixo (respeitando visibilidade e opacidade). */
export function mesclarAbaixo(d: Documento): boolean {
  if (d.ativa === 0) return false;
  const cima = d.camadas[d.ativa]!, baixo = d.camadas[d.ativa - 1]!;
  const novo = clonarPixels(baixo.pixels);
  // a camada de baixo entra com a opacidade dela: faz a mistura sobre um fundo transparente e a opacidade final fica 1
  const opb = baixo.opacidade;
  if (opb !== 1) for (let i = 3; i < novo.data.length; i += 4) novo.data[i] = novo.data[i]! * opb;
  if (cima.visivel) colarSobre(novo, cima.pixels, 0, 0, cima.opacidade);
  d.camadas.splice(d.ativa, 1);
  d.ativa -= 1;
  d.camadas[d.ativa] = { ...baixo, pixels: novo, opacidade: 1 };
  return true;
}

/** Imagem final: camadas visíveis, de baixo para cima, com a opacidade de cada uma. */
export function compor(d: Documento, incluirOcultas = false): Pixels {
  const out = criarPixels(d.w, d.h);
  for (const c of d.camadas) {
    if (!c.visivel && !incluirOcultas) continue;
    if (c.opacidade >= 1) { // caminho rápido
      const s = c.pixels.data, o = out.data;
      for (let i = 0; i < s.length; i += 4) {
        const a = s[i + 3]!;
        if (a === 0) continue;
        if (a === 255 || o[i + 3] === 0) { o[i] = s[i]!; o[i + 1] = s[i + 1]!; o[i + 2] = s[i + 2]!; o[i + 3] = a; }
        else sobreporPixel(o, i, { r: s[i]!, g: s[i + 1]!, b: s[i + 2]!, a }, 1);
      }
    } else colarSobre(out, c.pixels, 0, 0, c.opacidade);
  }
  return out;
}

// ---------------------------------------------------------------- operações no documento inteiro

const transformar = (d: Documento, f: (p: Pixels) => Pixels, mascaraF?: (m: Mascara) => Mascara | null): void => {
  d.camadas = d.camadas.map((c) => ({ ...c, pixels: f(c.pixels) }));
  d.w = d.camadas[0]!.pixels.w; d.h = d.camadas[0]!.pixels.h;
  d.selecao = d.selecao && mascaraF ? mascaraF(d.selecao) : null;
};
export const espelharDocumento = (d: Documento, horizontal: boolean): void => transformar(d, (p) => espelhar(p, horizontal));
export const girarDocumento = (d: Documento, horario: boolean): void => transformar(d, (p) => girar90(p, horario));
/** Muda o tamanho da imagem toda (as camadas são reamostradas). */
export function redimensionarDocumento(d: Documento, w: number, h: number): void {
  if (!Number.isFinite(w) || !Number.isFinite(h)) return;
  w = Math.min(LIMITE_LADO, Math.max(1, Math.round(w))); h = Math.min(LIMITE_LADO, Math.max(1, Math.round(h)));
  transformar(d, (p) => redimensionar(p, w, h));
}
/** Muda o tamanho da tela sem reamostrar: o conteúdo fica em (dx,dy) e o resto é recortado ou fica transparente. */
export function redimensionarTela(d: Documento, w: number, h: number, dx: number, dy: number): void {
  if (![w, h, dx, dy].every(Number.isFinite)) return;
  w = Math.min(LIMITE_LADO, Math.max(1, Math.round(w))); h = Math.min(LIMITE_LADO, Math.max(1, Math.round(h)));
  transformar(d, (p) => { const o = criarPixels(w, h); colarSobre(o, p, Math.round(dx), Math.round(dy)); return o; });
}
/** Recorta a tela até o conteúdo visível (com `margem` px ao redor). Devolve false se estiver vazia. */
export function cortarAoConteudo(d: Documento, margem = 0): boolean {
  const comp = compor(d);
  let x0 = comp.w, y0 = comp.h, x1 = -1, y1 = -1;
  for (let y = 0; y < comp.h; y++) for (let x = 0; x < comp.w; x++) if (comp.data[(y * comp.w + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return false;
  const nx = Math.max(0, x0 - margem), ny = Math.max(0, y0 - margem), nw = Math.min(comp.w, x1 + 1 + margem) - nx, nh = Math.min(comp.h, y1 + 1 + margem) - ny;
  redimensionarTela(d, nw, nh, -nx, -ny);
  return true;
}

// ---------------------------------------------------------------- instantâneos (histórico)

export interface Instantaneo { w: number; h: number; camadas: Camada[]; ativa: number; proximoId: number; selecao: Mascara | null }
/** Guarda o estado atual: copia só a lista de camadas e a máscara (os buffers de pixels vão por referência). */
export const tirarInstantaneo = (d: Documento): Instantaneo => ({ w: d.w, h: d.h, camadas: d.camadas.map((c) => ({ ...c })), ativa: d.ativa, proximoId: d.proximoId, selecao: d.selecao ? clonarMascara(d.selecao) : null });
export function restaurarInstantaneo(d: Documento, s: Instantaneo): void {
  d.w = s.w; d.h = s.h; d.camadas = s.camadas.map((c) => ({ ...c })); d.ativa = s.ativa; d.proximoId = s.proximoId; d.selecao = s.selecao ? clonarMascara(s.selecao) : null;
}
