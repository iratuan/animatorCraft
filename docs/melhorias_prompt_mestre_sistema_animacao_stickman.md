# PROMPT MESTRE — AUDITORIA, REFATORAÇÃO E EVOLUÇÃO DO STICKBOARD
## Estúdio de animação 2D multiformato com personagens stickman

> **Instrução de uso:** execute este prompt na raiz do repositório do StickBoard usando o agente de codificação com acesso ao projeto. O prompt define objetivos e critérios; ele não autoriza reescrever o sistema inteiro sem auditoria, apagar recursos ou declarar funcionalidades concluídas sem validação real.

---

# 1. PAPEL, MISSÃO E RESPONSABILIDADE

Atue como uma equipe técnica experiente, reunindo as competências de:

- Arquiteto de software e engenheiro de refatoração;
- Desenvolvedor sênior da stack identificada no repositório;
- Especialista em interfaces profissionais de edição visual (UX/UI);
- Engenheiro de animação 2D, timeline e composição de cenas;
- Especialista em modelos de dados, migração e compatibilidade;
- Engenheiro de testes, qualidade e diagnóstico de desempenho;
- Designer técnico de personagens stickman, sprites, poses e clipes.

Sua missão é **auditar, planejar, refatorar e evoluir o StickBoard existente** para que ele se torne um estúdio de produção e animação 2D modular, profissional, extensível e multiformato.

Não presuma que o sistema seja novo. Não presuma frameworks, estrutura de pastas, APIs, esquemas, formatos de arquivo ou capacidades que não estejam confirmados no repositório. Descubra a realidade do projeto antes de decidir como alterá-lo.

## Princípio central

**O StickBoard deixa de ser um programa centrado exclusivamente em uma lousa e passa a permitir a criação de produções com vários cenários, formatos e cenas.** A lousa continua disponível como um cenário/elemento opcional, mas não deve ser uma dependência obrigatória do palco, do projeto ou do motor de animação.

A evolução deve ser incremental, rastreável, testável e reversível. Preserve o que funciona. Não faça uma reescrita ampla apenas para impor uma arquitetura idealizada.

---

# 2. REGRAS INEGOCIÁVEIS DE TRABALHO

1. **Audite antes de editar.** Inspecione repositório, documentação, arquivos de configuração, dependências, testes, scripts, modelos de dados e fluxos de execução.
2. **Comece em modo de leitura.** Na primeira etapa, não altere arquivos. Entregue a auditoria e o plano antes de iniciar a implementação.
3. **Confirme tudo no código.** Não invente nomes de arquivos, componentes, funções, rotas, formatos ou comportamentos.
4. **Preserve funcionalidades existentes**, exceto quando este documento solicitar explicitamente uma mudança.
5. **Não destrua nem sobrescreva dados do usuário silenciosamente.** Não apague assets, projetos, sprites, clipes ou formatos antigos sem inventariar dependências e definir uma migração segura.
6. **Não remova recursos chibi de forma abrupta.** O destino visual de novos recursos e do sistema principal é stickman, mas primeiro identifique projetos e assets antigos dependentes do estilo chibi. Defina migração ou compatibilidade temporária conforme a arquitetura permitir.
7. **Não crie funcionalidades falsas.** Não apresente controles decorativos como funcionais, não simule gravação de áudio se não houver gravação real e não afirme que há câmeras/cortes reais se o motor só alterar escala ou posição.
8. **Não introduza dependências novas sem justificativa.** Avalie custo, compatibilidade, segurança, manutenção e alternativas existentes.
9. **Não duplique lógica.** Prefira componentes, dados e comportamentos compartilhados e configuráveis.
10. **Mantenha as alterações pequenas e coerentes.** Cada etapa deve ter objetivo, arquivos afetados, testes, critérios de aceite e possibilidade de revisão.
11. **Teste o que mudar.** Execute testes existentes e acrescente testes para comportamentos novos ou alterados. Informe exatamente quais comandos foram executados e seus resultados reais.
12. **Não declare testes aprovados se não foram executados.** Se um teste não puder ser realizado, explique o motivo e a lacuna que permanece.
13. **Proteja dados e credenciais.** Não exponha segredos em logs, relatórios, prompts, exemplos ou arquivos gerados. Não envie código ou dados para serviços externos sem autorização explícita.
14. **Respeite os padrões existentes** de linguagem, formatação, lint, arquitetura, nomenclatura e convenções, salvo quando houver motivo técnico documentado para alterá-los.
15. **Não trate a lousa como pressuposto obrigatório.** Recursos de cenário devem ser reutilizáveis ou configuráveis quando tecnicamente viável.
16. **Não crie abstrações antes de entender as existentes.** Compare os conceitos atuais com os propostos e evolua o modelo existente quando isso for mais seguro.
17. **Não altere arquivos fora do escopo sem explicar a necessidade.** Não faça limpeza incidental ou reformatação em massa que torne a revisão difícil.
18. **Considere acessibilidade e usabilidade** nas decisões de interface: foco de teclado, contraste, feedback de estado, áreas clicáveis e mensagens de erro compreensíveis.
19. **Use evidências.** Vincule conclusões importantes a arquivos, funções, modelos, testes ou comandos concretos encontrados no repositório.
20. **Pare em bloqueios reais.** Se faltar informação indispensável, faça uma pergunta objetiva. Se for possível seguir com uma escolha conservadora, registre a decisão e avance.

---

# 3. VISÃO DO PRODUTO

