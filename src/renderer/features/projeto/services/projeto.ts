import { strFromU8, strToU8, zipSync } from 'fflate';
import { atoresPersonalizados, listarAudios, listarImagens, registrarAtor, sanearTrilhas, type ActorSpec, type EstadoTrilha } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { gravarFichas, lerAnimacoes, mesclarAnimacoes } from '@renderer/features/personagens';
import { bufferBrutoDoAudio, carregarAudiosSalvos, importarAudio } from '@renderer/features/audio';
import { bytesDaImagem, importarImagem } from '@renderer/features/imagens';
import { plataforma } from '@renderer/features/sistema';
import { descompactarComLimites } from './zipSeguro';

/**
 * Projeto = um .zip com tudo da aula: roteiro, personagens criados, áudios, imagens e preferências.
 *   roteiro.txt · projeto.json · animacoes.json · audios/<arquivo> · imagens/<arquivo>
 * Versão 3: sem sprites. Projetos antigos (versão 2) abrem; as pastas sprites/ deles são descartadas e contadas.
 */
const VERSAO = 3;
interface ProjetoJson {
  versao: number;
  nome?: string;
  criadoEm?: string;
  modificadoEm?: string;
  personagens: ActorSpec[];
  fonteLousa: string;
  fonteFala: string;
  formato: string;
  trilhas?: Record<string, EstadoTrilha>;
}

export async function montarProjeto(nomePersonalizado?: string): Promise<{ zip: Uint8Array; audios: number }> {
  const s = useEditor.getState();
  const agora = new Date().toISOString();
  const arquivos: Record<string, Uint8Array> = {};
  arquivos['roteiro.txt'] = strToU8(s.roteiro);
  const json: ProjetoJson = {
    versao: VERSAO,
    nome: nomePersonalizado || s.nomeProjeto,
    modificadoEm: agora,
    personagens: atoresPersonalizados(),
    fonteLousa: s.fonteLousa,
    fonteFala: s.fonteFala,
    formato: s.formato,
    trilhas: s.trilhas,
  };
  arquivos['projeto.json'] = strToU8(JSON.stringify(json, null, 2));
  const animacoes = lerAnimacoes();
  if (animacoes.clipes.length || animacoes.expressoes.length) arquivos['animacoes.json'] = strToU8(JSON.stringify(animacoes, null, 2));
  // áudios e imagens: lidos do mesmo armazenamento em que foram importados
  let audios = 0;
  for (const a of listarAudios()) { const bytes = await bufferBrutoDoAudio(a.nome); if (bytes) { arquivos[`audios/${a.nome}`] = bytes; audios++; } }
  for (const i of listarImagens()) { const b = await bytesDaImagem(i.nome); if (b) arquivos[`imagens/${i.nome}`] = b.bytes; }
  return { zip: zipSync(arquivos, { level: 6 }), audios };
}

/** Salva o projeto atual em formato .zip. */
export async function salvarProjetoZip(nomePersonalizado?: string): Promise<{ resultado: string; audios: number }> {
  const { nomeProjeto, marcarSalvo } = useEditor.getState();
  const nomeLimpo = (nomePersonalizado || nomeProjeto || 'Sem título').trim();
  const { zip, audios } = await montarProjeto(nomeLimpo);
  const nomeSugerido = `${nomeLimpo.replace(/[\s/\\?%*:|"<>]+/g, '_')}.zip`;
  const resultado = await plataforma.salvarZip(zip, nomeSugerido);
  marcarSalvo(null, nomeLimpo);
  return { resultado, audios };
}

/** Abre um projeto: substitui o roteiro, recria os personagens criados e reimporta áudios e imagens. */
export async function abrirProjeto(zip: Uint8Array): Promise<{ audios: number; personagens: number; sprites: number }> {
  const todos = descompactarComLimites(zip);
  if (!todos['projeto.json'] || !todos['roteiro.txt']) throw new Error('Este arquivo não parece um projeto do StickBoard (faltam roteiro.txt e projeto.json).');
  let j: ProjetoJson;
  try { j = JSON.parse(strFromU8(todos['projeto.json'])) as ProjetoJson; } catch { throw new Error('O projeto.json do arquivo está corrompido.'); }
  if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('O projeto.json do arquivo está corrompido.');
  if (typeof j.versao === 'number' && j.versao > VERSAO) throw new Error('Este projeto foi criado por uma versão mais nova do StickBoard. Atualize o aplicativo para abri-lo.');
  const personagens = (Array.isArray(j.personagens) ? j.personagens : []).filter((a): a is ActorSpec => !!a && typeof a === 'object');
  for (const a of personagens) registrarAtor({ id: a.id, nome: a.nome, apelidos: a.apelidos, idade: a.idade, descricao: a.descricao, altura: a.altura, modeloPalito: a.modeloPalito, expressaoPadrao: a.expressaoPadrao, dancaPadrao: a.dancaPadrao, corPele: a.corPele });
  gravarFichas();
  if (todos['animacoes.json']) { try { mesclarAnimacoes(JSON.parse(strFromU8(todos['animacoes.json'])) as Parameters<typeof mesclarAnimacoes>[0]); } catch { /* animacoes.json ilegível: o resto do projeto abre */ } }
  // projetos antigos traziam sprites chibi: não são mais usados, então são descartados e contados
  const sprites = Object.keys(todos).filter((k) => k.startsWith('sprites/')).length;
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
  const nomeCarregado = typeof j.nome === 'string' && j.nome.trim() ? j.nome.trim() : 'Projeto';
  st.set({
    roteiro: strFromU8(todos['roteiro.txt']),
    t: 0,
    trilhas: sanearTrilhas(j.trilhas),
    fonteLousa: typeof j.fonteLousa === 'string' ? j.fonteLousa : st.fonteLousa,
    fonteFala: typeof j.fonteFala === 'string' ? j.fonteFala : st.fonteFala,
    ...(j.formato === '16:9' || j.formato === '9:16' ? { formato: j.formato } : {}),
    nomeProjeto: nomeCarregado,
    modificado: false,
  });
  st.novaVersaoPersonagens(); st.novaVersaoAudio(); st.novaVersaoImagens();
  return { audios, personagens: personagens.length, sprites };
}
