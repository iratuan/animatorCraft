// Revisão de lançamento — IMPORTAÇÃO E ARQUIVOS: abrir/salvar roteiro (codificações, tamanhos, lixo), imagens, áudios e projeto completo (ida e volta).
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { criarVerificador, criarPng, gradiente, sprite, rosto, wav, zip } from './util-png.mjs';

const dest = 'evidencias/38-revisao-lancamento/importacao';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const b = await chromium.launch({ channel: 'msedge', headless: true });
const PRONTO = () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens');

async function abrir(ctx, limpar = false) {
  const p = await ctx.newPage();
  p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
  if (limpar) { await p.goto(`${BASE}?limpar=${Date.now()}`); await p.evaluate(() => { localStorage.clear(); for (const n of ['stickboard', 'stickboard-audio', 'stickboard-imagens']) indexedDB.deleteDatabase(n); }); }
  await p.goto(`${BASE}?teste=1#/editor`);
  await p.waitForFunction(PRONTO, null, { timeout: 90000 });
  await p.waitForTimeout(500);
  return p;
}
const sb = (p, area, fn, ...args) => p.evaluate(([ar, f, a]) => window.__sb[ar][f](...a), [area, fn, args]);
const status = (p) => p.locator('footer.status span').last().innerText();
const roteiroDe = (p) => p.locator('#campo-roteiro').inputValue();
const menu = async (p, grupo, item) => { await p.getByText(grupo, { exact: true }).first().click(); await p.getByText(item, { exact: false }).first().click(); };
async function abrirArquivo(p, grupo, item, arquivo) {
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), menu(p, grupo, item)]);
  await fc.setFiles(arquivo);
  await p.waitForTimeout(700);
}

const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const p = await abrir(ctx, true);

// =================================================================== R1: abrir e salvar roteiro
console.log('R1 roteiro: abrir e salvar');
writeFileSync(`${dest}/bom-crlf.stk.txt`, '﻿# Título ação\r\nProfessor entra pela esquerda andando.\r\nProfessor diz "Olá, mundo!" feliz.\r\n');
await abrirArquivo(p, 'Arquivo', 'Abrir roteiro…', `${dest}/bom-crlf.stk.txt`);
const aberto = await roteiroDe(p);
v.ok(!aberto.includes('﻿') && aberto.startsWith('# Título ação'), 'BOM do início é descartado');
v.ok(/Aberto: bom-crlf\.stk\.txt/.test(await status(p)), `mensagem: ${await status(p)}`);
v.igual(await p.evaluate((t) => { const r = window.__sb.dominio.parseRoteiro(t); return [r.avisos.length, r.cenas[0].titulo, r.cenas[0].acoes.length]; }, aberto), [0, 'Título ação', 3], 'CRLF e acentos interpretados sem avisos');
writeFileSync(`${dest}/vazio.txt`, '');
await abrirArquivo(p, 'Arquivo', 'Abrir roteiro…', `${dest}/vazio.txt`);
v.igual(await roteiroDe(p), '', 'arquivo vazio abre como roteiro vazio');
await p.keyboard.press('Control+z');
writeFileSync(`${dest}/lixo.bin`, Buffer.from(Array.from({ length: 4000 }, (_, i) => (i * 131 + 7) & 255)));
await abrirArquivo(p, 'Arquivo', 'Abrir roteiro…', `${dest}/lixo.bin`);
v.ok(p.erros.length === 0, 'arquivo binário aberto como roteiro não derruba o app');
const t0 = Date.now(); const grande = '# Grande\n' + 'Professor diz "Isto é uma frase razoavelmente longa para o teste." feliz. Aluno acena.\n'.repeat(2500);
writeFileSync(`${dest}/grande.txt`, grande);
await abrirArquivo(p, 'Arquivo', 'Abrir roteiro…', `${dest}/grande.txt`);
const msGrande = await p.evaluate((t) => { const t0 = performance.now(); const r = window.__sb.dominio.parseRoteiro(t); const tl = window.__sb.dominio.construirTimeline(r); return { ms: performance.now() - t0, acoes: r.cenas[0].acoes.length, dur: tl.duracao }; }, grande);
console.log(`  roteiro de ${(grande.length / 1e6).toFixed(1)} MB: abre em ${(Date.now() - t0) / 1000} s, interpreta em ${msGrande.ms.toFixed(0)} ms (${msGrande.acoes} ações, ${(msGrande.dur / 60).toFixed(0)} min)`);
v.ok(msGrande.ms < 5000, 'roteiro grande interpretado em menos de 5 s');
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# Salvar\nProfessor diz "Acentuação: ç ã é ü ☃".'));
const [dl] = await Promise.all([p.waitForEvent('download'), menu(p, 'Arquivo', 'Salvar roteiro…')]);
await dl.saveAs(`${dest}/salvo.stk.txt`);
v.igual(readFileSync(`${dest}/salvo.stk.txt`, 'utf8'), '# Salvar\nProfessor diz "Acentuação: ç ã é ü ☃".', 'roteiro salvo igual ao do editor (UTF-8)');
v.igual(dl.suggestedFilename(), 'roteiro.stk.txt', 'nome sugerido');
await p.locator('#campo-roteiro').click();
const [dlCtrl] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.keyboard.press('Control+s')]);
v.ok(!!dlCtrl, 'Ctrl+S salva o roteiro (sem abrir o diálogo do navegador)');
const [fcCtrl] = await Promise.all([p.waitForEvent('filechooser', { timeout: 10000 }), p.keyboard.press('Control+o')]);
v.ok(!!fcCtrl, 'Ctrl+O abre o seletor de roteiro');
await fcCtrl.setFiles([]);

