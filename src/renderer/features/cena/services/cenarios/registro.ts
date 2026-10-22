import { cenarioDebate } from './debate';
import { cenarioLousa, cenarioNeutro } from './lousa';
import { cenarioPapoLivre } from './papoLivre';
import { cenarioPodcast } from './podcast';
import { cenarioTelejornal } from './telejornal';
import type { CenarioStrategy } from './tipos';

const estrategias: Record<string, CenarioStrategy> = {
  podcast: cenarioPodcast,
  telejornal: cenarioTelejornal,
  debate: cenarioDebate,
  papo_livre: cenarioPapoLivre,
  livre: cenarioPapoLivre,
  lousa: cenarioLousa,
  neutro: cenarioNeutro,
};

/**
 * Resolve a estratégia de cenário correspondente ao ID informado.
 * Adere ao Open-Closed Principle (OCP), permitindo extensão de cenários sem modificar o loop de renderização.
 */
export function obterEstrategiaCenario(tipo: string | undefined): CenarioStrategy {
  const chave = (tipo ?? 'lousa').trim().toLowerCase();
  return estrategias[chave] ?? cenarioLousa;
}

export * from './tipos';
export * from './helpers';
