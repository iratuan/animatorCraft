# Inspeção de UX e engenharia — StickBoard 0.8.2

Data: 2026-10-26 · Escopo: editor, tela inicial, ficha do personagem, cabeçalho e rodapé, roteiro, linha do tempo, fechamento e salvamento, código do renderer e do processo principal.

## Como foi feita

- **Medição automática** (`tools/e2e/inspecao-ux.mjs`), em 1280×720 e 1600×900: botões sem nome, campos sem rótulo, texto menor que 11 px, alvos menores que 24 px e estouro horizontal. Resultados em `relatorio-medido.json`.
- **Leitura visual** das capturas em cada largura.
- **Leitura do código** dos fluxos de fechamento, salvamento, menus e modais.
- **Medição de desempenho** do roteiro (teste temporário, removido depois): reanálise de 50, 200 e 600 linhas leva 3,5, 5,2 e 12,1 ms em Node. Não é gargalo.

**Lacunas:** o modal "Prompt mestre" não foi capturado (o clique pelo menu falhou); o `.exe` e o APK não foram executados; o editor de imagem e o editor de fórmulas não foram inspecionados visualmente.

## Crítico — perda de trabalho

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| C1 | **Fechar a janela com alterações não salvas não pergunta nada.** `src/main/index.ts` não tem nenhum tratamento de `close`. O aviso "Descartar alterações?" só existe para Novo e Abrir. | código | Sprites, áudios e projeto editados são perdidos sem aviso. O roteiro sobrevive (gravado a cada tecla no `localStorage`), mas o resto não. |
| C2 | **Modais fecham com clique fora ou Esc sem confirmar**, mesmo com texto digitado: ficha do personagem, editor de sprites, editor de expressões e clipes, Roteiro com IA, Prompt mestre, editor de fórmulas. Só o editor de imagem pede confirmação. | `PersonagemModal.tsx:80`, `EditorAnimacaoModal.tsx:65`, `EditorSpritesModal.tsx:33`, `IaModal.tsx:71`, `PromptMestreModal.tsx:99`, `EditorMatematicaModal.tsx:263` | Um clique errado apaga a ficha ou o texto de uma fórmula. |
| C3 | **"Salvar projeto como" usa `window.prompt`.** No Electron essa função não é suportada, e o código não tem caminho alternativo. | `useMenus.ts:59-62` | Provável falha ou cancelamento silencioso ao salvar pelo desktop. **A confirmar no `.exe`.** |

## Alto — problemas visíveis

| # | Problema | Evidência |
|---|---|---|
| A1 | **Em 1280×720 a barra de ferramentas corta** no meio de "Prompt IA". MP4, Legendas e Vozes ficam inacessíveis, e não há menu de transbordo. | `editor-1280x720.png` |
| A2 | **As abas do painel direito cortam** ("AU…"). "Aula" e "Ajuda" saem da tela. | `editor-1280x720.png`, `editor-1600x900.png` |
| A3 | **O botão "Exportar MP4" quebra em duas linhas** em 1280 px. | `editor-1280x720.png` |
| A4 | ~~O título e a barra de progresso do palco vazam para a régua da linha do tempo.~~ **Falso positivo, corrigido nesta revisão:** era a tela de abertura (splash), capturada durante a saída, 400 ms depois do carregamento. A splash dura 1,3 s. Depois disso, o palco não vaza. | `editor-1280x720.png` (refeita após a splash) |
| A5 | **Os menus principais não funcionam pelo teclado.** `BarraMenu.tsx` não tem nenhuma tecla de seta, Esc, `aria-expanded` nem `aria-haspopup`. | código |
| A6 | **Jargão e abreviações nos modais:** "Ficha & Vetores SVG", "Vetor SVG ao Vivo", "100% Vetorial SVG / Path2D". Os botões de expressão são abreviados: "Neut", "Feli", "Brav", "Surp", "Conf", "Sarc", "Assu", "Empo", "Ente". | `modal-personagem-1280x720.png` |
| A7 | **Texto muito pequeno:** 18 elementos abaixo de 11 px no editor e 45 nos modais (9 a 10 px: régua do tempo, legenda do palco, "clique para inserir no roteiro"). | `relatorio-medido.json` |
| A8 | **Alvos pequenos:** abas do painel com 15 px de altura, chips de inserção com 21 px, campo de busca com 16 px. 16 alvos no editor estão abaixo de 24 px. | `relatorio-medido.json` |
| A9 | **O campo principal do roteiro não tem rótulo acessível** (só `id`, sem `aria-label`). Leitor de tela anuncia só "campo de texto". | `relatorio-medido.json` |
| A10 | **Contraste insuficiente:** texto secundário `#8a8a8a` sobre `#262626` dá 4,38:1. Para texto pequeno, o mínimo é 4,5:1. | cálculo |

## Médio

| # | Problema |
|---|---|
| M1 | Os chips de inserção do roteiro cortam o último ("[câm…") e o scroll horizontal fica escondido. |
| M2 | O foco visível só está definido para os botões da barra superior (`global.css:422`). O resto depende do contorno padrão do navegador. |
| M3 | A tela inicial usa ícones coloridos de emoji nas etiquetas de formato (Aula, Podcast, Telejornal, Esquete), e o editor usa ícones de linha. São dois estilos diferentes. (`inicio-1280x720.png`) |
| M4 | Resultados importantes ficam só na barra de status, em texto pequeno. A mensagem "Exportação cancelada. Corrija as frases marcadas no roteiro." é um exemplo. |
| M5 | A confirmação de exportação com erro (`window.confirm`) não oferece "Corrigir" nem leva até a frase. |
| M6 | A linha da camada (`LinhaDoTempoPanel.tsx:231`) é um `div` com `onClick`, sem foco de teclado nem papel de botão. |

