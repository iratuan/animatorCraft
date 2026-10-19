// Revisão de lançamento — SPRITES: importar pacotes, exportar, substituir, criar, persistência, arquivos inválidos e ida e volta.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { createHash } from 'node:crypto';
import { criarVerificador, fundoBranco, rosto, sprite, transparente, zip, criarPng } from './util-png.mjs';

const dest = 'evidencias/38-revisao-lancamento/sprites';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const b = await chromium.launch({ channel: 'msedge', headless: true });
const sha = (u8) => createHash('sha1').update(u8).digest('hex');

async function abrir(ctx, consulta = '?ator=erika&teste=1') {
  const p = await ctx.newPage();
  p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
  await p.goto(BASE + consulta + '#/editor');
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(400);
  return p;
}
const sb = (p, area, fn, ...args) => p.evaluate(([ar, f, a]) => window.__sb[ar][f](...a), [area, fn, args]);
const ordenar = (o) => ({ ...o, poses: [...o.poses].sort(), rostos: [...o.rostos].sort(), props: [...o.props].sort() });
const sprites = async (p, id) => ordenar(await sb(p, 'cena', 'listarSprites', id));
const sprite1 = (p, id, tag) => sb(p, 'cena', 'escolherSprite', id, [tag]);
const avisos = (p, texto) => p.evaluate((t) => window.__sb.dominio.parseRoteiro(t).avisos, texto);
const status = (p) => p.locator('footer.status span').last().innerText();
const menu = async (p, item) => { await p.getByText('Arquivo').first().click(); await p.getByText(item, { exact: false }).first().click(); };
const esperarStatus = (p, re, t = 30000) => p.waitForFunction((r) => new RegExp(r).test(document.querySelector('footer.status')?.innerText ?? ''), re.source, { timeout: t });
async function importar(p, arquivo, { confirmar = true, substituir } = {}) {
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), menu(p, 'Importar pacote de sprites (.zip)…')]);
  await fc.setFiles(arquivo);
  await p.waitForTimeout(500);
  const modal = p.locator('[aria-label="Importar pacote de sprites"]');
  const temModal = await modal.count();
  if (!temModal || !confirmar) return { modal, temModal };
  if (substituir !== undefined) { const c = modal.locator('input[type=checkbox]'); if ((await c.isChecked()) !== substituir) await c.click(); }
  const botao = modal.getByRole('button', { name: /Importar|Corrija/ });
  const bloqueado = await botao.isDisabled();
  if (!bloqueado) { await botao.click(); await p.waitForFunction(() => document.querySelector('[aria-label="Importar pacote de sprites"]') === null, null, { timeout: 60000 }); await p.waitForTimeout(400); }
  return { modal, temModal, bloqueado };
}
async function exportarPersonagem(p, nomeBotao, arquivo) {
  await menu(p, 'Editar / exportar sprites dos personagens…');
  const modal = p.locator('[aria-label="Editor de sprites do personagem"]');
  await modal.waitFor();
  // o editor abre no personagem selecionado: escolhe o da exportação pela fila de nomes
  await modal.locator('.seletor-personagem').getByRole('button', { name: nomeBotao.source.replace('Exportar ', ''), exact: true }).click();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.getByRole('button', { name: nomeBotao }).click()]);
  await dl.saveAs(arquivo);
  await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).click().catch(() => {});
  return unzipSync(new Uint8Array(readFileSync(arquivo)));
}

// ------------------------------------------------------------------ arquivos de teste
const novoErika = `${dest}/pacote-erika-novo.zip`;
writeFileSync(novoErika, zip({
  'erika/pose_parado.png': sprite(300, 600, [10, 10, 10]),
  'erika/pose_andar_1.png': sprite(300, 600, [200, 0, 0]), 'erika/pose_andar_2.png': sprite(300, 600, [0, 200, 0]), 'erika/pose_andar_3.png': sprite(300, 600, [0, 0, 200]),
  'erika/rosto_apaixonada.png': rosto(), 'erika/prop_bola.png': rosto(80, 80, [200, 0, 0]),
  'erika/Pose_Bracos Cruzados.PNG': sprite(300, 600, [90, 40, 10]), 'erika/foto.jpg': new Uint8Array([1, 2, 3]),
}));

