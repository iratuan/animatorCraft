/** Copia o texto para a área de transferência. Usa a API moderna e, onde ela é bloqueada (WebView, http), um campo temporário. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try { if (window.stickboard) return await window.stickboard.copiarTexto(texto); } catch { /* cai para a API web */ }
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(texto); return true; }
  } catch { /* cai para o plano B */ }
  try {
    const campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(campo);
    campo.select();
    const ok = document.execCommand('copy');
    campo.remove();
    return ok;
  } catch { return false; }
}