Transformar o StickBoard em um **estúdio de produção 2D centrado em personagens stickman**, capaz de organizar produções em cenas, cenários, personagens, objetos, falas, trilhas de áudio, enquadramentos e clipes.

O produto deve permitir:

- Criar, abrir, salvar, duplicar e exportar projetos;
- Organizar uma produção com uma ou várias cenas;
- Escolher um formato inicial de produção sem ficar preso a ele;
- Escolher, duplicar, editar e cadastrar cenários;
- Adicionar personagens e objetos ao palco;
- Posicionar, redimensionar e transformar os elementos;
- Animar vários personagens simultaneamente;
- Compor ações compatíveis no mesmo personagem;
- Editar e reposicionar clipes e falas na timeline;
- Visualizar e testar a cena em tela cheia;
- Gerar um roteiro de gravação a partir das falas e dos tempos;
- Gerenciar sprites, partes articuladas, expressões, reações e clipes;
- Personalizar recursos sem exigir alteração do código para ajustes comuns;
- Exportar os formatos efetivamente suportados pelo motor;
- Adicionar novos formatos e cenários sem reescrever o núcleo sempre que possível.

## 3.1. Conceitos que precisam ficar separados

Use os conceitos abaixo como guia conceitual, não como obrigação de criar classes ou arquivos com estes nomes. Primeiro avalie o modelo existente.

- **Projeto:** arquivo/unidade principal que contém a produção, suas configurações e cenas.
- **Formato de produção:** modelo inicial e conjunto de convenções para determinado tipo de conteúdo.
- **Cenário:** ambiente visual reutilizável.
- **Cena:** unidade editável da produção, com cenário, elenco, objetos, falas, ações, duração e composição.
- **Personagem/ator:** entidade animável com identidade visual, partes, poses, expressões e clipes.
- **Objeto/prop:** elemento de cena, como bancada, microfone, cadeira, lousa, tela, púlpito ou cartão de notícia.
- **Enquadramento/câmera:** representação da área visual escolhida para mostrar a cena, apenas conforme a capacidade real do motor.
- **Timeline:** estrutura temporal que organiza ações, falas, áudio, movimentos, transições e outros eventos.
- **Biblioteca de recursos:** conjunto reutilizável de personagens, cenários, objetos, sprites, reações, clipes e modelos.
- **Roteiro de gravação:** documento derivado das falas e dos tempos, destinado a orientar a gravação de voz.

Um formato deve ser um **modelo inicial configurável**, e não uma prisão. Após escolher “Podcast”, por exemplo, o usuário deve continuar podendo mudar o cenário, o elenco, os objetos, os enquadramentos e a sequência de cenas.

---

# 4. FORMATOS E CENÁRIOS INICIAIS

Os seguintes formatos devem ser contemplados no planejamento e, após a auditoria, implementados conforme as dependências e prioridades.

## 4.1. Formato Aula

Finalidade: produzir aulas, explicações e conteúdos didáticos.

Possíveis elementos:
- Sala de aula ou fundo educacional;
- Lousa opcional;
- Professor, aluno ou grupo;
- Área legível para texto e ilustrações;
- Falas, gestos explicativos e reações;
- Enquadramentos adequados para mostrar o apresentador ou o conteúdo.

A lousa não deve ser obrigatória. O formato Aula deve ser uma configuração que reutiliza as mesmas capacidades fundamentais do sistema.

## 4.2. Formato Gravação de Podcast

Finalidade: representar visualmente personagens gravando ou participando de um podcast.

Requisitos visuais e funcionais:
- Cenário de estúdio com bancada ou mesa;
- Personagens sentados ou posicionados atrás/ao redor da bancada;
- Microfones visíveis e posicionados adequadamente;
- Possibilidade de variar o número de participantes, sem codificar um número fixo;
- Posições iniciais sugeridas para assentos e participantes;
- Relação visual entre participante e microfone, quando o modelo de objetos permitir;
- Falas com personagem, texto e tempos;
- Alternância de quem fala, escuta, reage, interrompe ou ri;
- Possibilidade de ações simultâneas compatíveis, como falar enquanto gesticula ou escutar enquanto reage;
- Enquadramento conjunto e closes individuais, quando suportados;
- Elementos de apoio, como fones, braços articulados de microfone, copos ou equipamentos, se viáveis e coerentes com a biblioteca de objetos.

Não presumir que o sistema grava áudio real. Distinguir entre:
1. representação visual de uma gravação;
2. geração de roteiro de gravação;
3. reprodução/importação de áudio, se existir;
4. captura/gravação real de áudio, somente se implementada e testada.

## 4.3. Formato Telejornal — Drops da Semana

Finalidade: criar vídeos curtos de apresentação de notícias ou resumo semanal.

Requisitos visuais e funcionais:
- Cenário de telejornal, redação ou estúdio de notícias;
- Apresentador em posição adequada para falar diretamente ao público;
- Área para título, manchete, chamada ou identificação do segmento;
- Possibilidade de cartões visuais, imagens ou elementos de apoio;
- Estrutura opcional de abertura, segmentos de notícias, transições e encerramento;
- Falas, pausas e tempos organizados na timeline;
- Possibilidade de mudar o enquadramento para mostrar apresentador ou material visual, conforme as capacidades reais do motor;
- Elementos e textos devem ser editáveis e manter legibilidade na área de saída.

Não fixar o conteúdo do Drops da Semana em um roteiro rígido. O modelo pode sugerir uma estrutura inicial, mas deve permitir adicionar, remover, reordenar e editar segmentos.

## 4.4. Formatos futuros

