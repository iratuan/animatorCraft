import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { atoresPersonalizados, registrarAtor, type ActorSpec } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { aplicarPacote, lerEntradasSalvas, lerPacote } from '@renderer/features/pacotes-sprites/services/pacotes';
import { gravarFichas } from '@renderer/features/personagens/services/fichas';
import { gravarSkins } from '@renderer/features/personagens/services/personagens';
import { carregarAudiosSalvos, importarAudio } from '@renderer/features/audio/services/armazenamento';
import { listarAudios } from '@shared/domain';

/**
 * Projeto = um .zip com tudo da aula: roteiro, personagens criados, estilos, sprites trocados/importados, áudios e preferências.
 *   roteiro.txt · projeto.json · sprites/<personagem>/<tipo>_<nome>.png · audios/<arquivo>
 */
const VERSAO = 1;
interface ProjetoJson { versao: number; personagens: ActorSpec[]; skinPadrao: string; skins: Record<string, string>; fonteLousa: string; fonteFala: string; formato: string }

async function bytesDeUrl(url: string): Promise<Uint8Array> { return new Uint8Array(await (await fetch(url)).arrayBuffer()); }

export async function montarProjeto(): Promise<{ zip: Uint8Array; sprites: number; audios: number }> {
  const s = useEditor.getState();
  const arquivos: Record<string, Uint8Array> = {};
  arquivos['roteiro.txt'] = strToU8(s.roteiro);
  const json: ProjetoJson = { versao: VERSAO, personagens: atoresPersonalizados(), skinPadrao: s.skinPadrao, skins: s.skins, fonteLousa: s.fonteLousa, fonteFala: s.fonteFala, formato: s.formato };
  arquivos['projeto.json'] = strToU8(JSON.stringify(json, null, 2));
  let sprites = 0;
  for (const e of await lerEntradasSalvas()) {
    arquivos[`sprites/${e.personagem}/${e.info.tipo ?? 'pose'}_${e.info.tags[0]}${e.info.variante ? `_${e.info.variante}` : ''}.png`] = await bytesDeUrl(e.url);
    sprites++;
  }
  // áudios: lidos do mesmo armazenamento em que foram importados
  const { bufferBrutoDoAudio } = await import('@renderer/features/audio/services/armazenamento');
  let audios = 0;
  for (const a of listarAudios()) { const bytes = await bufferBrutoDoAudio(a.nome); if (bytes) { arquivos[`audios/${a.nome}`] = bytes; audios++; } }
  return { zip: zipSync(arquivos, { level: 6 }), sprites, audios };
}

/** Abre um projeto: substitui o roteiro, recria personagens/estilos e reimporta sprites e áudios. */
export async function abrirProjeto(zip: Uint8Array): Promise<{ sprites: number; audios: number; personagens: number }> {
  const todos = unzipSync(zip);
  if (!todos['projeto.json'] || !todos['roteiro.txt']) throw new Error('Este arquivo não parece um projeto do StickBoard (faltam roteiro.txt e projeto.json).');
  const j = JSON.parse(strFromU8(todos['projeto.json'])) as ProjetoJson;
  for (const a of j.personagens ?? []) registrarAtor({ nome: a.nome, apelidos: a.apelidos, idade: a.idade, descricao: a.descricao, altura: a.altura, modeloPalito: a.modeloPalito, expressaoPadrao: a.expressaoPadrao, dancaPadrao: a.dancaPadrao });
  gravarFichas();
  // sprites: reaproveita a importação de pacotes (mesmo padrão de nomes)
  const sub: Record<string, Uint8Array> = {};
  for (const [k, v] of Object.entries(todos)) if (k.startsWith('sprites/')) sub[k.slice('sprites/'.length)] = v;
  let sprites = 0;
  if (Object.keys(sub).length) {
    const pacote = lerPacote(zipSync(sub), { exigirParado: false });
    sprites = (await aplicarPacote(pacote, false)).importados;
  }
  let audios = 0;
  for (const [k, v] of Object.entries(todos)) {
    if (!k.startsWith('audios/')) continue;
    try { await importarAudio(new File([v as BlobPart], k.slice('audios/'.length))); audios++; } catch { /* arquivo de áudio ilegível: segue sem ele */ }
  }
  await carregarAudiosSalvos();
  const st = useEditor.getState();
  gravarSkins({ padrao: (j.skinPadrao as 'chibi' | 'stickman') ?? 'chibi', porPersonagem: (j.skins ?? {}) as Record<string, 'chibi' | 'stickman'> });
  st.set({ roteiro: strFromU8(todos['roteiro.txt']), t: 0, skinPadrao: (j.skinPadrao as 'chibi' | 'stickman') ?? 'chibi', skins: (j.skins ?? {}) as Record<string, 'chibi' | 'stickman'>, fonteLousa: j.fonteLousa ?? st.fonteLousa, fonteFala: j.fonteFala ?? st.fonteFala });
  st.novaVersaoPersonagens(); st.novaVersaoAudio();
  return { sprites, audios, personagens: (j.personagens ?? []).length };
}

