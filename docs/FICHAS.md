# Fichas de personagens do StickBoard: geração, edição e importação

## Objetivo

O StickBoard utiliza fichas de sprites para gerar poses e alimentar o
sistema de animação. As fichas devem seguir o padrão visual
**stickman**, com corpo construído por linhas e articulações claras,
mantendo características visuais que permitam reconhecer cada
personagem.

O objetivo é facilitar a animação, a reutilização de poses e a
manutenção do sistema. Os recursos devem ser produzidos de forma
consistente para permitir recorte automático, importação e associação
com clipes.

> **Importante:** antes de alterar o pipeline atual, confirme no código
> se ele realmente espera uma grade 3x3, como recorta as células, se
> converte as imagens para escala de cinza e quais formatos de arquivo
> aceita. Não altere silenciosamente o contrato do importador. Se
> necessário, adapte as instruções ou o pipeline de forma controlada.

------------------------------------------------------------------------

## 1. Regras gerais para gerar fichas de sprites

### 1.1. Estilo visual obrigatório

-   **Estilo único: stickman.** Não criar novas fichas no estilo chibi.
-   Personagens com cabeça, tronco, braços e pernas simplificados,
    construídos com linhas e formas básicas.
-   Articulações claras nos ombros, cotovelos, quadris e joelhos,
    permitindo movimentos independentes.
-   Espessura de linha consistente entre personagens e partes do corpo.
-   Cabeças e mãos legíveis em tamanhos pequenos.
-   Cabelos, óculos, roupas, vestidos e acessórios usados para
    distinguir cada personagem, sem transformar o corpo em uma anatomia
    complexa.
-   O estilo deve parecer uma série animada 2D autoral, expressiva e
    cômica. Não copiar diretamente personagens ou desenhos de séries
    existentes.
-   Preservar a identidade visual de cada personagem em todas as poses.
-   O personagem deve ficar inteiramente dentro da célula, sem partes
    cortadas.

### 1.2. Grade e resolução

-   Usar grade **3x3**, uma pose por célula, quando esse for o formato
    aceito pelo pipeline atual.
-   Fundo branco puro (`#FFFFFF`), sem cenário, textura, móveis ou
    sombras coloridas.
-   Alta resolução: **2048 × 2048 px ou superior**, preferencialmente
    quadrada, desde que compatível com o importador.
-   Manter a mesma escala e proporção do personagem em todas as células.
-   Garantir espaçamento generoso entre poses e margens internas em cada
    célula.
-   Evitar que braços, pernas, cabelos, orelhas ou acessórios encostem
    nos limites das células.
-   Não permitir que partes de uma pose invadam a célula vizinha.
-   Usar linhas escuras, nítidas e bem definidas, com contraste
    suficiente para o recorte.
-   Evitar detalhes minúsculos que desapareçam após o recorte.
-   Não incluir texto, títulos, números ou legendas dentro da imagem, a
    menos que o pipeline exija explicitamente.

### 1.3. Orientação e consistência

-   Vista frontal nas poses neutras, salvo indicação diferente.
-   Nas poses de perfil, o personagem deverá ficar **virado para a
    direita**.
-   Manter consistentes cabeça, cabelo, óculos, roupa, espessura de
    linha e proporções entre as nove poses.
-   Usar uma pose neutra fácil de identificar como referência para as
    demais.
-   As poses deverão ser distintas e fáceis de classificar por tags.
-   Para personagens com características físicas particulares, preservar
    essas características em todas as poses.
-   Evitar objetos que escondam o corpo ou dificultem a separação dos
    membros.
-   Props pequenos podem ser usados quando importantes para a ação, mas
    não devem encobrir articulações.

### 1.4. Prompt global de estilo

Acrescentar ao fim de cada prompt de ficha corporal:

> `Original 2D stickman animated-series character sheet, simple articulated stick-limb body, clearly separated head, torso, upper arms, forearms, thighs and lower legs, readable joints, expressive oversized head and hands where appropriate, consistent clean dark line art, flat limited colors, minimal character-specific accessories, pure white background (#FFFFFF), 3x3 grid, one full-body pose centered in each cell, generous spacing, identical character scale across all cells, no scenery, no cast shadows, no text, no overlapping cells, every pose fully inside its cell, high contrast, 2048x2048 pixels or higher. Original design, do not imitate any existing copyrighted character.`

