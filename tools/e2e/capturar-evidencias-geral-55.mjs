/**
 * capturar-evidencias-geral-55.mjs
 * Rodada Completa de Coleta de Evidências com todas as funcionalidades evidenciadas em screenshots:
 * - Tela Inicial e Modais
 * - Barra de Ferramentas com Ícones Flat SVG
 * - Fala Colorida com Destaque no Roteiro e Balões de Fala
 * - Editor de Imagem com Ícones Flat
 * - Ficha de Personagem com Suporte a JSON e Vetores SVG
 * - Expressões e Clipes dos Personagens (Artur, Carol, Elizendra, Véia, Véio, Paraíba, Mingau)
 * - Lousa com LaTeX e Gráficos
 * - Linha do Tempo Multitrack, Context Menu, Edição e Gravação
 * - Transporte e Reprodução
 * - Formatos e Câmeras
 * - Exportações e Responsividade
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DEST = 'evidencias/55-revisao-geral-funcionalidades';
mkdirSync(DEST, { recursive: true });

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const PRONTO = () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens');

console.log('🚀 Iniciando navegador Edge para coleta de evidências da Rodada 55...');
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
p.erros = [];
p.on('pageerror', (e) => {
  console.warn('  [PageError]', String(e));
  p.erros.push(String(e));
});

const shot = async (nome, desc = '') => {
  const caminho = join(DEST, nome);
  await p.screenshot({ path: caminho, fullPage: false });
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

const fecharTodosModais = async () => {
  await p.evaluate(() => {
    if (window.__sb?.store) {
      window.__sb.store.getState().set({
        editorImagem: null,
        fichaPersonagem: null,
        editorAnimacao: null,
        editorSprites: null,
        editorMatematicaAberto: false,
        iaModalAberto: false,
        menuAberto: null,
      });
    }
  });
  await p.waitForTimeout(300);
};

const abrirEditor = async (q = '') => {
  await p.goto(`${BASE}?teste=1${q}#/editor`);
  await p.waitForFunction(PRONTO, null, { timeout: 90000 });
  await p.waitForTimeout(600);
  await fecharTodosModais();
};

// ─── 1. TELA INICIAL (HOME) ──────────────────────────────────────────────────
console.log('\n[ 1 ] TELA INICIAL');
await limpar();
await p.goto(`${BASE}#/`);
await p.waitForSelector('.home', { timeout: 25000 });
await p.waitForTimeout(500);
await shot('01-home-tela-inicial.png', 'Tela Inicial com carrossel, modelos e ações rápidas');

// ─── 2. PROMPT MESTRE NA HOME ────────────────────────────────────────────────
console.log('\n[ 2 ] PROMPT MESTRE / IA NA HOME');
const btnPromptMestre = p.locator('[data-teste="prompt-mestre"]');
if (await btnPromptMestre.count() > 0) {
  await btnPromptMestre.click();
  await p.waitForSelector('.prompt-mestre', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('02-home-modal-prompt-mestre.png', 'Modal do Prompt Mestre IA');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}

// ─── 3. MANUAL DO USUÁRIO NA HOME ────────────────────────────────────────────
console.log('\n[ 3 ] MANUAL DO USUÁRIO NA HOME');
const btnManualHome = p.locator('[data-teste="manual"]');
if (await btnManualHome.count() > 0) {
  await btnManualHome.click();
  await p.waitForSelector('.modal.manual', { timeout: 6000 });
  await p.waitForTimeout(400);
  await shot('03-home-modal-manual.png', 'Manual do Usuário');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}

// ─── 4. VISÃO GERAL DO EDITOR & BARRA SUPERIOR FLAT ──────────────────────────
console.log('\n[ 4 ] VISÃO GERAL DO EDITOR COM BARRA FLAT');
await abrirEditor('&ator=cringefather');

const ROTEIRO_GERAL = `# Aula de Demonstração Geral
[papéis: professor=CringeFather, aluno=BetaSon]
[cenário: lousa]

CringeFather entra pela esquerda andando.
CringeFather diz "Bem-vindos! Hoje veremos a fórmula da relatividade restrita." confiante.
CringeFather escreve "E = m * c²" na lousa.
BetaSon entra pela direita correndo.
BetaSon diz "Professor, a velocidade da luz é constante?" surpreso.
CringeFather aponta para a lousa.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_GERAL);
await p.waitForTimeout(800);
await shot('04-editor-visao-geral.png', 'Editor Completo: Palco, Roteiro, Timeline e Barra Superior');

// ─── 5. MENUS SUSPENSOS DA BARRA SUPERIOR ───────────────────────────────────
console.log('\n[ 5 ] MENUS SUSPENSOS');
const btnArquivo = p.locator('.menubar .menu > button', { hasText: 'Arquivo' }).first();
if (await btnArquivo.count() > 0) {
  await btnArquivo.click();
  await p.waitForTimeout(300);
  await shot('05-menu-arquivo.png', 'Menu suspenso Arquivo aberto');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
}

// ─── 6. FALA COLORIDA (DESTAQUE DE PALAVRAS E VARIÁVEIS) ─────────────────────
console.log('\n[ 6 ] FALA COLORIDA NO ROTEIRO E BALÕES');
const ROTEIRO_COLORIDO = `# Aula com Fala Colorida
[papéis: professor=CringeFather, aluno=BetaSon]
[cenário: lousa]

CringeFather entra pela esquerda andando.
CringeFather diz "Observem que a <cor:amarelo>energia E</cor> equivale à <cor:verde>massa m</cor> vezes a <cor:ciano>velocidade da luz c</cor> ao quadrado." feliz.
CringeFather escreve "E = m * c^2" na lousa.
BetaSon entra pela direita andando.
BetaSon diz "Entendido! Então <cor:rosa>c</cor> é a <cor:laranja>constante universal</cor>!" empolgado.
Espera 2 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_COLORIDO);
await p.waitForTimeout(800);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.5 }));
await p.waitForTimeout(600);
await shot('06-roteiro-fala-colorida-destaque.png', 'Roteiro com marcações de fala colorida e palco com balão renderizado');

// ─── 7. EDITOR DE IMAGENS / SPRITES COM ÍCONES FLAT SVG ──────────────────────
console.log('\n[ 7 ] EDITOR DE IMAGENS / SPRITES COM ÍCONES FLAT');
try {
  await p.evaluate(() => {
    window.__sb.store.getState().set({
      editorImagem: { personagem: 'betason', tipo: 'pose', nome: 'parado' }
    });
  });
  await p.waitForSelector('.ei-fundo', { timeout: 8000 });
  await p.waitForTimeout(500);
  await shot('07-editor-imagem-icones-flat.png', 'Editor de Imagens com novos ícones Flat SVG na barra lateral e camadas');
} catch (e) {
  console.log('  ⚠ Editor de Imagem:', e.message);
} finally {
  await fecharTodosModais();
}

// ─── 8. FICHA DE PERSONAGEM COM JSON E VETORES SVG ───────────────────────────
console.log('\n[ 8 ] FICHA DO PERSONAGEM COM EXPORTAÇÃO/IMPORTAÇÃO JSON');
try {
  await p.evaluate(() => {
    window.__sb.store.getState().set({ fichaPersonagem: { id: 'artur' } });
  });
  await p.waitForSelector('[aria-label="Ficha do personagem"]', { timeout: 8000 });
  await p.waitForTimeout(500);
  await shot('08-ficha-personagem-json-e-svg.png', 'Ficha do personagem com botões de Exportar/Importar JSON e SVG');
} catch (e) {
  console.log('  ⚠ Ficha de personagem:', e.message);
} finally {
  await fecharTodosModais();
}

// ─── 9. EXPRESSÕES E CLIPES MODAL ────────────────────────────────────────────
console.log('\n[ 9 ] MODAL DE EXPRESSÕES E CLIPES');
try {
  await p.evaluate(() => {
    window.__sb.store.getState().set({ editorAnimacao: { ator: 'artur' } });
  });
  await p.waitForSelector('[aria-label="Expressões e clipes do personagem"]', { timeout: 8000 });
  await p.waitForTimeout(500);
  await shot('09-modal-expressoes-e-clipes.png', 'Gerenciador de Expressões e Clipes com pré-visualização');
} catch (e) {
  console.log('  ⚠ Expressões e clipes:', e.message);
} finally {
  await fecharTodosModais();
}

// ─── 10. CLIPES EXCLUSIVOS DOS NOVOS PERSONAGENS NO PALCO ─────────────────────
console.log('\n[ 10 ] PERSONAGENS COM NOVOS CLIPES NO PALCO');

// Artur: videogame
const ROTEIRO_ARTUR = `# Artur Gamer
[papéis: professor=Artur]
Artur entra pela esquerda andando.
Artur diz "Hora de zerar o jogo!" feliz.
Artur senta.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_ARTUR);
await p.waitForTimeout(600);
await p.evaluate(() => window.__sb.store.getState().set({ t: 1.8 }));
await p.waitForTimeout(400);
await shot('10-palco-artur-gamer.png', 'Artur executando movimento gamer no palco');

// Carol: atitude
const ROTEIRO_CAROL = `# Carol Atitude
[papéis: professor=Carol]
Carol entra pela esquerda andando.
Carol diz "Estilo e atitude sempre!" feliz.
Carol cruza os braços.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_CAROL);
await p.waitForTimeout(600);
await p.evaluate(() => window.__sb.store.getState().set({ t: 1.8 }));
await p.waitForTimeout(400);
await shot('11-palco-carol-atitude.png', 'Carol executando pose de atitude no palco');

// Elizendra & Véia & Véio
const ROTEIRO_FAMILIA = `# Família Reunida
[papéis: professor=Elizendra, aluno=Veia]
Elizendra entra pela esquerda andando.
Elizendra diz "Fiz um bolo delicioso para todos!" feliz.
Veia entra pela direita andando.
Veia diz "Hum, espero que não tenha queimado desta vez!" brava.
Veio entra pela direita andando.
Veio diz "Que poema de aroma se espalha pela casa!" feliz.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_FAMILIA);
await p.waitForTimeout(800);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.2 }));
await p.waitForTimeout(400);
await shot('12-palco-elizendra-veia-veio.png', 'Elizendra, Véia e Véio com animações e reações');

// Paraíba & Mingau (Pets com animações exclusivas)
const ROTEIRO_PETS = `# Paraíba e Mingau
[papéis: professor=Paraiba, aluno=Mingau]
Paraiba entra pela esquerda andando.
Paraiba diz "Au au! Bom dia amigo!" feliz.
Mingau entra pela direita andando.
Mingau diz "Miau! Bom dia para você também!" feliz.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_PETS);
await p.waitForTimeout(800);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.0 }));
await p.waitForTimeout(400);
await shot('13-palco-paraiba-e-mingau.png', 'Paraíba e Mingau com proporções e animações características');

// ─── 11. LOUSA COM FÓRMULAS LATEX E MATEMÁTICA ──────────────────────────────
console.log('\n[ 11 ] LOUSA COM FÓRMULAS LATEX');
const ROTEIRO_LATEX = `# Aula de Cálculo e Física
[papéis: professor=CringeFather]
[cenário: lousa]

CringeFather entra pela esquerda andando.
CringeFather escreve "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" na lousa.
CringeFather diz "Esta é a célebre Integral Gaussiana." feliz.
CringeFather aponta para a lousa.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_LATEX);
await p.waitForTimeout(800);
await p.evaluate(() => window.__sb.store.getState().set({ t: 2.5 }));
await p.waitForTimeout(500);
await shot('14-lousa-latex-integral-gaussiana.png', 'Lousa renderizando fórmula matemática complexa em KaTeX/LaTeX');

// ─── 12. LINHA DO TEMPO COM CONTEXT MENU E DIALOGS ───────────────────────────
console.log('\n[ 12 ] LINHA DO TEMPO: CONTEXT MENU E DIALOG DE EDIÇÃO');
await fecharTodosModais();

const falaBloco = p.locator('.bloco.fala').first();
if (await falaBloco.count() > 0) {
  await falaBloco.click({ button: 'right' });
  await p.waitForTimeout(300);
  await shot('15a-timeline-context-menu.png', 'Menu de contexto acionado sobre a fala na linha do tempo');

  const btnEditarFala = p.locator('.context-menu button').first();
  if (await btnEditarFala.count() > 0) {
    await btnEditarFala.click();
    await p.waitForTimeout(400);
    await shot('15b-dialog-editar-fala.png', 'Dialog de Edição da Fala aberto na timeline');

    const btnSalvar = p.locator('.dialog button', { hasText: 'Salvar' });
    if (await btnSalvar.count() > 0) await btnSalvar.click();
    await p.waitForTimeout(300);
  }

  // Gravar áudio
  const falaBloco2 = p.locator('.bloco.fala').first();
  await falaBloco2.click({ button: 'right' });
  await p.waitForTimeout(300);
  const btnGravarAudio = p.locator('.context-menu button').nth(1);
  if (await btnGravarAudio.count() > 0) {
    await btnGravarAudio.click();
    await p.waitForTimeout(400);
    await shot('15c-dialog-gravar-audio.png', 'Dialog de Gravação de Áudio');
    const btnCancelar = p.locator('.dialog button', { hasText: 'Cancelar' });
    if (await btnCancelar.count() > 0) await btnCancelar.click();
    await p.waitForTimeout(200);
  }
}

// ─── 13. BARRA DE TRANSPORTE EM REPRODUÇÃO ───────────────────────────────────
console.log('\n[ 13 ] BARRA DE TRANSPORTE');
const playBtn = p.locator('.transporte button.play').first();
if (await playBtn.count() > 0) {
  await playBtn.click();
  await p.waitForTimeout(1000);
  await shot('16-transporte-em-execucao.png', 'Transporte com playback ativo, playhead em movimento e tempo decorrido');
  await playBtn.click(); // pausa
  await p.waitForTimeout(200);
}

// ─── 14. FORMATO PODCAST E CÂMERA ────────────────────────────────────────────
console.log('\n[ 14 ] FORMATO PODCAST');
const ROTEIRO_PODCAST = `# Conversa em Dupla
[formato: podcast]
[papéis: professor=Erika, aluno=Dario]

Erika entra pela esquerda andando.
Dario entra pela direita andando.
Erika diz "Sejam todos muito bem-vindos ao podcast de hoje!" feliz.
Dario diz "Hoje o assunto é dinossauros, né?" empolgado.
Espera 1 segundos.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_PODCAST);
await p.waitForTimeout(800);
await shot('17-formato-podcast-encontro.png', 'Cenário Podcast configurado com enquadramento em dupla');

// ─── 15. EXPORTAÇÕES ─────────────────────────────────────────────────────────
console.log('\n[ 15 ] EXPORTAÇÕES (PNG E SRT)');
try {
  const [dlPng] = await Promise.all([
    p.waitForEvent('download', { timeout: 15000 }),
    p.locator('.barra-superior [data-barra="PNG"]').click()
  ]);
  console.log('  Download PNG concluído:', dlPng.suggestedFilename());
  await shot('18-exportacao-quadro-png.png', 'Quadro capturado e exportado via botão PNG');
} catch (e) {
  console.log('  ⚠ Export PNG:', e.message);
}

try {
  const [dlSrt] = await Promise.all([
    p.waitForEvent('download', { timeout: 15000 }),
    p.locator('.barra-superior [data-barra="Legendas"]').click()
  ]);
  console.log('  Download SRT concluído:', dlSrt.suggestedFilename());
  await shot('19-exportacao-legendas-srt.png', 'Legendas SRT geradas e exportadas');
} catch (e) {
  console.log('  ⚠ Export SRT:', e.message);
}

// ─── 16. RESPONSIVIDADE ──────────────────────────────────────────────────────
console.log('\n[ 16 ] RESPONSIVIDADE: TABLET (1024x768) E MOBILE (390x844)');
const pTablet = await ctx.newPage();
await pTablet.setViewportSize({ width: 1024, height: 768 });
await pTablet.goto(`${BASE}?teste=1#/editor`);
await pTablet.waitForFunction(PRONTO, null, { timeout: 60000 });
await pTablet.waitForTimeout(600);
await pTablet.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROTEIRO_COLORIDO);
await pTablet.waitForTimeout(600);
await pTablet.screenshot({ path: `${DEST}/20-responsividade-tablet-1024x768.png` });
console.log('  ✓ 20-responsividade-tablet-1024x768.png');
await pTablet.close();

const pMobile = await ctx.newPage();
await pMobile.setViewportSize({ width: 390, height: 844 });
await pMobile.goto(`${BASE}#/`);
await pMobile.waitForSelector('.home', { timeout: 25000 });
await pMobile.waitForTimeout(600);
await pMobile.screenshot({ path: `${DEST}/21-responsividade-mobile-home-390x844.png` });
console.log('  ✓ 21-responsividade-mobile-home-390x844.png');
await pMobile.close();

// ─── 17. FINALIZAÇÃO E RELATÓRIO ─────────────────────────────────────────────
console.log('\n=============================================');
console.log(`✅ Concluído! Todas as evidências salvas em: ${DEST}/`);
if (p.erros.length > 0) {
  console.log(`⚠ Erros de página JS capturados: ${p.erros.length}`);
  p.erros.forEach(e => console.log('  -', e));
} else {
  console.log('✅ Nenhum erro JavaScript durante toda a execução da coleta de evidências.');
}

await b.close();
