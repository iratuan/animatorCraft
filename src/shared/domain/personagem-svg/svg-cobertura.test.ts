import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ActorId } from '../characters';
import { parseRoteiro } from '../script/parser';

const RAIZ = path.resolve(__dirname, '../../../../');
const SVG_DIR = path.join(RAIZ, 'assets', 'svg');

const PERSONAGENS_ESPERADOS: ActorId[] = [
  'cringefather',
  'betason',
  'erika',
  'dario',
  'laura',
  'elizendra',
  'artur',
  'carol',
  'veia',
  'veio',
  'paraiba',
  'mingau',
];

const FORMATOS_ESPERADOS = ['podcast', 'news', 'debate', 'free-talk', 'classroom'];

describe('Cobertura e Integridade da Geração de SVGs (Prompt Mestre)', () => {
  it('o manifesto.json existe, é válido e contém a matriz completa de cobertura', () => {
    const manifestoPath = path.join(SVG_DIR, 'manifesto.json');
    expect(fs.existsSync(manifestoPath)).toBe(true);

    const conteudo = fs.readFileSync(manifestoPath, 'utf-8');
    const dados = JSON.parse(conteudo);

    expect(dados.versao).toBe('1.0.0');
    expect(dados.totalArquivosGerados).toBeGreaterThanOrEqual(600);
    expect(dados.elencoPersonagens).toHaveLength(12);
    expect(dados.formatos).toEqual(expect.arrayContaining(FORMATOS_ESPERADOS));
    expect(dados.matrizCobertura).toHaveLength(12);

    for (const item of dados.matrizCobertura) {
      expect(PERSONAGENS_ESPERADOS).toContain(item.personagem);
      expect(item.formatos.podcast.length).toBeGreaterThanOrEqual(5);
      expect(item.formatos.telejornal.length).toBeGreaterThanOrEqual(5);
      expect(item.formatos.debate.length).toBeGreaterThanOrEqual(5);
      expect(item.formatos.papoLivre.length).toBeGreaterThanOrEqual(4);
      expect(item.formatos.quadroAula.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('todos os 12 personagens possuem SVGs base, expressões e poses gerados e válidos', () => {
    for (const pId of PERSONAGENS_ESPERADOS) {
      // 1. Base
      const cabeca = path.join(SVG_DIR, 'characters', pId, 'base', 'cabeca.svg');
      const corpo = path.join(SVG_DIR, 'characters', pId, 'base', 'corpo_inteiro.svg');
      expect(fs.existsSync(cabeca), `Cabeça base não encontrada para ${pId}`).toBe(true);
      expect(fs.existsSync(corpo), `Corpo base não encontrado para ${pId}`).toBe(true);

      const xmlCabeca = fs.readFileSync(cabeca, 'utf-8').trim();
      expect(xmlCabeca.startsWith('<svg') && xmlCabeca.endsWith('</svg>')).toBe(true);

      const xmlCorpo = fs.readFileSync(corpo, 'utf-8').trim();
      expect(xmlCorpo.startsWith('<svg') && xmlCorpo.endsWith('</svg>')).toBe(true);

      // 2. Expressões (pelo menos 10)
      const expDir = path.join(SVG_DIR, 'characters', pId, 'expressions');
      expect(fs.existsSync(expDir)).toBe(true);
      const exps = fs.readdirSync(expDir).filter((f) => f.endsWith('.svg'));
      expect(exps.length).toBeGreaterThanOrEqual(10);

      // 3. Poses (pelo menos 15)
      const poseDir = path.join(SVG_DIR, 'characters', pId, 'poses');
      expect(fs.existsSync(poseDir)).toBe(true);
      const poses = fs.readdirSync(poseDir).filter((f) => f.endsWith('.svg'));
      expect(poses.length).toBeGreaterThanOrEqual(15);
    }
  });

  it('todos os 12 personagens possuem SVGs específicos para cada um dos 5 formatos', () => {
    for (const pId of PERSONAGENS_ESPERADOS) {
      for (const formato of FORMATOS_ESPERADOS) {
        const formDir = path.join(SVG_DIR, 'characters', pId, 'formats', formato);
        expect(fs.existsSync(formDir), `Pasta de formato ${formato} ausente para ${pId}`).toBe(true);
        const arquivos = fs.readdirSync(formDir).filter((f) => f.endsWith('.svg'));
        expect(arquivos.length, `Formato ${formato} deve ter poses para ${pId}`).toBeGreaterThanOrEqual(4);

        // Validação XML de cada arquivo
        for (const arq of arquivos) {
          const conteudo = fs.readFileSync(path.join(formDir, arq), 'utf-8').trim();
          expect(conteudo.startsWith('<svg')).toBe(true);
          expect(conteudo.endsWith('</svg>')).toBe(true);
          expect(conteudo).toContain('viewBox=');
        }
      }
    }
  });

  it('cenários completos e props existem e são SVGs válidos para todos os 5 formatos', () => {
    const cenariosConfig: Record<string, string[]> = {
      podcast: ['cenario_completo.svg', 'bancada.svg', 'microfone_boom.svg', 'fone_ouvido.svg', 'caneca.svg'],
      news: ['cenario_completo.svg', 'bancada_ancora.svg', 'painel_noticias.svg', 'tarja_ticker.svg'],
      debate: ['cenario_completo.svg', 'mesa_debate.svg', 'cronometro.svg', 'microfone_mesa.svg'],
      'free-talk': ['cenario_completo.svg', 'poltrona_lounge.svg', 'mesinha_centro.svg'],
      classroom: ['cenario_completo.svg', 'lousa_didatica.svg', 'mesa_professor.svg'],
    };

    for (const [formato, arquivos] of Object.entries(cenariosConfig)) {
      const pasta = path.join(SVG_DIR, 'scenes', formato);
      expect(fs.existsSync(pasta), `Pasta de cena ${formato} não existe`).toBe(true);

      for (const arq of arquivos) {
        const caminho = path.join(pasta, arq);
        expect(fs.existsSync(caminho), `Arquivo de cena ${arq} não encontrado em ${formato}`).toBe(true);
        const conteudo = fs.readFileSync(caminho, 'utf-8').trim();
        expect(conteudo.startsWith('<svg')).toBe(true);
        expect(conteudo.endsWith('</svg>')).toBe(true);
      }
    }
  });

  it('o interpretador de roteiro reconhece perfeitamente todos os 5 formatos e cenários', () => {
    const roteiros = [
      {
        texto: '[cenário: podcast]\n[formato: podcast]\nBetaSon diz "olá ao podcast".',
        cenario: 'podcast',
        formato: 'podcast',
      },
      {
        texto: '[cenário: telejornal]\n[formato: telejornal]\nLaura diz "boa noite aos telespectadores".',
        cenario: 'telejornal',
        formato: 'telejornal',
      },
      {
        texto: '[cenário: debate]\n[formato: debate]\nCringeFather diz "defendo meu argumento".',
        cenario: 'debate',
        formato: 'debate',
      },
      {
        texto: '[cenário: papo livre]\n[formato: papo livre]\nErika diz "olá pessoal tudo bem".',
        cenario: 'papo_livre',
        formato: 'papo_livre',
      },
      {
        texto: '[cenário: lousa]\n[formato: aula]\nDario diz "vamos iniciar a aula".',
        cenario: 'lousa',
        formato: 'aula',
      },
    ];

    for (const r of roteiros) {
      const parsed = parseRoteiro(r.texto);
      expect(parsed.cenas).toHaveLength(1);
      expect(parsed.cenas[0]!.cenario).toBe(r.cenario);
      expect(parsed.cenas[0]!.formato).toBe(r.formato);
    }
  });
});