### 1.5. Observação sobre animação

Uma ficha de nove poses serve para criar poses-base e sprites
recortados. **Ela não substitui um rig articulado completo.** Para
permitir que braços, pernas e tronco sejam animados independentemente, o
sistema deve ter partes separadas ou uma estrutura de rig configurável.
Não presumir que o recorte de uma imagem única produza automaticamente
articulações independentes.

------------------------------------------------------------------------

## 2. Fichas corporais dos personagens oficiais

Cada ficha deverá conter nove poses, na ordem indicada. Os prompts devem
preservar a mesma identidade visual em todas as células.

### 2.1. Cringefather --- pai e cientista

**Ficha do personagem**

-   Idade: 40 anos.
-   Corpo magro, altura média.
-   Cabelos pretos espetados para cima.
-   Óculos bem visíveis.
-   Aparência de cientista que transmite confiança intelectual.
-   Personalidade: sabe muito sobre muitos assuntos, mas não consegue
    falar inglês; tem humor ácido e ama seus filhos Ian e Darinho e sua
    sobrinha Laura.
-   O design deve permitir sobrancelhas expressivas, inclinação da
    cabeça e gestos de explicação.

**Prompt da ficha 3x3**

`Cringefather, original 40-year-old thin, average-height stickman father and scientist, upright spiky black hair, clearly recognizable glasses, expressive eyebrows, simple articulated stickman body, understated scientist-inspired clothing such as a plain shirt and simple lab coat only if it remains easy to animate. Preserve exactly the same head, hair, glasses and outfit in all cells. Grid poses in reading order: 1) neutral standing, confident intellectual posture; 2) explaining something with one hand raised; 3) pointing confidently as if teaching; 4) trying to speak English and looking confused; 5) irritated sarcastic expression, arms crossed; 6) surprised with both hands raised; 7) laughing with a hand near the belly; 8) warm affectionate pose toward a child; 9) full-body back view. All poses must be readable, articulated, fully inside their cells, with no text or background props.`

**Tags sugeridas:** `idle`, `explain`, `point`, `confused`, `sarcastic`,
`surprised`, `laugh`, `affectionate`, `back_view`.

### 2.2. BetaSon (Ian) --- filho fluente em inglês

**Ficha do personagem**

-   Idade: 10 anos.
-   Muito magro e desajeitado.
-   Cabelos pretos, encaracolados e assanhados.
-   Óculos.
-   Dentes da frente separados, quando a boca estiver aberta.
-   Inteligentíssimo, engraçado e bem-humorado.
-   Completamente fluente em inglês.
-   O humor visual deve vir da expressividade, da autoconfiança e de
    pequenos tropeços ou gestos desajeitados.

**Prompt da ficha 3x3**

`BetaSon (Ian), original 10-year-old very skinny boy stickman, messy black curly hair, recognizable round glasses and a small visible gap between the two upper front teeth whenever the mouth is open. Cheerful, clever, goofy and slightly clumsy. Simple articulated stickman body with childlike proportions, consistent outfit across all cells. Grid poses in reading order: 1) neutral standing with a friendly goofy smile; 2) explaining confidently with one hand raised; 3) laughing with mouth open, front teeth gap visible; 4) awkwardly stumbling but recovering; 5) proudly teaching or correcting someone; 6) excitedly raising both arms; 7) speaking with an expressive hand gesture; 8) playful mischievous grin with hands on hips; 9) full-body back view. Preserve hair, glasses, teeth design and scale in every cell. No written English words or speech bubbles.`

**Tags sugeridas:** `idle`, `explain`, `laugh`, `stumble`, `teach`,
`excited`, `talk`, `mischievous`, `back_view`.

### 2.3. Dario (Darinho) --- filho mais novo

**Ficha do personagem**

-   Idade: 7 anos.
-   Cabelos pretos, lisos, na altura dos olhos.
-   Olhos pretos.
-   Criança autista, mais calada, hiperativa e muito engraçada.
-   Vocabulário limitado; costuma referir-se a si mesmo na terceira
    pessoa.
-   Sua comunicação também poderá ser expressa por olhares, pausas,
    gestos e movimentos corporais.
-   A representação deve ser respeitosa: o autismo não deve ser tratado
    como piada. O humor deve surgir de situações, timing, personalidade
    e interações familiares.

