import { readFileSync } from 'node:fs';
const man = JSON.parse(readFileSync('src/renderer/assets/personagens/personagens.json', 'utf8'));
for (const [id, p] of Object.entries(man)) {
  const pp = p.sprites.find((s) => s.tags[0] === 'parado');
  console.log(`== ${id} parado ${pp.w}x${pp.h} cabeca=${JSON.stringify(pp.rosto?.cabeca)}`);
  for (const s of p.sprites.filter((s) => s.tipo === 'rosto')) console.log(`  ${s.tags[0].padEnd(15)} ${s.w}x${s.h}  x=${s.encaixe?.x} y=${s.encaixe?.y} esc=${s.encaixe?.escala}`);
}
