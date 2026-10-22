import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DEST = 'evidencias/48-evidencias-completas';
mkdirSync(DEST, { recursive: true });

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 } });
const p = await ctx.newPage();

await p.goto(`${BASE}?teste=1&ator=cringefather#/editor`);
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 60000 });
await p.waitForTimeout(600);

// 1. Cenário Podcast com personagens sentados atrás da bancada
const rotPodcast = `[cenário: podcast]
[formato: podcast]
[papéis: professor=CringeFather, aluno=BetaSon]

# Mesa Redonda
Professor entra pela esquerda andando na posição 32%. Aluno entra pela direita andando na posição 68%.
Professor diz "Bem-vindos ao CiênciaCast! Hoje o tema é física quântica." empolgado.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), rotPodcast);
await p.waitForTimeout(600);
// Posicionar tempo no meio da fala (t = 2.5s)
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.5, tocando: false }));
await p.waitForTimeout(600);

await p.screenshot({ path: `${DEST}/28-bancada-podcast.png` });
console.log('✓ 28-bancada-podcast.png');

// 2. Cenário Telejornal / Jornal com âncora sentada atrás da bancada de notícias
const rotJornal = `[cenário: telejornal]
[formato: telejornal]
[sem lousa]

# Plantão Notícias
Erika entra pelo centro na posição 50%.
Erika diz "Boa noite! Começa agora a edição especial do Stick News com as notícias da semana." feliz.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), rotJornal);
await p.waitForTimeout(600);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.0, tocando: false }));
await p.waitForTimeout(600);

await p.screenshot({ path: `${DEST}/29-bancada-telejornal.png` });
console.log('✓ 29-bancada-telejornal.png');

// 3. Apresentação do Gatinho Mingau e Paraíba
const rotPets = `# Família Stickman
Paraíba entra pela esquerda andando na posição 35%. Mingau entra pela direita andando na posição 65%.
Mingau diz "Miau! Cadê o meu lanchinho?" feliz.
Ao mesmo tempo, Paraíba dança por 3 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), rotPets);
await p.waitForTimeout(600);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.2, tocando: false }));
await p.waitForTimeout(600);

await p.screenshot({ path: `${DEST}/30-personagens-mingau-paraiba.png` });
console.log('✓ 30-personagens-mingau-paraiba.png');

await b.close();
