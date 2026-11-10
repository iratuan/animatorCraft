import { useLayoutEffect, useRef, useState } from 'react';
import { Icones } from '@renderer/components/Icones';
import type { GrupoMenu, ItemMenu } from '@renderer/components/BarraMenu';

type ItemBarra = ItemMenu & { barra: { grupo: number; rotulo: string } };

/**
 * Barra de ferramentas do topo: os itens dos menus marcados com `barra` (início, projeto, desfazer, personagens, IA, exportar, ajuda).
 * Vem dos próprios menus, então botão e menu nunca divergem.
 */
function extrairItens(itens: ItemMenu[]): ItemBarra[] {
  const achados: ItemBarra[] = [];
  for (const i of itens) {
    if (i.barra && i.acao) achados.push(i as ItemBarra);
    if (i.itens) achados.push(...extrairItens(i.itens));
  }
  return achados;
}

const chaveDo = (i: ItemBarra) => `${i.barra.grupo}:${i.rotulo}`;
/** espaço reservado para o botão "Mais" e a folga entre os botões */
const RESERVA_MAIS = 64;
/** largura usada para um botão que ainda não foi medido (aparece só na primeira vez que a barra estreita) */
const LARGURA_PADRAO = 110;

/**
 * Botões que não cabem na largura da janela vão para um menu "Mais" em vez de sumir.
 * Mede os botões na tela e guarda a largura dos que já foram vistos, para decidir o que cabe mesmo quando eles estão escondidos.
 */
export function BarraSuperior({ menus }: { menus: GrupoMenu[] }) {
  const todos = extrairItens(menus.flatMap((m) => m.itens)).sort((a, b) => a.barra.grupo - b.barra.grupo);
  const grupos = [...new Set(todos.map((i) => i.barra.grupo))];
  const ref = useRef<HTMLDivElement>(null);
  const larguras = useRef(new Map<string, number>());
  const [visiveis, setVisiveis] = useState(todos.length);
  const [maisAberto, setMaisAberto] = useState(false);
  const [posMais, setPosMais] = useState({ x: 0, y: 0 });
  const botaoMais = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ajustar = () => {
      el.querySelectorAll<HTMLElement>('[data-item]').forEach((b) => larguras.current.set(b.dataset.item!, b.offsetWidth));
      const disponivel = el.clientWidth - RESERVA_MAIS;
      let soma = 0;
      let n = 0;
      for (const i of todos) {
        soma += larguras.current.get(chaveDo(i)) ?? LARGURA_PADRAO;
        if (soma > disponivel) break;
        n++;
      }
      setVisiveis(n);
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(el);
    return () => observador.disconnect();
  }, [todos.length]);

  // a estimativa acima ignora espaçamentos: esta verificação usa o layout real e tira um botão por vez até caber.
  // Roda antes da pintura, então não aparece piscando.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && visiveis > 0 && el.scrollWidth > el.clientWidth + 1) setVisiveis(visiveis - 1);
  });

  const visivelSet = new Set(todos.slice(0, visiveis).map(chaveDo));
  const ocultos = todos.filter((i) => !visivelSet.has(chaveDo(i)));

  // o menu "Mais" fecha ao clicar fora ou com Esc
  useLayoutEffect(() => {
    if (!maisAberto) return;
    const fora = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.barra-mais')) setMaisAberto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMaisAberto(false); botaoMais.current?.focus(); } };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', tecla); };
  }, [maisAberto]);

  const abrirMais = () => {
    const r = botaoMais.current?.getBoundingClientRect();
    // ancorado pela direita: o botão fica no canto, e o menu não pode sair da janela
    if (r) setPosMais({ x: window.innerWidth - r.right, y: r.bottom + 4 });
    setMaisAberto((v) => !v);
  };

  return (
    <div className="barra-superior" role="toolbar" aria-label="Ferramentas gerais" ref={ref}>
      {grupos.map((g) => {
        const deste = todos.filter((i) => i.barra.grupo === g && visivelSet.has(chaveDo(i)));
        if (!deste.length) return null;
        return (
          <div key={g} className="grupo-barra">
            {deste.map((i) => (
              <button key={chaveDo(i)} data-item={chaveDo(i)} disabled={i.desativado} onClick={i.acao} title={`${i.rotulo}${i.atalho ? ` (${i.atalho})` : ''}`} aria-label={i.rotulo} data-barra={i.barra.rotulo}>
                {i.icone ? Icones[i.icone] : null}<span>{i.barra.rotulo}</span>
              </button>
            ))}
          </div>
        );
      })}
      {ocultos.length > 0 && (
        <div className="barra-mais">
          <button ref={botaoMais} type="button" aria-haspopup="menu" aria-expanded={maisAberto} onClick={abrirMais} title="Mais ferramentas">
            ⋯ <span>Mais</span>
          </button>
          {maisAberto && (
            <div className="barra-mais-menu" role="menu" style={{ right: posMais.x, top: posMais.y }}>
              {ocultos.map((i) => (
                <button key={chaveDo(i)} type="button" role="menuitem" disabled={i.desativado} onClick={() => { setMaisAberto(false); i.acao?.(); }}>
                  {i.icone ? Icones[i.icone] : null}<span>{i.rotulo}</span>
                  {i.atalho && <kbd>{i.atalho}</kbd>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
