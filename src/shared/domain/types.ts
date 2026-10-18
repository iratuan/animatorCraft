import type { ActorId, Papeis } from './characters';
import type { ExpressaoId, PoseId } from './poses';

export type Lado = 'esquerda' | 'direita' | 'centro';

export type Conteudo =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'latex'; latex: string };

/** Ação única do roteiro, já resolvida. O motor de animação consome só isto. */
export type Acao = AcaoBase & {
  /** Começa junto com a ação anterior (ex.: "Professor e Aluno dançam juntos"). */
  junto?: boolean;
};

type AcaoBase =
  /** x (0..1 da largura do palco) substitui o ponto de parada do lado escolhido */
  | { tipo: 'entrar'; ator: ActorId; lado: Lado; pose: PoseId; x?: number }
  /** Muda o personagem de lugar: ndando caminha até lá; senão aparece direto na posição x (0..1 da largura). */
  | { tipo: 'posicionar'; ator: ActorId; x: number; andando?: boolean }
  | { tipo: 'sair'; ator: ActorId; lado: Lado; pose: PoseId }
  /** Com `duracao`, a pose é temporária (ex.: dança por 5 s) e o ator volta a ficar parado depois. */
  | { tipo: 'pose'; ator: ActorId; pose: PoseId; duracao?: number; etiqueta?: string }
  | { tipo: 'expressao'; ator: ActorId; expressao: ExpressaoId }
  | { tipo: 'fala'; ator: ActorId; texto: string }
  | { tipo: 'escrever'; ator: ActorId; conteudo: Conteudo }
  | { tipo: 'apontar'; ator: ActorId }
  | { tipo: 'apagar' }
  /** Câmera: 'lousa' mostra só o conteúdo da lousa; 'personagem' mostra só o rosto; 'aberto' volta ao plano geral. */
  | { tipo: 'camera'; alvo: 'aberto' | 'lousa' | 'personagem'; ator?: ActorId }
  | { tipo: 'esperar'; segundos: number }
  | { tipo: 'nota'; texto: string };

/** Onde a frase de uma ação está no texto do roteiro (a linha do tempo usa para reescrevê-lo). */
export interface Origem { ini: number; fim: number }
export interface Cena { titulo: string; acoes: Acao[]; /** uma origem por ação, na mesma ordem */ origens: Origem[]; }
export interface Roteiro { cenas: Cena[]; avisos: string[]; papeis: Papeis; }



