# Guia de Referência de Prompts para Geração de Personagens

Este documento serve como um sistema de referência visual para garantir a consistência dos personagens em diferentes poses, expressões e cenas ao usar geradores de imagem via IA.

---

## 🎨 Estilo Geral da Arte (Global Prompt Modifier)

Para manter a consistência estética em todas as imagens, inclua este trecho no início ou final do seu prompt:

> **Estilo Global:** `2D cartoon character sheet style, clean line art, flat colors, vibrant shading, Western animation design, Rick & Morty and Gravity Falls inspired art style, white background.`

---

## 👨‍🏫 1. CRINGE FATHER (Pai - 40 anos)

### 📋 Perfil Visual
* **Idade:** 40 anos
* **Aparência:** Homem magro, alto, com jaleco branco de laboratório sobre camiseta preta (com símbolos/fórmulas de física), calças marrons e sapatos escuros. Cabelo grisalho (mais preto do que branco) espetado, traços marcantes, olhar sarcástico e expressão geralmente cética.
* **Personalidade/Vibe:** Professor genial de Física/Matemática, sarcástico, excêntrico, obcecado por lógica.

### 🔤 Prompt Base de Referência
```text
Cringe Father, 40-year-old brilliant physics professor, tall and lean build, spiky messy grey hair, wearing an open white lab coat over a black t-shirt with white physics symbols, brown trousers, dark shoes, sarcastic expression, 2D cartoon style.
```

### 🎬 Exemplos de Poses e Ações
* **Lecionando:** `Cringe Father pointing intensely at a chalkboard covered in complex math and physics formulas, furious excited expression.`
* **Desconfiado/Sarcástico:** `Cringe Father with crossed arms, one eyebrow raised, smirking skepticamente at the camera.`
* **Desastre no Laboratório:** `Cringe Father sitting at a messy desk with smoking test tubes, holds a sheet of paper with an alarmed face, cables wrapped around him.`

---

## 👦 2. BETA SON (Filho - 11 anos)

### 📋 Perfil Visual
* **Idade:** 11 anos
* **Aparência:** Garoto de pele clara, magrelo, cabelos castanho-escuros encaracolados/ondulados, óculos de grau arredondados. Veste moletom verde-escuro com capuz (com estampa de ET/Alien), bermuda bege e tênis avermelhado.
* **Personalidade/Vibe:** Divertido, brincalhão, desastre em exatas, mas fluente em inglês e ligado em tecnologia/jogos.

### 🔤 Prompt Base de Referência
```text
Beta Son, 11-year-old light-skinned boy, dark brown curly wavy hair, round eyeglasses, wearing a dark green hoodie with a green alien face print, beige cargo shorts, red and white sneakers, cheerful expressiveness, 2D cartoon style.
```

### 🎬 Exemplos de Poses e Ações
* **Andando de Skate:** `Beta Son riding a skateboard on a ramp, excited screaming expression, arms open for balance.`
* **Jogando videogame:** `Beta Son sitting on a bench next to a friend, holding a handheld game console, focused happy expression.`
* **Apresentando Projeto:** `Beta Son standing next to a toy space rocket model, smiling proudly, gesturing with his hand while speaking.`

---

## 🧩 3. DARIO (Filho Caçula - 7 anos)

### 📋 Perfil Visual
* **Idade:** 7 anos
* **Aparência:** Menino pequeno, olhos expressivos, cabelo preto liso. Veste casaco azul de capuz com estampa de dinossauro (T-Rex verde), calças jeans escuras e tênis azuis.
* **Personalidade/Vibe:** Autista, quieto, muito focado em atividades visuais, montagens e padrões.

### 🔤 Prompt Base de Referência
```text
Dario, 7-year-old small boy, smooth black hair, wide expressive eyes, wearing a blue hoodie with a cute green dinosaur graphics on front, dark blue jeans, blue sneakers, calm and focused expression, 2D cartoon style.
```

### 🎬 Exemplos de Poses e Ações
* **Equilíbrio/Brincadeira:** `Dario carefully walking on a wooden balance beam over colorful sensory stones, arms out for stability.`
* **Construção:** `Dario sitting on the floor surrounded by colorful magnetic building blocks, carefully placing a piece on a tall structure.`
* **Químico/Quimera:** `Dario building a 3D molecular structure model on a desk, deeply focused with a calm smile.`

---

## 👧 4. LAURA (Filha - 5 anos)

### 📋 Perfil Visual
* **Idade:** 5 anos
* **Aparência:** Menina radiante, cabelos castanho-claros longos em penteado maria-chiquinha com laços cor-de-rosa. Veste vestido rosa simples, meias brancas e sapatos pretos.
* **Personalidade/Vibe:** Muito sapeca, enérgica, brincalhona, expressiva e carinhosa.

### 🔤 Prompt Base de Referência
```text
Laura, 8-year-old energetic girl, long light brown hair tied in pigtails with pink bows, wearing a short pink dress, white socks, black mary jane shoes, playful mischievous grin, 2D cartoon style.
```

### 🎬 Exemplos de Poses e Ações
* **Pulando Corda:** `Laura jumping rope happily in the air, dynamic pose, smiling wide.`
* **No Balanço:** `Laura swinging high on a tire swing attached to a big tree, laughing enthusiastically.`
* **Relaxando:** `Laura lying under a cozy blanket on the floor next to a sleeping cat, reading an open storybook with a flashlight.`

---

## 👩‍⚕️ 5. ERIKA (Mãe - 30 anos)

### 📋 Perfil Visual
* **Idade:** 30 anos
* **Aparência:** Mulher de pele morena clara, óculos de grau finos, cabelos pretos longos e lisos. Veste roupa estilo ripster/boho chique: blusa de gola alta preta, saia longa marrom/terracota e sapatos escuros.
* **Personalidade/Vibe:** Psicóloga, acolhedora, serena, postura elegante e profissional.

### 🔤 Prompt Base de Referência
```text
Erika, 30-year-old woman, light brown skin tone, dark sleek long black hair, eyeglasses, wearing a black fitted turtleneck top and a long flowy terracotta brown skirt, calm empathetic expression, therapist vibe, 2D cartoon style.
```

### 🎬 Exemplos de Poses e Ações
* **Consultório/Atendimento:** `Erika sitting comfortably on an armchair with a clipboard and pen, listening attentively with a warm smile.`
* **Meditação/Acolhimento:** `Erika sitting cross-legged on the floor guiding a group of kids in a calm meditation session, hands raised gently.`
* **Multitask:** `Erika sitting at a coffee table holding a warm mug while talking on her phone, taking notes in a notebook.`

---

## 💡 Dicas de Implementação para LLMs/Midjourney/DALL-E

1. **Combinação de Personagens:** Para juntar personagens na mesma cena, combine os trechos de referência usando conectivos espaciais (ex: `Cringe Father standing on the left pointing at a board, while Beta Son sits on the right playing on a tablet...`).
2. **Consistência de Cores:** Se a ferramenta fugir das paletas originais, especifique as cores usando códigos ou nomes precisos (`#4A6B82` para o casaco do Dario, rosa choque para a Laura, etc).
3. **Manutenção do Traço:** Lembre-se de reitera o estilo (`2D cartoon character design, vector art style`) no final de cada prompt para evitar que a IA renderize os personagens em 3D ou fotorrealismo.