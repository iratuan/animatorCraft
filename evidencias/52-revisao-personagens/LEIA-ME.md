# Revisão da identidade visual e dos movimentos dos personagens

Pergunta: os personagens seguem o estilo boneco de palito, com humor e identidade visual consistente? As poses (movimentos) estão funcionando?

Referência de estilo: `docs/STICKMAN_VISUAL_BIBLE.md`. Ferramentas usadas: `tools/auditoria/` (folhas e medições geradas com o mesmo gerador que o app usa).

## Achados

### 1. Identidade: o palco mistura dois estilos (principal)

- Os 5 personagens do elenco original (CringeFather, BetaSon, Erika, Dario e Laura) têm `temSprites: true`: no palco aparecem como **sprites PNG estilo chibi**.
- Os outros 7 (Artur, Carol, Elizendra, Véia, Véio, Paraíba, Mingau) aparecem como **boneco de palito** desenhado em canvas.
- Já o gerador SVG (ficha do personagem e pré-visualização) desenha **os 12 como boneco de palito**.

Resultado: o mesmo personagem tem estilos diferentes na ficha e no palco. Isso contraria a bíblia. A decisão de aposentar o chibi já estava registrada nas pendências (`Melhorias.txt`); depende de você.

### 2. Movimentos: defeitos no gerador (corrigidos nesta rodada)

Medido na matriz de 38 poses × 12 personagens (`03-matriz-poses-antes.png`):

- **Saias soltas:** em Erika, Laura, Elizendra e Véia, a saia era desenhada da cintura até a posição dos pés. Em poses de ar, queda, corrida e sentar virava um triângulo solto no chão.
  - **Correção:** a bainha agora é presa ao quadril (altura e largura fixas). Ver `04-matriz-poses-depois.png`.
- **Quadrúpedes sem movimento:** Paraíba e Mingau tinham a mesma imagem em todas as 38 poses.
  - **Correção:** `andar`, `correr`, `pular` e `rindo` agora mudam o passo, o salto e a cabeça. As outras 34 poses continuam como "parado" (ainda sem ajuste próprio).

### 3. Pendências não corrigidas (precisam da sua direção)

- **Pernas em poses dinâmicas (humanos):** `pular`, `correr`, `tropecar` e `sentar` ainda têm ângulos de perna que dobram para o lado errado. Os ângulos vêm dos dados das poses (`poses.ts`), e corrigi-los pede decisão de animação, não só de código.
- **Preenchimento preto maciço:** calça do CringeFather e do Véio, sapatos e o cabelo da Erika. A bíblia pede corpo branco com traço escuro; cor escura só em adereço. É uma decisão de estilo: manter ou trocar por branco.
- **Humor:** o rosto padrão de Dario e Véio é neutro, e a maioria dos rostos base é reta. Humor "sempre" depende de expressão e de pose, e isso é criativo: precisa do seu olhar sobre o tom de cada personagem.
- **Pasta `assets/svg/characters`:** os arquivos estão defasados. Os quadrúpedes lá têm traço de 1,82 px, enquanto o gerador usa 2,6 px. O app não lê essa pasta para o desenho; ela deveria ser regenerada ou removida, para não haver duas fontes de verdade.

## Números (`medicao-consistencia.json`)

Medição dos arquivos da pasta `assets/svg` (não do gerador em execução). Espessuras de traço: 2,6 px é o padrão nos humanos; quadrúpedes 1,82 px. Contagem de preenchimento preto maciço: de 124 (Artur, Carol, Dario, Mingau) a 289 (Erika).

## O que não foi feito nesta rodada

- O palco (sprites chibi e o boneco do canvas, `ator.ts`) não foi alterado nem testado com as poses corrigidas.
- Nenhuma função que já funciona foi removida. Os testes passam (316).
