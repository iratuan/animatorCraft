import type { ExpressaoId } from './poses';

/** Id do personagem. Os 8 do elenco original têm ids fixos; os criados pelo usuário recebem um id derivado do nome. */
export type ActorId = 'cringefather' | 'betason' | 'erika' | 'dario' | 'laura' | 'elizendra' | 'artur' | 'carol' | 'veia' | 'veio' | 'paraiba' | 'mingau' | (string & {});

/** Modelo de boneco de palito usado como "reserva" enquanto um personagem não tem ficha de sprites. */
export type ModeloPalito = 'professor' | 'aluno' | 'mae' | 'cacula' | 'priminha';

export interface ActorSpec {
  id: ActorId;
  nome: string;
  /** Palavras que o roteiro pode usar para citar o ator (minúsculas, sem acento). Os papéis "professor"/"aluno" são tratados à parte. */
  apelidos: string[];
  descricao: string;
  idade: string;
  /** Altura do personagem parado, em px num palco 1920x1080 (proporcional à idade). */
  altura: number;
  /** Tem ficha de sprites em referencias/ (senão aparece como boneco de reserva). */
  temSprites: boolean;
  modeloPalito: ModeloPalito;
  expressaoPadrao: ExpressaoId;
  slotPadrao: number;
  /** Criado pelo usuário (pode ser editado e excluído; os do elenco original não). */
  personalizado?: boolean;
  /** Pose de dança usada em "<nome> dança." (padrão: dança atual). */
  dancaPadrao?: string;
  /** Cor da pele (só usada no boneco de palito). */
  corPele?: string;
}

export const ATORES: Record<ActorId, ActorSpec> = {
  cringefather: {
    id: 'cringefather', nome: 'CringeFather', apelidos: ['cringefather', 'cringe'], idade: '40 anos',
    descricao: 'Pai e professor de física e matemática. Magro, alto, cabelo grisalho espetado, óculos e jaleco. Sarcástico e excêntrico.',
    altura: 560, temSprites: true, modeloPalito: 'professor', expressaoPadrao: 'sarcastica', slotPadrao: 0.13,
  },
  betason: {
    id: 'betason', nome: 'BetaSon', apelidos: ['betason', 'beta', 'betinha'], idade: '11 anos',
    descricao: 'Filho do mais velho. Cabelo castanho-escuro cacheado, óculos redondos, moletom de alien. Divertido, desastre em exatas, fluente em inglês.',
    altura: 440, temSprites: true, modeloPalito: 'aluno', expressaoPadrao: 'feliz', slotPadrao: 0.87,
  },
  erika: {
    id: 'erika', nome: 'Erika', apelidos: ['erika', 'mae', 'mamae'], idade: '30 anos',
    descricao: 'Mãe, psicóloga. Mais alta que Cringefather. Cabelo preto liso e longo, óculos finos, saia boho. Serena e acolhedora.',
    altura: 580, temSprites: true, modeloPalito: 'mae', expressaoPadrao: 'feliz', slotPadrao: 0.3,
  },
  dario: {
    id: 'dario', nome: 'Dario', apelidos: ['dario', 'cacula'], idade: '7 anos',
    descricao: 'Caçula. Autista, muito esperto, focado em padrões e montagens. Moletom de dinossauro.',
    altura: 340, temSprites: true, modeloPalito: 'cacula', expressaoPadrao: 'neutra', slotPadrao: 0.74,
  },
  laura: {
    id: 'laura', nome: 'Laura', apelidos: ['laura', 'priminha', 'irmazinha'], idade: '5 anos',
    descricao: 'Caçulinha linda, inteligente e muito sapeca. Maria-chiquinha com laços rosa.',
    altura: 285, temSprites: true, modeloPalito: 'priminha', expressaoPadrao: 'sarcastica', slotPadrao: 0.62,
  },
  elizendra: {
    id: 'elizendra', nome: 'Elizendra', apelidos: ['elizendra', 'vovo', 'vo', 'avo', 'dona elizendra'], idade: '50 anos',
    descricao: 'Avó amorosa, alegre e atrapalhada. Cabelo grisalho ondulado preso com grampos, óculos ovais com correntinha e avental florido de cozinheira.',
    altura: 500, temSprites: false, modeloPalito: 'mae', expressaoPadrao: 'feliz', slotPadrao: 0.4, dancaPadrao: 'danca_valsa',
  },
  artur: {
    id: 'artur', nome: 'Artur', apelidos: ['artur', 'tutu'], idade: '11 anos',
    descricao: 'Melhor amigo do BetaSon. Mais cheinho e robusto, cabelo liso curto com franjinha, óculos quadrados, bermuda cargo e camiseta gamer com estampa de controle.',
    altura: 430, temSprites: false, modeloPalito: 'aluno', expressaoPadrao: 'feliz', slotPadrao: 0.68, dancaPadrao: 'danca_gamer',
  },
  carol: {
    id: 'carol', nome: 'Carol', apelidos: ['carol', 'carolzinha'], idade: '11 anos',
    descricao: 'Amiga do BetaSon. Alta e magricela, rabo de cavalo longo com elástico, calça jeans e camiseta moderna com estampa de raio. Esperta e cheia de atitude.',
    altura: 475, temSprites: false, modeloPalito: 'aluno', expressaoPadrao: 'feliz', slotPadrao: 0.55, dancaPadrao: 'danca_street',
  },
  veia: {
    id: 'veia', nome: 'Véia', apelidos: ['veia', 'sogra'], idade: '70 anos',
    descricao: 'Sogra de Cringefather. Geniosa, engraçada, provocadora, vive implicando com Cringe mas ama a família.',
    altura: 480, temSprites: false, modeloPalito: 'mae', expressaoPadrao: 'brava', slotPadrao: 0.22, dancaPadrao: 'danca_forro',
  },
  veio: {
    id: 'veio', nome: 'Véio', apelidos: ['veio', 'poeta', 'sogro'], idade: '80 anos',
    descricao: 'Poeta, olhos grandes e expressivos, detesta receber ordens. Declama e gesticula teatralmente.',
    altura: 510, temSprites: false, modeloPalito: 'professor', expressaoPadrao: 'neutra', slotPadrao: 0.38, dancaPadrao: 'danca_serenata',
  },
  paraiba: {
    id: 'paraiba', nome: 'Paraíba', apelidos: ['paraiba', 'cachorro', 'cao', 'dog', 'viralata'], idade: '3 anos',
    descricao: 'Vira-lata caramelo leal e comilão. Orelhas caídas expressivas, rabo abanando, patinhas ágeis e coleira com medalhinha.',
    altura: 210, temSprites: false, modeloPalito: 'cacula', expressaoPadrao: 'feliz', slotPadrao: 0.82, dancaPadrao: 'danca_canina',
  },
  mingau: {
    id: 'mingau', nome: 'Mingau', apelidos: ['mingau', 'gato', 'gatinho', 'cat', 'miau', 'bichano'], idade: '2 anos',
    descricao: 'Gatinho manhoso e esperto da família. Orelhas pontudas, focinho delicado com bigodes, rabo ondulante e patinhas macias.',
    altura: 175, temSprites: false, modeloPalito: 'cacula', expressaoPadrao: 'feliz', slotPadrao: 0.88, dancaPadrao: 'danca_felina',
  },
};

