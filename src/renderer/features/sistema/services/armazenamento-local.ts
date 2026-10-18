/**
 * localStorage com rede de segurança: pode falhar (janela privada, armazenamento bloqueado, cota cheia) e o app tem de seguir funcionando.
 * Tudo que o app guarda em localStorage passa por aqui.
 */
export function lerTexto(chave: string, padrao: string): string {
  try { return localStorage.getItem(chave) ?? padrao; } catch { return padrao; }
}
export function gravarTexto(chave: string, valor: string): void {
  try { localStorage.setItem(chave, valor); } catch { /* sem armazenamento */ }
}
export function lerJson<T>(chave: string, padrao: T): T {
  try { const v = localStorage.getItem(chave); return v ? (JSON.parse(v) as T) : padrao; } catch { return padrao; }
}
export function gravarJson(chave: string, valor: unknown): void {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ }
}
