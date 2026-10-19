import { _electron as electron } from 'playwright-core';
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();
const erros = []; win.on('pageerror', (e) => erros.push(String(e)));
await win.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.getByText('Arquivo').first().click();
await win.getByText('Editar / exportar sprites dos personagens…').click();
await win.locator('[data-espaco="rosto_brava"]').first().click().catch(() => {});
const aberto = await win.locator('.ei').count();
console.log('editor abriu no exe empacotado:', aberto === 1);
if (aberto) {
  await win.waitForTimeout(2000);
  const cv = await win.locator('[data-testid="ei-canvas"]').boundingBox();
  await win.mouse.move(cv.x + cv.width / 2 - 40, cv.y + cv.height / 2); await win.mouse.down(); await win.mouse.move(cv.x + cv.width / 2 + 40, cv.y + cv.height / 2, { steps: 8 }); await win.mouse.up();
  const depois = await win.evaluate(() => [...document.querySelectorAll('.ei-topo button')].filter((b) => /Desfazer/.test(b.innerText)).map((b) => !b.disabled));
  console.log('o traço foi desenhado no exe (Desfazer habilitado):', depois[0]);
  await win.screenshot({ path: 'evidencias/33-build-0.4.0/exe-editor-de-imagem.png' });
  console.log('botão Salvar presente:', await win.getByRole('button', { name: 'Salvar no sprite' }).count());
}
console.log('erros', erros);
await app.close();

