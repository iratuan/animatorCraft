// Monta pacotes .zip de TESTE no padrão de nomes (docs/SPRITES.md), reaproveitando os sprites atuais do BetaSon.
// Os rosto_* são sintéticos (cabeça do pose_parado + boca/olhos desenhados): servem só para provar o encaixe e a troca.
//   node tools/montar-pacote-teste.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const destino = resolve(process.argv[2] ?? 'evidencias/pacote-teste');
const base = join(raiz, 'src/renderer/assets/personagens/betason');
const manifesto = JSON.parse(readFileSync(join(raiz, 'src/renderer/assets/personagens/personagens.json'), 'utf8')).betason.sprites;
const cabeca = manifesto[0].rosto.cabeca;
rmSync(join(destino, '_bom'), { recursive: true, force: true }); rmSync(join(destino, '_ruim'), { recursive: true, force: true });
mkdirSync(join(destino, '_bom/betason'), { recursive: true }); mkdirSync(join(destino, '_ruim/betason'), { recursive: true });

// poses a partir dos sprites atuais (1 parado, 2 andar, 8 correr usado como 2º quadro de andar, 6 comemorar, 3 skate, 4 sentado)
const poses = { 'pose_parado.png': 1, 'pose_andar_1.png': 2, 'pose_andar_2.png': 8, 'pose_comemorar.png': 6, 'pose_skate.png': 3, 'pose_sentado.png': 4 };
for (const [nome, n] of Object.entries(poses)) copyFileSync(join(base, `${n}.png`), join(destino, '_bom/betason', nome));

// rostos sintéticos
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>');
const b64 = readFileSync(join(base, '1.png')).toString('base64');
const rostos = await page.evaluate(async ({ b64, cabeca }) => {
  const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
  const W = img.width, H = img.height;
  const sx = cabeca.x * W, sy = cabeca.y * H, sw = cabeca.w * W, sh = cabeca.h * H;
  const K = 4; // amplia 4x: rosto de teste com mais pixels que o corpo
  const mouth = { x: (0.534 * W - sx) * K, y: (0.275 * H - sy) * K, w: 0.27 * W * K };
  const eyes = [[0.478, 0.214], [0.644, 0.214]].map(([ex, ey]) => ({ x: (ex * W - sx) * K, y: (ey * H - sy) * K, r: 0.095 * W * K }));
  const fazer = (desenho) => {
    const c = document.createElement('canvas'); c.width = Math.round(sw * K); c.height = Math.round(sh * K);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    desenho?.(x); return c.toDataURL('image/png').split(',')[1];
  };
  const pele = '#cfcfcf', escuro = '#1c1c1c';
  const boca = (forma) => (x) => {
    x.fillStyle = pele; x.beginPath(); x.ellipse(mouth.x, mouth.y, mouth.w * 0.62, mouth.w * 0.3, 0, 0, 7); x.fill();
    x.fillStyle = escuro; x.strokeStyle = escuro; x.lineWidth = mouth.w * 0.06; x.lineCap = 'round';
    if (forma === 'm') { x.beginPath(); x.moveTo(mouth.x - mouth.w * 0.35, mouth.y); x.quadraticCurveTo(mouth.x, mouth.y + mouth.w * 0.12, mouth.x + mouth.w * 0.35, mouth.y); x.stroke(); }
    if (forma === 'o') { x.beginPath(); x.ellipse(mouth.x, mouth.y, mouth.w * 0.14, mouth.w * 0.2, 0, 0, 7); x.fill(); }
    if (forma === 'a') { x.beginPath(); x.ellipse(mouth.x, mouth.y, mouth.w * 0.3, mouth.w * 0.26, 0, 0, 7); x.fill(); }
    if (forma === 'e') { x.beginPath(); x.ellipse(mouth.x, mouth.y, mouth.w * 0.42, mouth.w * 0.12, 0, 0, 7); x.fill(); }
  };
  const olhosFechados = (x) => eyes.forEach((e) => { x.fillStyle = pele; x.beginPath(); x.ellipse(e.x, e.y, e.r, e.r * 0.9, 0, 0, 7); x.fill(); x.strokeStyle = escuro; x.lineWidth = e.r * 0.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(e.x - e.r * 0.8, e.y); x.quadraticCurveTo(e.x, e.y + e.r * 0.5, e.x + e.r * 0.8, e.y); x.stroke(); });
  const brava = (x) => eyes.forEach((e, i) => { x.strokeStyle = escuro; x.lineWidth = e.r * 0.28; x.lineCap = 'round'; x.beginPath(); x.moveTo(e.x - e.r, e.y - e.r * (i ? 0.2 : 1.2)); x.lineTo(e.x + e.r, e.y - e.r * (i ? 1.2 : 0.2)); x.stroke(); });
  return {
    'rosto_feliz.png': fazer(null), // idêntico à cabeça do corpo: se o encaixe estiver certo, a troca é invisível
    'rosto_brava.png': fazer(brava), 'rosto_olhos-fechados.png': fazer(olhosFechados),
    'rosto_boca-a.png': fazer(boca('a')), 'rosto_boca-e.png': fazer(boca('e')), 'rosto_boca-o.png': fazer(boca('o')), 'rosto_boca-m.png': fazer(boca('m')),
  };
}, { b64, cabeca });
for (const [nome, dados] of Object.entries(rostos)) writeFileSync(join(destino, '_bom/betason', nome), Buffer.from(dados, 'base64'));
writeFileSync(join(destino, '_bom/betason/meta.json'), JSON.stringify({ cabeca }, null, 2));
await browser.close();

// pacote com erros de nome, para ver o relatório
for (const nome of ['pose_andar.png', 'foto_01.png', 'rosto_assustadissimo.png', 'Pose Comemorar.PNG']) copyFileSync(join(base, '2.png'), join(destino, '_ruim/betason', nome));
copyFileSync(join(base, '3.png'), join(destino, '_ruim/solto.png'));

const zip = (pasta, saida) => execFileSync('powershell', ['-NoProfile', '-Command', `if (Test-Path '${saida}') { Remove-Item '${saida}' }; Compress-Archive -Path '${pasta}\\*' -DestinationPath '${saida}'`]);
zip(join(destino, '_bom'), join(destino, 'pacote-betason-teste.zip'));
zip(join(destino, '_ruim'), join(destino, 'pacote-com-erros.zip'));
console.log('ok', join(destino, 'pacote-betason-teste.zip'), join(destino, 'pacote-com-erros.zip'));

