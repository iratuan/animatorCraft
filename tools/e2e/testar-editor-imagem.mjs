// Bateria de testes do editor de imagem (abra com `npm run dev:web` rodando).  node tools/e2e/testar-editor-imagem.mjs
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const dest = 'evidencias/32-editor-de-imagem';
mkdirSync(dest, { recursive: true });
const falhas = [], passou = [];
const ok = (cond, msg) => { (cond ? passou : falhas).push(msg); if (!cond) console.log('  ✗', msg); };
const secao = (t) => console.log(`\n== ${t}`);

const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
p.on('dialog', (d) => d.accept());

// ---------------------------------------------------------------- ajudantes
const M = (fn, ...a) => p.evaluate(([f, args]) => { const m = window.__motorEditor; return new Function('m', 'args', `return (${f})(m, ...args)`)(m, args); }, [fn.toString(), a]);
const pixel = (x, y) => M((m, x, y) => { const c = m.achatar(), i = (y * c.w + x) * 4; return [c.data[i], c.data[i + 1], c.data[i + 2], c.data[i + 3]]; }, x, y);
const contar = () => M((m) => { const c = m.achatar(); let n = 0; for (let i = 3; i < c.data.length; i += 4) if (c.data[i] > 0) n++; return n; });
const dims = () => M((m) => [m.doc.w, m.doc.h]);
const tela = (x, y) => M((m, x, y) => { const s = m.paraTela(x, y), r = m.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, x, y);
const ferramenta = (t) => M((m, t) => m.definir('ferramenta', t), t);
const def = (k, v) => M((m, k, v) => m.definir(k, v), k, v);
const arrastar = async (pts, passos = 6) => {
  const a = await tela(pts[0][0], pts[0][1]);
  await p.mouse.move(a.x, a.y); await p.mouse.down();
  for (const [x, y] of pts.slice(1)) { const t = await tela(x, y); await p.mouse.move(t.x, t.y, { steps: passos }); }
  await p.mouse.up();
};
const clicar = async (x, y, opc) => { const t = await tela(x, y); await p.mouse.click(t.x, t.y, opc); };
const EI = p.locator('.ei');
const limpar = () => M((m) => { m.confirmarFlutuante(); while (m.doc.camadas.length > 1) m.excluirCamada(); m.doc.ativa = 0; m.definir('ferramenta', 'selRet'); m.selecionarTudo(); m.apagarConteudo(); m.desselecionar(); });
const aproxima = (a, b, tol = 3) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

// ---------------------------------------------------------------- abre o app e o editor num espaço vazio
secao('abrir o editor');
const roteiroAntes = () => p.evaluate(() => document.querySelector('#campo-roteiro')?.value ?? null);
await p.goto('http://127.0.0.1:5173/');
await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/?ator=laura&teste=1');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Editar / exportar sprites de Laura').click();
await p.waitForTimeout(400);
ok(await p.locator('.espaco-png').count() > 10, 'cada espaço tem botão PNG além do editor');
const roteiro0 = await roteiroAntes();
await p.locator('[data-espaco="rosto_brava"]').click();
await p.waitForFunction(() => !!window.__motorEditor, null, { timeout: 15000 });
await p.waitForTimeout(500);
const [W0, H0] = await dims();
await M((m) => m.tamanhoDaTela(400, 400));
await p.waitForTimeout(200);
ok(W0 > 50 && H0 > 50, `tela criada com o tamanho do rosto neutro (${W0}×${H0})`);
ok(await contar() === 0, 'espaço vazio começa transparente');
await p.screenshot({ path: `${dest}/01-editor-aberto.png` });
const centrado = () => M((m) => { const c = m.canvas.getBoundingClientRect(), a = m.paraTela(0, 0), b = m.paraTela(m.doc.w, m.doc.h); return [Math.round((a.x + b.x) / 2 - c.width / 2), Math.round((a.y + b.y) / 2 - c.height / 2)]; });
const cen0 = await centrado();
ok(Math.abs(cen0[0]) <= 2 && Math.abs(cen0[1]) <= 2, `a imagem abre centralizada na área de desenho (desvio ${cen0})`);
await p.setViewportSize({ width: 1200, height: 800 }); await p.waitForTimeout(400);
const cen1 = await centrado();
ok(Math.abs(cen1[0]) <= 2 && Math.abs(cen1[1]) <= 2, `continua centralizada depois de redimensionar a janela (desvio ${cen1})`);
await p.setViewportSize({ width: 1600, height: 950 }); await p.waitForTimeout(400);

