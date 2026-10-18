import type { ExpressaoId } from './poses';

/** Id do personagem. Os 8 do elenco original têm ids fixos; os criados pelo usuário recebem um id derivado do nome. */
export type ActorId = 'cringefather' | 'betason' | 'erika' | 'dario' | 'laura' | 'elizendra' | 'artur' | 'carol' | (string & {});

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
    descricao: 'Filho do meio. Cabelo castanho-escuro cacheado, óculos redondos, moletom de alien. Divertido, desastre em exatas, fluente em inglês.',
    altura: 440, temSprites: true, modeloPalito: 'aluno', expressaoPadrao: 'feliz', slotPadrao: 0.87,
  },
  erika: {
    id: 'erika', nome: 'Erika', apelidos: ['erika', 'mae', 'mamae'], idade: '30 anos',
    descricao: 'Mãe, psicóloga. Cabelo preto liso e longo, óculos finos, saia boho. Serena e acolhedora.',
    altura: 520, temSprites: true, modeloPalito: 'mae', expressaoPadrao: 'feliz', slotPadrao: 0.3,
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
    id: 'elizendra', nome: 'Elizendra', apelidos: ['elizendra', 'vovo', 'vo', 'avo'], idade: '50 anos',
    descricao: 'Avó. Óculos, cabelo longo, engraçada e atrapalhada. (ficha de sprites pendente)',
    altura: 500, temSprites: false, modeloPalito: 'mae', expressaoPadrao: 'feliz', slotPadrao: 0.4,
  },
  artur: {
    id: 'artur', nome: 'Artur', apelidos: ['artur'], idade: '11 anos',
    descricao: 'Melhor amigo do BetaSon. Moreninho, gordinho, cabelo liso e curto, óculos. (ficha de sprites pendente)',
    altura: 430, temSprites: false, modeloPalito: 'aluno', expressaoPadrao: 'feliz', slotPadrao: 0.68,
  },
  carol: {
    id: 'carol', nome: 'Carol', apelidos: ['carol'], idade: '11 anos',
    descricao: 'Amiga do BetaSon. Magrela, alta, cabelo preto. (ficha de sprites pendente)',
    altura: 470, temSprites: false, modeloPalito: 'mae', expressaoPadrao: 'feliz', slotPadrao: 0.55,
  },
};

export const ORDEM_ATORES: ActorId[] = ['cringefather', 'betason', 'erika', 'dario', 'laura', 'elizendra', 'artur', 'carol'];
export const IDS_ORIGINAIS: readonly ActorId[] = [...ORDEM_ATORES];

const semAcentoId = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** "Ana Júlia" -> "ana-julia" (sem acento, só letras/números e hífen). */
export const idDoNome = (nome: string) => semAcentoId(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Palavras reservadas do roteiro que um personagem novo não pode usar como apelido. */
const RESERVADAS = new Set(['professor', 'professora', 'aluno', 'todos', 'todas', 'quadro', 'lousa', 'plano', 'close', 'zoom', 'volta']);

export interface NovoAtor { nome: string; apelidos?: string[]; idade?: string; descricao?: string; altura?: number; modeloPalito?: ModeloPalito; expressaoPadrao?: ExpressaoId; dancaPadrao?: string; corPele?: string }

/** Cria ou atualiza um personagem personalizado. Devolve o id, ou um texto de erro. */
export function registrarAtor(n: NovoAtor, idExistente?: ActorId): { id: ActorId } | { erro: string } {
  const nome = n.nome.trim();
  if (!nome) return { erro: 'Dê um nome ao personagem.' };
  const id = idExistente ?? idDoNome(nome);
  if (!id) return { erro: 'O nome precisa ter letras ou números.' };
  if (!idExistente && ATORES[id]) return { erro: `Já existe um personagem chamado "${ATORES[id]!.nome}".` };
  if (idExistente && !ATORES[idExistente]?.personalizado) return { erro: 'Só personagens criados por você podem ser editados.' };
  const limpo = (s: string) => idDoNome(s).replace(/-/g, '');
  const outros = Object.values(ATORES).filter((o) => o.id !== id);
  const dono = (a: string) => outros.find((o) => o.apelidos.includes(a));
  // apelidos que o usuário escreveu: erro se forem palavra do roteiro ou de outro personagem
  const pedidos = [...new Set((n.apelidos ?? []).map(limpo).filter(Boolean))];
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
    id, nome, apelidos, idade: n.idade?.trim() || '', descricao: n.descricao?.trim() || '',
    altura: Math.min(640, Math.max(220, n.altura ?? 440)), temSprites: false, modeloPalito: n.modeloPalito ?? 'aluno',
    expressaoPadrao: n.expressaoPadrao ?? 'feliz', slotPadrao: ATORES[id]?.slotPadrao ?? 0.15 + ((slots * 0.17) % 0.7),
    personalizado: true, dancaPadrao: n.dancaPadrao, corPele: n.corPele,
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