A arquitetura deve facilitar a inclusão de formatos como entrevista, debate, história encenada, apresentação institucional, tutorial, programa de perguntas e respostas ou outros conteúdos. Esses exemplos são possibilidades de extensibilidade, não exigências de implementação imediata.

## 4.5. Biblioteca de cenários

Planejar uma biblioteca inicial que contemple:
- Sala de aula/ambiente com lousa;
- Estúdio de podcast com bancada e microfones;
- Estúdio de telejornal/redação para Drops da Semana;
- Cenário neutro ou vazio para composição personalizada.

Permitir selecionar, duplicar, personalizar e, quando viável, cadastrar cenários. Um cenário pode conter fundo, elementos visuais, mobiliário, objetos, posições sugeridas, áreas seguras para texto e configurações de composição. Não presuma que todos esses recursos já existam: audite e planeje sua introdução incremental.

---

# 5. MODELO DE CENAS, OBJETOS E COMPOSIÇÃO

## RF-ARCH-01 — Projetos com várias cenas

Avalie se o modelo atual já suporta múltiplas cenas. Se não suportar, planeje a evolução do modelo de projeto para conter uma sequência de cenas com ordem, identificação e configurações próprias.

Critérios:
- Criar, renomear, duplicar, reordenar e excluir cenas;
- Avisar antes de excluir conteúdo relevante;
- Preservar cenas ao salvar e carregar;
- Permitir que cenas usem cenários diferentes;
- Evitar duplicar recursos compartilhados desnecessariamente;
- Garantir que duplicar uma cena crie uma cópia independente dos dados editáveis;
- Definir uma estratégia de migração para projetos antigos que só contenham uma cena ou não tenham cenário explícito.

## RF-ARCH-02 — Posicionamento de atores e objetos

Permitir adicionar, selecionar, mover, redimensionar e, quando aplicável, rotacionar personagens e objetos no palco. Exibir seleção e transformações com feedback claro.

Os cenários podem fornecer posições sugeridas ou pontos de encaixe, como:
- assentos ao redor de uma bancada;
- posição de apresentador;
- lugar de convidado;
- área diante de uma lousa;
- posição de tela/cartão de notícia.

Esses pontos são facilitadores, não bloqueios ao posicionamento manual. Diferenciar vínculo visual de interação funcional: posicionar um microfone próximo de um personagem não significa, por si só, que exista simulação física ou captura de áudio.

## RF-ARCH-03 — Enquadramento e transições

Auditar o motor atual para identificar se há câmera, zoom, pan, recorte ou apenas um palco estático.

Se houver suporte ou se a implementação for viável:
- Criar presets de enquadramento reutilizáveis, como plano geral, plano médio, close e plano de apresentador;
- Permitir definir mudanças de enquadramento na timeline;
- Suportar transições visuais adequadas à arquitetura;
- Preservar a proporção de saída;
- Evitar que texto, balões ou elementos essenciais fiquem fora da área visível.

Se o motor não tiver câmera real, proponha a solução incremental mais adequada e descreva precisamente seus limites. Não chame uma simples mudança de escala de “câmera” sem esclarecer o comportamento.

## RF-ARCH-04 — Modelos reutilizáveis

Permitir salvar uma configuração como modelo reutilizável quando tecnicamente viável: formato, cenário, disposição inicial, elenco, objetos e estrutura de segmentos.

Modelos e recursos compartilhados devem ter referências estáveis e estratégia de versão/migração. Editar uma produção derivada não deve modificar o modelo original sem confirmação explícita.

---

# 6. INTERFACE E EXPERIÊNCIA DE USO (UX/UI)

## RF-UX-01 — Layout profissional e adaptável

Audite a interface antes de mudar sua organização. Use como referência, adaptando à tecnologia existente:
- Menu superior: **Arquivo, Editar, Exportar, Ajuda**;
- Barra principal com ações frequentes;
- Biblioteca lateral com personagens, cenários, objetos, sprites, reações e clipes;
- Palco central para visualizar e editar a cena;
- Painel de propriedades do elemento selecionado;
- Timeline inferior com trilhas, ações e indicador de tempo;
- Barra de status com tempo atual, duração, zoom, seleção e estado do projeto;
- Acesso claro à seleção do formato, do cenário e à navegação entre cenas.

Não imponha esse layout se a auditoria indicar uma estrutura melhor. A referência não deve causar duplicação de controles nem ocultar ações importantes.

## RF-UX-02 — Painéis redimensionáveis

Permitir redimensionar painéis com divisores arrastáveis, respeitando dimensões mínimas/máximas e mantendo os controles essenciais acessíveis. Preservar preferências de layout entre sessões se isso for compatível com a arquitetura.

## RF-UX-03 — Rolagem independente

Cada painel deve rolar independentemente. Rolar a biblioteca não deve deslocar o palco ou a timeline acidentalmente.

## RF-UX-04 — Palco em tela cheia

Disponibilizar modo de visualização em tela cheia para testar a produção. Preservar proporção, enquadramento e estado da reprodução; permitir retorno seguro ao editor sem perda de dados.

## RF-UX-05 — Barras e estados

Profissionalizar barras principal, secundária e de status. A barra secundária deve refletir a seleção e o contexto. Fornecer estados visuais claros para seleção, arraste, reprodução, salvamento, exportação, erro e alterações não salvas.

## RF-UX-06 — Menus

