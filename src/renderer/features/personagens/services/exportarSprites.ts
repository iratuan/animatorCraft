import { strToU8, zipSync } from 'fflate';
import { ATORES, EXPRESSOES, ROSTOS_ESPECIAIS, type ActorId } from '@shared/domain';
import { type SpriteInfo } from '@renderer/features/cena';
import { bytesDeUrl } from '@renderer/features/sistema';
import { lerEntradasSalvas } from './spritesSalvos';
import { lerAnimacoes } from './animacoes';
import { manifestoOriginal, urlOriginal } from './bibliotecaSprites';

/**
 * Exportação de sprites para edição externa (Photoshop, Krita, GIMP, Photopea…).
 * O zip segue o mesmo padrão da importação (docs/SPRITES.md): editar um PNG, manter o nome e importar de volta funciona.
 *   <personagem>/pose_<nome>[_n].png | rosto_<expressão|boca-a|boca-e|boca-o|boca-m|olhos-fechados>.png | prop_<nome>.png
 *   <personagem>/meta.json   (caixa da cabeça, âncoras, encaixe dos rostos)
 *   <personagem>/FALTANDO.txt (o que ainda dá para criar: expressões, bocas, piscada)
 * Os PNGs saem coloridos, como o original; o app converte para cinza ao carregar.
 */
const nomeArquivo = (s: SpriteInfo) => `${s.tipo ?? 'pose'}_${s.tags[0]}${s.variante ? `_${s.variante}` : ''}.png`;
const chave = (s: SpriteInfo) => `${s.tipo}|${s.tags[0]}|${s.variante ?? ''}`;

/** O sprite de um espaço (o importado/editado tem prioridade sobre o original do app): informações e data URL do PNG colorido. */
export async function obterSprite(id: ActorId, tipo: 'pose' | 'rosto' | 'prop', nome: string): Promise<{ info: SpriteInfo; url: string } | null> {
  // "andar_2" = quadro 2 da animação "andar"; "andar" = o sprite sem número
  const m = /^(.+)_(\d+)$/.exec(nome), base = m ? m[1]! : nome, variante = m ? Number(m[2]) : null;
  const bate = (s: SpriteInfo) => (s.tipo ?? 'pose') === tipo && s.tags[0] === base && (s.variante ?? null) === variante;
  const salvo = (await lerEntradasSalvas()).find((e) => e.personagem === id && bate(e.info));
  if (salvo) return { info: salvo.info, url: salvo.url };
  const original = (manifestoOriginal[id]?.sprites ?? []).find(bate);
  const url = original && urlOriginal(original.arquivo);
  return original && url ? { info: original, url } : null;
}

export const nomeDoZip =(ids: ActorId[]) => (ids.length === 1 ? `sprites-${ids[0]}.zip` : 'sprites-todos.zip');