**Prompt da ficha 3x3**

`Dario (Darinho), original 7-year-old child stickman, short straight black hair reaching eye level, dark eyes, simple childlike proportions and clearly articulated stick limbs. Quiet but mischievous, energetic and expressive through body language. Keep the hair shape and facial identity consistent in all cells. Grid poses in reading order: 1) neutral standing with a quiet expression; 2) suddenly looking toward something interesting; 3) energetic little jump; 4) running impulsively with arms moving; 5) pausing and staring with a funny deadpan expression; 6) pointing at himself as if referring to himself in third person; 7) delighted laugh; 8) affectionate pose beside a family member, without adding another character to the cell; 9) full-body back view. Keep poses gentle and respectful, not caricaturing autism. No speech text, no sensory stereotypes, no background.`

**Tags sugeridas:** `idle`, `look`, `jump`, `run`, `deadpan`,
`self_point`, `laugh`, `affectionate`, `back_view`.

### 2.4. Laura (Laurinha) --- sobrinha de 4 anos

**Ficha do personagem**

-   Idade: 4 anos.
-   Cabelos castanhos, olhos castanhos.
-   Duas maria-chiquinhas.
-   Usa vestido.
-   Ama dançar, aprender coisas novas e estar com os primos.
-   Deve transmitir curiosidade, doçura e energia infantil.

**Prompt da ficha 3x3**

`Laura (Laurinha), original 4-year-old little girl stickman, brown eyes, brown hair in two clearly visible pigtails, simple colorful dress and childlike proportions. Sweet, curious, cheerful and eager to learn. Preserve the same pigtails, dress, face and scale in all cells. Grid poses in reading order: 1) neutral standing with a gentle smile; 2) happy dancing pose; 3) clapping excitedly; 4) raising one hand to ask a question; 5) looking curious with head tilted; 6) delighted little jump; 7) laughing happily; 8) affectionate welcoming pose with arms open; 9) full-body back view with both pigtails and dress visible. Keep every pose fully inside its cell. No background, no speech text.`

**Tags sugeridas:** `idle`, `dance`, `clap`, `ask`, `curious`, `jump`,
`laugh`, `welcome`, `back_view`.

### 2.5. Erika --- mãe, psicóloga e figura acolhedora

**Ficha do personagem**

-   Idade: 30 anos.
-   Mais alta que Cringefather.
-   Psicóloga.
-   Calma, amorosa e acolhedora.
-   Participa de histórias e momentos com lições de amor.
-   O design deve permitir expressões de empatia e gestos suaves.

**Prompt da ficha 3x3**

`Erika, original 30-year-old adult woman stickman, visibly taller than Cringefather, elegant simple silhouette, warm gentle expression, hair and clothing design chosen consistently across all cells and easy to animate. Calm, loving, reassuring psychologist and storyteller. Grid poses in reading order: 1) neutral relaxed standing; 2) listening attentively with a slight head tilt; 3) speaking gently with one hand open; 4) comforting gesture with both arms extended; 5) affectionate hug-ready pose without another character; 6) sitting or kneeling to speak at a child's eye level; 7) warm laugh; 8) telling a story with expressive hands; 9) full-body back view. Keep a consistent design and clearly articulated limbs. No props or scenery required.`

**Tags sugeridas:** `idle`, `listen`, `speak_gently`, `comfort`, `hug`,
`child_level`, `laugh`, `storytelling`, `back_view`.

### 2.6. Véia --- avó geniosa

**Ficha do personagem**

-   Idade: 70 anos.
-   Sogra de Cringefather.
-   Idosa geniosa, engraçada e provocadora.
-   Vive procurando confusão com Cringefather, mas ama a família.
-   O design deve ser expressivo e cômico sem dificultar a animação.

**Prompt da ficha 3x3**

`Véia, original 70-year-old elderly woman stickman, unmistakably older through hairstyle, simple age cues and expressive posture, distinctive face and consistent simple outfit. Grumpy, funny, argumentative and deeply affectionate toward her family. Grid poses in reading order: 1) neutral standing with a skeptical expression; 2) hands on hips, challenging someone; 3) pointing a finger as if scolding Cringefather; 4) arms crossed with an unimpressed look; 5) exaggerated eye-roll; 6) loud laugh with a hand near the belly; 7) suddenly surprised; 8) warm affectionate pose with arms open; 9) full-body back view. Keep the same hairstyle, outfit, proportions and line weight across the sheet.`

