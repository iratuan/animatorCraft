import { ATORES } from './characters';
import { coletarBiblioteca, gerarPromptMestre, type BibliotecaMestre } from './prompt-mestre';
import { parseRoteiro } from './script/parser';

/**
 * Geração de roteiro por IA (independente de fornecedor): aqui só há o que é puro — o prompt, a limpeza da resposta e a
 * validação pelo próprio interpretador do app. Quem fala com a API é o renderer (features/ia).
 */
export interface PedidoRoteiro {
  tema: string;
  materia: string;
  serie: string;
  duracao: 'curta' | 'media' | 'longa';
  /** ids dos personagens que podem aparecer (vazio = todos) */
  personagens: string[];
  professor: string;
  aluno: string;
  extras?: string;
}

const DURACAO: Record<PedidoRoteiro['duracao'], string> = { curta: 'cerca de 1 minuto (2 cenas)', media: 'cerca de 3 minutos (4 a 5 cenas)', longa: 'cerca de 6 minutos (7 a 9 cenas)' };

/** Instruções para a IA: o prompt mestre (formato, frases aceitas, elenco e biblioteca), sem o pedido, que vai como mensagem do usuário. */
export function promptSistema(biblioteca: BibliotecaMestre = coletarBiblioteca(() => [])): string {
  return gerarPromptMestre(biblioteca, { semPedido: true });
}
export function promptGerar(p: PedidoRoteiro): string {
  const nome = (id: string) => ATORES[id]?.nome ?? id;
  const elenco = p.personagens.length ? p.personagens.map(nome).join(', ') : 'todos os personagens disponíveis, usando só os que fizerem sentido';
  return `Escreva um roteiro sobre: ${p.tema}
Matéria: ${p.materia}. Público: ${p.serie}.
Duração: ${DURACAO[p.duracao]}.
Professor desta aula: ${nome(p.professor)}. Aluno: ${nome(p.aluno)}.
Personagens que podem aparecer: ${elenco}.${p.extras?.trim() ? `\nPedidos extras: ${p.extras.trim()}` : ''}`;
}

export function promptMelhorar(roteiro: string, instrucao: string): string {
  return `Melhore o roteiro abaixo seguindo este pedido: ${instrucao.trim() || 'acrescente reações, gestos e expressões dos personagens enquanto os outros falam (use "Enquanto..." e "Ao mesmo tempo,"), sem mudar o conteúdo da aula'}.
Devolva o roteiro COMPLETO, no mesmo formato.

ROTEIRO ATUAL
${roteiro}`;
}

/** Tira cercas de código, aspas de resposta e conversa antes do roteiro. */
export function extrairRoteiro(resposta: string): string {
  let t = resposta.trim();
  const cerca = /```(?:\w+)?\s*\n([\s\S]*?)```/.exec(t);
  if (cerca) t = cerca[1]!.trim();
  const ini = t.search(/^\s*(\[pap[eé]is|#\s)/m);
  if (ini > 0) t = t.slice(ini);
  return t.trim() + '\n';
}

export function promptCorrigir(avisos: string[]): string {
  return `O programa não entendeu estas partes do roteiro:\n${avisos.map((a) => `- ${a}`).join('\n')}\n\nCorrija SOMENTE isso, mantendo o resto, e devolva o roteiro completo.`;
}

export interface MensagemIA { role: 'user' | 'assistant'; content: string }
export type PedirIA = (sistema: string, mensagens: MensagemIA[]) => Promise<string>;

/**
 * Pede o roteiro e confere com o interpretador do app. Se houver avisos, devolve-os à IA para uma correção (até `tentativas` vezes).
 * `avisosFinais` lista o que ainda restou (pode ser vazio).
 */
export async function gerarRoteiro(pedir: PedirIA, primeiraMensagem: string, tentativas = 2, sistema: string = promptSistema()): Promise<{ roteiro: string; avisosFinais: string[]; rodadas: number }> {
  const msgs: MensagemIA[] = [{ role: 'user', content: primeiraMensagem }];
  let roteiro = '', avisos: string[] = [];
  for (let rodada = 0; rodada <= tentativas; rodada++) {
    const resposta = await pedir(sistema, msgs);
    roteiro = extrairRoteiro(resposta);
    avisos = parseRoteiro(roteiro).avisos;
    if (!avisos.length || rodada === tentativas) return { roteiro, avisosFinais: avisos, rodadas: rodada + 1 };
    msgs.push({ role: 'assistant', content: resposta }, { role: 'user', content: promptCorrigir(avisos) });
  }
  return { roteiro, avisosFinais: avisos, rodadas: tentativas + 1 };
}
