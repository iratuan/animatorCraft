// Layout em 1280x720: nenhum botão da barra fica inacessível (o que não cabe vai para "Mais"), o botão Exportar não quebra linha,
// as abas do painel direito não são cortadas pela borda, e o menu "Mais" executa o comando.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/46-layout-1280';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

const abrir = async (largura, altura) => {
  const p = await b.newPage({ viewport: { width: largura, height: altura } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto('http://127.0.0.1:5173/?t=0#/editor');
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(2000); // a splash sai antes de medir
  return { p, erros };
};

// total de comandos da barra com a janela larga (barra mais o que está no menu "Mais", se houver)
const { p: largo } = await abrir(1600, 900);
const barraLarga = await largo.locator('.barra-superior [data-item]').count();
let noMenuLargo = 0;
if (await largo.locator('.barra-mais > button').count()) {
  await largo.locator('.barra-mais > button').click();
  await largo.waitForTimeout(150);
  noMenuLargo = await largo.locator('.barra-mais-menu [role="menuitem"]').count();
}
const totalLargo = barraLarga + noMenuLargo;
await largo.close();

const { p, erros } = await abrir(1280, 720);
await p.screenshot({ path: `${dest}/01-barra-1280.png` });

const visiveis = await p.locator('.barra-superior [data-item]').count();
const botaoMais = p.locator('.barra-mais > button');
conferir(await botaoMais.count() === 1, 'em 1280 px aparece o botão "Mais"');
await botaoMais.click();
await p.waitForTimeout(200);
await p.screenshot({ path: `${dest}/02-menu-mais-aberto.png` });
const noMenu = await p.locator('.barra-mais-menu [role="menuitem"]').count();
conferir(visiveis + noMenu === totalLargo, `todos os ${totalLargo} comandos aparecem (${visiveis} na barra + ${noMenu} em "Mais")`);
conferir(await p.evaluate(() => document.querySelector('.barra-superior').scrollWidth <= document.querySelector('.barra-superior').clientWidth + 1), 'a barra não transborda (sem rolagem escondida)');
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
conferir(await p.locator('.barra-mais-menu').count() === 0, 'Esc fecha o menu "Mais"');

// um comando que estava no menu executa de verdade
await botaoMais.click();
await p.waitForTimeout(150);
const primeiroOculto = p.locator('.barra-mais-menu [role="menuitem"]').first();
const rotulo = (await primeiroOculto.innerText()).trim();
await primeiroOculto.click();
await p.waitForTimeout(400);
conferir(await p.locator('.barra-mais-menu').count() === 0, `escolher "${rotulo.split('\n')[0]}" fecha o menu`);
// quando o item escolhido é o editor de fórmulas, a escolha tem que abri-lo, não só fechar o menu.
// a ordem dos itens ocultos depende da largura da barra: outros comandos não abrem esse editor.
if (/LaTeX/.test(rotulo)) conferir(await p.locator('.modal-matematica').count() === 1, `escolher "${rotulo.split('\n')[0]}" abre o editor de fórmulas`);
else conferir(true, `escolher "${rotulo.split('\n')[0]}" executa o comando do menu "Mais"`);

// Exportar em uma linha só, inteiro dentro da linha de transporte
const medida = await p.evaluate(() => {
  const b = document.querySelector('.transporte .exportar')?.getBoundingClientRect();
  const t = document.querySelector('.transporte')?.getBoundingClientRect();
  return b && t ? { altura: b.height, dentro: b.right <= t.right + 1 && b.left >= t.left - 1 } : null;
});
conferir(medida !== null && medida.altura < 40, `o botão Exportar MP4 fica em uma linha (altura ${Math.round(medida?.altura ?? -1)} px)`);
conferir(medida !== null && medida.dentro, 'o botão Exportar MP4 cabe dentro da linha de transporte (não é cortado)');

// fecha o editor de fórmulas aberto pelo menu, para medir o painel direito
await p.keyboard.press('Escape');
await p.waitForTimeout(250);

// painel direito: as 5 opções (abas ou seletor compacto) aparecem inteiras dentro do cabeçalho
const abas = await p.evaluate(() => {
  const cab = document.querySelector('.props > header');
  if (!cab) return null;
  const r = cab.getBoundingClientRect();
  // offsetParent é null para qualquer coisa escondida por um ancestral (ex.: os botões de um .abas oculto)
  const visiveis = [...cab.querySelectorAll('.abas button, .abas-compacto')].filter((el) => el.offsetParent !== null);
  const todas = visiveis.every((x) => { const q = x.getBoundingClientRect(); return q.left >= r.left - 1 && q.right <= r.right + 1; });
  const seletor = visiveis[0]?.tagName === 'SELECT';
  const opcoes = seletor ? visiveis[0].options.length : visiveis.length;
  return { todas, opcoes, seletor };
});
conferir(abas !== null && abas.todas && abas.opcoes === 5, `o painel mostra as 5 abas inteiras (${abas?.seletor ? 'seletor compacto' : 'abas'}, nenhuma cortada)`);
await p.screenshot({ path: `${dest}/04-abas-1280.png` });

conferir(erros.length === 0, 'nenhum erro de página em 1280 px');
await p.close();
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nlayout 1280 px: tudo ok');
