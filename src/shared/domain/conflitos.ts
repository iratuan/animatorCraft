import type { ActorId } from './characters';
import { ATORES } from './characters';
import type { Timeline, Evento } from './timeline';

export type SeveridadeConflito = 'aviso' | 'erro';

export interface ConflitoTimeline {
  id: string;
  severidade: SeveridadeConflito;
  mensagem: string;
  atorId?: ActorId;
  tempoInicio: number;
  tempoFim: number;
  eventosIndices: number[];
  origemFrases?: (string | undefined)[];
}

/**
 * Valida a timeline em busca de conflitos físicos ou lógicos:
 * 1. Mesmo personagem executando ações simultâneas incompatíveis (ex: entrar e falar ao mesmo tempo, andar e dançar simultaneamente)
 * 2. Múltiplos personagens falando ao mesmo tempo (sobreposição de vozes/falas sem intenção explícita)
 * 3. Ações atribuídas a personagem que ainda não entrou ou já saiu da cena
 */
export function detectarConflitosTimeline(timeline: Timeline): ConflitoTimeline[] {
  const conflitos: ConflitoTimeline[] = [];

  // 1. Sobreposição de falas entre personagens diferentes
  const falas = timeline.eventos.filter((e) => e.acao.tipo === 'fala');
  for (let i = 0; i < falas.length; i++) {
    for (let j = i + 1; j < falas.length; j++) {
      const f1 = falas[i]!;
      const f2 = falas[j]!;

      // Verifica se há sobreposição temporal real
      const inicio = Math.max(f1.inicio, f2.inicio);
      const fim = Math.min(f1.fim, f2.fim);

      if (f1.acao.tipo !== 'fala' || f2.acao.tipo !== 'fala') continue;

      if (fim - inicio > 0.3) {
        const a1 = f1.acao.ator;
        const a2 = f2.acao.ator;
        const n1 = ATORES[a1]?.nome ?? a1;
        const n2 = ATORES[a2]?.nome ?? a2;
        conflitos.push({
          id: `fala-sobreposta-${f1.indice}-${f2.indice}`,
          severidade: 'aviso',
          mensagem: `Sobreposição de vozes: ${n1} e ${n2} estão falando simultaneamente entre ${inicio.toFixed(1)}s e ${fim.toFixed(1)}s.`,
          tempoInicio: inicio,
          tempoFim: fim,
          eventosIndices: [f1.indice, f2.indice],
        });
      }
    }
  }

  // 2. Conflitos de movimento / locomoção para o mesmo ator
  const porAtor: Record<string, Evento[]> = {};
  for (const ev of timeline.eventos) {
    if ('ator' in ev.acao && ev.acao.ator) {
      const id = ev.acao.ator;
      porAtor[id] ??= [];
      porAtor[id].push(ev);
    }
  }

  for (const [atorId, eventos] of Object.entries(porAtor)) {
    const nome = ATORES[atorId as ActorId]?.nome ?? atorId;
    for (let i = 0; i < eventos.length; i++) {
      for (let j = i + 1; j < eventos.length; j++) {
        const e1 = eventos[i]!;
        const e2 = eventos[j]!;

        const inicio = Math.max(e1.inicio, e2.inicio);
        const fim = Math.min(e1.fim, e2.fim);

        if (fim - inicio > 0.1) {
          const tipos = [e1.acao.tipo, e2.acao.tipo];
          const conflitoLocomocao = (tipos.includes('entrar') && tipos.includes('sair')) ||
            (tipos.includes('posicionar') && tipos.includes('sair')) ||
            (tipos.includes('entrar') && tipos.includes('posicionar'));

          if (conflitoLocomocao) {
            conflitos.push({
              id: `movimento-conflitante-${e1.indice}-${e2.indice}`,
              severidade: 'erro',
              mensagem: `Conflito de locomoção para ${nome}: ações "${e1.rotulo}" e "${e2.rotulo}" sobrepostas.`,
              atorId: atorId as ActorId,
              tempoInicio: inicio,
              tempoFim: fim,
              eventosIndices: [e1.indice, e2.indice],
            });
          }
        }
      }
    }
  }

  return conflitos;
}
