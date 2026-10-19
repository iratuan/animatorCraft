// Revisão de lançamento — CLIPES E EXPRESSÕES: criar digitando como gente, validar, editar, excluir, usar no roteiro, persistir e levar em zip.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { criarVerificador } from './util-png.mjs';

const dest = 'evidencias/38-revisao-lancamento/clipes';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const b = await chromium.launch({ channel: 'msedge', headless: true });

async function abrir(ctx, ator = 'betason') {
  const p = await ctx.newPage();
  p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
  await p.goto(`${BASE}?ator=${ator}&teste=1#/editor`);
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(400);
  return p;
}
const guardado = (p, chave) => p.evaluate((c) => JSON.parse(localStorage.getItem(c) ?? '[]'), chave);
const clipesGuardados = async (p) => (await guardado(p, 'stickboard.clipes.v1')).map((c) => `${c.ator}:${c.id}:${c.estilo}`).sort();
const exprGuardadas = async (p) => (await guardado(p, 'stickboard.expressoes.v1')).map((c) => `${c.ator}:${c.nome}`).sort();
const dominio = (p, fn, ...args) => p.evaluate(([f, a]) => window.__sb.dominio[f](...a), [fn, args]);
const avisos = (p, t) => p.evaluate((x) => window.__sb.dominio.parseRoteiro(x).avisos, t);
const msg = (p) => p.locator('.msg-anim').innerText().catch(() => '');
const abrirModal = async (p, nome = 'BetaSon') => { await p.getByText('Arquivo').first().click(); await p.getByText(`Expressões e clipes de ${nome}…`).click(); await p.waitForSelector('[aria-label="Expressões e clipes do personagem"]'); };
const fechar = async (p) => { await p.locator('.modal-botoes').last().getByRole('button', { name: 'Fechar' }).click(); await p.waitForTimeout(200); };

const ctx = await b.newContext({ viewport: { width: 1700, height: 950 }, acceptDownloads: true });
const p = await abrir(ctx);
await p.evaluate(() => localStorage.clear());
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(400);

// =================================================================== C1: digitar o nome letra por letra não deixa fantasmas
console.log('C1 digitação letra por letra');
await abrirModal(p);
await p.getByRole('button', { name: '＋ Nova expressão' }).click();
await p.getByLabel('Nome da expressão', { exact: true }).pressSequentially('Com Sono', { delay: 25 });
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.igual(await exprGuardadas(p), ['betason:com-sono'], 'só a expressão final foi gravada (sem "c", "co", "com"…)');
v.ok((await dominio(p, 'expressoesDe', 'betason')).filter((e) => e.startsWith('c')).sort().join() === 'com-sono,confusa', 'registro em memória sem fantasmas');
await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).pressSequentially('Tchau Longo', { delay: 25 });
await p.getByRole('button', { name: 'Salvar clipe' }).click();
v.igual(await clipesGuardados(p), ['betason:tchau-longo:ambos'], 'só o clipe final foi gravado');
v.ok(/tchau-longo/.test(await msg(p)), 'mensagem mostra o nome usado no roteiro');
await p.screenshot({ path: `${dest}/01-clipe-salvo.png` });

