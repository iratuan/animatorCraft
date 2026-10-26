// Seletor de personagens do roteiro: "@" abre a lista junto ao cursor; Enter insere o nome; Esc fecha; e-mail não abre.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/41-seletor-personagem';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

const roteiro = `# Teste do seletor

Professor entra pela esquerda andando.
`;
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(500);

const campo = p.locator('#campo-roteiro');
const lista = p.locator('.seletor-mencao');
const valor = () => campo.inputValue();

await campo.click();
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');

// 1) "@" abre a lista com papéis e elenco
await p.keyboard.type('@');
await p.waitForTimeout(200);
conferir(await lista.count() === 1, '"@" abre a lista de personagens');
conferir(await p.locator('.seletor-mencao [role="option"]').count() >= 10, 'lista tem papéis e o elenco');
await p.screenshot({ path: `${dest}/01-lista-aberta.png` });

// 2) filtrar: "ca" põe primeiro quem começa com "ca" (Dario por "cacula", Carol, Paraíba por "cachorro", Mingau por "cat")
await p.keyboard.type('ca');
await p.waitForTimeout(150);
const primeiro = (await p.locator('.seletor-mencao [role="option"]').first().innerText()).split('\n')[0].trim();
conferir(['Dario', 'Carol', 'Paraíba', 'Mingau'].includes(primeiro), `filtro "ca": primeira opção começa com "ca" (veio "${primeiro}")`);
await p.screenshot({ path: `${dest}/02-filtrada.png` });

// 3) setas trocam a seleção e Enter insere o nome da opção selecionada, com espaço depois e lista fechada
await p.keyboard.press('ArrowDown');
await p.keyboard.press('ArrowUp');
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
const depois = await valor();
conferir(depois.split('\n').pop().trimEnd() === primeiro && depois.endsWith(' '), `Enter insere "${primeiro}" com espaço depois (texto: "${depois.split('\n').pop()}")`);
conferir(!depois.includes('@'), 'o "@" e o filtro somem do roteiro');
conferir(await lista.count() === 0, 'a lista fecha depois de escolher');

// 4) "@" + Esc fecha sem alterar o texto (o "@" fica para o usuário apagar)
await p.keyboard.press('Enter');
await p.keyboard.type('@');
await p.waitForTimeout(150);
conferir(await lista.count() === 1, 'segundo "@" abre a lista');
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
conferir(await lista.count() === 0, 'Esc fecha a lista');
conferir((await valor()).endsWith('@'), 'Esc não apaga o "@" digitado');

// 5) e-mail não abre a lista
await p.keyboard.press('Backspace');
await p.keyboard.type('contato@escola');
await p.waitForTimeout(150);
conferir(await lista.count() === 0, 'e-mail ("contato@escola") não abre a lista');

// 6) clique no item insere o personagem
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');
await p.keyboard.type('@Erik');
await p.waitForTimeout(150);
await p.locator('.seletor-mencao [role="option"]').first().click();
await p.waitForTimeout(200);
conferir((await valor()).includes('Erika'), 'clique no item insere "Erika"');

console.log('erros de página', erros);
conferir(erros.length === 0, 'nenhum erro de página');
await p.screenshot({ path: `${dest}/03-depois-da-insercao.png` });
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nseletor de personagens: tudo ok');
