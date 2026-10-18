// Importar e exportar: pacote de sprites com expressão animada + animações, exportação do personagem e do projeto, reimportação em perfil limpo, e entradas ruins.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
const dest = 'evidencias/35-expressoes-e-clipes/io';
mkdirSync(dest, { recursos: true, recursive: true });
let falhas = 0, passou = 0;
const ok = (c, m) => { if (c) passou++; else { falhas++; console.log('FALHOU:', m); } };
const b = await chromium.launch({ channel: 'msedge', headless: true });
const A = 'src/renderer/assets/personagens/betason';
const png = (n) => new Uint8Array(readFileSync(`${A}/${n}`));
const URL = 'http://127.0.0.1:5173/';
const novaPagina = async (perfil = true) => {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
  const p = await ctx.newPage(); p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
  await p.goto(URL + '?ator=betason');
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(400);
  return p;
};
const menu = async (p, grupo, item) => { await p.getByText(grupo, { exact: true }).first().click(); await p.getByText(item, { exact: false }).first().click(); };
const recarregar = async (p, q = '') => { await p.goto(URL + (q || '?ator=betason')); await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(500); };
const importarZip = async (p, zip, nome = 'pacote.zip') => {
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), menu(p, 'Arquivo', 'Importar pacote de sprites')]);
  await fc.setFiles({ name: nome, mimeType: 'application/zip', buffer: Buffer.from(zip) });
  await p.waitForTimeout(500);
};
const avisosTexto = (p) => p.locator('.roteiro-avisos, .avisos-roteiro, [class*=aviso]').allInnerTexts().then((l) => l.join(' | '));
const roteiroTeste = '# T\nBetason entra pela esquerda andando.\nBetason fica na posição 50%.\n[close em Betason]\nBetason faz cara de apaixonada.\nEspera 6 segundos.\nBetason faz cara de sonolento.\nBetason faz o clipe danca-foguete.';

// ---- 1) pacote com expressão animada do chibi + animações do personagem
const animJson = {
  clipes: [{ ator: 'qualquer', nome: 'Dança Foguete', estilo: 'ambos', loop: true, passos: [{ tags: ['comemorar'], dur: 0.4, mov: 'pular', amp: 0.2, poseBoneco: 'pular' }, { tags: ['parado'], dur: 0.4, mov: 'balancar', amp: 6, espelhar: true }] }],
  expressoes: [{ ator: 'qualquer', nome: 'Sonolento', quadros: [{ olho: 'meia', sobr: 2, boca: 'reta' }, { olho: 'estreito', sobr: -2, boca: 'onda' }] }],
};
const pacote = zipSync({
  'betason/pose_parado.png': png('pose_parado.png'), 'betason/rosto_apaixonada_1.png': png('rosto_feliz.png'), 'betason/rosto_apaixonada_2.png': png('rosto_triste.png'),
  'betason/animacoes.json': strToU8(JSON.stringify(animJson)),
});
let p = await novaPagina();
await p.evaluate((r) => localStorage.setItem('stickboard.roteiro.v2', r), roteiroTeste);
await importarZip(p, pacote);
ok(await p.locator('[data-animacoes]').count() === 1, 'importação mostra o resumo das animações');
const textoModal = await p.locator('.modal').innerText();
ok(textoModal.includes('expressão nova "apaixonada"'), 'aviso de expressão nova no relatório');
ok(textoModal.includes('1 clipe(s)') && textoModal.includes('1 expressão'), 'contagem de clipes e expressões');
await p.screenshot({ path: `${dest}/01-importar-pacote.png` });
await p.getByRole('button', { name: 'Importar', exact: true }).click();
await p.waitForTimeout(1500);
await recarregar(p); // persistência: tudo tem de voltar sozinho
ok((await p.locator('body').innerText()).includes('sem avisos'), 'roteiro sem avisos após importar e reabrir (expressões e clipe reconhecidos)');
// quadros da expressão do chibi alternam (8 por segundo): a região do rosto muda entre t=2.0 e t=2.14
const regiao = (pp) => pp.locator('.area-palco canvas').evaluate((c) => { const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 97) s = (s * 31 + d[i]) >>> 0; return s; });
await recarregar(p, '?ator=betason&t=3.0'); const h1 = await regiao(p);
await recarregar(p, '?ator=betason&t=3.14'); const h2 = await regiao(p);
await p.screenshot({ path: `${dest}/02-expressao-animada-chibi.png` });
ok(h1 !== h2, 'expressão animada do Chibi troca de quadro');

// ---- 2) exportar o personagem (sprites + animações)
await p.getByText('Expressões e clipes de BetaSon…').click();
await p.getByRole('button', { name: 'Clipes de animação' }).click();
ok(await p.locator('[data-clipe="danca-foguete"]').count() === 1, 'clipe importado aparece no editor');
await p.screenshot({ path: `${dest}/03-clipe-importado.png` });
await p.getByRole('button', { name: 'Fechar' }).last().click();
await p.getByText('Editar / exportar sprites de BetaSon').click();
ok(await p.locator('.espaco', { hasText: 'apaixonada (nova)' }).count() >= 1, 'expressão nova aparece no editor de sprites');
const [dl1] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Exportar BetaSon (.zip)' }).click()]);
await dl1.saveAs(`${dest}/sprites-betason.zip`);
const exp = unzipSync(new Uint8Array(readFileSync(`${dest}/sprites-betason.zip`)));
ok(!!exp['betason/rosto_apaixonada_1.png'] && !!exp['betason/rosto_apaixonada_2.png'], 'zip exportado leva os quadros da expressão');
const animExp = exp['betason/animacoes.json'] ? JSON.parse(strFromU8(exp['betason/animacoes.json'])) : null;
ok(animExp?.clipes?.[0]?.nome === 'Dança Foguete' && animExp?.expressoes?.[0]?.nome === 'sonolento', 'zip exportado leva animacoes.json (clipe e expressão)');
await p.getByRole('button', { name: 'Fechar' }).last().click().catch(() => {});

