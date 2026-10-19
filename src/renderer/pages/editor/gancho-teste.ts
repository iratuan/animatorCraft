import * as dominio from '@shared/domain';
import * as cena from '@renderer/features/cena';
import * as personagens from '@renderer/features/personagens';
import { useEditor } from '@renderer/store/editor-store';

/**
 * Gancho para os testes automáticos no navegador (só com `?teste` na URL; o pedaço nem é baixado sem isso):
 * dá aos testes as mesmas instâncias que o app usa (registro de personagens, sprites, store), em vez de módulos carregados por fora.
 */
(window as unknown as { __sb: unknown }).__sb = { dominio, cena, personagens, store: useEditor };
