# Stickman Visual Bible — Especificação Visual Unificada

**Versão:** 1.0.0  
**Data:** 21 de Outubro de 2026  
**Sistema:** StickBoard (Animação Vetorial Whiteboard Stickman)  
**Status:** Documento Normativo Central

---

## 1. Princípios Fundamentais do Universo Stickman

O universo visual do **StickBoard** baseia-se na estética de animação de lousa branca (*whiteboard animation / lineart*):
1. **Fundo**: Branco puro (`#ffffff`) ou levemente texturizado de quadro branco escolar.
2. **Traço Principal**: Nanquim escuro uniforme (`#14161a`), com espessura base de traço de 2.4px a 3.2px (escalonável por proporção).
3. **Preenchimento dos Corpos**: Branco opaco (`#ffffff`) com contorno duplo (*rubber-hose / tubo*), garantindo oclusão limpa de membros dianteiros sobre troncos e membros traseiros sem transparências acidentais.
4. **Cores de Destaque (Color Accent)**:
   - Reservadas para adereços icônicos e roupas temáticas de cada personagem (ex.: vermelho floral da Erika, azul céu do raio da Carol, amarelo dourado da medalha do Paraíba, etc.).
   - Mantêm contraste elevado sobre o traço preto.
5. **Terminais e Juntas**:
   - `stroke-linecap="round"` e `stroke-linejoin="round"`.
   - Juntas orgânicas que não quebram ao flexionar joelhos, cotovelos e punhos.

---

## 2. Proporções Anatômicas e Cânone

| Categoria | Altura Canônica (px) | Relação Cabeça / Corpo | Raio da Cabeça (px) | Largura do Ombro (px) | Comprimento do Tronco (px) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Adulto Alto** (CringeFather, Erika) | 560 – 580 px | 1 : 4.5 | 33 – 36 px | 27 – 30 px | 135 – 140 px |
| **Adulto Maduro / Idoso** (Elizendra, Véia, Véio) | 480 – 510 px | 1 : 4.0 | 33 – 35 px | 25 – 28 px | 115 – 125 px |
| **Jovem / Pré-Adolescente** (BetaSon, Carol, Artur) | 430 – 475 px | 1 : 3.5 | 33 – 36 px | 25 – 32 px | 105 – 115 px |
| **Criança** (Dario, Laura) | 285 – 340 px | 1 : 2.8 | 30 – 32 px | 20 – 22 px | 70 – 85 px |
| **Pet Quadrúpede** (Paraíba cão, Mingau gato) | 175 – 210 px | 1 : 2.0 (horizontal) | 26 – 28 px | 22 – 24 px | 50 – 65 px |

---

## 3. Inventário Canônico dos 12 Personagens

### 1. CringeFather (`cringefather`)
- **Papel**: Pai e professor de ciências/física.
- **Visual**: Alto, esguio, cabelo grisalho espetado em pontas dinâmicas, óculos retangulares pretos, postura de professor ligeiramente curvado sobre o livro/quadro.
- **Vestuário**: Jaleco longo de laboratório com lapelas anguladas, fenda traseira, camisa social por baixo com gravata escura, bolso superior com 3 canetas coloridas e leve mancha de café na barra. Calça social com vinco e sapatos sociais pretos.
- **Voz/Linguagem**: Sarcástico, irônico, didático, eloquente.

### 2. BetaSon (`betason`)
- **Papel**: Filho mais velho, narrador/estudante.
- **Visual**: Pré-adolescente descolado, cabelo castanho cacheado volumoso, óculos redondos de aro médio, sorriso simpático com dentes separados.
- **Vestuário**: Camiseta streetwear folgada com emblema de cabeça de alienígena no peito, fone de ouvido pendurado no pescoço, calça jeans com remendo retangular no joelho e tênis de skate com biqueira de borracha branca.
- **Voz/Linguagem**: Bem-humorado, expressivo, confuso com matemática, fã de games.

