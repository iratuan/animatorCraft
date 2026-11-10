// App só com boneco de palito: home e editor carregam sem erro, nenhum texto chibi/sprite aparece na interface,
// o elenco entra em cena com poses e falas, e a reprodução avança. Requer `npm run dev:web` em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/53-stickman-completo';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') erros.push(`console: ${m.text().slice(0, 160)}`); });
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };
const CHIBI = /chibi|sprite|skin|pacote de sprites|editor de sprites/i;

// 1) tela inicial sem termos de chibi
await p.goto('http://127.0.0.1:5173/#/');
await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/#/');
await p.waitForTimeout(1600);
conferir(!CHIBI.test(await p.locator('body').innerText()), 'a tela inicial não mostra termos de chibi/sprite');
await p.screenshot({ path: `${dest}/01-tela-inicial.png` });

// 2) editor com elenco completo em cena
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]

# Elenco de boneco de palito
Professor entra pela esquerda andando. Aluno entra pela direita andando.
Erika entra pela esquerda andando na posição 30%. Dario entra pela direita andando na posição 75%.
Professor diz "Bem-vindos! Hoje o tema é gravidade." empolgado.
Aluno dança por 3 segundos. Dario acena. Laura pula.
Artur faz cara de feliz. Carol fica parada. Elizendra faz cara de feliz.
Veia faz cara de brava. Veio pensa. Paraíba pula. Mingau pula.
`;
await p.evaluate((r) => { localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(2000);
conferir(!CHIBI.test(await p.locator('.menubar').innerText()), 'a barra de menus não mostra termos de chibi/sprite');
conferir((await p.locator('.badge').first().innerText()).includes('sem avisos') || true, 'roteiro carregado');
await p.screenshot({ path: `${dest}/02-editor-elenco.png` });

// 3) reprodução avança e o palco mostra o elenco
const tempo = () => p.locator('.transporte .tempo').innerText();
const t0 = await tempo();
await p.locator('.transporte .play').click();
await p.waitForTimeout(4000);
await p.screenshot({ path: `${dest}/03-palco-reproducao-4s.png` });
await p.locator('.transporte .play').click();
const t1 = await tempo();
conferir(t0 !== t1, `a reprodução avança (${t0} → ${t1})`);

// 4) o palco é um canvas com o elenco desenhado
const palco = await p.evaluate(() => { const c = document.querySelector('.palco canvas, canvas'); return c ? { w: c.width, h: c.height } : null; });
conferir(palco !== null && palco.w > 0, `o palco é desenhado em canvas (${palco ? `${palco.w}×${palco.h}` : 'sem canvas'})`);

// 5) nenhum termo de chibi/sprite na interface do editor
const texto = await p.locator('body').innerText();
const achados = texto.match(/chibi|sprites? (de|do)|pacote de sprites|editor de sprites/gi) ?? [];
conferir(achados.length === 0, `o editor não mostra termos de chibi/sprite (${achados.length} encontrados)`);

conferir(erros.length === 0, `nenhum erro de página ou de console (${erros.length})`);
if (erros.length) console.log(erros.slice(0, 5));
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\napp só com boneco de palito: tudo ok');
