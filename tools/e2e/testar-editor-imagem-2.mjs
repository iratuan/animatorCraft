// Segunda bateria do editor de imagem: sprites existentes, quadros de animação, encaixe, exportação, caso extremos e tablet.
// Requer `npm run dev:web` rodando.   node tools/e2e/testar-editor-imagem-2.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { unzipSync, strFromU8 } from 'fflate';

const dest = 'evidencias/32-editor-de-imagem';
mkdirSync(dest, { recursive: true });
const falhas = [], passou = [];
const ok = (cond, msg) => { (cond ? passou : falhas).push(msg); if (!cond) console.log('  ✗', msg); };
const secao = (t) => console.log(`\n== ${t}`);
const manifesto = JSON.parse(readFileSync('src/renderer/assets/personagens/personagens.json', 'utf8'));
const original = (id, nome) => manifesto[id].sprites.find((s) => s.tags[0] === nome && !s.variante);
const pngDims = (u8) => [(u8[16] << 24) | (u8[17] << 16) | (u8[18] << 8) | u8[19], (u8[20] << 24) | (u8[21] << 16) | (u8[22] << 8) | u8[23]];

const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('dialog', (d) => d.accept());
const EI = p.locator('.ei');
const M = (fn, ...a) => p.evaluate(([f, args]) => new Function('m', 'args', `return (${f})(m, ...args)`)(window.__motorEditor, args), [fn.toString(), a]);
const pixel = (x, y) => M((m, x, y) => { const c = m.achatar(), i = (y * c.w + x) * 4; return [c.data[i], c.data[i + 1], c.data[i + 2], c.data[i + 3]]; }, x, y);
const contar = () => M((m) => { const c = m.achatar(); let n = 0; for (let i = 3; i < c.data.length; i += 4) if (c.data[i] > 0) n++; return n; });
const dims = () => M((m) => [m.doc.w, m.doc.h]);
const tela = (x, y) => M((m, x, y) => { const s = m.paraTela(x, y), r = m.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, x, y);
const ferramenta = (t) => M((m, t) => m.definir('ferramenta', t), t);
const def = (k, v) => M((m, k, v) => m.definir(k, v), k, v);
const arrastar = async (pts, passos = 6) => { const a = await tela(pts[0][0], pts[0][1]); await p.mouse.move(a.x, a.y); await p.mouse.down(); for (const [x, y] of pts.slice(1)) { const t = await tela(x, y); await p.mouse.move(t.x, t.y, { steps: passos }); } await p.mouse.up(); };
const limpar = () => M((m) => { m.confirmarFlutuante(); while (m.doc.camadas.length > 1) m.excluirCamada(); m.doc.ativa = 0; m.definir('ferramenta', 'selRet'); m.selecionarTudo(); m.apagarConteudo(); m.desselecionar(); });
const abrirApp = async (consulta = '?ator=laura&teste=1', viewport) => {
  if (viewport) await p.setViewportSize(viewport);
  await p.goto('http://127.0.0.1:5173/'); await p.evaluate(() => localStorage.clear());
  await p.goto(`http://127.0.0.1:5173/${consulta}`);
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
};
const abrirEditorDe = async (espaco) => {
  if (!(await p.locator('.modal.largo').count())) await p.getByText('Editar / exportar sprites de Laura').click();
  await p.locator(`[data-espaco="${espaco}"]`).click();
  await p.waitForFunction(() => !!window.__motorEditor && window.__motorEditor.ui.camadas.length > 0, null, { timeout: 20000 }).catch(async (e) => {
    console.log('  ! o editor não abriu:', espaco, JSON.stringify(await p.evaluate(() => ({ ei: !!document.querySelector('.ei'), motor: !!window.__motorEditor, rodape: document.querySelector('.ei-rodape')?.innerText, modais: document.querySelectorAll('.modal').length }))));
    await p.screenshot({ path: `${dest}/falha-abrir.png` }); throw e;
  });
  await p.waitForTimeout(500);
};
const salvarEFechar = async () => { await EI.getByRole('button', { name: 'Salvar no sprite' }).click(); await p.waitForSelector('.ei', { state: 'detached', timeout: 15000 }); await p.waitForTimeout(500); };
const exportarZip = async (nome) => { const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Exportar Laura/ }).click()]); await dl.saveAs(`${dest}/${nome}`); return unzipSync(new Uint8Array(readFileSync(`${dest}/${nome}`))); };

