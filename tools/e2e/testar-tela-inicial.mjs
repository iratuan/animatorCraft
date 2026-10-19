// Tela inicial: o que mostra, para onde leva cada atalho, desempenho de abertura e acessibilidade por teclado.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const dest = 'evidencias/37-tela-inicial-e-prompt-mestre';
mkdirSync(dest, { recursive: true });
// BASE=http://127.0.0.1:4173/ roda contra o build de produção (npx vite preview), onde também se confere o que a tela inicial baixa
const URL = process.env.BASE ?? 'http://127.0.0.1:5173/';
const PRODUCAO = !!process.env.BASE;
let falhas = 0, passou = 0;
const ok = (c, m) => { if (c) passou++; else { falhas++; console.log('FALHOU:', m); } };
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
const pedidos = []; p.on('request', (r) => pedidos.push(r.url()));
const editorPronto = () => p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });

// ---- 1ª abertura (sem nada salvo)
await p.goto(URL); await p.evaluate(() => localStorage.clear()); pedidos.length = 0;
await p.goto(URL + '?novo=1');
await p.waitForSelector('.home');
ok(await p.locator('h1', { hasText: 'StickBoard' }).count() === 1, 'título StickBoard');
ok(await p.locator('[data-teste=continuar]').count() === 0, 'sem "Continuar" na primeira abertura (roteiro é o exemplo)');
ok(await p.locator('[data-teste=novo]').count() === 1 && await p.locator('[data-teste=prompt-mestre]').count() === 1, 'cartões Novo e Prompt mestre');
ok(await p.locator('.home-modelo').count() >= 3, 'modelos listados');
ok(await p.evaluate(() => document.activeElement?.getAttribute('data-teste')) === 'novo', 'foco inicial no cartão principal (teclado)');
// a tela inicial não baixa sprites nem fontes
await p.waitForTimeout(600);
const pesados = pedidos.filter((u) => /\.png|\.woff/.test(u));
if (PRODUCAO) ok(pesados.length === 0, `tela inicial não baixa sprites/fontes (baixou ${pesados.length})`);
await p.screenshot({ path: `${dest}/01-tela-inicial-primeira-vez.png` });

// ---- desempenho de abertura: do início da navegação até a tela pronta
const medidas = [];
for (let i = 0; i < 5; i++) {
  await p.goto('about:blank');
  const t0 = Date.now(); await p.goto(URL + `?m=${i}`); await p.waitForSelector('.home h1'); medidas.push(Date.now() - t0);
}
const media = Math.round(medidas.reduce((a, c) => a + c, 0) / medidas.length);
console.log('abertura da tela inicial (ms):', medidas.join(', '), 'média', media);
ok(media < 1500, `tela inicial abre em menos de 1,5 s (média ${media} ms)`);
writeFileSync(`${dest}/medidas-abertura.txt`, `abertura da tela inicial (ms): ${medidas.join(', ')}\nmédia: ${media}\n`);

