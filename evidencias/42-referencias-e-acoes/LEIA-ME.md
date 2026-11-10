# Referências e ações entre colchetes "[[...]]"

Gerado por `node tools/e2e/testar-colchetes.mjs` (com `npm run dev:web` rodando). Resultado: 15 verificações ok, sem erro de página.

| Arquivo | O que mostra |
|---|---|
| `01-menu-elementos-e-acoes.png` | Digitar "[[" fecha com "]]" sozinho e abre o menu com os grupos **Elementos** (lousa e a imagem `ciclo.png` citada no roteiro) e **Ações** (poses e expressões). |
| `02-filtrado-apon.png` | Com "apon", o menu filtra e põe "aponta para a lousa" primeiro. |
| `03-inserido-sem-avisos.png` | Depois de Enter, a linha fica `Professor [[aponta para a lousa]]` e o painel de avisos não mostra erro de sintaxe. O aviso amarelo "imagem não está na biblioteca" é do exemplo, não do colchete. |

Regras verificadas: "[[" fecha com "]]"; digitar "]" sobre o "]]" automático só avança o cursor; Esc fecha sem apagar os colchetes; clique insere; elemento de imagem entra como `[[mostra a imagem ciclo.png]]`.

Enquanto a ação ainda está vazia (`Professor [[]]`), o painel pode mostrar "Ação não entendida" por um instante. Some ao escolher a ação.
