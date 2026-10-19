import type { ActorId } from '@shared/domain';
import { registrarSprites, type SpriteInfo } from '@renderer/features/cena';
import { criarLoja } from '@renderer/features/sistema';

/** Sprites importados ou editados, guardados no navegador/app (IndexedDB): sobrepõem os originais do app a cada abertura. */
export interface EntradaSalva { info: SpriteInfo; url: string; personagem: string }
interface Marcador { marcador: 'substituir'; personagem: string }

const loja = criarLoja<EntradaSalva | Marcador>('stickboard', 'sprites');
const chaveDe = (personagem: string, info: SpriteInfo) => `${personagem}|${info.tipo}|${info.tags[0]}|${info.variante ?? ''}`;
const ehEntrada = (e: EntradaSalva | Marcador): e is EntradaSalva => 'info' in e;
const chavesDo = async (personagem: string) => ((await loja.chaves()) as string[]).filter((c) => c.startsWith(`${personagem}|`));

/**
 * `substituir`: apaga antes tudo o que havia guardado do personagem (pacote com ficha completa).
 * Devolve false se não deu para guardar (sem IndexedDB, disco cheio): os sprites valem só nesta sessão e o usuário precisa saber.
 */
export async function salvarEntradas(personagem: string, entradas: EntradaSalva[], substituir: boolean): Promise<boolean> {
  try {
    if (substituir) {
      for (const k of await chavesDo(personagem)) await loja.remover(k);
      await loja.guardar({ marcador: 'substituir', personagem }, `${personagem}|__substituir`);
    }
    for (const e of entradas) {
      // imagem única e quadros numerados do mesmo nome não convivem (ver registrarSprites): o que chega apaga o outro tipo guardado
      for (const k of await chavesDo(personagem)) {
        const [, tipo, nome, variante] = k.split('|');
        if (tipo === String(e.info.tipo) && nome === e.info.tags[0] && (variante === '') !== ((e.info.variante ?? null) === null)) await loja.remover(k);
      }
      await loja.guardar(e, chaveDe(personagem, e.info));
    }
    return true;
  } catch { return false; }
}

/** Personagens cujos sprites originais do app foram trocados por inteiro (importação com "substituir"): a exportação não deve levar os originais deles. */
export async function personagensSubstituidos(): Promise<Set<string>> {
  try { return new Set((await loja.todos()).filter((e): e is Marcador => 'marcador' in e).map((e) => e.personagem)); } catch { return new Set(); }
}

/** Reaplica o que foi importado antes (chamado ao abrir o app). Devolve quantos sprites voltaram. */
export async function carregarPacotesSalvos(): Promise<number> {
  try {
    const tudo = await loja.todos();
    const substituidos = new Set(tudo.filter((e): e is Marcador => 'marcador' in e).map((e) => e.personagem));
    const entradas = tudo.filter(ehEntrada);
    const por = new Map<string, EntradaSalva[]>();
    for (const e of entradas) por.set(e.personagem, [...(por.get(e.personagem) ?? []), e]);
    for (const [id, lista] of por) await registrarSprites(id as ActorId, lista, { substituir: substituidos.has(id) });
    return entradas.length;
  } catch { return 0; }
}

export async function lerEntradasSalvas(): Promise<EntradaSalva[]> {
  try { return (await loja.todos()).filter(ehEntrada); } catch { return []; }
}

/** Apaga do navegador os sprites guardados de um personagem. */
export async function removerSpritesSalvos(personagem: string): Promise<void> {
  try { for (const k of await chavesDo(personagem)) await loja.remover(k); } catch { /* nada guardado */ }
}

export async function limparPacotesSalvos(): Promise<void> {
  try { await loja.limpar(); } catch { /* nada a limpar */ }
}
