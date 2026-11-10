# 53 — App só com boneco de palito (chibi removido)

## O que foi pedido
Remover o estilo chibi por completo e manter o app rodando com o boneco de palito, a personalidade dos personagens, os atalhos do roteiro (`@` e `[[ ]]`) e as animações.

## O que a bateria prova (`tools/e2e/testar-stickman-completo.mjs`)
Resultado da última execução: **7 de 7 verificações ok**.

- A tela inicial não mostra termos de chibi/sprite.
- A barra de menus não mostra termos de chibi/sprite.
- O roteiro de exemplo carrega.
- A reprodução avança (00:00.00 → 00:04.06 de 00:19.14).
- O palco é desenhado em canvas (1281×720).
- O editor não mostra nenhum termo de chibi/sprite (0 encontrados).
- Nenhum erro de página ou de console.

## Capturas
- `01-tela-inicial.png` — tela inicial sem o atalho "Sprites e biblioteca".
- `02-editor-elenco.png` — editor com o elenco de palito, linha do tempo e o aviso "Ação não entendida: 'Carol fica parada.'" com as sugestões de correção.
- `03-palco-reproducao-4s.png` — palco em reprodução, após 4 s.

## Ressalvas
- A bateria de layout (`testar-layout-1280`) ficou mais tolerante: quando o primeiro item oculto do menu "Mais" não é o editor de fórmulas, ela confere só que o comando executa e o menu fecha. Antes ela assumia que o primeiro item era sempre o LaTeX, o que deixou de ser verdade.
- Quatro baterias antigas que testavam só sprites e skins saíram da lista `npm run e2e`: `revisao-barra-paineis`, `revisao-biblioteca`, `revisao-clipes` e `testar-animacoes-io`. Não foram reescritas.
- O palco ainda desenha Paraíba e Mingau (animais) com o esqueleto bípede. Essa parte não está coberta por esta bateria.
- Não há teste de palco com personagens quadrúpedes.

## Correções feitas nesta rodada, achadas pelas baterias
- **Seletor do `@`:** o item sob o ponteiro era escolhido quando a lista abria, porque `onMouseEnter` disparava sem movimento. Agora usa `onMouseMove`. A falha era intermitente e sumiu após a troca.
- **Teclas de seta:** a seleção passou a ser lida de uma referência atualizada na hora, para duas setas seguidas não se perderem antes do re-render.
- **Título duplicado:** a tela de abertura tinha um segundo `h1`. Virou `div` com `aria-hidden`, então a página tem um único título.
- **Rótulos:** o grupo "Personagens & Sprites" virou "Personagens".

## Como rodar
1. `npm run dev:web` (servidor em http://127.0.0.1:5173).
2. `node tools/e2e/testar-stickman-completo.mjs`.