// ---- prompt mestre a partir da tela inicial
await p.goto(URL); await p.waitForSelector('.home');
await p.locator('[data-teste=prompt-mestre]').click();
await p.waitForSelector('.prompt-mestre');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando a biblioteca'), null, { timeout: 90000 });
const prompt0 = await p.getByLabel('Prompt mestre gerado').inputValue();
ok(prompt0.includes('# PROMPT MESTRE DO STICKBOARD') && prompt0.includes('## 3. TODAS AS FRASES'), 'prompt mestre gerado');
ok(prompt0.includes('<<ESCREVA AQUI O ASSUNTO'), 'sem assunto, o prompt traz o modelo a completar');
for (const n of ['CringeFather', 'BetaSon', 'Erika', 'Dario', 'Laura']) ok(prompt0.includes(n), `elenco inclui ${n}`);
ok(/Poses de sprite: [a-z]/.test(prompt0), 'poses de sprite da biblioteca aparecem (sprites carregados a partir da tela inicial)');
await p.getByPlaceholder(/produtos notáveis/).fill('Frações com pizza');
await p.getByPlaceholder(/gráfico e uma piada/).fill('inclua uma piada da vovó');
const prompt1 = await p.getByLabel('Prompt mestre gerado').inputValue();
ok(prompt1.includes('Frações com pizza') && prompt1.includes('piada da vovó') && !prompt1.includes('<<ESCREVA'), 'campos entram no pedido');
await p.screenshot({ path: `${dest}/02-prompt-mestre-copiar.png` });
// copiar
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
await p.getByRole('button', { name: 'Copiar prompt' }).click();
await p.waitForSelector('[role=status]');
const copiado = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
ok(copiado === null || copiado.replace(/\r\n/g, '\n') === prompt1, 'área de transferência recebe o prompt');
ok((await p.locator('[role=status]').innerText()).includes('Prompt copiado'), 'aviso de cópia');
// salvar .md
const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Salvar como arquivo (.md)' }).click()]);
ok(dl.suggestedFilename() === 'prompt-mestre-stickboard.md', 'nome do arquivo do prompt');
await dl.saveAs(`${dest}/prompt-mestre-gerado.md`);
// melhorar
await p.getByRole('button', { name: 'Melhorar o roteiro atual' }).click();
const prompt2 = await p.getByLabel('Prompt mestre gerado').inputValue();
ok(prompt2.includes('ROTEIRO ATUAL') && prompt2.includes('Professor entra pela esquerda'), 'modo melhorar leva o roteiro atual');

// ---- colar a resposta da IA
await p.getByRole('button', { name: '2. Colar o roteiro da IA' }).click();
const resposta = 'Claro! Segue:\n```\n[papéis: professor=Erika, aluno=Dario]\n\n# Pizza\nProfessor entra pela esquerda andando. Aluno entra correndo pela direita.\nProfessor diz "Vamos dividir a pizza!" empolgado.\nProfessor desenha um gráfico de pizza: Fome=75, Resto=25 no quadro.\nAluno voa pela sala.\n```\nBom proveito!';
await p.getByLabel('Resposta da IA').fill(resposta);
const txt = await p.locator('.prompt-mestre .conferencia').innerText();
ok(/1 cena/.test(txt) && /não entendeu 1 trecho/.test(txt), `conferência da resposta (${txt})`);
ok((await p.locator('.erros-pacote li').first().innerText()).includes('Aluno voa pela sala'), 'aviso aponta a frase inválida');
await p.screenshot({ path: `${dest}/03-resposta-da-ia-com-aviso.png` });
await p.getByLabel('Resposta da IA').fill(resposta.replace('Aluno voa pela sala.', 'Aluno fica surpreso.'));
ok((await p.locator('.prompt-mestre .conferencia').innerText()).includes('sem avisos'), 'resposta corrigida fica sem avisos');
await p.getByRole('button', { name: 'Substituir o roteiro' }).click();
await p.waitForSelector('.app');
await editorPronto();
const roteiro = await p.locator('#campo-roteiro').inputValue();
ok(roteiro.startsWith('[papéis: professor=Erika, aluno=Dario]') && roteiro.includes('gráfico de pizza'), 'roteiro da IA aplicado e editor aberto');
ok(!roteiro.includes('Claro!') && !roteiro.includes('```'), 'conversa e cercas removidas');
await p.waitForTimeout(800);
await p.screenshot({ path: `${dest}/04-editor-com-roteiro-da-ia.png` });

// ---- voltar à tela inicial: agora há o que continuar
await p.getByText('Arquivo').first().click(); await p.getByText('Tela inicial').click();
await p.waitForSelector('.home');
const cont = p.locator('[data-teste=continuar]');
ok(await cont.count() === 1, 'aparece "Continuar o último roteiro"');
ok((await cont.innerText()).includes('“Pizza”') && /1 cena/.test(await cont.innerText()), 'resumo do roteiro em "Continuar"');
ok(await p.evaluate(() => document.activeElement?.getAttribute('data-teste')) === 'continuar', 'foco no "Continuar"');
await p.screenshot({ path: `${dest}/05-tela-inicial-com-continuar.png` });
await cont.click(); await p.waitForSelector('.app');
ok((await p.locator('#campo-roteiro').inputValue()).includes('# Pizza'), '"Continuar" abre o roteiro salvo');

