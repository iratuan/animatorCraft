// Modais e fechamento: Esc e clique fora pedem confirmação quando há edição, arrastar a seleção para fora não fecha,
// o foco fica preso no modal e volta ao botão de origem, e sair da página com alterações pergunta.
// Requer `npm run dev:web` rodando em http://127.0.0.1:5173.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/45-modais-e-fechamento';
mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const falhas = [];
const conferir = (cond, msg) => { if (!cond) falhas.push(msg); console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); };

// diálogos do navegador: o que responder fica nesta variável; o que apareceu fica registrado
const dialogos = [];
let responder = 'dismiss';
p.on('dialog', async (d) => {
  dialogos.push({ tipo: d.type(), mensagem: d.message() });
  if (responder === 'accept') await d.accept(); else await d.dismiss();
});

await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', '# Modais\n\nProfessor acena.'); });
await p.goto('http://127.0.0.1:5173/?t=0#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(400);

const caixa = () => p.locator('[role="dialog"][aria-label="Ficha do personagem"]');
const abrirFicha = async () => {
  await p.getByRole('button', { name: /Ficha do personagem/ }).first().click();
  await p.waitForTimeout(300);
};
const duplicarParaEditar = async () => {
  // o personagem original é só de leitura: edita-se uma cópia (botão Duplicar para editar)
  const dup = p.getByRole('button', { name: 'Duplicar para editar' });
  if (await dup.count()) { await dup.first().click(); await p.waitForTimeout(300); }
};
const fecharComEsc = async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(250); };

// 1) abre, foco entra no modal
await abrirFicha();
conferir(await caixa().count() === 1, 'a ficha abre pelo botão');
conferir(await p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'o foco entra no modal ao abrir');
await p.screenshot({ path: `${dest}/01-ficha-aberta-com-foco.png` });

// 2) Esc sem alterações fecha direto, sem perguntar
dialogos.length = 0;
await fecharComEsc();
conferir(await caixa().count() === 0, 'Esc sem alterações fecha a ficha');
conferir(dialogos.length === 0, 'Esc sem alterações não pergunta nada');

// 3) foco volta para o botão que abriu
conferir(await p.evaluate(() => document.activeElement?.textContent?.includes('Ficha do personagem') ?? false), 'ao fechar, o foco volta para o botão que abriu o modal');

// 4) com alteração: Esc pergunta; "Cancelar" mantém aberto
await abrirFicha();
await duplicarParaEditar();
await p.locator('[role="dialog"] input[placeholder="ex.: Tia Marta"]').first().fill('Nome alterado de teste');
dialogos.length = 0;
responder = 'dismiss';
await fecharComEsc();
conferir(dialogos.length === 1 && /alterações/.test(dialogos[0].mensagem), 'Esc com alteração pergunta antes de fechar');
conferir(await caixa().count() === 1, 'recusar a confirmação mantém a ficha aberta');
conferir(await p.locator('[role="dialog"] input[placeholder="ex.: Tia Marta"]').first().inputValue() === 'Nome alterado de teste', 'o texto digitado sobrevive à recusa');
await p.screenshot({ path: `${dest}/02-esc-pergunta-com-alteracao.png` });

// 5) confirmar descarte fecha
responder = 'accept';
dialogos.length = 0;
await fecharComEsc();
conferir(await caixa().count() === 0, 'confirmar o descarte fecha a ficha');

// 6) botão Fechar do rodapé também pergunta
await abrirFicha();
await duplicarParaEditar();
await p.locator('[role="dialog"] input[placeholder="ex.: Tia Marta"]').first().fill('Outro teste');
responder = 'dismiss';
dialogos.length = 0;
await p.locator('[role="dialog"] button').filter({ hasText: /^(Fechar|Cancelar)$/ }).first().click();
await p.waitForTimeout(250);
conferir(dialogos.length === 1, 'o botão Fechar do rodapé também pergunta');
conferir(await caixa().count() === 1, 'o botão Fechar, recusado, mantém a ficha aberta');
responder = 'accept';
await p.locator('[role="dialog"] button').filter({ hasText: /^(Fechar|Cancelar)$/ }).first().click();
await p.waitForTimeout(250);
conferir(await caixa().count() === 0, 'o botão Fechar, confirmado, fecha');

