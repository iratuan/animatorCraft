import { ATORES, type ActorId } from './characters';

export type CategoriaSequencia = 'Comemoração' | 'Encerramento' | 'Dança' | 'Reação' | 'Expressões';

export interface Sequencia {
  id: string;
  nome: string;
  categoria: CategoriaSequencia;
  descricao: string;
  /** Se definido, só aparece para esses atores. */
  atores?: ActorId[];
  /** Trecho de roteiro; `{A}` é substituído pelo nome do ator. */
  roteiro: string;
}

export const SEQUENCIAS: Sequencia[] = [
  // ---- para qualquer ator
  { id: 'comemorar', nome: 'Comemoração', categoria: 'Comemoração', descricao: 'Pula de alegria, acena e ri.', roteiro: '{A} pula. {A} acena. {A} ri.' },
  { id: 'acertei', nome: 'Acertei!', categoria: 'Comemoração', descricao: 'Surpresa, pulo e risada.', roteiro: '{A} fica surpreso. {A} pula. {A} ri.' },
  { id: 'dancar', nome: 'Dança do personagem', categoria: 'Dança', descricao: 'Cada um dança no seu estilo (4 s).', roteiro: '{A} dança. {A} ri.' },
  { id: 'tchau', nome: 'Encerramento', categoria: 'Encerramento', descricao: 'Acena, se despede e sai.', roteiro: '{A} acena. {A} diz "Até a próxima!" feliz. {A} sai pela direita andando.' },
  { id: 'inscreva-se', nome: 'Peça para se inscrever', categoria: 'Encerramento', descricao: 'Chamada final do vídeo.', roteiro: '{A} acena. {A} diz "Gostou? Se inscreva no canal!" empolgado. {A} aponta.' },
  { id: 'susto', nome: 'Susto', categoria: 'Reação', descricao: 'Surpresa, medo e tremedeira.', roteiro: '{A} fica surpreso. {A} cai.' },
  { id: 'ideia', nome: 'Ideia genial', categoria: 'Reação', descricao: 'Pensa e tem uma ideia.', roteiro: '{A} pensa. {A} tem uma ideia.' },
  { id: 'sarcasmo', nome: 'Sarcasmo', categoria: 'Reação', descricao: 'Mãos na cintura e olhar de deboche.', roteiro: '{A} põe as mãos na cintura. {A} fica sarcástico. Espera 1 segundos.' },
  { id: 'vergonha', nome: 'Vergonha', categoria: 'Reação', descricao: 'Fica envergonhado.', roteiro: '{A} fica envergonhado. {A} fica triste.' },
  { id: 'chorar-rir', nome: 'Chorando de rir', categoria: 'Expressões', descricao: 'Risada e mais risada.', roteiro: '{A} ri. {A} fica feliz. {A} ri.' },
  { id: 'de-costas', nome: 'Vira de costas', categoria: 'Reação', descricao: 'Ofendido, de costas, e volta.', roteiro: '{A} vira de costas. Espera 1 segundos. {A} fica parado.' },

  // ---- CringeFather (sarcástico, excêntrico)
  { id: 'cringe-funky', nome: 'Dança funky anos 70', categoria: 'Dança', descricao: 'Aponta pro alto, gesticula e quica (5 s).', atores: ['cringefather'], roteiro: '{A} dança funky por 5 segundos. {A} cruza os braços.' },
  { id: 'cringe-arrogante', nome: 'Arrogância', categoria: 'Reação', descricao: 'Braços cruzados e deboche.', atores: ['cringefather'], roteiro: '{A} cruza os braços. {A} diz "Eu avisei que era fácil." sarcástico.' },
  { id: 'cringe-estresse', nome: 'Estresse', categoria: 'Reação', descricao: 'Mãos na cabeça e bronca.', atores: ['cringefather'], roteiro: '{A} põe as mãos na cabeça. {A} diz "Será que ninguém lê o enunciado?!" bravo.' },
  { id: 'cringe-aula', nome: 'Aula empolgada', categoria: 'Reação', descricao: 'Aponta e gesticula como quem vai explodir de entusiasmo.', atores: ['cringefather'], roteiro: '{A} aponta. {A} gesticula. {A} diz "Presta atenção, que isso cai na prova!" empolgado.' },

  // ---- BetaSon (divertido, desastre em exatas, fluente em inglês)
  { id: 'beta-danca', nome: 'Dança atual', categoria: 'Dança', descricao: 'Pulos, balanço e quique (5 s).', atores: ['betason'], roteiro: '{A} dança no estilo atual por 5 segundos. {A} ri.' },
  { id: 'beta-fingir', nome: 'Fingindo que entendeu', categoria: 'Reação', descricao: 'Confuso, depois "entende".', atores: ['betason'], roteiro: '{A} fica confuso. {A} entende. {A} diz "Ahhh, claro! Entendi tudo!" feliz.' },
  { id: 'beta-bobo', nome: 'Reação boba', categoria: 'Reação', descricao: 'Surpresa, tropeço e desculpa esfarrapada.', atores: ['betason'], roteiro: '{A} fica surpreso. {A} tropeça. {A} diz "Eu faço de propósito!" feliz.' },
  { id: 'beta-apresenta', nome: 'Apresentando o projeto', categoria: 'Reação', descricao: 'Apresenta com orgulho e comemora.', atores: ['betason'], roteiro: '{A} apresenta. {A} diz "Tcharam! Funcionou de primeira!" empolgado. {A} pula.' },

  // ---- Erika (psicóloga, serena, acolhedora)
  { id: 'erika-hippie', nome: 'Dança hippie', categoria: 'Dança', descricao: 'Braços abertos, balançando ao som (6 s).', atores: ['erika'], roteiro: '{A} dança hippie por 6 segundos. {A} fica feliz.' },
  { id: 'erika-medita', nome: 'Respira fundo', categoria: 'Reação', descricao: 'Medita e acalma todo mundo.', atores: ['erika'], roteiro: '{A} medita por 4 segundos. {A} diz "Respirem fundo. Inspira... e expira." feliz.' },
  { id: 'erika-orgulho', nome: 'Orgulho de mãe', categoria: 'Reação', descricao: 'Sorri, abre os braços e se derrete.', atores: ['erika'], roteiro: '{A} fica feliz. {A} acena. {A} diz "Ai, que orgulho dos meus filhos!" feliz.' },

  // ---- Dario (autista, esperto, focado em padrões)
  { id: 'dario-pulos', nome: 'Pulos descoordenados', categoria: 'Dança', descricao: 'Equilíbrio, agacha e pula (4 s).', atores: ['dario'], roteiro: '{A} dança descoordenada por 4 segundos. {A} ri.' },
  { id: 'dario-padrao', nome: 'Percebeu o padrão', categoria: 'Reação', descricao: 'Olha para cima, pensa e solta a resposta certa.', atores: ['dario'], roteiro: '{A} pensa. {A} diz "O padrão se repete a cada três." feliz. {A} fica parado.' },
  { id: 'dario-monta', nome: 'Montando algo', categoria: 'Reação', descricao: 'Agacha e monta com calma.', atores: ['dario'], roteiro: '{A} agacha. Espera 2 segundos. {A} fica parado. {A} diz "Pronto." feliz.' },

  // ---- Laura (sapeca, esperta, balé)
  { id: 'laura-balé', nome: 'Balé', categoria: 'Dança', descricao: 'Gira e saltita (5 s).', atores: ['laura'], roteiro: '{A} dança balé por 5 segundos. {A} ri.' },
  { id: 'laura-sapeca', nome: 'Sapeca esperta', categoria: 'Reação', descricao: 'Sorriso de quem já sabia.', atores: ['laura'], roteiro: '{A} fica sarcástico. {A} diz "Eu já sabia!" empolgado.' },
  { id: 'laura-resposta', nome: 'Sabe a resposta', categoria: 'Reação', descricao: 'Pula e responde.', atores: ['laura'], roteiro: '{A} pula. {A} diz "Eu sei, eu sei!" empolgado. {A} aponta.' },

  // ---- Geral: Debate e Apresentação
  { id: 'apresentar-tema', nome: 'Apresentar Tema da Aula', categoria: 'Reação', descricao: 'Apresenta a lousa e introduz o tópico.', roteiro: '{A} apresenta. {A} diz "Hoje vamos aprender um conceito essencial." feliz. {A} aponta.' },
  { id: 'debate-argumento', nome: 'Argumentação Firme', categoria: 'Reação', descricao: 'Gesticula com convicção e defende sua tese.', roteiro: '{A} gesticula. {A} diz "Os dados mostram exatamente o contrário!" empolgado. {A} cruza os braços.' },
  { id: 'panico-comico', nome: 'Pânico / Desespero Cômico', categoria: 'Expressões', descricao: 'Mãos na cabeça, pânico e desespero total.', roteiro: '{A} põe as mãos na cabeça. {A} diz "Meu Deus, esqueci de salvar o projeto!" desesperado. {A} tropeça.' },

  // ---- Mingau (gato curioso, ágil)
  { id: 'mingau-curioso', nome: 'Curiosidade Felina', categoria: 'Reação', descricao: 'Chega perto, observa e dá um salto.', atores: ['mingau'], roteiro: '{A} fica confuso. {A} pula. {A} diz "Miau!" feliz.' },

  // ---- Paraíba (direto, bem-humorado)
  { id: 'paraiba-oxente', nome: 'Oxente!', categoria: 'Reação', descricao: 'Surpresa e risada autêntica.', atores: ['paraiba'], roteiro: '{A} fica surpreso. {A} diz "Oxente, mas isso é bom demais da conta!" feliz. {A} ri.' },

  // ---- Véia e Vêio (sabedoria e implicância bem-humorada)
  { id: 'veia-bronca', nome: 'Bronca Carinhosa', categoria: 'Reação', descricao: 'Mãos na cintura e conselho sábio.', atores: ['veia'], roteiro: '{A} põe as mãos na cintura. {A} diz "No meu tempo a gente estudava com afinco!" brava. {A} ri.' },
  { id: 'veio-filosofo', nome: 'Filosofia da Vida', categoria: 'Reação', descricao: 'Pensa devagar e solta uma pérola.', atores: ['veio'], roteiro: '{A} pensa. {A} diz "A calma é a virtude dos sábios, meu jovem." feliz. {A} cruza os braços.' },

  // ---- Artur e Carol (estudantes focados)
  { id: 'artur-explicacao', nome: 'Explicação Didática', categoria: 'Reação', descricao: 'Apresenta o raciocínio no detalhe.', atores: ['artur'], roteiro: '{A} apresenta. {A} diz "Analisando por esse ângulo, tudo faz sentido." empolgado. {A} gesticula.' },
  { id: 'carol-dedicada', nome: 'Anotação Crítica', categoria: 'Reação', descricao: 'Analisa, compreende e conclui.', atores: ['carol'], roteiro: '{A} pensa. {A} diz "Excelente observação, anotei aqui!" feliz. {A} acena.' },

  // ---- Elizendra (professora inspiradora)
  { id: 'elizendra-mestra', nome: 'Intervenção da Mestra', categoria: 'Reação', descricao: 'Elogia a turma e estimula a curiosidade.', atores: ['elizendra'], roteiro: '{A} apresenta. {A} diz "Muito bem, turma! Vocês superaram todas as expectativas!" feliz. {A} comemora.' },
];

export function sequenciasPara(ator: ActorId | null): Sequencia[] {
  return SEQUENCIAS.filter((s) => !s.atores || (ator && s.atores.includes(ator)));
}

export function roteiroDaSequencia(s: Sequencia, ator: ActorId): string {
  return s.roteiro.replaceAll('{A}', ATORES[ator]!.nome);
}
