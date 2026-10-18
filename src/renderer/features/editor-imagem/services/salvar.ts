import { zipSync } from 'fflate';
import type { ActorId } from '@shared/domain';
import type { SpriteInfo } from '@renderer/features/palco/render';
import { aplicarPacote, lerPacote } from '@renderer/features/pacotes-sprites/services/pacotes';

/**
 * Grava no espaço do personagem o PNG achatado que saiu do editor de imagem. Passa pelo mesmo caminho da importação de pacotes
 * (mesmo nome de arquivo, mesma persistência), mas sem remover fundo nem aparar: a tela é exatamente a que foi desenhada.
 * `encaixe` (só rostos) mantém o encaixe da cabeça medido para a tela original.
 */
export async function salvarSpriteEditado(id: ActorId, tipo: 'pose' | 'rosto' | 'prop', nome: string, png: Uint8Array, encaixe?: SpriteInfo['encaixe']): Promise<void> {
  const zip = zipSync({ [`${id}/${tipo}_${nome}.png`]: png });
  const pacote = lerPacote(zip, { exigirParado: false });
  if (pacote.relatorio.erros.length) throw new Error(pacote.relatorio.erros[0]);
  const r = await aplicarPacote(pacote, false, { bruto: true, encaixe });
  if (r.falhas.length) throw new Error(r.falhas[0]);
}
