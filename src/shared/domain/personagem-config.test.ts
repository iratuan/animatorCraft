import { describe, it, expect } from 'vitest';
import { ATORES } from './characters';
import { CLIPES_PADRAO_PERSONAGEM, clipesDoPersonagem } from './clipes';
import {
  personagemParaJSON,
  validarPersonagemJSON,
  jsonParaPersonagem,
  serializarPersonagemJSON,
  desserializarPersonagemJSON,
  gerarConfigsPadraoTodosPersonagens,
  aplicarConfigPersonagem,
  carregarColecaoPersonagensJSON,
  type PersonagemConfigJSON,
} from './personagem-config';

describe('Configurações Individuais de Personagens (JSON)', () => {
  it('converte um ActorSpec existente para o formato PersonagemConfigJSON v1', () => {
    const spec = ATORES.artur!;
    const clipes = CLIPES_PADRAO_PERSONAGEM.filter((c) => c.ator === 'artur');
    const json = personagemParaJSON(spec, clipes);

    expect(json.versao).toBe(1);
    expect(json.id).toBe('artur');
    expect(json.nome).toBe('Artur');
    expect(json.altura).toBe(430);
    expect(json.dancaPadrao).toBe('danca_gamer');
    expect(json.clipesProprios).toBeDefined();
    expect(json.clipesProprios!.length).toBeGreaterThanOrEqual(2);
    expect(json.clipesProprios!.some((c) => c.id === 'jogar-videogame')).toBe(true);
  });

  it('valida com sucesso um objeto JSON bem formado', () => {
    const raw = {
      versao: 1,
      id: 'robson',
      nome: 'Robson',
      apelidos: ['robson', 'robo'],
      descricao: 'Robô assistente de laboratório',
      idade: '5 anos',
      altura: 450,
      temSprites: false,
      modeloPalito: 'aluno',
      expressaoPadrao: 'feliz',
      slotPadrao: 0.5,
      dancaPadrao: 'danca_street',
    };

    const res = validarPersonagemJSON(raw);
    expect(res.valido).toBe(true);
    if (res.valido) {
      expect(res.config.id).toBe('robson');
      expect(res.config.nome).toBe('Robson');
      expect(res.config.altura).toBe(450);
    }

    const conv = jsonParaPersonagem(raw);
    expect('erro' in conv).toBe(false);
    if (!('erro' in conv)) {
      expect(conv.spec.id).toBe('robson');
      expect(conv.spec.nome).toBe('Robson');
      expect(conv.clipes).toEqual([]);
    }
  });

  it('rejeita JSONs com versão incompatível ou campos essenciais faltando', () => {
    expect(validarPersonagemJSON(null).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 2, id: 'a', nome: 'A' }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: '', nome: 'A' }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: 'a', nome: '   ' }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: 'a', nome: 'A', apelidos: 'não-array' }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: 'a', nome: 'A', apelidos: [], altura: 50 }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: 'a', nome: 'A', apelidos: [], expressaoPadrao: 'expressao_alienigena' }).valido).toBe(false);
    expect(validarPersonagemJSON({ versao: 1, id: 'a', nome: 'A', apelidos: [], dancaPadrao: 'danca_proibida' }).valido).toBe(false);
  });

  it('suporta serialização e desserialização sem perda de dados (roundtrip)', () => {
    const spec = ATORES.paraiba!;
    const str = serializarPersonagemJSON(spec);
    const roundtrip = desserializarPersonagemJSON(str);

    expect('erro' in roundtrip).toBe(false);
    if (!('erro' in roundtrip)) {
      expect(roundtrip.spec.id).toBe('paraiba');
      expect(roundtrip.spec.nome).toBe('Paraíba');
      expect(roundtrip.spec.dancaPadrao).toBe('danca_canina');
      expect(roundtrip.clipes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('retorna erro amigável ao tentar desserializar string JSON inválida', () => {
    const res = desserializarPersonagemJSON('{ id: "sem aspas", json quebrado');
    expect('erro' in res).toBe(true);
  });

  it('gera configurações padrão válidas para todos os 12 personagens do elenco', () => {
    const configs = gerarConfigsPadraoTodosPersonagens();
    const ids = Object.keys(configs);
    expect(ids).toHaveLength(12);

    const esperados = ['cringefather', 'betason', 'erika', 'dario', 'laura', 'elizendra', 'artur', 'carol', 'veia', 'veio', 'paraiba', 'mingau'];
    for (const id of esperados) {
      expect(configs[id]).toBeDefined();
      expect(configs[id]!.versao).toBe(1);
      expect(configs[id]!.id).toBe(id);
      expect(configs[id]!.nome).toBeTruthy();
    }

    // Personagens novos possuem clipes próprios nas bibliotecas
    expect(configs.artur!.clipesProprios?.length).toBeGreaterThanOrEqual(2);
    expect(configs.carol!.clipesProprios?.length).toBeGreaterThanOrEqual(2);
    expect(configs.elizendra!.clipesProprios?.length).toBeGreaterThanOrEqual(2);
    expect(configs.veia!.clipesProprios?.length).toBeGreaterThanOrEqual(2);
    expect(configs.veio!.clipesProprios?.length).toBeGreaterThanOrEqual(2);
    expect(configs.paraiba!.clipesProprios?.length).toBeGreaterThanOrEqual(3);
    expect(configs.mingau!.clipesProprios?.length).toBeGreaterThanOrEqual(3);
  });

  it('aplica personagem personalizado a partir de configuração JSON', () => {
    const config: PersonagemConfigJSON = {
      versao: 1,
      id: 'zelador-tibursio',
      nome: 'Tibúrsio',
      apelidos: ['tibursio', 'zelador'],
      descricao: 'O simpático zelador da escola',
      idade: '55 anos',
      altura: 520,
      temSprites: false,
      modeloPalito: 'professor',
      expressaoPadrao: 'feliz',
      slotPadrao: 0.35,
      personalizado: true,
      dancaPadrao: 'danca_forro',
      clipesProprios: [
        {
          id: 'varrer-o-chao',
          nome: 'Varrer o chão',
          ator: 'zelador-tibursio',
          categoria: 'Movimento',
          loop: true,
          passos: [
            { tags: ['parado'], dur: 0.5, mov: 'balancar', amp: 4 },
            { tags: ['parado'], dur: 0.5, mov: 'inclinar', amp: 6 },
          ],
        },
      ],
    };

    const res = aplicarConfigPersonagem(config);
    expect('erro' in res).toBe(false);
    if (!('erro' in res)) {
      expect(res.id).toBe('zelador-tibursio');
      expect(ATORES['zelador-tibursio']).toBeDefined();
      expect(ATORES['zelador-tibursio']!.nome).toBe('Tibúrsio');

      const clipes = clipesDoPersonagem('zelador-tibursio');
      expect(clipes.some((c) => c.id === 'varrer-o-chao')).toBe(true);
    }
  });

  it('carrega coleção mista de JSONs tolerando itens defeituosos', () => {
    const lista = [
      {
        versao: 1,
        id: 'aluno-novo-1',
        nome: 'Aluno Novo 1',
        apelidos: ['novo1'],
        altura: 420,
      },
      {
        versao: 2, // inválido!
        id: 'aluno-corrompido',
        nome: 'Invalido',
      },
    ];

    const res = carregarColecaoPersonagensJSON(lista);
    expect(res.carregados).toContain('aluno-novo-1');
    expect(res.erros.length).toBe(1);
    expect(res.erros[0]).toMatch(/Versão de esquema incompatível/);
  });
});