**Tags sugeridas:** `idle`, `hands_on_hips`, `scold`, `arms_crossed`,
`eye_roll`, `laugh`, `surprised`, `affectionate`, `back_view`.

### 2.7. Véio --- poeta de 80 anos

**Ficha do personagem**

-   Idade: 80 anos.
-   Olhos muito grandes, elemento visual distintivo.
-   Poeta.
-   Detesta que mandem nele.
-   Deve ter gestos teatrais, poses de declamação e expressões
    dramáticas.

**Prompt da ficha 3x3**

`Véio, original 80-year-old elderly male stickman poet, very large unmistakable expressive eyes, simple elderly silhouette and a consistent, easy-to-animate outfit. Dramatic, poetic, independent and annoyed when ordered around. Grid poses in reading order: 1) neutral standing with large attentive eyes; 2) theatrical poetry-recital pose with one arm raised; 3) contemplative pose with one hand near the chin; 4) looking toward the sky dramatically; 5) indignant pose reacting to being ordered around; 6) arms crossed stubbornly; 7) heartfelt expressive declamation; 8) warm gentle smile; 9) full-body back view. Preserve the large eyes and character identity across all cells. No text or scenery.`

**Tags sugeridas:** `idle`, `recite`, `think`, `look_up`, `indignant`,
`stubborn`, `declame`, `smile`, `back_view`.

### 2.8. Paraíba --- cachorro acolhido pela família

**Ficha do personagem**

-   Animal: cachorro.
-   Foi acolhido pela família.
-   Está sempre com fome.
-   Deve ter silhueta simples, orelhas e cauda claramente
    identificáveis.
-   A estrutura de animação deverá permitir movimentos específicos de
    quadrúpede; não forçar o rig humano sobre o cachorro.

**Prompt da ficha 3x3**

`Paraíba, original cute rescued family dog in a minimalist articulated 2D stickman-inspired cartoon style. Simple recognizable dog head, floppy ears, four clearly separated articulated legs and a distinct wagging tail. Expressive eyes and an eager, lovable hungry personality. Keep fur markings, ear shape, tail and body proportions identical across all cells. Grid poses in reading order: 1) standing on all four legs, alert; 2) sniffing the ground; 3) sitting and begging for food; 4) wagging tail excitedly; 5) trotting; 6) running toward something off-frame without showing food or a setting; 7) licking lips hopefully; 8) lying down resting but still alert; 9) rear three-quarter or back view with tail visible. All four legs and tail must be readable, with no overlap between cells.`

**Tags sugeridas:** `idle`, `sniff`, `beg`, `wag_tail`, `trot`, `run`,
`lick_lips`, `lie_down`, `back_view`.

------------------------------------------------------------------------

## 3. Folhas de rosto para fala e piscadas

Criar uma folha de rosto separada para cada personagem falante. As
células devem mostrar a cabeça e os ombros, em tamanho, ângulo e posição
idênticos. Cabelos, óculos, acessórios e contorno da cabeça não podem
mudar entre células; somente olhos e boca devem variar, exceto quando
uma expressão exigir mudança facial.

**Prompt-base**

`Face sheet of [CHARACTER NAME], using the exact established stickman character design. Head and shoulders only, 3x3 grid, identical head size, angle, position and crop in every cell. Keep hair, glasses, head outline, skin/fill colors and accessories perfectly consistent. Only mouth shape and eye state change. Row 1: 1) neutral face, mouth closed; 2) mouth open in a clear A shape; 3) wide E smile showing teeth where appropriate. Row 2: 4) small rounded O mouth; 5) lips pressed together for M/B/P; 6) small rounded U mouth. Row 3: 7) eyes closed blink with neutral mouth; 8) half-closed eyes; 9) eyes wide open in surprise. Pure white background, clean high-contrast line art, 2048x2048 pixels or higher, no labels, no text, no extra heads.`

### Regras para sincronização labial

-   Confirmar no código se o sistema troca a cabeça inteira, troca
    apenas a boca ou usa outra técnica.
-   Se o sistema atual realmente substituir a cabeça inteira por célula,
    manter cabeça, cabelo e acessórios perfeitamente alinhados entre as
    nove imagens.
