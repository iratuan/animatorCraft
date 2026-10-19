import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const dest = 'evidencias/27-projeto';
const sr = 8000, n = sr, pcm = Buffer.alloc(44 + n * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.round(Math.sin(i / 8) * 8000), 44 + i * 2);
writeFileSync(`${dest}/som.wav`, pcm);

const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx1 = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const p = await ctx1.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/?recarga=1#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
// personagem novo
await p.getByText('Arquivo').first().click(); await p.getByText('Novo personagem…').click();
await p.getByPlaceholder('ex.: Tia Marta').fill('Tia Marta'); await p.getByRole('button', { name: 'Criar personagem' }).click();
// roteiro e áudio
await p.locator('textarea').first().fill('# Cena\nTia Marta entra pela esquerda andando.\nTia Marta diz "Oi, gente!". [áudio: som.wav]');
await p.getByRole('button', { name: 'Áudio', exact: true }).click();
await p.locator('input[type=file][accept*="audio"]').setInputFiles(`${dest}/som.wav`);
await p.waitForTimeout(1000);
await p.getByText('Arquivo').first().click();
const [dl] = await Promise.all([p.waitForEvent('download'), p.getByText('Salvar projeto completo (.zip)…').click()]);
await dl.saveAs(`${dest}/projeto.zip`);
console.log('projeto.zip', readFileSync(`${dest}/projeto.zip`).length, 'bytes');
await ctx1.close();

// contexto novo e vazio: abre o projeto
const ctx2 = await b.newContext({ viewport: { width: 1600, height: 900 } });
const q = await ctx2.newPage(); q.on('pageerror', (e) => erros.push(String(e)));
await q.goto('http://127.0.0.1:5173/#/editor');
await q.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await q.getByText('Arquivo').first().click();
const [fc] = await Promise.all([q.waitForEvent('filechooser'), q.getByText('Abrir projeto (.zip)…').click()]);
await fc.setFiles(`${dest}/projeto.zip`);
await q.waitForTimeout(2000);
console.log('mensagem:', await q.locator('footer, .barra-status').last().innerText().catch(() => ''));
console.log('roteiro:', (await q.locator('textarea').first().inputValue()).replace(/\n/g, ' | '));
console.log('tem Tia Marta nas camadas:', (await q.locator('.camadas').innerText()).includes('Tia Marta'));
await q.getByRole('button', { name: 'Áudio', exact: true }).click();
console.log('áudios:', await q.locator('.item-audio .topo').allInnerTexts());
await q.screenshot({ path: `${dest}/projeto-aberto.png` });
console.log('erros', erros);
await b.close();
