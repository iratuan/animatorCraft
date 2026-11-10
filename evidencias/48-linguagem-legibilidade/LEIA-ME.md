# Linguagem, legibilidade e alvos de toque

Medido com `node tools/e2e/inspecao-ux.mjs`. Os números "antes" vêm do primeiro relatório de inspeção (pasta 44). O arquivo `medicao-depois.json` tem a medição completa desta rodada.

## Números

| Medida (tela do editor) | Antes | Depois |
|---|---|---|
| Botões sem nome acessível | 0 | 0 |
| Campos sem rótulo | 1 | **0** |
| Textos menores que 11 px (1600 px) | 18 | **6** |
| Textos menores que 11 px nos modais | 45 | **6** |
| Alvos menores que 24 px (1600 px) | 16 | **1** |
| Alvos menores que 24 px (1280 px) | 16 | **2** |

Os 6 textos restantes são os marcadores de camada "●" (decorativos, não são texto de leitura) e um emoji pequeno ao lado do botão de voz. O alvo restante é o slider de zoom, que é o controle padrão do navegador.

## Mudanças de linguagem

| Antes | Depois |
|---|---|
| Ficha & Vetores SVG | Ficha do personagem (título: "Ficha de CringeFather") |
| 100% Vetorial SVG / Path2D | Desenho vetorial |
| Vetor SVG ao Vivo | Pré-visualização |
| Testar Movimento / Pose | Pose |
| Testar Expressão Vetorial | Expressão |
| Neut, Feli, Brav, Surp, Conf, Sarc, Assu, Empo, Ente | Os nomes completos (Neutra, Feliz, Brava...) |
| Descrição de ficha do elenco original, em jargão | "Os personagens do elenco original só podem ser vistos. Para mudar algo, use Duplicar para editar." |

## Mudanças de legibilidade

- O `<small>` do navegador encolhia para cerca de 9 px nas legendas. Agora tem piso de 11 px.
- Régua do tempo: rótulos de 10 para 11 px; marca de cena de 9 para 11 px.
- Chips de inserção do roteiro: área de toque de 21 para cerca de 26 px.
- Cor do detalhe nas sugestões de `@`: contraste de 4,38:1 para 5,38:1 (mínimo para texto pequeno: 4,5:1).

## Exceção

Em janelas de 1280 px, as abas do painel direito viraram um seletor compacto com as mesmas cinco opções (ver pasta 46). Nessa largura, as abas em texto não cabem com um tamanho de fonte legível.
