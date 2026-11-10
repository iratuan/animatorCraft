import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const dest = 'evidencias/24-audio';
// WAV de teste: 3 s de "voz" (tom modulado em rajadas) a 22,05 kHz, mono 16 bits
const sr = 22050, dur = 3, n = sr * dur, pcm = Buffer.alloc(44 + n * 2);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(sr, 24); pcm.writeUInt32LE(sr * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) { const t = i / sr; const env = Math.max(0, Math.sin(t * 2 * Math.PI * 2.2)) ; pcm.writeInt16LE(Math.round(Math.sin(t * 2 * Math.PI * 220) * env * 20000), 44 + i * 2); }
writeFileSync(`${dest}/narracao-teste.wav`, pcm);

const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Áudio\nProfessor entra pela esquerda andando.\nProfessor diz "Bem-vindos à aula!". [áudio: narracao-teste.wav]\n[efeito: narracao-teste.wav]`;
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=3.4#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByRole('tab', { name: 'Áudio', exact: true }).click();
await p.locator('input[type=file][accept*="audio"]').setInputFiles(`${dest}/narracao-teste.wav`);
await p.waitForTimeout(1200);
await p.screenshot({ path: `${dest}/01-painel-audio.png` });
console.log('lista:', await p.locator('.item-audio .topo').allInnerTexts());
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 240000 }), p.getByRole('button', { name: 'Exportar MP4' }).click()]);
await dl.saveAs(`${dest}/saida.mp4`);
const mp4 = readFileSync(`${dest}/saida.mp4`);
const txt = mp4.toString('latin1');
console.log('tamanho', mp4.length, '| faixa de áudio (soun):', txt.includes('soun'), '| aac (mp4a):', txt.includes('mp4a'), '| opus:', txt.includes('Opus'));
console.log('mensagem:', await p.locator('.barra-status, footer').last().innerText().catch(() => ''));
await p.screenshot({ path: `${dest}/02-depois-da-exportacao.png` });
console.log('erros', erros);
await b.close();