Organizar as ações em:
- **Arquivo:** novo, abrir, salvar, salvar como, gerenciar projetos quando aplicável;
- **Editar:** desfazer, refazer, copiar, colar, duplicar, excluir, selecionar tudo e preferências;
- **Exportar:** animação, projeto, sprites, clipes e roteiro de gravação, apenas nos formatos suportados;
- **Ajuda:** tutorial, manual visual, atalhos, dicas, versão e diagnóstico quando aplicável.

Ações contextuais podem existir em menus de contexto, sem confundir a organização principal.

## RF-UX-07 — Tooltips e ajuda ilustrada

Ao passar o cursor sobre botão, ícone ou ferramenta, exibir nome, explicação curta e atalho, quando existir. Usar atraso breve. Explicar controles desabilitados quando a razão não for óbvia.

Criar ajuda contextual com capturas reais e atuais da aplicação, instruindo sobre:
- criação, abertura e salvamento de projetos;
- escolha de formato e cenário;
- criação e navegação entre cenas;
- inclusão e posicionamento de personagens/objetos;
- uso da timeline;
- edição de sprites e clipes;
- geração do roteiro de gravação;
- tela cheia e exportação.

Não criar capturas fictícias. Se a automação de captura não existir, documente como elas serão obtidas.

## RF-UX-08 — Feedback, acessibilidade e segurança de edição

- Fornecer feedback compreensível para ações concluídas e falhas;
- Confirmar exclusões importantes;
- Alertar sobre alterações não salvas;
- Oferecer atalhos para ações frequentes e documentá-los;
- Respeitar foco de teclado e contraste;
- Evitar modais desnecessários;
- Tornar estados de erro recuperáveis sempre que possível.

---

# 7. PERSONAGENS STICKMAN, SPRITES E IDENTIDADE VISUAL

## RF-CHAR-01 — Direção visual

O destino visual principal é **stickman articulado**, com linguagem visual consistente e identidade individual reconhecível. Não gerar novas folhas chibi para o fluxo principal. Antes de remover ou substituir recursos chibi existentes, mapear dependências e planejar compatibilidade/migração.

Não copiar diretamente o estilo de uma série protegida específica. Use descrições genéricas de humor, desenho 2D, formas expressivas e personalidade visual.

## RF-CHAR-02 — Estrutura articulada

Auditar como o sistema representa sprites, poses e partes do corpo. O objetivo é permitir que cabeça, tronco, braços e pernas sejam articulados de forma independente quando tecnicamente viável, com acessórios e elementos distintivos separados sempre que fizer sentido.

Uma folha de poses não equivale automaticamente a um rig articulado. Se o sistema atual usa imagens inteiras, planeje a evolução sem afirmar que há articulação real até que o recurso exista e tenha sido testado.

## RF-CHAR-03 — Editor visual de recursos

Quando viável, permitir editar sem alterar código:
- posição, escala e rotação;
- espessura de linha e cores;
- acessórios e elementos distintivos;
- expressões e poses;
- parâmetros de clipes e transições.

Personalizar um recurso numa produção não deve alterar o original compartilhado, salvo quando o usuário escolher explicitamente editar o recurso original.

## RF-CHAR-04 — Cadastro extensível

Permitir adicionar personagens com nome, descrição, aparência, estrutura corporal, acessórios, sprites, expressões, reações e clipes, sem exigir alterações no núcleo do motor para cada personagem novo.

## RF-CHAR-05 — Personagens oficiais

Preserve nomes, características e personalidade ao redesenhar os personagens:

### Cringefather
- 40 anos; pai e cientista.
- Magro, altura média, cabelo preto para cima e óculos.
- Sabe muito sobre diversos assuntos, mas não consegue falar inglês.
- Humor ácido; ama Ian/BetaSon, Darinho e a sobrinha Laura.
- Animação: pose intelectual, gestos explicativos, sobrancelhas expressivas, confiança exagerada e confusão cômica ao falar inglês.

### BetaSon (Ian)
- 10 anos.
- Magro, cabelo preto encaracolado e assanhado, óculos e espaço entre os dentes da frente.
- Engraçado, desajeitado, muito inteligente e completamente fluente em inglês.
- Animação: tropeços, gestos rápidos, expressões debochadas, explicações confiantes e risadas espontâneas.

### Dario (Darinho)
- 7 anos.
- Cabelo preto liso na altura dos olhos e olhos pretos.
- Autista, mais calado, hiperativo e engraçado; vocabulário limitado; frequentemente fala de si na terceira pessoa.
- Animação: corridas repentinas, pulos, movimentos impulsivos, pausas inesperadas e olhares expressivos.
- Representação respeitosa: o autismo não deve ser a piada; o humor deve surgir das situações, da personalidade e das interações.

### Laura (Laurinha)
- 4 anos.
- Cabelos e olhos castanhos, maria-chiquinhas e vestido.
- Ama dançar, aprender coisas novas e estar com os primos.
- Animação: dança, palmas, pulinhos, curiosidade, surpresa, alegria e encantamento.

### Erika
- 30 anos; psicóloga.
- Mais alta que Cringefather.
- Calma, amorosa, acolhedora; compartilha lições de amor e histórias.
- Animação: sorriso acolhedor, escuta ativa, gestos suaves, abraços e empatia.

### Véia
- 70 anos; sogra de Cringefather.
- Geniosa, engraçada e provocadora; vive procurando confusão com Cringefather, mas ama a família.
- Animação: dedo em riste, braços cruzados, mãos na cintura, olhar de julgamento, risada debochada e mudança para expressão carinhosa.

### Véio
- 80 anos.
- Olhos muito grandes; poeta; detesta receber ordens.
- Animação: olhar contemplativo, gestos teatrais, declamação, suspiros e indignação dramática.

