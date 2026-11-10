# Modais e fechamento com alterações não salvas

Gerado por `node tools/e2e/testar-modais.mjs` (com `npm run dev:web` rodando). Resultado: 27 verificações ok, sem erro de página.

| Arquivo | O que mostra |
|---|---|
| `01-ficha-aberta-com-foco.png` | A ficha do personagem aberta, com o foco dentro do modal. |
| `02-esc-pergunta-com-alteracao.png` | Depois de alterar um campo e apertar Esc, a ficha continua aberta com o texto digitado (a pergunta de descarte foi recusada). |

## O que a bateria verifica

- **Esc e clique fora:** sem alteração, fecham direto. Com alteração, perguntam antes; recusar mantém o modal e o texto.
- **Botões Fechar e Cancelar do rodapé:** passam pela mesma pergunta.
- **Arrastar a seleção de texto de dentro para fora** da caixa não fecha o modal.
- **Foco:** entra no modal ao abrir, fica preso com Tab e volta ao botão que abriu ao fechar.
- **Fechar a página com alterações no roteiro:** o navegador pergunta antes de sair, e recusar mantém a página.
- **Salvar projeto como:** o pedido de nome aparece dentro do app (sem `window.prompt`); Enter grava com o nome digitado; Esc cancela sem gerar arquivo.

## Defeitos que a bateria encontrou e que foram corrigidos

1. O botão **Cancelar** da ficha em modo de edição ignorava a confirmação.
2. O aviso de saída do navegador sumia quando o usuário voltava à tela inicial, porque estava registrado só na página do editor. Passou a ser do app inteiro.

## Limite

O fechamento da janela do Electron (desktop) está coberto por testes unitários do serviço (`src/main/services/janela.test.ts`), não por esta bateria. Falta confirmar no `.exe`.
