# Seletor de personagens com "@"

Gerado por `node tools/e2e/testar-mencao.mjs` (com `npm run dev:web` rodando). Resultado: 12 verificações ok, sem erro de página.

| Arquivo | O que mostra |
|---|---|
| `01-lista-aberta.png` | Digitar "@" abre a lista de papéis (Professor, Aluno) e do elenco, junto ao cursor. |
| `02-filtrada.png` | Com "@ca", a lista filtra e põe primeiro quem começa com "ca" (Dario por "cacula"). |
| `03-depois-da-insercao.png` | Depois de escolher, o nome entra no roteiro com espaço e o "@" some. |

Regras verificadas: Enter, Tab e clique inserem; setas trocam a seleção; Esc fecha sem apagar o "@"; e-mail (`contato@escola`) não abre a lista.
