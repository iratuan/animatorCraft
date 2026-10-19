// Revisão de lançamento — BIBLIOTECA: personagens, miniaturas, sequências prontas, criar/editar/duplicar/excluir personagem, estilo (skin) e poses do pacote.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVerificador, sprite, zip } from './util-png.mjs';

const dest = 'evidencias/38-revisao-lancamento/biblioteca';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const b = await chromium.launch({ channel: 'msedge', headless: true });
const PRONTO = () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens');
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
await p.goto(`${BASE}?limpar=${Date.now()}`);
await p.evaluate(() => { localStorage.clear(); for (const n of ['stickboard', 'stickboard-audio', 'stickboard-imagens']) indexedDB.deleteDatabase(n); });
const abrir = async () => { await p.goto(`${BASE}?teste=1&r=${Date.now()}#/editor`); await p.waitForFunction(PRONTO, null, { timeout: 90000 }); await p.waitForTimeout(600); };
await abrir();
const sb = (area, fn, ...args) => p.evaluate(([ar, f, a]) => (typeof window.__sb[ar][f] === 'function' ? window.__sb[ar][f](...a) : JSON.parse(JSON.stringify(window.__sb[ar][f]))), [area, fn, args]);
const aba = (nome) => p.locator('.abas').getByRole('button', { name: nome, exact: true }).click();
const roteiro = () => p.locator('#campo-roteiro').inputValue();
const status = () => p.locator('footer.status span').last().innerText();
const avisosDe = (t) => p.evaluate((x) => window.__sb.dominio.parseRoteiro(x).avisos, t);
/** pixels "com desenho" (não transparentes e não brancos) de cada canvas de miniatura */
const desenhado = (seletor) => p.locator(seletor).evaluateAll((cs) => cs.map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40 && (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235)) n++; return n; }));

// =================================================================== B1: lista de personagens e miniaturas
console.log('B1 personagens e miniaturas');
await aba('Biblioteca');
const nomesDoElenco = await sb('dominio', 'ORDEM_ATORES');
v.igual(await p.locator('.ficha').count(), nomesDoElenco.length, 'um cartão por personagem do elenco');
const pixels = await desenhado('.ficha canvas');
v.ok(pixels.every((n) => n > 150), `todas as miniaturas têm desenho (mín. ${Math.min(...pixels)} px): ${pixels.join(', ')}`);
await p.screenshot({ path: `${dest}/01-biblioteca.png` });
const textoFicha = await p.locator('.ficha').allInnerTexts();
v.ok(textoFicha.every((t) => /\d+ anos/.test(t)), 'idade e descrição aparecem em cada cartão');

// =================================================================== B2: sequências por personagem
console.log('B2 sequências prontas');
const doAtor = { CringeFather: 'Dança funky anos 70', BetaSon: 'Dança atual', Erika: 'Dança hippie', Dario: 'Pulos descoordenados', Laura: 'Balé' };
for (const [i, id] of nomesDoElenco.entries()) {
  const nome = (await sb('dominio', 'ATORES'))[id].nome;
  await p.evaluate((t) => window.__sb.store.getState().setRoteiro(t), `# Seq\n${nome} entra pela esquerda andando.\n`);
  await aba('Biblioteca');
  await p.locator('.ficha').nth(i).click(); await aba('Biblioteca');
  const botoes = p.locator('.seq');
  const n = await botoes.count();
  const titulos = await p.locator('.seq b').allInnerTexts();
  if (doAtor[nome]) v.ok(titulos.includes(doAtor[nome]), `${nome} tem a sequência "${doAtor[nome]}"`);
  for (let k = 0; k < n; k++) await botoes.nth(k).click();
  const r = await roteiro();
  v.ok(r.length > 200 && /inserido\./.test(await status()), `${nome}: ${n} sequências inseridas (${r.length} caracteres)`);
  const av = await avisosDe(r);
  v.igual(av, [], `${nome}: todas as sequências juntas rodam sem avisos`);
}
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# Seq\nCringeFather entra pela esquerda andando.\n'));
await p.locator('.ficha').nth(0).click(); await aba('Biblioteca');
const titulosFunky = await p.locator('.seq b').allInnerTexts();
await p.locator('.ficha').nth(4).click(); await aba('Biblioteca');
const titulosLaura = await p.locator('.seq b').allInnerTexts();
v.ok(titulosFunky.includes('Dança funky anos 70') && !titulosLaura.includes('Dança funky anos 70') && titulosLaura.includes('Balé') && !titulosFunky.includes('Balé'), 'sequências exclusivas aparecem só para o personagem certo');
v.ok(titulosFunky.includes('Comemoração') && titulosLaura.includes('Comemoração'), 'sequências gerais aparecem para todos');

