// Auditoria da biblioteca de sprites: o que cada personagem tem e o que falta em relação ao padrão.
import { readFileSync, existsSync } from 'node:fs';
import { EXPRESSOES } from '../../src/shared/domain/poses.ts';
import { POSES_CONHECIDAS } from '../../src/shared/domain/nomenclatura.ts';
const base = 'src/renderer/assets/personagens';
const man = JSON.parse(readFileSync(`${base}/personagens.json`, 'utf8'));
const exp = [...EXPRESSOES];
const bocas = ['boca-a', 'boca-e', 'boca-o', 'boca-m'];
let problemas = 0;
for (const [id, p] of Object.entries(man)) {
  const s = p.sprites;
  const tem = (tipo, tag) => s.some((x) => x.tipo === tipo && x.tags[0] === tag);
  const faltaFiles = s.filter((x) => !existsSync(`${base}/${x.arquivo}`)).map((x) => x.arquivo);
  const semEncaixe = s.filter((x) => x.tipo === 'rosto' && !x.encaixe).map((x) => x.tags[0]);
  const faltaExp = [...exp, 'olhos-fechados', ...bocas].filter((e) => !tem('rosto', e));
  const poses = new Set(s.filter((x) => x.tipo === 'pose').map((x) => x.tags[0]));
  const semParado = !poses.has('parado');
  const sempAndar = [...s.filter((x) => x.tags[0] === 'andar')].length;
  const essenciais = ['parado', 'andar', 'correr', 'apontar', 'sentado'].filter((e) => !poses.has(e));
  console.log(`${id}: ${s.length} sprites | poses ${poses.size} | andar ${sempAndar} quadros | altura ${p.altura}`);
  if (faltaFiles.length) { problemas++; console.log('  ARQUIVOS AUSENTES', faltaFiles); }
  if (semEncaixe.length) { problemas++; console.log('  rosto sem encaixe', semEncaixe); }
  if (faltaExp.length) { problemas++; console.log('  expressões/bocas ausentes:', faltaExp.join(', ')); }
  if (semParado) { problemas++; console.log('  SEM pose_parado'); }
  if (essenciais.length) console.log('  poses básicas ausentes:', essenciais.join(', '));
}
console.log('problemas:', problemas);