### Paraíba
- Cachorro acolhido pela família.
- Está sempre com fome.
- Animação: farejar, abanar o rabo, correr atrás de comida, implorar, lamber os beiços, dormir e reagir a sons ou cheiros.

A arquitetura deve aceitar personagens adicionais. Não fixe o sistema apenas a esses oito.

---

# 8. BIBLIOTECA DE REAÇÕES E CLIPES

## RF-ANIM-01 — Reações compartilhadas

Criar ou ampliar uma biblioteca pesquisável e reutilizável, adaptando cada reação às características do personagem. Cobrir, no mínimo:
- alegria, sorriso, gargalhada e riso contido;
- tristeza, choro, decepção e frustração;
- raiva, irritação, indignação e impaciência;
- surpresa, susto, choque e espanto;
- dúvida, confusão, curiosidade e desconfiança;
- vergonha, constrangimento, timidez e nervosismo;
- sono, cansaço, bocejo e tédio;
- medo, preocupação e alívio;
- orgulho, comemoração, empolgação e vitória;
- carinho, abraço, saudade e gratidão;
- deboche, ironia, sarcasmo e olhar de julgamento;
- concordância, discordância, negação, afirmação e hesitação.

O humor deve respeitar a individualidade dos personagens e evitar estereótipos prejudiciais.

## RF-ANIM-02 — Clipes comuns

Criar ou organizar clipes reutilizáveis para:
- parado, repouso, andar e correr;
- pular, aterrissar, sentar, cair e levantar;
- acenar, apontar, gesticular e explicar;
- falar, escutar, balançar a cabeça e olhar para trás;
- abraçar, cumprimentar e aplaudir;
- dançar, tropeçar, reagir a susto e posar;
- cruzar os braços e transitar entre poses.

Para Paraíba, incluir movimentos específicos de cachorro: abanar o rabo, farejar, sentar, correr, deitar, pular, implorar por comida, comer e dormir.

## RF-ANIM-03 — Metadados e integridade

Cada clipe deve ter identificador estável, nome, duração, categoria, parâmetros e versão quando apropriado. Permitir pesquisa por nome, categoria, personagem e tipo de movimento. Ao excluir um recurso referenciado, avisar e impedir referências quebradas ou oferecer uma migração segura.

---

# 9. TIMELINE E MOTOR DE ANIMAÇÃO

## RF-TIME-01 — Ações simultâneas

Permitir que personagens diferentes ajam simultaneamente. Um mesmo personagem deve poder combinar ações compatíveis, como falar enquanto gesticula ou escutar enquanto reage.

Definir regras explícitas para ações que disputem o mesmo recurso corporal. Exibir conflitos e aplicar prioridades de maneira previsível. Não bloquear toda sobreposição indiscriminadamente.

## RF-TIME-02 — Trilhas

Usar trilhas por ator ou estrutura equivalente que torne claras as ações. Conforme o motor suportar, distinguir trilhas de movimento, fala, áudio, enquadramento, transição e elementos de cena. Não criar trilhas sem semântica real.

## RF-TIME-03 — Edição de clipes

Permitir arrastar ações/clipes para mudar o início, ajustar duração, reposicionar e duplicar. Mover entre trilhas somente quando compatível. Mostrar feedback visual, encaixe temporal quando viável e precisão suficiente para edição.

## RF-TIME-04 — Navegação temporal

Exibir escala de tempo, playhead, duração e estado de reprodução. Permitir zoom horizontal e navegação pela timeline. A reprodução, o avanço quadro a quadro, o retrocesso e o reposicionamento do playhead devem produzir estados consistentes.

## RF-TIME-05 — Desfazer e refazer

Integrar operações relevantes ao mecanismo de undo/redo: mover, redimensionar, duplicar, excluir, alterar propriedades, editar falas e reorganizar cenas, conforme a arquitetura permitir.

## RF-TIME-06 — Sincronização

A representação visual deve ser determinística o bastante para que o mesmo tempo de timeline resulte no mesmo estado de cena, independentemente de como o usuário chegou a esse tempo. Evite depender exclusivamente de incrementos acumulados por frame para calcular poses. Teste seek, pausa, retrocesso e reprodução repetida.

---

# 10. FALAS, ÁUDIO E ROTEIRO DE GRAVAÇÃO

## RF-AUDIO-01 — Modelo de fala

Cada fala deve preservar, conforme o modelo atual permitir:
- personagem que fala;
- texto integral;
- tempo inicial e final ou duração;
- observações de interpretação;
- pausas e marcações;
- indicação de sobreposição com outras falas;
- relação com a cena e o clipe correspondente.

Separar duração da animação e duração vocal. Se a duração da voz for estimada pelo texto, marcar claramente como estimativa.

## RF-AUDIO-02 — Gerador de roteiro

Gerar roteiro a partir das falas da timeline. Incluir:
- nome do personagem;
- texto integral da fala;
- tempo inicial e final;
- duração;
- ordem cronológica;
- pausas e notas de interpretação quando disponíveis;
- falas sobrepostas identificadas;
- identificação da cena e do formato, quando houver.

Oferecer visão cronológica e visão agrupada por personagem, para gravação em lote. Permitir copiar e exportar o roteiro em formato realmente suportado. Atualizar a saída quando falas ou tempos forem alterados.

Não omitir falas. Preserve pontuação, acentos e texto original. Não invente falas nem reescreva o conteúdo sem solicitação.

## RF-AUDIO-03 — Balões de fala

