import { ATORES, type ActorId } from '../characters';
import type { ExpressaoId } from '../poses';
import { CATALOGO_MOLDES_SVG } from './catalogo';
import { EXPRESSOES_VETORIAIS, VISEMAS_SVG } from './componentes/expressoes';
import type { CaminhoSVG, ElipseSVG, MoldePersonagemSVG, OpcoesRenderizacaoSVG } from './tipos';

/** Obtém o molde vetorial de um personagem (ou cria um padrão caso seja personalizado) */
export function obterMoldePersonagem(id: ActorId): MoldePersonagemSVG {
  const molde = CATALOGO_MOLDES_SVG[id];
  if (molde) return molde;

  const spec = ATORES[id];
  return {
    id,
    nome: spec?.nome ?? id,
    proporcoes: { alturaPadrao: spec?.altura ?? 450, raioCabeca: 34, larguraOmbro: 26, comprimentoTronco: 110 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 34, ry: 34, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    olhos: { estilo: 'rick-and-morty', posicaoRelativa: { x: 0, y: -2, espacamento: 26, raioOlho: 8 } },
    boca: { formatoBase: 'M -10,12 L 10,12' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'calca',
      tronco: [{ d: 'M -16,-12 L 16,-12 L 14,65 L -14,65 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
    },
    membros: { tipoMao: 'humana', sapato: 'tenis' },
  };
}

function serializarCaminho(c: CaminhoSVG, lwBase: number, corTracoPadrao: string, corPreenchimentoPadrao: string): string {
  const fill = c.preenchimento ?? corPreenchimentoPadrao;
  const stroke = c.traco ?? corTracoPadrao;
  const strokeWidth = (c.espessura ?? 1) * lwBase;
  const dash = c.linhaTracejada ? ` stroke-dasharray="${c.linhaTracejada.join(' ')}"` : '';
  return `<path d="${c.d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${dash} />`;
}

function serializarElipse(e: ElipseSVG, lwBase: number, corTracoPadrao: string, corPreenchimentoPadrao: string): string {
  const fill = e.preenchimento ?? corPreenchimentoPadrao;
  const stroke = e.traco ?? corTracoPadrao;
  const strokeWidth = (e.espessura ?? 1) * lwBase;
  return `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
}

/**
 * Gera código SVG puro e autocontido da cabeça/busto de um personagem, com cabelo, olhos, expressão e acessórios.
 */
export function gerarSvgCabeca(id: ActorId, opcoes: OpcoesRenderizacaoSVG = {}): string {
  const molde = obterMoldePersonagem(id);
  const expId: ExpressaoId = opcoes.expressao ?? (ATORES[id]?.expressaoPadrao ?? 'neutra');
  const expGeom = EXPRESSOES_VETORIAIS[expId as keyof typeof EXPRESSOES_VETORIAIS] ?? EXPRESSOES_VETORIAIS.neutra;
  const lw = opcoes.larguraLinhaBase ?? 2.4;
  const corTraco = opcoes.corTraco ?? '#14161a';
  const corFundo = opcoes.corPreenchimento ?? '#ffffff';
  const piscar = opcoes.piscar ?? false;
  const visema = opcoes.visema ? VISEMAS_SVG[opcoes.visema.toLowerCase()] : undefined;

  const rCab = molde.proporcoes.raioCabeca;
  const vbMinX = -(rCab + 24);
  const vbMinY = -(rCab + 32);
  const vbW = (rCab + 24) * 2;
  const vbH = (rCab + 28) * 2;

  const partesSvg: string[] = [];

  // 1. Cabelo traseiro (se houver, ex: Erika, Carol, Elizendra)
  if (molde.cabelo?.traseiro) {
    for (const c of molde.cabelo.traseiro) partesSvg.push(serializarCaminho(c, lw, corTraco, corFundo));
  }

  // 2. Silhueta do crânio / cabeça
  if ('rx' in molde.cabeca.silhueta) {
    partesSvg.push(serializarElipse(molde.cabeca.silhueta, lw, corTraco, corFundo));
  } else {
    partesSvg.push(serializarCaminho(molde.cabeca.silhueta, lw, corTraco, corFundo));
  }

  // 3. Olhos e Pupilas
  const { posicaoRelativa: posOlhos } = molde.olhos;
  const rOlho = posOlhos.raioOlho * (expGeom.olhoAbertura ?? 1);
  const olhX1 = posOlhos.x - posOlhos.espacamento / 2;
  const olhX2 = posOlhos.x + posOlhos.espacamento / 2;
  const olhY = posOlhos.y;
  const pupilDx = (opcoes.olharDirecao?.x ?? 0) * (rOlho * 0.4);
  const pupilDy = (opcoes.olharDirecao?.y ?? 0) * (rOlho * 0.4);

  if (piscar) {
    // Linha reta de olho piscando
    partesSvg.push(`<line x1="${olhX1 - rOlho}" y1="${olhY}" x2="${olhX1 + rOlho}" y2="${olhY}" stroke="${corTraco}" stroke-width="${lw * 1.2}" stroke-linecap="round" />`);
    partesSvg.push(`<line x1="${olhX2 - rOlho}" y1="${olhY}" x2="${olhX2 + rOlho}" y2="${olhY}" stroke="${corTraco}" stroke-width="${lw * 1.2}" stroke-linecap="round" />`);
  } else {
    // Esferas oculares brancas com contorno
    partesSvg.push(`<ellipse cx="${olhX1}" cy="${olhY}" rx="${rOlho}" ry="${rOlho}" fill="#fff" stroke="${corTraco}" stroke-width="${lw * 0.9}" />`);
    partesSvg.push(`<ellipse cx="${olhX2}" cy="${olhY}" rx="${rOlho}" ry="${rOlho}" fill="#fff" stroke="${corTraco}" stroke-width="${lw * 0.9}" />`);

    // Pupilas pretas
    const rPupil = rOlho * 0.38;
    partesSvg.push(`<ellipse cx="${olhX1 + pupilDx}" cy="${olhY + pupilDy}" rx="${rPupil}" ry="${rPupil}" fill="${corTraco}" />`);
    partesSvg.push(`<ellipse cx="${olhX2 + pupilDx}" cy="${olhY + pupilDy}" rx="${rPupil}" ry="${rPupil}" fill="${corTraco}" />`);

    // Meia-pálpebra (olhar sarcástico / entediado)
    if (expGeom.olhoCaido) {
      partesSvg.push(`<path d="M ${olhX1 - rOlho},${olhY} A ${rOlho},${rOlho} 0 0,1 ${olhX1 + rOlho},${olhY} Z" fill="#fff" stroke="${corTraco}" stroke-width="${lw * 0.8}" />`);
      partesSvg.push(`<path d="M ${olhX2 - rOlho},${olhY} A ${rOlho},${rOlho} 0 0,1 ${olhX2 + rOlho},${olhY} Z" fill="#fff" stroke="${corTraco}" stroke-width="${lw * 0.8}" />`);
    }

    // Pálpebra brava diagonal
    if (expGeom.olhoBravo) {
      partesSvg.push(`<polygon points="${olhX1 - rOlho},${olhY - rOlho} ${olhX1 + rOlho},${olhY - rOlho * 0.2} ${olhX1 + rOlho},${olhY - rOlho} ${olhX1 - rOlho},${olhY - rOlho}" fill="#fff" />`);
      partesSvg.push(`<line x1="${olhX1 - rOlho}" y1="${olhY - rOlho * 0.9}" x2="${olhX1 + rOlho}" y2="${olhY - rOlho * 0.2}" stroke="${corTraco}" stroke-width="${lw * 0.9}" />`);
      partesSvg.push(`<polygon points="${olhX2 - rOlho},${olhY - rOlho * 0.2} ${olhX2 + rOlho},${olhY - rOlho} ${olhX2 + rOlho},${olhY - rOlho} ${olhX2 - rOlho},${olhY - rOlho}" fill="#fff" />`);
      partesSvg.push(`<line x1="${olhX2 - rOlho}" y1="${olhY - rOlho * 0.2}" x2="${olhX2 + rOlho}" y2="${olhY - rOlho * 0.9}" stroke="${corTraco}" stroke-width="${lw * 0.9}" />`);
    }

    // Cílios femininos
    if (molde.olhos.cilios) {
      partesSvg.push(`<line x1="${olhX1 - rOlho}" y1="${olhY - rOlho * 0.5}" x2="${olhX1 - rOlho - 4}" y2="${olhY - rOlho * 0.8}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
      partesSvg.push(`<line x1="${olhX2 + rOlho}" y1="${olhY - rOlho * 0.5}" x2="${olhX2 + rOlho + 4}" y2="${olhY - rOlho * 0.8}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
    }
  }

  // 4. Sobrancelhas dinâmicas
  partesSvg.push(`<path d="${expGeom.sobrancelhaEsq}" fill="none" stroke="${corTraco}" stroke-width="${lw * 1.1}" stroke-linecap="round" />`);
  partesSvg.push(`<path d="${expGeom.sobrancelhaDir}" fill="none" stroke="${corTraco}" stroke-width="${lw * 1.1}" stroke-linecap="round" />`);

  // 5. Óculos (se houver)
  if (molde.olhos.oculos?.armacao) {
    for (const c of molde.olhos.oculos.armacao) partesSvg.push(serializarCaminho(c, lw, corTraco, 'none'));
  }

  // 6. Focinho / Nariz / Bigodes (animais)
  if (molde.boca.tipoFocinho === 'canino') {
    // Focinho volumoso de cachorro
    partesSvg.push(`<ellipse cx="0" cy="8" rx="14" ry="10" fill="#fff" stroke="${corTraco}" stroke-width="${lw * 0.9}" />`);
    partesSvg.push(`<ellipse cx="0" cy="4" rx="6" ry="4" fill="${corTraco}" />`);
  } else if (molde.boca.tipoFocinho === 'felino') {
    // Focinho delicado de gato
    partesSvg.push(`<polygon points="-4,3 4,3 0,7" fill="#f43f5e" stroke="${corTraco}" stroke-width="${lw * 0.6}" />`);
    if (molde.boca.bigodes) {
      for (const b of molde.boca.bigodes) partesSvg.push(serializarCaminho(b, lw, corTraco, 'none'));
    }
  }

  // 7. Boca (visema ou expressão)
  const dCurvaBoca = visema ?? expGeom.boca ?? molde.boca.formatoBase;
  partesSvg.push(`<path d="${dCurvaBoca}" fill="${expId === 'feliz' || expId === 'empolgada' ? '#14161a' : 'none'}" stroke="${corTraco}" stroke-width="${lw * 1.05}" stroke-linecap="round" stroke-linejoin="round" />`);

  // 8. Cabelo frontal e adereços de cabeça
  if (molde.cabelo?.frontal) {
    for (const c of molde.cabelo.frontal) partesSvg.push(serializarCaminho(c, lw, corTraco, corFundo));
  }
  if (molde.cabelo?.presilhasOuLacos) {
    for (const c of molde.cabelo.presilhasOuLacos) partesSvg.push(serializarCaminho(c, lw, corTraco, corFundo));
  }

  const bg = opcoes.incluirFundo ? `<rect width="100%" height="100%" fill="${corFundo}" />` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" width="100%" height="100%" style="overflow: visible;">
  ${bg}
  <g id="${id}-cabeca">
    ${partesSvg.join('\n    ')}
  </g>
</svg>`;
}

import { poseDef, type PoseId } from '../poses';

const rad = (g: number) => (g * Math.PI) / 180;
const dir = (g: number, len: number) => ({
  x: Math.sin(rad(g)) * len,
  y: Math.cos(rad(g)) * len,
});

/**
 * Gera código SVG completo do personagem (corpo inteiro com roupas, membros articulados, calçados, cabeça e poses)
 */
export function gerarSvgCompleto(id: ActorId, opcoes: OpcoesRenderizacaoSVG = {}): string {
  const molde = obterMoldePersonagem(id);
  const lw = opcoes.larguraLinhaBase ?? 2.6;
  const corTraco = opcoes.corTraco ?? '#14161a';
  const corFundo = opcoes.corPreenchimento ?? '#ffffff';
  const poseId: PoseId = opcoes.pose ?? 'parado';
  const pose = poseDef(poseId);

  const cabecaSvgInterna = gerarSvgCabeca(id, { ...opcoes, incluirFundo: false });
  const matchG = /<g id="[^"]+">([\s\S]*?)<\/g>/.exec(cabecaSvgInterna);
  const cabecaConteudo = matchG ? matchG[1] : '';

  const rCab = molde.proporcoes.raioCabeca;
  const eQuadrupede = id === 'paraiba' || id === 'mingau';

  const corpoPartes: string[] = [];

  const desenharMembroTubo = (
    pts: { x: number; y: number }[],
    largura: number,
    corMiolo: string = corFundo,
  ) => {
    const d = `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
    // Contorno externo
    corpoPartes.push(
      `<path d="${d}" fill="none" stroke="${corTraco}" stroke-width="${largura + lw * 2}" stroke-linecap="round" stroke-linejoin="round" />`,
    );
    // Miolo interno
    corpoPartes.push(
      `<path d="${d}" fill="none" stroke="${corMiolo}" stroke-width="${largura}" stroke-linecap="round" stroke-linejoin="round" />`,
    );
  };

  const desenharSapato = (
    pe: { x: number; y: number },
    f: number,
    tipo: 'social' | 'tenis' | 'sandalia' | 'sapatilha' | 'nenhum',
  ) => {
    if (tipo === 'nenhum') return;
    const y0 = pe.y;
    const preto = tipo === 'social' || tipo === 'sapatilha' || molde.roupa.calcaPreta;
    if (tipo === 'tenis') {
      const d = `M ${pe.x - f * 6},${y0 - 8} L ${pe.x + f * 6},${y0 - 9} L ${pe.x + f * 18},${y0 - 2} L ${pe.x + f * 18},${y0 + 2} L ${pe.x - f * 6},${y0 + 2} Z`;
      corpoPartes.push(`<path d="${d}" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw}" stroke-linejoin="round" />`);
      // Biqueira de borracha e sola
      corpoPartes.push(`<line x1="${pe.x - f * 6}" y1="${y0}" x2="${pe.x + f * 18}" y2="${y0}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
      corpoPartes.push(`<line x1="${pe.x + f * 4}" y1="${y0 - 7}" x2="${pe.x + f * 8}" y2="${y0 - 2}" stroke="${corTraco}" stroke-width="${lw * 0.6}" />`);
    } else if (tipo === 'social') {
      const d = `M ${pe.x - f * 6},${y0 - 9} L ${pe.x + f * 6},${y0 - 9} L ${pe.x + f * 19},${y0 - 2} L ${pe.x + f * 19},${y0 + 2} L ${pe.x - f * 6},${y0 + 2} Z`;
      corpoPartes.push(`<path d="${d}" fill="${preto ? corTraco : '#ffffff'}" stroke="${corTraco}" stroke-width="${lw}" stroke-linejoin="round" />`);
    } else {
      // Sandália / sapatilha delicada
      const d = `M ${pe.x - f * 5},${y0 - 4} L ${pe.x + f * 15},${y0 - 2} L ${pe.x + f * 15},${y0 + 2} L ${pe.x - f * 5},${y0 + 2} Z`;
      corpoPartes.push(`<path d="${d}" fill="${preto ? corTraco : '#ffffff'}" stroke="${corTraco}" stroke-width="${lw}" stroke-linejoin="round" />`);
      corpoPartes.push(`<line x1="${pe.x}" y1="${y0 - 4}" x2="${pe.x + f * 6}" y2="${y0 - 8}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
    }
  };

  const desenharMao = (m: { x: number; y: number }, cot: { x: number; y: number }) => {
    const ang = Math.atan2(m.y - cot.y, m.x - cot.x);
    const polX = m.x + Math.cos(ang + 1.2) * 5;
    const polY = m.y + Math.sin(ang + 1.2) * 5;
    corpoPartes.push(`<circle cx="${polX.toFixed(1)}" cy="${polY.toFixed(1)}" r="3" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw}" />`);
    corpoPartes.push(`<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="6" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw}" />`);
  };

  // Coordenadas esqueléticas cinemáticas
  if (eQuadrupede) {
    // -------------------------------- Quadrupedes (Paraíba cão / Mingau gato)
    const oX = 22, oY = 46;
    const qX = -32, qY = 46;
    const chaoY = 98;

    // Patas de trás (T e F)
    for (const pX of [qX - 6, qX + 8]) {
      const joe = { x: pX - 8, y: (qY + chaoY) / 2 };
      const pe = { x: pX, y: chaoY };
      desenharMembroTubo([{ x: qX, y: qY }, joe, pe], 9, corFundo);
      corpoPartes.push(`<ellipse cx="${pe.x}" cy="${pe.y - 1}" rx="7" ry="4" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw}" />`);
      corpoPartes.push(`<line x1="${pe.x - 2}" y1="${pe.y - 3}" x2="${pe.x - 2}" y2="${pe.y + 1}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
      corpoPartes.push(`<line x1="${pe.x + 2}" y1="${pe.y - 3}" x2="${pe.x + 2}" y2="${pe.y + 1}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
    }

    // Tronco animal
    corpoPartes.push(`<ellipse cx="${((oX + qX) / 2).toFixed(1)}" cy="${oY}" rx="32" ry="18" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw * 1.3}" />`);

    // Rabo expressivo
    if (id === 'paraiba') {
      // Rabo feliz de cachorro curvado para cima
      corpoPartes.push(`<path d="M ${qX},${qY - 2} C ${qX - 18},${qY - 14} ${qX - 22},${qY - 34} ${qX - 6},${qY - 38}" fill="none" stroke="${corTraco}" stroke-width="${lw * 1.5}" stroke-linecap="round" />`);
    } else {
      // Rabo longo sinuoso e ondulado de gato
      corpoPartes.push(`<path d="M ${qX},${qY - 2} C ${qX - 14},${qY - 12} ${qX - 10},${qY - 30} ${qX - 24},${qY - 42}" fill="none" stroke="${corTraco}" stroke-width="${lw * 1.3}" stroke-linecap="round" />`);
    }

    // Coleira com medalha / guizo
    if (id === 'paraiba') {
      corpoPartes.push(`<path d="M ${oX - 12},${oY + 2} L ${oX + 12},${oY + 2}" stroke="${corTraco}" stroke-width="${lw * 1.6}" stroke-linecap="round" />`);
      corpoPartes.push(`<circle cx="${oX}" cy="${oY + 9}" r="4" fill="#fbbf24" stroke="${corTraco}" stroke-width="${lw}" />`);
    } else {
      corpoPartes.push(`<path d="M ${oX - 10},${oY + 2} L ${oX + 10},${oY + 2}" stroke="${corTraco}" stroke-width="${lw * 1.4}" stroke-linecap="round" />`);
      corpoPartes.push(`<circle cx="${oX}" cy="${oY + 8}" r="3.2" fill="#38bdf8" stroke="${corTraco}" stroke-width="${lw}" />`);
    }

    // Patas da frente (T e F)
    for (const pX of [oX - 6, oX + 8]) {
      const joe = { x: pX + 4, y: (oY + chaoY) / 2 };
      const pe = { x: pX, y: chaoY };
      desenharMembroTubo([{ x: oX, y: oY }, joe, pe], 9, corFundo);
      corpoPartes.push(`<ellipse cx="${pe.x}" cy="${pe.y - 1}" rx="7" ry="4" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw}" />`);
      corpoPartes.push(`<line x1="${pe.x - 2}" y1="${pe.y - 3}" x2="${pe.x - 2}" y2="${pe.y + 1}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
      corpoPartes.push(`<line x1="${pe.x + 2}" y1="${pe.y - 3}" x2="${pe.x + 2}" y2="${pe.y + 1}" stroke="${corTraco}" stroke-width="${lw * 0.7}" />`);
    }

    // Cabeça acoplada no ombro dianteiro
    const cabX = oX + 16, cabY = oY - 26;
    corpoPartes.push(`<g id="${id}-cabeca" transform="translate(${cabX}, ${cabY})">${cabecaConteudo}</g>`);

  } else {
    // -------------------------------- Humanoides (10 personagens)
    const qX = 0, qY = 72;
    const lenTorso = molde.proporcoes.comprimentoTronco * 0.52;
    const oX = qX + dir(pose.torso, lenTorso).x;
    const oY = qY - dir(pose.torso, lenTorso).y;

    const cabX = oX + dir(pose.cabeca, 26).x;
    const cabY = oY - dir(pose.cabeca, 26).y;

    const lenBraco = 36, lenAnte = 34;
    const lenCoxa = 46, lenCanela = 46;

    // Membro Traseiro (Braço T)
    const cotT = { x: oX + dir(pose.bracoT[0], lenBraco).x, y: oY + dir(pose.bracoT[0], lenBraco).y };
    const maoT = { x: cotT.x + dir(pose.bracoT[0] + pose.bracoT[1], lenAnte).x, y: cotT.y + dir(pose.bracoT[0] + pose.bracoT[1], lenAnte).y };

    // Perna Traseira (Perna T)
    const joeT = { x: qX - 6 + dir(pose.pernaT[0], lenCoxa).x, y: qY + dir(pose.pernaT[0], lenCoxa).y };
    const peT = { x: joeT.x + dir(pose.pernaT[0] + pose.pernaT[1], lenCanela).x, y: joeT.y + dir(pose.pernaT[0] + pose.pernaT[1], lenCanela).y };

    // Perna Dianteira (Perna F)
    const joeF = { x: qX + 6 + dir(pose.pernaF[0], lenCoxa).x, y: qY + dir(pose.pernaF[0], lenCoxa).y };
    const peF = { x: joeF.x + dir(pose.pernaF[0] + pose.pernaF[1], lenCanela).x, y: joeF.y + dir(pose.pernaF[0] + pose.pernaF[1], lenCanela).y };

    // Braço Dianteiro (Braço F)
    const cotF = { x: oX + dir(pose.bracoF[0], lenBraco).x, y: oY + dir(pose.bracoF[0], lenBraco).y };
    const maoF = { x: cotF.x + dir(pose.bracoF[0] + pose.bracoF[1], lenAnte).x, y: cotF.y + dir(pose.bracoF[0] + pose.bracoF[1], lenAnte).y };

    // 1. Braço de trás
    desenharMembroTubo([{ x: oX, y: oY }, cotT, maoT], 8, corFundo);
    if (molde.roupa.manga === 'longa') {
      desenharMembroTubo([{ x: oX, y: oY }, cotT, { x: cotT.x + (maoT.x - cotT.x) * 0.8, y: cotT.y + (maoT.y - cotT.y) * 0.8 }], 12, corFundo);
    } else if (molde.roupa.manga === 'curta') {
      desenharMembroTubo([{ x: oX, y: oY }, { x: oX + (cotT.x - oX) * 0.85, y: oY + (cotT.y - oY) * 0.85 }], 13, corFundo);
    }
    desenharMao(maoT, cotT);

    // 2. Perna de trás
    const corCalca = molde.roupa.calcaPreta ? corTraco : corFundo;
    if (molde.roupa.tipoInferior === 'calca') {
      desenharMembroTubo([{ x: qX, y: qY }, joeT, peT], 13, corCalca);
    } else if (molde.roupa.tipoInferior === 'bermuda') {
      desenharMembroTubo([{ x: qX, y: qY }, joeT], 15, corFundo);
      desenharMembroTubo([joeT, peT], 8, corFundo);
    } else {
      desenharMembroTubo([{ x: qX, y: qY }, joeT, peT], 8, corFundo);
    }
    desenharSapato(peT, 1, molde.membros.sapato);

    // 3. Perna da frente
    if (molde.roupa.tipoInferior === 'calca') {
      desenharMembroTubo([{ x: qX, y: qY }, joeF, peF], 13, corCalca);
    } else if (molde.roupa.tipoInferior === 'bermuda') {
      desenharMembroTubo([{ x: qX, y: qY }, joeF], 15, corFundo);
      desenharMembroTubo([joeF, peF], 8, corFundo);
    } else {
      desenharMembroTubo([{ x: qX, y: qY }, joeF, peF], 8, corFundo);
    }
    desenharSapato(peF, 1, molde.membros.sapato);

    // 4. Vestido / Saia ampla se for o caso
    if (molde.roupa.tipoInferior === 'saia' || molde.roupa.tipoInferior === 'vestido') {
      const saiaHemY = (peF.y + peT.y) / 2 - 10;
      const saiaD = `M ${qX - 16},${qY - 4} L ${qX + 16},${qY - 4} L ${Math.max(peF.x, peT.x) + 24},${saiaHemY} L ${Math.min(peF.x, peT.x) - 24},${saiaHemY} Z`;
      corpoPartes.push(`<path d="${saiaD}" fill="#ffffff" stroke="${corTraco}" stroke-width="${lw * 1.3}" stroke-linejoin="round" />`);
    }

    // 5. Tronco / Roupas
    if (molde.roupa.tronco) {
      corpoPartes.push(`<g transform="translate(${((oX + qX) / 2).toFixed(1)}, ${((oY + qY) / 2).toFixed(1)})">`);
      for (const c of molde.roupa.tronco) corpoPartes.push(serializarCaminho(c, lw, corTraco, corFundo));
      if (molde.roupa.estampa) {
        for (const c of molde.roupa.estampa) corpoPartes.push(serializarCaminho(c, lw, corTraco, 'none'));
      }
      if (molde.roupa.acessorios) {
        for (const c of molde.roupa.acessorios) corpoPartes.push(serializarCaminho(c, lw, corTraco, 'none'));
      }
      corpoPartes.push(`</g>`);
    }

    // 6. Braço da frente
    desenharMembroTubo([{ x: oX, y: oY }, cotF, maoF], 8, corFundo);
    if (molde.roupa.manga === 'longa') {
      desenharMembroTubo([{ x: oX, y: oY }, cotF, { x: cotF.x + (maoF.x - cotF.x) * 0.8, y: cotF.y + (maoF.y - cotF.y) * 0.8 }], 12, corFundo);
    } else if (molde.roupa.manga === 'curta') {
      desenharMembroTubo([{ x: oX, y: oY }, { x: oX + (cotF.x - oX) * 0.85, y: oY + (cotF.y - oY) * 0.85 }], 13, corFundo);
    }
    desenharMao(maoF, cotF);

    // 7. Pescoço e Cabeça articulada
    desenharMembroTubo([{ x: oX, y: oY }, { x: cabX, y: cabY }], 8, corFundo);
    corpoPartes.push(`<g id="${id}-cabeca" transform="translate(${cabX.toFixed(1)}, ${(cabY - rCab * 0.6).toFixed(1)})">${cabecaConteudo}</g>`);
  }

  const bg = opcoes.incluirFundo ? `<rect width="100%" height="100%" fill="${corFundo}" />` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-110 -65 220 250" width="100%" height="100%" style="overflow: visible;">
  ${bg}
  <g id="${id}-corpo-inteiro">
    ${corpoPartes.join('\n    ')}
  </g>
</svg>`;
}

