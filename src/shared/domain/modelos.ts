/** Modelos de roteiro. Troque tudo que está entre {chaves}; o conteúdo da lousa deve caber nela (o editor avisa quando passa). */
export interface ModeloRoteiro {
  id: string;
  nome: string;
  area: 'Matemática' | 'Ciências' | 'Inglês';
  descricao: string;
  roteiro: string;
}

export const MODELOS: ModeloRoteiro[] = [
  {
    id: 'matematica-resolucao', nome: 'Resolver um problema', area: 'Matemática',
    descricao: 'Abertura engraçada, resolução passo a passo em close na lousa e reação final.',
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
    id: 'ciencias-conceito', nome: 'Explicar um conceito', area: 'Ciências',
    descricao: 'Pergunta curiosa, explicação na lousa e experimento.',
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
    id: 'ingles-vocabulario', nome: 'Vocabulário em inglês', area: 'Inglês',
    descricao: 'BetaSon ensina inglês e o CringeFather sofre: troca de papéis.',
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
];
