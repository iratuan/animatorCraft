import { atoresPersonalizados, type ActorSpec } from '@shared/domain';

/** Lista de personagens criados pelo usuário, guardada no navegador/app. */
export const CHAVE_FICHAS = 'stickboard.personagens.v1';

export const lerFichas = (): ActorSpec[] => { try { return JSON.parse(localStorage.getItem(CHAVE_FICHAS) ?? '[]') as ActorSpec[]; } catch { return []; } };
export const gravarFichas = (): void => { try { localStorage.setItem(CHAVE_FICHAS, JSON.stringify(atoresPersonalizados())); } catch { /* sem armazenamento */ } };
