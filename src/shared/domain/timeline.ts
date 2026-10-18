import { clamp01, suave } from '../util/numeros';
import { ATORES, ORDEM_ATORES, type ActorId } from './characters';
import { latexParaTexto } from './latex';
import { rotuloDoGrafico } from './grafico';
import { chaveImagem, DURACAO_EFEITO, type EfeitoImagem } from './imagem';
import { FOLGA_FALA_AUDIO, infoDoAudio } from './audio';
import type { ExpressaoId, PoseId } from './poses';
import type { Acao, Conteudo, Origem, Roteiro } from './types';

const { abs } = Math;

export interface Evento {
  indice: number;
  inicio: number;
  fim: number;
  acao: Acao;
  rotulo: string;
  cena: number;
  /** posição da frase no roteiro (ausente nas ações automáticas, como o apagar entre cenas) */
  origem?: Origem;
}

export interface Timeline {
  eventos: Evento[];
  duracao: number;
  cenas: { titulo: string; inicio: number; fim: number }[];
}

export const TRANSICAO_POSE = 0.3;

export { suave };

export function textoDoConteudo(c: Conteudo): string {
  return c.tipo === 'texto' ? c.texto : c.tipo === 'grafico' ? rotuloDoGrafico(c.grafico) : c.tipo === 'imagem' ? `imagem ${c.arquivo}` : latexParaTexto(c.latex);
}

function duracaoDe(a: Acao): number {
  switch (a.tipo) {
    case 'entrar': case 'sair': return a.pose === 'correr' ? 0.9 : 1.6;
    case 'posicionar': return a.andando ? 1.2 : 0;
    case 'pose': return a.duracao ?? 0.9;
    case 'expressao': return 0.7;
    case 'audio': return 0;
    case 'fala': if (a.audio && infoDoAudio(a.audio)) return infoDoAudio(a.audio)!.duracao + FOLGA_FALA_AUDIO; return Math.max(1.4, a.texto.split(/\s+/).length * 0.4 + 0.4);
    case 'remover': return a.saida === 'nenhum' ? 0.1 : DURACAO_EFEITO;
    case 'escrever': if (a.conteudo.tipo === 'imagem') return a.conteudo.entrada === 'nenhum' ? 0.1 : DURACAO_EFEITO; if (a.conteudo.tipo === 'grafico') return 3.5; return Math.max(1.5, textoDoConteudo(a.conteudo).length * 0.13);
    case 'apontar': return 1.4;
    case 'apagar': return 0.9;
    case 'camera': return 0.8;
    case 'esperar': return a.segundos;
    case 'nota': return 0;
  }
}

function rotuloDe(a: Acao): string {
  const nome = (id: ActorId) => ATORES[id]!.nome;
  switch (a.tipo) {
    case 'entrar': return `${nome(a.ator)} entra (${a.lado})`;
    case 'sair': return `${nome(a.ator)} sai (${a.lado})`;
    case 'posicionar': return `${nome(a.ator)} ${a.andando ? 'anda para' : 'fica na'} posição ${Math.round(a.x * 100)}%`;
    case 'pose': return `${nome(a.ator)}: ${a.etiqueta ?? a.pose.replace('_', ' ')}${a.duracao ? ` (${a.duracao}s)` : ''}`;
    case 'expressao': return `${nome(a.ator)}: cara ${a.expressao}`;
    case 'audio': return a.parar ? 'Música: parar' : `${a.papel === 'musica' ? 'Música' : a.papel === 'efeito' ? 'Efeito' : 'Voz'}: ${a.arquivo}`;
    case 'fala': return `${a.audio ? '🔊 ' : ''}${nome(a.ator)}: “${a.texto}”`;
    case 'escrever': return a.conteudo.tipo === 'imagem' ? `${nome(a.ator)} mostra ${textoDoConteudo(a.conteudo)}` : `${nome(a.ator)} escreve ${textoDoConteudo(a.conteudo)}`;
    case 'remover': return `${nome(a.ator)} tira a imagem ${a.arquivo}`;
    case 'apontar': return `${nome(a.ator)} aponta`;
    case 'apagar': return 'Apagar quadro';
    case 'camera': return a.alvo === 'aberto' ? 'Câmera: plano aberto' : a.alvo === 'lousa' ? 'Câmera: close na lousa' : `Câmera: close em ${nome(a.ator!)}`;
    case 'esperar': return `Pausa ${a.segundos}s`;
    case 'nota': return `Nota: ${a.texto}`;
  }
}

