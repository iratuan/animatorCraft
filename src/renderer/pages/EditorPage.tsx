import { BarraMenu } from '@renderer/components/BarraMenu';
import { EditorLayout } from '@renderer/layouts/EditorLayout';
import { useEditor } from '@renderer/store/editor-store';
import { useMenus } from '@renderer/features/arquivos/hooks/useMenus';
import { PainelLateral } from '@renderer/features/biblioteca/components/PainelLateral';
import { Ferramentas } from '@renderer/features/ferramentas/components/Ferramentas';
import { LinhaDoTempoPanel } from '@renderer/features/linha-do-tempo/components/LinhaDoTempoPanel';
import { useAtalhos, useReproducao } from '@renderer/features/palco/hooks/useReproducao';
import { PalcoPanel } from '@renderer/features/palco/components/PalcoPanel';
import { ImportarPacoteModal } from '@renderer/features/pacotes-sprites/components/ImportarPacoteModal';
import { PersonagemModal } from '@renderer/features/personagens/components/PersonagemModal';
import { ManualModal } from '@renderer/features/ajuda/components/ManualModal';
import { EditorPersonagemModal } from '@renderer/features/pacotes-sprites/components/EditorPersonagemModal';
import { useCargaInicial } from '@renderer/features/pacotes-sprites/hooks/useCargaInicial';
import { RoteiroPanel } from '@renderer/features/roteiro/components/RoteiroPanel';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';

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
  useAtalhos();

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
      <EditorPersonagemModal />
      <PersonagemModal />
      <ManualModal />
    </>
  );
}



