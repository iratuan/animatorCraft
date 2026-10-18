import { prepararSprites, type ManifestoPersonagens } from '@renderer/features/cena';
import manifesto from '@renderer/assets/personagens/personagens.json';

// Os sprites entram no pacote como data URLs: funciona igual no navegador, no Electron (file://) e no Android,
// e o canvas pode ler os pixels para a conversão em escala de cinza.
const imagens = import.meta.glob('/src/renderer/assets/personagens/*/*.png', { eager: true, query: '?inline', import: 'default' }) as Record<string, string>;

let carregando: Promise<void> | null = null;

export const manifestoOriginal = manifesto as ManifestoPersonagens;
/** data URL do PNG original (colorido) que veio no app */
export const urlOriginal = (arquivo: string): string | undefined => imagens[`/src/renderer/assets/personagens/${arquivo}`];

export function carregarPersonagens(): Promise<void> {
  carregando ??= prepararSprites(manifestoOriginal, (arquivo) => urlOriginal(arquivo)!, 'cinza');
  return carregando;
}
