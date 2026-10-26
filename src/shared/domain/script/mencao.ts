import { ATORES, ORDEM_ATORES } from '../characters';
import { semAcento } from '../../util/texto';

/** Gatilho "@" digitado no roteiro: `inicio` é a posição do "@" e `filtro` é o texto digitado depois dele. */
export interface Mencao { inicio: number; filtro: string }

/** Opção do seletor: o que aparece na lista e o que entra no roteiro (sempre o nome canônico, que o parser reconhece). */
export interface OpcaoMencao { chave: string; insercao: string; rotulo: string; detalhe: string }

/** Papéis da aula ("Professor" e "Aluno") também podem ser citados com "@". */
const PAPEIS: OpcaoMencao[] = [
  { chave: 'papel:professor', insercao: 'Professor', rotulo: 'Professor', detalhe: 'papel da aula' },
  { chave: 'papel:aluno', insercao: 'Aluno', rotulo: 'Aluno', detalhe: 'papel da aula' },
];

/**
 * "@" logo antes do cursor, depois de espaço, início de linha ou pontuação (assim "a@b.com" não abre o seletor).
 * O filtro só aceita letras, números, espaço e hífen, e não atravessa quebra de linha.
 */
export function mencaoNoCursor(texto: string, cursor: number): Mencao | null {
  const antes = texto.slice(0, cursor);
  const m = /(?:^|[\s(,.;:!?"'-])@([\p{L}\p{N} -]{0,40})$/u.exec(antes);
  if (!m) return null;
  const filtro = m[1] ?? '';
  return { inicio: antes.length - filtro.length - 1, filtro };
}

/** Personagens (inclusive os criados pelo usuário) e papéis que casam com o filtro; quem começa com o filtro vem primeiro. */
export function opcoesMencao(filtro: string): OpcaoMencao[] {
  const f = semAcento(filtro.trim());
  const personagens = ORDEM_ATORES.map((id) => ATORES[id]).filter((a) => !!a).map((a) => ({
    chave: `ator:${a.id}`, insercao: a.nome, rotulo: a.nome, detalhe: a.idade, apelidos: [a.nome, ...a.apelidos],
  }));
  const papeis = PAPEIS.map((p) => ({ ...p, apelidos: [p.insercao] }));
  const todas = [...papeis, ...personagens];
  const casam = todas.filter((o) => !f || o.apelidos.some((a) => semAcento(a).includes(f)));
  // quem começa com o filtro vem antes de quem só o contém; dentro de cada grupo, a ordem da lista (papéis, depois elenco)
  const prioridade = (o: { apelidos: string[] }) => (f && o.apelidos.some((a) => semAcento(a).startsWith(f)) ? 0 : 1);
  return [...casam].sort((a, b) => prioridade(a) - prioridade(b))
    .map(({ chave, insercao, rotulo, detalhe }) => ({ chave, insercao, rotulo, detalhe }));
}

/**
 * Troca "@filtro" pelo nome escolhido. Põe um espaço depois do nome, a menos que já haja espaço ou pontuação.
 * Devolve o novo roteiro e a posição do cursor logo depois do nome.
 */
export function inserirMencao(texto: string, mencao: Mencao, cursor: number, insercao: string): { texto: string; cursor: number } {
  const depois = texto.slice(cursor);
  const sep = /^[\s.,;:!?)]/.test(depois) ? '' : ' ';
  const novo = texto.slice(0, mencao.inicio) + insercao + sep + depois;
  return { texto: novo, cursor: mencao.inicio + insercao.length + sep.length };
}
