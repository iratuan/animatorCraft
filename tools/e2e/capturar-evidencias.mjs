/**
 * capturar-evidencias.mjs
 * Script completo de captura de evidências de todas as telas e funcionalidades do StickBoard.
 * Salva as capturas em evidencias/48-evidencias-completas/
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DEST = 'evidencias/48-evidencias-completas';
mkdirSync(DEST, { recursive: true });

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const PRONTO = () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens');

console.log('🚀 Iniciando navegador Edge (headless)...');
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
p.erros = [];
p.on('pageerror', (e) => p.erros.push(String(e)));

const shot = async (nome, desc = '') => {
  await p.screenshot({ path: `${DEST}/${nome}`, fullPage: false });
  console.log(`  ✓ ${nome}${desc ? ' — ' + desc : ''}`);
};

const limpar = async () => {
  await p.goto(`${BASE}?limpar=${Date.now()}`);
  await p.evaluate(() => {
    localStorage.clear();
    for (const n of ['stickboard', 'stickboard-audio', 'stickboard-imagens']) {
      try { indexedDB.deleteDatabase(n); } catch (_) {}
    }
  });
  await p.waitForTimeout(300);
};

const abrir = async (q = '') => {
  await p.goto(`${BASE}?teste=1${q}#/editor`);
  await p.waitForFunction(PRONTO, null, { timeout: 90000 });
  await p.waitForTimeout(600);
};

// ─── 1. TELA INICIAL (HOME) ──────────────────────────────────────────────────
console.log('\n[ 1 ] TELA INICIAL');
await limpar();
await p.goto(`${BASE}#/`);
await p.waitForSelector('.home', { timeout: 25000 });
await p.waitForTimeout(500);
await shot('01-tela-inicial.png', 'Tela Inicial do StickBoard');

// ─── 2. PROMPT MESTRE / IA MODAL NA HOME ─────────────────────────────────────
console.log('\n[ 2 ] MODAL PROMPT MESTRE / IA');
const btnPromptMestre = p.locator('[data-teste="prompt-mestre"]');
if (await btnPromptMestre.count() > 0) {
  await btnPromptMestre.click();
  await p.waitForSelector('.prompt-mestre', { timeout: 5000 });
  await p.waitForTimeout(300);
  await shot('02-modal-prompt-mestre.png', 'Modal do Prompt Mestre IA aberto');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}

// ─── 3. MANUAL DO USUÁRIO NA HOME ────────────────────────────────────────────
console.log('\n[ 3 ] MODAL MANUAL DO USUÁRIO');
const btnManualHome = p.locator('[data-teste="manual"]');
if (await btnManualHome.count() > 0) {
  await btnManualHome.click();
  await p.waitForSelector('.modal.manual', { timeout: 5000 });
  await p.waitForTimeout(300);
  await shot('03-modal-manual.png', 'Manual do Usuário aberto');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}

// ─── 4. CARREGAR MODELO PRONTO ──────────────────────────────────────────────
console.log('\n[ 4 ] MODELO DE AULA CARREGADO NO EDITOR');
const btnModelo = p.locator('.home-modelo').first();
if (await btnModelo.count() > 0) {
  await btnModelo.click();
  await p.waitForFunction(PRONTO, null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await shot('04-editor-modelo-carregado.png', 'Editor com modelo pré-configurado');
}

// ─── 5. VISÃO GERAL DO EDITOR COM ROTEIRO COMPLETO ──────────────────────────
console.log('\n[ 5 ] VISÃO GERAL DO EDITOR');
await abrir('&ator=erika');
const ROTEIRO_DEMO = `# Aula de Ciências
[papéis: professor=Erika, aluno=Dario]
[cenário: lousa]

Erika entra pela esquerda andando.
Erika diz "Olá turma! Hoje aprenderemos sobre a Gravidade." feliz.
Erika aponta para a lousa.
Erika escreve "F = G * (m1*m2)/d²" na lousa.

Dario entra correndo pela direita.
Dario diz "Professora, Newton descobriu isso com uma maçã?" animado.
Erika diz "Exatamente, Dario! Muito bem lembrado." sorrindo.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_DEMO);
await p.waitForTimeout(1000);
await shot('05-editor-visao-geral.png', 'Visão geral do Editor com Palco, Roteiro e Timeline');

// ─── 6. PAINEL DO ROTEIRO COM REALCE ────────────────────────────────────────
console.log('\n[ 6 ] PAINEL DO ROTEIRO');
await shot('06-painel-roteiro.png', 'Painel de edição do roteiro');

// ─── 7. PALCO E PERSONAGENS ANIMADOS ────────────────────────────────────────
console.log('\n[ 7 ] PALCO DE ANIMAÇÃO');
await shot('07-palco-animacao.png', 'Palco com Erika e Dario renderizados');

// ─── 8. LINHA DO TEMPO COM TRILHAS MÚLTIPLAS ────────────────────────────────
console.log('\n[ 8 ] LINHA DO TEMPO MULTITRACK');
await shot('08-timeline-multitrack.png', 'Linha do tempo com trilhas de eventos e áudio');

// ─── 9. CONTEXT MENU NA FALA DO ATOR (NOVA FEATURE) ─────────────────────────
console.log('\n[ 9 ] CONTEXT MENU NA FALA');
const falaBloco = p.locator('.bloco').filter({ hasText: /Olá|Hoje|Exatamente|Professora/ }).first();
if (await falaBloco.count() > 0) {
  await falaBloco.click({ button: 'right' });
  await p.waitForTimeout(300);
  await shot('09a-context-menu-fala.png', 'Menu de contexto acionado sobre a fala');

  // Clicar em "Editar fala" (primeiro botão do menu)
  const btnEditar = p.locator('.context-menu button').first();
  if (await btnEditar.count() > 0) {
    await btnEditar.click();
    await p.waitForTimeout(400);
    await shot('09b-dialog-editar-fala.png', 'Dialog de Edição da Fala aberto');
    // Preencher alteração
    const inputTexto = p.locator('.dialog textarea').first();
    if (await inputTexto.count() > 0) {
      await inputTexto.fill('Olá alunos queridos! Hoje aprenderemos sobre a Gravidade.');
      await shot('09c-dialog-editar-fala-preenchido.png', 'Texto da fala atualizado no dialog');
    }
    const btnSalvar = p.locator('.dialog button', { hasText: 'Salvar' });
    if (await btnSalvar.count() > 0) {
      await btnSalvar.click();
      await p.waitForTimeout(500);
      await shot('09d-fala-atualizada-timeline.png', 'Fala sincronizada no roteiro e timeline');
    }
  }

  // Clicar com botão direito novamente para "Gravar áudio" (segundo botão do menu)
  const falaBloco2 = p.locator('.bloco').filter({ hasText: /Olá|Hoje|Exatamente|Professora/ }).first();
  await falaBloco2.click({ button: 'right' });
  await p.waitForTimeout(300);
  const btnGravar = p.locator('.context-menu button').nth(1);
  if (await btnGravar.count() > 0) {
    await btnGravar.click();
    await p.waitForTimeout(400);
    await shot('09e-dialog-gravar-audio.png', 'Dialog de Gravação de Áudio da Fala');
    const btnCancelar = p.locator('.dialog button', { hasText: 'Cancelar' });
    if (await btnCancelar.count() > 0) await btnCancelar.click();
    await p.waitForTimeout(200);
  }
}

// ─── 10. FICHA DO PERSONAGEM ─────────────────────────────────────────────────
console.log('\n[ 10 ] FICHA DO PERSONAGEM');
try {
  await p.locator('.barra-superior [data-barra="Personagem"]').click();
  await p.waitForSelector('[aria-label="Ficha do personagem"]', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('10-ficha-personagem.png', 'Modal de Ficha do Personagem');
  await p.locator('[aria-label="Ficha do personagem"]').getByRole('button', { name: 'Cancelar' }).click();
  await p.waitForTimeout(300);
} catch (e) {
  console.log('  ⚠ Ficha de personagem:', e.message);
}

// ─── 11. EDITOR DE SPRITES ───────────────────────────────────────────────────
console.log('\n[ 11 ] EDITOR DE SPRITES');
try {
  await p.locator('.barra-superior [data-barra="Sprites"]').click();
  await p.waitForSelector('[aria-label="Editor de sprites do personagem"]', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('11-editor-sprites.png', 'Editor e Galeria de Sprites');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  const btnFechar = p.getByRole('button', { name: 'Fechar' }).first();
  if (await btnFechar.count() > 0) await btnFechar.click();
  await p.waitForTimeout(300);
} catch (e) {
  console.log('  ⚠ Editor de sprites:', e.message);
}

// ─── 12. EXPRESSÕES E CLIPES ─────────────────────────────────────────────────
console.log('\n[ 12 ] EXPRESSÕES E CLIPES');
try {
  await p.locator('.barra-superior [data-barra="Clipes"]').click();
  await p.waitForSelector('[aria-label="Expressões e clipes do personagem"]', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('12-expressoes-clipes.png', 'Gerenciador de Expressões Faciais e Clipes');
  const btnFecharModal = p.locator('.modal-botoes').last().getByRole('button', { name: 'Fechar' });
  if (await btnFecharModal.count() > 0) await btnFecharModal.click();
  await p.waitForTimeout(300);
} catch (e) {
  console.log('  ⚠ Expressões e clipes:', e.message);
}

// ─── 13. PROMPT MESTRE IA NO EDITOR ──────────────────────────────────────────
console.log('\n[ 13 ] PROMPT MESTRE IA NO EDITOR');
try {
  await p.locator('.barra-superior [data-barra="Prompt IA"]').click();
  await p.waitForSelector('.prompt-mestre', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('13-prompt-ia-editor.png', 'Prompt Mestre integrado no editor');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
} catch (e) {
  console.log('  ⚠ Prompt IA:', e.message);
}

// ─── 14. MANUAL NO EDITOR ────────────────────────────────────────────────────
console.log('\n[ 14 ] MANUAL NO EDITOR');
try {
  await p.locator('.barra-superior [data-barra="Manual"]').click();
  await p.waitForSelector('.modal.manual', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('14-manual-editor.png', 'Manual de instruções no editor');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
} catch (e) {
  console.log('  ⚠ Manual:', e.message);
}

// ─── 15. MENUS SUSPENSOS DA BARRA SUPERIOR ───────────────────────────────────
console.log('\n[ 15 ] MENUS SUPERIORES');
for (const menu of ['Arquivo', 'Editar', 'Exportar', 'Exibir', 'Ajuda']) {
  try {
    const btn = p.locator('.menubar .menu > button', { hasText: menu }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await p.waitForTimeout(200);
      await shot(`15-menu-${menu.toLowerCase()}.png`, `Menu suspenso: ${menu}`);
      await p.keyboard.press('Escape');
      await p.mouse.move(900, 500);
      await p.waitForTimeout(150);
    }
  } catch (_) {}
}

// ─── 16. FORMATOS E CENÁRIOS ─────────────────────────────────────────────────
console.log('\n[ 16 ] FORMATOS E CENÁRIOS');
for (const [nome, rot] of [
  ['cenario-lousa', '# Aula\n[cenário: lousa]\nErika entra pela esquerda.\nErika escreve "Física Moderna" na lousa.\nEspera 1 segundos.\n'],
  ['cenario-podcast', '# Conversa\n[formato: podcast]\nErika entra pela esquerda.\nDario entra pela direita.\nErika diz "Bem-vindos ao episódio 1!" feliz.\nEspera 1 segundos.\n'],
  ['camera-close', '# Close\nErika entra pela esquerda.\n[câmera: lousa]\nErika aponta para a lousa.\nEspera 1 segundos.\n']
]) {
  await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), rot);
  await p.waitForTimeout(600);
  await shot(`16-${nome}.png`, `Cenário/Câmera: ${nome}`);
}

// ─── 17. PLAYBACK E TRANSPORTE ───────────────────────────────────────────────
console.log('\n[ 17 ] PLAYBACK E TRANSPORTE');
const playBtn = p.locator('button[title*="Play"], button[aria-label*="Play"], button[title*="Reproduzir"]').first();
if (await playBtn.count() > 0) {
  await shot('17a-transporte-parado.png', 'Barra de transporte em repouso');
  await playBtn.click();
  await p.waitForTimeout(1000);
  await shot('17b-transporte-em-execucao.png', 'Barra de transporte em execução');
  await playBtn.click(); // pausar
  await p.waitForTimeout(200);
}

// ─── 18. EXPORTAÇÕES ─────────────────────────────────────────────────────────
console.log('\n[ 18 ] EXPORTAR QUADRO (PNG)');
try {
  const [dlPng] = await Promise.all([
    p.waitForEvent('download', { timeout: 15000 }),
    p.locator('.barra-superior [data-barra="PNG"]').click()
  ]);
  console.log('  Download PNG concluído:', dlPng.suggestedFilename());
  await shot('18-export-png.png', 'Quadro exportado em PNG');
} catch (e) {
  console.log('  ⚠ Export PNG:', e.message);
}

console.log('\n[ 19 ] EXPORTAR LEGENDAS (SRT)');
try {
  const [dlSrt] = await Promise.all([
    p.waitForEvent('download', { timeout: 15000 }),
    p.locator('.barra-superior [data-barra="Legendas"]').click()
  ]);
  console.log('  Download SRT concluído:', dlSrt.suggestedFilename());
  await shot('19-export-srt.png', 'Legendas SRT exportadas');
} catch (e) {
  console.log('  ⚠ Export SRT:', e.message);
}

// ─── 20. RESPONSIVIDADE (TABLET / VIEWPORT 1024x768) ─────────────────────────
console.log('\n[ 20 ] RESPONSIVIDADE — 1024x768');
const p2 = await ctx.newPage();
await p2.setViewportSize({ width: 1024, height: 768 });
await p2.goto(`${BASE}?teste=1&ator=erika#/editor`);
await p2.waitForFunction(PRONTO, null, { timeout: 60000 });
await p2.waitForTimeout(600);
await p2.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_DEMO);
await p2.waitForTimeout(600);
await p2.screenshot({ path: `${DEST}/20-responsividade-tablet-1024.png` });
console.log('  ✓ 20-responsividade-tablet-1024.png');
await p2.close();

// ─── 21. PERSONAGENS PERSONALIZADOS NO PALCO ─────────────────────────────────
console.log('\n[ 21 ] PERSONAGENS REDESENHADOS NO PALCO');
const ROTEIRO_ELENCO = `# Elenco Completo
[papéis: professor=Elizendra, aluno=Artur]
Elizendra entra pela esquerda andando.
Elizendra diz "Olá turma, sou a professora Elizendra!" feliz.
Artur entra pela direita correndo.
Artur diz "Presente, professora!" animado.
Carol entra pela direita andando.
Carol diz "Oi gente, cheguei!" feliz.
Paraiba entra pela esquerda andando.
Paraiba diz "Opa, bom dia a todos!" confiante.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_ELENCO);
await p.waitForTimeout(1200);
await shot('21-elenco-elizendra-artur-carol-paraiba.png', 'Palco com Elizendra, Artur, Carol e Paraíba');

// ─── 22. CAROL COM CABELOS ONDULADOS E SAIA NO PALCO ─────────────────────────
console.log('\n[ 22 ] CAROL — VISUAL NOVO (CABELOS ONDULADOS, RABO DE CAVALO, SAIA)');
const ROTEIRO_CAROL = `# Carol em Destaque
[papéis: professor=Carol]
Carol entra pela esquerda andando.
Carol diz "Adorei meu novo visual com rabo de cavalo ondulado!" feliz.
Carol acena.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_CAROL);
await p.waitForTimeout(1000);
await shot('22-carol-visual-completo.png', 'Carol com visual adolescente ondulado e saia');

// ─── 23. NAVEGAÇÃO VOLTA À HOME COM CONTINUAR ROTEIRO ────────────────────────
console.log('\n[ 23 ] NAVEGAÇÃO — VOLTA À HOME');
try {
  const btnInicio = p.locator('.barra-superior [data-barra="Início"]');
  if (await btnInicio.count() > 0) {
    await btnInicio.click();
    await p.waitForSelector('.home', { timeout: 10000 });
    await p.waitForTimeout(500);
    await shot('23-retorno-home-com-resumo.png', 'Home exibindo opção Continuar Roteiro');
  }
} catch (e) {
  console.log('  ⚠ Botão Início:', e.message);
}

// ─── FIM ─────────────────────────────────────────────────────────────────────
console.log('\n=============================================');
console.log(`✅ Concluído! Todas as evidências salvas em: ${DEST}/`);
if (p.erros.length > 0) {
  console.log(`⚠ Erros de página JS capturados: ${p.erros.length}`);
  p.erros.forEach(e => console.log('  -', e));
} else {
  console.log('✅ Nenhum erro JavaScript durante toda a execução.');
}

await b.close();