/** As ações do roteiro são sequenciais: cada uma começa quando a anterior termina. Mudar de cena limpa o quadro. */
export function construirTimeline(roteiro: Roteiro): Timeline {
  const eventos: Evento[] = [];
  const cenas: Timeline['cenas'] = [];
  let t = 0;
  roteiro.cenas.forEach((cena, ci) => {
    const inicioCena = t;
    const acoes: Acao[] = ci > 0 ? [{ tipo: 'apagar' }, ...cena.acoes] : cena.acoes;
    let inicioGrupo = t;
    const origens: (Origem | undefined)[] = ci > 0 ? [undefined, ...cena.origens] : cena.origens;
    for (const [ai, acao] of acoes.entries()) {
      const d = duracaoDe(acao);
      const inicio = acao.junto ? inicioGrupo : t;
      if (!acao.junto) inicioGrupo = t;
      eventos.push({ indice: eventos.length, inicio, fim: inicio + d, acao, rotulo: rotuloDe(acao), cena: ci, origem: origens[ai] });
      t = Math.max(t, inicio + d);
    }
    cenas.push({ titulo: cena.titulo, inicio: inicioCena, fim: t });
  });
  return { eventos, duracao: t, cenas };
}

// ---------------------------------------------------------------- estado em um instante

export interface AtorEstado {
  id: ActorId;
  visivel: boolean;
  /** Posição horizontal normalizada (0..1 da largura do palco). */
  x: number;
  facing: 1 | -1;
  pose: PoseId;
  poseDe: PoseId;
  poseDesde: number;
  /** Nome de um sprite do pacote ("faz a pose pular-corda"); vale enquanto a pose não mudar. */
  etiqueta?: string;
  fase: number;
  faseDe: number;
  expressao: ExpressaoId;
  expressaoDe: ExpressaoId;
  expressaoDesde: number;
  /** texto = palavras reveladas até agora; completo/progresso/duracao alimentam a sincronia labial. */
  fala?: { texto: string; completo: string; progresso: number; duracao: number; opacidade: number; boca: boolean; /** nome do áudio da narração (a boca segue o volume dele) */ audio?: string };
}

export interface ItemQuadro {
  id: number;
  conteudo: Conteudo;
  ordem: number;
  progresso: number;
  opacidade: number;
  /** imagem saindo da lousa: efeito e ponto (0 = no lugar, 1 = fora) */
  saida?: { efeito: EfeitoImagem; p: number };
}

export type AlvoCamera = { alvo: 'aberto' | 'lousa' | 'personagem'; ator?: ActorId };

export interface Estado {
  /** Câmera atual, a anterior e o progresso (0..1) da transição entre elas. */
  camera: { atual: AlvoCamera; anterior: AlvoCamera; progresso: number };
  t: number;
  atores: Record<ActorId, AtorEstado>;
  quadro: ItemQuadro[];
  /** Item sendo escrito agora (o conteúdo é revelado aos poucos; não há mão nem caneta na lousa). */
  mao?: { item: number; progresso: number; ator: ActorId };
  eventoAtual?: Evento;
}

const LADO_X = { esquerda: 0.13, direita: 0.87, centro: 0.5 } as const;
const FORA = { esquerda: -0.12, direita: 1.12, centro: -0.12 } as const;

function novoAtor(id: ActorId): AtorEstado {
  const e = ATORES[id]!.expressaoPadrao;
  return {
    id, visivel: false, x: ATORES[id]!.slotPadrao, facing: 1, pose: 'parado', poseDe: 'parado', poseDesde: -10,
    fase: 0, faseDe: 0, expressao: e, expressaoDe: e, expressaoDesde: -10,
  };
}