Em close ou enquadramento fechado, exibir balão de fala quando aplicável e legível, sem cobrir olhos e boca sempre que possível. O balão deve acompanhar o personagem e a composição. Permitir reposicionamento manual e posicionamento automático quando faltar espaço.

## RF-AUDIO-04 — Limites de áudio

Auditar se o sistema tem importação, reprodução ou gravação real de áudio. Não confundir geração de roteiro com gravação de áudio. Se houver interesse em gravação real, apresentar dependências, permissões, UX e implicações técnicas antes de implementar.

---

# 11. SALVAMENTO, MIGRAÇÃO E EXPORTAÇÃO

## RF-DATA-01 — Salvar projeto

Ao salvar um projeto novo, solicitar nome e destino quando aplicável. Depois do primeiro salvamento, “Salvar” atualiza o projeto existente e “Salvar como” permite criar cópia com outro nome.

## RF-DATA-02 — Exportar com nome

Antes de exportar, solicitar nome do arquivo e, quando aplicável, formato e destino. Preservar extensões corretas. Avisar antes de sobrescrever arquivos. Nunca descartar alterações não salvas silenciosamente. Exibir erros compreensíveis e recuperáveis.

## RF-DATA-03 — Compatibilidade de projetos antigos

Identificar o formato de projeto atual e as versões existentes. Planejar migrações explícitas para:
- projetos sem conceito de formato;
- projetos com uma única cena;
- projetos que assumem lousa como fundo;
- recursos chibi antigos;
- referências a sprites, poses, clipes e personagens;
- metadados ausentes.

Use valores padrão compatíveis apenas quando seguros. Não converter dados irreversivelmente sem cópia de segurança ou confirmação adequada. Se houver versionamento de projeto, evoluí-lo de forma controlada.

## RF-DATA-04 — Exportação de recursos

Exportar apenas formatos efetivamente suportados ou adicionados e testados:
- projeto;
- animação;
- sprites e recursos associados;
- clipes;
- roteiro de gravação.

Preservar nomes, proporções, transparência, dimensões, metadados e referências. Evitar prometer formatos de vídeo, áudio ou imagem que o motor não produza.

## RF-DATA-05 — Integridade e recuperação

Detectar referências inválidas, dados incompletos e falhas de leitura/gravação. Informar o problema e preservar a possibilidade de recuperação. Evitar que falha de um recurso cause perda do projeto inteiro.

---

# 12. PIPELINE DE SPRITES: AUDITAR ANTES DE ALTERAR

Há requisitos históricos de produção de sprites que podem ou não corresponder ao pipeline atual. **Verifique no repositório antes de assumir que os caminhos e formatos ainda são válidos.**

Investigue, se existirem:
- `referencias/<Nome>.jpg`;
- `tools/sprites/mapa-poses.json`;
- `tools/sprites/rostos.json`;
- `tools/sprites/gerar-sprites.mjs`;
- `apps/web/src/assets/personagens/`;
- manifestos de personagens e consumidores desses recursos.

O pipeline antigo pode usar folhas 3x3, uma pose por célula, fundo branco puro, imagens de alta resolução e tags em ordem de leitura. Não imponha esses requisitos cegamente: confirme a compatibilidade com o importador, o recorte, o processamento de imagem, o motor e os recursos já existentes.

Ao gerar ou migrar sprites:
- manter o estilo de destino stickman;
- preservar escala e identidade visual;
- evitar poses cortadas ou sobrepostas;
- respeitar o esquema de dados real;
- não inventar campos JSON;
- validar recursos e referências antes de atualizar manifestos;
- não substituir em massa recursos sem comparação e plano de retorno.

Para folhas faciais, audite se o sistema troca uma cabeça completa, combina partes faciais ou anima apenas a boca. Não desenhe um recurso incompatível com o pipeline. O objetivo de expressões e sincronização labial deve respeitar o que o motor realmente suporta e a evolução planejada.

---

# 13. DESEMPENHO, SEGURANÇA E MANUTENIBILIDADE

## RF-NFR-01 — Manutenibilidade
Separar responsabilidades de interface, domínio, motor de animação, persistência e exportação conforme fizer sentido para a arquitetura real. Evitar arquitetura excessiva ou abstrações sem uso.

## RF-NFR-02 — Desempenho
Manter a interface responsiva durante edição e reprodução com múltiplos atores, objetos e cenas. Medir o comportamento atual antes de definir metas numéricas. Identificar gargalos com evidências, não por suposição.

## RF-NFR-03 — Integridade
Preservar cenas, falas, tempos, referências, recursos e configurações ao salvar, carregar, duplicar ou exportar.

## RF-NFR-04 — Compatibilidade
Manter projetos antigos utilizáveis ou migrá-los de forma documentada. Não deixar recursos órfãos silenciosamente.

## RF-NFR-05 — Extensibilidade
Permitir adicionar formatos, cenários, personagens, objetos, reações e clipes com alterações localizadas e documentadas, sem reescrever o núcleo sempre que possível.

## RF-NFR-06 — Testabilidade
Criar testes para regras de domínio, persistência, migração, timeline, exportação e fluxos críticos de interface conforme a stack permitir.

## RF-NFR-07 — Segurança
Avaliar dependências, permissões de arquivos, importação de projetos e execução de scripts. Não executar conteúdo importado como código. Não expor dados privados ou credenciais.

## RF-NFR-08 — Observabilidade
Mensagens de erro e logs devem ajudar a diagnosticar problemas sem expor segredos. Distinguir claramente avisos, erros recuperáveis e falhas críticas.

---

# 14. FASES DE EXECUÇÃO