const ctx1 = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const p = await abrir(ctx1);
await p.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('stickboard'); });
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(400);

// =================================================================== S1: pacote novo (sem substituir)
console.log('S1 importar pacote novo');
const antesErika = await sprites(p, 'erika');
const paradoAntes = await sprite1(p, 'erika', 'parado');
const r1 = await importar(p, novoErika, { substituir: false });
v.ok(r1.temModal, 'modal de importação aparece');
await p.screenshot({ path: `${dest}/01-importado.png` });
v.ok(/Pacote importado: 7 sprites/.test(await status(p)), `mensagem de importação (${await status(p)})`);
const depois = await sprites(p, 'erika');
v.ok(depois.rostos.includes('apaixonada') && depois.props.includes('bola') && depois.poses.includes('bracos-cruzados'), 'sprites novos entram (rosto, prop, pose renomeada)');
v.igual(depois.quadros.andar, 3, 'animação andar com 3 quadros');
const quadrosVistos = await p.evaluate(() => { const s = window.__sb.cena; return [...new Set([0, 0.13, 0.26, 0.39, 0.52, 0.65].map((t) => s.escolherSprite('erika', ['andar'], t).arquivo))]; });
v.igual(quadrosVistos.length, 3, 'a animação andar tem exatamente 3 quadros distintos (a imagem única antiga saiu)');
v.ok(antesErika.rostos.every((r) => depois.rostos.includes(r)), 'sem "substituir", os sprites antigos continuam');
const paradoDepois = await sprite1(p, 'erika', 'parado');
v.ok(paradoDepois && (paradoDepois.w !== paradoAntes.w || paradoDepois.h !== paradoAntes.h), `pose_parado trocada (era ${paradoAntes.w}x${paradoAntes.h}, agora ${paradoDepois.w}x${paradoDepois.h})`);
v.ok(paradoDepois.w < 300 && paradoDepois.h < 600, 'imagem aparada nas bordas vazias');
v.igual(await avisos(p, '# C\nErika entra pela esquerda andando. Erika faz cara de apaixonada. Erika faz a pose bracos-cruzados por 2 segundos.'), [], 'roteiro usa os novos sprites sem avisos');

// =================================================================== S2: persistência
console.log('S2 persistência depois de recarregar');
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(800);
const recarregado = await sprites(p, 'erika');
v.igual(recarregado, depois, 'mesmos sprites depois de recarregar o app');
const paradoRecarregado = await sprite1(p, 'erika', 'parado');
v.ok(paradoRecarregado.w === paradoDepois.w && paradoRecarregado.h === paradoDepois.h, 'tamanho do pose_parado preservado');

// =================================================================== S3: exportar
console.log('S3 exportar');
const z1 = await exportarPersonagem(p, /Exportar Erika/, `${dest}/exportado-erika.zip`);
const nomes1 = Object.keys(z1).filter((k) => k.endsWith('.png')).sort();
for (const n of ['erika/pose_parado.png', 'erika/pose_andar_1.png', 'erika/pose_andar_2.png', 'erika/pose_andar_3.png', 'erika/rosto_apaixonada.png', 'erika/prop_bola.png', 'erika/pose_bracos-cruzados.png']) v.ok(nomes1.includes(n), `zip exportado tem ${n}`);
v.ok(nomes1.every((n) => z1[n][0] === 137 && z1[n][1] === 80), 'todos os PNGs exportados têm assinatura PNG');
v.ok(!!z1['erika/meta.json'] && !!z1['LEIA-ME.txt'] && !!z1['erika/FALTANDO.txt'], 'meta.json, LEIA-ME e FALTANDO presentes');
const meta1 = JSON.parse(new TextDecoder().decode(z1['erika/meta.json']));
v.ok(meta1.base?.w === paradoDepois.w && meta1.base?.h === paradoDepois.h, 'meta.base acompanha o pose_parado atual');

