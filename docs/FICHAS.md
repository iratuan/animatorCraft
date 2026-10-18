# Fichas de personagem: como gerar e importar

O StickBoard anima **fichas de sprites** (grade 3x3, uma pose por célula, fundo branco). O app recorta, converte para escala de cinza e anima com clipes de movimento. Quanto melhor a ficha, melhor o vídeo.

## Regras para a imagem sair boa no recorte

- Resolução alta: **2048 px ou mais** (hoje cada pose tem só ~270 px de altura e fica mole nos closes).
- Fundo **branco puro**, poses bem separadas (sem encostar nas bordas da célula nem nas outras poses), cada pose **inteira** dentro da célula, mesma escala nas 9 poses.
- Sem cenário, sem móveis, sem sombras coloridas no chão (props pequenos, como um foguete, são ok).
- Personagem sempre **virado para a direita** nas poses de lado.

## Estilo global (cole no fim de todo prompt)

> `2D cartoon character sheet, 3x3 grid, clean line art, flat colors, soft shading, Western animation design inspired by Rick & Morty and Gravity Falls, pure white background, generous spacing between poses, every pose fully inside its cell, same scale in all poses, 2048px.`

## 1. Fichas que faltam (Elizendra, Artur, Carol)

**Elizendra (avó, 50 anos)**
`Elizendra, 50-year-old funny and clumsy grandmother, round eyeglasses, long gray-brown hair loose to the shoulders, warm kind face, floral cardigan over a plain blouse, long skirt, comfortable shoes. Poses in the 3x3 grid: standing relaxed; walking; pointing with one finger; laughing with hand on belly; tripping and flailing; holding a tray of cookies proudly; sitting on a chair knitting; surprised with hands on cheeks; back view.`

**Artur (melhor amigo do BetaSon, 11 anos)**
`Artur, 11-year-old chubby boy with tan skin, short straight black hair, round eyeglasses, friendly goofy smile, wearing a red graphic t-shirt, denim shorts and white sneakers. Poses in the 3x3 grid: standing relaxed; walking; running; cheering with both arms up; sitting on the floor playing a handheld console; eating a sandwich; laughing; scared with hands up; back view.`

**Carol (amiga do BetaSon, 11 anos)**
`Carol, 11-year-old tall and skinny girl, long straight black hair, brown eyes, confident smile, wearing a yellow hoodie, blue jeans and white sneakers, small backpack. Poses in the 3x3 grid: standing relaxed; walking; running; arms crossed with a smirk; raising a hand to answer; sitting on the floor reading; laughing; surprised; back view.`

## 2. Folha de rostos (para boca em sincronia e piscadas bonitas)

Uma por personagem. É a peça que resolve a sincronia labial: o app troca a **cabeça inteira** por uma destas células.

`Face sheet of <PERSONAGEM> (use the character description above), head and shoulders only, 3x3 grid, IDENTICAL head size, angle (front, slightly turned to the right) and position in every cell, glasses and hair exactly the same, only the mouth and eyes change. Row 1: mouth closed neutral; mouth wide open saying "A"; wide smile showing teeth saying "E". Row 2: small round mouth saying "O"; lips pressed together saying "M/B/P"; slightly open mouth saying "U". Row 3: eyes closed (blink); eyes half-closed; eyes wide open surprised. Pure white background, 2048px.`

## 3. Mais poses de aula (para cada personagem)

`<PERSONAGEM>, 3x3 grid of classroom poses: pointing at a board with the right arm; writing on a board seen from behind; arms crossed impatient; hand on chin thinking; laughing out loud; angry shouting; surprised with mouth open; celebrating with both fists up; sitting at a desk.`

## Como importar

1. Salve cada ficha em `referencias/<Nome>.jpg` (ex.: `referencias/Elizendra.jpg`).
2. Em `tools/sprites/mapa-poses.json`, acrescente o personagem com a lista de `tags` na ordem da grade (esquerda→direita, cima→baixo) e a `altura` proporcional à idade.
3. Rode `node tools/sprites/gerar-sprites.mjs`. Ele recorta, grava em `apps/web/src/assets/personagens/` e atualiza o manifesto.
4. Âncoras de rosto (olhos, boca, caixa da cabeça para o `[close no personagem]`) ficam em `tools/sprites/rostos.json`.
