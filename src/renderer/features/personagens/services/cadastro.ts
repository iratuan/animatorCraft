import {
  registrarAtor, removerAtor, restaurarAtores, type ActorId, type NovoAtor,
  desserializarPersonagemJSON, aplicarConfigPersonagem, personagemParaJSON,
} from '@shared/domain';
import { definirSkins, removerSprites, type Skin } from '@renderer/features/cena';
import { removerSpritesSalvos } from './spritesSalvos';
import { gravarJson, lerJson } from '@renderer/features/sistema';
import { gravarFichas, lerFichas } from './fichas';
import { carregarAnimacoesSalvas, removerAnimacoesDe } from './animacoes';

/** Personagens criados pelo usuário e a skin de cada um: guardados no navegador/app (localStorage). */
const CHAVE_SKINS = 'stickboard.skins.v1';


export interface PreferenciasSkin { padrao: Skin; porPersonagem: Record<string, Skin> }

/** Chamado antes de abrir a interface: reinstala os personagens e as skins. */
export function carregarPersonagensSalvos(): PreferenciasSkin {
  restaurarAtores(lerFichas());
  carregarAnimacoesSalvas();
  const skins = lerJson<PreferenciasSkin>(CHAVE_SKINS, { padrao: 'stickman', porPersonagem: {} });
  definirSkins(skins.padrao, skins.porPersonagem);
  return skins;
}

export function gravarSkins(p: PreferenciasSkin): void { definirSkins(p.padrao, p.porPersonagem); gravarJson(CHAVE_SKINS, p); }

/** Cria (ou atualiza, com `idExistente`) um personagem e guarda a lista. */
export function salvarPersonagem(n: NovoAtor, idExistente?: ActorId): { id: ActorId } | { erro: string } {
  const r = registrarAtor(n, idExistente);
  if ('id' in r) gravarFichas();
  return r;
}

/** Importa e aplica uma configuração JSON de personagem, persistindo as fichas salvas. */
export function importarPersonagemConfig(conteudoJson: string): { id: ActorId } | { erro: string } {
  const parsed = desserializarPersonagemJSON(conteudoJson);
  if ('erro' in parsed) return { erro: parsed.erro };
  const r = aplicarConfigPersonagem(personagemParaJSON(parsed.spec, parsed.clipes));
  if ('id' in r) gravarFichas();
  return r;
}

/** Exclui um personagem criado pelo usuário, com os sprites dele. */
export async function excluirPersonagem(id: ActorId): Promise<boolean> {
  if (!removerAtor(id)) return false;
  gravarFichas();
  removerSprites(id);
  await removerSpritesSalvos(id);
  removerAnimacoesDe(id);
  return true;
}



