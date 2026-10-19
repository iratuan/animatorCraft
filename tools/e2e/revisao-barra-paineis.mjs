// Barra de ferramentas do topo, ícones nos menus, painéis redimensionáveis, trilhas de áudio e o ciclo exportar → corrigir sprites → importar.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { unzipSync, zipSync } from 'fflate';
import { criarVerificador, rosto, sprite, wav, servirArquivos } from './util-png.mjs';
import { lerMp4 } from './util-mp4.mjs';

const dest = 'evidencias/40-barra-paineis-trilhas';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const servidor = await servirArquivos(dest);
const b = await chromium.launch({ channel: 'msedge', headless: true });
const PRONTO = () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens');
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));
const abrir = async (q = '') => { await p.goto(`${BASE}?teste=1${q}#/editor`); await p.waitForFunction(PRONTO, null, { timeout: 90000 }); await p.waitForTimeout(500); };
await p.goto(`${BASE}?limpar=${Date.now()}`);
await p.evaluate(() => { localStorage.clear(); for (const n of ['stickboard', 'stickboard-audio', 'stickboard-imagens']) indexedDB.deleteDatabase(n); });
await abrir('&ator=erika');
const sb = (area, fn, ...args) => p.evaluate(([ar, f, a]) => (typeof window.__sb[ar][f] === 'function' ? window.__sb[ar][f](...a) : JSON.parse(JSON.stringify(window.__sb[ar][f]))), [area, fn, args]);
const status = () => p.locator('footer.status span').last().innerText();
const barra = (nome) => p.locator(`.barra-superior [data-barra="${nome}"]`);
const caixa = (sel) => p.locator(sel).first().boundingBox();

