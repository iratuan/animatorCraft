// Arrastar a borda de uma fala na linha do tempo grava "por N segundos" no roteiro.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/56-borda-duracao';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

const roteiro = '# Borda\nProfessor diz "Olá, turma!" feliz.\n';
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?borda=1#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });

const bloco = p.locator('.bloco', { hasText: 'Olá' }).first();
await bloco.waitFor({ timeout: 30000 });
await bloco.hover();
const alca = bloco.locator('.alca');
conferir(await alca.count() === 1, 'a fala ganha a alça na borda direita');

const caixa = await alca.boundingBox();
await p.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
await p.mouse.down();
await p.mouse.move(caixa.x + caixa.width / 2 + 160, caixa.y + caixa.height / 2, { steps: 8 });
await p.mouse.up();
await p.waitForTimeout(400);

const texto = await p.locator('#campo-roteiro').inputValue();
const linhaFala = texto.split('\n').find((l) => l.includes('Olá')) ?? '';
conferir(/por \d+(?:[.,]\d+)? segundos?/.test(linhaFala), `o roteiro ganhou "por N segundos": "${linhaFala}"`);
conferir(linhaFala.includes('"Olá, turma!"'), 'o texto falado continua igual');
await p.screenshot({ path: `${dest}/01-borda-arrastada.png` });

await b.close();
console.log(falhas.length ? `${falhas.length} falha(s)` : 'borda da fala: tudo ok');
process.exit(falhas.length ? 1 : 0);