// ---------------------------------------------------------------- pincel
secao('pincel, lápis e borracha');
await def('cor', '#ff0000'); await def('tamanho', 12); await def('dureza', 100); await def('opacidade', 100);
await ferramenta('pincel');
await arrastar([[30, 40], [120, 40]]);
ok(aproxima(await pixel(70, 40), [255, 0, 0, 255], 2), 'pincel pinta vermelho no traço');
ok((await pixel(70, 60))[3] === 0, 'fora do traço continua transparente');
await def('opacidade', 50);
await arrastar([[30, 80], [120, 80]]);
const meio = await pixel(70, 80);
ok(Math.abs(meio[3] - 127.5) < 3, `opacidade 50% (alfa ${meio[3]})`);
await def('opacidade', 100);
await ferramenta('lapis'); await def('cor', '#0000ff'); await def('tamanho', 5);
await arrastar([[30, 110], [120, 130]]);
const alfas = await M((m) => { const c = m.achatar(); const s = new Set(); for (let y = 105; y < 140; y++) for (let x = 25; x < 125; x++) { const a = c.data[(y * c.w + x) * 4 + 3]; if (a) s.add(a); } return [...s]; });
ok(alfas.length === 1 && alfas[0] === 255, 'lápis não tem meios-tons');
await ferramenta('borracha'); await def('tamanho', 16);
await arrastar([[60, 30], [60, 50]]);
ok((await pixel(60, 40))[3] === 0, 'borracha apaga o traço');
ok(aproxima(await pixel(100, 40), [255, 0, 0, 255], 2), 'borracha não apaga fora do passe');
await p.screenshot({ path: `${dest}/02-pincel-lapis-borracha.png` });

// ---------------------------------------------------------------- desfazer e refazer
secao('desfazer e refazer');
const antes = await contar();
await ferramenta('pincel'); await def('cor', '#00aa00'); await def('tamanho', 20);
await arrastar([[40, 160], [120, 160]]);
const depois = await contar();
ok(depois > antes, 'pintou mais um traço');
await p.keyboard.press('Control+z');
ok(await contar() === antes, 'Ctrl+Z desfaz o traço');
await p.keyboard.press('Control+y');
ok(await contar() === depois, 'Ctrl+Y refaz o traço');
await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z');
ok((await pixel(60, 40))[3] > 0, 'desfazer a borracha traz de volta o traço (ainda sem a borracha)');
for (let i = 0; i < 12; i++) await p.keyboard.press('Control+z');
ok(await contar() === 0, 'desfazer tudo volta ao começo (transparente)');
for (let i = 0; i < 12; i++) await p.keyboard.press('Control+y');
ok(await contar() === depois, 'refazer tudo volta ao fim');

// ---------------------------------------------------------------- camadas
secao('camadas');
const nCam = () => M((m) => m.doc.camadas.length);
await EI.getByRole('button', { name: /Nova/ }).click();
ok(await nCam() === 2, 'nova camada');
await ferramenta('pincel'); await def('cor', '#8800ff'); await def('tamanho', 14);
await arrastar([[40, 200], [120, 200]]);
ok((await pixel(80, 200))[2] === 255, 'desenha na camada nova');
await M((m) => m.alternarVisivel(0)); // a de cima
ok((await pixel(80, 200))[3] === 0, 'ocultar a camada some com o desenho');
await arrastar([[40, 220], [120, 220]]);
ok((await pixel(80, 220))[3] === 0, 'desenhar em camada oculta não desenha (e avisa)');
await M((m) => m.alternarVisivel(0));
await M((m) => m.opacidadeDaCamada(0, 0.5, true));
ok(Math.abs((await pixel(80, 200))[3] - 127.5) < 3, 'opacidade da camada 50%');
await M((m) => m.opacidadeDaCamada(0, 1, true));
await EI.getByRole('button', { name: 'Duplicar' }).click();
ok(await nCam() === 3, 'duplicar camada');
await EI.getByRole('button', { name: /Subir/ }).click();
ok(await M((m) => m.doc.ativa) === 2, 'subir camada muda a ordem');
await EI.getByRole('button', { name: /Descer/ }).click();
await EI.getByRole('button', { name: /Mesclar/ }).click();
ok(await nCam() === 2, 'mesclar abaixo');
await EI.getByRole('button', { name: 'Excluir', exact: true }).first().click();
ok(await nCam() === 1, 'excluir camada');
await EI.getByRole('button', { name: 'Excluir', exact: true }).first().click();
ok(await nCam() === 1, 'a última camada não pode ser excluída');
await p.keyboard.press('Control+z');
ok(await nCam() === 2, 'desfazer a exclusão da camada');
await p.keyboard.press('Control+z');
ok(await nCam() === 3, 'desfazer a mesclagem de camadas');
await p.screenshot({ path: `${dest}/03-camadas.png` });

