import { useEffect, useRef, useState } from 'react';
import { Icones, type NomeIcone } from '@renderer/components/Icones';
import { useEditor } from '@renderer/store/editor-store';

/** `icone`: aparece no menu. `barra`: o item também entra na barra de ferramentas do topo (grupo = bloco de botões; rotulo = texto curto ao lado do ícone). */
export interface ItemMenu {
  rotulo: string;
  atalho?: string;
  acao?: () => void;
  desativado?: boolean;
  separador?: boolean;
  icone?: NomeIcone;
  barra?: { grupo: number; rotulo: string };
  itens?: ItemMenu[];
}

export interface GrupoMenu {
  nome: string;
  itens: ItemMenu[];
}

/**
 * Barra de menus. Funciona com mouse (passar o ponteiro abre) e com teclado, no padrão de barra de menus:
 *  - setas ←/→ mudam de menu; ↓, Enter, Espaço ou ↑ abrem o menu e levam ao primeiro item;
 *  - ↑/↓ percorrem os itens; → abre o submenu; ← volta do submenu; Home/End vão ao primeiro e ao último;
 *  - Enter/Espaço executam; Esc fecha o nível atual e devolve o foco ao gatilho; Tab fecha o menu.
 */
export function BarraMenu({
  menus,
  aberto,
  setAberto,
}: {
  menus: GrupoMenu[];
  aberto: string | null;
  setAberto: (n: string | null) => void;
}) {
  const nomeProjeto = useEditor((s) => s.nomeProjeto);
  const modificado = useEditor((s) => s.modificado);
  const [subAberto, setSubAberto] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  // depois de abrir pelo teclado, o foco vai para o primeiro item (ou o primeiro do submenu)
  const focarAoAbrir = useRef<'menu' | 'submenu' | null>(null);

  const fecharTudo = () => {
    setAberto(null);
    setSubAberto(null);
  };

  useEffect(() => {
    if (!focarAoAbrir.current) return;
    const alvo = focarAoAbrir.current === 'submenu' ? '.submenu [role="menuitem"]:not(:disabled)' : '.dropdown > [role="menuitem"]:not(:disabled), .dropdown > .item-com-submenu > [role="menuitem"]:not(:disabled)';
    focarAoAbrir.current = null;
    requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>(alvo)?.focus());
  }, [aberto, subAberto]);

  /** Itens que o foco percorre no nível atual (menu aberto ou submenu aberto). */
  const itensDoNivel = (dentroDoSub: boolean): HTMLElement[] => {
    if (!raiz.current) return [];
    const seletor = dentroDoSub
      ? '.submenu [role="menuitem"]:not(:disabled)'
      : '.dropdown > [role="menuitem"]:not(:disabled), .dropdown > .item-com-submenu > [role="menuitem"]:not(:disabled)';
    return [...raiz.current.querySelectorAll<HTMLElement>(seletor)];
  };

  const teclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const alvo = e.target as HTMLElement;
    const topo = alvo.dataset.topo;
    const dentroDoSub = !!alvo.closest('.submenu');
    const dentroDoMenu = !!alvo.closest('.dropdown');

    // gatilhos da barra
    if (topo !== undefined) {
      const topos = [...(raiz.current?.querySelectorAll<HTMLElement>('[data-topo]') ?? [])];
      const i = topos.indexOf(alvo);
      const irPara = (j: number) => { const outro = topos[(j + topos.length) % topos.length]!; outro.focus(); if (aberto) { setAberto(outro.dataset.topo!); setSubAberto(null); focarAoAbrir.current = 'menu'; } };
      if (e.key === 'ArrowRight') { e.preventDefault(); irPara(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(i - 1); }
      else if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        setAberto(topo);
        setSubAberto(null);
        focarAoAbrir.current = 'menu';
      } else if (e.key === 'Escape' && aberto) { e.preventDefault(); fecharTudo(); }
      else if (e.key === 'Tab') { fecharTudo(); }
      return;
    }

    if (!dentroDoMenu) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (dentroDoSub) {
        const gatilho = raiz.current?.querySelector<HTMLElement>('.item-com-submenu.sub-on > [role="menuitem"]');
        setSubAberto(null);
        requestAnimationFrame(() => gatilho?.focus());
      } else {
        const nome = aberto;
        fecharTudo();
        requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>(`[data-topo="${nome}"]`)?.focus());
      }
      return;
    }
    if (e.key === 'Tab') { fecharTudo(); return; }

    const lista = itensDoNivel(dentroDoSub);
    const i = lista.indexOf(alvo);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!lista.length) return;
      const j = e.key === 'ArrowDown' ? (i + 1) % lista.length : (i - 1 + lista.length) % lista.length;
      lista[j]!.focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      lista[e.key === 'Home' ? 0 : lista.length - 1]?.focus();
    } else if (e.key === 'ArrowRight' && !dentroDoSub && alvo.parentElement?.classList.contains('item-com-submenu')) {
      e.preventDefault();
      setSubAberto(alvo.parentElement.dataset.sub ?? null);
      focarAoAbrir.current = 'submenu';
    } else if (e.key === 'ArrowLeft' && dentroDoSub) {
      e.preventDefault();
      const gatilho = raiz.current?.querySelector<HTMLElement>('.item-com-submenu.sub-on > [role="menuitem"]');
      setSubAberto(null);
      requestAnimationFrame(() => gatilho?.focus());
    }
  };

  return (
    <div className="menubar" role="menubar" aria-label="Menu principal" ref={raiz} onKeyDown={teclar} onMouseLeave={fecharTudo}>
      <div className="logo" title={`Projeto: ${nomeProjeto}${modificado ? ' (não salvo)' : ''}`}>
        ▶ StickBoard — {nomeProjeto}{modificado ? ' *' : ''}
      </div>
      {menus.map((m) => (
        <div
          key={m.nome}
          role="none"
          className={`menu ${aberto === m.nome ? 'on' : ''}`}
          onMouseEnter={() => {
            if (aberto) {
              setAberto(m.nome);
              setSubAberto(null);
            }
          }}
        >
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={aberto === m.nome}
            data-topo={m.nome}
            onClick={() => {
              setAberto(aberto === m.nome ? null : m.nome);
              setSubAberto(null);
            }}
          >
            {m.nome}
          </button>
          {aberto === m.nome && (
            <div className="dropdown" role="menu" aria-label={m.nome}>
              {m.itens.map((i, k) => {
                if (i.separador) return <hr key={k} role="separator" />;
                if (i.itens && i.itens.length > 0) {
                  const subId = `${m.nome}-${k}`;
                  const isSubOpen = subAberto === subId;
                  return (
                    <div
                      key={k}
                      data-sub={subId}
                      role="none"
                      className={`item-com-submenu ${isSubOpen ? 'sub-on' : ''}`}
                      onMouseEnter={() => setSubAberto(subId)}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        aria-haspopup="menu"
                        aria-expanded={isSubOpen}
                        disabled={i.desativado}
                        title={i.rotulo}
                        className="botao-item-sub"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubAberto(isSubOpen ? null : subId);
                        }}
                      >
                        <span className="mi">{i.icone ? Icones[i.icone] : null}</span>
                        <span className="mr">{i.rotulo}</span>
                        <span className="seta-sub" aria-hidden="true">▸</span>
                      </button>
                      {isSubOpen && (
                        <div className="submenu" role="menu" aria-label={i.rotulo}>
                          {i.itens.map((subItem, subKey) =>
                            subItem.separador ? (
                              <hr key={subKey} role="separator" />
                            ) : (
                              <button
                                key={subKey}
                                type="button"
                                role="menuitem"
                                disabled={subItem.desativado}
                                title={
                                  subItem.atalho
                                    ? `${subItem.rotulo} (${subItem.atalho})`
                                    : subItem.rotulo
                                }
                                onClick={() => {
                                  fecharTudo();
                                  subItem.acao?.();
                                }}
                              >
                                <span className="mi">
                                  {subItem.icone ? Icones[subItem.icone] : null}
                                </span>
                                <span className="mr">{subItem.rotulo}</span>
                                <kbd>{subItem.atalho}</kbd>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <button
                    key={k}
                    type="button"
                    role="menuitem"
                    disabled={i.desativado}
                    title={i.atalho ? `${i.rotulo} (${i.atalho})` : i.rotulo}
                    onClick={() => {
                      fecharTudo();
                      i.acao?.();
                    }}
                  >
                    <span className="mi">{i.icone ? Icones[i.icone] : null}</span>
                    <span className="mr">{i.rotulo}</span>
                    <kbd>{i.atalho}</kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div className="menubar-projeto-ativo">
        <span
          className={`projeto-badge ${modificado ? 'nao-salvo' : ''}`}
          title={modificado ? 'Projeto ativo (contém alterações não salvas)' : 'Projeto ativo (salvo)'}
          data-teste="badge-projeto-ativo"
        >
          {nomeProjeto || 'Sem título'}{modificado ? ' *' : ''}
        </span>
        <button
          type="button"
          className="botao-fechar-projeto"
          onClick={() => {
            const fecharItem = menus
              .flatMap((m) => m.itens)
              .flatMap((i) => (i.itens ? [i, ...i.itens] : [i]))
              .find((i) => i.rotulo === 'Fechar projeto');
            if (fecharItem?.acao) {
              fecharItem.acao();
            } else {
              const { modificado: mod, fecharProjeto } = useEditor.getState();
              if (!mod) {
                fecharProjeto();
                window.location.hash = '#/';
              } else {
                useEditor.setState({ confirmarFecharProjetoAberto: true });
              }
            }
          }}
          title="Fechar projeto atual (Ctrl+W)"
          aria-label="Fechar projeto atual"
          data-teste="btn-fechar-projeto-menubar"
        >
          {Icones.fechar}
        </button>
      </div>
    </div>
  );
}