// =================================================================== R2: imagens
console.log('R2 imagens');
// JPEG e WebP gerados no próprio navegador
const gerar = await p.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 400, 300); g.addColorStop(0, '#f80'); g.addColorStop(1, '#08f'); x.fillStyle = g; x.fillRect(0, 0, 400, 300);
  const dados = async (tipo) => { const bl = await new Promise((ok) => c.toBlob(ok, tipo, 0.9)); const ab = new Uint8Array(await bl.arrayBuffer()); let s = ''; for (const n of ab) s += String.fromCharCode(n); return btoa(s); };
  return { jpg: await dados('image/jpeg'), webp: await dados('image/webp') };
});
writeFileSync(`${dest}/foto.jpg`, Buffer.from(gerar.jpg, 'base64')); writeFileSync(`${dest}/figura.webp`, Buffer.from(gerar.webp, 'base64'));
writeFileSync(`${dest}/Ciclo da Água.PNG`, gradiente(300, 200)); writeFileSync(`${dest}/enorme.png`, gradiente(5000, 3000)); writeFileSync(`${dest}/corrompida.png`, Buffer.from([137, 80, 78, 71, 1, 2, 3])); writeFileSync(`${dest}/texto.png`, 'isto não é imagem');
writeFileSync(`${dest}/vetor.svg`, '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
await p.getByRole('button', { name: 'Imagens', exact: true }).click();
await p.locator('input[type=file][accept*="png"]').setInputFiles([`${dest}/foto.jpg`, `${dest}/figura.webp`, `${dest}/Ciclo da Água.PNG`, `${dest}/enorme.png`]);
await p.waitForTimeout(2500);
let lista = await sb(p, 'dominio', 'listarImagens');
v.igual(lista.map((i) => i.nome), ['Ciclo-da-Água.PNG', 'enorme.png', 'figura.webp', 'foto.jpg'], 'PNG, JPG e WebP importados; espaços do nome viram hífen');
const enorme = lista.find((i) => i.nome === 'enorme.png');
v.ok(Math.max(enorme.w, enorme.h) <= 2400 && Math.abs(enorme.w / enorme.h - 5 / 3) < 0.01, `imagem de 5000×3000 reduzida mantendo a proporção (${enorme.w}×${enorme.h})`);
await p.screenshot({ path: `${dest}/01-imagens.png` });
// inválidas
await p.locator('input[type=file][accept*="png"]').setInputFiles([`${dest}/corrompida.png`, `${dest}/texto.png`, `${dest}/vetor.svg`]);
await p.waitForTimeout(1200);
v.ok(/Não consegui ler: .*corrompida\.png.*texto\.png/.test(await status(p)), `imagens inválidas recusadas com mensagem: "${await status(p)}"`);
lista = await sb(p, 'dominio', 'listarImagens');
v.ok(!lista.some((i) => /corrompida|texto|vetor/.test(i.nome)), 'nenhuma imagem inválida entra na biblioteca');
// mesma imagem com outra caixa substitui a anterior
writeFileSync(`${dest}/ciclo-da-água.png`, gradiente(100, 60));
await p.locator('input[type=file][accept*="png"]').setInputFiles(`${dest}/ciclo-da-água.png`);
await p.waitForTimeout(800);
lista = await sb(p, 'dominio', 'listarImagens');
v.igual(lista.filter((i) => i.nome.toLowerCase() === 'ciclo-da-água.png').length, 1, 'mesmo nome com outra caixa não duplica');
// usar no roteiro e excluir
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# I\nProfessor entra pela esquerda andando.\n'));
await p.locator('.item-imagem', { hasText: 'foto.jpg' }).getByRole('button', { name: 'Inserir no roteiro' }).click();
const ro = await roteiroDe(p);
v.ok(ro.includes('mostra a imagem foto.jpg no quadro'), `frase inserida: ${ro.split('\n').pop()}`);
v.igual(await p.evaluate((t) => window.__sb.dominio.parseRoteiro(t).avisos, ro), [], 'a frase da imagem não gera avisos');
await p.locator('.item-imagem', { hasText: 'foto.jpg' }).getByRole('button', { name: 'Excluir' }).click();
await p.waitForTimeout(600);
v.ok(!(await sb(p, 'dominio', 'listarImagens')).some((i) => i.nome === 'foto.jpg'), 'imagem excluída sai da lista');
v.ok((await p.locator('.roteiro .avisos').innerText().catch(() => '')).length > 0 || (await p.locator('.roteiro .badge').innerText()).includes('aviso'), `roteiro avisa da imagem que sumiu: "${await p.locator('.roteiro .badge').innerText()}"`);
// persistência
await p.reload(); await p.waitForFunction(PRONTO, null, { timeout: 90000 }); await p.waitForTimeout(1200);
v.igual((await sb(p, 'dominio', 'listarImagens')).map((i) => i.nome).sort(), ['ciclo-da-água.png', 'enorme.png', 'figura.webp'], 'as imagens voltam depois de recarregar (sem a excluída e sem duplicata)');

// =================================================================== R3: áudio
console.log('R3 áudio');
writeFileSync(`${dest}/fala1.wav`, wav(3, 300)); writeFileSync(`${dest}/Fala 2.WAV`, wav(1.5, 500)); writeFileSync(`${dest}/ruim.wav`, 'isto não é áudio'); writeFileSync(`${dest}/curto.wav`, Buffer.from('RIFF'));
await p.getByRole('button', { name: 'Áudio', exact: true }).click();
await p.locator('input[type=file][accept*="audio"]').setInputFiles([`${dest}/fala1.wav`, `${dest}/Fala 2.WAV`]);
await p.waitForTimeout(1500);
let audios = await sb(p, 'dominio', 'listarAudios');
v.igual(audios.map((a) => [a.nome, Math.round(a.duracao * 10) / 10]), [['Fala 2.WAV', 1.5], ['fala1.wav', 3]], 'durações lidas dos arquivos');
v.ok(audios.every((a) => a.envelope && a.envelope.length > 10), 'envelope de volume calculado (a boca acompanha a voz)');
await p.locator('input[type=file][accept*="audio"]').setInputFiles([`${dest}/ruim.wav`, `${dest}/curto.wav`]);
await p.waitForTimeout(1200);
v.ok(/Não consegui ler: ruim\.wav, curto\.wav/.test(await status(p)), `áudios inválidos recusados: "${await status(p)}"`);
v.igual((await sb(p, 'dominio', 'listarAudios')).length, 2, 'nenhum áudio inválido entra na lista');
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# A\nProfessor entra pela esquerda andando.\nProfessor diz "Oi".'));
await p.locator('.item-audio', { hasText: 'fala1.wav' }).getByRole('button', { name: 'Narrar a última fala' }).click();
const ra = await roteiroDe(p);
v.ok(ra.includes('[áudio: fala1.wav]'), 'etiqueta de narração inserida');
const durFala = await p.evaluate((t) => { const d = window.__sb.dominio, tl = d.construirTimeline(d.parseRoteiro(t)); return tl.eventos.find((e) => e.acao.tipo === 'fala').fim - tl.eventos.find((e) => e.acao.tipo === 'fala').inicio; }, ra);
v.ok(Math.abs(durFala - (3 + 0.25)) < 0.1, `a fala passa a durar o tempo do áudio + folga (${durFala.toFixed(2)} s)`);
await p.locator('.item-audio', { hasText: 'Fala 2.WAV' }).getByRole('button', { name: 'Excluir' }).click();
await p.waitForTimeout(500);
v.igual((await sb(p, 'dominio', 'listarAudios')).map((a) => a.nome), ['fala1.wav'], 'excluir áudio');
await p.reload(); await p.waitForFunction(PRONTO, null, { timeout: 90000 }); await p.waitForTimeout(1000);
v.igual((await sb(p, 'dominio', 'listarAudios')).map((a) => a.nome), ['fala1.wav'], 'o áudio volta depois de recarregar');
await p.screenshot({ path: `${dest}/02-audio.png` });

// =================================================================== R4: projeto completo (ida e volta num app limpo)
console.log('R4 projeto completo');
// monta um estado rico: personagem novo com sprites, clipe, expressão, estilos, fontes, formato, imagem, áudio e roteiro
writeFileSync(`${dest}/pacote-ficha.zip`, zip({ 'marta/ficha.json': JSON.stringify({ nome: 'Tia Marta', apelidos: ['tia'], idade: '45 anos', descricao: 'Cozinheira', altura: 500, modeloPalito: 'mae', corPele: '#c68642' }), 'marta/pose_parado.png': sprite(200, 400), 'marta/rosto_feliz.png': rosto(), 'marta/pose_andar_1.png': sprite(200, 400, [200, 0, 0]), 'marta/pose_andar_2.png': sprite(200, 400, [0, 200, 0]) }));
await abrirArquivo(p, 'Arquivo', 'Importar pacote de sprites (.zip)…', `${dest}/pacote-ficha.zip`);
await p.locator('[aria-label="Importar pacote de sprites"]').getByRole('button', { name: /Importar|Corrija/ }).click();
await p.waitForTimeout(1500);
await p.evaluate(() => {
  const { dominio: d, store } = window.__sb;
  d.definirClipesPersonalizados([{ ator: 'marta', id: 'abraco', nome: 'abraço', categoria: 'Movimento', loop: true, estilo: 'ambos', passos: [{ tags: ['parado'], dur: 1, mov: 'balancar', amp: 4 }] }]);
  d.definirExpressoesBoneco([{ ator: 'marta', nome: 'saudade', quadros: [{ olho: 'meia', sobr: 5, boca: 'triste' }] }]);
  store.getState().setRoteiro('[papéis: professor=Tia Marta, aluno=BetaSon]\n\n# Projeto\nProfessor entra pela esquerda andando. Professor faz o clipe abraco.\nProfessor mostra a imagem figura.webp no quadro. Professor diz "Oi!". [áudio: fala1.wav]\n');
  store.getState().set({ formato: '9:16', fonteLousa: 'caveat', fonteFala: 'kalam', skinPadrao: 'stickman', skins: { betason: 'chibi', marta: 'stickman' } });
});
// grava clipes/expressões no armazenamento pelos mesmos caminhos da interface
await p.evaluate(() => { const d = window.__sb.dominio; localStorage.setItem('stickboard.clipes.v1', JSON.stringify(d.clipesPersonalizados())); localStorage.setItem('stickboard.expressoes.v1', JSON.stringify(d.expressoesBoneco())); });
const antes = await p.evaluate(async () => {
  const { dominio: d, store, cena, personagens } = window.__sb, s = store.getState();
  return {
    roteiro: s.roteiro, formato: s.formato, fontes: [s.fonteLousa, s.fonteFala], skins: [s.skinPadrao, s.skins],
    marta: { ...d.ATORES['marta'] }, spritesMarta: cena.listarSprites('marta'),
    imagens: d.listarImagens().map((i) => [i.nome, i.w, i.h]), audios: d.listarAudios().map((a) => [a.nome, Math.round(a.duracao * 100)]),
    clipes: d.clipesPersonalizados('marta').map((c) => c.id), expressoes: d.expressoesDe('marta').filter((e) => e === 'saudade'),
    spritesSalvos: (await personagens.lerEntradasSalvas()).map((e) => `${e.personagem}|${e.info.tipo}|${e.info.tags[0]}|${e.info.variante ?? ''}`).sort(),
  };
});
const [dlp] = await Promise.all([p.waitForEvent('download'), (async () => { await p.getByText('Arquivo').first().click(); await p.getByText('Salvar projeto completo (.zip)…').click(); })()]);
await dlp.saveAs(`${dest}/projeto.zip`);
const zp = unzipSync(new Uint8Array(readFileSync(`${dest}/projeto.zip`)));
const nomesZip = Object.keys(zp);
console.log('  projeto.zip:', (readFileSync(`${dest}/projeto.zip`).length / 1024).toFixed(0), 'KB;', nomesZip.length, 'arquivos');
v.ok(nomesZip.includes('roteiro.txt') && nomesZip.includes('projeto.json') && nomesZip.includes('animacoes.json'), 'zip tem roteiro, projeto e animações');
v.ok(nomesZip.some((n) => n.startsWith('sprites/marta/pose_parado')) && nomesZip.includes('audios/fala1.wav') && nomesZip.includes('imagens/figura.webp'), 'zip leva sprites, áudio e imagem');
// abre num app limpo
const ctx2 = await b.newContext({ viewport: { width: 1600, height: 900 } });
const q = await abrir(ctx2, true);
await q.evaluate(() => window.__sb.store.getState().setRoteiro('# Meu texto anterior\nProfessor acena.'));
await q.waitForTimeout(1200); // edições em menos de 0,8 s viram um passo só no histórico
await abrirArquivo(q, 'Arquivo', 'Abrir projeto (.zip)…', `${dest}/projeto.zip`);
await q.waitForTimeout(2500);
v.ok(/Projeto aberto: 1 personagem\(ns\), 4 sprites, 1 áudio\(s\)/.test(await status(q)), `mensagem: "${await status(q)}"`);
const depois = await q.evaluate(async () => {
  const { dominio: d, store, cena, personagens } = window.__sb, s = store.getState();
  return {
    roteiro: s.roteiro, formato: s.formato, fontes: [s.fonteLousa, s.fonteFala], skins: [s.skinPadrao, s.skins],
    marta: { ...d.ATORES['marta'] }, spritesMarta: cena.listarSprites('marta'),
    imagens: d.listarImagens().map((i) => [i.nome, i.w, i.h]), audios: d.listarAudios().map((a) => [a.nome, Math.round(a.duracao * 100)]),
    clipes: d.clipesPersonalizados('marta').map((c) => c.id), expressoes: d.expressoesDe('marta').filter((e) => e === 'saudade'),
    spritesSalvos: (await personagens.lerEntradasSalvas()).map((e) => `${e.personagem}|${e.info.tipo}|${e.info.tags[0]}|${e.info.variante ?? ''}`).sort(),
  };
});
for (const k of Object.keys(antes)) { const o = JSON.stringify(k === 'spritesMarta' ? { ...antes[k], poses: [...antes[k].poses].sort() } : antes[k]), n = JSON.stringify(k === 'spritesMarta' ? { ...depois[k], poses: [...depois[k].poses].sort() } : depois[k]); v.ok(o === n, `projeto: "${k}" idêntico depois de abrir${o === n ? '' : `\n     antes:  ${o}\n     depois: ${n}`}`); }
v.igual(await q.evaluate((t) => window.__sb.dominio.parseRoteiro(t).avisos, depois.roteiro), [], 'o roteiro do projeto aberto roda sem avisos (personagem, clipe, imagem e áudio resolvidos)');
await q.evaluate(() => window.__sb.store.getState().set({ t: 0 }));
await q.keyboard.press('Control+z'); // desfazer volta ao texto de antes de abrir o projeto
await q.waitForTimeout(300);
v.ok((await roteiroDe(q)).includes('Meu texto anterior'), 'Ctrl+Z desfaz a abertura do projeto (o texto anterior volta)');
await q.screenshot({ path: `${dest}/03-projeto-aberto.png` });
// abrir de novo não duplica nada
await abrirArquivo(q, 'Arquivo', 'Abrir projeto (.zip)…', `${dest}/projeto.zip`);
await q.waitForTimeout(2000);
const dup = await q.evaluate(() => { const d = window.__sb.dominio; return [d.listarImagens().length, d.listarAudios().length, d.clipesPersonalizados('marta').length, Object.values(d.ATORES).filter((a) => a.nome === 'Tia Marta').length]; });
v.igual(dup, [3, 1, 1, 1], 'abrir o mesmo projeto duas vezes não duplica imagens, áudios, clipes nem personagens');

// arquivos que não são projeto
writeFileSync(`${dest}/so-sprites.zip`, zip({ 'betason/pose_parado.png': sprite(50, 50) }));
const roteiroAntes = await roteiroDe(q);
await abrirArquivo(q, 'Arquivo', 'Abrir projeto (.zip)…', `${dest}/so-sprites.zip`);
v.ok(/Não consegui abrir o projeto: Este arquivo não parece um projeto/.test(await status(q)), `zip de sprites aberto como projeto: "${await status(q)}"`);
writeFileSync(`${dest}/quebrado.zip`, readFileSync(`${dest}/projeto.zip`).subarray(0, 300));
await abrirArquivo(q, 'Arquivo', 'Abrir projeto (.zip)…', `${dest}/quebrado.zip`);
v.ok(/Não consegui abrir o projeto/.test(await status(q)), `zip truncado: "${await status(q)}"`);
v.igual(await roteiroDe(q), roteiroAntes, 'abrir arquivo inválido não mexe no roteiro aberto');
// projeto sem nada importado
const ctx3 = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const r = await abrir(ctx3, true);
const [dlv] = await Promise.all([r.waitForEvent('download'), (async () => { await r.getByText('Arquivo').first().click(); await r.getByText('Salvar projeto completo (.zip)…').click(); })()]);
await dlv.saveAs(`${dest}/projeto-vazio.zip`);
v.ok(readFileSync(`${dest}/projeto-vazio.zip`).length < 5000, 'projeto sem arquivos importados é pequeno');
await abrirArquivo(r, 'Arquivo', 'Abrir projeto (.zip)…', `${dest}/projeto-vazio.zip`);
v.ok(/Projeto aberto: 0 personagem/.test(await status(r)), `projeto vazio abre: "${await status(r)}"`);
await ctx3.close(); await ctx2.close();

for (const pg of [p]) v.ok(pg.erros.length === 0, `sem erros de página: ${pg.erros.join(' | ')}`);
await b.close();
process.exit(v.fim('revisão de importação e arquivos'));