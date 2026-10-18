import { useEditor } from '@renderer/store/editor-store';
import { type Skin } from '@renderer/features/cena';
import { gravarSkins } from '../services/cadastro';

/** Skin (stickman ou chibi) de um personagem e do padrão geral. */
export function useSkins() {
  const padrao = useEditor((s) => s.skinPadrao);
  const porPersonagem = useEditor((s) => s.skins);
  const set = useEditor((s) => s.set);
  const nova = useEditor((s) => s.novaVersaoBib);
  const aplicar = (p: Skin, m: Record<string, Skin>) => { gravarSkins({ padrao: p, porPersonagem: m }); set({ skinPadrao: p, skins: m }); nova(); };
  return {
    padrao,
    de: (id: string): Skin => porPersonagem[id] ?? padrao,
    definirPadrao: (s: Skin) => aplicar(s, {}),
    definir: (id: string, s: Skin) => aplicar(padrao, { ...porPersonagem, [id]: s }),
  };
}

export function SeletorSkin({ valor, aoEscolher }: { valor: Skin; aoEscolher: (s: Skin) => void }) {
  return (
    <span className="skin-seletor" role="group" aria-label="Estilo do personagem">
      <button className={valor === 'chibi' ? 'on' : ''} onClick={() => aoEscolher('chibi')} title="Sprites desenhados (chibi)">Chibi</button>
      <button className={valor === 'stickman' ? 'on' : ''} onClick={() => aoEscolher('stickman')} title="Boneco de palito de traço fino">Stickman</button>
    </span>
  );
}