// ---------------------------------------------------------------- formas e balde
secao('formas e balde de tinta');
await limpar();
await ferramenta('retangulo'); await def('cor', '#000000'); await def('tamanho', 4); await def('formaPreenchida', false);
await arrastar([[40, 40], [140, 120]]);
ok((await pixel(90, 40))[3] === 255, 'retângulo: contorno desenhado');
ok((await pixel(90, 80))[3] === 0, 'retângulo: interior vazio');
await ferramenta('balde'); await def('cor', '#ffcc00'); await def('tolerancia', 20); await def('contiguo', true);
await clicar(90, 80);
ok(aproxima(await pixel(90, 80), [255, 204, 0, 255], 2), 'balde preenche o interior');
ok((await pixel(20, 20))[3] === 0, 'balde não vaza para fora do contorno');
await ferramenta('elipse'); await def('formaPreenchida', true); await def('cor', '#22aa44');
await arrastar([[160, 40], [240, 120]]);
ok(aproxima(await pixel(200, 80), [34, 170, 68, 255], 2), 'elipse preenchida');
await ferramenta('linha'); await def('cor', '#aa0000'); await def('tamanho', 3);
await arrastar([[40, 150], [140, 150]]);
ok((await pixel(90, 150))[0] > 150, 'linha desenhada');
// shift: círculo perfeito
await ferramenta('elipse'); await def('formaPreenchida', false);
await p.keyboard.down('Shift');
await arrastar([[160, 140], [230, 170]]);
await p.keyboard.up('Shift');
const caixa = await M((m) => { const c = m.achatar(); let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 135; y < 220; y++) for (let x = 155; x < 260; x++) if (c.data[(y * c.w + x) * 4 + 3] > 0 && c.data[(y * c.w + x) * 4] > 100 && c.data[(y * c.w + x) * 4 + 1] < 50) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x1 - x0, y1 - y0]; });
ok(Math.abs(caixa[0] - caixa[1]) <= 3 && caixa[0] > 30, `Shift faz círculo perfeito (${caixa[0]}×${caixa[1]})`);
await p.screenshot({ path: `${dest}/04-formas-balde.png` });

