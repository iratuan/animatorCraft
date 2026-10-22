import { useMemo } from 'react';
import { ATORES, construirTimeline, infoDaImagem, estadoEm, parseRoteiro, detectarConflitosTimeline, type Roteiro, type Timeline } from '@shared/domain';
import { FORMATOS } from '@shared/constants/video';
import { layoutDe, temPose, verificarLousa } from '@renderer/features/cena';
import { useEditor } from '@renderer/store/editor-store';

// cache simples: vários painéis pedem o mesmo roteiro; interpreta uma vez só
let ultimo: { chave: string; texto: string; roteiro: Roteiro; timeline: Timeline } | null = null;
function derivar(texto: string, versao: string) {
  const chave = `${versao}|${texto}`;
  if (ultimo?.chave === chave) return ultimo;
  const roteiro = parseRoteiro(texto);
  ultimo = { chave, texto, roteiro, timeline: construirTimeline(roteiro) };
  return ultimo;
}

export interface RoteiroEstatico {
  roteiro: Roteiro;
  timeline: Timeline;
  dim: { w: number; h: number };
  avisos: string[];
  conflitos: ReturnType<typeof detectarConflitosTimeline>;
}

/**
 * Roteiro estático (baixa frequência): deduções do texto do roteiro, linha do tempo,
 * avisos e dimensões. NÃO subscreve ao tempo `t`, evitando re-renderizar painéis
 * estáticos 60 vezes por segundo durante a reprodução da animação.
 */
export function useRoteiroEstatico(): RoteiroEstatico {
  const texto = useEditor((s) => s.roteiro);
  const formato = useEditor((s) => s.formato);
  const spritesOk = useEditor((s) => s.spritesOk);
  const versaoBib = useEditor((s) => s.versaoBib);
  const versaoPersonagens = useEditor((s) => s.versaoPersonagens);
  const versaoImagens = useEditor((s) => s.versaoImagens);
  const versaoAudio = useEditor((s) => s.versaoAudio); // a duração das falas vem dos áudios importados: importar ou excluir um áudio muda a linha do tempo

  const { roteiro, timeline } = useMemo(
    () => derivar(texto, `${versaoPersonagens}.${versaoBib}.${spritesOk}.${versaoAudio}`),
    [texto, versaoPersonagens, versaoBib, spritesOk, versaoAudio]
  );
  const dim = FORMATOS[formato];

  // o conteúdo escrito em cada cena precisa caber na lousa
  const avisosLousa = useMemo(() => {
    const q = layoutDe(dim.w, dim.h).quadro;
    const finais = timeline.cenas.map((c) => estadoEm(timeline, Math.max(0, c.fim - 0.02)));
    return verificarLousa(finais, q, dim.h > dim.w).map((i) => `Cena ${i + 1} (“${timeline.cenas[i]!.titulo}”): o conteúdo ultrapassa a lousa. Resuma ou divida em outra cena.`);
  }, [timeline, dim.w, dim.h]);

  // "Fulano faz a pose X": avisa quando o personagem não tem esse sprite
  const avisosPoses = useMemo(() => {
    if (!spritesOk) return [];
    const vistos = new Set<string>();
    for (const e of timeline.eventos) {
      if (e.acao.tipo === 'pose' && e.acao.etiqueta && !temPose(e.acao.ator, e.acao.etiqueta)) {
        vistos.add(`${ATORES[e.acao.ator]!.nome} não tem a pose “${e.acao.etiqueta}” (vai ficar parado). Importe um pacote com pose_${e.acao.etiqueta}.png.`);
      }
    }
    return [...vistos];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, spritesOk, versaoBib]);

  // imagens citadas no roteiro que não estão (mais) na biblioteca
  const avisosImagens = useMemo(() => {
    const nomes = new Set<string>();
    for (const e of timeline.eventos) {
      const a = e.acao;
      if (a.tipo === 'escrever' && a.conteudo.tipo === 'imagem' && !infoDaImagem(a.conteudo.arquivo)) nomes.add(a.conteudo.arquivo);
      if (a.tipo === 'remover' && !infoDaImagem(a.arquivo)) nomes.add(a.arquivo);
    }
    return [...nomes].map((n) => `A imagem “${n}” não está na biblioteca (aba Imagens): importe o arquivo com esse nome.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline, versaoImagens]);

  // conflitos da linha do tempo (sobreposição indevida de falas ou movimentos)
  const conflitos = useMemo(() => detectarConflitosTimeline(timeline), [timeline]);
  const avisosConflitos = useMemo(() => conflitos.map((c) => c.mensagem), [conflitos]);

  const avisos = useMemo(
    () => [...roteiro.avisos, ...avisosLousa, ...avisosPoses, ...avisosImagens, ...avisosConflitos],
    [roteiro.avisos, avisosLousa, avisosPoses, avisosImagens, avisosConflitos]
  );

  return { roteiro, timeline, dim, avisos, conflitos };
}

/**
 * Estado dinâmico da cena no instante atual `t` (alta frequência: 60 fps durante reprodução).
 * Subscreve ao tempo `t` do editor e calcula o estado interpolado dos atores, câmera e lousa.
 */
export function useEstadoCena(timelineProp?: Timeline) {
  const t = useEditor((s) => s.t);
  const { timeline: tlEstatica } = useRoteiroEstatico();
  const timeline = timelineProp ?? tlEstatica;
  const estado = useMemo(() => estadoEm(timeline, t), [timeline, t]);
  return { estado, t };
}

/**
 * Tudo que se deduz do texto do roteiro: ações, linha do tempo, estado no instante atual e avisos do editor.
 * Mantido para retrocompatibilidade; componentes estáticos devem usar `useRoteiroEstatico()`.
 */
export function useRoteiroDerivado() {
  const estatico = useRoteiroEstatico();
  const { estado } = useEstadoCena(estatico.timeline);
  return { ...estatico, estado };
}


