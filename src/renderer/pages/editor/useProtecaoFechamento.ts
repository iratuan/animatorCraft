import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { plataforma } from '@renderer/features/sistema';

/**
 * Enquanto houver alterações que não foram salvas, fechar o app pergunta antes:
 *  - desktop: o processo principal mostra a pergunta ao fechar a janela (services/janela.ts);
 *  - navegador: o próprio navegador pergunta ao sair da página (beforeunload).
 */
export function useProtecaoFechamento(): void {
  const modificado = useEditor((s) => s.modificado);

  useEffect(() => {
    plataforma.definirAlteracoesPendentes?.(modificado);
  }, [modificado]);

  useEffect(() => {
    if (!modificado || plataforma.nome !== 'web') return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [modificado]);
}