// ---------------------------------------------------------------- seleção
secao('seleção');
await limpar();
ok(await contar() === 0, 'limpou a tela');
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 30); await def('dureza', 100);
await arrastar([[60, 60], [60, 60]]); // ponto à esquerda
await arrastar([[200, 60], [200, 60]]); // ponto à direita
await ferramenta('selRet');
await arrastar([[20, 20], [120, 100]]);
ok(await M((m) => m.ui.temSelecao), 'seleção retangular criada');
await ferramenta('pincel'); await def('cor', '#0000ff'); await def('tamanho', 40);
await arrastar([[10, 60], [260, 60]]);
const esq = await pixel(100, 60), dir = await pixel(200, 60);
ok(esq[2] > 200 && esq[0] < 60, 'dentro da seleção o pincel pinta');
ok(dir[0] > 200 && dir[2] < 60, 'fora da seleção o pincel não pinta');
await p.keyboard.press('Delete');
ok((await pixel(60, 60))[3] === 0 && (await pixel(200, 60))[3] > 0, 'Delete apaga só a seleção');
await p.keyboard.press('Control+z');
ok((await pixel(60, 60))[3] > 0, 'desfazer o Delete');
await p.keyboard.press('Control+d');
ok(!(await M((m) => m.ui.temSelecao)), 'Ctrl+D tira a seleção');
await M((m) => { m.definir('ferramenta', 'selElipse'); });
await arrastar([[30, 30], [100, 90]]);
ok(await M((m) => m.ui.temSelecao), 'seleção elíptica');
await M((m) => m.inverterSelecao());
const invertida = await M((m) => { const s = m.doc.selecao; return [s.data[60 * s.w + 60], s.data[5 * s.w + 5]]; });
ok(invertida[0] === 0 && invertida[1] === 255, 'inverter seleção');
await M((m) => m.desselecionar());
await ferramenta('laco');
await arrastar([[150, 30], [230, 40], [220, 110], [150, 100], [150, 30]], 3);
ok(await M((m) => m.ui.temSelecao), 'laço cria seleção');
await M((m) => m.desselecionar());
await ferramenta('varinha'); await def('tolerancia', 20);
await clicar(60, 60);
const bb = await M((m) => { const s = m.doc.selecao; if (!s) return null; let n = 0; for (const v of s.data) if (v) n++; return n; });
ok(bb > 500, `varinha mágica seleciona o ponto vermelho (${bb}px)`);
await M((m) => m.desselecionar());
await p.screenshot({ path: `${dest}/05-selecao.png` });

// ---------------------------------------------------------------- mover, copiar, colar e transformar
secao('mover, copiar e transformar');
await limpar();
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 30);
await arrastar([[60, 60], [60, 60]]);
await ferramenta('selRet'); await arrastar([[30, 30], [90, 90]]);
await ferramenta('mover');
await arrastar([[60, 60], [160, 100]], 8);
await p.keyboard.press('Enter');
ok((await pixel(160, 100))[0] > 200, 'mover leva o conteúdo da seleção para o novo lugar');
ok((await pixel(60, 60))[3] === 0, 'o lugar antigo fica vazio');
await p.keyboard.press('Control+z');
ok((await pixel(60, 60))[3] > 0 && (await pixel(160, 100))[3] === 0, 'desfazer o movimento');
// mover a camada inteira (sem seleção)
await M((m) => m.desselecionar());
await ferramenta('mover'); await arrastar([[60, 60], [100, 60]]); await p.keyboard.press('Enter');
ok((await pixel(100, 60))[3] > 0, 'sem seleção, mover leva o conteúdo da camada');
await p.keyboard.press('Control+z');
// copiar e colar
await M((m) => m.desselecionar());
await ferramenta('selRet'); await arrastar([[30, 30], [90, 90]]);
await p.keyboard.press('Control+c');
await p.keyboard.press('Control+v');
await p.waitForTimeout(200);
ok(await M((m) => m.ui.flutuante), 'colar cria um item solto');
await ferramenta('mover');
await M((m) => m.confirmarFlutuante());
await p.keyboard.press('Control+z');
// transformar: escala e rotação por alças
await limpar();
await ferramenta('pincel'); await def('tamanho', 20); await def('cor', '#ff0000');
await arrastar([[100, 100], [100, 100]]);
await ferramenta('mover');
await arrastar([[100, 100], [100, 100]], 2); // levanta
const cantos = await M((m) => { m.ui.flutuante; const c = m.cantosFlutuante(); const r = m.canvas.getBoundingClientRect(); return c.map((q) => ({ x: r.left + q.x, y: r.top + q.y })); });
await p.mouse.move(cantos[3].x, cantos[3].y); await p.mouse.down(); await p.mouse.move(cantos[3].x + 40, cantos[3].y + 40, { steps: 6 }); await p.mouse.up();
const escalas = await M((m) => [m.flut.sx, m.flut.sy]);
ok(escalas[0] > 1.5 && escalas[1] > 1.5, `alça de canto aumenta o item (${escalas.map((v) => v.toFixed(2))})`);
const rot = await M((m) => { const r = m.posRotacao(), b = m.canvas.getBoundingClientRect(); return { x: b.left + r.x, y: b.top + r.y }; });
await p.mouse.move(rot.x, rot.y); await p.mouse.down(); await p.mouse.move(rot.x + 80, rot.y + 20, { steps: 6 }); await p.mouse.up();
ok(Math.abs(await M((m) => m.flut.rot)) > 0.2, 'alça de rotação gira o item');
await p.screenshot({ path: `${dest}/06-transformando.png` });
await p.keyboard.press('Enter');
ok(!(await M((m) => m.ui.flutuante)) && await contar() > 500, 'Enter confirma e cola o item transformado');
await p.keyboard.press('Control+z');

