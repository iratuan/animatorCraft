// Terceira bateria: o ciclo completo de criar um personagem novo e desenhar os sprites dele no editor de imagem; persistência.
// Requer `npm run dev:web` rodando.   node tools/testar-editor-imagem-3.mjs
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/32-editor-de-imagem';
mkdirSync(dest, { recursive: true });
const falhas = [], passou = [];
const ok = (cond, msg) => { (cond ? passou : falhas).push(msg); if (!cond) console.log('  ✗', msg); };
const secao = (t) => console.log(`\n== ${t}`);

const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 } });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('dialog', (d) => d.accept());
const EI = p.locator('.ei');
const M = (fn, ...a) => p.evaluate(([f, args]) => new Function('m', 'args', `return (${f})(m, ...args)`)(window.__motorEditor, args), [fn.toString(), a]);
const tela = (x, y) => M((m, x, y) => { const s = m.paraTela(x, y), r = m.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, x, y);
const def = (k, v) => M((m, k, v) => m.definir(k, v), k, v);
const ferramenta = (t) => M((m, t) => m.definir('ferramenta', t), t);
const arrastar = async (pts) => { const a = await tela(pts[0][0], pts[0][1]); await p.mouse.move(a.x, a.y); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { const t = await tela(x, y); await p.mouse.move(t.x, t.y, { steps: 6 }); } await p.mouse.up(); };
const abrirEditorDe = async (espaco) => {
  await p.locator(`[data-espaco="${espaco}"]`).click();
  await p.waitForFunction(() => !!window.__motorEditor && window.__motorEditor.ui.camadas.length > 0, null, { timeout: 20000 });
  await p.waitForTimeout(400);
};
const salvarEFechar = async () => { await EI.getByRole('button', { name: 'Salvar no sprite' }).click(); await p.waitForSelector('.ei', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(500); };

secao('criar personagem e desenhar o parado');
await p.goto('http://127.0.0.1:5173/'); await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/?teste=1');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Arquivo').first().click(); await p.getByText('Novo personagem…').click();
await p.getByPlaceholder('ex.: Tia Marta').fill('Zeca'); await p.getByRole('button', { name: 'Criar personagem' }).click();
await p.waitForTimeout(500);
await p.getByText('Editar / exportar sprites de Zeca').click();
await abrirEditorDe('pose_parado');
const [w, h] = await M((m) => [m.doc.w, m.doc.h]);
ok(w === 400 && h === 640, `personagem novo abre com tela em branco ${w}×${h}`);
await ferramenta('elipse'); await def('formaPreenchida', true); await def('cor', '#f2c9a0');
await arrastar([[130, 40], [270, 180]]); // cabeça
await ferramenta('retangulo'); await def('cor', '#2e7d32');
await arrastar([[140, 190], [260, 420]]); // corpo
await ferramenta('retangulo'); await def('cor', '#1e3a8a');
await arrastar([[140, 420], [195, 610]]); await arrastar([[205, 420], [260, 610]]); // pernas
await ferramenta('pincel'); await def('cor', '#000000'); await def('tamanho', 8); await def('dureza', 100);
await arrastar([[170, 100], [172, 100]]); await arrastar([[230, 100], [232, 100]]);
await arrastar([[175, 140], [200, 150], [225, 140]]);
await p.screenshot({ path: `${dest}/13-desenhando-um-personagem-novo.png` });
await salvarEFechar();
ok(await p.locator('[data-espaco="pose_parado"]').evaluate((e) => !e.classList.contains('vazio')), 'o parado passa a existir');
// um rosto de fala e a expressão neutra
for (const [esp, cor] of [['rosto_neutra', '#f2c9a0'], ['rosto_boca-a', '#f2c9a0']]) {
  await abrirEditorDe(esp);
  const [rw, rh] = await M((m) => [m.doc.w, m.doc.h]);
  await M((m) => m.tamanhoDaTela(140, 140));
  await ferramenta('elipse'); await def('formaPreenchida', true); await def('cor', cor);
  await arrastar([[5, 5], [135, 135]]);
  await ferramenta('pincel'); await def('cor', '#000000'); await def('tamanho', 8);
  await arrastar([[45, 55], [47, 55]]); await arrastar([[95, 55], [97, 55]]);
  if (esp === 'rosto_boca-a') { await ferramenta('elipse'); await def('cor', '#b71c1c'); await arrastar([[50, 85], [90, 120]]); }
  else { await ferramenta('pincel'); await arrastar([[50, 95], [70, 105], [90, 95]]); }
  void rw; void rh;
  await salvarEFechar();
}
ok(await p.locator('[data-espaco="rosto_neutra"]').evaluate((e) => !e.classList.contains('vazio')) && await p.locator('[data-espaco="rosto_boca-a"]').evaluate((e) => !e.classList.contains('vazio')), 'rostos criados no editor');
await p.getByRole('button', { name: 'Fechar' }).click();

secao('o personagem aparece e fala no palco com os sprites desenhados');
await p.evaluate(() => localStorage.setItem('stickboard.roteiro.v2', '# Cena\nZeca entra pela esquerda andando.\nZeca diz "Olá, eu sou o Zeca!".'));
await p.goto('http://127.0.0.1:5173/?teste=1&t=3.5');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(1500);
const cv = p.locator('.area-palco canvas');
const achou = await cv.evaluate((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const cores = { verde: 0, azul: 0 }; for (let i = 0; i < d.length; i += 4) { /* o palco é em escala de cinza: procura o corpo escuro/claro do desenho */ if (d[i] > 20 && d[i] < 230 && Math.abs(d[i] - d[i + 1]) < 3) cores.verde++; } return cores.verde; });
ok(achou > 3000, `o sprite desenhado aparece no palco (${achou} px de cinza do personagem)`);
await p.screenshot({ path: `${dest}/14-personagem-novo-no-palco.png`, clip: await cv.boundingBox() });

secao('persistência depois de recarregar');
await p.goto('http://127.0.0.1:5173/?teste=1');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Arquivo').first().click(); await p.getByText('Editar / exportar sprites dos personagens…').click();
await p.locator('.seletor-personagem button', { hasText: 'Zeca' }).click();
ok(await p.locator('[data-espaco="pose_parado"]').evaluate((e) => !e.classList.contains('vazio')), 'o parado continua existindo depois de recarregar');
await abrirEditorDe('pose_parado');
const px = await M((m) => { const c = m.achatar(), i = (300 * c.w + 200) * 4; return [c.data[i], c.data[i + 1], c.data[i + 2], c.data[i + 3]]; });
ok(px[3] === 255 && px[1] > 100 && px[0] < 80, `o desenho salvo (corpo verde) voltou intacto (${px})`);
await p.keyboard.press('Escape');


secao('toque de verdade (tela sensível ao toque do tablet)');
const ctxT = await b.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true, isMobile: false });
const pt = await ctxT.newPage(); pt.on('pageerror', (e) => erros.push(String(e)));
await pt.goto('http://127.0.0.1:5173/'); await pt.evaluate(() => localStorage.clear());
await pt.goto('http://127.0.0.1:5173/?ator=laura&teste=1');
await pt.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await pt.getByText('Editar / exportar sprites de Laura').click();
await pt.locator('[data-espaco="rosto_brava"]').click();
await pt.waitForFunction(() => !!window.__motorEditor && window.__motorEditor.ui.camadas.length > 0, null, { timeout: 20000 });
await pt.waitForTimeout(500);
await pt.evaluate(() => { const m = window.__motorEditor; m.tamanhoDaTela(300, 300); m.definir('ferramenta', 'pincel'); m.definir('tamanho', 30); m.definir('cor', '#ff0000'); m.definir('dureza', 100); });
const alvo = await pt.evaluate(() => { const m = window.__motorEditor, s = m.paraTela(150, 150), r = m.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; });
await pt.touchscreen.tap(alvo.x, alvo.y);
const toque = await pt.evaluate(() => { const c = window.__motorEditor.achatar(), i = (150 * c.w + 150) * 4; return c.data[i + 3]; });
ok(toque === 255, 'um toque de verdade na tela pinta (pointerType touch)');
await ctxT.close();
console.log('\n---------------------------------');
console.log(`passaram: ${passou.length}   falharam: ${falhas.length}`);
if (erros.length) console.log('erros da página:', erros.slice(0, 5));
await b.close();
if (falhas.length || erros.length) { console.log('FALHAS:', falhas); process.exit(1); }


