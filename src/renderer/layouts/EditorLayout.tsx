import type { ReactNode } from 'react';

/** Estrutura da janela do editor: barra de menus, ferramentas, três painéis, linha do tempo e barra de status. */
export function EditorLayout({ menu, ferramentas, roteiro, palco, lateral, linhaDoTempo, status }: {
  menu: ReactNode; ferramentas: ReactNode; roteiro: ReactNode; palco: ReactNode; lateral: ReactNode; linhaDoTempo: ReactNode; status: ReactNode;
}) {
  return (
    <div className="app">
      {menu}
      {ferramentas}
      {roteiro}
      {palco}
      {lateral}
      {linhaDoTempo}
      {status}
    </div>
  );
}
