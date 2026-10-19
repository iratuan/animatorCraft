import { coletarBiblioteca, listarAudios, listarImagens, type ActorId, type BibliotecaMestre } from '@shared/domain';
import { listarSprites } from '@renderer/features/cena';

/** A biblioteca do usuário neste instante (personagens, sprites, imagens e áudios), na forma que o prompt mestre descreve. */
export const bibliotecaAtual = (somente?: ActorId[]): BibliotecaMestre =>
  coletarBiblioteca((id) => listarSprites(id).poses, listarImagens(), listarAudios(), somente);