// =================================================================== S4: ida e volta em um app limpo
console.log('S4 ida e volta (exportar → app limpo → importar → exportar)');
const ctx2 = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const p2 = await abrir(ctx2);
await importar(p2, `${dest}/exportado-erika.zip`, { substituir: true });
const s2 = await sprites(p2, 'erika');
v.igual(s2, depois, 'app limpo + zip exportado = mesmos sprites de antes');
const z2 = await exportarPersonagem(p2, /Exportar Erika/, `${dest}/exportado-erika-2.zip`);
v.igual(Object.keys(z2).filter((k) => k.endsWith('.png')).sort(), nomes1, 'o segundo zip tem exatamente os mesmos arquivos');
await importar(p2, `${dest}/exportado-erika-2.zip`, { substituir: true });
const z3 = await exportarPersonagem(p2, /Exportar Erika/, `${dest}/exportado-erika-3.zip`);
// a partir da segunda volta a imagem já está aparada com a margem padrão: deve estabilizar (idempotência)
const mesmos = nomes1.filter((n) => sha(z2[n]) === sha(z3[n]));
v.ok(mesmos.length === nomes1.length, `exportar → importar → exportar converge: ${mesmos.length}/${nomes1.length} PNGs idênticos byte a byte`);
await p2.screenshot({ path: `${dest}/02-app-limpo-apos-importar.png` });
await ctx2.close();

// =================================================================== S5: arquivos inválidos
console.log('S5 pacotes inválidos');
writeFileSync(`${dest}/so-nome-ruim.zip`, zip({ 'erika/foto01.png': sprite(50, 50), 'erika/outra coisa.png': sprite(50, 50) }));
const ruim = await importar(p, `${dest}/so-nome-ruim.zip`);
v.ok(ruim.temModal && (await ruim.modal.locator('.erros-pacote').count()) === 1, 'nomes inválidos mostram a lista de erros');
v.ok(await ruim.modal.getByRole('button', { name: /Corrija os erros/ }).isDisabled(), 'botão de importar fica bloqueado');
await p.screenshot({ path: `${dest}/03-pacote-com-erros.png` });
await ruim.modal.getByRole('button', { name: 'Cancelar' }).click();

writeFileSync(`${dest}/nao-e-zip.zip`, 'isto não é um zip de verdade');
{ const [fc] = await Promise.all([p.waitForEvent('filechooser'), menu(p, 'Importar pacote de sprites (.zip)…')]); await fc.setFiles(`${dest}/nao-e-zip.zip`); await p.waitForTimeout(600); }
v.ok(/Não consegui ler o zip/.test(await status(p)), `arquivo que não é zip: "${await status(p)}"`);
v.ok(await p.locator('[aria-label="Importar pacote de sprites"]').count() === 0, 'nenhuma janela de importação fica aberta');

writeFileSync(`${dest}/png-corrompido.zip`, zip({ 'dario/pose_parado.png': new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4, 5]), 'dario/rosto_feliz.png': rosto() }));
const dsAntes = await sprites(p, 'dario');
await importar(p, `${dest}/png-corrompido.zip`);
v.ok(/1 falharam|falharam/.test(await status(p)) || /Importados 1 sprites/.test(await status(p)), `PNG corrompido vira falha avisada ("${await status(p)}")`);
v.igual((await sprites(p, 'dario')).poses, dsAntes.poses, 'pose do PNG corrompido não substitui a original');