export const ORDEM_ATORES: ActorId[] = ['cringefather', 'betason', 'erika', 'dario', 'laura', 'elizendra', 'artur', 'carol', 'veia', 'veio', 'paraiba', 'mingau'];
export const IDS_ORIGINAIS: readonly ActorId[] = [...ORDEM_ATORES];

/** "Ana Júlia" -> "ana-julia" (sem acento, só letras/números e hífen). */
// sem importar shared/util de propósito: as ferramentas em Node (tools/) carregam este arquivo direto, sem resolver extensões.
export const idDoNome = (nome: string): string => nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Palavras reservadas do roteiro que um personagem novo não pode usar como apelido. */
const RESERVADAS = new Set(['professor', 'professora', 'aluno', 'todos', 'todas', 'quadro', 'lousa', 'plano', 'close', 'zoom', 'volta']);

export interface NovoAtor { /** só na criação: id escolhido (a pasta do pacote); sem ele o id vem do nome */ id?: string; nome: string; apelidos?: string[]; idade?: string; descricao?: string; altura?: number; modeloPalito?: ModeloPalito; expressaoPadrao?: ExpressaoId; dancaPadrao?: string; corPele?: string }

// cópias de EXPRESSOES e POSES_DE_DANCA (poses.ts): este arquivo não importa nada em tempo de execução porque tools/sprites/importar-sprites.mjs o carrega direto no Node; personagens.test.ts confere que as listas não se afastam
export const EXPRESSOES_ACEITAS: readonly string[] = ['neutra', 'feliz', 'triste', 'brava', 'surpresa', 'confusa', 'sarcastica', 'assustada', 'empolgada', 'entediada'];
export const DANCAS_ACEITAS: readonly string[] = [
  'danca_funky', 'danca_atual', 'danca_ballet', 'danca_descoordenada', 'danca_hippie',
  'danca_gamer', 'danca_street', 'danca_valsa', 'danca_forro', 'danca_serenata', 'danca_canina', 'danca_felina',
];
const MODELOS_PALITO: readonly ModeloPalito[] = ['professor', 'aluno', 'mae', 'cacula', 'priminha'];
const COR_VALIDA = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const texto = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Cria ou atualiza um personagem personalizado. Devolve o id, ou um texto de erro. Aceita dados vindos de arquivos (zip, projeto): tudo é conferido. */
export function registrarAtor(n: NovoAtor, idExistente?: ActorId): { id: ActorId } | { erro: string } {
  if (!n || typeof n !== 'object') return { erro: 'Ficha do personagem inválida.' };
  const nome = texto(n.nome, 60);
  if (!nome) return { erro: 'Dê um nome ao personagem.' };
  const idPedido = typeof n.id === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.id) && n.id.length <= 40 ? n.id : '';
  const id = idExistente ?? (idPedido || idDoNome(nome));
  if (!id) return { erro: 'O nome precisa ter letras ou números.' };
  if (!idExistente && ATORES[id]) return { erro: `Já existe um personagem chamado "${ATORES[id]!.nome}".` };
  if (idExistente && !ATORES[idExistente]?.personalizado) return { erro: 'Só personagens criados por você podem ser editados.' };
  const limpo = (s: string) => idDoNome(s).replace(/-/g, '');
  const outros = Object.values(ATORES).filter((o) => o.id !== id);
  const dono = (a: string) => outros.find((o) => o.apelidos.includes(a));
  // apelidos que o usuário escreveu: erro se forem palavra do roteiro ou de outro personagem
  const pedidos = [...new Set((Array.isArray(n.apelidos) ? n.apelidos : []).filter((a): a is string => typeof a === 'string').slice(0, 20).map(limpo).filter(Boolean))];
  const reservado = pedidos.find((a) => RESERVADAS.has(a));
  if (reservado) return { erro: `"${reservado}" é uma palavra do roteiro; use outro apelido.` };
  const ocupado = pedidos.find((a) => dono(a));
  if (ocupado) return { erro: `O apelido "${ocupado}" já é de ${dono(ocupado)!.nome}.` };
  // apelidos automáticos: nome inteiro colado e cada palavra do nome (descartando o que já é de outro personagem)
  const automaticos = [limpo(nome), ...idDoNome(nome).split('-').filter((p) => p.length >= 3)].filter((a) => a && !RESERVADAS.has(a) && !dono(a));
  const apelidos = [...new Set([...automaticos, ...pedidos])];
  if (!apelidos.length) return { erro: 'Esse nome conflita com palavras do roteiro ou com outro personagem; escolha outro.' };
  const slots = Object.values(ATORES).length;
  ATORES[id] = {
    id, nome, apelidos, idade: texto(n.idade, 40), descricao: texto(n.descricao, 400),
    altura: Math.min(640, Math.max(220, typeof n.altura === 'number' && Number.isFinite(n.altura) ? n.altura : 440)), temSprites: false,
    modeloPalito: MODELOS_PALITO.includes(n.modeloPalito as ModeloPalito) ? (n.modeloPalito as ModeloPalito) : 'aluno',
    expressaoPadrao: EXPRESSOES_ACEITAS.includes(n.expressaoPadrao as string) ? (n.expressaoPadrao as ExpressaoId) : 'feliz', slotPadrao: ATORES[id]?.slotPadrao ?? 0.15 + ((slots * 0.17) % 0.7),
    personalizado: true, dancaPadrao: DANCAS_ACEITAS.includes(n.dancaPadrao as string) ? n.dancaPadrao : undefined, corPele: typeof n.corPele === 'string' && COR_VALIDA.test(n.corPele) ? n.corPele : idExistente ? ATORES[id]?.corPele : undefined, // editar pela ficha não pode apagar a cor da pele
  };
  if (!ORDEM_ATORES.includes(id)) ORDEM_ATORES.push(id);
  return { id };
}

export function removerAtor(id: ActorId): boolean {
  if (!ATORES[id]?.personalizado) return false;
  delete ATORES[id];
  const i = ORDEM_ATORES.indexOf(id);
  if (i >= 0) ORDEM_ATORES.splice(i, 1);
  return true;
}

/** Os personagens criados pelo usuário, na forma que se grava em disco. */
export const atoresPersonalizados = (): ActorSpec[] => ORDEM_ATORES.map((id) => ATORES[id]!).filter((a) => a.personalizado);

/** Reinstala a lista gravada (ao abrir o app). */
export function restaurarAtores(lista: ActorSpec[]): void {
  for (const a of lista) if (a?.id && a.nome && !IDS_ORIGINAIS.includes(a.id)) { ATORES[a.id] = { ...a, personalizado: true, temSprites: false }; if (!ORDEM_ATORES.includes(a.id)) ORDEM_ATORES.push(a.id); }
}

/** Papéis da aula: o roteiro fala "Professor" e "Aluno" e quem cumpre cada papel muda por aula. */
export type Papel = 'professor' | 'aluno';
export type Papeis = Record<Papel, ActorId>;
export const PAPEIS_PADRAO: Papeis = { professor: 'cringefather', aluno: 'betason' };





