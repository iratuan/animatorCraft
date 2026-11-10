# Chips, ícones de formato, aviso na tela e confirmação da exportação

Gerado por `node tools/e2e/testar-m1-m5.mjs` (com `npm run dev:web` rodando), em 1280 × 720. Resultado: todas as verificações ok, sem erro de página. Também passam `testar-diagnosticos` e `testar-modais`, que cobrem o diálogo de exportação.

| Arquivo | O que mostra |
|---|---|
| `01-tela-inicial-icones.png` | Filtros de formato com ícones de linha (Podcasts, Telejornais, Esquetes…) no lugar dos emojis. |
| `02-chips-quebrando-linha-1280.png` | Os 7 chips do roteiro (+ Fala, + Entrar, + Lousa, + LaTeX, + Gráfico f(x), [câmera], + Pausa) quebram em duas linhas. Nenhum é cortado. |
| `03-dialogo-exportar-com-erro.png` | Exportar com frases com erro abre o diálogo dentro do app: lista as frases e oferece **Cancelar**, **Exportar mesmo assim** e **Corrigir primeira frase**. |
| `04-corrigir-leva-ao-trecho.png` | Depois de "Corrigir primeira frase": o diálogo fecha e o trecho com erro fica selecionado no roteiro. |
| `05-aviso-flutuante-cancelada.png` | Cancelar mostra a mensagem num aviso curto sobre a tela (e na barra de status). |
| `06-prompt-mestre-icones.png` | Os formatos do Prompt mestre com ícones de linha. |

## Mudanças

- **M1, chips do roteiro:** a faixa quebra linha em vez de rolar escondendo o último chip.
- **M3, emojis de formato:** os formatos (Aula, Podcast, Telejornal, Debate, Papo Livre, Esquete) têm ícones de linha, no mesmo traço dos ícones do editor. Tela inicial, Roteiro com IA, Prompt mestre e o selo de voz da linha do tempo usam o mesmo mapa. O cabeçalho "💡 Sugestões de pauta" e o marcador "⚠" de aviso não são formatos e ficaram.
- **M4, mensagens:** a mensagem do app também aparece num aviso de 4 segundos sobre a tela, com `aria-live` para leitores de tela. A barra de status continua com a mensagem. "Pronto." e "Carregando…" não aparecem no aviso, porque são estado de rotina.
- **M5, exportação com erro:** o `window.confirm` do navegador foi trocado por um diálogo do app com três escolhas. Esc e clique fora contam como Cancelar. "Corrigir primeira frase" não exporta: leva o cursor até o trecho.

## Defeitos que a bateria pegou durante a mudança

1. O evento "ir para o trecho" era disparado enquanto o diálogo ainda estava aberto, e o modal devolvia o foco ao botão de exportar, desfazendo a seleção. Agora o evento é disparado depois que o modal fecha.
2. A constante do evento estava na feature de exportação, e o painel do roteiro importaria essa feature. Como a exportação já importa o roteiro, isso criaria um ciclo. A constante foi para `shared/constants/eventos.ts`.
3. O aviso "Pronto." aparecia a cada carregamento. Foi filtrado.
4. A bateria de diagnósticos ainda esperava o `window.confirm` nativo. Foi atualizada para o diálogo do app.
