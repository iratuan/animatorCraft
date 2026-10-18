import { chromium } from 'playwright-core';
const dest = 'evidencias/23-simultaneo-personagens-manual';
import { mkdirSync } from 'node:fs'; mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e.stack).split('\n').slice(0,4).join(' | ')));
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]

# Simultâneo
Professor entra pela esquerda andando. Aluno entra pela direita andando.
Enquanto Professor diz "Hoje vamos aprender produtos notáveis!", Aluno dança por 6 segundos.
Ao mesmo tempo, Erika entra pela direita andando.
Professor aponta.`;
await p.goto('http://127.0.0.1:5173/');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=6');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(800);
await p.screenshot({ path: `${dest}/01-simultaneo.png` });
// cria personagem
await p.getByText('Arquivo').first().click();
await p.getByText('Novo personagem…').click();
await p.getByPlaceholder('ex.: Tia Marta').fill('Tia Marta');
await p.getByPlaceholder('ex.: tia, martinha').fill('tia');
await p.screenshot({ path: `${dest}/02-novo-personagem.png` });
await p.getByRole('button', { name: 'Criar personagem' }).click();
await p.waitForTimeout(500);
await p.evaluate((r) => localStorage.setItem('stickboard.roteiro.v2', r), roteiro + '\nTia Marta entra pela esquerda andando. Tia Marta diz "Cheguei, meninos!".');
await p.reload(); await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(500);
console.log('apos reload, tem Tia Marta na lista?', (await p.content()).includes('Tia Marta'));
await p.keyboard.press('F1'); await p.waitForTimeout(400);
await p.screenshot({ path: `${dest}/03-manual.png` });
console.log('erros', erros);
await b.close();