// =================================================================== C2: validações
console.log('C2 validações');
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).fill('');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
v.ok(/Dê um nome/.test(await msg(p)), 'clipe sem nome é recusado');
await p.getByLabel('Nome do clipe', { exact: true }).fill('!!! ???');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
v.ok(/Dê um nome/.test(await msg(p)), 'nome só de símbolos é recusado');
await p.getByLabel('Nome do clipe', { exact: true }).fill('tchau longo');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
v.ok(/Já existe o clipe/.test(await msg(p)), `nome repetido no mesmo estilo é recusado ("${await msg(p)}")`);
await p.getByLabel('Estilo do clipe', { exact: true }).selectOption('chibi');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
v.igual(await clipesGuardados(p), ['betason:tchau-longo:ambos', 'betason:tchau-longo:chibi'], 'mesmo nome em estilo diferente é aceito');
// passo único não pode ser removido; limite de 24 passos
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
v.ok(await p.getByLabel('Remover passo 1', { exact: true }).isDisabled(), 'o único passo não pode ser removido');
for (let i = 0; i < 30; i++) { const bt = p.getByRole('button', { name: '＋ Passo' }); if (await bt.count()) await bt.click(); }
v.igual(await p.locator('.passo-clipe').count(), 24, 'no máximo 24 passos');
v.ok(await p.getByRole('button', { name: '＋ Passo' }).count() === 0, 'botão de passo some no limite');
// valores extremos nos campos
await p.getByLabel('Duração do passo 1', { exact: true }).fill('9999'); v.igual(await p.getByLabel('Duração do passo 1', { exact: true }).inputValue(), '10', 'duração limitada a 10 s');
await p.getByLabel('Duração do passo 1', { exact: true }).fill('-4'); v.ok(Number(await p.getByLabel('Duração do passo 1', { exact: true }).inputValue()) >= 0.1, 'duração negativa vira o mínimo');
await p.getByLabel('Intensidade do passo 1', { exact: true }).fill('99'); v.ok(Number(await p.getByLabel('Intensidade do passo 1', { exact: true }).inputValue()) <= 5, 'intensidade limitada a 5×');
await p.getByLabel('Movimento do passo 1', { exact: true }).selectOption('girar');
v.ok(await p.getByLabel('Intensidade do passo 1', { exact: true }).isDisabled(), 'movimento sem intensidade desabilita o campo');
// mover passos
await p.getByLabel('Sprite do passo 1', { exact: true }).selectOption({ index: 1 });
const sprite1 = await p.getByLabel('Sprite do passo 1', { exact: true }).inputValue();
await p.getByLabel('Descer passo 1', { exact: true }).click();
v.igual(await p.getByLabel('Sprite do passo 2', { exact: true }).inputValue(), sprite1, 'descer o passo troca de lugar com o vizinho');
await p.getByLabel('Subir passo 2', { exact: true }).click();
v.igual(await p.getByLabel('Sprite do passo 1', { exact: true }).inputValue(), sprite1, 'subir devolve');
await p.screenshot({ path: `${dest}/02-24-passos.png` });
// cancelar e fechar sem salvar não deixam rascunho
await p.getByLabel('Nome do clipe', { exact: true }).fill('rascunho');
await p.getByRole('button', { name: 'Cancelar' }).click();
v.ok(!(await clipesGuardados(p)).some((c) => c.includes('rascunho')), 'cancelar não grava o rascunho');
v.ok(!(await dominio(p, 'clipesPersonalizados', 'betason')).some((c) => c.id.startsWith('r')), 'cancelar limpa o rascunho da memória');
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).pressSequentially('sai sem salvar', { delay: 15 });
await fechar(p);
v.ok(!(await dominio(p, 'clipesPersonalizados', 'betason')).some((c) => c.id.startsWith('sai')), 'fechar a janela no meio da edição limpa o rascunho da memória');
v.igual((await clipesGuardados(p)).length, 2, 'e não grava nada');

