import { BarraMenu } from '@renderer/components/BarraMenu';
import { EditorLayout } from '@renderer/layouts/EditorLayout';
import { useEditor } from '@renderer/store/editor-store';
import { useMenus } from '@renderer/pages/editor/useMenus';
import { PainelLateral } from '@renderer/pages/editor/PainelLateral';
import { Ferramentas } from '@renderer/features/ferramentas';
import { LinhaDoTempoPanel } from '@renderer/features/linha-do-tempo';
import { useAudioPreview } from '@renderer/features/audio';
import { useReproducao, PalcoPanel } from '@renderer/features/palco';
import { useAtalhos } from './useAtalhos';
import { ImportarPacoteModal, PersonagemModal, EditorSpritesModal, EditorAnimacaoModal } from '@renderer/features/personagens';
import { IaModal } from '@renderer/features/ia';
import { ManualModal } from '@renderer/features/ajuda';
import { EditorImagemModal } from '@renderer/features/editor-imagem';
import { useCargaInicial } from '@renderer/pages/editor/useCargaInicial';
import { RoteiroPanel, useRoteiroDerivado } from '@renderer/features/roteiro';

function BarraStatus() {
  const mensagem = useEditor((s) => s.mensagem);
  const { estado } = useRoteiroDerivado();
  return (
    <footer className="status">
      <span>{estado.eventoAtual ? `▶ ${estado.eventoAtual.rotulo}` : '—'}</span>
      <span className="espaco" />
      <span>{mensagem}</span>
    </footer>
  );
}

/** Tela principal: o editor. Liga a carga inicial, a reprodução e os atalhos, e monta o layout com as features. */
export function EditorPage() {
  const menuAberto = useEditor((s) => s.menuAberto);
  const set = useEditor((s) => s.set);
  const menus = useMenus();
  useCargaInicial();
  useReproducao();
  useAtalhos(menus);
  useAudioPreview();

  return (
    <>
      <EditorLayout
        menu={<BarraMenu menus={menus} aberto={menuAberto} setAberto={(n) => set({ menuAberto: n })} />}
        ferramentas={<Ferramentas />}
        roteiro={<RoteiroPanel />}
        palco={<PalcoPanel />}
        lateral={<PainelLateral />}
        linhaDoTempo={<LinhaDoTempoPanel />}
        status={<BarraStatus />}
      />
      <ImportarPacoteModal />
      <EditorSpritesModal />
      <EditorAnimacaoModal />
      <EditorImagemModal />
      <PersonagemModal />
      <ManualModal />
      <IaModal />
    </>
  );
}







