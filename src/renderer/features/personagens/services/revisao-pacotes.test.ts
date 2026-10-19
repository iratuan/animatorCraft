// @vitest-environment node
import { strToU8, unzipSync, zipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { analisarPacote, ATORES, EXPRESSOES, ORDEM_ATORES, registrarAtor, removerAtor } from '@shared/domain';
import { descompactarComLimites, LIMITE_ARQUIVO_ZIP, LIMITE_ENTRADAS_ZIP, lerPacote } from './pacotes';
import { montarPacoteExportacao } from './exportarSprites';
import { manifestoOriginal } from './bibliotecaSprites';

/**
 * Revisão de lançamento — sprites, importação e exportação (parte pura, sem navegador): leitura de zips de fora, nomes, fichas e limites.
 * O que precisa de canvas/IndexedDB (aplicar o pacote, persistência) é testado no navegador: tools/e2e/revisao-sprites.mjs.
 */
// no Node o Vite entrega os PNGs por caminho (no navegador são data URLs): lê do disco no lugar do fetch
vi.mock('@renderer/features/sistema', async (original) => ({ ...(await original<typeof import('@renderer/features/sistema')>()), bytesDeUrl: async (url: string) => new Uint8Array(readFileSync(join(process.cwd(), url.split('?')[0]!))) }));

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const criados: string[] = [];
const novo = (nome: string, extra: Partial<Parameters<typeof registrarAtor>[0]> = {}) => {
  const r = registrarAtor({ nome, ...extra });
  if ('id' in r) criados.push(r.id);
  return r;
};
afterEach(() => { for (const id of criados.splice(0)) removerAtor(id); });

describe('leitura de zip (lerPacote)', () => {
  it('pacote completo de um personagem: nomes, quadros, rostos e props', () => {
    const zip = zipSync({
      'betason/pose_parado.png': PNG, 'betason/pose_andar_1.png': PNG, 'betason/pose_andar_2.png': PNG, 'betason/pose_andar_3.png': PNG,
      'betason/rosto_feliz.png': PNG, 'betason/rosto_boca-a.png': PNG, 'betason/rosto_olhos-fechados.png': PNG, 'betason/prop_skate.png': PNG,
      'betason/meta.json': strToU8(JSON.stringify({ cabeca: { x: 0.1, y: 0, w: 0.8, h: 0.3 } })),
    });
    const p = lerPacote(zip);
    expect(p.relatorio.erros).toEqual([]);
    expect(p.relatorio.resumo.betason).toEqual({ poses: ['parado', 'andar'], rostos: ['feliz', 'boca-a', 'olhos-fechados'], props: ['skate'], quadros: { andar: 3 } });
    expect(p.meta.betason?.cabeca?.w).toBe(0.8);
  });

  it('ignora lixo comum de zips (__MACOSX, arquivos ocultos, pastas, Thumbs.db) e avisa dos outros formatos', () => {
    const zip = zipSync({
      '__MACOSX/betason/._pose_parado.png': PNG, 'betason/.DS_Store': PNG, 'betason/pose_parado.png': PNG, 'betason/Thumbs.db': PNG,
      'betason/foto.jpg': PNG, 'betason/notas.txt': strToU8('oi'), 'betason/leia-me.md': strToU8('oi'),
    });
    const p = lerPacote(zip);
    expect(p.relatorio.erros).toEqual([]);
    expect(p.relatorio.sprites.map((s) => s.nome)).toEqual(['parado']);
    expect(p.relatorio.avisos.filter((a) => a.startsWith('Arquivo ignorado')).length).toBeGreaterThanOrEqual(3);
  });

  it('zip só com imagens que não são PNG, ou vazio, é recusado com mensagem clara', () => {
    expect(lerPacote(zipSync({ 'betason/pose_parado.jpg': PNG })).relatorio.erros.join(' ')).toContain('Nenhum sprite');
    expect(lerPacote(zipSync({ 'nada.txt': strToU8('x') })).relatorio.erros.join(' ')).toContain('Nenhum sprite');
  });

  it('bytes que não são um zip fazem lerPacote lançar (a interface mostra a mensagem), nunca travar', () => {
    for (const lixo of [new Uint8Array(0), new Uint8Array([1, 2, 3]), strToU8('isto não é um zip'), new Uint8Array(5000).fill(0x50)]) {
      expect(() => lerPacote(lixo)).toThrow();
    }
  });

  it('pacote truncado ou com bytes trocados não passa por válido', () => {
    const zip = zipSync({ 'betason/pose_parado.png': new Uint8Array(2000).map((_, i) => (i * 7) & 255) });
    const quebrado = zip.slice(0, Math.floor(zip.length / 2));
    expect(() => lerPacote(quebrado)).toThrow();
  });

  it('personagem desconhecido sem ficha é erro; com ficha.json, o personagem novo é reconhecido', () => {
    expect(lerPacote(zipSync({ 'tia-marta/pose_parado.png': PNG })).relatorio.erros.join(' ')).toContain('não sei de qual personagem');
    const p = lerPacote(zipSync({ 'tia-marta/pose_parado.png': PNG, 'tia-marta/ficha.json': strToU8(JSON.stringify({ nome: 'Tia Marta', idade: '45 anos' })) }));
    expect(p.relatorio.erros).toEqual([]);
    expect(p.fichas['tia-marta']?.nome).toBe('Tia Marta');
  });

  it('ficha.json com JSON quebrado, sem nome ou de personagem que já existe é ignorada sem derrubar a leitura', () => {
    const p = lerPacote(zipSync({
      'betason/pose_parado.png': PNG, 'betason/ficha.json': strToU8('{"nome":"Outro"}'), // betason já existe
      'zeca/pose_parado.png': PNG, 'zeca/ficha.json': strToU8('{ nao é json'),
      'lia/pose_parado.png': PNG, 'lia/ficha.json': strToU8('{"idade":"8"}'),
    }));
    expect(Object.keys(p.fichas)).toEqual([]);
    expect(p.relatorio.erros.filter((e) => e.includes('zeca') || e.includes('lia')).length).toBeGreaterThan(0);
  });

  it('meta.json inválido vira aviso; animacoes.json ilegível não impede o resto', () => {
    const p = lerPacote(zipSync({ 'erika/pose_parado.png': PNG, 'erika/meta.json': strToU8('{{{'), 'erika/animacoes.json': strToU8('[[[') }));
    expect(p.relatorio.erros).toEqual([]);
    expect(p.relatorio.avisos.some((a) => a.includes('meta.json inválido'))).toBe(true);
    expect(p.animacoes).toEqual({ clipes: [], expressoes: [] });
  });

  it('animacoes.json: o personagem é o da pasta, e entradas fora do formato não quebram', () => {
    const p = lerPacote(zipSync({
      'dario/animacoes.json': strToU8(JSON.stringify({ clipes: [{ ator: 'erika', id: 'x', nome: 'x', passos: [] }, 7, null], expressoes: 'não é lista' })),
    }));
    expect(p.animacoes.clipes.every((c) => c.ator === 'dario')).toBe(true);
    expect(p.animacoes.expressoes).toEqual([]);
    expect(p.relatorio.erros).toEqual([]); // um zip só de animações é válido
  });

  it('nomes difíceis: maiúsculas, acentos, espaços, caminhos do Windows e pasta-raiz', () => {
    const p = lerPacote(zipSync({
      'Pacote Final/Erika/Pose_Parado.PNG': PNG, 'Pacote Final/Erika/Pose_Bracos Cruzados.png': PNG, 'Pacote Final/Erika/Rosto_Sarcástica.png': PNG,
    }));
    expect(p.relatorio.erros).toEqual([]);
    expect(p.relatorio.sprites.map((s) => `${s.tipo}_${s.nome}`).sort()).toEqual(['pose_bracos-cruzados', 'pose_parado', 'rosto_sarcastica']);
    const win = analisar(['erika\\pose_parado.png', 'erika\\rosto_feliz.png']);
    expect(win.erros).toEqual([]);
  });

  it('quadros: lacunas e mistura de com/sem número são tratadas; duplicados são erro', () => {
    expect(analisar(['erika/pose_parado.png', 'erika/pose_andar_1.png', 'erika/pose_andar_3.png']).avisos.some((a) => a.includes('sem buracos'))).toBe(true);
    expect(analisar(['erika/pose_parado.png', 'erika/pose_andar.png', 'erika/pose_andar_1.png']).erros.some((e) => e.includes('versão sem número e com número'))).toBe(true);
    // um zip não guarda dois arquivos com o mesmo caminho; o duplicado real aparece quando duas grafias viram o mesmo nome
    expect(analisarPacote(['erika/pose_parado.png', 'erika/pose_parado.png'], { personagens: ['erika'], expressoes: [] }).erros.some((e) => e.includes('duplicado'))).toBe(true);
    expect(analisar(['erika/pose_parado.png', 'erika/Pose_Parado.PNG']).erros.some((e) => e.includes('duplicado'))).toBe(true);
    expect(analisar(['erika/pose_parado.png', 'erika/rosto_boca-a_2.png']).erros.some((e) => e.includes('não tem número de quadro'))).toBe(true);
    expect(analisar(['erika/pose_parado.png', 'erika/rosto_triste.png', 'erika/rosto_triste_1.png']).erros.some((e) => e.includes('rosto "triste"'))).toBe(true);
  });

  it('quem já tem pose_parado no app não precisa mandar de novo (pacote só com o que mudou); quem não tem, precisa', () => {
    const op = { personagens: ['betason', 'erika'], expressoes: [...EXPRESSOES], exigirParado: (id: string) => id !== 'betason' };
    expect(analisarPacote(['betason/rosto_feliz.png'], op).erros).toEqual([]);
    expect(analisarPacote(['erika/rosto_feliz.png'], op).erros.join(' ')).toContain('falta a pose obrigatória pose_parado');
    expect(analisarPacote(['betason/rosto_feliz.png'], { ...op, exigirParado: true }).erros.length).toBe(1);
    expect(analisarPacote(['betason/rosto_feliz.png'], { ...op, exigirParado: false }).erros).toEqual([]);
  });

  it('nomes inválidos são recusados com a regra explicada', () => {
    for (const ruim of ['erika/pose_.png', 'erika/pose__x.png', 'erika/pose_Á_.png', 'erika/pose_com espaco duplo  .png', 'erika/pose_x_y_z.png', 'erika/rosto-feliz.png', 'erika/prop.png', 'erika/pose_a--b.png', 'erika/pose_-a.png']) {
      const r = analisar(['erika/pose_parado.png', ruim]);
      expect(r.erros.length, ruim).toBeGreaterThan(0);
    }
  });

  it('fuzz: nomes aleatórios nunca lançam e sempre dão um relatório coerente', () => {
    const alfabeto = ['pose', 'rosto', 'prop', '_', '-', '1', '12', 'a', 'Ç', ' ', '/', '\\', '.png', '.PNG', '..', 'erika', 'betason', '__MACOSX', 'meta.json', '\u0000', '😀'];
    let semente = 12345;
    const rnd = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
    for (let n = 0; n < 400; n++) {
      const caminhos = Array.from({ length: 1 + Math.floor(rnd() * 8) }, () => Array.from({ length: 1 + Math.floor(rnd() * 6) }, () => alfabeto[Math.floor(rnd() * alfabeto.length)]).join(''));
      const r = analisar(caminhos);
      expect(Array.isArray(r.erros) && Array.isArray(r.avisos) && Array.isArray(r.sprites)).toBe(true);
      for (const s of r.sprites) expect(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.nome)).toBe(true);
    }
  });
});

