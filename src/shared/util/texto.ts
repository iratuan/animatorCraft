/** Texto sem acentos e em minúsculas: base de toda comparação de palavras do roteiro. */
export const semAcento = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** "Ana Júlia" -> "ana-julia": só letras e números, separados por hífen. */
export const slug = (s: string): string => semAcento(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
