import { BarraMenu } from '@renderer/components/BarraMenu';
import { BarraSuperior } from '@renderer/components/BarraSuperior';
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
import { EditorImagemModal } from '@renderer/features/editor-imagem';
import { useCargaInicial } from '@renderer/pages/editor/useCargaInicial';
import { RoteiroPanel, useRoteiroDerivado } from '@renderer/features/roteiro';
import { EditorMatematicaModal } from '@renderer/features/matematica';
import { ConfirmarFecharProjetoModal } from '@renderer/features/projeto';
import { prepararPersonagens } from '@renderer/bootstrap';

// os personagens criados pelo usuário precisam existir antes da primeira interpretação do roteiro
prepararPersonagens();
if (new URLSearchParams(location.search).has('teste')) void import('./gancho-teste');

function BarraStatus() {
  const mensagem = useEditor((s) => s.mensagem);
  const t = useEditor((s) => s.t);
  const formato = useEditor((s) => s.formato);
  const nomeProjeto = useEditor((s) => s.nomeProjeto);
  const modificado = useEditor((s) => s.modificado);
  const { estado, timeline, conflitos } = useRoteiroDerivado();

  const cenaAtual = timeline.cenas.findIndex((c) => t >= c.inicio && t <= c.fim);
  const cenaNome = cenaAtual >= 0 ? `${cenaAtual + 1}/${timeline.cenas.length}: ${timeline.cenas[cenaAtual]!.titulo}` : 'Cena 1';

  return (
    <footer className="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', fontSize: '0.85em', userSelect: 'none' }}>
      <span title="Evento ativo no instante atual">{estado.eventoAtual ? `▶ ${estado.eventoAtual.rotulo}` : '—'}</span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span title="Tempo de reprodução">{t.toFixed(1)}s / {timeline.duracao.toFixed(1)}s</span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span title="Cena atual">{cenaNome}</span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span title="Formato do vídeo">{formato === '16:9' ? 'YouTube 16:9' : 'Vertical 9:16'}</span>
      {conflitos.length > 0 && (
        <>
          <span style={{ opacity: 0.6 }}>|</span>
          <span style={{ color: '#ef4444', fontWeight: 'bold' }} title={conflitos.map((c) => c.mensagem).join('\n')}>
            ⚠ {conflitos.length} conflito(s)
          </span>
        </>
      )}
      <span className="espaco" style={{ flex: 1 }} />
      <span title={modificado ? 'Projeto contém alterações não salvas' : 'Projeto salvo'}>
        {nomeProjeto}{modificado ? ' (não salvo)' : ''}
      </span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span style={{ opacity: 0.9 }}>{mensagem}</span>
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
        barra={<BarraSuperior menus={menus} />}
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
      <IaModal />
      <EditorMatematicaModal />
      <ConfirmarFecharProjetoModal />
    </>
  );
}







