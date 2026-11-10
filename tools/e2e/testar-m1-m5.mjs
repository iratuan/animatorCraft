// M1 (chips do roteiro quebram linha, nenhum cortado), M3 (ícones de linha no lugar de emojis de formato),
// M4 (mensagem do app aparece num aviso sobre a tela), M5 (exportar com erro oferece Corrigir / Exportar / Cancelar).
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/49-chips-icones-avisos-exportacao';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };
const EMOJI = /\p{Extended_Pictographic}/u;

// 1) tela inicial: filtros de formato com ícone de linha, sem emoji
await p.goto('http://127.0.0.1:5173/#/');
await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/#/');
await p.waitForTimeout(1600);
const filtros = p.locator('button', { hasText: 'Podcasts' }).first();
conferir(await filtros.count() === 1, 'a tela inicial tem o filtro "Podcasts"');
conferir(await filtros.locator('svg').count() === 1, 'o filtro "Podcasts" tem um ícone de linha (svg)');
conferir(!EMOJI.test(await filtros.innerText()), 'o filtro "Podcasts" não usa emoji');
const emojisNaInicial = (await p.locator('.home-filtros, body').first().innerText()).match(/\p{Extended_Pictographic}/gu) ?? [];
conferir(emojisNaInicial.length === 0, `a tela inicial não tem emoji nos formatos (${emojisNaInicial.length} encontrados)`);
await p.screenshot({ path: `${dest}/01-tela-inicial-icones.png` });

// 2) editor com roteiro que tem frases com erro
const roteiro = '# Chips e avisos\n\nProfessor acena.\nProfessor pulla.\nErik fala "oi".\nAluno dança.\n';
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(2000);

// M1: todos os chips inteiros dentro da faixa, sem corte
const chips = await p.evaluate(() => {
  const faixa = document.querySelector('.chips-roteiro');
  if (!faixa) return null;
  const r = faixa.getBoundingClientRect();
  const botoes = [...faixa.querySelectorAll('button')];
  return { total: botoes.length, todos: botoes.every((x) => { const q = x.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; }) };
});
conferir(chips && chips.todos, `os ${chips?.total ?? 0} chips do roteiro aparecem inteiros em 1280 px (quebram linha, nenhum é cortado)`);
await p.screenshot({ path: `${dest}/02-chips-quebrando-linha-1280.png` });

// M5: exportar com erro abre o diálogo com as três escolhas
await p.getByRole('button', { name: /Exportar MP4/ }).first().click();
await p.waitForTimeout(400);
const dlg = p.locator('[role="dialog"][aria-label="Exportar com frases que não serão executadas"]');
conferir(await dlg.count() === 1, 'exportar com erro abre o diálogo de confirmação dentro do app');
conferir(await dlg.getByRole('button', { name: 'Corrigir primeira frase' }).count() === 1 && await dlg.getByRole('button', { name: 'Exportar mesmo assim' }).count() === 1 && await dlg.getByRole('button', { name: 'Cancelar' }).count() === 1, 'o diálogo oferece Corrigir primeira frase, Exportar mesmo assim e Cancelar');
const listaErros = await dlg.locator('.lista-erros li').allInnerTexts();
conferir(listaErros.length === 2 && listaErros.some((t) => t.includes('Erik')), `o diálogo lista as frases com erro (${listaErros.length})`);
await p.screenshot({ path: `${dest}/03-dialogo-exportar-com-erro.png` });

// M5: "Corrigir primeira frase" leva o cursor até o trecho e não exporta
await dlg.getByRole('button', { name: 'Corrigir primeira frase' }).click();
await p.waitForTimeout(400);
const cursor = await p.evaluate(() => { const t = document.querySelector('#campo-roteiro'); return { ini: t.selectionStart, fim: t.selectionEnd, texto: t.value.slice(t.selectionStart, t.selectionEnd) }; });
conferir(cursor.texto.startsWith('Professor pulla') || cursor.texto.startsWith('Erik fala'), `"Corrigir primeira frase" seleciona o trecho com erro (selecionado: "${cursor.texto.slice(0, 25)}")`);
conferir(await dlg.count() === 0, 'o diálogo fecha ao escolher corrigir');
await p.screenshot({ path: `${dest}/04-corrigir-leva-ao-trecho.png` });

// M5: Cancelar não exporta e a mensagem aparece no aviso sobre a tela (M4)
await p.getByRole('button', { name: /Exportar MP4/ }).first().click();
await p.waitForTimeout(300);
await dlg.getByRole('button', { name: 'Cancelar' }).click();
await p.waitForTimeout(300);
const aviso = await p.locator('.aviso-flutuante.on').innerText().catch(() => '');
conferir(/cancelada/.test(aviso), `cancelar mostra a mensagem no aviso flutuante ("${aviso.slice(0, 60)}")`);
const naBarra = (await p.locator('.status').innerText().catch(() => '')).includes('cancelada');
conferir(naBarra, 'a mesma mensagem continua na barra de status');
await p.screenshot({ path: `${dest}/05-aviso-flutuante-cancelada.png` });

// Esc fecha o diálogo sem exportar
await p.waitForTimeout(4500);
await p.getByRole('button', { name: /Exportar MP4/ }).first().click();
await p.waitForTimeout(300);
await p.keyboard.press('Escape');
await p.waitForTimeout(250);
conferir(await dlg.count() === 0, 'Esc fecha o diálogo de exportação (conta como cancelar)');

// M3: o Prompt mestre (aberto pela tela inicial) usa ícones de linha nos formatos
await p.goto('http://127.0.0.1:5173/#/');
await p.waitForTimeout(800);
await p.getByRole('button', { name: /Gerar roteiro com qualquer IA/ }).first().click().catch(() => {});
await p.waitForTimeout(500);
const pm = p.locator('[role="dialog"][aria-label="Prompt mestre"]');
if (await pm.count()) {
  const texto = await pm.innerText();
  // a conferência é nos botões de formato (M3); o cabeçalho de sugestões e o marcador de aviso não são formatos
  const botoesFormato = await pm.locator('button').allInnerTexts();
  conferir(!botoesFormato.some((x) => EMOJI.test(x)), 'os botões de formato do Prompt mestre não usam emoji');
  conferir(await pm.locator('svg').count() > 0, 'o Prompt mestre mostra os formatos com ícones de linha');
  await p.screenshot({ path: `${dest}/06-prompt-mestre-icones.png` });
} else {
  conferir(false, 'não consegui abrir o Prompt mestre para conferir os ícones');
}

conferir(erros.length === 0, 'nenhum erro de página');
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nM1, M3, M4 e M5: tudo ok');