// ---------------------------------------------------------------- conta-gotas, texto e zoom
secao('conta-gotas, texto, zoom e mover a tela');
await ferramenta('conta'); await def('cor', '#000000');
await clicar(100, 100);
ok(await M((m) => m.ui.cor) === '#ff0000', 'conta-gotas pega a cor do pixel');
await ferramenta('pincel'); await def('cor', '#123456');
await p.keyboard.down('Alt'); await clicar(100, 100); await p.keyboard.up('Alt');
ok(await M((m) => m.ui.cor) === '#ff0000', 'Alt + clique com o pincel também pega a cor');
await ferramenta('texto'); await clicar(150, 200);
await p.locator('.ei-texto textarea').fill('Oi');
await EI.getByRole('button', { name: 'Inserir' }).click();
ok(await M((m) => m.ui.flutuante), 'texto vira item solto');
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
ok(await M((m) => { const c = m.achatar(); let n = 0; for (let y = 180; y < 230; y++) for (let x = 120; x < 200; x++) if (c.data[(y * c.w + x) * 4 + 3] > 0) n++; return n; }) > 50, 'o texto aparece na imagem');
const z0 = await M((m) => m.ui.zoom);
const centro = await tela(100, 100);
await p.mouse.move(centro.x, centro.y); await p.mouse.wheel(0, -400);
await p.waitForTimeout(100);
ok(await M((m) => m.ui.zoom) > z0 * 1.4, 'a roda do mouse dá zoom');
await p.keyboard.press('Control+d'); // depois de confirmar o texto a seleção continua nele
await M((m) => m.definir('ferramenta', 'pincel'));
await def('tamanho', 4); await def('cor', '#00ffff');
await arrastar([[110, 120], [125, 120]]);
ok((await pixel(118, 120))[1] === 255, 'desenha no ponto certo mesmo com zoom');
const o0 = await M((m) => [m.ox, m.oy]);
await p.keyboard.down('Space');
await p.mouse.move(500, 400); await p.mouse.down(); await p.mouse.move(560, 440, { steps: 4 }); await p.mouse.up();
await p.keyboard.up('Space');
const ph1 = await p.evaluate(() => document.querySelector('.playhead')?.style.left); await p.waitForTimeout(700); const ph2 = await p.evaluate(() => document.querySelector('.playhead')?.style.left);
ok(ph1 === ph2, 'a barra de espaço do editor não dispara a reprodução da animação');
const o1 = await M((m) => [m.ox, m.oy]);
ok(Math.abs(o1[0] - o0[0] - 60) < 2 && Math.abs(o1[1] - o0[1] - 40) < 2, 'Espaço + arrastar move a tela');
await p.keyboard.press('Control+0');
await p.screenshot({ path: `${dest}/07-texto-e-zoom.png` });

// ---------------------------------------------------------------- imagem inteira
secao('espelhar, girar, redimensionar e cortar');
await limpar();
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 10);
await arrastar([[20, 20], [20, 20]]);
const [w1, h1] = await dims();
await EI.getByRole('button', { name: 'Espelhar ↔' }).click();
ok((await pixel(w1 - 21, 20))[0] > 200 && (await pixel(20, 20))[3] === 0, 'espelhar na horizontal');
await EI.getByRole('button', { name: 'Espelhar ↕' }).click();
ok((await pixel(w1 - 21, h1 - 21))[0] > 200, 'espelhar na vertical');
await EI.getByRole('button', { name: '↻ 90°' }).click();
const [w2, h2] = await dims();
ok(w2 === h1 && h2 === w1, 'girar 90° troca largura e altura');
await EI.getByRole('button', { name: '↺ 90°' }).click();
await EI.getByTitle('Remove as bordas transparentes').click();
const [w3, h3] = await dims();
ok(w3 <= 12 && h3 <= 12 && w3 >= 8, `cortar ao conteúdo (${w3}×${h3})`);
await p.keyboard.press('Control+z');
ok((await dims())[0] === w1, 'desfazer o corte volta o tamanho');
await p.locator('input[aria-label="Largura"]').fill('120'); await p.locator('input[aria-label="Altura"]').fill('90');
await EI.getByRole('button', { name: 'Redimensionar' }).click();
ok(JSON.stringify(await dims()) === '[120,90]', 'redimensionar a imagem');
await p.locator('input[aria-label="Largura"]').fill('300'); await p.locator('input[aria-label="Altura"]').fill('300');
await EI.getByRole('button', { name: 'Tela', exact: true }).click();
ok(JSON.stringify(await dims()) === '[300,300]', 'mudar o tamanho da tela');

