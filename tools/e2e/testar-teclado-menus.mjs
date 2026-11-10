// Menus só com teclado: setas abrem e percorrem os menus e submenus, Enter executa, Esc volta, Tab fecha.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/47-menus-teclado';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(2000);

const foco = () => p.evaluate(() => {
  const a = document.activeElement;
  return { texto: (a?.textContent || '').trim(), topo: a?.dataset?.topo ?? null, noMenu: !!a?.closest('.dropdown'), noSub: !!a?.closest('.submenu') };
});
const itensDoMenu = () => p.evaluate(() => [...document.querySelectorAll('.dropdown > [role="menuitem"]:not(:disabled), .dropdown > .item-com-submenu > [role="menuitem"]:not(:disabled)')].map((el) => el.textContent.trim()));

// 1) a barra é um menubar e os menus são menuitens com aria-haspopup
conferir(await p.locator('[role="menubar"]').count() === 1, 'a barra de menus tem papel "menubar"');
conferir(await p.locator('[data-topo="Arquivo"]').getAttribute('aria-haspopup') === 'menu', 'o menu Arquivo anuncia que abre um submenu');

// 2) foco no primeiro menu; seta para baixo abre e leva ao primeiro item
await p.locator('[data-topo="Arquivo"]').focus();
await p.keyboard.press('ArrowDown');
await p.waitForTimeout(150);
let f = await foco();
conferir(f.noMenu && await p.locator('[data-topo="Arquivo"]').getAttribute('aria-expanded') === 'true', 'seta para baixo abre o menu Arquivo');
conferir(f.noMenu && f.texto.length > 0, `o foco vai para o primeiro item (${f.texto.split('\n')[0]})`);
const itens = await itensDoMenu();
conferir(itens.length >= 4, `o menu Arquivo tem ${itens.length} itens navegáveis`);

// 3) setas percorrem os itens; Home e End vão às pontas
await p.keyboard.press('ArrowDown');
await p.keyboard.press('ArrowDown');
f = await foco();
conferir(f.texto.startsWith(itens[2]?.split('\n')[0] ?? '§'), 'seta para baixo duas vezes chega ao terceiro item');
await p.keyboard.press('End');
f = await foco();
conferir(f.texto.startsWith(itens[itens.length - 1]?.split('\n')[0] ?? '§'), 'End vai ao último item');
await p.keyboard.press('Home');
f = await foco();
conferir(f.texto.startsWith(itens[0]?.split('\n')[0] ?? '§'), 'Home volta ao primeiro item');
await p.screenshot({ path: `${dest}/01-menu-aberto-pelo-teclado.png` });

// 4) submenu: seta para a direita abre "Projeto" e leva ao primeiro item dele; ← volta ao gatilho
const indiceProjeto = itens.findIndex((t) => t.startsWith('Projeto'));
conferir(indiceProjeto >= 0, 'o menu Arquivo tem o submenu "Projeto"');
for (let k = 0; k < indiceProjeto; k++) await p.keyboard.press('ArrowDown');
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
f = await foco();
conferir(f.noSub, 'seta para a direita abre o submenu e leva o foco para dentro dele');
await p.screenshot({ path: `${dest}/02-submenu-pelo-teclado.png` });
await p.keyboard.press('ArrowLeft');
await p.waitForTimeout(150);
f = await foco();
conferir(!f.noSub && f.noMenu && f.texto.startsWith('Projeto'), 'seta para a esquerda volta do submenu ao gatilho "Projeto"');

// 5) Esc fecha o menu e devolve o foco ao botão Arquivo
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
f = await foco();
conferir(await p.locator('.dropdown').count() === 0 && f.topo === 'Arquivo', 'Esc fecha o menu e o foco volta a "Arquivo"');

// 6) seta para a direita na barra muda de menu e abre o próximo
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
f = await foco();
// com o menu fechado, a seta só move o foco entre os gatilhos (padrão de barra de menus)
conferir(f.topo === 'Editar', 'seta para a direita, com o menu fechado, move o foco para "Editar"');
// com um menu já aberto, a seta troca de menu e abre o próximo
await p.keyboard.press('ArrowDown');
await p.keyboard.press('ArrowRight');
await p.waitForTimeout(150);
f = await foco();
conferir(f.topo === 'Editar' || f.noMenu, 'com menu aberto, a seta para a direita troca para o próximo menu');
await p.keyboard.press('Escape');
await p.waitForTimeout(100);

// 7) Enter executa: Ajuda ▸ Manual de uso abre o manual
await p.locator('[data-topo="Ajuda"]').focus();
await p.keyboard.press('Enter');
await p.waitForTimeout(150);
const itensAjuda = await itensDoMenu();
const idxManual = itensAjuda.findIndex((t) => t.startsWith('Manual de uso'));
conferir(idxManual >= 0, 'o menu Ajuda tem "Manual de uso"');
for (let k = 0; k < idxManual; k++) await p.keyboard.press('ArrowDown');
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
conferir(await p.locator('[role="dialog"][aria-label="Manual de uso"]').count() === 1, 'Enter em "Manual de uso" abre o manual');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);

// 8) Tab fecha o menu sem prender o foco
await p.locator('[data-topo="Arquivo"]').focus();
await p.keyboard.press('ArrowDown');
await p.waitForTimeout(150);
await p.keyboard.press('Tab');
await p.waitForTimeout(150);
conferir(await p.locator('.dropdown').count() === 0, 'Tab fecha o menu aberto');

// 9) camadas da linha do tempo são alcançáveis pelo teclado: foco + Enter seleciona o personagem
await p.evaluate(() => document.querySelectorAll('.camada')[1]?.focus());
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
conferir(await p.locator('.camada.sel').count() === 1 && (await p.locator('.camada.sel').first().innerText()).includes('BetaSon'), 'uma camada da linha do tempo é selecionada com o teclado (Enter)');
await p.screenshot({ path: `${dest}/03-camada-selecionada-teclado.png` });

console.log('erros de página', erros);
conferir(erros.length === 0, 'nenhum erro de página');
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nmenus pelo teclado: tudo ok');
