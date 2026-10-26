import { useEffect } from 'react';
import { desfazer, refazer, useEditor } from '@renderer/store/editor-store';
import { useRoteiroEstatico } from '@renderer/features/roteiro';
import type { GrupoMenu, ItemMenu } from '@renderer/components/BarraMenu';

const emCampoDeTexto = (alvo: EventTarget | null) => alvo instanceof HTMLTextAreaElement || alvo instanceof HTMLInputElement || alvo instanceof HTMLSelectElement;

function extrairTodosItens(itens: ItemMenu[]): ItemMenu[] {
  const lista: ItemMenu[] = [];
  for (const i of itens) {
    lista.push(i);
    if (i.itens) lista.push(...extrairTodosItens(i.itens));
  }
  return lista;
}

/**
 * Atalhos globais do editor: Ctrl+Z / Ctrl+Y (roteiro), F1 (manual), Espaço (tocar/pausar) e todo "Ctrl+Letra" que um item de menu anuncia (ex.: Ctrl+S, Ctrl+W).
 * Com uma janela (modal) aberta as teclas são dela: o editor de imagem usa Espaço e Ctrl+Z para o desenho, por exemplo.
 */
export function useAtalhos(menus: GrupoMenu[]) {
  const { timeline } = useRoteiroEstatico();
  useEffect(() => {
    const todosItens = extrairTodosItens(menus.flatMap((g) => g.itens));
    const tecla = (e: KeyboardEvent) => {
      const st = useEditor.getState();
      if (e.key === 'F1') { e.preventDefault(); st.set({ manualAberto: true }); return; }
      if (e.key === 'Escape' && st.manualAberto) { st.set({ manualAberto: false }); return; }
      if (st.editorImagem || st.iaAberta || st.promptMestreAberto || st.fichaPersonagem || st.editorPersonagem || st.manualAberto || st.confirmarFecharProjetoAberto) return;
      const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (ctrl && !e.shiftKey && k === 'z') { if (desfazer()) { e.preventDefault(); st.set({ mensagem: 'Desfeito.' }); } return; }
      if (ctrl && (k === 'y' || (e.shiftKey && k === 'z'))) { if (refazer()) { e.preventDefault(); st.set({ mensagem: 'Refeito.' }); } return; }
      if (ctrl && !e.shiftKey && !e.altKey) {
        const item = todosItens.find((i) => i.atalho?.toLowerCase() === `ctrl+${k}` && i.acao);
        if (item) { e.preventDefault(); item.acao!(); return; }
      }
      if (e.code === 'Space' && !emCampoDeTexto(e.target)) { e.preventDefault(); st.alternarReproducao(timeline.duracao); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [timeline.duracao, menus]);
}
