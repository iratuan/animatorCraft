import { ATORES, ActorId, ActorSpec, ModeloPalito, registrarAtor, DANCAS_ACEITAS, EXPRESSOES_ACEITAS } from './characters';
import { ClipePersonalizado, CLIPES_PADRAO_PERSONAGEM, definirClipesPersonalizados, clipesPersonalizados } from './clipes';
import type { ExpressaoId } from './poses';

export interface VisualPersonagemConfig {
  formato?: 'padrao' | 'chibi' | 'realista' | 'minimalista' | 'stickman';
  corPrimaria?: string;
  corSecundaria?: string;
  acessorios?: string[];
}

/** Configuração individual e serializável de um personagem em formato JSON. */
export interface PersonagemConfigJSON {
  versao: 1;
  id: string;
  nome: string;
  apelidos: string[];
  descricao: string;
  idade: string;
  altura: number;
  temSprites: boolean;
  modeloPalito: ModeloPalito;
  expressaoPadrao: ExpressaoId;
  slotPadrao: number;
  personalizado?: boolean;
  dancaPadrao?: string;
  corPele?: string;
  visual?: VisualPersonagemConfig;
  clipesProprios?: ClipePersonalizado[];
}

/** Converte uma ActorSpec e seus clipes associados para o objeto JSON de configuração. */
export function personagemParaJSON(
  spec: ActorSpec,
  clipes?: ClipePersonalizado[]
): PersonagemConfigJSON {
  const clipesDoAtor = clipes ?? [
    ...clipesPersonalizados(spec.id),
    ...CLIPES_PADRAO_PERSONAGEM.filter((c) => c.ator === spec.id),
  ];

  // Remove duplicações de clipe
  const vistos = new Set<string>();
  const clipesFiltrados = clipesDoAtor.filter((c) => {
    if (vistos.has(c.id)) return false;
    vistos.add(c.id);
    return true;
  });

  return {
    versao: 1,
    id: spec.id,
    nome: spec.nome,
    apelidos: [...spec.apelidos],
    descricao: spec.descricao,
    idade: spec.idade,
    altura: spec.altura,
    temSprites: spec.temSprites,
    modeloPalito: spec.modeloPalito,
    expressaoPadrao: spec.expressaoPadrao,
    slotPadrao: spec.slotPadrao,
    personalizado: spec.personalizado,
    dancaPadrao: spec.dancaPadrao,
    corPele: spec.corPele,
    visual: {
      formato: 'stickman',
      acessorios: [],
    },
    clipesProprios: clipesFiltrados.length > 0 ? clipesFiltrados : undefined,
  };
}

/** Valida os dados de um JSON de personagem sem aplicar mutações. */
export function validarPersonagemJSON(
  dados: unknown
): { valido: true; config: PersonagemConfigJSON } | { valido: false; erro: string } {
  if (!dados || typeof dados !== 'object') {
    return { valido: false, erro: 'Formato JSON inválido: objeto esperado.' };
  }

  const obj = dados as Partial<PersonagemConfigJSON>;

  if (obj.versao !== 1) {
    return { valido: false, erro: `Versão de esquema incompatível: esperado 1, recebido ${obj.versao}.` };
  }

  if (typeof obj.id !== 'string' || !obj.id.trim()) {
    return { valido: false, erro: 'Campo "id" obrigatório e deve ser uma string não vazia.' };
  }

  if (typeof obj.nome !== 'string' || !obj.nome.trim()) {
    return { valido: false, erro: 'Campo "nome" obrigatório e deve ser uma string não vazia.' };
  }

  if (!Array.isArray(obj.apelidos)) {
    return { valido: false, erro: 'Campo "apelidos" deve ser um array de strings.' };
  }

  const altura = typeof obj.altura === 'number' && Number.isFinite(obj.altura) ? obj.altura : 440;
  if (altura < 100 || altura > 1200) {
    return { valido: false, erro: `Altura fora dos limites aceitáveis (100-1200): ${altura}.` };
  }

  const expressao = (obj.expressaoPadrao as string) ?? 'feliz';
  if (!EXPRESSOES_ACEITAS.includes(expressao)) {
    return { valido: false, erro: `Expressão padrão inválida: "${expressao}".` };
  }

  if (obj.dancaPadrao && !DANCAS_ACEITAS.includes(obj.dancaPadrao)) {
    return { valido: false, erro: `Dança padrão inválida: "${obj.dancaPadrao}".` };
  }

  const config: PersonagemConfigJSON = {
    versao: 1,
    id: obj.id.trim(),
    nome: obj.nome.trim().slice(0, 60),
    apelidos: obj.apelidos.filter((a): a is string => typeof a === 'string' && a.trim().length > 0),
    descricao: typeof obj.descricao === 'string' ? obj.descricao.slice(0, 500) : '',
    idade: typeof obj.idade === 'string' ? obj.idade.slice(0, 40) : '',
    altura,
    temSprites: Boolean(obj.temSprites),
    modeloPalito: (obj.modeloPalito as ModeloPalito) || 'aluno',
    expressaoPadrao: expressao as ExpressaoId,
    slotPadrao: typeof obj.slotPadrao === 'number' && Number.isFinite(obj.slotPadrao) ? obj.slotPadrao : 0.5,
    personalizado: Boolean(obj.personalizado),
    dancaPadrao: obj.dancaPadrao,
    corPele: typeof obj.corPele === 'string' ? obj.corPele : undefined,
    visual: obj.visual,
    clipesProprios: Array.isArray(obj.clipesProprios) ? obj.clipesProprios : undefined,
  };

  return { valido: true, config };
}