describe('limites contra zips malignos', () => {
  const zeros = (mb: number) => new Uint8Array(mb * 1024 * 1024);
  it('arquivo declarado acima do limite é recusado antes de descompactar', () => {
    const zip = zipSync({ 'betason/pose_parado.png': zeros(LIMITE_ARQUIVO_ZIP / 1048576 + 1) }, { level: 1 });
    expect(zip.length).toBeLessThan(200_000); // "bomba": poucos KB que virariam dezenas de MB
    expect(() => lerPacote(zip)).toThrow(/grande demais/);
  });
  it('soma de arquivos acima do limite e excesso de entradas são recusados', () => {
    const um = zeros(38), arquivos: Record<string, Uint8Array> = {};
    for (let i = 0; i < 11; i++) arquivos[`betason/pose_x${i}.png`] = um;
    expect(() => descompactarComLimites(zipSync(arquivos, { level: 1 }))).toThrow(/passa de/);
    const muitos: Record<string, Uint8Array> = {};
    for (let i = 0; i < LIMITE_ENTRADAS_ZIP + 5; i++) muitos[`a/b${i}.txt`] = new Uint8Array(1);
    expect(() => descompactarComLimites(zipSync(muitos, { level: 0 }))).toThrow(/arquivos demais/);
  });
  it('um zip normal passa e as pastas não contam como arquivo', () => {
    const r = descompactarComLimites(zipSync({ 'a/': new Uint8Array(0), 'a/b.png': PNG }));
    expect(Object.keys(r)).toEqual(['a/b.png']);
  });
});

