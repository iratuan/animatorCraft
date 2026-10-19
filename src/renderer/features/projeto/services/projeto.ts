import { strFromU8, strToU8, zipSync } from 'fflate';
import { atoresPersonalizados, listarAudios, listarImagens, registrarAtor, sanearTrilhas, type ActorSpec, type EstadoTrilha } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { aplicarPacote, descompactarComLimites, lerAnimacoes, lerEntradasSalvas, lerPacote, gravarFichas, gravarSkins, mesclarAnimacoes } from '@renderer/features/personagens';
import { bufferBrutoDoAudio, carregarAudiosSalvos, importarAudio } from '@renderer/features/audio';
import { bytesDaImagem, importarImagem } from '@renderer/features/imagens';
import { bytesDeUrl } from '@renderer/features/sistema';

/**
 * Projeto = um .zip com tudo da aula: roteiro, personagens criados, estilos, sprites trocados/importados, áudios e preferências.
 *   roteiro.txt · projeto.json · sprites/<personagem>/<tipo>_<nome>.png · audios/<arquivo>
 */
const VERSAO = 1;
interface ProjetoJson { versao: number; personagens: ActorSpec[]; skinPadrao: string; skins: Record<string, string>; fonteLousa: string; fonteFala: string; formato: string; trilhas?: Record<string, EstadoTrilha> }


export async function montarProjeto(): Promise<{ zip: Uint8Array; sprites: number; audios: number }> {
  const s = useEditor.getState();
  const arquivos: Record<string, Uint8Array> = {};
  arquivos['roteiro.txt'] = strToU8(s.roteiro);
  const json: ProjetoJson = { versao: VERSAO, personagens: atoresPersonalizados(), skinPadrao: s.skinPadrao, skins: s.skins, fonteLousa: s.fonteLousa, fonteFala: s.fonteFala, formato: s.formato, trilhas: s.trilhas };
  arquivos['projeto.json'] = strToU8(JSON.stringify(json, null, 2));
  const animacoes = lerAnimacoes();
  if (animacoes.clipes.length || animacoes.expressoes.length) arquivos['animacoes.json'] = strToU8(JSON.stringify(animacoes, null, 2));
  let sprites = 0;
  for (const e of await lerEntradasSalvas()) {
    arquivos[`sprites/${e.personagem}/${e.info.tipo ?? 'pose'}_${e.info.tags[0]}${e.info.variante ? `_${e.info.variante}` : ''}.png`] = await bytesDeUrl(e.url);
    sprites++;
  }
  // áudios: lidos do mesmo armazenamento em que foram importados
  let audios = 0;
  for (const a of listarAudios()) { const bytes = await bufferBrutoDoAudio(a.nome); if (bytes) { arquivos[`audios/${a.nome}`] = bytes; audios++; } }
  for (const i of listarImagens()) { const b = await bytesDaImagem(i.nome); if (b) arquivos[`imagens/${i.nome}`] = b.bytes; }
  return { zip: zipSync(arquivos, { level: 6 }), sprites, audios };
}

/** Abre um projeto: substitui o roteiro, recria personagens/estilos e reimporta sprites e áudios. */
export async function abrirProjeto(zip: Uint8Array): Promise<{ sprites: number; audios: number; personagens: number }> {
  const todos = descompactarComLimites(zip);
  if (!todos['projeto.json'] || !todos['roteiro.txt']) throw new Error('Este arquivo não parece um projeto do StickBoard (faltam roteiro.txt e projeto.json).');
  let j: ProjetoJson;
  try { j = JSON.parse(strFromU8(todos['projeto.json'])) as ProjetoJson; } catch { throw new Error('O projeto.json do arquivo está corrompido.'); }
  if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('O projeto.json do arquivo está corrompido.');
  if (typeof j.versao === 'number' && j.versao > VERSAO) throw new Error('Este projeto foi criado por uma versão mais nova do StickBoard. Atualize o aplicativo para abri-lo.');
  const skinValida = (s: unknown): s is 'chibi' | 'stickman' => s === 'chibi' || s === 'stickman';
  const skins: Record<string, 'chibi' | 'stickman'> = {};
  for (const [k, v] of Object.entries(j.skins && typeof j.skins === 'object' ? j.skins : {})) if (skinValida(v)) skins[k] = v;
  const skinPadrao = skinValida(j.skinPadrao) ? j.skinPadrao : 'chibi';
  const personagens = (Array.isArray(j.personagens) ? j.personagens : []).filter((a): a is ActorSpec => !!a && typeof a === 'object');
  for (const a of personagens) registrarAtor({ id: a.id, nome: a.nome, apelidos: a.apelidos, idade: a.idade, descricao: a.descricao, altura: a.altura, modeloPalito: a.modeloPalito, expressaoPadrao: a.expressaoPadrao, dancaPadrao: a.dancaPadrao, corPele: a.corPele });
  gravarFichas();
  if (todos['animacoes.json']) { try { mesclarAnimacoes(JSON.parse(strFromU8(todos['animacoes.json'])) as Parameters<typeof mesclarAnimacoes>[0]); } catch { /* animacoes.json ilegível: o resto do projeto abre */ } }
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
  for (const [k, v] of Object.entries(todos)) {
    if (!k.startsWith('imagens/')) continue;
    const nome = k.slice('imagens/'.length), mime = /\.jpe?g$/i.test(nome) ? 'image/jpeg' : /\.webp$/i.test(nome) ? 'image/webp' : 'image/png';
    try { await importarImagem(new File([v as BlobPart], nome, { type: mime })); } catch { /* imagem ilegível: o roteiro mostra o aviso */ }
  }
  await carregarAudiosSalvos();
  const st = useEditor.getState();
  gravarSkins({ padrao: skinPadrao, porPersonagem: skins });
  st.set({ roteiro: strFromU8(todos['roteiro.txt']), t: 0, skinPadrao, skins, trilhas: sanearTrilhas(j.trilhas), fonteLousa: typeof j.fonteLousa === 'string' ? j.fonteLousa : st.fonteLousa, fonteFala: typeof j.fonteFala === 'string' ? j.fonteFala : st.fonteFala, ...(j.formato === '16:9' || j.formato === '9:16' ? { formato: j.formato } : {}) });
  st.novaVersaoPersonagens(); st.novaVersaoAudio(); st.novaVersaoImagens();
  return { sprites, audios, personagens: personagens.length };
}




