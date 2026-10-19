import { lazy } from 'react';

/** O editor é um pedaço separado do app: a tela inicial abre sem ele e o baixa em segundo plano (precarregarEditor). */
const carregar = () => import('@renderer/pages/editor/EditorPage').then((m) => ({ default: m.EditorPage }));
let promessa: ReturnType<typeof carregar> | null = null;
export const precarregarEditor = (): void => { promessa ??= carregar(); };
export const EditorPage = lazy(() => (promessa ??= carregar()));
