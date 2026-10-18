import { useMemo } from 'react';
import { ATORES, construirTimeline, infoDaImagem, estadoEm, parseRoteiro, type Roteiro, type Timeline } from '@shared/domain';
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

/** Tudo que se deduz do texto do roteiro: ações, linha do tempo, estado no instante atual e avisos do editor. */
export function useRoteiroDerivado() {
  const texto = useEditor((s) => s.roteiro);
  const t = useEditor((s) => s.t);
  const formato = useEditor((s) => s.formato);
  const spritesOk = useEditor((s) => s.spritesOk);
  const versaoBib = useEditor((s) => s.versaoBib);
  const versaoPersonagens = useEditor((s) => s.versaoPersonagens);
  const versaoImagens = useEditor((s) => s.versaoImagens);

  const { roteiro, timeline } = useMemo(() => derivar(texto, `${versaoPersonagens}.${versaoBib}.${spritesOk}`), [texto, versaoPersonagens, versaoBib, spritesOk]);
  const estado = useMemo(() => estadoEm(timeline, t), [timeline, t]);
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

  const avisos = [...roteiro.avisos, ...avisosLousa, ...avisosPoses, ...avisosImagens];
  return { roteiro, timeline, estado, dim, avisos };
}


