import { ATORES } from './characters';
import { coletarBiblioteca, gerarPromptMestre, type BibliotecaMestre } from './prompt-mestre';
import { parseRoteiro } from './script/parser';
import type { FormatoProducao } from './types';

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
  formato?: FormatoProducao;
}

const DURACAO: Record<PedidoRoteiro['duracao'], string> = {
  curta: 'cerca de 1 minuto (2 cenas)',
  media: 'cerca de 3 minutos (4 a 5 cenas)',
  longa: 'cerca de 6 minutos (7 a 9 cenas)',
};

/** Instruções para a IA: o prompt mestre (formato, frases aceitas, elenco e biblioteca), sem o pedido, que vai como mensagem do usuário. */
export function promptSistema(biblioteca: BibliotecaMestre = coletarBiblioteca(() => [])): string {
  return gerarPromptMestre(biblioteca, { semPedido: true });
}

export function promptGerar(p: PedidoRoteiro): string {
  const nome = (id: string) => ATORES[id]?.nome ?? id;
  const elenco = p.personagens.length
    ? p.personagens.map(nome).join(', ')
    : 'todos os personagens disponíveis, usando só os que fizerem sentido';
  const formato = p.formato ?? 'aula';

  let instrucaoFormato = '';
  if (formato === 'podcast') {
    instrucaoFormato = `FORMATO: Podcast / Mesa Redonda em estúdio de gravação.
- O roteiro DEVE iniciar com as tags:
[cenário: podcast]
[formato: podcast]
[papéis: professor=${nome(p.professor)}, aluno=${nome(p.aluno)}]
- Configuração visual: Os personagens sentam atrás de uma bancada profissional de estúdio com microfones condensadores Shure SM7B com pop filter, fones de ouvido na cabeça e letreiro luminoso "● NO AR | PODCAST".
- Apresentador / Host principal: ${nome(p.professor)}. Convidado / Co-host: ${nome(p.aluno)}.
- Dinâmica: Bate-papo ágil, descontraído e inteligente, com perguntas instigantes, tiradas cômicas e reações expressivas ("Enquanto...", risadas, gestos).
- NÃO USE LOUSA NEM FÓRMULAS: a discussão acontece na bancada de conversa.
- Finalize com considerações finais de ambos e despedida amigável.`;
  } else if (formato === 'telejornal') {
    instrucaoFormato = `FORMATO: Telejornal / Plantão de Notícias / Drops em estúdio de TV.
- O roteiro DEVE iniciar com as tags:
[cenário: telejornal]
[formato: telejornal]
[sem lousa]
[papéis: professor=${nome(p.professor)}, aluno=${nome(p.aluno)}]
- Configuração visual: Apresentadores sentados na bancada de telejornal moderno com videowall mundial LED e tarja de notícias ao vivo.
- Âncora principal: ${nome(p.professor)}. Comentarista / Repórter: ${nome(p.aluno)}.
- Dinâmica: Tom jornalístico envolvente e ágil. Manchetes claras, introdução dos fatos principais, comentário analítico e encerramento direto.
- NÃO USE LOUSA: a transmissão ocorre a partir da bancada com o videowall.`;
  } else if (formato === 'livre') {
    instrucaoFormato = `FORMATO: Esquete Teatral / Animação Livre de Personagens em palco aberto.
- O roteiro DEVE iniciar com as tags:
[sem lousa]
[cenário: neutro]
- Protagonistas: ${nome(p.professor)} e ${nome(p.aluno)}.
- Dinâmica: Foco em atuação física cômica, narrativa animada (entradas correndo, pulos, tropeços, danças, expressões marcantes).
- Aproveite interações entre a família e mascotes (Paraíba o cão, Mingau o gato).
- NÃO USE LOUSA.`;
  } else {
    instrucaoFormato = `FORMATO: Aula Didática Tradicional com Lousa.
- O roteiro DEVE iniciar com:
[papéis: professor=${nome(p.professor)}, aluno=${nome(p.aluno)}]
- Professor: ${nome(p.professor)}. Aluno: ${nome(p.aluno)}.
- Dinâmica: Abertura curiosa, explicação passo a passo na lousa com fórmulas curtas ($...$) ou gráficos, alternando entre [close na lousa] e [plano aberto], com reações engraçadas do aluno e fechamento com dança.`;
  }

  return `Escreva um roteiro sobre: ${p.tema}
Área / Matéria: ${p.materia}. Público / Estilo: ${p.serie}.
Duração pretendida: ${DURACAO[p.duracao]}.
Personagens permitidos: ${elenco}.

${instrucaoFormato}${p.extras?.trim() ? `\n\nPedidos adicionais:\n${p.extras.trim()}` : ''}`;
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
  const ini = t.search(/^\s*(\[pap[eé]is|\[cen[aá]rio|\[formato|\[sem\s+lousa|#\s)/mi);
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