// =================================================================== C3: expressões — quadros e nomes
console.log('C3 expressões');
await abrirModal(p);
await p.getByRole('button', { name: '＋ Nova expressão' }).click();
await p.getByLabel('Nome da expressão', { exact: true }).fill('feliz');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.ok(/já existe/.test(await msg(p)), 'nome de expressão padrão é recusado');
await p.getByLabel('Nome da expressão', { exact: true }).fill('com sono');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.ok(/já existe/.test(await msg(p)), 'nome repetido de expressão do boneco é recusado');
await p.getByLabel('Nome da expressão', { exact: true }).fill('');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.ok(/Dê um nome/.test(await msg(p)), 'expressão sem nome é recusada');
for (let i = 0; i < 6; i++) { const bt = p.getByRole('button', { name: '＋ Quadro de animação' }); if (await bt.count()) await bt.click(); }
v.igual(await p.locator('.quadro-expr').count(), 4, 'no máximo 4 quadros de animação');
await p.getByLabel('Sobrancelhas do quadro 1', { exact: true }).fill('14'); await p.getByLabel('Boca do quadro 2', { exact: true }).selectOption('o'); await p.getByLabel('Olhos do quadro 3', { exact: true }).selectOption('estreito');
await p.getByLabel('Nome da expressão', { exact: true }).fill('susto animado');
await p.waitForTimeout(800);
v.ok(await p.locator('.previa-animacao canvas').count() === 1, 'a prévia da expressão aparece');
await p.screenshot({ path: `${dest}/03-expressao-4-quadros.png` });
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.igual(await exprGuardadas(p), ['betason:com-sono', 'betason:susto-animado'], 'expressões gravadas');
const susto = (await guardado(p, 'stickboard.expressoes.v1')).find((e) => e.nome === 'susto-animado');
v.igual([susto.quadros.length, susto.quadros[0].sobr, susto.quadros[1].boca, susto.quadros[2].olho], [4, 14, 'o', 'estreito'], 'os quadros guardam o que foi escolhido');
// editar renomeando
await p.locator('.lista-anim li', { hasText: 'susto-animado' }).getByRole('button', { name: 'Editar boneco' }).click();
await p.getByLabel('Nome da expressão', { exact: true }).fill('susto grande');
await p.getByRole('button', { name: 'Salvar expressão' }).click();
v.igual(await exprGuardadas(p), ['betason:com-sono', 'betason:susto-grande'], 'renomear troca o nome sem deixar o antigo');
await p.locator('.lista-anim li', { hasText: 'com-sono' }).getByRole('button', { name: 'Excluir' }).click();
v.igual(await exprGuardadas(p), ['betason:susto-grande'], 'excluir expressão');
await fechar(p);

// =================================================================== C4: usar no roteiro
console.log('C4 usar no roteiro');
await abrirModal(p); await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.locator('.lista-anim li[data-clipe="tchau-longo"]').first().getByRole('button', { name: 'Prévia' }).click();
await p.waitForTimeout(900);
v.ok(await p.locator('.previa-animacao canvas').count() === 1, 'prévia do clipe aparece');
await p.locator('.lista-anim li[data-clipe="tchau-longo"]').first().getByRole('button', { name: 'Inserir no roteiro' }).click();
await fechar(p);
const roteiro = await p.locator('#campo-roteiro').inputValue();
v.ok(roteiro.includes('BetaSon faz o clipe tchau-longo.'), 'frase do clipe inserida no roteiro');
v.igual(await avisos(p, roteiro), [], 'o roteiro com o clipe não tem avisos');
// nomes que são palavras de comando
await abrirModal(p); await p.getByRole('button', { name: 'Clipes de animação' }).click();
for (const nome of ['pausa', 'apaga']) { await p.getByRole('button', { name: '＋ Novo clipe' }).click(); await p.getByLabel('Nome do clipe', { exact: true }).fill(nome); await p.getByRole('button', { name: 'Salvar clipe' }).click(); }
await fechar(p);
const textoPalavras = '# C\nBetaSon entra pela esquerda andando. BetaSon faz o clipe pausa por 2 segundos. BetaSon faz o clipe apaga.';
v.igual(await avisos(p, textoPalavras), [], 'clipes chamados "pausa" e "apaga" funcionam como clipes');
const acoes = await p.evaluate((t) => window.__sb.dominio.parseRoteiro(t).cenas[0].acoes.map((a) => a.tipo + (a.clipe ? ':' + a.clipe : '')), textoPalavras);
v.igual(acoes, ['entrar', 'pose:pausa', 'pose:apaga'], 'e não viram esperar/apagar quadro');
// duração do clipe reflete na linha do tempo
const dur = await p.evaluate(() => { const d = window.__sb.dominio; const t = d.construirTimeline(d.parseRoteiro('# C\nBetaSon entra pela esquerda andando. BetaSon faz o clipe tchau-longo.')); return { total: t.duracao, clip: d.acharClipe('betason', 'tchau-longo') && d.duracaoDoClipe(d.acharClipe('betason', 'tchau-longo')) }; });
v.ok(dur.total >= 1.6 + dur.clip - 0.01, `a linha do tempo soma a duração do clipe (${dur.total.toFixed(2)} s = entrada + ${dur.clip.toFixed(2)} s)`);