-   A folha de rosto não deve ser tratada como suficiente para rigging
    corporal.
-   Para BetaSon, preservar o espaço entre os dentes da frente quando a
    boca estiver aberta e os dentes forem visíveis.
-   Para Dario, priorizar formas de boca simples e expressões naturais,
    sem exagerar características associadas ao autismo.
-   Para Paraíba, criar uma folha de expressões própria para cachorro se
    houver sincronização de vocalizações ou reações.

### Tags sugeridas para rostos

`mouth_neutral`, `mouth_A`, `mouth_E`, `mouth_O`, `mouth_MBP`,
`mouth_U`, `blink`, `eyes_half_closed`, `eyes_surprised`.

------------------------------------------------------------------------

## 4. Fichas extras de poses para aulas e histórias

As fichas extras devem seguir o mesmo padrão visual, fundo branco, grade
3x3 e consistência de escala. Produzir uma ficha específica para cada
personagem quando as diferenças físicas exigirem adaptação.

**Prompt-base de poses de aula**

`[CHARACTER NAME], established original stickman character design, 3x3 grid of clearly separated classroom/storytelling poses. Keep head, hair, accessories, clothing, body proportions and line thickness consistent. Poses in reading order: 1) pointing toward an imaginary board with the right arm; 2) writing gesture toward an imaginary board, body turned slightly away; 3) arms crossed impatiently; 4) thinking with one hand near the chin; 5) laughing out loud; 6) reacting angrily without threatening gestures; 7) surprised with mouth open; 8) celebrating with both fists raised; 9) sitting in a simple neutral seated pose. No board, desk, furniture, background or text unless explicitly required by a separate prop sheet. Every pose fully inside its cell.`

### Observações por personagem

-   **Cringefather:** enfatizar explicação confiante, confusão com
    inglês e sarcasmo.
-   **BetaSon:** enfatizar a postura de quem sabe a resposta, o humor e
    a desajeitada comemoração.
-   **Dario:** adaptar os gestos à sua comunicação individual e às suas
    características, sem transformar o autismo em caricatura.
-   **Laura:** substituir ações adultas por gestos infantis,
    curiosidade, dança e participação.
-   **Erika:** priorizar escuta, acolhimento, explicação calma e
    contação de histórias.
-   **Véia:** enfatizar impaciência, provocação, bronca e afeto.
-   **Véio:** adaptar as poses para declamação, contemplação e
    indignação dramática.
-   **Paraíba:** não usar a ficha humana de aula; utilizar movimentos
    próprios de cachorro.

------------------------------------------------------------------------

## 5. Clipes comuns e reações

A ficha de sprites não precisa conter todas as animações do sistema. As
poses-base devem ser combinadas com clipes reutilizáveis sempre que a
arquitetura permitir.

### Reações compartilhadas desejadas

`happy`, `smile`, `laugh`, `sad`, `cry`, `frustrated`, `angry`,
`annoyed`, `surprised`, `scared`, `confused`, `curious`, `shy`,
`embarrassed`, `nervous`, `sleepy`, `tired`, `bored`, `relieved`,
`proud`, `celebrate`, `affectionate`, `hug`, `sarcastic`, `skeptical`,
`agree`, `disagree`, `nod`, `shake_head`, `hesitate`.

### Clipes corporais compartilhados desejados

`idle`, `walk`, `run`, `jump`, `land`, `sit`, `stand_up`, `fall`,
`recover`, `wave`, `point`, `gesture`, `explain`, `talk`, `listen`,
`turn_right`, `look_back`, `clap`, `dance`, `stumble`, `cross_arms`,
`pose`, `greet`, `hug`, `transition_pose`.

### Clipes específicos de Paraíba

`dog_idle`, `sniff`, `beg_for_food`, `wag_tail`, `trot`, `run`, `sit`,
`lie_down`, `jump`, `lick_lips`, `react_to_sound`, `sleep`.

**Requisitos de implementação**

-   Reutilizar clipes sem duplicar código.
-   Adaptar proporções e articulações ao rig de cada personagem.
-   Não aplicar automaticamente movimentos humanos a Paraíba.
-   Permitir personalizar, duplicar e salvar variantes.
-   Evitar referências quebradas quando clipes forem renomeados ou
    removidos.
-   Manter tags estáveis para que os clipes possam ser localizados e
    associados à timeline.

