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

/** `substituir`: apaga antes tudo o que havia guardado do personagem (pacote com ficha completa). */
export async function salvarEntradas(personagem: string, entradas: EntradaSalva[], substituir: boolean): Promise<void> {
  try {
    if (substituir) {
      for (const k of await chavesDo(personagem)) await loja.remover(k);
      await loja.guardar({ marcador: 'substituir', personagem }, `${personagem}|__substituir`);
    }
    for (const e of entradas) await loja.guardar(e, chaveDe(personagem, e.info));
  } catch { /* sem IndexedDB: o pacote vale só nesta sessão */ }
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