export function estadoEm(tl: Timeline, t: number): Estado {
  const atores = Object.fromEntries(ORDEM_ATORES.map((id) => [id, novoAtor(id)])) as Record<ActorId, AtorEstado>;
  let itens: (ItemQuadro & { apagarInicio?: number; apagarFim?: number; inicio: number; fim: number })[] = [];
  let mao: Estado['mao'];
  let eventoAtual: Evento | undefined;
  let proximoItem = 0;
  const falaFim: Record<string, number> = {};
  let cameraAtual: AlvoCamera = { alvo: 'aberto' };
  let cameraAnterior: AlvoCamera = { alvo: 'aberto' };
  let cameraDesde = -10;

  const mudarPose = (a: AtorEstado, pose: PoseId, quando: number) => {
    a.poseDe = a.pose; a.faseDe = a.fase; a.pose = pose; a.poseDesde = quando; a.etiqueta = undefined;
  };
  const mudarExpressao = (a: AtorEstado, e: ExpressaoId, quando: number) => {
    a.expressaoDe = a.expressao; a.expressao = e; a.expressaoDesde = quando;
  };
  const garantir = (a: AtorEstado) => {
    if (!a.visivel) { a.visivel = true; a.facing = a.x < 0.5 ? 1 : -1; }
  };

  for (const ev of tl.eventos) {
    if (ev.inicio > t) break;
    const dur = ev.fim - ev.inicio;
    const p = dur > 0 ? clamp01((t - ev.inicio) / dur) : 1;
    const feito = t >= ev.fim;
    const ac = ev.acao;
    if (!feito || !eventoAtual) eventoAtual = ev;

    switch (ac.tipo) {
      case 'entrar': {
        const a = atores[ac.ator];
        {
          const lado = ac.lado;
          const outros = ORDEM_ATORES.filter((id) => id !== ac.ator && atores[id].visivel && (lado === 'esquerda' ? atores[id].x < 0.45 : lado === 'direita' ? atores[id].x > 0.55 : abs(atores[id].x - 0.5) < 0.1)).length;
          const destino = ac.x ?? LADO_X[lado] + (lado === 'direita' ? -1 : 1) * 0.1 * outros;
          const origem = FORA[lado];
          const k = suave(p);
          if (!a.visivel) { a.visivel = true; a.fase = 0; }
          a.x = origem + (destino - origem) * k;
          a.facing = destino >= origem ? 1 : -1;
          const loco: PoseId = ac.pose === 'correr' ? 'correr' : 'andar';
          if (!feito) {
            if (a.pose !== loco) mudarPose(a, loco, ev.inicio);
            a.fase = p * dur * (loco === 'correr' ? 9 : 6.2);
          } else {
            if (a.pose === loco) mudarPose(a, 'parado', ev.fim);
            a.x = destino;
            a.facing = ac.x !== undefined ? (ac.x < 0.5 ? 1 : -1) : lado === 'centro' ? 1 : lado === 'esquerda' ? 1 : -1;
          }
        }
        break;
      }
      case 'sair': {
        const a = atores[ac.ator];
        if (!a.visivel) break;
        const destino = FORA[ac.lado];
        if (!feito) {
          const origem = a.x;
          a.x = origem + (destino - origem) * suave(p);
          a.facing = destino >= origem ? 1 : -1;
          const loco: PoseId = ac.pose === 'correr' ? 'correr' : 'andar';
          if (a.pose !== loco) mudarPose(a, loco, ev.inicio);
          a.fase = p * dur * (loco === 'correr' ? 9 : 6.2);
        } else {
          a.x = destino; a.visivel = false; a.pose = 'parado'; a.poseDe = 'parado';
        }
        break;
      }
      case 'pose': {
        const a = atores[ac.ator]; garantir(a);
        mudarPose(a, ac.pose, ev.inicio);
        a.etiqueta = ac.etiqueta;
        if (ac.duracao && feito) mudarPose(a, 'parado', ev.fim);
        break;
      }
      case 'posicionar': {
        const a = atores[ac.ator]; garantir(a);
        const origem = a.x;
        if (ac.andando && !feito) {
          a.x = origem + (ac.x - origem) * suave(p);
          a.facing = ac.x >= origem ? 1 : -1;
          if (a.pose !== 'andar') mudarPose(a, 'andar', ev.inicio);
          a.fase = p * dur * 6.2;
        } else {
          a.x = ac.x;
          if (ac.andando && a.pose === 'andar') mudarPose(a, 'parado', ev.fim);
        }
        break;
      }
      case 'expressao': {
        const a = atores[ac.ator]; garantir(a);
        mudarExpressao(a, ac.expressao, ev.inicio);
        break;
      }
      case 'fala': {
        const a = atores[ac.ator]; garantir(a);
        // quem já terminou de falar perde o balão; quem ainda está falando (fala simultânea) mantém o seu
        for (const id of ORDEM_ATORES) if (id !== ac.ator && t > (falaFim[id] ?? -1)) atores[id].fala = undefined;
        falaFim[ac.ator] = ev.fim;
        a.fala = undefined;
        const fade = 1 - clamp01((t - ev.fim) / 0.5);
        if (t <= ev.fim + 0.5) {
          const palavras = ac.texto.split(/\s+/);
          const n = Math.max(1, Math.ceil(palavras.length * Math.min(1, p * 1.25)));
          a.fala = { texto: palavras.slice(0, n).join(' '), completo: ac.texto, progresso: p, duracao: dur, opacidade: feito ? fade : 1, boca: !feito, audio: ac.audio };
        }
        break;
      }
      case 'remover': {
        const alvo = [...itens].reverse().find((i) => i.conteudo.tipo === 'imagem' && chaveImagem(i.conteudo.arquivo) === chaveImagem(ac.arquivo) && !i.saida);
        if (!alvo) break;
        alvo.saida = { efeito: ac.saida, p };
        if (feito) itens = itens.filter((i) => i !== alvo);
        break;
      }
      case 'escrever': {
        const a = atores[ac.ator]; garantir(a);
        if (ac.conteudo.tipo === 'imagem') {
          // a imagem fica na lousa até o quadro ser apagado, ou só `exibirPor` segundos e então sai com o efeito de saída
          const c = ac.conteudo, item: (typeof itens)[number] = { id: proximoItem++, conteudo: c, ordem: itens.length, progresso: p, opacidade: 1, inicio: ev.inicio, fim: ev.fim };
          const saiEm = c.exibirPor !== undefined ? ev.inicio + c.exibirPor : undefined;
          if (saiEm !== undefined && t >= saiEm) {
            const ps = clamp01((t - saiEm) / DURACAO_EFEITO);
            if (ps >= 1 || (c.saida ?? c.entrada) === 'nenhum') break;
            item.progresso = 1; item.saida = { efeito: c.saida ?? c.entrada, p: ps };
          }
          itens.push(item);
          break;
        }
        itens.push({ id: proximoItem++, conteudo: ac.conteudo, ordem: itens.length, progresso: p, opacidade: 1, inicio: ev.inicio, fim: ev.fim });
        if (!feito) {
          if (a.pose !== 'escrever') mudarPose(a, 'escrever', ev.inicio);
          mao = { item: itens[itens.length - 1]!.id, progresso: p, ator: ac.ator };
        } else if (a.pose === 'escrever') {
          mudarPose(a, 'parado', ev.fim);
        }
        break;
      }
      case 'apontar': {
        const a = atores[ac.ator]; garantir(a);
        if (!feito) { if (a.pose !== 'apontar') mudarPose(a, 'apontar', ev.inicio); }
        else if (a.pose === 'apontar') mudarPose(a, 'parado', ev.fim);
        break;
      }
      case 'apagar': {
        for (const it of itens) { it.apagarInicio ??= ev.inicio; it.apagarFim ??= ev.fim; }
        itens.forEach((it) => { it.opacidade = 1 - suave((t - ev.inicio) / Math.max(dur, 0.001)); });
        if (feito) itens = [];
        break;
      }
      case 'camera': {
        cameraAnterior = cameraAtual;
        cameraAtual = { alvo: ac.alvo, ator: ac.ator };
        cameraDesde = ev.inicio;
        break;
      }
      case 'esperar': case 'nota': case 'audio':
        break;
    }
  }
  // Posição vertical dos itens: índice entre os que sobreviveram à última limpeza.
  itens.forEach((it, i) => { it.ordem = i; });
  const camera = { atual: cameraAtual, anterior: cameraAnterior, progresso: suave((t - cameraDesde) / 0.8) };
  return { t, atores, quadro: itens, mao, eventoAtual, camera };
}