export async function montarPacoteExportacao(ids: ActorId[]): Promise<{ zip: Uint8Array; total: number }> {
  const salvos = await lerEntradasSalvas();
  const arquivos: Record<string, Uint8Array> = {
    'LEIA-ME.txt': strToU8(leiaMe()),
  };
  let total = 0;
  for (const id of ids) {
    const lista = new Map<string, { info: SpriteInfo; dados: Uint8Array }>();
    const pendentes: Promise<void>[] = [];
    for (const s of manifestoOriginal[id]?.sprites ?? []) {
      const url = urlOriginal(s.arquivo);
      if (url) pendentes.push(bytesDeUrl(url).then((dados) => { lista.set(chave(s), { info: s, dados }); }));
    }
    await Promise.all(pendentes);
    for (const e of salvos.filter((x) => x.personagem === id)) lista.set(chave(e.info), { info: e.info, dados: await bytesDeUrl(e.url) }); // o que o usuário importou vale mais que o original
    const spec = ATORES[id];
    if (spec?.personalizado) {
      arquivos[`${id}/ficha.json`] = strToU8(JSON.stringify({ nome: spec.nome, apelidos: spec.apelidos, idade: spec.idade, descricao: spec.descricao, altura: spec.altura, modeloPalito: spec.modeloPalito, expressaoPadrao: spec.expressaoPadrao, dancaPadrao: spec.dancaPadrao }, null, 2));
      total++;
    }
    const proprias = { clipes: lerAnimacoes().clipes.filter((c) => c.ator === id), expressoes: lerAnimacoes().expressoes.filter((x) => x.ator === id) };
    if (proprias.clipes.length || proprias.expressoes.length) { arquivos[`${id}/animacoes.json`] = strToU8(JSON.stringify(proprias, null, 2)); total++; }
    if (!lista.size) { if (spec?.personalizado) arquivos[`${id}/FALTANDO.txt`] = strToU8(faltando(id, [])); continue; }

    const meta: Record<string, unknown> = { personagem: id, nome: ATORES[id]?.nome ?? id, ancora: {} as Record<string, string>, encaixe: {} as Record<string, unknown> };
    const parado = [...lista.values()].find((x) => x.info.tipo === 'pose' && x.info.tags[0] === 'parado');
    if (parado?.info.rosto) meta.cabeca = parado.info.rosto.cabeca;
    if (parado) meta.base = { w: parado.info.w, h: parado.info.h };
    for (const { info, dados } of lista.values()) {
      arquivos[`${id}/${nomeArquivo(info)}`] = dados;
      if (info.ancora === 'topo') (meta.ancora as Record<string, string>)[info.tags[0]!] = 'topo';
      if (info.encaixe) (meta.encaixe as Record<string, unknown>)[info.tags[0]!] = info.encaixe;
      total++;
    }
    arquivos[`${id}/meta.json`] = strToU8(JSON.stringify(meta, null, 2));
    arquivos[`${id}/FALTANDO.txt`] = strToU8(faltando(id, [...lista.values()].map((x) => x.info)));
  }
  return { zip: zipSync(arquivos, { level: 6 }), total };
}

function faltando(id: ActorId, sprites: SpriteInfo[]): string {
  const tem = (tipo: string, nome: string) => sprites.some((s) => s.tipo === tipo && s.tags[0] === nome);
  const rostos = [...EXPRESSOES, ...ROSTOS_ESPECIAIS].filter((n) => !tem('rosto', n));
  const linhas = [`Ainda não existem para ${ATORES[id]?.nome ?? id} (crie com estes nomes exatos e importe o zip):`, ''];
  if (!tem('pose', 'parado')) linhas.push('OBRIGATÓRIO: pose_parado.png (corpo inteiro, de frente)', '');
  linhas.push(rostos.length ? rostos.map((n) => `  rosto_${n}.png`).join('\n') : '  (todas as expressões e bocas já existem)');
  return linhas.join('\n') + '\n';
}

function leiaMe(): string {
  return `StickBoard — sprites para edição
=================================

Estrutura:  <personagem>/<tipo>_<nome>[_n].png
  pose_<nome>.png      corpo inteiro. pose_parado é obrigatório. pose_andar_1, pose_andar_2… formam uma animação (8 quadros/s).
  rosto_<nome>.png     só a CABEÇA, com a mesma pele, cabelo e óculos do personagem.
                         expressões: ${EXPRESSOES.join(', ')}
                         fala (visemas): boca-a, boca-e, boca-o, boca-m   piscada: olhos-fechados
  prop_<nome>.png      objeto solto (lápis, skate, bola…).

Regras para editar:
  1. Mantenha o nome do arquivo (minúsculas, sem acento, hífen no lugar de espaço).
  2. PNG com fundo transparente. Se vier com fundo branco, o app remove o branco ligado às bordas.
  3. Em rosto_*: mantenha o mesmo tamanho de tela da cabeça original e a MESMA COR DE PELE do personagem
     (o rosto é desenhado por cima da cabeça do pose_parado). Para uma expressão nova, copie rosto_neutra e mude só olhos/sobrancelhas/boca.
  4. Não é preciso mexer em meta.json; só se mudar o tamanho do pose_parado (aí o app recalcula o encaixe pela caixa da cabeça).
  5. Zip de volta: Arquivo ▸ Importar pacote de sprites. Pode mandar só os arquivos que mudaram.
`;
}






