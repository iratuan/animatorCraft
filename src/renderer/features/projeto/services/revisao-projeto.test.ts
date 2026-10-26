// @vitest-environment node
import { strToU8, unzipSync, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ATORES, acharClipe, clipesPersonalizados, definirClipesPersonalizados, definirExpressoesBoneco, ehExpressao, registrarAtor, removerAtor } from '@shared/domain';
import { useEditor, limparHistorico, podeDesfazer, podeRefazer } from '@renderer/store/editor-store';
import { abrirProjeto, montarProjeto } from './projeto';

/**
 * Revisão de lançamento — projeto (.zip): salvar e abrir devem devolver exatamente o que foi guardado, e arquivos de fora
 * (corrompidos, de outra versão, sem os arquivos esperados) devem ser recusados com mensagem, sem estragar o que já está aberto.
 * Sprites, áudios e imagens (IndexedDB/canvas) ficam em tools/e2e/revisao-importacao.mjs.
 */
class Memoria { private m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, String(v)); } removeItem(k: string) { this.m.delete(k); } clear() { this.m.clear(); } }

const criados: string[] = [];
beforeEach(() => { (globalThis as { localStorage?: unknown }).localStorage = new Memoria(); definirClipesPersonalizados([]); definirExpressoesBoneco([]); });
afterEach(() => { for (const id of criados.splice(0)) removerAtor(id); definirClipesPersonalizados([]); definirExpressoesBoneco([]); });

const projetoMinimo = (extra: Record<string, unknown> = {}) => zipSync({ 'roteiro.txt': strToU8('# X\nProfessor acena.'), 'projeto.json': strToU8(JSON.stringify({ versao: 1, personagens: [], fonteLousa: 'comic', fonteFala: 'comic', formato: '16:9', ...extra })) });

describe('projeto: salvar e abrir', () => {
  it('ida e volta preserva roteiro, personagens (com cor de pele), estilos, fontes, clipes e expressões', async () => {
    const r = registrarAtor({ id: 'tia-marta', nome: 'Tia Marta', apelidos: ['tia'], idade: '45 anos', descricao: 'Cozinheira ❤ "boa"', altura: 510, modeloPalito: 'mae', expressaoPadrao: 'empolgada', dancaPadrao: 'danca_hippie', corPele: '#c68642' });
    expect(r).toEqual({ id: 'tia-marta' }); criados.push('tia-marta');
    definirClipesPersonalizados([{ ator: 'tia-marta', id: 'abraco', nome: 'abraço', categoria: 'Movimento', loop: true, estilo: 'ambos', passos: [{ tags: ['parado'], dur: 1, mov: 'balancar', amp: 4 }] }]);
    definirExpressoesBoneco([{ ator: 'tia-marta', nome: 'saudade', quadros: [{ olho: 'meia', sobr: 5, boca: 'triste' }] }]);
    const roteiro = '[papéis: professor=Tia Marta, aluno=BetaSon]\n\n# Ação ☃\nProfessor entra pela esquerda andando. Professor diz "Olá, “mundo”! 😀" feliz.\n';
    useEditor.setState({ roteiro, fonteLousa: 'caveat', fonteFala: 'kalam', formato: '9:16' });
    const { zip } = await montarProjeto();

    // estado limpo, como num computador novo
    removerAtor('tia-marta'); definirClipesPersonalizados([]); definirExpressoesBoneco([]);
    (globalThis as { localStorage?: unknown }).localStorage = new Memoria();
    useEditor.setState({ roteiro: '', fonteLousa: 'comic', fonteFala: 'comic' });
    const lido = await abrirProjeto(zip);

    expect(lido.personagens).toBe(1);
    expect(useEditor.getState().roteiro).toBe(roteiro);
    expect(ATORES['tia-marta']).toMatchObject({ nome: 'Tia Marta', apelidos: expect.arrayContaining(['tia']), idade: '45 anos', altura: 510, modeloPalito: 'mae', expressaoPadrao: 'empolgada', dancaPadrao: 'danca_hippie', corPele: '#c68642' });
    expect(ATORES['tia-marta']!.descricao).toBe('Cozinheira ❤ "boa"');
    expect(acharClipe('tia-marta', 'abraco')?.passos[0]).toMatchObject({ mov: 'balancar', dur: 1 });
    expect(ehExpressao('tia-marta', 'saudade')).toBe(true);
    const s = useEditor.getState();
    expect(s.fonteLousa).toBe('caveat');
    expect(s.fonteFala).toBe('kalam');
  });

  it('abrir duas vezes o mesmo projeto não duplica nada', async () => {
    registrarAtor({ id: 'zeca', nome: 'Zeca' }); criados.push('zeca');
    definirClipesPersonalizados([{ ator: 'zeca', id: 'a', nome: 'a', categoria: 'Movimento', loop: true, estilo: 'ambos', passos: [{ tags: ['parado'], dur: 1, mov: 'respirar' }] }]);
    const { zip } = await montarProjeto();
    await abrirProjeto(zip); await abrirProjeto(zip);
    expect(clipesPersonalizados('zeca').length).toBe(1);
    expect(Object.values(ATORES).filter((a) => a.nome === 'Zeca').length).toBe(1);
  });

  it('o zip do projeto tem os arquivos esperados e roteiro.txt legível em UTF-8', async () => {
    useEditor.setState({ roteiro: 'olá ção', nomeProjeto: 'Minha Aula de Física' });
    const a = unzipSync((await montarProjeto()).zip);
    expect(Object.keys(a)).toEqual(expect.arrayContaining(['roteiro.txt', 'projeto.json']));
    expect(new TextDecoder().decode(a['roteiro.txt'])).toBe('olá ção');
    const meta = JSON.parse(new TextDecoder().decode(a['projeto.json']));
    expect(meta.versao).toBe(3);
    expect(meta.nome).toBe('Minha Aula de Física');
    expect(meta.modificadoEm).toBeDefined();
  });

  it('retrocompatibilidade: abre perfeitamente projetos salvos na versao 1', async () => {
    const zipV1 = projetoMinimo({ versao: 1 });
    const lido = await abrirProjeto(zipV1);
    expect(lido).toBeDefined();
    expect(useEditor.getState().nomeProjeto).toBe('Projeto');
    expect(useEditor.getState().modificado).toBe(false);
  });

  it('roteiro enorme (1 MB) e roteiro vazio fazem a viagem completa', async () => {
    const grande = 'Professor acena. '.repeat(60000);
    for (const t of [grande, '']) {
      useEditor.setState({ roteiro: t });
      const { zip } = await montarProjeto();
      useEditor.setState({ roteiro: 'outro' });
      await abrirProjeto(zip);
      expect(useEditor.getState().roteiro).toBe(t);
    }
  });
});

