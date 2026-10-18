import { ATORES, ORDEM_ATORES } from './characters';
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

/** Regras do formato do roteiro, na forma que o modelo precisa saber. Mantém-se junto do parser: o teste de IA exercita este texto. */
export function promptSistema(): string {
  const elenco = ORDEM_ATORES.map((id) => `- ${ATORES[id]!.nome}${ATORES[id]!.idade ? ` (${ATORES[id]!.idade})` : ''}: ${ATORES[id]!.descricao || 'sem descrição'}`).join('\n');
  return `Você escreve roteiros para o StickBoard, um programa que transforma texto em vídeo de quadro branco com personagens animados, para ensinar ciências, matemática e inglês a crianças e adolescentes, em português do Brasil, com humor leve e relaxado.

Responda APENAS com o roteiro, sem explicações e sem cercas de código.

FORMATO
- Primeira linha: [papéis: professor=NomeDoProfessor, aluno=NomeDoAluno]
- Cada cena começa com uma linha "# Título da cena" e tem um ou dois parágrafos de frases curtas terminadas em ponto.
- Frases que o programa entende (use o nome do personagem ou "Professor"/"Aluno"):
  Fulano entra pela esquerda andando.  |  Fulano entra correndo pela direita.  |  Fulano sai pela direita.
  Fulano diz "texto falado" irritado.  (adjetivos: irritado, confuso, feliz, triste, sarcástico, surpreso, empolgado, entediado, assustado)
  Fulano escreve "texto" no quadro.  |  Fulano escreve $a^2 + b^2 = c^2$ no quadro.  (fórmulas entre $...$)
  Fulano desenha o gráfico de y = x^2 no quadro.  |  Fulano desenha um gráfico de barras: Maçã=5, Banana=8 no quadro.  |  ... gráfico de pizza: Sim=70, Não=30 no quadro.
  Fulano aponta.  |  Fulano faz cara de surpresa.  |  Fulano dança por 4 segundos.  |  Fulano pula.  |  Fulano acena.  |  Fulano cruza os braços.  |  Espera 2 segundos.  |  Apaga o quadro.
  Fulano fica na posição 30%.  |  Fulano anda para a posição 70%.
  [close na lousa]  |  [close no professor]  |  [plano aberto]   (câmera)
- Ações ao mesmo tempo: "Enquanto Professor diz "Oi", Aluno dança por 4 segundos."  |  "Ao mesmo tempo, Erika acena."
- O texto entre aspas nunca contém aspas.
- Cada fala fica em UMA frase com um verbo de fala (diz, grita, pergunta, responde). Depois do fecha-aspas coloque um ponto.
- O que for escrito na lousa deve caber nela: no máximo 4 linhas curtas por cena; use [close na lousa] para mostrar a explicação e [plano aberto] para voltar às reações.

ESTILO
- Humor: o professor é sarcástico e exagerado; o aluno é desastrado e engraçado. Piadas curtas, sem ofender.
- Explique um conceito por cena, com um exemplo do dia a dia. Termine com um resumo no quadro.
- Os personagens reagem (expressões, poses, danças) em vez de só falar.

PERSONAGENS DISPONÍVEIS
${elenco}`;
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
export async function gerarRoteiro(pedir: PedirIA, primeiraMensagem: string, tentativas = 2): Promise<{ roteiro: string; avisosFinais: string[]; rodadas: number }> {
  const sistema = promptSistema();
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