------------------------------------------------------------------------

## 6. Importação e estrutura dos recursos

Antes de importar novas fichas, inspecione e confirme os caminhos e
contratos reais do projeto. Os caminhos abaixo são os informados na
documentação atual e devem ser validados no repositório.

1.  Salvar cada ficha corporal no diretório de referências, seguindo a
    convenção atual. Exemplo: `referencias/Cringefather.jpg`.
2.  Salvar as folhas de rosto com uma convenção clara, por exemplo
    `referencias/rostos/Cringefather.jpg`, apenas se compatível com o
    pipeline atual.
3.  Atualizar `tools/sprites/mapa-poses.json` com cada personagem e a
    lista de tags na ordem de leitura da grade: esquerda para direita,
    de cima para baixo.
4.  Definir a altura proporcional à idade e ao design, validando como o
    sistema interpreta o campo `altura`. Para Paraíba, usar a escala
    própria de quadrúpede se o modelo de dados permitir.
5.  Atualizar `tools/sprites/rostos.json` com as âncoras do rosto ---
    olhos, boca e caixa da cabeça --- necessárias para o close e para a
    sincronização labial.
6.  Executar `node tools/sprites/gerar-sprites.mjs` somente depois de
    validar dependências, caminhos e formato esperado.
7.  Conferir os arquivos gerados em `apps/web/src/assets/personagens/` e
    o manifesto atualizado, se esses ainda forem os caminhos usados pelo
    projeto.
8.  Validar cada sprite recortado visualmente antes de aprová-lo.
9.  Testar no aplicativo: escala, orientação, transparência, tags,
    âncoras faciais, clipes, closes e exportação.

### Cuidados com compatibilidade

-   Não substituir fichas antigas sem manter cópia ou controle de
    versão.
-   Não remover o chibi até identificar todos os projetos e recursos que
    dependem dele.
-   Não modificar o formato de `mapa-poses.json`, `rostos.json` ou do
    manifesto sem atualizar os leitores e testes correspondentes.
-   Não presumir que todas as fichas possuem o mesmo número de células
    se o importador aceitar formatos diferentes.
-   Se a grade 3x3 não for suficiente para articulações independentes,
    propor um formato complementar para partes do corpo ou rig,
    preservando compatibilidade com as fichas existentes.

------------------------------------------------------------------------

## 7. Checklist de qualidade antes de aprovar uma ficha

-   [ ] Fundo branco puro.
-   [ ] Grade 3x3 alinhada e compatível com o importador.
-   [ ] Nove poses inteiras e separadas.
-   [ ] Mesma escala e proporção em todas as células.
-   [ ] Estilo stickman, sem aparência chibi.
-   [ ] Articulações visíveis e úteis para a animação.
-   [ ] Identidade visual do personagem preservada.
-   [ ] Orientação de perfil voltada para a direita.
-   [ ] Nenhuma pose cortada ou invadindo outra célula.
-   [ ] Linhas nítidas e contraste adequado.
-   [ ] Tags na ordem correta.
-   [ ] Folha de rosto alinhada, quando aplicável.
-   [ ] Âncoras faciais conferidas.
-   [ ] Importação e geração de sprites testadas.
-   [ ] Clipes e closes testados no aplicativo.
-   [ ] Recursos antigos preservados ou migrados de forma controlada.

## 8. Instrução final para o agente de programação

Antes de alterar o pipeline de sprites, inspecione
`tools/sprites/mapa-poses.json`, `tools/sprites/rostos.json`,
`tools/sprites/gerar-sprites.mjs`, o manifesto de recursos e os
componentes que consomem os sprites no aplicativo.

Apresente: 1. O contrato atual do importador e do gerador. 2. A
estrutura atual de tags, alturas, âncoras faciais e manifesto. 3. As
adaptações necessárias para os oito personagens oficiais e personagens
futuros. 4. Como oferecer suporte ao rig articulado e ao cachorro sem
quebrar os personagens humanos. 5. Como migrar do chibi para stickman
sem perder projetos existentes. 6. Os testes que serão executados.

Implemente as mudanças em etapas pequenas e verificáveis. Não presuma
que os caminhos ou comportamentos descritos neste documento continuam
válidos sem conferi-los no código. Não apague arquivos nem altere
formatos de projeto de forma destrutiva.
