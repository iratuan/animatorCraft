import type { ActorId } from '../characters';
import { CABELOS_SVG } from './componentes/cabelos';
import { EMBLEMAS_CORPO_SVG, OCULOS_SVG } from './componentes/acessorios';
import type { MoldePersonagemSVG } from './tipos';

/** Molde vetorial completo para cada um dos 12 personagens do StickBoard */
export const CATALOGO_MOLDES_SVG: Record<ActorId, MoldePersonagemSVG> = {
  cringefather: {
    id: 'cringefather',
    nome: 'CringeFather',
    proporcoes: { alturaPadrao: 560, raioCabeca: 36, larguraOmbro: 30, comprimentoTronco: 140 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 36, ry: 36, preenchimento: '#fff', traco: '#14161a', espessura: 1.4 } },
    cabelo: CABELOS_SVG.cringefather,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -4, espacamento: 28, raioOlho: 8.5 },
      oculos: { tipo: 'retangular', armacao: OCULOS_SVG.cringefather! },
    },
    boca: { formatoBase: 'M -8,14 Q 2,13 12,9' },
    roupa: {
      manga: 'longa',
      tipoInferior: 'calca',
      calcaPreta: true,
      tronco: [{ d: 'M -18,-15 L 18,-15 L 14,75 L -14,75 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.cringefather,
    },
    membros: { tipoMao: 'humana', sapato: 'social' },
  },

  betason: {
    id: 'betason',
    nome: 'BetaSon',
    proporcoes: { alturaPadrao: 440, raioCabeca: 34, larguraOmbro: 26, comprimentoTronco: 110 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 34, ry: 34, preenchimento: '#fff', traco: '#14161a', espessura: 1.4 } },
    cabelo: CABELOS_SVG.betason,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -2, espacamento: 26, raioOlho: 8.5 },
      oculos: { tipo: 'redondo', armacao: OCULOS_SVG.betason! },
    },
    boca: { formatoBase: 'M -12,10 Q 0,22 12,10 Q 0,14 -12,10 Z' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'calca',
      calcaPreta: false,
      tronco: [{ d: 'M -17,-12 L 17,-12 L 15,65 L -15,65 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      estampa: EMBLEMAS_CORPO_SVG.betason,
    },
    membros: { tipoMao: 'humana', sapato: 'tenis' },
  },

  erika: {
    id: 'erika',
    nome: 'Erika',
    proporcoes: { alturaPadrao: 580, raioCabeca: 33, larguraOmbro: 27, comprimentoTronco: 135 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 33, ry: 33, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.erika,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -4, espacamento: 26, raioOlho: 8 },
      oculos: { tipo: 'fino', armacao: OCULOS_SVG.erika! },
      cilios: true,
    },
    boca: { formatoBase: 'M -10,12 Q 0,18 10,12' },
    roupa: {
      manga: 'longa',
      tipoInferior: 'saia',
      tronco: [{ d: 'M -15,-12 L 15,-12 L 13,60 L -13,60 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.2 }],
    },
    membros: { tipoMao: 'humana', sapato: 'sandalia' },
  },

  dario: {
    id: 'dario',
    nome: 'Dario',
    proporcoes: { alturaPadrao: 340, raioCabeca: 32, larguraOmbro: 22, comprimentoTronco: 85 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 32, ry: 32, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.dario,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -2, espacamento: 24, raioOlho: 7.5 },
    },
    boca: { formatoBase: 'M -8,12 L 8,12' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'bermuda',
      tronco: [{ d: 'M -14,-10 L 14,-10 L 13,50 L -13,50 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.dario,
    },
    membros: { tipoMao: 'humana', sapato: 'tenis' },
  },

  laura: {
    id: 'laura',
    nome: 'Laura',
    proporcoes: { alturaPadrao: 285, raioCabeca: 30, larguraOmbro: 20, comprimentoTronco: 70 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 30, ry: 30, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.laura,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -2, espacamento: 22, raioOlho: 7.5 },
      cilios: true,
    },
    boca: { formatoBase: 'M -10,10 Q 0,18 10,10' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'vestido',
      tronco: [{ d: 'M -12,-8 L 12,-8 L 18,52 L -18,52 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.2 }],
      estampa: EMBLEMAS_CORPO_SVG.laura,
    },
    membros: { tipoMao: 'humana', sapato: 'sapatilha' },
  },

  elizendra: {
    id: 'elizendra',
    nome: 'Elizendra',
    proporcoes: { alturaPadrao: 500, raioCabeca: 35, larguraOmbro: 28, comprimentoTronco: 120 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 35, ry: 35, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.elizendra,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -3, espacamento: 26, raioOlho: 7.5 },
      oculos: { tipo: 'correntinha', armacao: OCULOS_SVG.elizendra! },
    },
    boca: { formatoBase: 'M -10,12 Q 0,18 10,12' },
    roupa: {
      manga: 'longa',
      tipoInferior: 'vestido',
      tronco: [{ d: 'M -16,-12 L 16,-12 L 20,70 L -20,70 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.elizendra,
    },
    membros: { tipoMao: 'humana', sapato: 'sapatilha' },
  },

  artur: {
    id: 'artur',
    nome: 'Artur',
    proporcoes: { alturaPadrao: 430, raioCabeca: 36, larguraOmbro: 32, comprimentoTronco: 110 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 36, ry: 36, preenchimento: '#fff', traco: '#14161a', espessura: 1.4 } },
    cabelo: CABELOS_SVG.artur,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -3, espacamento: 28, raioOlho: 8.5 },
      oculos: { tipo: 'gamer', armacao: OCULOS_SVG.artur! },
    },
    boca: { formatoBase: 'M -10,11 Q 0,20 10,11' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'bermuda',
      tronco: [{ d: 'M -20,-12 L 20,-12 L 18,65 L -18,65 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      estampa: EMBLEMAS_CORPO_SVG.artur,
    },
    membros: { tipoMao: 'humana', sapato: 'tenis' },
  },

  carol: {
    id: 'carol',
    nome: 'Carol',
    proporcoes: { alturaPadrao: 475, raioCabeca: 33, larguraOmbro: 25, comprimentoTronco: 115 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 33, ry: 33, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.carol,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -3, espacamento: 25, raioOlho: 8 },
      cilios: true,
    },
    boca: { formatoBase: 'M -10,10 Q 0,19 10,10' },
    roupa: {
      manga: 'curta',
      tipoInferior: 'calca',
      calcaPreta: false,
      tronco: [{ d: 'M -15,-10 L 15,-10 L 13,62 L -13,62 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.2 }],
      estampa: EMBLEMAS_CORPO_SVG.carol,
    },
    membros: { tipoMao: 'humana', sapato: 'tenis' },
  },

  veia: {
    id: 'veia',
    nome: 'Véia',
    proporcoes: { alturaPadrao: 480, raioCabeca: 34, larguraOmbro: 27, comprimentoTronco: 115 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 34, ry: 34, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.veia,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -3, espacamento: 25, raioOlho: 8 },
    },
    boca: { formatoBase: 'M -11,14 L 11,12' },
    roupa: {
      manga: 'longa',
      tipoInferior: 'vestido',
      tronco: [{ d: 'M -15,-10 L 15,-10 L 19,68 L -19,68 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.veia,
    },
    membros: { tipoMao: 'humana', sapato: 'sapatilha' },
  },

  veio: {
    id: 'veio',
    nome: 'Véio',
    proporcoes: { alturaPadrao: 510, raioCabeca: 35, larguraOmbro: 28, comprimentoTronco: 125 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 35, ry: 35, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.veio,
    olhos: {
      estilo: 'rick-and-morty',
      posicaoRelativa: { x: 0, y: -2, espacamento: 26, raioOlho: 9 },
    },
    boca: { formatoBase: 'M -9,13 L 9,13' },
    roupa: {
      manga: 'longa',
      tipoInferior: 'calca',
      calcaPreta: true,
      tronco: [{ d: 'M -16,-12 L 16,-12 L 15,68 L -15,68 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.veio,
    },
    membros: { tipoMao: 'humana', sapato: 'social' },
  },

  paraiba: {
    id: 'paraiba',
    nome: 'Paraíba',
    proporcoes: { alturaPadrao: 210, raioCabeca: 26, larguraOmbro: 22, comprimentoTronco: 60 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 28, ry: 24, preenchimento: '#fff', traco: '#14161a', espessura: 1.4 } },
    cabelo: CABELOS_SVG.paraiba,
    olhos: {
      estilo: 'canino',
      posicaoRelativa: { x: 0, y: -4, espacamento: 20, raioOlho: 5.5 },
    },
    boca: {
      tipoFocinho: 'canino',
      formatoBase: 'M -8,8 Q -4,14 0,10 Q 4,14 8,8',
    },
    roupa: {
      manga: 'nenhuma',
      tipoInferior: 'pata',
      tronco: [{ d: 'M -12,-6 C -14,10 -12,24 0,26 C 12,24 14,10 12,-6 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.3 }],
      acessorios: EMBLEMAS_CORPO_SVG.paraiba,
    },
    membros: { tipoMao: 'pata-canina', sapato: 'nenhum' },
  },

  mingau: {
    id: 'mingau',
    nome: 'Mingau',
    proporcoes: { alturaPadrao: 175, raioCabeca: 23, larguraOmbro: 18, comprimentoTronco: 50 },
    cabeca: { silhueta: { cx: 0, cy: 0, rx: 24, ry: 21, preenchimento: '#fff', traco: '#14161a', espessura: 1.3 } },
    cabelo: CABELOS_SVG.mingau,
    olhos: {
      estilo: 'felino',
      posicaoRelativa: { x: 0, y: -3, espacamento: 18, raioOlho: 5 },
    },
    boca: {
      tipoFocinho: 'felino',
      formatoBase: 'M -6,6 Q -3,10 0,7 Q 3,10 6,6',
      bigodes: [
        { d: 'M -8,5 L -20,3 M -8,7 L -22,8 M -8,9 L -19,13', traco: '#14161a', espessura: 0.8 },
        { d: 'M 8,5 L 20,3 M 8,7 L 22,8 M 8,9 L 19,13', traco: '#14161a', espessura: 0.8 },
      ],
    },
    roupa: {
      manga: 'nenhuma',
      tipoInferior: 'pata',
      tronco: [{ d: 'M -10,-5 C -12,8 -10,20 0,22 C 10,20 12,8 10,-5 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.2 }],
      acessorios: EMBLEMAS_CORPO_SVG.mingau,
    },
    membros: { tipoMao: 'pata-felina', sapato: 'nenhum' },
  },
};
