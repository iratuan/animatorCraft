import { useEffect, useState } from 'react';
import { useEditor } from '@renderer/store/editor-store';

/** Quanto tempo o aviso fica na tela. */
const DURACAO_MS = 4000;

/**
 * Mostra a mensagem do app (exportação, salvamento, erros) num aviso curto sobre a tela.
 * A barra de status continua com a mesma mensagem; este aviso só chama a atenção por alguns segundos.
 * `aria-live` faz leitores de tela anunciarem a mensagem.
 */
export function AvisoFlutuante() {
  const mensagem = useEditor((s) => s.mensagem);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // "Pronto." e "Carregando…" são estado de rotina, não notícia: ficam só na barra de status
    if (!mensagem || /^(Pronto\.|Carregando)/.test(mensagem)) return;
    setVisivel(true);
    const t = window.setTimeout(() => setVisivel(false), DURACAO_MS);
    return () => window.clearTimeout(t);
  }, [mensagem]);

  return (
    <div className={`aviso-flutuante ${visivel ? 'on' : ''}`} role="status" aria-live="polite">
      {visivel ? mensagem : ''}
    </div>
  );
}