// ---------------------------------------------------------------- toque e caneta
secao('toque e caneta');
await limpar(); await M((m) => m.ajustarNaTela());
await ferramenta('pincel'); await def('cor', '#ff00ff'); await def('tamanho', 20); await def('dureza', 100);
const disparar = (tipo, id, x, y, extra = {}) => p.evaluate(([t, i, xx, yy, ex]) => { const c = document.querySelector('[data-testid="ei-canvas"]'); c.dispatchEvent(new PointerEvent(t, { pointerId: i, pointerType: ex.tipo ?? 'touch', clientX: xx, clientY: yy, bubbles: true, isPrimary: true, button: 0, pressure: ex.pressao ?? 0.5 })); }, [tipo, id, x, y, extra]);
let a = await tela(50, 50), c2 = await tela(150, 50);
await disparar('pointerdown', 1, a.x, a.y); await disparar('pointermove', 1, (a.x + c2.x) / 2, a.y); await disparar('pointermove', 1, c2.x, c2.y); await disparar('pointerup', 1, c2.x, c2.y);
ok((await pixel(100, 50))[3] > 200, 'um dedo desenha');
const antesToque = await contar(), zoomAntes = await M((m) => m.ui.zoom);
const d1 = await tela(80, 150), d2 = await tela(120, 150);
await disparar('pointerdown', 11, d1.x, d1.y); await disparar('pointerdown', 12, d2.x, d2.y);
await disparar('pointermove', 11, d1.x - 40, d1.y); await disparar('pointermove', 12, d2.x + 40, d2.y);
await disparar('pointerup', 11, d1.x - 40, d1.y); await disparar('pointerup', 12, d2.x + 40, d2.y);
ok(await M((m) => m.ui.zoom) > zoomAntes * 1.3, 'dois dedos fazem zoom (pinça)');
ok(await contar() === antesToque, 'dois dedos não desenham');
await M((m) => m.ajustarNaTela());
a = await tela(50, 200); c2 = await tela(150, 200);
await disparar('pointerdown', 21, a.x, a.y, { tipo: 'pen', pressao: 0.15 }); await disparar('pointermove', 21, c2.x, c2.y, { tipo: 'pen', pressao: 0.15 }); await disparar('pointerup', 21, c2.x, c2.y, { tipo: 'pen', pressao: 0.15 });
const finoPx = await M((m) => { const c = m.achatar(); let n = 0; for (let y = 150; y < 250; y++) if (c.data[(y * c.w + 100) * 4 + 3] > 128) n++; return n; });
const b2 = await tela(50, 260), b3 = await tela(150, 260);
await disparar('pointerdown', 22, b2.x, b2.y, { tipo: 'pen', pressao: 1 }); await disparar('pointermove', 22, b3.x, b3.y, { tipo: 'pen', pressao: 1 }); await disparar('pointerup', 22, b3.x, b3.y, { tipo: 'pen', pressao: 1 });
const grossoPx = await M((m) => { const c = m.achatar(); let n = 0; for (let y = 240; y < 300; y++) if (c.data[(y * c.w + 100) * 4 + 3] > 128) n++; return n; });
ok(grossoPx > finoPx * 2, `a pressão da caneta muda a espessura (${finoPx}px → ${grossoPx}px)`);