// =================================================================== B3: painel do personagem (danças e poses)
console.log('B3 painel do personagem');
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# P\nCringeFather entra pela esquerda andando.\n'));
await p.locator('.ficha').nth(0).click();
await p.waitForSelector('.ator-cab');
const grade = p.locator('.propriedades .grade').first();
v.ok((await grade.locator('button').count()) === 5, 'cinco danças no painel');
const pxDanca = await desenhado('.propriedades .grade canvas');
v.ok(pxDanca.length > 20 && pxDanca.every((n) => n > 80), `miniaturas das danças e poses com desenho (${pxDanca.length} miniaturas)`);
await grade.locator('button').first().click();
v.ok((await roteiro()).includes('CringeFather dança funky por 4 segundos.'), 'clicar na dança insere a frase do roteiro');
await p.locator('.propriedades .grade').nth(1).locator('button').first().click();
v.igual(await avisosDe(await roteiro()), [], 'danças e poses inseridas rodam sem avisos');
for (const botao of await p.locator('.propriedades .grade').nth(1).locator('button').all()) await botao.click();
v.igual(await avisosDe(await roteiro()), [], 'todas as poses do painel rodam sem avisos');
await p.screenshot({ path: `${dest}/02-painel-personagem.png` });

// =================================================================== B4: estilo (skin)
console.log('B4 estilo Chibi / Stickman');
const hashPalco = () => p.locator('.area-palco canvas').evaluate((c) => { const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 53) h = (h * 31 + d[i]) >>> 0; return h; });
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.0 }));
await p.waitForTimeout(500);
const hChibi = await hashPalco();
await p.getByRole('button', { name: 'Stickman', exact: true }).click(); await p.waitForTimeout(700);
const hStick = await hashPalco();
v.ok(hChibi !== hStick, 'trocar para Stickman muda o desenho do palco');
v.igual(await p.evaluate(() => window.__sb.store.getState().skins), { cringefather: 'stickman' }, 'a escolha é guardada por personagem');
await p.screenshot({ path: `${dest}/03-stickman.png` });
await abrir();
v.igual(await p.evaluate(() => window.__sb.store.getState().skins), { cringefather: 'stickman' }, 'a escolha de estilo persiste depois de recarregar');
await p.locator('.ator-cab').waitFor();
await p.getByRole('button', { name: 'Chibi', exact: true }).click(); await p.waitForTimeout(500);

