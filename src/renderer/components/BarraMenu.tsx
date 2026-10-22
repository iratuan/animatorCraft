import { useState } from 'react';
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

  const fecharTudo = () => {
    setAberto(null);
    setSubAberto(null);
  };

  return (
    <div className="menubar" onMouseLeave={fecharTudo}>
      <div className="logo" title={`Projeto: ${nomeProjeto}${modificado ? ' (não salvo)' : ''}`}>
        ▶ StickBoard — {nomeProjeto}{modificado ? ' *' : ''}
      </div>
      {menus.map((m) => (
        <div
          key={m.nome}
          className={`menu ${aberto === m.nome ? 'on' : ''}`}
          onMouseEnter={() => {
            if (aberto) {
              setAberto(m.nome);
              setSubAberto(null);
            }
          }}
        >
          <button
            onClick={() => {
              setAberto(aberto === m.nome ? null : m.nome);
              setSubAberto(null);
            }}
          >
            {m.nome}
          </button>
          {aberto === m.nome && (
            <div className="dropdown">
              {m.itens.map((i, k) => {
                if (i.separador) return <hr key={k} />;
                if (i.itens && i.itens.length > 0) {
                  const subId = `${m.nome}-${k}`;
                  const isSubOpen = subAberto === subId;
                  return (
                    <div
                      key={k}
                      className={`item-com-submenu ${isSubOpen ? 'sub-on' : ''}`}
                      onMouseEnter={() => setSubAberto(subId)}
                    >
                      <button
                        type="button"
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
                        <span className="seta-sub">▸</span>
                      </button>
                      {isSubOpen && (
                        <div className="submenu">
                          {i.itens.map((subItem, subKey) =>
                            subItem.separador ? (
                              <hr key={subKey} />
                            ) : (
                              <button
                                key={subKey}
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
