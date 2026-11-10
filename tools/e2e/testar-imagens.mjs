import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const dest = 'evidencias/31-imagens-na-lousa';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
await p.goto('http://127.0.0.1:5173/#/editor');
// cria um PNG de teste (diagrama colorido) dentro da página e salva em disco
const b64 = await p.evaluate(() => {
  const c = document.createElement('canvas'); c.width = 640; c.height = 400; const x = c.getContext('2d');
  x.clearRect(0, 0, 640, 400);
  x.fillStyle = '#cfe8ff'; x.fillRect(0, 0, 640, 400); x.fillStyle = '#ffd36b'; x.beginPath(); x.arc(520, 90, 55, 0, 7); x.fill();
  x.fillStyle = '#5cb85c'; x.fillRect(0, 320, 640, 80); x.fillStyle = '#fff'; for (const [cx, cy] of [[150, 110], [260, 80], [330, 130]]) { x.beginPath(); x.arc(cx, cy, 38, 0, 7); x.fill(); }
  x.strokeStyle = '#1565c0'; x.lineWidth = 8; x.beginPath(); x.moveTo(150, 150); x.lineTo(150, 300); x.moveTo(260, 120); x.lineTo(260, 300); x.stroke();
  x.fillStyle = '#111'; x.font = 'bold 34px sans-serif'; x.fillText('Ciclo da água', 190, 370);
  return c.toDataURL('image/png').split(',')[1];
});
writeFileSync(`${dest}/ciclo-da-agua.png`, Buffer.from(b64, 'base64'));
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Imagem\nProfessor entra pela esquerda andando. Aluno entra pela direita andando.\nProfessor diz "Vamos ver o ciclo da água.".\nProfessor aponta.\nEspera 3 segundos.`;
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
// 1) cursor dentro da frase da fala
await p.evaluate(() => { const ta = document.querySelector('#campo-roteiro'); ta.focus(); const pos = ta.value.indexOf('Vamos ver') + 4; ta.setSelectionRange(pos, pos); ta.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true })); });
// 2) importa e insere
await p.getByRole('tab', { name: 'Imagens', exact: true }).click();
await p.locator('input[type=file][accept*="png"]').setInputFiles(`${dest}/ciclo-da-agua.png`);
await p.waitForTimeout(800);
await p.getByRole('button', { name: 'Inserir no roteiro' }).click();
await p.waitForTimeout(500);
const texto = await p.locator('#campo-roteiro').inputValue();
console.log('trecho:', texto.split('\n').slice(3, 5).join(' || '));
console.log('inserida logo depois da fala (antes de "Professor aponta"):', texto.indexOf('mostra a imagem') > texto.indexOf('Vamos ver') && texto.indexOf('mostra a imagem') < texto.indexOf('Professor aponta'));
await p.screenshot({ path: `${dest}/01-imagem-inserida.png` });
// 3) instantes da animação: efeito no meio e no fim
const tIni = await p.evaluate(() => 0);
for (const [nome, t] of [['02-entrando', null], ['03-no-lugar', null]]) { void nome; void t; void tIni; }
const durTotal = await p.locator('.transporte, .controles, body').first().innerText().catch(() => '');
void durTotal;
await p.close();
const q = await ctx.newPage();
q.on('pageerror', (e) => erros.push(String(e)));
await q.goto('http://127.0.0.1:5173/?t=0#/editor');
await q.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
// pega o início do evento da imagem pelo bloco da linha do tempo
const blocos = await q.locator('.bloco').evaluateAll((els) => els.map((e) => ({ t: e.title, left: parseFloat(e.style.left) })));
const img = blocos.find((x) => /mostra imagem/.test(x.t));
const zoom = await q.evaluate(() => 70);
const inicio = img.left / zoom;
console.log('bloco da imagem:', img.t, '| início', inicio.toFixed(2), 's');
for (const [nome, dt] of [['02-entrando-surgir', 0.35], ['03-no-lugar', 1.2]]) {
  await q.goto(`http://127.0.0.1:5173/?t=${(inicio + dt).toFixed(2)}#/editor`);
  await q.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await q.waitForTimeout(900);
  const box = await q.locator('.area-palco canvas').boundingBox();
  await q.screenshot({ path: `${dest}/${nome}.png`, clip: box });
}
// 4) troca de efeito, tamanho e canto pela linha do tempo
await q.locator('.bloco', { hasText: 'mostra imagem' }).first().click();
await q.locator('.barra-evento label', { hasText: 'Entrada' }).locator('select').selectOption('deslizar-direita');
await q.waitForTimeout(300);
await q.locator('.bloco', { hasText: 'mostra imagem' }).first().click();
await q.locator('.barra-evento label', { hasText: 'Tamanho' }).locator('select').selectOption('pequena');
await q.waitForTimeout(300);
await q.locator('.bloco', { hasText: 'mostra imagem' }).first().click();
await q.locator('.barra-evento label', { hasText: 'Lugar' }).locator('select').selectOption('direita');
await q.waitForTimeout(300);
const t2 = await q.locator('#campo-roteiro').inputValue();
console.log('frase após editar:', t2.split('\n').find((l) => l.includes('mostra a imagem')));
await q.screenshot({ path: `${dest}/04-editando-efeito.png` });
// 5) excluir
await q.locator('.bloco', { hasText: 'mostra imagem' }).first().click();
await q.getByRole('button', { name: 'Excluir imagem' }).click();
await q.waitForTimeout(400);
console.log('ainda tem imagem no roteiro?', (await q.locator('#campo-roteiro').inputValue()).includes('imagem'));
// 6) desfaz
await q.keyboard.press('Control+z'); await q.waitForTimeout(300);
console.log('depois do Ctrl+Z a imagem volta?', (await q.locator('#campo-roteiro').inputValue()).includes('mostra a imagem'));
// 7) o MP4 sai com a imagem e o projeto .zip leva a imagem
await q.locator('#campo-roteiro').click();
await q.keyboard.press('Control+z'); // volta ao estado sem imagem excluída? (já voltou acima); garante que há imagem no roteiro
await q.waitForTimeout(300);
if (!(await q.locator('#campo-roteiro').inputValue()).includes('mostra a imagem')) { await q.keyboard.press('Control+y'); }
const [dlv] = await Promise.all([q.waitForEvent('download', { timeout: 240000 }), q.getByRole('button', { name: 'Exportar MP4' }).click()]);
await dlv.saveAs(`${dest}/saida-com-imagem.mp4`);
console.log('MP4 com imagem gerado:', (await import('node:fs')).statSync(`${dest}/saida-com-imagem.mp4`).size, 'bytes');
await q.getByText('Arquivo').first().click();
await q.getByText('Projeto', { exact: true }).first().click();
const [dlp] = await Promise.all([q.waitForEvent('download'), (async () => { await q.getByText('Salvar projeto (.zip)', { exact: true }).click(); await q.locator('input[aria-label="Nome com que deseja salvar o projeto (.zip)"]').last().fill('projeto-com-imagem'); await q.getByRole('button', { name: 'Salvar', exact: true }).click(); })()]);
await dlp.saveAs(`${dest}/projeto-com-imagem.zip`);
const novo = await b.newContext({ viewport: { width: 1600, height: 900 } });
const r = await novo.newPage(); r.on('pageerror', (e) => erros.push(String(e)));
await r.goto('http://127.0.0.1:5173/#/editor');
await r.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await r.getByText('Arquivo').first().click();
await r.getByText('Projeto', { exact: true }).first().click();
const [fc] = await Promise.all([r.waitForEvent('filechooser'), r.getByText('Abrir projeto (.zip)…').click()]);
await fc.setFiles(`${dest}/projeto-com-imagem.zip`);
await r.waitForTimeout(2500);
await r.getByRole('tab', { name: 'Imagens', exact: true }).click();
console.log('imagens no projeto aberto:', await r.locator('.item-imagem b').allInnerTexts());
console.log('avisos do roteiro:', await r.locator('.roteiro .badge').innerText());console.log('erros', erros);
await b.close();


