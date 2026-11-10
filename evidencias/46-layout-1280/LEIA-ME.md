# Layout em 1280 × 720

Gerado por `node tools/e2e/testar-layout-1280.mjs` (com `npm run dev:web` rodando). Resultado: 9 verificações ok, sem erro de página.

| Arquivo | O que mostra |
|---|---|
| `01-barra-1280.png` | A barra de ferramentas cabe na largura: 12 comandos na barra e o botão **Mais** no canto. |
| `02-menu-mais-aberto.png` | O menu **Mais**, com os 7 comandos que não cabem (LaTeX, Prompt IA, Vídeo MP4, Legendas, Roteiro de gravação, Quadro atual, Manual) e os atalhos. |
| `03-exportar-uma-linha.png` | O botão **Exportar MP4** em uma linha só, inteiro dentro da linha de transporte. |

## O que a bateria verifica

- Em 1280 px aparece o botão **Mais**.
- Os comandos da barra mais os do menu são **todos** os comandos da janela larga (nenhum some).
- A barra não transborda com rolagem escondida.
- Esc fecha o menu; escolher um item executa o comando (escolher o LaTeX abre o editor de fórmulas).
- O botão Exportar MP4 fica em uma linha e cabe dentro do palco.

## Como ficou

- **Barra de ferramentas:** o que não cabe vai para o menu **Mais**, medido pelo layout real. Antes, os últimos botões sumiam.
- **Controle de zoom do palco:** em janelas estreitas perde o rótulo "Zoom" (continua no `title`) e encolhe, para o Exportar caber.
- **Abas do painel direito:** em 1280 px as cinco abas (Personagem, Biblioteca, Imagens, Áudio, Aula) não cabiam inteiras e a última era cortada pela borda. Agora, nessa largura, viram um **seletor compacto** com as mesmas cinco opções (`04-abas-1280.png` mostra "Personagem ▾"). Em janelas maiores continuam abas lado a lado.
- **Subtítulo do palco:** some em janelas estreitas (o formato continua no título do botão), para o botão "Tela cheia" não quebrar em duas linhas.

A bateria mede se o painel mostra as cinco opções inteiras. Antes, ela media contra um contêiner que cabia no próprio conteúdo e não detectava o corte; isso foi corrigido.
