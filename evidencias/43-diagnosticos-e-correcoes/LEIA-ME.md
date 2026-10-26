# Diagnósticos no roteiro: sublinhado, sugestões e confirmação na exportação

Gerado por `node tools/e2e/testar-diagnosticos.mjs` (com `npm run dev:web` rodando). Resultado: 13 verificações ok, sem erro de página.

Roteiro usado no teste:

```
# Diagnósticos

Professor acena.
Professor pulla.
Erik fala "oi".
Aluno dança.
```

| Arquivo | O que mostra |
|---|---|
| `01-sublinhado-no-texto.png` | As frases incoerentes "Professor pulla." e "Erik fala "oi"." sublinhadas em vermelho, sob as próprias letras. A frase correta ("Aluno dança.") não tem marca. |
| `02-lista-com-sugestoes.png` | Embaixo do roteiro, cada problema com o motivo (✖ erro) e o botão **usar:** com a correção: `Professor pula.` e `Erika fala "oi".`. |
| `03-depois-da-correcao.png` | Depois de clicar em **usar:** no verbo, a frase virou `Professor pula.` e a marca saiu. Sobra só o nome, que ainda não foi corrigido. |
| `04-exportacao-pede-confirmacao.png` | Exportar com erro pede confirmação (`window.confirm`). Recusada, a barra de status mostra "Exportação cancelada. Corrija as frases marcadas no roteiro." |

## Como funciona

- Cada frase que gera erro ou aviso no parser recebe a posição dela no roteiro (`ini`, `fim`) e uma lista de sugestões. A lista de textos de aviso continua como estava.
- **Erro** (✖): o app não executa a frase, como verbo desconhecido ou personagem não reconhecido. **Aviso** (⚠): o app executa, mas pode não ser o que você quis.
- As sugestões vêm do catálogo que o menu `[[` já usa (ações, expressões e clipes do personagem) e do nome de personagem mais parecido. Só aparecem quando há uma correção próxima.
- Clicar em um item da lista leva o cursor até a frase. **usar:** troca a frase e entra no desfazer (Ctrl+Z).
- Exportar com erro pede confirmação. Não bloqueia: quem exporta decide.
