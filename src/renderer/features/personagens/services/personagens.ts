import { registrarAtor, removerAtor, restaurarAtores, type ActorId, type NovoAtor } from '@shared/domain';
import { definirSkins, removerSprites, type Skin } from '@renderer/features/palco/render';
import { removerSpritesSalvos } from '@renderer/features/pacotes-sprites/services/pacotes';
import { gravarFichas, lerFichas } from './fichas';

/** Personagens criados pelo usuário e a skin de cada um: guardados no navegador/app (localStorage). */
const CHAVE_SKINS = 'stickboard.skins.v1';

const ler = <T,>(k: string, padrao: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; } };
const gravar = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };

export interface PreferenciasSkin { padrao: Skin; porPersonagem: Record<string, Skin> }

/** Chamado antes de abrir a interface: reinstala os personagens e as skins. */
export function carregarPersonagensSalvos(): PreferenciasSkin {
  restaurarAtores(lerFichas());
  const skins = ler<PreferenciasSkin>(CHAVE_SKINS, { padrao: 'chibi', porPersonagem: {} });
  definirSkins(skins.padrao, skins.porPersonagem);
  return skins;
}

export function gravarSkins(p: PreferenciasSkin): void { definirSkins(p.padrao, p.porPersonagem); gravar(CHAVE_SKINS, p); }

/** Cria (ou atualiza, com `idExistente`) um personagem e guarda a lista. */
export function salvarPersonagem(n: NovoAtor, idExistente?: ActorId): { id: ActorId } | { erro: string } {
  const r = registrarAtor(n, idExistente);
  if ('id' in r) gravarFichas();
  return r;
}

/** Exclui um personagem criado pelo usuário, com os sprites dele. */
export async function excluirPersonagem(id: ActorId): Promise<boolean> {
  if (!removerAtor(id)) return false;
  gravarFichas();
  removerSprites(id);
  await removerSpritesSalvos(id);
  return true;
}

