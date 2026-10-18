import { describe, expect, it } from 'vitest';
import { ATORES, ORDEM_ATORES } from './characters';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';

/** Auditoria de lançamento: toda construção documentada, com todos os personagens, interpreta sem aviso e sem dar número inválido. */

const nomes = () => ORDEM_ATORES.map((id) => ATORES[id]!.nome);

const modelos = (n: string) => [
  `${n} entra pela esquerda andando.`, `${n} entra correndo pela direita.`, `${n} entra pelo centro.`,
  `${n} diz "Olá, tudo bem?" feliz.`, `${n} grita "Não!" assustado.`, `${n} sussurra "Psiu" sarcástico.`, `${n} pergunta "Quem?" confuso.`,
  `${n} fica confuso.`, `${n} faz cara de brava.`, `${n} aponta.`, `${n} dança.`, `${n} dança por 5 segundos.`, `${n} pula.`, `${n} acena.`,
  `${n} cruza os braços.`, `${n} tropeça.`,
  `${n} escreve "Teorema" no quadro.`, `${n} escreve $x^2 + 2x + 1$ no quadro.`,
  `${n} desenha o gráfico de y = x^2 - 2 no quadro.`, `${n} desenha um gráfico de barras: A=5, B=8 no quadro.`, `${n} desenha um gráfico de pizza: Sim=70, Não=30 no quadro.`,
  `${n} fica na posição 40%.`, `${n} anda para a posição 70%.`, `${n} entra pela direita na posição 60%.`,
  `${n} sai pela esquerda.`,
];

const GERAIS = [
  'Espera 2 segundos.', 'Apaga o quadro.', '[nota: lembrar do tom]', '[close na lousa]', '[plano aberto]', '[close no professor]',
  '[música: fundo.mp3, volume 25%]', '[música: parar]', '[efeito: palmas.wav]', 'Todos dançam.', 'Professor e Aluno dançam juntos por 3 segundos.',
  'Enquanto Professor diz "Atenção!", Aluno dança por 6 segundos.', 'Professor diz "Oi". Ao mesmo tempo, Aluno pula.',
  'Ao mesmo tempo: Professor diz "Um". Aluno diz "Dois".',
];

function auditar(texto: string) {
  const r = parseRoteiro(texto);
  const tl = construirTimeline(r);
  const passo = Math.max(0.25, tl.duracao / 400);
  for (let t = 0; t <= tl.duracao + 0.5; t += passo) {
    const e = estadoEm(tl, t);
    for (const a of Object.values(e.atores)) {
      expect(Number.isFinite(a.x), `x inválido em t=${t} (${a.id})`).toBe(true);
      expect(typeof a.pose).toBe('string');
    }
  }
  return { r, tl };
}

describe('auditoria de lançamento', () => {
  it('cada construção funciona com cada personagem, sem avisos', () => {
    const problemas: string[] = [];
    for (const n of nomes()) {
      for (const frase of modelos(n)) {
        const { r } = auditar(`# Cena\n${n} entra pela esquerda andando. ${frase}`);
        if (r.avisos.length) problemas.push(`${frase} → ${r.avisos.join(' | ')}`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it('as construções gerais e os papéis funcionam', () => {
    const problemas: string[] = [];
    for (const g of GERAIS) {
      const { r } = auditar(`[papéis: professor=Erika, aluno=Dario]\n# Cena\nProfessor entra pela esquerda andando. Aluno entra pela direita andando. ${g}`);
      if (r.avisos.length) problemas.push(`${g} → ${r.avisos.join(' | ')}`);
    }
    expect(problemas).toEqual([]);
  });

  it('entrada estranha nunca derruba o interpretador', () => {
    const lixo = [
      '', '   ', '\n\n\n', '#', '# ', '"', '"""', '$', '$$$$', '[', ']', '[[[[', '[nota:', '[música:]', '[áudio:]', 'Professor', 'Professor diz', 'Professor diz "',
      'Professor escreve $ no quadro.', 'Professor fica na posição 9999%.', 'Professor fica na posição -50%.', 'Espera 99999999 segundos.', 'Espera -3 segundos.',
      'Professor dança por 0 segundos.', 'Professor dança por 1e9 segundos.', '😀 diz "😀" 😀.', 'Professor desenha o gráfico de y = 1/0 no quadro.',
      'Professor desenha o gráfico de y = raiz(-1) no quadro.', 'Professor desenha um gráfico de barras: no quadro.', 'Professor desenha um gráfico de pizza: A=0, B=0 no quadro.',
      'Professor mostra a imagem no quadro.', 'Ao mesmo tempo: ', 'Enquanto , .', 'Todos dançam.', 'Todos entram.', '[papéis: professor=Ninguém, aluno=]',
      'x'.repeat(50_000), 'Professor diz "a". '.repeat(2000),
    ];
    for (const l of lixo) expect(() => auditar(l), JSON.stringify(l.slice(0, 40))).not.toThrow();
  });

  it('um roteiro longo (200 cenas) é interpretado em tempo razoável', () => {
    const texto = Array.from({ length: 200 }, (_, i) => `# Cena ${i}\nProfessor entra pela esquerda andando. Professor diz "Fala ${i}" feliz. Professor escreve $x^2 + ${i}$ no quadro. Aluno dança por 2 segundos.`).join('\n\n');
    const ini = performance.now();
    const { tl } = auditar(texto);
    expect(tl.duracao).toBeGreaterThan(100);
    expect(performance.now() - ini).toBeLessThan(15_000);
  });
});