## Engenharia

| # | Observação |
|---|---|
| E1 | **Dez modais reimplementam a própria casca** (`modal-fundo` + `role="dialog"` + `stopPropagation`). Não há componente base, nem armadilha de foco, nem devolução de foco ao fechar. Alguns têm `role="dialog"` e outros não (`EditSpeechDialog`, `RecordAudioDialog`, `EditorMatematicaModal`). Isso explica C2 e torna cada modal um caso separado. |
| E2 | **Arquivos muito grandes:** `motor.ts` (40 KB), `cena/services/ator.ts` (36 KB), `ManualModal.tsx` (28 KB), `EditorImagemModal.tsx` (28 KB), `LinhaDoTempoPanel.tsx` (22 KB). |
| E3 | **O processo principal é mínimo** (43 linhas em `src/main/index.ts`). Não há tratamento de fechamento, de `before-quit` nem de salvamento de emergência. Ver C1. |
| E4 | **As baterias e2e não cobrem 1280×720.** Todas usam 1600×900, por isso A1 a A4 passaram despercebidos. |
| E5 | **O desempenho do roteiro não é problema** (3,5 a 12 ms). Não há ação necessária. |
| E6 | Os 22 elementos com `onClick` em `div`/`span` estão quase todos nas máscaras de modal (aceitável). A exceção é M6. |
| E7 | Nenhum `console.log` no renderer; o único está em `src/main/index.ts:38`. Sem erros de página durante a inspeção. |

## Status das correções (revisão desta etapa)

| Item | Situação | Evidência |
|---|---|---|
| **C1** Fechar a janela com alterações não salvas | **Resolvido.** O processo principal pergunta antes de fechar (Cancelar ou Fechar sem salvar). No navegador, o aviso de saída do próprio navegador. Vale para o app inteiro. | `src/main/services/janela.ts` (5 testes), `testar-modais.mjs` (passos 10) |
| **C2** Modais fecham com edição não salva | **Resolvido.** Componente `Modal` único, com Esc, armadilha de foco, devolução de foco e confirmação. Migrados: ficha do personagem, IA, prompt mestre, fórmulas, animação, sprites, fala, gravação de áudio, importar e manual. Botões Fechar e Cancelar também confirmam. | `testar-modais.mjs` (passos 1 a 9) |
| **C3** "Salvar como" com `window.prompt` | **Resolvido.** Pergunta do nome dentro do app (não depende do Electron). | `testar-modais.mjs` (passo 11) |
| **E1** Cascas de modal repetidas | **Resolvido** nos modais de edição. O Manual e o Importar usam o `Modal` sem confirmação, porque não têm edição. | código |
| **A1** Barra de ferramentas cortada em 1280 px | **Resolvido.** Menu **Mais** com o que não cabe; medição pelo layout real. | `46-layout-1280/` |
| **A2** Abas do painel direito cortadas | **Resolvido (1280 px):** seletor compacto com as mesmas cinco opções. | `46-layout-1280/04` |
| **A3** Exportar MP4 quebrando linha | **Resolvido**, e o botão cabe dentro da linha de transporte. | `46-layout-1280/03` |
| **A4** Palco vazando na régua | **Falso positivo** (ver tabela acima). | — |
| **A9** Campo do roteiro sem rótulo | **Resolvido.** | código |
| A5 Menus sem teclado | **Resolvido.** Navegação completa por setas, Enter, Esc e Tab, com papéis ARIA. | `47-menus-teclado/` |
| A6 Jargão e abreviações nos modais | **Resolvido.** Nomes em português claro e expressões por extenso. | `48-linguagem-legibilidade/` |
| A7 Texto menor que 11 px | **Quase resolvido.** Editor a 1600 px: 18 para 6 (5 são marcadores "●" decorativos, 1 é um emoji). | `48-linguagem-legibilidade/` |
| A8 Alvos menores que 24 px | **Quase resolvido.** Editor a 1600 px: 16 para 1 (o slider de zoom, controle padrão do navegador). | `48-linguagem-legibilidade/` |
| A10 Contraste do texto secundário | **Resolvido.** Detalhe das sugestões de `@` passou de 4,38:1 para 5,38:1. O tema já usa `#9a9a9a` (5,38:1) como texto secundário. | `48-linguagem-legibilidade/` |
| M1 | **Resolvido.** Os chips do roteiro quebram linha. | `49-chips-icones-avisos-exportacao/02` |
| M3 | **Resolvido.** Ícones de linha para os formatos, no lugar dos emojis (tela inicial, IA, prompt mestre, linha do tempo). | `49-.../01` e `06` |
| M4 | **Resolvido.** A mensagem do app aparece também num aviso sobre a tela, com `aria-live`. | `49-.../05` |
| M5 | **Resolvido.** A exportação com erro abre um diálogo com Corrigir primeira frase, Exportar mesmo assim e Cancelar. | `49-.../03` e `04` |
| M2 e M6 | **Resolvidos** (ver linhas acima). | `47-menus-teclado/` |

## Sugestão de ordem

1. **C1 e C2** (perda de trabalho): confirmação no fechamento da janela e no fechamento dos modais com edição pendente. Dá para resolver com um componente base de modal (E1), que resolve C2, A5 em parte e E1.
2. **C3** (salvar pelo desktop): confirmar no `.exe` e trocar `window.prompt` por um diálogo do app.
3. **A1 a A4** (layout em 1280 px): menu de transbordo para a barra de ferramentas, abas com rolagem ou menu, e teste e2e em 1280×720.
4. **A5 e A9** (teclado e leitores de tela): navegação por setas nos menus e rótulos nos campos.
5. **A6 e A7** (linguagem e legibilidade): nomes em português claro, expressões por extenso, e mínimo de 11 px.