// =================================================================== C5: clipe que substitui uma pose; estilo
console.log('C5 substituir pose e estilo');
await abrirModal(p); await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.getByRole('button', { name: '＋ Novo clipe' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).fill('minha danca');
await p.getByLabel('Pose que o clipe substitui', { exact: true }).selectOption('danca_atual');
await p.getByLabel('Estilo do clipe', { exact: true }).selectOption('stickman');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
await fechar(p);
const subs = await p.evaluate(() => { const d = window.__sb.dominio; return { stick: d.clipeDaPose('danca_atual', 'betason', 'stickman').id, chibi: d.clipeDaPose('danca_atual', 'betason', 'chibi').id, outro: d.clipeDaPose('danca_atual', 'erika', 'stickman').id, achaStick: !!d.acharClipe('betason', 'minha-danca', 'stickman'), achaChibi: !!d.acharClipe('betason', 'minha-danca', 'chibi') }; });
v.igual(subs, { stick: 'minha-danca', chibi: 'danca_atual', outro: 'danca_atual', achaStick: true, achaChibi: false }, 'substitui só no estilo e no personagem escolhidos');

// =================================================================== C6: editar, renomear e excluir clipes
console.log('C6 editar e excluir');
await abrirModal(p); await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.locator('.lista-anim li[data-clipe="pausa"]').getByRole('button', { name: 'Editar' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).fill('pausinha');
await p.getByLabel('Duração do passo 1', { exact: true }).fill('1.5');
await p.getByRole('button', { name: 'Salvar clipe' }).click();
const g = await clipesGuardados(p);
v.ok(g.includes('betason:pausinha:ambos') && !g.includes('betason:pausa:ambos'), 'renomear um clipe troca o nome sem duplicar');
v.ok((await guardado(p, 'stickboard.clipes.v1')).find((c) => c.id === 'pausinha').passos[0].dur === 1.5, 'a duração editada foi gravada');
await p.locator('.lista-anim li[data-clipe="apaga"]').getByRole('button', { name: 'Excluir' }).click();
v.ok(!(await clipesGuardados(p)).includes('betason:apaga:ambos'), 'excluir clipe');
await p.locator('.lista-anim li[data-clipe="pausinha"]').getByRole('button', { name: 'Editar' }).click();
await p.getByLabel('Nome do clipe', { exact: true }).fill('mudou');
await p.getByRole('button', { name: 'Cancelar' }).click();
v.ok((await clipesGuardados(p)).includes('betason:pausinha:ambos') && !(await clipesGuardados(p)).includes('betason:mudou:ambos'), 'cancelar a edição preserva o clipe original');
await p.screenshot({ path: `${dest}/04-lista-de-clipes.png` });
await fechar(p);

// =================================================================== C7: persistência, zip de sprites e projeto
console.log('C7 persistência e zips');
const antes = { c: await clipesGuardados(p), e: await exprGuardadas(p) };
await p.reload(); await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 }); await p.waitForTimeout(500);
v.igual({ c: await clipesGuardados(p), e: await exprGuardadas(p) }, antes, 'clipes e expressões voltam depois de recarregar');
v.ok((await dominio(p, 'expressoesDe', 'betason')).includes('susto-grande'), 'a expressão do boneco volta ao registro do roteiro');
v.igual(await avisos(p, '# C\nBetaSon entra pela esquerda andando. BetaSon faz cara de susto-grande. BetaSon faz o clipe pausinha.'), [], 'o roteiro continua entendendo depois de recarregar');
// zip de sprites leva animacoes.json
await p.getByText('Arquivo').first().click(); await p.getByText('Editar / exportar sprites dos personagens…').click();
await p.waitForSelector('[aria-label="Editor de sprites do personagem"]');
const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Exportar BetaSon/ }).click()]);
await dl.saveAs(`${dest}/betason.zip`);
await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).click().catch(() => {});
const zbet = unzipSync(new Uint8Array(readFileSync(`${dest}/betason.zip`)));
const anim = JSON.parse(new TextDecoder().decode(zbet['betason/animacoes.json']));
v.ok(anim.clipes.length === antes.c.length && anim.expressoes.length === antes.e.length, 'o zip de sprites leva clipes e expressões');
// projeto completo
await p.getByText('Arquivo').first().click();
const [dl2] = await Promise.all([p.waitForEvent('download'), p.getByText('Salvar projeto completo (.zip)…').click()]);
await dl2.saveAs(`${dest}/projeto.zip`);
// app limpo: abre o zip de sprites (só animações) e o projeto
const ctx2 = await b.newContext({ viewport: { width: 1600, height: 900 } });
const q = await abrir(ctx2);
{ const [fc] = await Promise.all([q.waitForEvent('filechooser'), (async () => { await q.getByText('Arquivo').first().click(); await q.getByText('Importar pacote de sprites (.zip)…').click(); })()]); await fc.setFiles(`${dest}/betason.zip`); await q.waitForTimeout(500); }
v.ok(await q.locator('[data-animacoes]').count() === 1, 'o importador mostra as animações do pacote');
await q.locator('[aria-label="Importar pacote de sprites"]').getByRole('button', { name: /Importar|Corrija/ }).click();
await q.waitForTimeout(1500);
v.igual({ c: await clipesGuardados(q), e: await exprGuardadas(q) }, antes, 'importar o zip de sprites num app limpo traz clipes e expressões');
await ctx2.close();
const ctx3 = await b.newContext({ viewport: { width: 1600, height: 900 } });
const r = await abrir(ctx3);
{ const [fc] = await Promise.all([r.waitForEvent('filechooser'), (async () => { await r.getByText('Arquivo').first().click(); await r.getByText('Abrir projeto (.zip)…').click(); })()]); await fc.setFiles(`${dest}/projeto.zip`); await r.waitForTimeout(2500); }
v.igual({ c: await clipesGuardados(r), e: await exprGuardadas(r) }, antes, 'abrir o projeto num app limpo traz clipes e expressões');
v.ok((await r.locator('#campo-roteiro').inputValue()).includes('tchau-longo'), 'e o roteiro do projeto');
await ctx3.close();

