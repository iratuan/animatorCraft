// Inspeção de UX e acessibilidade: abre as telas principais em duas larguras, mede problemas objetivos e salva capturas.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const dest = 'evidencias/44-inspecao-ux';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const relatorio = { telas: {}, erros: [] };

// o que o elemento anuncia: texto, aria-label, title ou alt
const SONDA = () => {
  const nome = (el) => (el.textContent || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.querySelector('img')?.getAttribute('alt') || '';
  const botoesSemNome = [...document.querySelectorAll('button')].filter((el) => !el.disabled && !nome(el)).map((el) => el.outerHTML.slice(0, 120));
  const campos = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((el) => {
    const temRotulo = el.id && document.querySelector(`label[for="${el.id}"]`);
    return !(temRotulo || el.closest('label') || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.getAttribute('placeholder'));
  }).map((el) => el.outerHTML.slice(0, 120));
  const pequenos = [];
  for (const el of document.querySelectorAll('body *')) {
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!temTexto) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 11) pequenos.push({ px: fs, texto: el.textContent.trim().slice(0, 40) });
  }
  const alvosPequenos = [...document.querySelectorAll('button, [role=button], a, input, select')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24);
  }).map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
  const estouroHorizontal = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return { botoesSemNome, campos, pequenos: pequenos.slice(0, 15), totalPequenos: pequenos.length, alvosPequenos: alvosPequenos.slice(0, 20), totalAlvosPequenos: alvosPequenos.length, estouroHorizontal };
};

async function telaEm(p, nome, largura, altura, acao) {
  await p.setViewportSize({ width: largura, height: altura });
  await p.waitForTimeout(400);
  if (acao) await acao(p);
  await p.waitForTimeout(400);
  const medidas = await p.evaluate(SONDA);
  relatorio.telas[`${nome}@${largura}x${altura}`] = medidas;
  await p.screenshot({ path: `${dest}/${nome}-${largura}x${altura}.png` });
}

for (const [largura, altura] of [[1280, 720], [1600, 900]]) {
  const p = await b.newPage({ viewport: { width: largura, height: altura } });
  p.on('pageerror', (e) => relatorio.erros.push(`${largura}: ${e}`));
  p.on('console', (m) => { if (m.type() === 'error') relatorio.erros.push(`${largura} console: ${m.text().slice(0, 200)}`); });

  // 1) tela inicial (primeira vez, sem projeto)
  await p.goto('http://127.0.0.1:5173/#/');
  await p.evaluate(() => localStorage.clear());
  await p.goto('http://127.0.0.1:5173/#/');
  await p.waitForTimeout(1500);
  await telaEm(p, 'inicio', largura, altura);

  // 2) editor com roteiro de exemplo
  await p.evaluate(() => localStorage.setItem('stickboard.roteiro.v2', '# Exemplo\n\nProfessor entra pela esquerda andando.\nProfessor diz "Olá!".\nAluno dança.'));
  await p.goto('http://127.0.0.1:5173/?t=0#/editor');
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  // a splash dura 1,3 s (mínimo + saída): espera ela sair antes de medir o editor
  await p.waitForTimeout(2000);
  await telaEm(p, 'editor', largura, altura);

  // 3) modal de ficha de personagem (menu Personagem)
  await telaEm(p, 'modal-personagem', largura, altura, async (q) => {
    await q.getByRole('button', { name: /Ficha do personagem/ }).first().click().catch(() => {});
    await q.waitForTimeout(300);
  });

  // 4) prompt mestre (botão da barra)
  await telaEm(p, 'modal-prompt-mestre', largura, altura, async (q) => {
    await q.keyboard.press('Escape');
    await q.getByRole('button', { name: /^Arquivo$/ }).first().click().catch(() => {}); await q.waitForTimeout(200); await q.getByText('Prompt mestre', { exact: false }).first().click().catch(() => {});
  });
  await p.close();
}

await b.close();
writeFileSync(`${dest}/relatorio-medido.json`, JSON.stringify(relatorio, null, 2), 'utf8');
for (const [tela, m] of Object.entries(relatorio.telas)) {
  console.log(`${tela}: sem nome=${m.botoesSemNome.length} sem rótulo=${m.campos.length} texto<11px=${m.totalPequenos} alvos<24px=${m.totalAlvosPequenos} estouro=${m.estouroHorizontal}px`);
}
console.log(`erros de console/página: ${relatorio.erros.length}`);
