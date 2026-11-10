import type { StateCreator } from 'zustand';
import { ATORES, ROTEIRO_EXEMPLO, inserirNoCursor as inserirNoCursorTexto, type ActorId } from '@shared/domain';
import type { FormatoVideo } from '@shared/constants/video';
import { lerTexto } from '@renderer/features/sistema';

export type AcaoInicial = 'abrir-projeto' | 'novo-personagem';

export interface ProjetoState {
  roteiro: string;
  formato: FormatoVideo;
  nomeProjeto: string;
  caminhoProjeto: string | null;
  modificado: boolean;
  acaoInicial: AcaoInicial | null;
  cursorRoteiro: number | null;
}

export interface ProjetoActions {
  setRoteiro: (r: string) => void;
  marcarSalvo: (caminho?: string | null, nome?: string) => void;
  novoProjeto: () => void;
  fecharProjeto: () => void;
  inserir: (trecho: string) => void;
  inserirNoCursor: (trecho: string) => void;
  definirPapeis: (professor: ActorId, aluno: ActorId) => void;
}

export type ProjetoSlice = ProjetoState & ProjetoActions;

export const createProjetoSlice: StateCreator<any, [], [], ProjetoSlice> = (set, get) => ({
  roteiro: lerTexto('stickboard.roteiro.v2', ROTEIRO_EXEMPLO),
  formato: '16:9',
  nomeProjeto: 'Sem título',
  caminhoProjeto: null,
  modificado: false,
  acaoInicial: null,
  cursorRoteiro: null,

  setRoteiro: (roteiro) => set({ roteiro, modificado: true }),

  marcarSalvo: (caminho, nome) => set((s: any) => ({
    modificado: false,
    caminhoProjeto: caminho !== undefined ? caminho : s.caminhoProjeto,
    nomeProjeto: nome !== undefined ? nome : (caminho ? (caminho.split(/[/\\]/).pop()?.replace(/\.zip$/i, '') || s.nomeProjeto) : s.nomeProjeto),
  })),

  novoProjeto: () => set({
    roteiro: '[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n',
    t: 0,
    nomeProjeto: 'Sem título',
    caminhoProjeto: null,
    modificado: false,
    trilhas: {},
  }),

  fecharProjeto: () => set({
    roteiro: '[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n',
    t: 0,
    tocando: false,
    nomeProjeto: 'Sem título',
    caminhoProjeto: null,
    modificado: false,
    trilhas: {},
    cursorRoteiro: null,
  }),

  inserir: (trecho) => set(({ roteiro }: any) => {
    const base = roteiro.trimEnd();
    const ultima = base.split('\n').pop() ?? '';
    const sep = base === '' ? '' : /^#/.test(ultima) ? '\n\n' : ' ';
    return { roteiro: `${base}${sep}${trecho}\n` };
  }),

  inserirNoCursor: (trecho) => {
    const { roteiro, cursorRoteiro } = get();
    if (cursorRoteiro === null) get().inserir(trecho);
    else set({ roteiro: inserirNoCursorTexto(roteiro, cursorRoteiro, trecho) });
  },

  definirPapeis: (professor, aluno) => set(({ roteiro }: any) => {
    const linha = `[papéis: professor=${ATORES[professor]!.nome}, aluno=${ATORES[aluno]!.nome}]`;
    const sem = roteiro.replace(/^[ \t]*\[\s*pap[eé]is\s*:[^\]]*\][ \t]*\r?\n?/gim, '').replace(/^\s+/, '');
    return { roteiro: `${linha}\n\n${sem}`, t: 0 };
  }),
});
