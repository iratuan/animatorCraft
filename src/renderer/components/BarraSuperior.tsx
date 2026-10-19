import { Icones } from '@renderer/components/Icones';
import type { GrupoMenu, ItemMenu } from '@renderer/components/BarraMenu';

/**
 * Barra de ferramentas do topo: os itens dos menus marcados com `barra` (início, projeto, desfazer, personagens, IA, exportar, ajuda).
 * Vem dos próprios menus, então botão e menu nunca divergem.
 */
export function BarraSuperior({ menus }: { menus: GrupoMenu[] }) {
  const itens = menus.flatMap((m) => m.itens).filter((i): i is ItemMenu & { barra: { grupo: number; rotulo: string } } => !!i.barra && !!i.acao);
  const grupos = [...new Set(itens.map((i) => i.barra.grupo))].sort((a, b) => a - b);
  return (
    <div className="barra-superior" role="toolbar" aria-label="Ferramentas gerais">
      {grupos.map((g) => (
        <div key={g} className="grupo-barra">
          {itens.filter((i) => i.barra.grupo === g).map((i) => (
            <button key={i.rotulo} disabled={i.desativado} onClick={i.acao} title={`${i.rotulo}${i.atalho ? ` (${i.atalho})` : ''}`} aria-label={i.rotulo} data-barra={i.barra.rotulo}>
              {i.icone ? Icones[i.icone] : null}<span>{i.barra.rotulo}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
