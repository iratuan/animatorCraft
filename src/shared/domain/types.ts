import type { ActorId, Papeis } from './characters';
import type { GraficoDef } from './grafico';
import type { EfeitoImagem, PosicaoImagem, TamanhoImagem } from './imagem';
import type { NomeExpressao } from './expressoes';
import type { PoseId } from './poses';

export type Lado = 'esquerda' | 'direita' | 'centro';

export type Conteudo =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'latex'; latex: string }
  | { tipo: 'grafico'; grafico: GraficoDef }
  | { tipo: 'imagem'; arquivo: string; entrada: EfeitoImagem; saida?: EfeitoImagem; /** segundos na lousa; sem valor = até apagar o quadro */ exibirPor?: number; posicao: PosicaoImagem; tamanho: TamanhoImagem };

/** Ação única do roteiro, já resolvida. O motor de animação consome só isto. */
export type Acao = AcaoBase & {
  /** Começa junto com a ação anterior (ex.: "Professor e Aluno dançam juntos"). */
  junto?: boolean;
  /** Início fixo, em segundos, escrito como "às 3 s": a ação começa ali, sem esperar a anterior. */
  inicioFixo?: number;
  /** Duração escrita como "por 3 segundos": vale para qualquer ação que dure no tempo (fala, entrada, saída, pose...). */
  duracao?: number;
};

type AcaoBase =
  /** x (0..1 da largura do palco) substitui o ponto de parada do lado escolhido */
  | { tipo: 'entrar'; ator: ActorId; lado: Lado; pose: PoseId; x?: number }
  /** Muda o personagem de lugar: ndando caminha até lá; senão aparece direto na posição x (0..1 da largura). */
  | { tipo: 'posicionar'; ator: ActorId; x: number; andando?: boolean }
  | { tipo: 'sair'; ator: ActorId; lado: Lado; pose: PoseId }
  /** Com `duracao`, a pose é temporária (ex.: dança por 5 s) e o ator volta a ficar parado depois. */
  /** `clipe`: clipe criado pelo usuário para o personagem ("Fulano faz o clipe tchau.") */
  | { tipo: 'pose'; ator: ActorId; pose: PoseId; duracao?: number; etiqueta?: string; clipe?: string }
  | { tipo: 'expressao'; ator: ActorId; expressao: NomeExpressao }
  /** udio: arquivo da narração (importado); a fala dura o tempo do áudio e a boca acompanha o volume dele */
  | { tipo: 'fala'; ator: ActorId; texto: string; audio?: string }
  /** Música de fundo (até parar ou o fim), efeito sonoro ou voz solta. Não atrasa as ações seguintes. */
  /** \	rilha\: nome da trilha (padrão: voz de cada personagem, \"efeitos\" e \"musica\"); trilhas diferentes tocam ao mesmo tempo. Com \parar\, \	rilha\ limita quais músicas param. */
  | { tipo: 'audio'; arquivo: string; papel: 'voz' | 'musica' | 'efeito'; volume?: number; parar?: boolean; trilha?: string }
  | { tipo: 'escrever'; ator: ActorId; conteudo: Conteudo }
  | { tipo: 'apontar'; ator: ActorId }
  | { tipo: 'apagar' }
  /** Tira uma imagem da lousa, com um efeito de saída. */
  | { tipo: 'remover'; ator: ActorId; arquivo: string; saida: EfeitoImagem }
  /** Câmera: 'lousa' mostra só o conteúdo da lousa; 'personagem' mostra só o rosto; 'aberto' volta ao plano geral. */
  | { tipo: 'camera'; alvo: 'aberto' | 'lousa' | 'personagem'; ator?: ActorId }
  | { tipo: 'esperar'; segundos: number }
  | { tipo: 'nota'; texto: string };

/** Formato da produção/cena: define proposta e convenções de layout */
export type FormatoProducao = 'aula' | 'podcast' | 'telejornal' | 'debate' | 'papo_livre' | 'livre';

/** Tipo do cenário visual da cena */
export type CenarioTipo = 'lousa' | 'podcast' | 'telejornal' | 'debate' | 'papo_livre' | 'neutro';

/** Onde a frase de uma ação está no texto do roteiro (a linha do tempo usa para reescrevê-lo). */
export interface Origem { ini: number; fim: number }
export interface Cena {
  titulo: string;
  acoes: Acao[];
  /** uma origem por ação, na mesma ordem */
  origens: Origem[];
  /** Cenário visual da cena (padrão: 'lousa') */
  cenario?: CenarioTipo;
  /** Formato de produção da cena */
  formato?: FormatoProducao;
  /** Se a cena oculta a lousa escolar (ex.: [sem lousa]) */
  semLousa?: boolean;
}
/**
 * Problema encontrado numa frase do roteiro, com a posição dela no texto (para sublinhar).
 * `erro`: o app não consegue executar a frase. `aviso`: executa, mas pode não ser o que você quis.
 * `sugestoes`: frases inteiras que podem substituir o trecho `[ini, fim)`.
 */
export interface Diagnostico { mensagem: string; ini: number; fim: number; gravidade: 'erro' | 'aviso'; sugestoes: string[] }

export interface Roteiro { cenas: Cena[]; avisos: string[]; diagnosticos: Diagnostico[]; papeis: Papeis; }






