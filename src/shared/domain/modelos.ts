import type { FormatoProducao } from './types';

/** Modelos de roteiro para cada formato de mídia. Troque tudo que está entre {chaves}. */
export interface ModeloRoteiro {
  id: string;
  nome: string;
  formato: FormatoProducao;
  area: string;
  descricao: string;
  roteiro: string;
  sugestaoPrompt?: string;
}

export const MODELOS: ModeloRoteiro[] = [
  // --- AULAS DIDÁTICAS TRADICIONAIS COM LOUSA ---
  {
    id: 'matematica-resolucao',
    nome: 'Resolver um problema',
    formato: 'aula',
    area: 'Matemática',
    descricao: 'Abertura engraçada, resolução passo a passo em close na lousa e reação final.',
    sugestaoPrompt: 'Explique como resolver uma equação de 2º grau por Bhaskara com passo a passo na lousa',
    roteiro: `[papéis: professor=CringeFather, aluno=BetaSon]

# Abertura
Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Hoje vamos resolver {O PROBLEMA}." sarcástico. Aluno diz "{FALA ENGRAÇADA DO ALUNO}" empolgado. Professor cruza os braços.

# Resolução na lousa
[close na lousa]
Professor escreve "{ENUNCIADO CURTO}" no quadro. Professor escreve $ {PASSO 1} $ no quadro. Professor escreve $ {PASSO 2} $ no quadro. Professor escreve $ {RESULTADO} $ no quadro.
[plano aberto]

# Reação e encerramento
Aluno fica surpreso. Aluno diz "{REAÇÃO DO ALUNO}" feliz. Professor diz "{FECHAMENTO SARCÁSTICO}" sarcástico. Todos dançam por 4 segundos. Professor acena. [nota: gravar o fechamento com voz impaciente]
`,
  },
  {
    id: 'ciencias-conceito',
    nome: 'Explicar um conceito',
    formato: 'aula',
    area: 'Ciências',
    descricao: 'Pergunta curiosa, explicação na lousa e experimento.',
    sugestaoPrompt: 'Ensine o que é a gravidade e a atração dos corpos com fórmula e exemplo cotidiano',
    roteiro: `[papéis: professor=CringeFather, aluno=Dario]

# Pergunta
Professor entra pela esquerda andando. Aluno entra pela direita andando. Aluno diz "{PERGUNTA CURIOSA DO ALUNO}" confuso. Professor diz "{RESPOSTA SARCÁSTICA}" sarcástico.

# Explicação
[close na lousa]
Professor escreve "{CONCEITO}" no quadro. Professor escreve "{DEFINIÇÃO CURTA}" no quadro. Professor escreve $ {FÓRMULA OU RELAÇÃO} $ no quadro.
[plano aberto]

# Experimento e fechamento
Professor apresenta. Aluno tem uma ideia. Aluno diz "{HIPÓTESE ESPERTA}" empolgado. Professor diz "{FECHAMENTO}" feliz. Aluno acena.
`,
  },
  {
    id: 'ingles-vocabulario',
    nome: 'Vocabulário em inglês',
    formato: 'aula',
    area: 'Inglês',
    descricao: 'BetaSon ensina inglês e o CringeFather sofre: troca de papéis.',
    sugestaoPrompt: 'Ensine expressões em inglês para pedir comida em um restaurante com tradução e pronúncia',
    roteiro: `[papéis: professor=BetaSon, aluno=CringeFather]

# Abertura
Aluno entra pela esquerda andando. Professor entra pela direita andando. Professor diz "Today we learn {TEMA EM INGLÊS}!" empolgado. Aluno diz "{FALA ENGRAÇADA DO ALUNO}" confuso.

# Vocabulário
[close na lousa]
Professor escreve "{PALAVRA 1} = {TRADUÇÃO 1}" no quadro. Professor escreve "{PALAVRA 2} = {TRADUÇÃO 2}" no quadro. Professor escreve "{FRASE DE EXEMPLO}" no quadro.
[plano aberto]

# Prática
Professor aponta. Aluno diz "{TENTATIVA ERRADA}" assustado. Professor ri. Professor diz "{CORREÇÃO}" sarcástico. Todos dançam por 4 segundos.
`,
  },

  // --- PODCAST / MESA REDONDA COM BANCADA E FONES ---
  {
    id: 'podcast-debate',
    nome: 'Mesa Redonda sobre Tecnologia',
    formato: 'podcast',
    area: 'Tecnologia',
    descricao: 'Bancada com microfones e fones, host e convidado debatendo o futuro.',
    sugestaoPrompt: 'Crie uma conversa de podcast sobre como a Inteligência Artificial vai transformar as escolas',
    roteiro: `[cenário: podcast]
[formato: podcast]
[papéis: professor=CringeFather, aluno=BetaSon]

# Introdução do Podcast
Professor entra pela esquerda andando na posição 30%. Aluno entra pela direita andando na posição 70%.
Professor diz "Sejam bem-vindos a mais um episódio do nosso videocast!" empolgado.
Aluno diz "E hoje o tema é quente: será que os robôs vão fazer minha lição de casa?" feliz.
Professor cruza os braços.
Professor diz "Se depender da sua preguiça, eles vão fazer até o almoço." sarcástico.

# O Debate
Aluno ri.
Aluno diz "Falando sério, a inteligência artificial já ajuda a resolver dúvidas difíceis." empolgado.
Professor diz "Ajuda, mas sem pensamento crítico você só repete o que a máquina inventa." pensativo.
Aluno tem uma ideia.
Aluno diz "Então o segredo é aprender a fazer as perguntas certas?" curioso.
Professor diz "Exatamente! Você finalmente disse algo brilhante neste estúdio." feliz.
Professor acena.
`,
  },
  {
    id: 'podcast-entrevista',
    nome: 'Entrevista Descontraída',
    formato: 'podcast',
    area: 'Ciências',
    descricao: 'Entrevista leve no estúdio com perguntas rápidas, curiosidades e risadas.',
    sugestaoPrompt: 'Podcast entrevistando um jovem cientista sobre como funcionam os buracos negros no espaço',
    roteiro: `[cenário: podcast]
[formato: podcast]
[papéis: professor=CringeFather, aluno=Dario]

# Abertura do Episódio
Professor entra pela esquerda andando na posição 30%. Aluno entra pela direita andando na posição 70%.
Professor diz "Fala pessoal! Hoje recebo aqui um grande prodígio das ciências." empolgado.
Aluno diz "Opa, muito obrigado pelo convite! Pronto para falar de buracos negros." feliz.
Professor diz "Dario, explica pra gente: o que acontece se alguém cair num buraco negro?" curioso.

# Curiosidades Espaciais
Aluno gesticula.
Aluno diz "A física chama de espaguetificação: a gravidade estica tudo como uma massa!" empolgado.
Professor fica assustado.
Professor diz "Espaguetificação? Eu jurava que isso só acontecia no almoço de domingo." surpreso.
Aluno ri.
Aluno diz "É pura relatividade geral na prática!" feliz.
Professor diz "Sensacional. Se cuidem no espaço e até o próximo episódio!" feliz.
`,
  },

  // --- TELEJORNAL / DROPS COM VIDEOWALL E BANCADA ---
  {
    id: 'telejornal-drops',
    nome: 'Drops da Semana (Notícias)',
    formato: 'telejornal',
    area: 'Notícias',
    descricao: 'Apresentador em bancada de TV com videowall global e tarja ao vivo.',
    sugestaoPrompt: 'Drops de notícias rápidas cobrindo uma grande descoberta espacial da semana',
    roteiro: `[cenário: telejornal]
[formato: telejornal]
[sem lousa]

# Plantão de Notícias
Erika entra pelo centro na posição 50%.
Erika diz "Boa noite! Começa agora o Drops da Semana com as principais novidades." feliz.
Erika apresenta.
Erika diz "Astrônomos acabam de confirmar a detecção de atmosfera rica em oxigênio em um novo planeta." empolgada.
Erika diz "A descoberta abre portas inéditas para a busca de vida fora da Terra." pensativa.
Erika acena.
Erika diz "Voltamos a qualquer momento com novas atualizações. Tenham uma excelente noite!" feliz.
`,
  },
  {
    id: 'telejornal-plantao',
    nome: 'Plantão com Dois Âncoras',
    formato: 'telejornal',
    area: 'Notícias',
    descricao: 'Edição especial com âncora principal e comentarista na bancada de estúdio.',
    sugestaoPrompt: 'Plantão ao vivo com âncora e especialista cobrindo o lançamento de um novo foguete',
    roteiro: `[cenário: telejornal]
[formato: telejornal]
[sem lousa]
[papéis: professor=Erika, aluno=CringeFather]

# Entrada do Plantão
Professor entra pela esquerda na posição 35%. Aluno entra pela direita na posição 65%.
Professor diz "Atenção para o plantão ao vivo com as últimas novidades da exploração espacial." séria.
Aluno diz "O foguete experimental acabou de pousar com sucesso perfeito na base oceânica." empolgado.
Professor diz "Esse teste viabiliza viagens espaciais mais baratas e sustentáveis no futuro." confiante.
Aluno ri.
Aluno diz "E promete transformar o turismo orbital em realidade muito antes do esperado." feliz.
Professor acena.
Professor diz "Seguiremos acompanhando cada detalhe desta missão histórica." feliz.
`,
  },

  // --- ESQUETE TEATRAL / ANIMAÇÃO LIVRE SEM LOUSA ---
  {
    id: 'esquete-aventura',
    nome: 'Confusão em Família com Pets',
    formato: 'livre',
    area: 'Comédia',
    descricao: 'Esquete cômica sem lousa no palco livre com os mascotes Paraíba e Mingau.',
    sugestaoPrompt: 'Uma esquete divertida onde o gato Mingau e o cão Paraíba criam uma confusão na sala',
    roteiro: `[sem lousa]
[cenário: neutro]

# A Perseguição
CringeFather entra pela esquerda andando na posição 30%.
CringeFather diz "Finalmente um momento de paz para tomar meu café tranquilo..." feliz.
Mingau entra correndo pela direita na posição 75%.
Paraíba entra correndo pela direita na posição 85%.
Paraíba diz "Au au!" feliz.
Mingau diz "Miau!" feliz.
CringeFather fica surpreso.
CringeFather diz "Ei, parem vocês dois! Cuidado com a mesa!" bravo.

# O Grande Tropeço
Mingau pula.
Paraíba pula.
CringeFather tropeça.
CringeFather põe as mãos na cabeça.
CringeFather diz "Socorro, meu café!" assustado.
Mingau fica feliz.
Paraíba dança por 2 segundos.
CringeFather ri.
CringeFather diz "Não dá pra ficar bravo com vocês dois..." feliz.
Todos dançam por 4 segundos.
`,
  },
  {
    id: 'esquete-desafio',
    nome: 'Batalha de Dança e Desafios',
    formato: 'livre',
    area: 'Comédia',
    descricao: 'Duelo divertido de dança e habilidades entre irmãos no palco.',
    sugestaoPrompt: 'Uma batalha de dança bem-humorada entre BetaSon e Carol com comemorações e poses',
    roteiro: `[sem lousa]
[cenário: neutro]

# O Desafio
BetaSon entra pela esquerda andando na posição 30%. Carol entra pela direita andando na posição 70%.
BetaSon diz "Hoje ninguém me vence na batalha de passos de dança!" confiante.
Carol cruza os braços.
Carol diz "Duvido muito! Você tropeça até no próprio cadarço." sarcástica.
BetaSon dança por 4 segundos.
BetaSon pula.
BetaSon diz "Viu só isso? Nota dez!" empolgado.

# A Resposta
Carol ri.
Carol diz "Agora veja como se faz de verdade!" empolgada.
Carol pula.
Carol dança por 4 segundos.
BetaSon fica surpreso.
BetaSon diz "Uau, admito que foi incrível!" feliz.
Todos dançam por 4 segundos.
BetaSon e Carol acenam.
`,
  },
];

