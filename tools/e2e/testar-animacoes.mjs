// Expressões novas e clipes por personagem: criar, prévia, salvar, usar no roteiro, estilos, persistência.
import { chromium } from 'playwright-core';
const dest = 'evidencias/35-expressoes-e-clipes';
let falhas = 0, passou = 0;
const ok = (c, m) => { if (c) passou++; else { falhas++; console.log('FALHOU:', m); } };
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const pronto = async () => { await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(500); };
await p.goto('http://127.0.0.1:5173/'); await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/?ator=betason'); await pronto();

// ---- expressão nova
await p.getByText('Expressões e clipes de BetaSon…').click();
await p.getByRole('button', { name: '＋ Nova expressão' }).click();
await p.getByLabel('Nome da expressão').fill('Apaixonada');
await p.getByLabel('Olhos do quadro 1').selectOption('grande');
await p.getByLabel('Boca do quadro 1').selectOption('sorriso');
await p.getByRole('button', { name: '＋ Quadro de animação' }).click();
await p.getByLabel('Boca do quadro 2').selectOption('o');
await p.waitForTimeout(900);
await p.screenshot({ path: `${dest}/01-nova-expressao.png` });
ok(await p.locator('.previa-animacao canvas').count() === 1, 'prévia da expressão aparece');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
ok((await p.locator('.msg-anim').innerText()).includes('apaixonada'), 'mensagem de expressão salva');
ok(await p.locator('.lista-anim li', { hasText: 'apaixonada' }).count() === 1, 'expressão aparece na lista');
// nome repetido ou padrão é recusado
await p.getByRole('button', { name: '＋ Nova expressão' }).click();
await p.getByLabel('Nome da expressão').fill('Feliz');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
ok((await p.locator('.msg-anim').innerText()).includes('já existe'), 'nome de expressão padrão é recusado');
await p.getByLabel('Nome da expressão').fill('Apaixonada');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
ok((await p.locator('.msg-anim').innerText()).includes('já existe'), 'nome repetido é recusado');
await p.getByRole('button', { name: 'Cancelar' }).click();
ok(await p.locator('.lista-anim li', { hasText: 'apaixonada' }).count() === 1, 'cancelar mantém a expressão salva');

// ---- clipe novo
await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe').fill('Tchau');
await p.getByLabel('Movimento do passo 1').selectOption('balancar');
await p.getByLabel('Pose do boneco no passo 1').selectOption('acenar');
await p.getByRole('button', { name: '＋ Passo' }).click();
await p.getByLabel('Movimento do passo 2').selectOption('pular');
ok(await p.getByLabel('Intensidade do passo 2').inputValue() === '1', 'intensidade relativa (1 = normal) ao trocar o movimento');
await p.getByLabel('Duração do passo 2').fill('0.8');
await p.getByLabel('Subir passo 2').click();
ok(await p.getByLabel('Movimento do passo 1').inputValue() === 'pular', 'subir passo troca a ordem');
await p.getByLabel('Descer passo 1').click();
await p.waitForTimeout(900);
await p.screenshot({ path: `${dest}/02-novo-clipe.png` });
await p.getByRole('button', { name: 'Salvar clipe' }).click();
ok(await p.locator('[data-clipe="tchau"]').count() === 1, 'clipe aparece na lista');
await p.locator('[data-clipe="tchau"]').getByRole('button', { name: 'Prévia' }).click();
await p.waitForTimeout(700);
await p.screenshot({ path: `${dest}/03-clipe-salvo-previa.png` });
// clipe repetido
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe').fill('tchau');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
ok((await p.locator('.msg-anim').innerText()).includes('Já existe'), 'clipe repetido é recusado');
await p.getByRole('button', { name: 'Cancelar' }).click();
await p.getByRole('button', { name: 'Fechar' }).last().click();

// ---- usar no roteiro (e persistência: recarrega a página)
const rot = '# T\nBetason entra pela esquerda andando.\nBetason faz cara de apaixonada.\nBetason faz o clipe tchau.\nBetason faz o clipe tchau por 3 segundos.\nBetason faz cara de nojo.\nBetason faz o clipe inexistente.';
await p.evaluate((r) => localStorage.setItem('stickboard.roteiro.v2', r), rot);
await p.goto('http://127.0.0.1:5173/?t=4'); await pronto();
const avisos = await p.locator('.roteiro-avisos, [title*="aviso"], .aviso').allInnerTexts().catch(() => []);
const corpo = await p.locator('body').innerText();
ok(corpo.includes('Betason: clipe tchau') || corpo.includes('Betason: clipe tchau'.replace('Betason', 'BetaSon')), 'linha do tempo mostra o clipe');
await p.screenshot({ path: `${dest}/04-roteiro-com-clipe-chibi.png` });
await p.evaluate(() => localStorage.setItem('stickboard.skins.v1', JSON.stringify({ padrao: 'stickman', porPersonagem: {} })));
await p.goto('http://127.0.0.1:5173/?t=4.4'); await pronto();
await p.screenshot({ path: `${dest}/05-roteiro-com-clipe-stickman.png` });
// o personagem tem de aparecer no palco durante o clipe, nos dois estilos (intensidade absurda já tirou o boneco da tela)
const escuros = () => p.locator('.area-palco canvas').evaluate((c) => { const x = c.getContext('2d'); const w = c.width, h = c.height; const d = x.getImageData(Math.floor(w * 0.03), Math.floor(h * 0.3), Math.floor(w * 0.2), Math.floor(h * 0.65)).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 90) n++; return n; });
ok(await escuros() > 150, 'estilo Stickman: personagem visível durante o clipe');
await p.evaluate(() => localStorage.setItem('stickboard.skins.v1', JSON.stringify({ padrao: 'chibi', porPersonagem: {} })));
await p.goto('http://127.0.0.1:5173/?t=3.2'); await pronto();
ok(await escuros() > 150, 'estilo Chibi: personagem visível durante o clipe');
console.log('avisos do roteiro (esperados: nojo e inexistente):', avisos);
console.log('erros de página', erros);
ok(erros.length === 0, 'sem erros de página');
console.log(`passaram: ${passou}   falharam: ${falhas}`);
await b.close();
process.exit(falhas ? 1 : 0);
