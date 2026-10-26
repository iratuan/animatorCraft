import { useRef } from 'react';

/**
 * true quando `estado` é diferente do que se considera o ponto de partida.
 *  - Com `base`: a referência é o próprio valor carregado (ex.: ficha preenchida por um efeito). `base` null = ainda não carregou = sem alteração.
 *  - Sem `base`: o ponto de partida é o primeiro valor que o componente viu. Use só com estado inicial síncrono.
 */
export function useAlterado(estado: unknown, base?: unknown): boolean {
  const inicial = useRef<string | null>(null);
  const agora = JSON.stringify(estado) ?? '';
  if (base !== undefined) return base !== null && agora !== (JSON.stringify(base) ?? '');
  if (inicial.current === null) inicial.current = agora;
  return agora !== inicial.current;
}