/** Converte objeto JSON validado em ActorSpec e lista de clipes. */
export function jsonParaPersonagem(
  dados: unknown
): { spec: ActorSpec; clipes: ClipePersonalizado[] } | { erro: string } {
  const validacao = validarPersonagemJSON(dados);
  if (!validacao.valido) return { erro: validacao.erro };

  const { config } = validacao;
  const spec: ActorSpec = {
    id: config.id as ActorId,
    nome: config.nome,
    apelidos: config.apelidos,
    descricao: config.descricao,
    idade: config.idade,
    altura: config.altura,
    temSprites: config.temSprites,
    modeloPalito: config.modeloPalito,
    expressaoPadrao: config.expressaoPadrao,
    slotPadrao: config.slotPadrao,
    personalizado: config.personalizado,
    dancaPadrao: config.dancaPadrao,
    corPele: config.corPele,
  };

  const clipes = config.clipesProprios ?? [];
  return { spec, clipes };
}

/** Serializa para string JSON formatada. */
export function serializarPersonagemJSON(
  spec: ActorSpec,
  clipes?: ClipePersonalizado[],
  espacos = 2
): string {
  const json = personagemParaJSON(spec, clipes);
  return JSON.stringify(json, null, espacos);
}

/** Desserializa string JSON em spec e clipes. */
export function desserializarPersonagemJSON(
  textoJson: string
): { spec: ActorSpec; clipes: ClipePersonalizado[] } | { erro: string } {
  try {
    const dados = JSON.parse(textoJson);
    return jsonParaPersonagem(dados);
  } catch (e) {
    return { erro: `Erro ao interpretar JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** Aplica a configuração do personagem no ecossistema de atores e clipes em execução. */
export function aplicarConfigPersonagem(
  config: PersonagemConfigJSON
): { id: ActorId } | { erro: string } {
  const convertido = jsonParaPersonagem(config);
  if ('erro' in convertido) return { erro: convertido.erro };

  const { spec, clipes } = convertido;

  // Se for um ator original já existente, apenas atualiza propriedades flexíveis se necessário
  if (ATORES[spec.id] && !ATORES[spec.id]!.personalizado) {
    // Registra clipes próprios sem alterar a ficha base imutável
    if (clipes.length > 0) {
      const atuais = clipesPersonalizados();
      definirClipesPersonalizados([...atuais, ...clipes]);
    }
    return { id: spec.id };
  }

  // Se for um ator personalizado, registra no elenco
  const res = registrarAtor({
    id: spec.id,
    nome: spec.nome,
    apelidos: spec.apelidos,
    idade: spec.idade,
    descricao: spec.descricao,
    altura: spec.altura,
    modeloPalito: spec.modeloPalito,
    expressaoPadrao: spec.expressaoPadrao,
    dancaPadrao: spec.dancaPadrao,
    corPele: spec.corPele,
  }, ATORES[spec.id]?.personalizado ? spec.id : undefined);

  if ('erro' in res) return res;

  if (clipes.length > 0) {
    const atuais = clipesPersonalizados();
    definirClipesPersonalizados([...atuais, ...clipes]);
  }

  return { id: res.id };
}

/** Carrega e aplica uma coleção de configurações JSON de personagens. */
export function carregarColecaoPersonagensJSON(
  listaConfigs: unknown[]
): { carregados: ActorId[]; erros: string[] } {
  const carregados: ActorId[] = [];
  const erros: string[] = [];

  for (const item of listaConfigs) {
    const validacao = validarPersonagemJSON(item);
    if (!validacao.valido) {
      erros.push(validacao.erro);
      continue;
    }
    const res = aplicarConfigPersonagem(validacao.config);
    if ('erro' in res) {
      erros.push(`[${validacao.config.id}] ${res.erro}`);
    } else {
      carregados.push(res.id);
    }
  }

  return { carregados, erros };
}

/** Gera os arquivos de configuração JSON padrão para todos os 12 personagens do elenco. */
export function gerarConfigsPadraoTodosPersonagens(): Record<string, PersonagemConfigJSON> {
  const configs: Record<string, PersonagemConfigJSON> = {};
  for (const [id, spec] of Object.entries(ATORES)) {
    configs[id] = personagemParaJSON(spec);
  }
  return configs;
}
