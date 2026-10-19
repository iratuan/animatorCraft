// Revisão de lançamento — EXPORTAÇÃO: MP4 nos dois formatos (estrutura, codec, resolução, duração, áudio, reprodução, fidelidade ao preview),
// proteções (roteiro vazio, vídeo longo, clique duplo), legendas (.srt), quadro (.png) e prompt (.md).
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { criarVerificador, servirArquivos, wav } from './util-png.mjs';
import { lerMp4 } from './util-mp4.mjs';

const dest = 'evidencias/38-revisao-lancamento/exportacao';
mkdirSync(dest, { recursive: true });
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const v = criarVerificador();
const servidor = await servirArquivos(resolve(dest));
const urlDe = (arquivo) => `http://127.0.0.1:${servidor.porta}/${arquivo.split('/').pop()}`;
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
p.erros = []; p.on('pageerror', (e) => p.erros.push(String(e)));

const ROTEIRO = `[papéis: professor=CringeFather, aluno=BetaSon]

# Aula
Professor entra pela esquerda andando. Aluno entra correndo pela direita.
Professor diz "Vamos testar a exportação!" irritado.
Professor escreve $x^2 + 1$ no quadro.
Aluno diz "Funciona? Ação, emoção e acentuação!" feliz.
Enquanto Professor aponta, Aluno dança por 2 segundos.`;

async function carregar(roteiro, consulta = '') {
  await p.goto(`${BASE}?preparo=${Date.now()}#/editor`);
  await p.evaluate((r) => { localStorage.clear(); indexedDB.deleteDatabase('stickboard-audio'); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
  await p.goto(`${BASE}?teste=1${consulta}#/editor`);
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(600);
}
const duracaoDoRoteiro = () => p.evaluate(() => { const d = window.__sb.dominio, st = window.__sb.store.getState(); return d.construirTimeline(d.parseRoteiro(st.roteiro)).duracao; });
const status = () => p.locator('footer.status span').last().innerText();
const esperarStatus = (re, t = 120000) => p.waitForFunction((r) => new RegExp(r).test(document.querySelector('footer.status')?.innerText ?? ''), re.source, { timeout: t });
const menu = async (item) => { await p.getByText('Exportar', { exact: true }).first().click(); await p.getByText(item, { exact: false }).first().click(); };

async function exportar(item, arquivo) {
  const t0 = Date.now();
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 280000 }), menu(item)]);
  await dl.saveAs(arquivo);
  return { seg: (Date.now() - t0) / 1000, nome: dl.suggestedFilename() };
}