// =================================================================== T1: barra de ferramentas
console.log('T1 barra de ferramentas');
const rotulos = await p.locator('.barra-superior button').evaluateAll((bs) => bs.map((x) => x.dataset.barra));
for (const r of ['Início', 'Novo', 'Abrir', 'Salvar', 'Desfazer', 'Refazer', 'Personagem', 'Clipes', 'Sprites', 'Exportar', 'Importar', 'Prompt IA', 'MP4', 'PNG', 'Legendas', 'Manual']) v.ok(rotulos.includes(r), `barra tem "${r}"`);
v.ok(await p.locator('.barra-superior button svg').count() === rotulos.length, 'todos os botões da barra têm ícone');
v.ok((await p.locator('.grupo-barra').count()) >= 5, 'botões agrupados por assunto');
await p.screenshot({ path: `${dest}/01-barra-superior.png` });
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# T\nErika entra pela esquerda andando.\n'));
await p.waitForTimeout(1000);
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# T\nErika entra pela esquerda andando. Erika acena.\n'));
await barra('Desfazer').click();
v.ok(!(await p.locator('#campo-roteiro').inputValue()).includes('acena'), 'Desfazer da barra desfaz');
await barra('Refazer').click();
v.ok((await p.locator('#campo-roteiro').inputValue()).includes('acena'), 'Refazer da barra refaz');
await barra('Personagem').click(); v.ok(await p.locator('[aria-label="Ficha do personagem"]').count() === 1, '"Personagem" abre a ficha'); await p.locator('[aria-label="Ficha do personagem"]').getByRole('button', { name: 'Cancelar' }).click();
await barra('Sprites').click(); v.ok(await p.locator('[aria-label="Editor de sprites do personagem"]').count() === 1, '"Sprites" abre o editor de sprites'); await p.keyboard.press('Escape'); await p.getByRole('button', { name: 'Fechar' }).first().click();
await barra('Clipes').click(); v.ok(await p.locator('[aria-label="Expressões e clipes do personagem"]').count() === 1, '"Clipes" abre expressões e clipes'); await p.locator('.modal-botoes').last().getByRole('button', { name: 'Fechar' }).click();
await barra('Prompt IA').click(); await p.waitForSelector('.prompt-mestre'); v.ok(await p.locator('.prompt-mestre').count() === 1, '"Prompt IA" abre o prompt mestre'); await p.keyboard.press('Escape');
await barra('Manual').click(); await p.waitForSelector('.modal.manual'); v.ok(await p.locator('.modal.manual').count() === 1, '"Manual" abre o manual'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
const [dlPng] = await Promise.all([p.waitForEvent('download'), barra('PNG').click()]); v.igual(dlPng.suggestedFilename(), 'quadro.png', '"PNG" baixa o quadro');
await p.evaluate(() => window.__sb.store.getState().setRoteiro('# T\nErika entra pela esquerda andando. Erika diz "Olá!" feliz.\n'));
const [dlSrt] = await Promise.all([p.waitForEvent('download'), barra('Legendas').click()]); v.igual(dlSrt.suggestedFilename(), 'legendas.srt', '"Legendas" baixa o .srt');
const [fc] = await Promise.all([p.waitForEvent('filechooser'), barra('Importar').click()]); v.ok(!!fc, '"Importar" abre o seletor de zip'); await fc.setFiles([]);
await barra('Início').click(); await p.waitForSelector('.home'); v.ok(true, '"Início" volta à tela inicial');
await abrir('&ator=erika');

// =================================================================== T2: ícones nos menus
console.log('T2 ícones nos menus');
for (const m of ['Arquivo', 'Editar', 'Exportar', 'Exibir', 'Ajuda']) {
  await p.locator('.menubar .menu > button', { hasText: m }).first().click();
  const itens = await p.locator('.dropdown button').evaluateAll((bs) => bs.map((x) => ({ t: x.querySelector('.mr')?.textContent, icone: !!x.querySelector('.mi svg') })));
  v.ok(itens.length > 0 && itens.every((i) => i.icone), `menu ${m}: todos os ${itens.length} itens têm ícone${itens.filter((i) => !i.icone).map((i) => ` (sem: ${i.t})`).join('')}`);
  if (m === 'Arquivo') await p.screenshot({ path: `${dest}/02-menu-arquivo-com-icones.png` });
  await p.keyboard.press('Escape'); await p.mouse.move(900, 500); await p.waitForTimeout(150);
}

// =================================================================== T3: painéis redimensionáveis
console.log('T3 painéis redimensionáveis');
const larg = async (sel) => (await caixa(sel)).width, alt = async (sel) => (await caixa(sel)).height;
const r0 = await larg('.roteiro'), l0 = await larg('.props'), t0 = await alt('.tempo-painel');
const dr = await caixa('.divisor-roteiro');
await p.mouse.move(dr.x + 2, dr.y + 200); await p.mouse.down(); await p.mouse.move(dr.x + 122, dr.y + 200, { steps: 6 }); await p.mouse.up();
const r1 = await larg('.roteiro');
v.ok(Math.abs(r1 - (r0 + 120)) <= 3, `arrastar o divisor do roteiro: ${r0}px → ${r1}px`);
const dl_ = await caixa('.divisor-lateral');
await p.mouse.move(dl_.x + 2, dl_.y + 200); await p.mouse.down(); await p.mouse.move(dl_.x - 98, dl_.y + 200, { steps: 6 }); await p.mouse.up();
const l1 = await larg('.props');
v.ok(Math.abs(l1 - (l0 + 100)) <= 3, `arrastar o divisor lateral (cresce para a esquerda): ${l0}px → ${l1}px`);
const dt = await caixa('.divisor-tempo');
await p.mouse.move(dt.x + 600, dt.y + 2); await p.mouse.down(); await p.mouse.move(dt.x + 600, dt.y - 78, { steps: 6 }); await p.mouse.up();
const t1 = await alt('.tempo-painel');
v.ok(Math.abs(t1 - (t0 + 80)) <= 3, `arrastar o divisor da linha do tempo: ${t0}px → ${t1}px`);
const cv = await caixa('.area-palco canvas');
v.ok(cv.width > 200 && cv.height > 100, `o palco continua desenhado e visível (${Math.round(cv.width)}×${Math.round(cv.height)})`);
await p.screenshot({ path: `${dest}/03-paineis-redimensionados.png` });
// limites
const dr2 = await caixa('.divisor-roteiro');
await p.mouse.move(dr2.x + 2, dr2.y + 200); await p.mouse.down(); await p.mouse.move(1500, dr2.y + 200, { steps: 8 }); await p.mouse.up();
v.ok((await larg('.roteiro')) <= 801 && (await larg('.palco')) > 150, `limite máximo do roteiro respeitado (${await larg('.roteiro')}px) e o palco não some`);
const dr3 = await caixa('.divisor-roteiro');
await p.mouse.move(dr3.x + 2, dr3.y + 200); await p.mouse.down(); await p.mouse.move(0, dr3.y + 200, { steps: 8 }); await p.mouse.up();
v.ok((await larg('.roteiro')) >= 179, `limite mínimo do roteiro (${await larg('.roteiro')}px)`);
// teclado e duplo clique
await p.locator('.divisor-roteiro').focus(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
v.ok(Math.abs((await larg('.roteiro')) - 200) <= 2, 'setas movem a divisória de 10 em 10 px (acessível por teclado)');
await p.locator('.divisor-roteiro').dblclick();
v.ok(Math.abs((await larg('.roteiro')) - 360) <= 2, 'duplo clique restaura o tamanho padrão');
// persistência
await p.locator('.divisor-roteiro').focus(); await p.keyboard.press('Shift+ArrowRight'); await p.keyboard.press('Shift+ArrowRight');
const guardado = await larg('.roteiro');
await abrir('&ator=erika');
v.ok(Math.abs((await larg('.roteiro')) - guardado) <= 2 && guardado > 400, `o tamanho dos painéis persiste depois de recarregar (${guardado}px)`);
await p.locator('.divisor-roteiro').dblclick();
for (const k of ['lateral', 'tempo']) await p.locator(`.divisor-${k}`).dblclick();
v.ok(Math.abs((await larg('.props')) - 300) <= 2 && Math.abs((await alt('.tempo-painel')) - 232) <= 2, 'duplo clique restaura os três painéis');
// armazenamento corrompido não quebra
await p.evaluate(() => localStorage.setItem('stickboard.paineis.v1', '{"roteiro":"x","lateral":null,"tempo":99999}'));
await abrir('&ator=erika');
v.ok((await larg('.roteiro')) === 360 && (await alt('.tempo-painel')) <= 601, 'tamanhos inválidos guardados voltam ao padrão/limite');

// =================================================================== T4: trilhas de áudio
console.log('T4 trilhas de áudio');
writeFileSync(`${dest}/voz-erika.wav`, wav(2, 300)); writeFileSync(`${dest}/voz-dario.wav`, wav(2, 520)); writeFileSync(`${dest}/musica.wav`, wav(8, 220)); writeFileSync(`${dest}/chuva.wav`, wav(8, 700)); writeFileSync(`${dest}/palmas.wav`, wav(0.6, 880));
const ROT = '[papéis: professor=Erika, aluno=Dario]\n\n# Som\n[música: musica.wav, volume 40%]\n[música: chuva.wav, volume 40%, trilha ambiente]\nErika entra pela esquerda andando. Dario entra correndo pela direita.\nErika diz "Oi, Dario!". [áudio: voz-erika.wav]\nDario diz "Oi, mãe!". [áudio: voz-dario.wav]\n[efeito: palmas.wav]\nEspera 2 segundos.\n[música: parar trilha ambiente]\nEspera 1 segundos.';
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROT);
await p.getByRole('button', { name: 'Áudio', exact: true }).click();
await p.locator('input[type=file][accept*="audio"]').setInputFiles(['voz-erika.wav', 'voz-dario.wav', 'musica.wav', 'chuva.wav', 'palmas.wav'].map((n) => `${dest}/${n}`));
await p.waitForTimeout(2500);
v.igual(await p.evaluate((r) => window.__sb.dominio.parseRoteiro(r).avisos, ROT), [], 'roteiro com trilhas sem avisos');
const nomesTrilhas = await p.locator('.mixer-trilha b').allInnerTexts();
v.igual(nomesTrilhas, ['Voz — Erika', 'Voz — Dario', 'Efeitos', 'Música', 'Ambiente'], 'o painel de áudio lista as trilhas: vozes, efeitos, música e a trilha criada');
const lanes = await p.locator('.camada .nome').allInnerTexts();
v.ok(['Voz — Erika', 'Voz — Dario', 'Efeitos', 'Música', 'Ambiente'].every((n) => lanes.includes(n)), `a linha do tempo tem uma faixa por trilha (${lanes.join(' | ')})`);
v.ok((await p.locator('.camada:has(.ctl-trilha)').count()) === 5, 'cada faixa de áudio tem botões M e S');
await p.screenshot({ path: `${dest}/04-trilhas.png` });
// mudo / solo / volume
const estado = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__sb.store.getState().trilhas)));
await p.locator('.camada', { hasText: 'Música' }).getByLabel('Mudo: musica').click();
v.ok((await estado()).musica?.mudo === true, 'M da faixa silencia a trilha');
await p.locator('.mixer-trilha[data-trilha="efeitos"] input[type=range]').fill('0.5');
v.igual((await estado()).efeitos?.volume, 0.5, 'o volume da trilha vem do controle deslizante');
await p.locator('.mixer-trilha[data-trilha="ambiente"] button', { hasText: 'S' }).click();
v.ok((await estado()).ambiente?.solo === true, 'S da trilha ativa o solo');
await abrir('&ator=erika');
v.ok((await estado()).musica?.mudo === true && (await estado()).efeitos?.volume === 0.5, 'a mixagem persiste depois de recarregar');
// o som exportado obedece à mixagem
const energia = async (arquivo) => { const pg = await ctx.newPage(); await pg.goto(`http://127.0.0.1:${servidor.porta}/${arquivo}`); const r = await pg.evaluate(async () => { const buf = await (await fetch(location.href)).arrayBuffer(); const ac = new OfflineAudioContext(2, 48000, 48000); try { const a = await ac.decodeAudioData(buf); const L = a.getChannelData(0); const rms = (x, z) => { let s = 0, n = 0; for (let i = Math.floor(x * a.sampleRate); i < Math.min(L.length, Math.floor(z * a.sampleRate)); i++) { s += L[i] * L[i]; n++; } return Math.sqrt(s / Math.max(1, n)); }; return { total: rms(0, a.duration), dur: a.duration }; } catch (e) { return { erro: String(e) }; } }); await pg.close(); return r; };
const exportarMp4 = async (arquivo) => { const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 200000 }), barra('MP4').click()]); await dl.saveAs(`${dest}/${arquivo}`); return lerMp4(readFileSync(`${dest}/${arquivo}`)); };
await p.evaluate(() => { const s = window.__sb.store; s.setState({ trilhas: {} }); });
const mTodas = await exportarMp4('todas.mp4'); const eTodas = await energia('todas.mp4');
v.ok(!!mTodas.audio && eTodas.total > 0.01, `todas as trilhas: áudio presente (energia ${eTodas.total?.toFixed(3)})`);
await p.evaluate(() => window.__sb.store.getState().definirTrilha('musica', { mudo: true })); await p.evaluate(() => window.__sb.store.getState().definirTrilha('ambiente', { mudo: true }));
const mSemMusica = await exportarMp4('sem-musica.mp4'); const eSem = await energia('sem-musica.mp4');
v.ok(!!mSemMusica.audio && eSem.total < eTodas.total * 0.9, `mudar músicas reduz a energia do mix (${eSem.total.toFixed(3)} < ${eTodas.total.toFixed(3)})`);
await p.evaluate(() => { const st = window.__sb.store.getState(); for (const id of ['musica', 'ambiente', 'efeitos', 'voz:erika', 'voz:dario']) st.definirTrilha(id, { mudo: true }); });
const mMudo = await exportarMp4('tudo-mudo.mp4');
v.ok(!mMudo.audio, 'com todas as trilhas mudas o MP4 sai sem faixa de áudio');
await p.evaluate(() => { const st = window.__sb.store.getState(); for (const id of ['musica', 'ambiente', 'efeitos', 'voz:erika', 'voz:dario']) st.definirTrilha(id, { mudo: false, solo: false }); st.definirTrilha('efeitos', { solo: true }); });
const mSolo = await exportarMp4('solo-efeitos.mp4'); const eSolo = await energia('solo-efeitos.mp4');
v.ok(!!mSolo.audio && eSolo.total < eTodas.total * 0.6 && eSolo.total > 0, `solo nos efeitos: só eles soam (${eSolo.total.toFixed(3)})`);
// projeto leva a mixagem
await p.evaluate(() => window.__sb.store.getState().definirTrilha('efeitos', { solo: false, volume: 0.7 }));
const [dlp] = await Promise.all([p.waitForEvent('download'), (async () => { await p.getByText('Arquivo').first().click(); await p.getByText('Salvar projeto completo (.zip)…').click(); })()]);
await dlp.saveAs(`${dest}/projeto-trilhas.zip`);
const pj = JSON.parse(new TextDecoder().decode(unzipSync(new Uint8Array(readFileSync(`${dest}/projeto-trilhas.zip`)))['projeto.json']));
v.ok(pj.trilhas?.efeitos?.volume === 0.7, 'o projeto guarda a mixagem das trilhas');

