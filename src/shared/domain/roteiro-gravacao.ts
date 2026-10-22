import type { ActorId } from './characters';
import { ATORES } from './characters';
import type { Timeline } from './timeline';

export interface LinhaGravacao {
  tempoInicio: number;
  tempoFim: number;
  cena: number;
  cenaTitulo: string;
  atorId: ActorId;
  atorNome: string;
  texto: string;
  expressao?: string;
  tom?: string;
  audioArquivo?: string;
}

export interface RelatorioGravacao {
  totalFalas: number;
  tempoTotalFalas: number;
  linhas: LinhaGravacao[];
  porPersonagem: Record<string, {
    atorId: ActorId;
    atorNome: string;
    totalFalas: number;
    tempoEstimado: number;
    linhas: LinhaGravacao[];
  }>;
}

const formataTempo = (s: number) => {
  const min = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}.${ms}`;
};

/**
 * Gera o relatório estruturado de gravação de falas a partir da Timeline compilada.
 */
export function extrairRelatorioGravacao(timeline: Timeline): RelatorioGravacao {
  const linhas: LinhaGravacao[] = [];
  const porPersonagem: RelatorioGravacao['porPersonagem'] = {};

  for (const ev of timeline.eventos) {
    if (ev.acao.tipo !== 'fala') continue;

    const atorId = ev.acao.ator;
    const atorNome = ATORES[atorId]?.nome ?? atorId;
    const cenaInfo = timeline.cenas[ev.cena] ?? { titulo: `Cena ${ev.cena + 1}` };

    // Procura expressao ou pose associada ao mesmo ator próxima a este momento
    let expressaoEncontrada: string | undefined;
    for (const outro of timeline.eventos) {
      if (outro.inicio <= ev.inicio && outro.fim >= ev.inicio) {
        if (outro.acao.tipo === 'expressao' && outro.acao.ator === atorId) {
          expressaoEncontrada = outro.acao.expressao;
        }
      }
    }

    const linha: LinhaGravacao = {
      tempoInicio: ev.inicio,
      tempoFim: ev.fim,
      cena: ev.cena + 1,
      cenaTitulo: cenaInfo.titulo,
      atorId,
      atorNome,
      texto: ev.acao.texto,
      expressao: expressaoEncontrada,
      audioArquivo: ev.acao.audio,
    };

    linhas.push(linha);

    if (!porPersonagem[atorId]) {
      porPersonagem[atorId] = {
        atorId,
        atorNome,
        totalFalas: 0,
        tempoEstimado: 0,
        linhas: [],
      };
    }

    const dur = Math.max(0, ev.fim - ev.inicio);
    porPersonagem[atorId].totalFalas += 1;
    porPersonagem[atorId].tempoEstimado += dur;
    porPersonagem[atorId].linhas.push(linha);
  }

  const tempoTotalFalas = linhas.reduce((acc, l) => acc + (l.tempoFim - l.tempoInicio), 0);

  return {
    totalFalas: linhas.length,
    tempoTotalFalas,
    linhas,
    porPersonagem,
  };
}

/**
 * Converte o relatório de gravação em documento Markdown legível para atores e diretores.
 */
export function gerarRoteiroGravacaoMarkdown(timeline: Timeline, tituloProjeto: string = 'Projeto'): string {
  const relatorio = extrairRelatorioGravacao(timeline);
  const out: string[] = [];

  out.push(`# Roteiro de Gravação de Voz — ${tituloProjeto}`);
  out.push(`\n**Total de Falas:** ${relatorio.totalFalas} | **Tempo Estimado de Fala:** ${formataTempo(relatorio.tempoTotalFalas)}\n`);

  out.push('## Resumo por Personagem\n');
  out.push('| Personagem | Quantidade de Falas | Tempo Estimado |');
  out.push('|---|---|---|');
  for (const p of Object.values(relatorio.porPersonagem)) {
    out.push(`| **${p.atorNome}** | ${p.totalFalas} | ${formataTempo(p.tempoEstimado)} |`);
  }
  out.push('\n---\n');

  out.push('## Guia de Gravação (Cronológico por Cena)\n');
  let cenaAtual = -1;
  for (const l of relatorio.linhas) {
    if (l.cena !== cenaAtual) {
      cenaAtual = l.cena;
      out.push(`\n### ${l.cenaTitulo}\n`);
    }
    const indicacao = [
      l.expressao ? `expressão: ${l.expressao}` : '',
      l.tom ? `tom: ${l.tom}` : '',
      l.audioArquivo ? `áudio ref: ${l.audioArquivo}` : '',
    ].filter(Boolean).join(' | ');

    out.push(`- **[${formataTempo(l.tempoInicio)} - ${formataTempo(l.tempoFim)}] ${l.atorNome}:** "${l.texto}"${indicacao ? ` *(${indicacao})*` : ''}`);
  }

  out.push('\n---\n');
  out.push('## Falas Agrupadas por Personagem (Para Sessão Individual)\n');
  for (const p of Object.values(relatorio.porPersonagem)) {
    out.push(`\n### 🎙️ ${p.atorNome} (${p.totalFalas} falas, ~${formataTempo(p.tempoEstimado)})\n`);
    for (const l of p.linhas) {
      const contexto = [
        `Cena ${l.cena}`,
        l.expressao ? `expressão: ${l.expressao}` : '',
        l.tom ? `tom: ${l.tom}` : '',
      ].filter(Boolean).join(' | ');
      out.push(`1. **[${formataTempo(l.tempoInicio)}]** "${l.texto}"  \n   *Contexto: ${contexto}*`);
    }
  }

  return out.join('\n');
}