// =================================================================== B5: criar, validar, editar, duplicar e excluir personagem
console.log('B5 criar, editar, duplicar, excluir');
await aba('Biblioteca');
const antes = await p.locator('.ficha').count();
await p.getByRole('button', { name: '＋ Novo personagem' }).click(); await p.waitForTimeout(300);
const ficha = p.locator('[aria-label="Ficha do personagem"]');
v.ok(await ficha.getByRole('button', { name: 'Criar personagem' }).isDisabled(), 'sem nome, o botão de criar fica desabilitado');
await ficha.getByPlaceholder('ex.: Tia Marta').fill('Tia Marta');
await ficha.getByPlaceholder('ex.: tia, martinha').fill('tia, martinha');
await ficha.getByPlaceholder('ex.: 38 anos').fill('45 anos');
await ficha.locator('select').first().selectOption('mae');
await ficha.getByRole('button', { name: 'Criar personagem' }).click();
await p.waitForTimeout(600);
v.igual(await p.locator('.ficha').count(), antes + 1, 'o personagem novo entra na biblioteca');
const novoPx = (await desenhado('.ficha canvas')).at(-1);
v.ok(novoPx > 100, `miniatura do personagem novo (boneco) com desenho (${novoPx} px)`);
v.ok(/Tia Marta criado/.test(await status()), `mensagem: ${await status()}`);
v.igual(await avisosDe('# C\nTia Marta entra pela esquerda andando. Tia diz "Oi!". Martinha acena.'), [], 'nome, apelido "tia" e apelido "martinha" valem');
// validações
await p.getByRole('button', { name: '＋ Novo personagem' }).click(); await p.waitForTimeout(300);
await ficha.getByPlaceholder('ex.: Tia Marta').fill('Tia Marta'); await ficha.getByRole('button', { name: 'Criar personagem' }).click();
v.ok(/Já existe um personagem/.test(await ficha.locator('.erros-pacote').innerText()), 'nome repetido é recusado');
await ficha.getByPlaceholder('ex.: Tia Marta').fill('Outra'); await ficha.getByPlaceholder('ex.: tia, martinha').fill('erika');
await ficha.getByRole('button', { name: 'Criar personagem' }).click();
v.ok(/já é de Erika/.test(await ficha.locator('.erros-pacote').innerText()), 'apelido de outro personagem é recusado');
await ficha.getByPlaceholder('ex.: tia, martinha').fill('professor');
await ficha.getByRole('button', { name: 'Criar personagem' }).click();
v.ok(/palavra do roteiro/.test(await ficha.locator('.erros-pacote').innerText()), 'apelido que é palavra do roteiro é recusado');
await ficha.getByPlaceholder('ex.: Tia Marta').fill('!!!'); await ficha.getByPlaceholder('ex.: tia, martinha').fill('');
await ficha.getByRole('button', { name: 'Criar personagem' }).click();
v.ok(/letras ou números|conflita/.test(await ficha.locator('.erros-pacote').innerText()), 'nome só de símbolos é recusado');
await ficha.getByRole('button', { name: 'Cancelar' }).click();
v.igual(await p.locator('.ficha').count(), antes + 1, 'cancelar e erros não criam personagem');
// editar
await p.locator('.ficha').last().click();
await p.getByRole('button', { name: 'Editar ficha' }).click(); await p.waitForTimeout(300);
await ficha.getByPlaceholder('ex.: Tia Marta').fill('Tia Marta Souza'); await ficha.getByRole('button', { name: 'Salvar', exact: true }).click();
await p.waitForTimeout(500);
v.igual(await sb('dominio', 'ATORES').then((a) => a['tia-marta'].nome), 'Tia Marta Souza', 'editar a ficha troca o nome e mantém o id');
v.igual(await avisosDe('# C\nTia Marta Souza entra pela esquerda andando. Tia acena.'), [], 'apelidos antigos continuam valendo depois de editar');
// duplicar um do elenco
await aba('Biblioteca'); await p.locator('.ficha').nth(0).click();
await p.getByRole('button', { name: 'Duplicar como novo' }).click(); await p.waitForTimeout(300);
v.ok((await ficha.getByPlaceholder('ex.: Tia Marta').inputValue()) === 'CringeFather 2', 'duplicar sugere "Nome 2"');
await ficha.getByRole('button', { name: 'Criar personagem' }).click();
await p.waitForTimeout(500);
v.ok(!!(await sb('dominio', 'ATORES'))['cringefather-2'], 'cópia criada com id próprio');
v.igual(await avisosDe('# C\nCringeFather 2 entra pela esquerda andando. CringeFather 2 dança.'), [], 'cópia funciona no roteiro');
await p.screenshot({ path: `${dest}/04-personagens-criados.png` });
// persistência
await abrir();
const atores = await sb('dominio', 'ATORES');
v.ok(atores['tia-marta']?.nome === 'Tia Marta Souza' && atores['tia-marta'].apelidos.includes('martinha') && atores['tia-marta'].idade === '45 anos' && !!atores['cringefather-2'], 'personagens criados voltam depois de recarregar (com apelidos e idade)');
// excluir
await aba('Biblioteca');
const indiceMarta = (await sb('dominio', 'ORDEM_ATORES')).indexOf('tia-marta');
await p.locator('.ficha').nth(indiceMarta).click();
p.once('dialog', (d) => d.accept());
await p.getByRole('button', { name: 'Editar ficha' }).click(); await p.waitForTimeout(300);
await ficha.getByRole('button', { name: 'Excluir' }).click();
await p.waitForTimeout(800);
v.ok(!(await sb('dominio', 'ATORES'))['tia-marta'] && !!(await sb('dominio', 'ATORES'))['cringefather-2'], 'excluir remove só o escolhido');
v.igual(await p.evaluate(() => window.__sb.store.getState().selecionado), 'cringefather', 'depois de excluir, a seleção volta ao primeiro personagem');
v.igual(await avisosDe('# C\nTia Marta Souza entra pela esquerda andando.').then((a) => a.length > 0), true, 'roteiro que citava o personagem excluído mostra aviso (não quebra)');
await abrir();
v.ok(!(await sb('dominio', 'ATORES'))['tia-marta'], 'a exclusão persiste depois de recarregar');
await aba('Biblioteca');
v.igual(await p.locator('.ficha').count(), nomesDoElenco.length + 1, 'biblioteca atualizada (elenco + cópia)');

// =================================================================== B6: poses do pacote aparecem no painel
console.log('B6 poses do pacote');
writeFileSync(`${dest}/pacote-dario.zip`, zip({ 'dario/pose_foguete.png': sprite(200, 400, [200, 0, 0]), 'dario/pose_parado.png': sprite(200, 400) }));
await p.getByText('Arquivo').first().click();
const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.getByText('Importar pacote de sprites (.zip)…').click()]);
await fc.setFiles(`${dest}/pacote-dario.zip`); await p.waitForTimeout(600);
const caixa = p.locator('[aria-label="Importar pacote de sprites"]');
if (await caixa.locator('input[type=checkbox]').isChecked()) await caixa.locator('input[type=checkbox]').click();
await caixa.getByRole('button', { name: 'Importar' }).click(); await p.waitForTimeout(1500);
await aba('Biblioteca'); await p.locator('.ficha').nth(3).click(); // Dario
await p.waitForSelector('.ator-cab');
await p.getByText('Poses do pacote').scrollIntoViewIfNeeded();
const poseBtn = p.locator('.grade button', { hasText: 'foguete' });
v.ok(await poseBtn.count() === 1, 'a pose nova do pacote aparece no painel');
v.ok((await poseBtn.locator('canvas').evaluate((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; })) > 100, 'com miniatura do sprite importado');
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# P\nDario entra pela esquerda andando.\n'));
await poseBtn.click();
v.ok((await roteiro()).includes('Dario faz a pose foguete.'), 'clicar insere "Dario faz a pose foguete."');
v.igual(await avisosDe(await roteiro()), [], 'e o roteiro entende');
await p.screenshot({ path: `${dest}/05-pose-do-pacote.png` });

v.ok(p.erros.length === 0, `sem erros de página: ${p.erros.join(' | ')}`);
await b.close();
process.exit(v.fim('revisão da biblioteca'));