writeFileSync(`${dest}/transparente.zip`, zip({ 'dario/rosto_nada.png': transparente(40, 40), 'dario/rosto_fundo.png': fundoBranco(100, 100), 'dario/prop_minusculo.png': criarPng(1, 1, () => [0, 0, 0, 255]) }));
await importar(p, `${dest}/transparente.zip`, { substituir: false });
const dd = await sprites(p, 'dario');
v.ok(!dd.rostos.includes('nada'), 'imagem toda transparente é recusada');
v.ok(dd.rostos.includes('fundo') && dd.props.includes('minusculo'), 'fundo branco e imagem de 1 pixel são aceitos');
// fundo branco removido: o canto da imagem processada fica transparente
const canto = await p.evaluate(async () => { const e = (await window.__sb.personagens.lerEntradasSalvas()).find((x) => x.info.tags[0] === 'fundo'); if (!e) return null; const img = new Image(); img.src = e.url; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return { w: img.width, h: img.height, alfaCanto: x.getImageData(0, 0, 1, 1).data[3], alfaCentro: x.getImageData(img.width >> 1, img.height >> 1, 1, 1).data[3] }; });
v.ok(canto && canto.alfaCanto === 0 && canto.alfaCentro === 255, `fundo branco removido e o desenho preservado (${JSON.stringify(canto)})`);
v.ok(canto && canto.w < 100, 'bordas vazias aparadas depois de tirar o fundo');

writeFileSync(`${dest}/gigante.zip`, zip({ 'dario/pose_gigante.png': sprite(4000, 3000) }));
await importar(p, `${dest}/gigante.zip`);
const gig = await sprite1(p, 'dario', 'gigante');
v.ok(gig && Math.max(gig.w, gig.h) <= 1600, `imagem de 4000×3000 é reduzida (${gig?.w}x${gig?.h})`);

// =================================================================== S6: personagem novo com pasta diferente do nome
console.log('S6 ficha.json com pasta diferente do nome');
writeFileSync(`${dest}/ficha-marta.zip`, zip({
  'marta/ficha.json': JSON.stringify({ nome: 'Tia Marta', apelidos: ['tia'], idade: '45 anos', descricao: 'Cozinheira', altura: 500, modeloPalito: 'mae', corPele: '#c68642' }),
  'marta/pose_parado.png': sprite(200, 400), 'marta/rosto_feliz.png': rosto(),
}));
const rm = await importar(p, `${dest}/ficha-marta.zip`);
v.ok(rm.temModal, 'pacote com ficha abre a importação');
const marta = await p.evaluate(() => { const { ATORES } = window.__sb.dominio; return ATORES['marta'] ? { nome: ATORES['marta'].nome, corPele: ATORES['marta'].corPele } : null; });
v.igual(marta, { nome: 'Tia Marta', corPele: '#c68642' }, 'personagem criado com o id da pasta (marta), nome e cor da pele');
v.ok((await sprites(p, 'marta')).poses.includes('parado'), 'sprites ficam no personagem criado');
v.igual(await avisos(p, '# C\nTia Marta entra pela esquerda andando. Tia Marta faz cara de feliz.'), [], 'roteiro usa o personagem novo');
await p.screenshot({ path: `${dest}/04-personagem-novo-por-ficha.png` });

// =================================================================== S7: substituir tudo, exportar sem os originais e voltar ao original
console.log('S7 substituir');
writeFileSync(`${dest}/so-parado-dario.zip`, zip({ 'dario/pose_parado.png': sprite(200, 400, [0, 90, 0]) }));
await importar(p, `${dest}/so-parado-dario.zip`, { substituir: true });
const so = await sprites(p, 'dario');
v.igual([so.poses, so.rostos], [['parado'], []], 'com "substituir" só restam os sprites do pacote');
const zd = await exportarPersonagem(p, /Exportar Dario/, `${dest}/exportado-dario-substituido.zip`);
v.igual(Object.keys(zd).filter((k) => k.endsWith('.png')), ['dario/pose_parado.png'], 'a exportação não leva os sprites originais substituídos');
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(800);
v.igual((await sprites(p, 'dario')).poses, ['parado'], 'a substituição persiste ao recarregar');
await menu(p, 'Remover pacotes importados');
await p.waitForTimeout(800);
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(800);
const volta = await sprites(p, 'dario');
v.ok(volta.poses.length > 3 && volta.rostos.length > 3, 'depois de remover os pacotes e reabrir, voltam os sprites originais');
v.ok(!(await sprites(p, 'erika')).rostos.includes('apaixonada'), 'sprites importados somem junto');

