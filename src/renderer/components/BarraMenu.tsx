import { Icones, type NomeIcone } from '@renderer/components/Icones';

/** \icone\: aparece no menu. \arra\: o item também entra na barra de ferramentas do topo (grupo = bloco de botões; rotulo = texto curto ao lado do ícone). */
export interface ItemMenu { rotulo: string; atalho?: string; acao?: () => void; desativado?: boolean; separador?: boolean; icone?: NomeIcone; barra?: { grupo: number; rotulo: string } }
export interface GrupoMenu { nome: string; itens: ItemMenu[] }

export function BarraMenu({ menus, aberto, setAberto }: { menus: GrupoMenu[]; aberto: string | null; setAberto: (n: string | null) => void }) {
  return (
    <div className="menubar" onMouseLeave={() => setAberto(null)}>
      <div className="logo">▶ StickBoard</div>
      {menus.map((m) => (
        <div key={m.nome} className={`menu ${aberto === m.nome ? 'on' : ''}`} onMouseEnter={() => aberto && setAberto(m.nome)}>
          <button onClick={() => setAberto(aberto === m.nome ? null : m.nome)}>{m.nome}</button>
          {aberto === m.nome && (
            <div className="dropdown">
              {m.itens.map((i, k) =>
                i.separador ? <hr key={k} /> : (
                  <button key={k} disabled={i.desativado} onClick={() => { setAberto(null); i.acao?.(); }}>
                    <span className="mi">{i.icone ? Icones[i.icone] : null}</span><span className="mr">{i.rotulo}</span><kbd>{i.atalho}</kbd>
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