// =================================================================== T5: exportar personagem → corrigir sprites fora do app → importar
console.log('T5 exportar → corrigir → importar');
await p.evaluate(() => { localStorage.clear(); });
await abrir('&ator=laura');
const contar = (bytes) => p.evaluate(async (b64) => { const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0, verdes = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 40) { n++; if (d[i + 1] > 150 && d[i] < 80) verdes++; } return { w: img.width, h: img.height, n, verdes }; }, Buffer.from(bytes).toString('base64'));
const [dlz] = await Promise.all([p.waitForEvent('download'), barra('Exportar').click()]);
v.igual(dlz.suggestedFilename(), 'sprites-laura.zip', 'o botão exporta o personagem selecionado (Laura)');
await dlz.saveAs(`${dest}/sprites-laura.zip`);
const original = unzipSync(new Uint8Array(readFileSync(`${dest}/sprites-laura.zip`)));
const pngs = Object.keys(original).filter((k) => k.endsWith('.png'));
v.ok(pngs.includes('laura/pose_parado.png') && pngs.length > 15, `zip com ${pngs.length} sprites`);
// "corrige" no editor externo: troca o pose_parado e um rosto por imagens novas (verdes)
const editado = { ...original };
editado['laura/pose_parado.png'] = sprite(260, 520, [0, 200, 0]);
editado['laura/rosto_feliz.png'] = rosto(140, 140, [0, 200, 0]);
writeFileSync(`${dest}/laura-corrigida.zip`, zipSync(editado));
const antes = {}; for (const k of pngs) antes[k] = await contar(original[k]);
const [fcz] = await Promise.all([p.waitForEvent('filechooser'), barra('Importar').click()]);
await fcz.setFiles(`${dest}/laura-corrigida.zip`); await p.waitForTimeout(800);
const modal = p.locator('[aria-label="Importar pacote de sprites"]');
v.ok(await modal.locator('.erros-pacote').count() === 0, 'o zip corrigido passa na validação (sem erros)');
await modal.getByRole('button', { name: 'Importar' }).click(); await p.waitForFunction(() => document.querySelector('[aria-label="Importar pacote de sprites"]') === null, null, { timeout: 60000 }); await p.waitForTimeout(800);
const [dlz2] = await Promise.all([p.waitForEvent('download'), barra('Exportar').click()]);
await dlz2.saveAs(`${dest}/sprites-laura-depois.zip`);
const depois = unzipSync(new Uint8Array(readFileSync(`${dest}/sprites-laura-depois.zip`)));
v.igual(Object.keys(depois).filter((k) => k.endsWith('.png')).sort(), [...pngs].sort(), 'depois de importar, o personagem tem exatamente os mesmos sprites');
const pd = await contar(depois['laura/parado.png'] ?? depois['laura/pose_parado.png']);
v.ok(pd.verdes > pd.n * 0.8, `pose_parado agora é a corrigida (verde: ${pd.verdes}/${pd.n} pixels)`);
const fd = await contar(depois['laura/rosto_feliz.png']);
v.ok(fd.verdes > 100, 'rosto_feliz agora é o corrigido');
let intactos = 0, mudaram = [];
for (const k of pngs.filter((k) => !/pose_parado|rosto_feliz/.test(k))) { const d = await contar(depois[k]); if (Math.abs(d.n - antes[k].n) <= antes[k].n * 0.02 + 8) intactos++; else mudaram.push(k); }
v.ok(mudaram.length === 0, `os outros ${intactos} sprites continuam iguais (pixels visíveis); alterados: ${mudaram.join(', ') || 'nenhum'}`);
// o app usa o sprite corrigido
const sp = await p.evaluate(() => { const s = window.__sb.cena.escolherSprite('laura', ['parado']); return { w: s.w, h: s.h }; });
v.ok(sp.w > 100 && sp.h > 200, 'o palco usa o novo pose_parado');
// reimportar o que acabou de exportar não muda nada (estabiliza)
await p.evaluate(() => { localStorage.setItem('x', '1'); });
const [fcz2] = await Promise.all([p.waitForEvent('filechooser'), barra('Importar').click()]);
await fcz2.setFiles(`${dest}/sprites-laura-depois.zip`); await p.waitForTimeout(800);
await modal.getByRole('button', { name: 'Importar' }).click(); await p.waitForFunction(() => document.querySelector('[aria-label="Importar pacote de sprites"]') === null, null, { timeout: 60000 }); await p.waitForTimeout(800);
const [dlz3] = await Promise.all([p.waitForEvent('download'), barra('Exportar').click()]);
await dlz3.saveAs(`${dest}/sprites-laura-depois2.zip`);
const depois2 = unzipSync(new Uint8Array(readFileSync(`${dest}/sprites-laura-depois2.zip`)));
v.ok(pngs.every((k) => { const a = depois[k], c = depois2[k]; return a.length === c.length && a.every((x, i) => x === c[i]); }), 'exportar → importar → exportar de novo dá arquivos idênticos byte a byte');
// só os arquivos corrigidos (sem pose_parado) também entram
writeFileSync(`${dest}/so-rosto.zip`, zipSync({ 'laura/rosto_brava.png': rosto(130, 130, [0, 200, 0]) }));
const [fcz3] = await Promise.all([p.waitForEvent('filechooser'), barra('Importar').click()]);
await fcz3.setFiles(`${dest}/so-rosto.zip`); await p.waitForTimeout(800);
v.ok(await modal.locator('.erros-pacote').count() === 0, 'pacote só com um arquivo corrigido é aceito (sem exigir pose_parado)');
await modal.getByRole('button', { name: 'Importar' }).click(); await p.waitForFunction(() => document.querySelector('[aria-label="Importar pacote de sprites"]') === null, null, { timeout: 60000 }); await p.waitForTimeout(800);
v.ok((await sb('cena', 'listarSprites', 'laura')).poses.includes('parado'), 'e os outros sprites da Laura ficam');
await p.screenshot({ path: `${dest}/05-apos-reimportar.png` });

v.ok(p.erros.length === 0, `sem erros de página: ${p.erros.join(' | ')}`);
await b.close(); servidor.fechar();
process.exit(v.fim('barra, painéis, trilhas e ciclo de sprites'));
