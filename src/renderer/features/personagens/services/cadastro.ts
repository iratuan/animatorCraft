import {
  registrarAtor, removerAtor, restaurarAtores, type ActorId, type NovoAtor,
  desserializarPersonagemJSON, aplicarConfigPersonagem, personagemParaJSON,
} from '@shared/domain';
import { gravarFichas, lerFichas } from './fichas';
import { carregarAnimacoesSalvas, removerAnimacoesDe } from './animacoes';

/** Chamado antes de abrir a interface: reinstala os personagens criados pelo usuário e os clipes/expressões deles. */
export function carregarPersonagensSalvos(): void {
  restaurarAtores(lerFichas());
  carregarAnimacoesSalvas();
}

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

/** Exclui um personagem criado pelo usuário, com os clipes e expressões dele. */
export async function excluirPersonagem(id: ActorId): Promise<boolean> {
  if (!removerAtor(id)) return false;
  gravarFichas();
  removerAnimacoesDe(id);
  return true;
}