// =================================================================== C8: clipes de outros personagens e excluir personagem
console.log('C8 outro personagem e exclusão');
await p.evaluate(() => { localStorage.setItem('stickboard.roteiro.v2', ''); });
await p.getByText('Arquivo').first().click(); await p.getByText('Novo personagem…').click();
await p.getByPlaceholder('ex.: Tia Marta').fill('Zeca'); await p.getByRole('button', { name: 'Criar personagem' }).click();
await abrirModal(p, 'Zeca'); await p.getByRole('button', { name: 'Clipes de animação' }).click();
await p.getByRole('button', { name: '＋ Novo clipe' }).click(); await p.getByLabel('Nome do clipe', { exact: true }).fill('pulinho'); await p.getByRole('button', { name: 'Salvar clipe' }).click(); await fechar(p);
v.ok((await clipesGuardados(p)).includes('zeca:pulinho:ambos') && (await clipesGuardados(p)).includes('betason:tchau-longo:ambos'), 'clipes de cada personagem ficam separados');
v.ok((await avisos(p, '# C\nBetaSon entra pela esquerda andando. BetaSon faz o clipe pulinho.')).length === 1, 'clipe de um personagem não vale para outro');
p.once('dialog', (d) => d.accept());
await p.getByText('Arquivo').first().click(); await p.getByText('Editar / exportar sprites dos personagens…').click(); await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).click().catch(() => {});
await p.evaluate(() => { window.__sb.store.getState().set({ fichaPersonagem: { id: 'zeca' } }); });
await p.getByRole('button', { name: 'Excluir' }).click(); await p.waitForTimeout(800);
v.ok(!(await clipesGuardados(p)).some((c) => c.startsWith('zeca')), 'excluir o personagem leva os clipes dele');
v.ok((await clipesGuardados(p)).includes('betason:tchau-longo:ambos'), 'e preserva os dos outros');

v.ok(p.erros.length === 0, `sem erros de página: ${p.erros.join(' | ')}`);
await b.close();
process.exit(v.fim('revisão de clipes e expressões'));
