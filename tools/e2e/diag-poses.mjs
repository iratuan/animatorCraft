// diagnóstico: capturas do palco com cada pose, para conferir os ângulos das pernas
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const dest = process.argv[2] ?? 'evidencias/55-poses-diagnostico';
mkdirSync(dest, { recursive: true });
const poses = (process.argv[3] ?? 'andar,correr,pular,tropecar,sentar').split(',');
const ator = process.argv[4] ?? 'Professor';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate(() => localStorage.clear());
for (const pose of poses) {
  const verbo = { andar: 'anda pela esquerda', correr: 'entra pela esquerda correndo', pular: 'pula', tropecar: 'tropeça', sentar: 'senta', cair: 'cai' }[pose] ?? pose;
  // a entrada correndo dura menos de 1 s: depois dela, o personagem fica parado e a pose aparece na janela de captura
  const roteiro = pose === 'correr'
    ? `# Pose ${pose}\n${ator} ${verbo}.\n${ator} fica parado por 3 segundos.\n`
    : `# Pose ${pose}\n${ator} ${verbo} por 3 segundos.\n`;
  await p.evaluate((r) => localStorage.setItem('stickboard.roteiro.v2', r), roteiro);
  await p.goto(`http://127.0.0.1:5173/?pose=${pose}#/editor`);
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  // a entrada dura ~2,5 s; a pose começa depois e a captura cai no meio dela
  await p.locator('.transporte .play').click();
  const palco = p.locator('canvas').first();
  // varre o tempo: uma captura a cada 0,5 s, para pegar a pose no meio dela
  for (let k = 0; k < 8; k++) {
    await p.waitForTimeout(500);
    const relogio = await p.locator('.transporte').innerText().catch(() => '');
    // recorte ampliado na região do personagem (o palco inteiro é grande demais para ver os detalhes)
    const caixa = await palco.boundingBox();
    const recorte = caixa && { x: caixa.x + caixa.width * 0.05, y: caixa.y + caixa.height * 0.45, width: caixa.width * 0.9, height: caixa.height * 0.5 };
    await p.screenshot({ path: `${dest}/${pose}-${k}.png`, clip: recorte ?? undefined });
    console.log(pose, k, relogio.replace(/\s+/g, ' ').slice(0, 60));
  }
}
await b.close();
writeFileSync(`${dest}/LEIA-ME.txt`, `Capturas do palco por pose (diagnóstico). Poses: ${poses.join(', ')}\n`);