// ---- 3) projeto completo
await p.keyboard.press('Escape');
const [dl2] = await Promise.all([p.waitForEvent('download'), menu(p, 'Arquivo', 'Salvar projeto completo')]);
await dl2.saveAs(`${dest}/projeto.zip`);
const proj = unzipSync(new Uint8Array(readFileSync(`${dest}/projeto.zip`)));
ok(strFromU8(proj['roteiro.txt']).includes('danca-foguete'), 'projeto leva o roteiro');
ok(!!proj['animacoes.json'] && JSON.parse(strFromU8(proj['animacoes.json'])).clipes.length === 1, 'projeto leva animacoes.json');
ok(Object.keys(proj).some((k) => k.startsWith('sprites/betason/rosto_apaixonada_1')), 'projeto leva os sprites da expressão');
ok(p.erros.length === 0, 'sem erros de página (perfil A): ' + p.erros.join(';'));
await p.context().close();

// ---- 4) perfil limpo: importa só o zip exportado do personagem
p = await novaPagina();
await p.evaluate((r) => localStorage.setItem('stickboard.roteiro.v2', r), roteiroTeste);
await recarregar(p);
ok((await avisosTexto(p) + await p.locator('body').innerText()).includes('aviso'), 'perfil limpo: antes de importar o roteiro tem avisos');
await importarZip(p, new Uint8Array(readFileSync(`${dest}/sprites-betason.zip`)), 'sprites-betason.zip');
await p.getByRole('button', { name: 'Importar', exact: true }).click();
await p.waitForTimeout(1500);
await recarregar(p);
ok((await p.locator('body').innerText()).includes('sem avisos'), 'perfil limpo: depois de importar o zip exportado, sem avisos');
await p.screenshot({ path: `${dest}/04-perfil-limpo-importado.png` });
await p.context().close();

// ---- 5) perfil limpo: abre o projeto completo
p = await novaPagina();
const [fc] = await Promise.all([p.waitForEvent('filechooser'), menu(p, 'Arquivo', 'Abrir projeto')]);
await fc.setFiles(`${dest}/projeto.zip`);
await p.waitForTimeout(2500);
await recarregar(p);
ok((await p.locator('.cm-content, textarea').first().inputValue().catch(() => '')).includes('danca-foguete') || (await p.locator('body').innerText()).includes('danca-foguete'), 'projeto aberto restaura o roteiro');
ok((await p.locator('body').innerText()).includes('sem avisos'), 'projeto aberto: clipe e expressões funcionam (sem avisos)');
await p.screenshot({ path: `${dest}/05-projeto-aberto.png` });
await p.context().close();

// ---- 6) entradas ruins não derrubam nada
p = await novaPagina();
await importarZip(p, new Uint8Array([1, 2, 3, 4, 5]), 'lixo.zip');
ok((await p.locator('body').innerText()).includes('Não consegui ler o zip'), 'zip corrompido: mensagem amigável');
const lixoAnim = { clipes: [{ nome: '???', passos: [] }, { nome: 'Gigante', estilo: 'xyz', passos: Array.from({ length: 80 }, () => ({ tags: ['parado'], dur: 99999, mov: 'pular', amp: 1e9, poseBoneco: 'naoexiste' })), substitui: 'inventada' }, null, 7], expressoes: [{ nome: 'x', quadros: [{ olho: 'quadrado', sobr: 1, boca: 'reta' }] }, { nome: 'Longa', quadros: Array.from({ length: 30 }, () => ({ olho: 'normal', sobr: 1e9, boca: 'reta' })) }] };
await importarZip(p, zipSync({ 'betason/pose_parado.png': png('pose_parado.png'), 'betason/animacoes.json': strToU8(JSON.stringify(lixoAnim)) }), 'lixo-anim.zip');
await p.getByRole('button', { name: 'Importar', exact: true }).click();
await p.waitForTimeout(1500);
await recarregar(p);
await p.getByText('Expressões e clipes de BetaSon…').click();
await p.getByRole('button', { name: 'Clipes de animação' }).click();
const gigante = p.locator('[data-clipe="gigante"]');
ok(await gigante.count() === 1, 'clipe com dados absurdos é saneado e mantido');
ok((await gigante.innerText()).includes('24 passo(s)'), 'passos limitados a 24');
ok(!(await gigante.innerText()).includes('substitui'), 'pose inventada ignorada');
ok(await p.locator('[data-clipe]').count() === 1, 'clipes sem nome ou sem passos descartados');
await p.getByRole('button', { name: 'Expressões', exact: true }).click();
ok(await p.locator('.lista-anim li', { hasText: 'longa' }).count() === 1 && await p.locator('.lista-anim li', { hasText: '4 quadro' }).count() === 1, 'expressão longa limitada a 4 quadros; a de olho inválido descartada');
await p.screenshot({ path: `${dest}/06-entradas-ruins.png` });
ok(p.erros.length === 0, 'sem erros de página (entradas ruins): ' + p.erros.join(';'));
await p.context().close();

console.log(`passaram: ${passou}   falharam: ${falhas}`);
await b.close();
process.exit(falhas ? 1 : 0);
