export interface ItemMenu { rotulo: string; atalho?: string; acao?: () => void; desativado?: boolean; separador?: boolean }
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
                    <span>{i.rotulo}</span><kbd>{i.atalho}</kbd>
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
