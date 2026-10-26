import { coletarBiblioteca, listarAudios, listarImagens, POSES, type ActorId, type BibliotecaMestre } from '@shared/domain';

/** A biblioteca do usuário neste instante (personagens, poses, imagens e áudios), na forma que o prompt mestre descreve. */
export const bibliotecaAtual = (somente?: ActorId[]): BibliotecaMestre =>
  coletarBiblioteca(() => [...POSES], listarImagens(), listarAudios(), somente);