await abrirApp();
await p.getByText('Editar / exportar sprites de Laura').click();

// ---------------------------------------------------------------- pose_parado: tamanho exato e caixa da cabeça
secao('editar pose_parado existente');
const oParado = original('laura', 'parado');
await abrirEditorDe('pose_parado');
const [wp, hp] = await dims();
ok(wp === oParado.w && hp === oParado.h, `o editor abre com o tamanho do sprite (${wp}×${hp})`);
ok(await M((m) => !!m.guias.cabeca && m.guias.chao === m.doc.h), 'guias de cabeça e chão aparecem nas poses');
await ferramenta('pincel'); await def('cor', '#0000ff'); await def('tamanho', 6);
await arrastar([[wp / 2 - 8, hp * 0.6], [wp / 2 + 8, hp * 0.6]]);
await salvarEFechar();
let zip = await exportarZip('z1.zip');
const parado = zip['laura/pose_parado.png'];
ok(parado && JSON.stringify(pngDims(parado)) === JSON.stringify([wp, hp]), 'o PNG exportado tem exatamente o tamanho editado (sem aparar)');
let meta = JSON.parse(strFromU8(zip['laura/meta.json']));
ok(JSON.stringify(meta.cabeca) === JSON.stringify(oParado.rosto.cabeca), 'a caixa da cabeça do parado foi mantida');
ok(meta.base && meta.base.w === wp && meta.base.h === hp, 'meta.json registra o tamanho do parado');

// ---------------------------------------------------------------- rosto existente mantém o encaixe
secao('editar rosto existente');
const oFeliz = original('laura', 'feliz');
await abrirEditorDe('rosto_feliz');
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 3);
const [wf, hf] = await dims();
await arrastar([[wf / 2 - 5, hf * 0.8], [wf / 2 + 5, hf * 0.8]]);
await salvarEFechar();
zip = await exportarZip('z2.zip');
meta = JSON.parse(strFromU8(zip['laura/meta.json']));
ok(!!meta.encaixe?.feliz, 'o rosto editado continua com encaixe');
ok(JSON.stringify(meta.encaixe.feliz) === JSON.stringify(oFeliz.encaixe), `o encaixe medido foi mantido (${JSON.stringify(meta.encaixe?.feliz)})`);
ok(JSON.stringify(pngDims(zip['laura/rosto_feliz.png'])) === JSON.stringify([wf, hf]), 'o rosto editado tem a mesma tela');
// outros rostos não foram afetados
ok(!!zip['laura/rosto_neutra.png'] && JSON.stringify(meta.encaixe.neutra) === JSON.stringify(original('laura', 'neutra').encaixe), 'os outros rostos seguem iguais');

// ---------------------------------------------------------------- quadros de animação
secao('quadros de animação');
ok(await p.locator('[data-espaco="pose_correr_1"]').count() === 1 && await p.locator('[data-espaco="pose_correr_2"]').count() === 1, 'a animação correr aparece quadro a quadro');
ok(await p.locator('[data-espaco="pose_correr"]').count() === 0, 'não aparece um "correr" solto');
await abrirEditorDe('pose_correr_2');
const q2 = manifesto.laura.sprites.find((s) => s.tags[0] === 'correr' && s.variante === 2);
ok(JSON.stringify(await dims()) === JSON.stringify([q2.w, q2.h]), 'o quadro 2 abre com o tamanho certo');
await ferramenta('pincel'); await def('cor', '#00aa00'); await def('tamanho', 5);
await arrastar([[10, 10], [30, 10]]);
await salvarEFechar();
zip = await exportarZip('z3.zip');
ok(!!zip['laura/pose_correr_1.png'] && !!zip['laura/pose_correr_2.png'] && !zip['laura/pose_correr.png'], 'continuam dois quadros (nenhum sprite "correr" extra)');