describe('projeto: arquivos de fora', () => {
  const recusa = async (zip: Uint8Array, trecho: RegExp | string) => {
    useEditor.setState({ roteiro: 'INTACTO' });
    await expect(abrirProjeto(zip)).rejects.toThrow(trecho);
    expect(useEditor.getState().roteiro).toBe('INTACTO'); // recusar não pode estragar o que está aberto
  };
  it('zip comum (sem projeto.json/roteiro.txt) é recusado com mensagem clara', async () => {
    await recusa(zipSync({ 'a.txt': strToU8('x') }), /não parece um projeto/);
    await recusa(zipSync({ 'roteiro.txt': strToU8('x') }), /não parece um projeto/);
    await recusa(zipSync({ 'projeto.json': strToU8('{}') }), /não parece um projeto/);
  });
  it('projeto.json corrompido ou de outro tipo é recusado', async () => {
    for (const ruim of ['{{{ nao json', '', 'null', '123', '"texto"', '[1,2]']) {
      await recusa(zipSync({ 'roteiro.txt': strToU8('x'), 'projeto.json': strToU8(ruim) }), /corrompido/);
    }
  });
  it('projeto de uma versão mais nova é recusado com instrução de atualizar', async () => {
    await recusa(projetoMinimo({ versao: 99 }), /versão mais nova/);
  });
  it('bytes que não são zip são recusados', async () => {
    await expect(abrirProjeto(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow();
    await expect(abrirProjeto(strToU8('PK nada a ver'))).rejects.toThrow();
  });
  it('estilos e fontes inválidos viram os padrões; personagens hostis não derrubam a abertura', async () => {
    const zip = projetoMinimo({ fonteLousa: 42, fonteFala: null, personagens: [{ nome: 'Ok', apelidos: 'x', modeloPalito: 'robo', altura: 'alta', corPele: 'rgb(1,2,3)' }, null, 7, { sem: 'nome' }] });
    criados.push('ok');
    await abrirProjeto(zip);
    const s = useEditor.getState();
    expect(['string']).toContain(typeof s.fonteLousa);
    expect(ATORES['ok']).toMatchObject({ modeloPalito: 'aluno', altura: 440 });
    expect(ATORES['ok']!.corPele).toBeUndefined();
  });
  it('animacoes.json quebrado não impede abrir o resto', async () => {
    const zip = zipSync({ 'roteiro.txt': strToU8('# Novo\nProfessor acena.'), 'projeto.json': strToU8(JSON.stringify({ versao: 1, personagens: [] })), 'animacoes.json': strToU8('[[[') });
    await expect(abrirProjeto(zip)).resolves.toMatchObject({ personagens: 0 });
    expect(useEditor.getState().roteiro).toBe('# Novo\nProfessor acena.');
  });
  it('zip bomba (arquivo declarado enorme) é recusado antes de descompactar', async () => {
    const bomba = zipSync({ 'roteiro.txt': strToU8('x'), 'projeto.json': strToU8('{}'), 'audios/x.wav': new Uint8Array(41 * 1024 * 1024) }, { level: 1 });
    expect(bomba.length).toBeLessThan(200_000);
    await recusa(bomba, /grande demais/);
  });

  it('fecharProjeto reseta estado do projeto, limpa modificações e histórico de undo/redo', () => {
    // Configura estado com modificações
    useEditor.setState({
      roteiro: '# Cena 1\nProfessor diz "Texto modificado".',
      nomeProjeto: 'Meu Projeto Importante',
      modificado: true,
      t: 12.5,
      trilhas: { narracao: { volume: 0.8, mudo: false, solo: true } },
    });

    expect(useEditor.getState().modificado).toBe(true);
    expect(useEditor.getState().nomeProjeto).toBe('Meu Projeto Importante');

    // Executa fechamento
    useEditor.getState().fecharProjeto();
    limparHistorico();

    const estadoFinal = useEditor.getState();
    expect(estadoFinal.modificado).toBe(false);
    expect(estadoFinal.nomeProjeto).toBe('Sem título');
    expect(estadoFinal.caminhoProjeto).toBeNull();
    expect(estadoFinal.t).toBe(0);
    expect(estadoFinal.tocando).toBe(false);
    expect(estadoFinal.trilhas).toEqual({});
    expect(podeDesfazer()).toBe(false);
    expect(podeRefazer()).toBe(false);
  });
});