describe('ficha do personagem (registrarAtor) com dados de fora', () => {
  it('o id da pasta é respeitado, mesmo que o nome gere outro', () => {
    const r = novo('Tia Marta', { id: 'marta' });
    expect(r).toEqual({ id: 'marta' });
    expect(ATORES['marta']?.nome).toBe('Tia Marta');
    expect(ATORES['tia-marta']).toBeUndefined();
  });
  it('id inválido é ignorado (usa o do nome); id de personagem existente é recusado', () => {
    expect(novo('Pedro', { id: '../../x' })).toEqual({ id: 'pedro' });
    expect('erro' in registrarAtor({ nome: 'Outro', id: 'betason' })).toBe(true);
    expect(ATORES['betason']?.nome).toBe('BetaSon');
  });
  it('campos hostis ou fora do formato viram valores seguros, sem lançar', () => {
    const lixo = { nome: 'Hostil', apelidos: 'não é lista' as unknown as string[], modeloPalito: 'robo' as never, expressaoPadrao: 'furiosa' as never, dancaPadrao: 'danca_xyz', altura: 'alta' as unknown as number, corPele: 'url(javascript:alert(1))', idade: 42 as unknown as string, descricao: { x: 1 } as unknown as string };
    const r = novo('Hostil', lixo);
    expect('id' in r).toBe(true);
    const a = ATORES['hostil']!;
    expect(a.modeloPalito).toBe('aluno');
    expect(a.expressaoPadrao).toBe('feliz');
    expect(a.dancaPadrao).toBeUndefined();
    expect(a.altura).toBe(440);
    expect(a.corPele).toBeUndefined();
    expect(a.idade).toBe('');
    expect(a.descricao).toBe('');
    expect(a.apelidos.length).toBeGreaterThan(0);
  });
  it('valores extremos são limitados; cor de pele válida é mantida', () => {
    novo('Gigante', { altura: 1e9, corPele: '#a1b2c3', descricao: 'x'.repeat(5000), idade: 'y'.repeat(500) });
    const a = ATORES['gigante']!;
    expect(a.altura).toBe(640);
    expect(a.corPele).toBe('#a1b2c3');
    expect(a.descricao.length).toBe(400);
    expect(a.idade.length).toBe(40);
    novo('Anao', { altura: -50 }); expect(ATORES['anao']!.altura).toBe(220);
    novo('Nan', { altura: NaN }); expect(ATORES['nan']!.altura).toBe(440);
  });
  it('apelido que é palavra do roteiro ou de outro personagem é recusado; nomes só de símbolos também', () => {
    expect('erro' in registrarAtor({ nome: 'Fulano', apelidos: ['professor'] })).toBe(true);
    expect('erro' in registrarAtor({ nome: 'Fulano', apelidos: ['erika'] })).toBe(true);
    expect('erro' in registrarAtor({ nome: '!!!' })).toBe(true);
    expect('erro' in registrarAtor({ nome: '   ' })).toBe(true);
    expect('erro' in registrarAtor(null as never)).toBe(true);
    expect('erro' in registrarAtor(undefined as never)).toBe(true);
  });
  it('fuzz: nunca lança e sempre deixa o registro coerente', () => {
    let semente = 99;
    const rnd = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
    const pedacos = ['', ' ', 'a', 'Zé', 'ção', '1', '--', '_', '😀', 'professor', 'todos', 'x'.repeat(100), '\n', '<b>', '${x}', '"'];
    const qualquer = (): unknown => { const k = Math.floor(rnd() * 7); return k === 0 ? undefined : k === 1 ? null : k === 2 ? rnd() * 1000 : k === 3 ? [pedacos[Math.floor(rnd() * pedacos.length)]] : k === 4 ? {} : pedacos[Math.floor(rnd() * pedacos.length)]; };
    const antes = ORDEM_ATORES.length;
    for (let i = 0; i < 300; i++) {
      const r = registrarAtor({ nome: qualquer() as string, apelidos: qualquer() as string[], idade: qualquer() as string, descricao: qualquer() as string, altura: qualquer() as number, modeloPalito: qualquer() as never, expressaoPadrao: qualquer() as never, dancaPadrao: qualquer() as string, corPele: qualquer() as string, id: qualquer() as string });
      if ('id' in r) { criados.push(r.id); expect(ATORES[r.id]).toBeDefined(); expect(ATORES[r.id]!.apelidos.every((a) => /^[a-z0-9]+$/.test(a))).toBe(true); }
    }
    for (const id of criados.splice(0)) removerAtor(id);
    expect(ORDEM_ATORES.length).toBe(antes);
    expect(Object.keys(ATORES).length).toBe(antes);
  });
});