### 3. Erika (`erika`)
- **Papel**: Mãe e psicóloga.
- **Visual**: Mais alta que o CringeFather, postura elegante e graciosa, longos cabelos pretos escorridos até a cintura, óculos ovais finos sem aro pesado, cílios delicados.
- **Vestuário**: Vestido longo boêmio (estilo boho) com decote transpassado em V, pequenas flores bordadas, barra com babado ondulado, pulseiras no punho e sandálias com tiras de tornozelo.
- **Voz/Linguagem**: Serena, apaziguadora, firme, acolhedora.

### 4. Dario (`dario`)
- **Papel**: Filho caçula, menino autista de raciocínio lógico brilhante.
- **Visual**: Menino pequeno, cabelo liso em corte tigelinha com mechas na testa, olhos atentos e expressivos, sorriso meigo.
- **Vestuário**: Moletom/camiseta com crista dorsal de dinossauro ou raio estilizado, bermuda cargo com bolsos utilitários nas laterais e tênis esportivo tratorado.
- **Voz/Linguagem**: Focado em padrões, curioso, direto, sincero.

### 5. Laura (`laura`)
- **Papel**: Caçulinha da família, inteligente e sapeca.
- **Visual**: Menininha de 5 anos, maria-chiquinha dupla volumosa amarrada com laços cor-de-rosa, cílios expressivos, olhar maroto.
- **Vestuário**: Jaqueta esportiva com zíper central e coração estilizado no peito, calça legging esportiva com faixas laterais duplas, band-aid fofo no joelho e sapatilhas/tênis de cano médio.
- **Voz/Linguagem**: Rápida no raciocínio, questionadora, brincalhona.

### 6. Elizendra (`elizendra`)
- **Papel**: Avó amorosa, alegre e atrapalhada na cozinha.
- **Visual**: Senhora acolhedora, cabelo grisalho volumoso preso com grampos decorativos nas têmporas, óculos de leitura com correntinha pendurada.
- **Vestuário**: Vestido clássico de vovó coberto por um avental florido de cozinheira, bolso central com uma colher de pau de madeira saindo para fora, laço amarrado na cintura e sapatilhas confortáveis.
- **Voz/Linguagem**: Carinhosa, preocupada com a comida, divertida, fofoqueira do bem.

### 7. Artur (`artur`)
- **Papel**: Melhor amigo gamer de BetaSon.
- **Visual**: Garoto robusto e cheinho, cabelo liso curto com franja reta, óculos quadrados estilo gamer.
- **Vestuário**: Camiseta gamer com estampa de controle de videogame clássico (D-Pad em cruz e botões coloridos), bermuda jeans folgada e tênis chunky.
- **Voz/Linguagem**: Gírias da internet, focado em estratégias de jogos, leal, piadista.

### 8. Carol (`carol`)
- **Papel**: Amiga de escola de BetaSon e Laura.
- **Visual**: Menina alta e magricela, rabo de cavalo longo puxado alto com elástico azul, olhar confiante e atitude descolada.
- **Vestuário**: Blusa cropped ou polo moderna, saia plissada rodada com caimento fluido, meias 3/4 e calçados casuais.
- **Voz/Linguagem**: Empoderada, articulada, líder de grupo, sarcástica amigável.

### 9. Véia (`veia`)
- **Papel**: Sogra geniosa de CringeFather.
- **Visual**: Senhora de 70 anos de baixa estatura, coque alto clássico com mechas soltas, sobrancelhas arqueadas expressivas e olhar afiado.
- **Vestuário**: Cardigan de tricô aconchegante com xale de franjas sobre os ombros, colar de pérolas, saia longa rodada com pregas e sapatos ortopédicos pretos.
- **Voz/Linguagem**: Implicante bem-humorada com o genro, opinativa, defensora dos netos.