// 7) arrastar a seleção de dentro para fora não fecha (o clique começa dentro e termina no fundo)
await abrirFicha();
responder = 'dismiss';
dialogos.length = 0;
const titulo = await caixa().locator('h3').first().boundingBox();
const fundo = await p.evaluate(() => { const r = document.querySelector('.modal-fundo').getBoundingClientRect(); return { x: r.x + 10, y: r.y + 10 }; });
await p.mouse.move(titulo.x + 5, titulo.y + 5);
await p.mouse.down();
await p.mouse.move(fundo.x, fundo.y, { steps: 10 });
await p.mouse.up();
await p.waitForTimeout(250);
conferir(await caixa().count() === 1 && dialogos.length === 0, 'arrastar a seleção para fora da caixa não fecha o modal');

// 8) clicar no fundo (sem alteração) fecha
await p.mouse.click(fundo.x, fundo.y);
await p.waitForTimeout(250);
conferir(await caixa().count() === 0, 'clique no fundo sem alterações fecha o modal');

// 9) foco fica preso: Tab repetido não sai do modal
await abrirFicha();
let saiu = false;
for (let i = 0; i < 60; i++) {
  await p.keyboard.press('Tab');
  if (!(await p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))) { saiu = true; break; }
}
conferir(!saiu, 'Tab repetido mantém o foco dentro do modal');
await p.keyboard.press('Escape');
await p.waitForTimeout(200);

// 10) sair da página com alterações no roteiro pergunta (navegador)
conferir(await caixa().count() === 0, 'a ficha está fechada antes de editar o roteiro');
await p.locator('#campo-roteiro').click();
await p.keyboard.press('Control+End');
await p.keyboard.type('\nProfessor pula.');
await p.waitForTimeout(300);
conferir((await p.locator('#campo-roteiro').inputValue()).includes('Professor pula.'), 'o texto foi para o roteiro (não para um campo de modal)');
dialogos.length = 0;
responder = 'dismiss';
await p.evaluate(() => { window.location.hash = '#/'; }).catch(() => {});
await p.waitForTimeout(600);
dialogos.length = 0;
const antes = p.url();
// query diferente: só o fragmento mudar não descarrega a página, e o aviso não aparece
await p.goto('http://127.0.0.1:5173/?t=9#/').catch(() => {});
await p.waitForTimeout(400);
conferir(dialogos.some((d) => d.tipo === 'beforeunload'), 'sair da página com alterações pede confirmação do navegador');
conferir(!p.url().includes('t=9'), 'recusar a saída mantém a página (não foi para o destino)');

// 11) "Salvar projeto como" pergunta o nome dentro do app (sem window.prompt); Enter grava, Esc cancela
const salvarComo = async () => {
  await p.locator('[data-topo="Arquivo"]').click();
  await p.waitForTimeout(200);
  // o menu é em submenus que abrem no hover: Arquivo ▸ Projeto ▸ Salvar projeto como
  await p.getByText('Projeto', { exact: true }).first().hover();
  await p.waitForTimeout(250);
  await p.getByText('Salvar projeto como (.zip)', { exact: false }).first().click();
  await p.waitForTimeout(300);
};
// volta ao editor pela própria navegação do app (o passo 10 deixou a página na tela inicial)
await p.evaluate(() => { window.location.hash = '#/editor'; });
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(400);
dialogos.length = 0;
await salvarComo();
const pedido = p.locator('[role="dialog"][aria-label="Nome com que deseja salvar o projeto (.zip)"]');
conferir(await pedido.count() === 1, '"Salvar projeto como" abre um pedido de nome dentro do app');
conferir(!dialogos.some((d) => d.tipo === 'prompt'), 'nenhum window.prompt nativo é usado');
await pedido.locator('input').first().fill('Teste Save');
const baixou = p.waitForEvent('download', { timeout: 15000 }).catch(() => null);
await pedido.locator('input').first().press('Enter');
const arquivo = await baixou;
conferir(arquivo !== null && /Teste_Save\.zip$/.test(arquivo.suggestedFilename()), `Enter grava com o nome digitado (${arquivo?.suggestedFilename() ?? 'nenhum download'})`);
await p.waitForTimeout(300);
conferir(await pedido.count() === 0, 'o pedido fecha depois de confirmar');

// cancelar não grava nada
await salvarComo();
const cancelado = p.waitForEvent('download', { timeout: 2500 }).then(() => true).catch(() => false);
await p.keyboard.press('Escape');
conferir(await pedido.count() === 0, 'Esc fecha o pedido de nome');
conferir((await cancelado) === false, 'cancelar não gera arquivo');

console.log('erros de página', erros);
conferir(erros.length === 0, 'nenhum erro de página');
await b.close();
if (falhas.length) { console.log(`\n${falhas.length} falha(s)`); process.exit(1); }
console.log('\nmodais e fechamento: tudo ok');