// ---------------------------------------------------------------- abrir imagem como camada e área de transferência
secao('abrir imagem como camada');
const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 80; c.height = 60; const x = c.getContext('2d'); x.fillStyle = '#33aa33'; x.fillRect(0, 0, 80, 60); return c.toDataURL('image/png').split(',')[1]; });
writeFileSync(`${dest}/verde.png`, Buffer.from(png, 'base64'));
const camadasAntes = await nCam();
await p.locator('.ei input[type=file]').setInputFiles(`${dest}/verde.png`);
await p.waitForTimeout(400);
ok(await nCam() === camadasAntes + 1, 'a imagem entra como camada nova');
const [w4, h4] = await dims();
ok(aproxima(await pixel(Math.floor(w4 / 2), Math.floor(h4 / 2)), [51, 170, 51, 255], 2), 'a imagem fica centralizada');

// ---------------------------------------------------------------- salvar no sprite e reabrir
ok(roteiro0 !== null && (await roteiroAntes()) === roteiro0, 'Ctrl+Z / Ctrl+Y do editor não mexem no roteiro');
secao('salvar no sprite');
await limpar();
await M((m, w, h) => { while (m.doc.camadas.length > 1) m.excluirCamada(); m.tamanhoDaTela(w, h); }, W0, H0);
await ferramenta('pincel'); await def('cor', '#ff3300'); await def('tamanho', 18); await def('dureza', 60);
await arrastar([[40, 60], [100, 60], [100, 120]]);
const esperado = await M((m) => { const c = m.achatar(); return { w: c.w, h: c.h, n: (() => { let n = 0; for (let i = 3; i < c.data.length; i += 4) if (c.data[i] > 0) n++; return n; })() }; });
await p.screenshot({ path: `${dest}/08-antes-de-salvar.png` });
await EI.getByRole('button', { name: 'Salvar no sprite' }).click();
await p.waitForSelector('[data-testid="ei-canvas"]', { state: 'detached', timeout: 15000 });
ok(true, 'o editor fecha ao salvar');
await p.waitForTimeout(600);
ok(await p.locator('[data-espaco="rosto_brava"]').evaluate((e) => !e.classList.contains('vazio')), 'o espaço deixa de estar vazio');
console.log('  mutações do DOM em 1,5 s:', JSON.stringify(await p.evaluate(() => new Promise((ok) => { const m = {}; const o = new MutationObserver((l) => l.forEach((r) => { const k = `${r.type}:${(r.target.className || r.target.nodeName).toString().slice(0, 30)}`; m[k] = (m[k] ?? 0) + 1; })); o.observe(document.body, { subtree: true, childList: true, attributes: true }); setTimeout(() => { o.disconnect(); ok(m); }, 1500); }))));
await p.locator('[data-espaco="rosto_brava"]').click({ timeout: 6000 }).catch(async (e) => { console.log('  ! clique falhou:', String(e).split('\n')[0]); console.log('  ', JSON.stringify(await p.evaluate(() => ({ editor: !!document.querySelector('.ei'), modais: document.querySelectorAll('.modal').length, rodape: document.querySelector('.ei-rodape')?.innerText, msg: [...document.querySelectorAll('footer,.barra-status')].map((x) => x.innerText).join('|') })))); await p.screenshot({ path: `${dest}/falha-clique.png` }); });
await p.waitForFunction(() => !!window.__motorEditor && window.__motorEditor.doc.camadas[0].pixels.data.some((v, i) => i % 4 === 3 && v > 0), null, { timeout: 20000 });
const relido = await M((m) => { const c = m.achatar(); let n = 0; for (let i = 3; i < c.data.length; i += 4) if (c.data[i] > 0) n++; return { w: c.w, h: c.h, n }; });
ok(relido.w === esperado.w && relido.h === esperado.h, `reabrir mantém as dimensões (${relido.w}×${relido.h})`);
ok(Math.abs(relido.n - esperado.n) <= esperado.n * 0.02, `reabrir mantém o desenho (${relido.n} vs ${esperado.n} px)`);
await EI.getByRole('button', { name: 'Original' }).click();
ok(await M((m) => m.ui.mostrarOriginal), 'alterna a sobreposição do original');
await def('cor', '#000000');
await EI.getByRole('button', { name: 'Cancelar' }).click(); // há alteração? (nenhuma: fecha direto)
await p.waitForTimeout(300);