// =================================================================== S8: editor de sprites (PNG por espaço, criar, nomes)
console.log('S8 editor de sprites');
await menu(p, 'Editar / exportar sprites dos personagens…');
await p.waitForSelector('[aria-label="Editor de sprites do personagem"]');
await p.locator('[aria-label="Editor de sprites do personagem"] .seletor-personagem').getByRole('button', { name: 'Laura', exact: true }).click(); // a Laura tem espaços vazios (expressões sem sprite)
const vaziosAntes = await p.locator('.espaco.vazio').count();
writeFileSync(`${dest}/rosto-novo.png`, rosto(120, 120, [120, 0, 0]));
const [fc1] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.espaco-caixa', { has: p.locator('.espaco.vazio') }).first().locator('.espaco-png').click()]);
await fc1.setFiles(`${dest}/rosto-novo.png`);
await esperarStatus(p, /atualizado para/);
v.ok((await p.locator('.espaco.vazio').count()) === vaziosAntes - 1, 'enviar PNG preenche um espaço vazio');
// nomes inválidos
await p.getByPlaceholder(/nome novo/).fill('Nome Inválido!');
await p.getByRole('button', { name: 'Criar a partir de um PNG…' }).click();
v.ok(/Nome inválido/.test(await status(p)), `nome inválido recusado: "${await status(p)}"`);
await p.getByPlaceholder(/nome novo/).fill('pose com espaço');
await p.getByRole('button', { name: 'Criar a partir de um PNG…' }).click();
await p.getByPlaceholder(/nome novo/).fill('bracos-abertos-2');
const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Criar a partir de um PNG…' }).click()]);
await fc2.setFiles(`${dest}/pacote-erika-novo.zip`.replace('.zip', '.zip')); // arquivo que não é imagem: deve falhar sem travar
await p.waitForTimeout(1200);
v.ok(/Não consegui|Falhou|Não deu/.test(await status(p)), `arquivo que não é imagem no lugar do PNG: "${await status(p)}"`);
writeFileSync(`${dest}/pose-nova.png`, sprite(240, 480, [0, 0, 120]));
await p.getByPlaceholder(/nome novo/).fill('bracos-abertos-2');
const [fc3] = await Promise.all([p.waitForEvent('filechooser'), p.getByRole('button', { name: 'Criar a partir de um PNG…' }).click()]);
await fc3.setFiles(`${dest}/pose-nova.png`);
await esperarStatus(p, /pose_bracos-abertos-2 atualizado/);
v.ok((await sprites(p, 'laura')).poses.includes('bracos-abertos-2'), 'pose nova criada a partir de um PNG');
await p.screenshot({ path: `${dest}/05-editor-de-sprites.png` });
await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).click().catch(() => {});

// =================================================================== S9: sem como guardar no aparelho
console.log('S9 armazenamento indisponível');
const ctx3 = await b.newContext({ viewport: { width: 1600, height: 900 } });
await ctx3.addInitScript(() => { const abrir = IDBFactory.prototype.open; IDBFactory.prototype.open = function (...a) { if (a[0] === 'stickboard') throw new Error('armazenamento bloqueado'); return abrir.apply(this, a); }; });
const p3 = await abrir(ctx3);
await importar(p3, novoErika);
const msg3 = await status(p3);
v.ok(/Atenção: não consegui guardar/.test(msg3), `aviso quando não dá para guardar: "${msg3}"`);
v.ok((await sprites(p3, 'erika')).rostos.includes('apaixonada'), 'mesmo assim vale nesta sessão');
await ctx3.close();

for (const pg of [p]) v.ok(pg.erros.length === 0, `sem erros de página: ${pg.erros.join(' | ')}`);
await b.close();
process.exit(v.fim('revisão de sprites'));
