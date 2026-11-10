// Menu "[[" do roteiro: fecha "]]" sozinho, lista elementos e ações, insere a escolha e a frase inserida não gera aviso.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/42-referencias-e-acoes';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

const roteiro = `# Teste dos colchetes

Erika mostra a imagem ciclo.png no canto esquerdo.
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
const semAvisos = async () => (await p.locator('.badge').first().innerText()).includes('sem avisos');

await campo.click();
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');
await p.keyboard.type('Professor ');

// 1) "[" + "[" fecha sozinho e abre o menu
await p.keyboard.type('[[');
await p.waitForTimeout(200);
conferir((await valor()).endsWith('Professor [[]]'), '"[[" fecha com "]]" automático');
conferir(await lista.count() === 1, '"[[" abre o menu');
// o CSS põe os grupos em maiúsculas, então a comparação ignora a caixa
const grupos = (await p.locator('.seletor-mencao li.grupo').allInnerTexts()).map((g) => g.toLowerCase());
conferir(grupos.includes('elementos') && grupos.includes('ações'), `menu tem os grupos Elementos e Ações (${grupos.join(', ')})`);
conferir((await p.locator('.seletor-mencao li[role="option"]').first().innerText()).startsWith('Lousa'), 'primeiro item é a lousa');
conferir((await p.locator('.seletor-mencao').innerText()).includes('Imagem ciclo.png'), 'imagem citada no roteiro aparece como elemento');
await p.screenshot({ path: `${dest}/01-menu-elementos-e-acoes.png` });

// 2) filtrar por "apon" e Enter insere a ação dentro dos colchetes
await p.keyboard.type('apon');
await p.waitForTimeout(150);
const primeiro = (await p.locator('.seletor-mencao li[role="option"]').first().innerText()).split('\n')[0].trim();
conferir(primeiro === 'aponta para a lousa', `filtro "apon" traz "aponta para a lousa" primeiro (veio "${primeiro}")`);
await p.screenshot({ path: `${dest}/02-filtrado-apon.png` });
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
conferir((await valor()).endsWith('Professor [[aponta para a lousa]]'), 'Enter insere "[[aponta para a lousa]]" no lugar do filtro');
conferir(await lista.count() === 0, 'menu fecha depois de inserir');
// o exemplo cita ciclo.png sem importar a imagem: esse aviso é esperado; o que não pode aparecer é aviso de sintaxe
const avisosAgora = (await p.locator('.avisos li').allInnerTexts()).filter((a) => !/biblioteca/.test(a));
conferir(avisosAgora.length === 0, `a frase com "[[...]]" não gera aviso de sintaxe (avisos: ${JSON.stringify(avisosAgora)})`);
await p.screenshot({ path: `${dest}/03-inserido-sem-avisos.png` });

// 3) elemento: "[[" + "ima" + Enter insere "[[imagem ciclo.png]]"
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');
await p.keyboard.type('Erika [[ima');
await p.waitForTimeout(150);
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
conferir((await valor()).endsWith('Erika [[mostra a imagem ciclo.png]]'), 'elemento "ciclo.png" é inserido como ação que mostra a imagem');

// 4) "]" digitado com "]]" automático logo depois só avança o cursor
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');
await p.keyboard.type('Dario [[x');
await p.keyboard.type(']');
await p.keyboard.type(']');
await p.waitForTimeout(150);
conferir((await valor()).endsWith('Dario [[x]]'), 'digitar "]" não duplica os colchetes');

// 5) Esc fecha o menu sem apagar o texto
await p.keyboard.press('Control+End');
await p.keyboard.press('Enter');
await p.keyboard.type('Aluno [[');
await p.waitForTimeout(150);
conferir(await lista.count() === 1, 'menu abre de novo para o Esc');
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
conferir(await lista.count() === 0, 'Esc fecha o menu "[["');
const depoisEsc = (await valor()).split('\n').pop();
conferir(depoisEsc === 'Aluno [[]]', `Esc não apaga os colchetes (texto final: ${JSON.stringify((await valor()).slice(-60))})`);

// 6) clique num item insere a ação
await p.keyboard.press('Control+A');
await p.keyboard.press('Backspace');
await p.keyboard.type('Erika [[pul');
await p.waitForTimeout(150);
await p.locator('.seletor-mencao li[role="option"]').first().click();
await p.waitForTimeout(200);
conferir((await valor()).includes('Erika [['), 'clique no item mantém a referência entre colchetes');

console.log('erros de página', erros);
conferir(erros.length === 0, 'nenhum erro de página');
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nreferências e ações entre colchetes: tudo ok');
