# Menus e camadas só com teclado

Gerado por `node tools/e2e/testar-teclado-menus.mjs` (com `npm run dev:web` rodando). Resultado: todas as verificações ok, sem erro de página.

| Arquivo | O que mostra |
|---|---|
| `01-menu-aberto-pelo-teclado.png` | O menu Arquivo aberto com a seta para baixo. O primeiro item está destacado pelo foco. |
| `02-submenu-pelo-teclado.png` | O submenu Projeto aberto com a seta para a direita. O foco está no primeiro item do submenu. |
| `03-camada-selecionada-teclado.png` | A camada BetaSon selecionada na linha do tempo, com o foco e a tecla Enter. |

## Teclas

- **Seta para baixo** (ou Enter, Espaço, seta para cima) no menu: abre o menu e leva ao primeiro item.
- **↑ / ↓**: percorrem os itens. **Home / End**: vão ao primeiro e ao último.
- **→** num item com submenu: abre o submenu. **←** no submenu: volta ao item que o abriu.
- **← / →** na barra, com o menu fechado: mudam o foco entre os menus. Com um menu aberto, trocam de menu e abrem o próximo.
- **Enter / Espaço**: executam o item.
- **Esc**: fecha o nível atual e devolve o foco ao gatilho. **Tab**: fecha o menu.
- Nas camadas da linha do tempo: foco pelo Tab e **Enter** seleciona o personagem. Espaço fica com a reprodução, como no resto do app.

## Como ficou a estrutura

A barra usa os papéis ARIA de barra de menus (`menubar`, `menuitem`, `menu`, `separator`), com `aria-haspopup` e `aria-expanded`, para que leitores de tela anunciem o estado. Os menus continuam abrindo com o mouse.
