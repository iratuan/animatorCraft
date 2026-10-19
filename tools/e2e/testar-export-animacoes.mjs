// Exporta MP4 (16:9 e 9:16, estilos Chibi e Stickman) com expressão nova e clipe do personagem, e confere o arquivo reproduzindo-o.
// Uso: node tools/e2e/testar-export-animacoes.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const destino = resolve(process.argv[2] ?? 'evidencias/35-expressoes-e-clipes/export');
mkdirSync(destino, { recursive: true });
const roteiro = '# Teste\nBetason entra pela esquerda andando.\nBetason fica na posição 50%.\nBetason faz cara de sonolento.\nBetason faz o clipe tchau por 2 segundos.\nBetason diz "Funciona no vídeo!" feliz.';
const clipes = [{ ator: 'betason', nome: 'Tchau', estilo: 'ambos', loop: true, passos: [{ tags: ['comemorar'], dur: 0.4, mov: 'balancar', amp: 6, poseBoneco: 'acenar' }, { tags: ['parado'], dur: 0.4, mov: 'pular', amp: 0.12, poseBoneco: 'parado' }] }];
const expressoes = [{ ator: 'betason', nome: 'sonolento', quadros: [{ olho: 'meia', sobr: 2, boca: 'reta' }, { olho: 'estreito', sobr: -2, boca: 'onda' }] }];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let falhas = 0;
for (const skin of ['chibi', 'stickman']) for (const formato of ['16:9', '9:16']) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { falhas++; console.log('pageerror', e); });
  await page.goto('http://127.0.0.1:5173/#/editor');
  await page.evaluate(([r, c, e, s]) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); localStorage.setItem('stickboard.clipes.v1', JSON.stringify(c)); localStorage.setItem('stickboard.expressoes.v1', JSON.stringify(e)); localStorage.setItem('stickboard.skins.v1', JSON.stringify({ padrao: s, porPersonagem: {} })); }, [roteiro, clipes, expressoes, skin]);
  await page.goto('http://127.0.0.1:5173/?recarga=1#/editor');
  await page.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  if (formato === '9:16') await page.click('text=9:16');
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 280000 }), page.click('text=Exportar MP4')]);
  const arquivo = join(destino, `anim-${skin}-${formato.replace(':', 'x')}.mp4`);
  await download.saveAs(arquivo);
  console.log(`${skin} ${formato}: ${(statSync(arquivo).size / 1e6).toFixed(2)} MB`);
  const v = await ctx.newPage();
  await v.goto(pathToFileURL(arquivo).href);
  const info = await v.evaluate(() => new Promise((ok) => { const el = document.querySelector('video'); const pronto = () => { el.currentTime = Math.min(el.duration * 0.6, el.duration - 0.1); }; el.onloadedmetadata = pronto; el.onseeked = () => ok({ duracao: el.duration, w: el.videoWidth, h: el.videoHeight }); if (el.readyState >= 1) pronto(); }));
  const esperado = formato === '16:9' ? [1920, 1080] : [1080, 1920];
  const bom = info.w === esperado[0] && info.h === esperado[1] && info.duracao > 5;
  if (!bom) falhas++;
  console.log('  ', JSON.stringify(info), bom ? 'ok' : 'FALHOU');
  await v.locator('video').screenshot({ path: join(destino, `quadro-${skin}-${formato.replace(':', 'x')}.png`) });
  await ctx.close();
}
await browser.close();
console.log(falhas ? `FALHAS: ${falhas}` : 'todos os vídeos ok');
process.exit(falhas ? 1 : 0);
