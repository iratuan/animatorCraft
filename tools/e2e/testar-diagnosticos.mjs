// Diagnósticos do roteiro: frase incoerente fica sublinhada, a lista mostra a sugestão, aplicar corrige, e exportar pede confirmação se ainda houver erro.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/43-diagnosticos-e-correcoes';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

// diálogos do navegador (window.confirm): registra a mensagem e recusa, como quem cancela a exportação
let dialogo = null;
p.on('dialog', (d) => { dialogo = d.message(); d.dismiss(); });

const roteiro = `# Diagnósticos

Professor acena.
Professor pulla.
Erik fala "oi".
Aluno dança.
`;
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(500);

const campo = p.locator('#campo-roteiro');
const valor = () => campo.inputValue();
const sublinhados = () => p.locator('.camada-roteiro .sub-erro').allInnerTexts();
const itens = () => p.locator('.avisos.diagnosticos li.diag');

// 1) os dois problemas aparecem sublinhados no texto, e o correto não
const marcados = await sublinhados();
conferir(marcados.length === 2, `dois trechos sublinhados como erro (${JSON.stringify(marcados)})`);
conferir(marcados.includes('Professor pulla.') && marcados.includes('Erik fala "oi".'), 'os trechos marcados são exatamente as frases incoerentes');
conferir((await p.locator('.camada-roteiro').innerText()).includes('Aluno dança.'), 'a frase correta continua no texto, sem marca');

// a camada tem a mesma caixa que o textarea, então os trechos ficam sob as letras
const caixas = await p.evaluate(() => {
  const a = document.querySelector('.camada-roteiro').getBoundingClientRect();
  const t = document.querySelector('#campo-roteiro').getBoundingClientRect();
  return { ax: a.x, ay: a.y, aw: a.width, ah: a.height, tx: t.x, ty: t.y, tw: t.width, th: t.height };
});
conferir(Math.abs(caixas.ax - caixas.tx) < 1 && Math.abs(caixas.aw - caixas.tw) < 1 && Math.abs(caixas.ah - caixas.th) < 1, 'camada e textarea têm a mesma caixa');
await p.screenshot({ path: `${dest}/01-sublinhado-no-texto.png` });

// 2) a lista explica cada problema e oferece a sugestão
conferir(await itens().count() === 2, 'a lista tem os dois diagnósticos');
const sugestaoPulla = p.locator('.diag-sugestao', { hasText: 'Professor pula.' });
conferir(await sugestaoPulla.count() === 1, 'sugestão "Professor pula." para o verbo errado');
conferir(await p.locator('.diag-sugestao', { hasText: 'Erika fala "oi".' }).count() === 1, 'sugestão "Erika fala \\"oi\\"." para o nome errado');
await p.screenshot({ path: `${dest}/02-lista-com-sugestoes.png` });

// 3) clicar no diagnóstico leva o cursor até a frase
await p.locator('.diag-ir', { hasText: 'Erik' }).click();
await p.waitForTimeout(150);
const inicioErik = (await valor()).indexOf('Erik fala');
conferir(await campo.evaluate((el) => el.selectionStart) === inicioErik, 'clicar no diagnóstico posiciona o cursor no início da frase');

// 4) aplicar a sugestão troca a frase e a marca some (e volta a ser uma edição desfazível)
await sugestaoPulla.click();
await p.waitForTimeout(300);
conferir((await valor()).includes('Professor pula.') && !(await valor()).includes('pulla'), 'aplicar troca "pulla" por "pula"');
conferir((await sublinhados()).length === 1, 'depois da correção sobra um sublinhado (o nome)');
await p.screenshot({ path: `${dest}/03-depois-da-correcao.png` });

// 5) exportar com erro pede confirmação; recusar cancela e não gera o vídeo
await p.getByRole('button', { name: /Exportar MP4/ }).first().click();
await p.waitForTimeout(400);
// a confirmação é um diálogo dentro do app (não window.confirm): cita a frase com erro e Cancelar não exporta
const dlgExp = p.locator('[role="dialog"][aria-label="Exportar com frases que não serão executadas"]');
conferir(await dlgExp.count() === 1, 'exportar com erro abre o diálogo de confirmação dentro do app');
conferir((await dlgExp.locator('.lista-erros').innerText()).includes('Erik'), 'a confirmação cita a frase com erro');
await dlgExp.getByRole('button', { name: 'Cancelar' }).click();
await p.waitForTimeout(300);
conferir((await p.locator('.barra-status, .status, footer').allInnerTexts().catch(() => [])).join(' ').includes('Exportação cancelada') || (await p.innerText('body')).includes('Exportação cancelada'), 'recusar cancela a exportação');
await p.screenshot({ path: `${dest}/04-exportacao-pede-confirmacao.png` });

console.log('erros de página', erros);
conferir(erros.length === 0, 'nenhum erro de página');
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\ndiagnósticos do roteiro: tudo ok');