/** Reproduz o MP4 no Edge: metadados, quadros em vários instantes (desenhados num canvas) e hash para ver que a imagem muda. */
async function reproduzir(arquivo, instantes) {
  const pg = await ctx.newPage();
  await pg.goto(urlDe(arquivo));
  const r = await pg.evaluate(async (ts) => {
    const el = document.querySelector('video');
    await new Promise((ok) => { if (el.readyState >= 1) ok(); else el.onloadedmetadata = ok; });
    const out = { duracao: el.duration, w: el.videoWidth, h: el.videoHeight, quadros: [] };
    for (const f of ts) {
      el.currentTime = Math.min(el.duration - 0.05, f * el.duration);
      await new Promise((ok) => { el.onseeked = ok; });
      const c = document.createElement('canvas'); c.width = 320; c.height = Math.round((320 * el.videoHeight) / el.videoWidth);
      const x = c.getContext('2d'); x.drawImage(el, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data; let h = 0, escuros = 0;
      for (let i = 0; i < d.length; i += 4) { h = (h * 31 + d[i] + d[i + 1] * 3) >>> 0; if (d[i] < 100) escuros++; }
      out.quadros.push({ t: el.currentTime, hash: h, escuros, png: c.toDataURL('image/png') });
    }
    return out;
  }, instantes);
  await pg.close();
  return r;
}

// =================================================================== E1: 16:9
console.log('E1 MP4 16:9');
await carregar(ROTEIRO);
const durRoteiro = await duracaoDoRoteiro();
const e1 = await exportar('Vídeo MP4 (YouTube', `${dest}/aula-16x9.mp4`);
v.igual(e1.nome, 'stickboard-video.mp4', 'nome do arquivo do vídeo horizontal');
const m1 = lerMp4(readFileSync(`${dest}/aula-16x9.mp4`));
console.log(`  ${e1.seg.toFixed(1)} s para exportar ${durRoteiro.toFixed(1)} s de vídeo; ${(m1.tamanho / 1e6).toFixed(2)} MB; codec ${m1.video?.codec}; marca ${m1.marca}`);
v.ok(m1.moovAntesDeMdat, 'moov antes do mdat (começa a tocar sem baixar tudo: exigência de YouTube/Instagram)');
v.ok(['avc1', 'vp09'].includes(m1.video?.codec), `codec de vídeo ${m1.video?.codec}`);
v.igual([m1.video.w, m1.video.h], [1920, 1080], 'resolução 1920×1080');
v.ok(Math.abs(m1.video.tkhdW - 1920) < 1 && Math.abs(m1.video.tkhdH - 1080) < 1, 'dimensões do cabeçalho da faixa');
const esperadoQuadros = Math.ceil((durRoteiro + 0.5) * 30);
v.ok(Math.abs(m1.video.amostras - esperadoQuadros) <= 1, `quadros: ${m1.video.amostras} (esperado ${esperadoQuadros} = (duração ${durRoteiro.toFixed(2)} + 0,5) × 30)`);
v.ok(Math.abs(m1.video.duracao - (durRoteiro + 0.5)) < 0.1, `duração do vídeo ${m1.video.duracao.toFixed(2)} s ≈ roteiro + 0,5 s`);
v.ok(m1.video.quadrosChave >= 2, `quadros-chave suficientes para pular no vídeo (${m1.video.quadrosChave})`);
v.ok(!m1.audio, 'sem áudio quando o roteiro não tem áudio');
v.ok(/MP4 exportado \(/.test(await status()), `mensagem final: "${await status()}"`);
const rep1 = await reproduzir(`${dest}/aula-16x9.mp4`, [0.05, 0.3, 0.6, 0.9]);
v.ok(Math.abs(rep1.duracao - m1.video.duracao) < 0.15 && rep1.w === 1920 && rep1.h === 1080, `o navegador reproduz: ${rep1.duracao.toFixed(2)} s ${rep1.w}×${rep1.h}`);
v.ok(new Set(rep1.quadros.map((q) => q.hash)).size >= 3, 'os quadros em instantes diferentes são diferentes (a animação anda)');
v.ok(rep1.quadros.every((q) => q.escuros > 30), 'os quadros têm desenho (traço escuro visível), não são brancos');
rep1.quadros.forEach((q, i) => writeFileSync(`${dest}/16x9-quadro-${i + 1}.png`, Buffer.from(q.png.split(',')[1], 'base64')));

// fidelidade: o quadro do MP4 no instante t é parecido com o preview do app no mesmo t
const tFid = 3.0;
await p.goto(`${BASE}?teste=1&t=${tFid}#/editor`);
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(900);
const preview = await p.locator('.area-palco canvas').evaluate((c) => { const o = document.createElement('canvas'); o.width = 320; o.height = 180; o.getContext('2d').drawImage(c, 0, 0, 320, 180); const d = o.getContext('2d').getImageData(0, 0, 320, 180).data; return Array.from(d.filter((_, i) => i % 4 === 0)); });
const pg = await ctx.newPage(); await pg.goto(urlDe('aula-16x9.mp4'));
const doVideo = await pg.evaluate(async (t) => { const el = document.querySelector('video'); await new Promise((ok) => { if (el.readyState >= 1) ok(); else el.onloadedmetadata = ok; }); el.currentTime = t; await new Promise((ok) => { el.onseeked = ok; }); const c = document.createElement('canvas'); c.width = 320; c.height = 180; c.getContext('2d').drawImage(el, 0, 0, 320, 180); return Array.from(c.getContext('2d').getImageData(0, 0, 320, 180).data.filter((_, i) => i % 4 === 0)); }, tFid);
await pg.close();
let soma = 0; for (let i = 0; i < preview.length; i++) soma += Math.abs(preview[i] - doVideo[i]);
const diff = soma / preview.length;
v.ok(diff < 14, `o quadro do MP4 em t=${tFid}s é fiel ao preview (diferença média ${diff.toFixed(1)}/255)`);

// =================================================================== E2: 9:16 e os dois formatos
console.log('E2 MP4 9:16 e os dois formatos');
await carregar(ROTEIRO);
const [dl1, dl2] = await (async () => {
  const baixados = []; p.on('download', async (d) => baixados.push(d));
  await menu('Vídeo MP4 nos dois formatos');
  await p.waitForFunction(() => document.querySelector('footer.status')?.innerText.includes('MP4 exportado'), null, { timeout: 280000 });
  const t0 = Date.now(); while (baixados.length < 2 && Date.now() - t0 < 280000) await p.waitForTimeout(500);
  return baixados;
})();
v.ok(!!dl1 && !!dl2, 'os dois formatos geram dois arquivos');
if (dl1 && dl2) {
  v.igual([dl1.suggestedFilename(), dl2.suggestedFilename()], ['stickboard-video.mp4', 'stickboard-short.mp4'], 'nomes dos dois arquivos');
  await dl1.saveAs(`${dest}/dois-16x9.mp4`); await dl2.saveAs(`${dest}/dois-9x16.mp4`);
  const a = lerMp4(readFileSync(`${dest}/dois-16x9.mp4`)), c = lerMp4(readFileSync(`${dest}/dois-9x16.mp4`));
  v.igual([a.video.w, a.video.h, c.video.w, c.video.h], [1920, 1080, 1080, 1920], 'resoluções 1920×1080 e 1080×1920');
  v.ok(a.video.amostras === c.video.amostras, 'mesmo número de quadros nos dois (mesma duração)');
  const rep = await reproduzir(`${dest}/dois-9x16.mp4`, [0.4, 0.8]);
  v.ok(rep.w === 1080 && rep.h === 1920 && rep.quadros.every((q) => q.escuros > 30), 'o vertical reproduz e tem desenho');
  writeFileSync(`${dest}/9x16-quadro.png`, Buffer.from(rep.quadros[0].png.split(',')[1], 'base64'));
}

// =================================================================== E3: com áudio (narração, música, efeito)
console.log('E3 MP4 com áudio');
const narr = wav(2.5, 330), musica = wav(8, 220), efeito = wav(0.6, 880);
writeFileSync(`${dest}/narracao.wav`, narr); writeFileSync(`${dest}/musica.wav`, musica); writeFileSync(`${dest}/efeito.wav`, efeito);
const comAudio = `[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Som\n[música: musica.wav, volume 30%]\nProfessor entra pela esquerda andando.\nProfessor diz "Bem-vindos à aula!". [áudio: narracao.wav]\n[efeito: efeito.wav]\nAluno entra correndo pela direita. Aluno acena.\nEspera 2 segundos.\n[música: parar]`;
await carregar(comAudio);
await p.getByRole('button', { name: 'Áudio', exact: true }).click();
await p.locator('input[type=file][accept*="audio"]').setInputFiles([`${dest}/narracao.wav`, `${dest}/musica.wav`, `${dest}/efeito.wav`]);
await p.waitForTimeout(1500);
v.igual(await p.locator('.item-audio .topo').count(), 3, 'três áudios importados');
const durAudio = await duracaoDoRoteiro();
const e3 = await exportar('Vídeo MP4 (YouTube', `${dest}/com-audio.mp4`);
const m3 = lerMp4(readFileSync(`${dest}/com-audio.mp4`));
console.log(`  ${e3.seg.toFixed(1)} s para exportar; áudio ${m3.audio?.codec} ${m3.audio?.taxa} Hz ${m3.audio?.canais} canais`);
v.ok(!!m3.audio, 'faixa de áudio presente');
v.ok(['mp4a', 'Opus'].includes(m3.audio?.codec), `codec de áudio ${m3.audio?.codec}`);
v.ok(m3.audio && Math.abs(m3.audio.duracao - m3.video.duracao) < 0.35, `áudio e vídeo com a mesma duração (${m3.audio?.duracao.toFixed(2)} × ${m3.video.duracao.toFixed(2)} s)`);
v.ok(m3.audio && m3.audio.taxa === 48000 && m3.audio.canais === 2, 'áudio 48 kHz estéreo');
v.ok(Math.abs(m3.video.duracao - (durAudio + 0.5)) < 0.1, `a fala dura o tempo do áudio na linha do tempo (${durAudio.toFixed(2)} s)`);
// o som existe de verdade: decodifica a faixa e mede energia por faixa de tempo
const rep3 = await (async () => {
  const pg2 = await ctx.newPage(); await pg2.goto(urlDe('com-audio.mp4'));
  const r = await pg2.evaluate(async () => {
    const buf = await (await fetch(location.href)).arrayBuffer();
    const ac = new OfflineAudioContext(2, 48000, 48000);
    let audio; try { audio = await ac.decodeAudioData(buf); } catch (e) { return { erro: String(e) }; }
    const L = audio.getChannelData(0), seg = (a, z) => { let s = 0, n = 0; for (let i = Math.floor(a * audio.sampleRate); i < Math.min(L.length, Math.floor(z * audio.sampleRate)); i++) { s += L[i] * L[i]; n++; } return Math.sqrt(s / Math.max(1, n)); };
    return { dur: audio.duration, canais: audio.numberOfChannels, inicio: seg(0.2, 1.2), fim: seg(audio.duration - 0.6, audio.duration - 0.1) };
  });
  await pg2.close(); return r;
})();
v.ok(!rep3.erro && rep3.inicio > 0.01, `o som foi misturado de verdade (energia no início: ${rep3.inicio?.toFixed(3)} ${rep3.erro ?? ''})`);
v.ok(!rep3.erro && rep3.fim < rep3.inicio, 'a música para onde o roteiro manda parar (o fim é mais silencioso que o início)');

// =================================================================== E4: proteções
console.log('E4 proteções');
await carregar('');
await menu('Vídeo MP4 (YouTube'); await esperarStatus(/Falha na exportação/);
v.ok(/O roteiro está vazio/.test(await status()), `roteiro vazio: "${await status()}"`);
await carregar('# Longo\nProfessor entra pela esquerda andando.\nEspera 600 segundos.\nEspera 600 segundos.');
await menu('Vídeo MP4 (YouTube'); await esperarStatus(/Falha na exportação/);
v.ok(/O vídeo tem 20 minutos e o limite é 15/.test(await status()), `vídeo longo demais: "${await status()}"`);
v.ok(await p.evaluate(() => window.__sb.store.getState().exportando) === null, 'depois da falha a exportação volta ao estado livre');
// clique duplo: só uma exportação roda
await carregar(ROTEIRO);
let downloads = 0; const contar = () => downloads++; p.on('download', contar);
await p.evaluate(() => { window.__inicios = 0; const s = window.__sb.store; let ant = s.getState().exportando; s.subscribe((st) => { if (ant === null && st.exportando !== null) window.__inicios++; ant = st.exportando; }); });
await p.getByRole('button', { name: 'Exportar MP4' }).dblclick();
await p.waitForTimeout(200);
await p.waitForFunction(() => document.querySelector('footer.status')?.innerText.includes('MP4 exportado'), null, { timeout: 280000 });
await p.waitForTimeout(1500); p.off('download', contar);
v.igual(await p.evaluate(() => window.__inicios), 1, 'cliques repetidos durante a exportação iniciam uma exportação só');
// roteiro com avisos ainda exporta
await carregar('# X\nProfessor entra pela esquerda andando.\nProfessor flutua misteriosamente.\nProfessor acena.');
await exportar('Vídeo MP4 (YouTube', `${dest}/com-aviso.mp4`);
v.ok(lerMp4(readFileSync(`${dest}/com-aviso.mp4`)).video.amostras > 30, 'roteiro com frase não entendida exporta mesmo assim (a frase é ignorada)');

// =================================================================== E5: legendas, quadro e prompt
console.log('E5 legendas, quadro atual e prompt');
await carregar(ROTEIRO);
const srtInfo = await exportar('Legendas das falas (.srt)', `${dest}/legendas.srt`);
v.igual(srtInfo.nome, 'legendas.srt', 'nome do arquivo de legendas');
const srt = readFileSync(`${dest}/legendas.srt`, 'utf8');
const blocos = srt.trim().split(/\n\n+/);
v.igual(blocos.length, 2, 'uma legenda por fala');
v.ok(blocos.every((bl, i) => bl.split('\n')[0] === String(i + 1) && /^\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}$/.test(bl.split('\n')[1])), 'numeração e carimbos de tempo no formato SRT');
v.ok(srt.includes('CringeFather: Vamos testar a exportação!') && srt.includes('BetaSon: Funciona? Ação, emoção e acentuação!'), 'texto e acentos corretos (UTF-8)');
const tempos = blocos.map((bl) => bl.split('\n')[1].split(' --> ').map((x) => { const [h, m, s] = x.replace(',', '.').split(':'); return +h * 3600 + +m * 60 + +s; }));
v.ok(tempos.every(([a, z]) => z > a) && tempos[1][0] >= tempos[0][1] - 0.01, 'tempos crescentes e sem sobreposição');
const quadro = await exportar('Quadro atual (PNG)', `${dest}/quadro.png`);
const png = readFileSync(`${dest}/quadro.png`);
v.ok(png[0] === 137 && png.toString('latin1', 1, 4) === 'PNG' && quadro.nome === 'quadro.png', 'quadro atual é um PNG válido');
v.igual([png.readUInt32BE(16), png.readUInt32BE(20)], [1920, 1080], 'PNG com a resolução do vídeo');
const [dlmd] = await Promise.all([p.waitForEvent('download'), (async () => { await p.getByText('Arquivo').first().click(); await p.getByText('Prompt mestre para IA (copiar e colar)…').click(); await p.waitForSelector('.prompt-mestre'); await p.waitForFunction(() => !document.body.innerText.includes('Carregando a biblioteca'), null, { timeout: 60000 }); await p.getByRole('button', { name: 'Salvar como arquivo (.md)' }).click(); })()]);
await dlmd.saveAs(`${dest}/prompt-mestre.md`);
const md = readFileSync(`${dest}/prompt-mestre.md`, 'utf8');
v.ok(md.startsWith('# PROMPT MESTRE DO STICKBOARD') && md.length > 10000 && md.includes('CringeFather') && md.includes('## 3. TODAS AS FRASES'), `prompt mestre salvo em .md (${md.length} caracteres)`);

// =================================================================== E6: vídeo mais longo (1 min): desempenho e estabilidade
console.log('E6 vídeo de 1 minuto');
await carregar('[papéis: professor=CringeFather, aluno=BetaSon]\n# Minuto\nProfessor entra pela esquerda andando. Aluno entra correndo pela direita.\nProfessor diz "Um minuto de vídeo para testar a estabilidade." feliz.\nEnquanto Professor dança por 20 segundos, Aluno dança por 20 segundos.\nEspera 25 segundos.\nProfessor escreve "Fim" no quadro.');
const durLongo = await duracaoDoRoteiro();
const e6 = await exportar('Vídeo MP4 (YouTube', `${dest}/um-minuto.mp4`);
const m6 = lerMp4(readFileSync(`${dest}/um-minuto.mp4`));
console.log(`  ${durLongo.toFixed(1)} s de vídeo em ${e6.seg.toFixed(1)} s (${(m6.tamanho / 1e6).toFixed(1)} MB)`);
v.ok(Math.abs(m6.video.duracao - (durLongo + 0.5)) < 0.15 && m6.video.amostras >= Math.floor((durLongo + 0.5) * 30), `vídeo longo íntegro: ${m6.video.duracao.toFixed(1)} s, ${m6.video.amostras} quadros`);
v.ok(m6.tamanho < 120e6, 'tamanho razoável');
const rep6 = await reproduzir(`${dest}/um-minuto.mp4`, [0.1, 0.5, 0.95]);
v.ok(rep6.quadros.every((q) => q.escuros > 20), 'quadros do começo, meio e fim têm desenho');

v.ok(p.erros.length === 0, `sem erros de página: ${p.erros.join(' | ')}`);
await b.close(); servidor.fechar();
process.exit(v.fim('revisão de exportação'));