// ---- atalhos da tela inicial
const voltar = async () => { await p.getByText('Arquivo').first().click(); await p.getByText('Tela inicial').click(); await p.waitForSelector('.home'); };
await voltar(); await p.locator('[data-teste=novo]').click(); await p.waitForSelector('.app');
ok((await p.locator('#campo-roteiro').inputValue()).startsWith('[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1'), 'Novo em branco');
await voltar(); await p.locator('[data-teste=modelo-matematica-resolucao]').click(); await p.waitForSelector('.app');
ok((await p.locator('#campo-roteiro').inputValue()).includes('{O PROBLEMA}'), 'Modelo carregado');
await voltar(); await p.locator('[data-teste=exemplo]').click(); await p.waitForSelector('.app');
ok((await p.locator('#campo-roteiro').inputValue()).includes('Hoje vamos aprender produtos notáveis'), 'Exemplo carregado');
await voltar(); await p.locator('[data-teste=novo-personagem]').click(); await p.waitForSelector('.app');
await p.waitForSelector('[aria-label="Novo personagem"], .modal', { timeout: 60000 });
ok(await p.getByPlaceholder('ex.: Tia Marta').count() === 1, 'Criar personagem abre a ficha');
await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Cancelar' }).click().catch(() => {});
await voltar(); await p.locator('[data-teste=sprites]').click(); await p.waitForSelector('.app');
await p.waitForSelector('.modal', { timeout: 60000 });
ok((await p.locator('.modal').first().innerText()).toLowerCase().includes('sprite'), 'Sprites e biblioteca abre o editor de sprites');
await p.keyboard.press('Escape'); await p.getByRole('button', { name: /Fechar/ }).first().click().catch(() => {});
// abrir roteiro de arquivo
writeFileSync(`${dest}/roteiro-de-arquivo.stk.txt`, '# Do arquivo\nProfessor entra pela esquerda andando.\n');
await voltar();
const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('[data-teste=abrir-roteiro]').click()]);
await fc.setFiles(`${dest}/roteiro-de-arquivo.stk.txt`);
await p.waitForSelector('.app');
ok((await p.locator('#campo-roteiro').inputValue()).includes('# Do arquivo'), 'Abrir roteiro de arquivo');
// manual pela tela inicial
await voltar(); await p.locator('[data-teste=manual]').click();
await p.waitForSelector('.modal.manual');
ok(await p.locator('.modal.manual nav button', { hasText: 'Prompt mestre' }).count() === 1, 'manual tem a seção do prompt mestre');
await p.keyboard.press('Escape');
ok(await p.locator('.modal.manual').count() === 0, 'Esc fecha o manual na tela inicial');
// Esc fecha o prompt mestre
await p.locator('[data-teste=prompt-mestre]').click(); await p.waitForSelector('.prompt-mestre'); await p.keyboard.press('Escape');
ok(await p.locator('.prompt-mestre').count() === 0, 'Esc fecha o prompt mestre');
// tela estreita (celular)
await p.setViewportSize({ width: 390, height: 780 }); await p.waitForTimeout(200);
ok(await p.evaluate(() => document.querySelector('.home').scrollWidth <= window.innerWidth + 1), 'sem rolagem horizontal em tela estreita');
await p.screenshot({ path: `${dest}/06-tela-inicial-celular.png` });

console.log('erros de página:', erros.filter((e) => !/favicon/.test(e)));
ok(erros.filter((e) => !/favicon/.test(e)).length === 0, 'nenhum erro de console');
console.log(`\n${passou} verificações ok, ${falhas} falha(s)`);
await b.close();
process.exit(falhas ? 1 : 0);