describe('exportação de sprites (zip) e volta', () => {
  beforeAll(() => { expect(Object.keys(manifestoOriginal).length).toBeGreaterThanOrEqual(5); });

  it('o zip de cada personagem com sprites relê sem erros e traz todos os sprites do app', async () => {
    for (const id of ORDEM_ATORES) {
      const doApp = manifestoOriginal[id]?.sprites ?? [];
      if (!doApp.length) continue;
      const { zip, total } = await montarPacoteExportacao([id]);
      expect(total, id).toBe(doApp.length);
      const p = lerPacote(zip);
      expect(p.relatorio.erros, id).toEqual([]);
      expect(p.relatorio.sprites.length, id).toBe(doApp.length);
      const resumo = p.relatorio.resumo[id]!;
      expect(resumo.poses, id).toContain('parado');
      // nomes idênticos aos do manifesto
      const nomes = (t: string) => doApp.filter((s) => (s.tipo ?? 'pose') === t).map((s) => s.tags[0]!);
      expect(new Set(resumo.poses)).toEqual(new Set(nomes('pose')));
      expect(new Set(resumo.rostos)).toEqual(new Set(nomes('rosto')));
      expect(p.meta[id]?.base?.w).toBeGreaterThan(50);
      const arquivos = unzipSync(zip);
      expect(arquivos['LEIA-ME.txt']).toBeDefined();
      for (const dados of Object.entries(arquivos).filter(([k]) => k.endsWith('.png')).map(([, v]) => v)) expect([...dados.slice(1, 4)]).toEqual([80, 78, 71]); // assinatura PNG real
    }
  }, 120_000);

  it('exportar todos junta os personagens e o LEIA-ME lista as expressões padrão', async () => {
    const { zip } = await montarPacoteExportacao([...ORDEM_ATORES]);
    const arquivos = unzipSync(zip);
    expect(Object.keys(arquivos).filter((k) => k.startsWith('betason/pose_')).length).toBeGreaterThan(10);
    const leia = new TextDecoder().decode(arquivos['LEIA-ME.txt']);
    for (const e of EXPRESSOES) expect(leia).toContain(e);
  }, 120_000);

  it('personagem criado pelo usuário exporta ficha.json com a cor da pele e um FALTANDO.txt orientador', async () => {
    novo('Tia Marta', { id: 'tia-marta', corPele: '#c68642', apelidos: ['tia'], idade: '45 anos', descricao: 'Cozinheira', altura: 500, modeloPalito: 'mae', expressaoPadrao: 'empolgada', dancaPadrao: 'danca_hippie' });
    const { zip, total } = await montarPacoteExportacao(['tia-marta']);
    expect(total).toBe(1);
    const a = unzipSync(zip);
    const ficha = JSON.parse(new TextDecoder().decode(a['tia-marta/ficha.json']));
    expect(ficha).toMatchObject({ nome: 'Tia Marta', corPele: '#c68642', idade: '45 anos', altura: 500, modeloPalito: 'mae', expressaoPadrao: 'empolgada', dancaPadrao: 'danca_hippie' });
    expect(new TextDecoder().decode(a['tia-marta/FALTANDO.txt'])).toContain('pose_parado.png');
    // volta: com o personagem removido, o zip o recria pela ficha
    removerAtor('tia-marta');
    const p = lerPacote(zip);
    expect(p.fichas['tia-marta']).toMatchObject({ nome: 'Tia Marta', corPele: '#c68642' });
    const r = registrarAtor({ ...p.fichas['tia-marta']!, id: 'tia-marta' });
    expect(r).toEqual({ id: 'tia-marta' });
    expect(ATORES['tia-marta']).toMatchObject({ corPele: '#c68642', modeloPalito: 'mae', expressaoPadrao: 'empolgada', dancaPadrao: 'danca_hippie', altura: 500 });
  });
});

function analisar(caminhos: string[]) {
  // lerPacote exige bytes; para testar só os nomes, monta o zip com os próprios caminhos (os inválidos para o zip, como '\\', ficam como estão)
  const arquivos: Record<string, Uint8Array> = {};
  for (const c of caminhos) arquivos[c.replace(/\0/g, '')] = PNG;
  return lerPacote(zipSync(arquivos), { exigirParado: false }).relatorio;
}