### 10. Véio (`veio`)
- **Papel**: Sogro de CringeFather, poeta e boêmio.
- **Visual**: Senhor elegante de 80 anos, careca no topo com tufos de cabelo branco encaracolado nas laterais, bigode farto arrebitado e olhos grandes teatrais.
- **Vestuário**: Colete de alfaiataria em tweed com botões metálicos, gravata borboleta preta, corrente dourada de relógio de bolso curvada na lapela, calça de alfaiataria e sapatos oxford.
- **Voz/Linguagem**: Declamatório, poético, teimoso, filosófico.

### 11. Paraíba (`paraiba`)
- **Papel**: Cão vira-lata caramelo da família.
- **Visual**: Anatomia quadrúpede canina stickman, orelhas caídas triangulares bem expressivas, focinho volumoso com trufa preta, rabo curvado para cima que abana em ciclos harmônicos, 4 patas com marcação de almofadas plantares.
- **Acessório**: Coleira vermelha vibrante com medalha dourada gravada.
- **Voz/Comportamento**: Latidos gráficos balão, farejando, pulando de alegria, pedindo petisco.

### 12. Mingau (`mingau`)
- **Papel**: Gato angorá / tigrado manhoso da casa.
- **Visual**: Anatomia quadrúpede felina esguia, orelhas triangulares pontudas alertas, focinho felino delicado com 6 bigodes curvados, cauda longa em curva sinuosa que oscila lentamente, 4 patinhas macias.
- **Acessório**: Coleira azul com guizo dourado esférico.
- **Voz/Comportamento**: Miados dengosos, espreguiçando-se, observando tudo do alto dos móveis ou bancadas.

---

## 4. Diretrizes Visuais dos 5 Formatos de Produção

### 4.1. Podcast (`podcast`)
- **Composição**: Bancada acústica horizontal com bordas chanfradas, microfones profissionais de estúdio montados em braços articulados pantográficos vermelhos/pretos com shockmounts, fones de estúdio nos personagens (com arco sobre a cabeça ou descansando no pescoço), canecas de café personalizadas sobre a mesa.
- **Personagens**: Posição sentada ereta ou inclinada sobre a bancada, gestos de mão próximos ao microfone, olhares cruzados entre apresentador e convidado.

### 4.2. Telejornal (`telejornal`)
- **Composição**: Bancada moderna de apresentação jornalística com frente em acrílico iluminado, telão digital ao fundo para gráficos e manchetes (*Drops da Semana*), barra de letreiro inferior (*ticker*) com manchetes em caixa alta.
- **Personagens**: Apresentador focado na câmera, olhar direto para o público ou em ângulo de 3/4 apontando para o telão de notícias. Postura ereta e confiante.

### 4.3. Debate (`debate`)
- **Composição**: Mesa ampla de debate com divisórias individuais ou tribunas com identificação nominal dos participantes, microfones de haste flexível de mesa com anel luminoso de fala, temporizador digital de réplica/tréplica e cadeira central elevada para o mediador.
- **Personagens**: Poses com forte intenção argumentativa (apontando argumento, gesticulando com as palmas abertas, expressando dúvida ou contestação, ouvindo com sobrancelha franzida).

### 4.4. Papo Livre (`livre` / `papo_livre`)
- **Composição**: Lounge descontraído com poltronas confortáveis com almofadas, mesa de centro baixa de madeira com xícaras/copos, luminária de chão retrô e planta ornamental de estúdio.
- **Personagens**: Poses naturais de conversa espontânea — sentados descontraídos, inclinados para a frente rindo, contando causos, gesticulando livremente com os braços.

### 4.5. Quadro de Aula (`aula` / `quadro_aula`)
- **Composição**: Lousa clássica de quadro branco com moldura de alumínio reforçada, suporte inferior para marcadores coloridos e apagador, régua graduada de madeira encostada e mesa do professor ao lado.
- **Personagens**: Professor de pé explicando ativamente com o corpo direcionado entre o quadro e os alunos, alunos sentados ouvindo, anotando, levantando a mão para tirar dúvidas ou comemorando o acerto.