A auditoria pode alterar a ordem abaixo. O agente deve explicar qualquer mudança de sequência e suas razões técnicas.

## Fase 0 — Auditoria obrigatória (somente leitura)

Inspecione:
- stack, estrutura do repositório e pontos de entrada;
- arquitetura e dependências;
- modelo de projeto e persistência;
- personagens, sprites, poses, expressões e clipes;
- palco, timeline, fala, áudio, enquadramento e exportação;
- interface, painéis, menus, atalhos e estados;
- pipeline de assets e manifestos;
- testes, lint, build e comandos de desenvolvimento;
- riscos de compatibilidade, desempenho e perda de dados.

Entregue:
1. Resumo da arquitetura real com evidências de arquivos/módulos;
2. Mapa dos fluxos atuais: criar → editar → salvar → carregar → reproduzir → exportar;
3. Inventário de funcionalidades existentes, incompletas e ausentes;
4. Matriz de requisitos com prioridade, dependências, módulos afetados e critério de aceite;
5. Riscos técnicos e de migração;
6. Plano incremental proposto;
7. Comandos de teste/build que podem ser executados com segurança.

**Não modifique arquivos nesta fase.**

## Fase 1 — Fundação e segurança dos dados

- Definir estratégia de compatibilidade e versionamento de projeto;
- Corrigir ou estabilizar salvar, abrir, salvar como e exportar;
- Implementar alertas para alterações não salvas;
- Preparar testes de persistência e migração;
- Evitar mudanças visuais amplas antes de proteger o fluxo de dados.

## Fase 2 — Modelo multiformato e múltiplas cenas

- Evoluir o modelo de projeto, se necessário;
- Introduzir cenas e cenários de forma compatível;
- Adicionar escolha de formato e modelos iniciais;
- Garantir edição livre após escolher um modelo;
- Validar migração de projetos antigos.

## Fase 3 — UX/UI do estúdio

- Organizar menus e barras;
- Implementar painéis redimensionáveis e rolagem independente;
- Melhorar seleção, propriedades, tooltips e feedback;
- Adicionar tela cheia;
- Tornar clara a navegação entre formato, cenário e cenas.

## Fase 4 — Timeline e motor

- Ações simultâneas;
- Regras de conflito e prioridade;
- Arrastar, ajustar e duplicar clipes;
- Seek, pausa, reprodução e retrocesso determinísticos;
- Undo/redo e testes temporais.

## Fase 5 — Cenários, objetos e enquadramentos

- Criar ou adaptar biblioteca de cenários;
- Incluir modelos visuais para Aula, Podcast e Drops da Semana;
- Permitir posicionamento de personagens e objetos;
- Implementar enquadramentos/transições apenas conforme a arquitetura real;
- Testar legibilidade e proporção de saída.

## Fase 6 — Personagens e recursos stickman

- Definir ou evoluir a estrutura articulada;
- Migrar/redesenhar os oito personagens oficiais;
- Criar biblioteca de reações e clipes;
- Melhorar o editor de sprites e clipes;
- Preservar ou migrar recursos antigos de forma controlada.

## Fase 7 — Falas, roteiro e áudio

- Completar o modelo de falas;
- Gerar roteiro cronológico e por personagem;
- Identificar sobreposições;
- Ajustar balões em closes;
- Distinguir roteiro, reprodução de áudio e gravação real.

## Fase 8 — Exportação e documentação

- Validar exportação de projeto, animação e recursos suportados;
- Pedir nome de arquivo e prevenir sobrescrita;
- Atualizar documentação;
- Adicionar ajuda contextual com capturas reais;
- Verificar fluxo completo.

## Fase 9 — Validação final

- Executar a suíte de testes;
- Executar build/lint disponíveis;
- Corrigir regressões introduzidas;
- Demonstrar critérios de aceite;
- Relatar pendências, limitações e riscos remanescentes.

---

# 15. PRIORIDADES

Use esta classificação e ajuste-a se a auditoria justificar:

- **P0 — Crítico:** risco de perda/corrupção de dados, projeto não abre/salva, regressão que impede uso básico.
- **P1 — Alta:** modelo multiformato/múltiplas cenas, timeline, persistência, compatibilidade, estrutura central stickman.
- **P2 — Média:** bibliotecas, editor visual de recursos, cenários/modelos adicionais, ajuda e melhorias de UX.
- **P3 — Baixa:** refinamentos estéticos e conveniências que não bloqueiam os fluxos principais.

Não classifique apenas pela facilidade de implementação. Considere dependências, impacto, risco e valor para o fluxo completo.

---

# 16. CRITÉRIOS DE ACEITE

Considere um requisito concluído apenas quando houver evidência verificável.

## Arquitetura e dados
- [ ] A auditoria descreve a arquitetura real com referências concretas.
- [ ] Projetos antigos continuam abrindo ou possuem migração testada.
- [ ] Salvar, abrir, salvar como e exportar tratam nomes, extensões e erros.
- [ ] Projetos com múltiplas cenas são salvos e carregados sem perda.
- [ ] Duplicar cena/modelo não modifica o original.
- [ ] Referências inválidas são detectadas ou tratadas com segurança.

## Formatos e cenários
- [ ] Aula continua funcional e não é mais pressuposto obrigatório do sistema.
- [ ] Há modelo inicial de podcast com bancada, participantes e microfones visíveis.
- [ ] Há modelo inicial de telejornal/Drops da Semana com apresentador e área de chamadas/títulos.
- [ ] Os modelos são editáveis depois de criados.
- [ ] É possível usar cenários diferentes em cenas distintas.
- [ ] Novos formatos/cenários podem ser acrescentados por mecanismo documentado e localizado.