// ---------------------------------------------------------------- editar um sprite existente (guias, encaixe, palco)
secao('editar um sprite existente');
await p.locator('[data-espaco="rosto_feliz"]').click();
await p.waitForFunction(() => !!window.__motorEditor, null, { timeout: 15000 });
await p.waitForTimeout(600);
const guiaCorpo = await M((m) => !!m.guias.corpo);
ok(guiaCorpo, 'rosto existente mostra o corpo de apoio (encaixe)');
const dimFeliz = await dims();
await ferramenta('pincel'); await def('cor', '#ff0000'); await def('tamanho', 10);
await arrastar([[dimFeliz[0] / 2 - 10, dimFeliz[1] / 2 + 30], [dimFeliz[0] / 2 + 10, dimFeliz[1] / 2 + 30]]);
await p.screenshot({ path: `${dest}/09-rosto-existente.png` });
await EI.getByRole('button', { name: 'Salvar no sprite' }).click();
await p.waitForSelector('[data-testid="ei-canvas"]', { state: 'detached', timeout: 15000 });
await p.waitForTimeout(600);
const [dlz] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Exportar Laura/ }).click()]);
await dlz.saveAs(`${dest}/laura.zip`);
const meta = await p.evaluate(async () => null);
void meta;
await p.getByRole('button', { name: 'Fechar' }).click();
// no palco: a Laura com a expressão editada
await p.evaluate(() => localStorage.setItem('stickboard.roteiro.v2', '[papéis: professor=CringeFather, aluno=BetaSon]\n\n# T\nLaura entra pela esquerda andando.\nLaura faz cara de feliz.\n[close em Laura]'));
await p.goto('http://127.0.0.1:5173/?ator=laura&t=3');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${dest}/10-no-palco.png`, clip: await p.locator('.area-palco canvas').boundingBox() });

// ---------------------------------------------------------------- imagem grande e desempenho
secao('imagem grande e desempenho');
await p.goto('http://127.0.0.1:5173/?ator=laura&teste=1');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Editar / exportar sprites de Laura').click();
await p.locator('[data-espaco="rosto_triste"]').click();
await p.waitForFunction(() => !!window.__motorEditor, null, { timeout: 15000 });
await p.waitForTimeout(500);
const grande = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 3200; c.height = 2400; const x = c.getContext('2d'); x.fillStyle = '#3366cc'; x.fillRect(0, 0, 3200, 2400); return c.toDataURL('image/png').split(',')[1]; });
writeFileSync(`${dest}/grande.png`, Buffer.from(grande, 'base64'));
await p.locator('.ei input[type=file]').setInputFiles(`${dest}/grande.png`);
await p.waitForTimeout(800);
const [wg, hg] = await dims();
ok(wg < 3200 && (await pixel(Math.floor(wg / 2), Math.floor(hg / 2)))[3] === 255, 'imagem maior que a tela é reduzida para caber');
await M((m) => m.tamanhoDaTela(1800, 1800));
await ferramenta('pincel'); await def('tamanho', 60); await def('dureza', 50); await def('cor', '#ff0000');
const ini = await tela(300, 300);
const t0 = Date.now();
await p.mouse.move(ini.x, ini.y); await p.mouse.down();
for (let i = 0; i < 80; i++) await p.mouse.move(ini.x + i * 3, ini.y + Math.sin(i / 5) * 40);
await p.mouse.up();
const ms = Date.now() - t0;
ok(ms < 8000, `traço longo em tela 1800×1800 responde (${ms} ms para 80 movimentos)`);
await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z');

// ---------------------------------------------------------------- cancelar e descartar
secao('cancelar');
await M((m) => m.definir('ferramenta', 'pincel'));
await arrastar([[100, 100], [160, 160]]);
await EI.getByRole('button', { name: 'Cancelar' }).click();
await p.waitForTimeout(300);
ok(await p.locator('[data-testid="ei-canvas"]').count() === 0, 'cancelar (com confirmação) fecha sem salvar');
ok(await p.locator('[data-espaco="rosto_triste"]').evaluate((e) => e.classList.contains('vazio')), 'o espaço continua vazio (nada foi salvo)');

console.log('\n---------------------------------');
console.log(`passaram: ${passou.length}   falharam: ${falhas.length}`);
if (erros.length) console.log('erros da página:', erros.slice(0, 5));
await b.close();
if (falhas.length || erros.length) { console.log('FALHAS:', falhas); process.exit(1); }









