import {
  clipesPersonalizados, definirClipesPersonalizados, definirExpressoesBoneco, expressoesBoneco, POSES,
  type ClipePersonalizado, type ExpressaoBoneco,
} from '@shared/domain';
import { gravarJson, lerJson } from '@renderer/features/sistema';

/**
 * Expressões do boneco e clipes de animação criados pelo usuário, por personagem. Ficam no domínio (o roteiro os consulta)
 * e são guardados em localStorage; o projeto .zip leva uma cópia (animacoes.json).
 */
const CHAVE_CLIPES = 'stickboard.clipes.v1';
const CHAVE_EXPRESSOES = 'stickboard.expressoes.v1';
const poseValida = (p: string) => (POSES as readonly string[]).includes(p);

export interface AnimacoesJson { clipes: ClipePersonalizado[]; expressoes: ExpressaoBoneco[] }

/** Chamado antes de abrir a interface, junto com os personagens. */
export function carregarAnimacoesSalvas(): void {
  definirExpressoesBoneco(lerJson<ExpressaoBoneco[]>(CHAVE_EXPRESSOES, []));
  definirClipesPersonalizados(lerJson<ClipePersonalizado[]>(CHAVE_CLIPES, []), poseValida);
}

/** Substitui a lista de clipes (os inválidos são descartados) e guarda. */
export function salvarClipes(lista: ClipePersonalizado[]): void {
  definirClipesPersonalizados(lista, poseValida);
  gravarJson(CHAVE_CLIPES, clipesPersonalizados());
}
export function salvarExpressoes(lista: ExpressaoBoneco[]): void {
  definirExpressoesBoneco(lista);
  gravarJson(CHAVE_EXPRESSOES, expressoesBoneco());
}

/** Tira dos registros (e do armazenamento) tudo o que era de um personagem excluído. */
export function removerAnimacoesDe(ator: string): void {
  salvarClipes(clipesPersonalizados().filter((c) => c.ator !== ator));
  salvarExpressoes(expressoesBoneco().filter((e) => e.ator !== ator));
}

export const lerAnimacoes = (): AnimacoesJson => ({ clipes: clipesPersonalizados(), expressoes: expressoesBoneco() });

/** Junta o que veio de um projeto: o que chega substitui o que tem o mesmo personagem+nome(+estilo); o resto fica. */
export function mesclarAnimacoes(novas: Partial<AnimacoesJson>): void {
  const chaveC = (c: ClipePersonalizado) => `${c.ator}|${c.id ?? ''}|${c.estilo}`;
  const chaveE = (e: ExpressaoBoneco) => `${e.ator}|${e.nome}`;
  const clipes = Array.isArray(novas.clipes) ? novas.clipes : [], expressoes = Array.isArray(novas.expressoes) ? novas.expressoes : [];
  // o domínio calcula o id a partir do nome; para casar chaves, deixa-o sanear primeiro
  definirClipesPersonalizados(clipes, poseValida);
  const recebidosC = clipesPersonalizados();
  const atuais = lerJson<ClipePersonalizado[]>(CHAVE_CLIPES, []);
  definirClipesPersonalizados(atuais, poseValida);
  const mantidosC = clipesPersonalizados().filter((c) => !recebidosC.some((r) => chaveC(r) === chaveC(c)));
  salvarClipes([...mantidosC, ...recebidosC]);
  definirExpressoesBoneco(expressoes);
  const recebidosE = expressoesBoneco();
  definirExpressoesBoneco(lerJson<ExpressaoBoneco[]>(CHAVE_EXPRESSOES, []));
  const mantidosE = expressoesBoneco().filter((e) => !recebidosE.some((r) => chaveE(r) === chaveE(e)));
  salvarExpressoes([...mantidosE, ...recebidosE]);
}