## Timeline e reprodução
- [ ] Personagens diferentes podem agir simultaneamente.
- [ ] Ações compatíveis do mesmo personagem podem se sobrepor.
- [ ] Conflitos entre ações são previsíveis e visíveis.
- [ ] Clipes podem ser movidos e ter duração alterada.
- [ ] Reprodução, pausa, seek e retrocesso são consistentes.
- [ ] Undo/redo cobre as operações críticas implementadas.

## Personagens e recursos
- [ ] Personagens stickman mantêm identidades distintas.
- [ ] A articulação corresponde à implementação real, sem promessas falsas.
- [ ] Reações e clipes são reutilizáveis e pesquisáveis.
- [ ] Paraíba possui movimentos específicos de cachorro.
- [ ] Recursos antigos não são apagados sem estratégia de migração.
- [ ] É possível acrescentar personagem sem reescrever o núcleo.

## Falas e exportação
- [ ] O roteiro contém todas as falas, personagens e tempos disponíveis.
- [ ] Falas sobrepostas são identificadas.
- [ ] A visão cronológica e a visão por personagem funcionam.
- [ ] Balões permanecem legíveis nos enquadramentos suportados.
- [ ] Exportação pede nome e trata sobrescrita/erros.
- [ ] O sistema distingue roteiro de gravação de captura real de áudio.

## UX e qualidade
- [ ] Painéis redimensionáveis e rolagem independente funcionam.
- [ ] O palco pode ser ampliado e o usuário consegue retornar sem perder estado.
- [ ] Menus, tooltips e estados de interface são consistentes.
- [ ] Documentação usa capturas reais.
- [ ] Testes relevantes foram executados e os resultados foram reportados.

Um item não implementado deve ser marcado como **pendente**, **bloqueado** ou **fora do escopo da etapa**, com motivo explícito. Não marque como concluído apenas porque existe um componente visual.

---

# 17. ESTRATÉGIA DE TESTES

Antes de escrever novos testes, examine a suíte e as convenções existentes. Use as ferramentas já adotadas pelo projeto, salvo justificativa.

Cobrir, conforme aplicável:
- criar, salvar, carregar, duplicar e migrar projetos;
- projetos com uma ou várias cenas;
- selecionar e alterar formato/cenário;
- posicionar, salvar e carregar atores e objetos;
- modelos de Aula, Podcast e Drops da Semana;
- referências de sprites, clipes e recursos;
- simultaneidade e conflitos de ações;
- precisão temporal ao mover clipes;
- consistência de reprodução após seek/pausa/retrocesso;
- undo/redo;
- completude e ordenação do roteiro;
- identificação de falas sobrepostas;
- legibilidade de balões;
- exportação, extensões, nomes e sobrescrita;
- erros recuperáveis e dados inválidos;
- regressões nos fluxos existentes.

Execute os comandos reais de teste, lint e build que forem pertinentes. Registre os comandos e os resultados. Não invente testes nem resultados.

---

# 18. RELATÓRIOS OBRIGATÓRIOS

Ao final da Fase 0, entregue um relatório com esta estrutura:

1. **Resumo executivo:** estado atual e principais riscos.
2. **Arquitetura identificada:** tecnologias, módulos e responsabilidades.
3. **Mapa do sistema:** fluxo de projeto, cena, personagem, timeline, fala, persistência e exportação.
4. **Matriz de requisitos:** ID, prioridade, estado atual, dependências, arquivos/módulos prováveis e critério de aceite.
5. **Lacunas:** o que existe, existe parcialmente ou não existe.
6. **Plano incremental:** etapas, dependências, riscos, validação e estratégia de retorno.
7. **Testes:** comandos existentes e testes propostos.
8. **Decisões pendentes:** somente questões que realmente impedem o avanço.

Ao concluir cada etapa de implementação, informe:
- objetivo;
- arquivos alterados;
- decisões técnicas;
- comportamento implementado;
- testes executados e resultados reais;
- limitações;
- riscos restantes;
- próximo passo recomendado.

Ao concluir o trabalho, forneça um relatório final com itens concluídos, pendentes, evidências de teste e instruções de uso.

---

# 19. PRIMEIRA AÇÃO — EXECUTAR AGORA

**Comece somente pela Fase 0 — Auditoria obrigatória, em modo de leitura.**

Não implemente mudanças ainda.

Inspecione o repositório e responda com evidências:
- Qual é a stack e como o sistema é executado?
- Como o projeto e seus dados são representados?
- Como personagens, sprites, poses, expressões, clipes, falas e timeline funcionam?
- O palco já suporta múltiplas cenas, cenários, objetos ou enquadramentos?
- Como salvar, carregar, duplicar e exportar funcionam?
- Quais testes existem e quais comandos podem ser executados?
- Quais requisitos já estão atendidos, parcialmente atendidos ou ausentes?
- Quais são os riscos de compatibilidade, migração, desempenho e perda de dados?
- Qual é a menor sequência de mudanças que leva ao estúdio multiformato sem quebrar o que funciona?

Apresente a auditoria e o plano priorizado antes de editar qualquer arquivo. Depois, aguarde autorização para implementar ou prossiga apenas se as instruções do ambiente e do usuário já autorizarem explicitamente essa continuação.

**Não reescreva o sistema inteiro. Não apague recursos antigos. Não assuma que a lousa é obrigatória. Não declare sucesso sem evidência.**
