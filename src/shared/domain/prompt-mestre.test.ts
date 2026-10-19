import { afterEach, describe, expect, it } from 'vitest';
import { ATORES, ORDEM_ATORES, registrarAtor, removerAtor } from './characters';
import { definirClipesPersonalizados } from './clipes';
import { registrarImagem, removerImagem } from './imagem';
import { coletarBiblioteca, exemploDeRoteiro, gerarPromptMestre } from './prompt-mestre';
import { extrairRoteiro } from './ia';
import { parseRoteiro } from './script/parser';
import { construirTimeline } from './timeline';

const biblioteca = () => coletarBiblioteca(() => ['parado', 'andar', 'comemorar', 'pular-corda']);

/** Trechos entre crases do prompt (fora do bloco de exemplo): são as frases que o app promete entender. */
function frasesDocumentadas(prompt: string): string[] {
  const semExemplo = prompt.split('## 9.')[0]!.replace('(```)', '');
  return [...semExemplo.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]!);
}
const PULAR = [/papéis/, /^#\s/, /\$ \.\.\. \$/, /EFEITO/, /TAL COISA/, /NOME-DO-CLIPE/];

describe('prompt mestre', () => {
  it('traz todas as seções e as listas saem do código do app', () => {
    const p = gerarPromptMestre(biblioteca());
    for (const s of ['## 1. O QUE VOCÊ DEVE ENTREGAR', '## 2. ESTRUTURA', '## 3. TODAS AS FRASES', '## 4. AÇÕES AO MESMO TEMPO', '## 5. REGRAS DE OURO', '## 7. PERSONAGENS', '## 8. BIBLIOTECA', '## 10. EXEMPLO COMPLETO', '## 11. CONFIRA']) expect(p).toContain(s);
    for (const id of ORDEM_ATORES) expect(p).toContain(ATORES[id]!.nome);
    for (const palavra of ['irritado', 'sarcástico', 'grita', 'cruza os braços', 'dança hippie', 'deslizar da esquerda', 'gráfico de pizza', '[close na lousa]', '[música: parar]']) expect(p, palavra).toContain(palavra);
  });

  it('o exemplo completo roda sem avisos com o elenco padrão e com outros pares de papéis', () => {
    for (const [prof, alu, outro] of [['CringeFather', 'BetaSon', 'Dario'], ['Erika', 'Dario', 'Laura'], ['Laura', 'CringeFather', undefined]] as const) {
      const r = parseRoteiro(exemploDeRoteiro(prof, alu, outro));
      expect(r.avisos, `${prof}/${alu}`).toEqual([]);
      expect(construirTimeline(r).duracao).toBeGreaterThan(20);
    }
    const doPrompt = /```\n([\s\S]*?)```/.exec(gerarPromptMestre(biblioteca()))![1]!;
    expect(parseRoteiro(doPrompt).avisos).toEqual([]);
  });

  it('cada frase documentada no prompt é entendida sem avisos', () => {
    const prompt = gerarPromptMestre(biblioteca(), { professor: 'cringefather', aluno: 'betason' });
    const frases = frasesDocumentadas(prompt).filter((f) => !PULAR.some((r) => r.test(f)));
    expect(frases.length).toBeGreaterThan(40);
    const problemas: string[] = [];
    for (const bruto of frases) {
      const f = bruto.replace(/\bNOME-DO-SPRITE\b/g, 'pular-corda').replace(/\bNOME\b/g, 'Professor').replace(/^\.\.\. /, 'Professor desenha ').replace(/ ?\(opcional\)/, '');
      if (!/[.!?]$/.test(f) && !/^\[/.test(f)) continue; // fragmentos de explicação ("no canto direito"), não frases
      const r = parseRoteiro(`[papéis: professor=CringeFather, aluno=BetaSon]\n# Cena\nProfessor entra pela esquerda andando. Aluno entra pela direita andando. ${f}`);
      if (r.avisos.length) problemas.push(`${bruto} → ${r.avisos.join(' | ')}`);
    }
    expect(problemas).toEqual([]);
  });

  it('os trechos prontos funcionam e cada um gera ações', () => {
    const prompt = gerarPromptMestre(biblioteca());
    const trechos = /## 9\.[\s\S]*?(?=## 10)/.exec(prompt)![0].match(/`[^`]+`/g)!.map((s) => s.slice(1, -1));
    expect(trechos.length).toBeGreaterThanOrEqual(8);
    for (const t of trechos) {
      const r = parseRoteiro(`# Cena\nBetaSon entra pela direita andando. ${t}`);
      expect(r.avisos, t).toEqual([]);
      expect(r.cenas[0]!.acoes.length, t).toBeGreaterThan(1);
    }
  });

  it('inclui personagens criados, clipes, expressões, imagens e áudios da biblioteca do usuário', () => {
    const r = registrarAtor({ nome: 'Tia Marta', apelidos: ['tia'], idade: '45 anos', descricao: 'Tia cozinheira e engraçada.' });
    expect('id' in r).toBe(true);
    const id = (r as { id: string }).id;
    definirClipesPersonalizados([{ ator: id, id: 'tchau-longo', nome: 'tchau longo', categoria: 'Movimento', loop: false, estilo: 'ambos', passos: [{ tags: ['parado'], dur: 1, mov: 'balancar' }] }]);
    registrarImagem({ nome: 'ciclo-da-agua.png', w: 800, h: 600 });
    try {
      const b = coletarBiblioteca((x) => (x === id ? ['parado', 'bolo'] : ['parado']), [{ nome: 'ciclo-da-agua.png', w: 800, h: 600 }], [{ nome: 'abertura.wav', duracao: 3.25 }]);
      const p = gerarPromptMestre(b, { professor: id, aluno: 'betason', tema: 'Frações com bolo', materia: 'Matemática', serie: '6º ano', duracao: 'media', extras: 'inclua uma piada da vovó' });
      for (const t of ['Tia Marta', 'Tia cozinheira', 'tchau-longo', 'bolo', 'ciclo-da-agua.png (800x600, horizontal)', 'abertura.wav (3,3 s)', 'Frações com bolo', '6º ano', '3 minutos', 'piada da vovó', 'professor=Tia Marta']) expect(p, t).toContain(t);
      expect(p).not.toContain('<<ESCREVA');
      // um roteiro com o personagem novo e o clipe dele é aceito
      const roteiro = parseRoteiro('[papéis: professor=Tia Marta, aluno=BetaSon]\n# Cena\nProfessor entra pela esquerda andando. Professor faz o clipe tchau-longo. Professor faz a pose bolo por 2 segundos.');
      expect(roteiro.avisos).toEqual([]);
    } finally {
      removerAtor(id); definirClipesPersonalizados([]); removerImagem('ciclo-da-agua.png');
    }
  });

  it('sem tema, o pedido vira um modelo a completar; no modo melhorar, leva o roteiro atual', () => {
    expect(gerarPromptMestre(biblioteca())).toContain('<<ESCREVA AQUI O ASSUNTO');
    const m = gerarPromptMestre(biblioteca(), { modo: 'melhorar', roteiroAtual: '# Cena\nProfessor acena.', instrucao: 'mais piadas' });
    expect(m).toContain('mais piadas');
    expect(m).toContain('ROTEIRO ATUAL\n# Cena\nProfessor acena.');
    expect(m).not.toContain('Assunto da aula');
    expect(gerarPromptMestre(biblioteca(), { modo: 'melhorar' })).toContain('<<COLE AQUI O ROTEIRO ATUAL>>');
  });

  it('o personagem escolhido filtra o elenco', () => {
    const b = coletarBiblioteca(() => ['parado'], [], [], ['erika', 'dario']);
    expect(b.atores.map((a) => a.id)).toEqual(['erika', 'dario']);
    const p = gerarPromptMestre(b);
    const elenco = /## 7\.[\s\S]*?(?=## 8)/.exec(p)![0];
    expect(elenco).toContain('Erika');
    expect(elenco).not.toContain('CringeFather');
  });

  it('o aviso de armadilha é verdadeiro: dois nomes com "e" fazem os dois agirem; narração solta vira aviso', () => {
    const dois = parseRoteiro('# Cena\nCringeFather entra pela esquerda andando. BetaSon entra pela direita andando. CringeFather olha para BetaSon e ri.');
    expect(dois.cenas[0]!.acoes.filter((a) => a.tipo === 'pose' && a.pose === 'rindo').length).toBe(2);
    const certo = parseRoteiro('# Cena\nCringeFather entra pela esquerda andando. CringeFather diz "BetaSon, presta atenção!" bravo.');
    expect(certo.avisos).toEqual([]);
    expect(certo.cenas[0]!.acoes.filter((a) => a.tipo === 'fala').length).toBe(1);
    expect(parseRoteiro('# Cena\nEntão o professor, cansado, resolve ensinar.').avisos.length).toBeGreaterThan(0);
  });

  it('a resposta da IA em bloco de código com conversa em volta é extraída e entendida', () => {
    const resposta = `Claro! Aqui está o roteiro:\n\n\`\`\`\n${exemploDeRoteiro('CringeFather', 'BetaSon')}\`\`\`\n\nEspero que goste!`;
    const r = parseRoteiro(extrairRoteiro(resposta));
    expect(r.avisos).toEqual([]);
    expect(r.cenas.map((c) => c.titulo)).toEqual(['Abertura', 'Na lousa', 'Resumo']);
  });

  afterEach(() => { definirClipesPersonalizados([]); });
});