// ---------------------------------------------------------------- ferramentas em casos de borda
secao('casos de borda das ferramentas');
await abrirEditorDe('rosto_triste');
await M((m) => m.tamanhoDaTela(400, 400));
// 1. desfazer enquanto há algo solto cancela o movimento
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 24); await def('dureza', 100);
await arrastar([[100, 100], [100, 100]]);
await ferramenta('mover'); await arrastar([[100, 100], [220, 180]]);
ok(await M((m) => m.ui.flutuante) && (await pixel(100, 100))[3] === 0, 'enquanto solto, o item sai do lugar de origem');
await p.keyboard.press('Control+z');
ok(!(await M((m) => m.ui.flutuante)) && (await pixel(100, 100))[0] > 200 && (await pixel(220, 180))[3] === 0, 'Ctrl+Z com item solto devolve tudo ao lugar');
// 2. borracha só dentro da seleção
await limpar();
await ferramenta('pincel'); await def('tamanho', 30);
await arrastar([[60, 60], [300, 60]]);
await ferramenta('selRet'); await arrastar([[20, 20], [120, 100]]);
await ferramenta('borracha'); await def('tamanho', 60);
await arrastar([[20, 60], [300, 60]]);
ok((await pixel(80, 60))[3] === 0 && (await pixel(250, 60))[3] > 200, 'a borracha respeita a seleção');
// 3. formas respeitam a seleção
await limpar();
await ferramenta('selRet'); await arrastar([[100, 100], [200, 200]]);
await ferramenta('retangulo'); await def('formaPreenchida', true); await def('cor', '#aa00aa');
await arrastar([[50, 50], [300, 300]]);
ok((await pixel(150, 150))[3] === 255 && (await pixel(60, 60))[3] === 0 && (await pixel(250, 250))[3] === 0, 'formas só aparecem dentro da seleção');
// 4. balde: olhar todas as camadas
await limpar(); await M((m) => m.desselecionar());
await ferramenta('retangulo'); await def('formaPreenchida', false); await def('tamanho', 4); await def('cor', '#000000');
await M((m) => m.novaCamada()); // o contorno vai para a camada de cima
await arrastar([[100, 100], [250, 250]]);
await M((m) => m.escolherCamada(1)); // camada de baixo
await ferramenta('balde'); await def('cor', '#ffaa00'); await def('amostrarTudo', false); await def('tolerancia', 10);
const t1 = await tela(170, 170); await p.mouse.click(t1.x, t1.y);
ok((await pixel(20, 20))[3] > 0, 'balde olhando só a camada vazia vaza pela tela toda');
await p.keyboard.press('Control+z');
await def('amostrarTudo', true);
await p.mouse.click(t1.x, t1.y);
ok((await pixel(20, 20))[3] === 0 && (await pixel(170, 170))[3] > 0, 'balde olhando todas as camadas respeita o contorno da camada de cima');
// 5. tamanhos extremos
await limpar();
await M((m) => m.tamanhoDaImagem(5000, 5000));
ok((await dims()).every((v) => v === 2048), 'redimensionar acima do limite é cortado em 2048');
await M((m) => m.tamanhoDaImagem(1, 1));
ok(JSON.stringify(await dims()) === '[1,1]', 'redimensionar para 1×1 funciona');
await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z');
await M((m) => m.tamanhoDaTela(400, 400));
// 6. colar uma imagem enorme pelo evento de colar do sistema
const colou = await p.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 2000; c.height = 1000; const x = c.getContext('2d'); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, 2000, 1000);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([blob], 'grande.png', { type: 'image/png' }));
  document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise((r) => setTimeout(r, 500));
  const m = window.__motorEditor;
  return { flut: m.ui.flutuante, w: m.flut?.fonte.w, h: m.flut?.fonte.h, dw: m.doc.w, dh: m.doc.h };
});
ok(colou.flut && colou.w <= colou.dw && colou.h <= colou.dh, `imagem colada maior que a tela é reduzida para caber (${colou.w}×${colou.h} em ${colou.dw}×${colou.dh})`);
await p.keyboard.press('Enter');
ok(await contar() > 1000, 'a imagem colada entra na camada ao confirmar');
// 7. atalhos de ferramenta e de tamanho
await p.keyboard.press('e'); ok(await M((m) => m.ui.ferramenta) === 'borracha', 'tecla E = borracha');
await p.keyboard.press('g'); ok(await M((m) => m.ui.ferramenta) === 'balde', 'tecla G = balde');
await p.keyboard.press('b'); await def('tamanho', 20); await p.keyboard.press(']');
ok(await M((m) => m.ui.tamanho) > 20, 'tecla ] aumenta o pincel');
await p.keyboard.press('['); await p.keyboard.press('[');
ok(await M((m) => m.ui.tamanho) < 24, 'tecla [ diminui o pincel');
// 8. renomear camada por duplo clique
await EI.locator('.ei-camadas .nome').first().dblclick();
await EI.locator('.ei-camadas input').fill('Contorno');
await p.keyboard.press('Enter');
ok(await M((m) => m.ui.camadas[0].nome) === 'Contorno', 'duplo clique renomeia a camada');
// 9. ocultar pelo olho
await EI.locator('.ei-camadas .olho').first().click();
ok(await M((m) => m.doc.camadas[m.doc.camadas.length - 1].visivel) === false, 'o olho oculta a camada');
// 10. rajada de desfazer e refazer
const n0 = await contar();
for (let i = 0; i < 60; i++) await p.keyboard.press('Control+z');
for (let i = 0; i < 60; i++) await p.keyboard.press('Control+y');
ok((await contar()) === n0, 'desfazer 60× e refazer 60× volta exatamente ao mesmo estado');
await p.screenshot({ path: `${dest}/11-casos-de-borda.png` });
// Esc cancela o item solto, depois tira a seleção e só então fecha o editor (pedindo confirmação, aceita pelo teste)
for (let i = 0; i < 4 && (await p.locator('.ei').count()); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
ok(await p.locator('.ei').count() === 0, 'Esc (até 3 vezes) cancela, desseleciona e fecha o editor');

// ---------------------------------------------------------------- tela de tablet em pé
secao('tablet em pé');
await abrirApp('?ator=laura&teste=1', { width: 820, height: 1180 });
await p.getByText('Editar / exportar sprites de Laura').click();
await p.locator('[data-espaco="rosto_brava"]').click();
await p.waitForFunction(() => !!window.__motorEditor, null, { timeout: 20000 });
await p.waitForTimeout(600);
const lay = await p.evaluate(() => { const e = document.querySelector('.ei').getBoundingClientRect(), c = document.querySelector('[data-testid="ei-canvas"]').getBoundingClientRect(), pn = document.querySelector('.ei-painel').getBoundingClientRect(); return { ei: [e.width, e.height], canvas: [c.width, c.height], painel: [pn.width, pn.height], rolagemX: document.documentElement.scrollWidth > innerWidth + 1 }; });
ok(lay.canvas[0] > 300 && lay.canvas[1] > 300, `o desenho ocupa a tela no tablet (${lay.canvas.map(Math.round)})`);
ok(!lay.rolagemX, 'sem rolagem horizontal da página');
ok(lay.painel[0] > 700, 'o painel passa para baixo e usa a largura toda');
await p.screenshot({ path: `${dest}/12-tablet-em-pe.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(300);

console.log('\n---------------------------------');
console.log(`passaram: ${passou.length}   falharam: ${falhas.length}`);
if (erros.length) console.log('erros da página:', erros.slice(0, 5));
await b.close();
if (falhas.length || erros.length) { console.log('FALHAS:', falhas); process.exit(1); }

