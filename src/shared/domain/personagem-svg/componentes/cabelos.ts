import type { CaminhoSVG } from '../tipos';

/** Caminhos vetoriais de cabelos para os personagens canônicos */
export const CABELOS_SVG: Record<string, { frontal?: CaminhoSVG[]; traseiro?: CaminhoSVG[]; acessorios?: CaminhoSVG[] }> = {
  // CringeFather: Cabelo espetado estilo cientista louco
  cringefather: {
    frontal: [
      {
        d: 'M -32,-18 C -36,-38 -20,-50 -8,-45 C -4,-62 14,-62 20,-48 C 30,-58 42,-44 36,-22 C 40,-12 36,0 32,8 L 30,-6 C 24,-18 10,-22 0,-18 C -14,-22 -26,-14 -32,-18 Z',
        preenchimento: '#fff',
        traco: '#14161a',
        espessura: 1.2,
      },
      // Mechas internas grisalhas
      { d: 'M -16,-34 L -6,-22 M 4,-38 L 8,-22 M 18,-32 L 20,-16', traco: '#14161a', espessura: 0.8 },
    ],
  },

  // BetaSon: Cabelo castanho cacheado volumoso
  betason: {
    frontal: [
      {
        d: 'M -32,-14 C -38,-28 -28,-44 -16,-46 C -12,-54 -2,-56 8,-50 C 18,-56 30,-50 34,-40 C 40,-30 38,-16 32,-10 C 26,-20 12,-24 -2,-22 C -16,-24 -26,-18 -32,-14 Z',
        preenchimento: '#fff',
        traco: '#14161a',
        espessura: 1.2,
      },
      // Cachos em formato de ondas/espirais
      { d: 'M -22,-30 Q -16,-36 -12,-28 Q -8,-36 -2,-30 Q 6,-38 12,-30 Q 18,-36 24,-26', traco: '#14161a', espessura: 0.9 },
    ],
  },

  // Erika: Cabelo preto longo e liso partido ao meio
  erika: {
    traseiro: [
      {
        d: 'M -30,-10 C -36,15 -34,45 -28,80 C -22,86 -14,84 -18,65 C -20,40 -20,10 -15,-6 Z',
        preenchimento: '#14161a',
        traco: '#14161a',
      },
      {
        d: 'M 30,-10 C 36,15 34,45 28,80 C 22,86 14,84 18,65 C 20,40 20,10 15,-6 Z',
        preenchimento: '#14161a',
        traco: '#14161a',
      },
    ],
    frontal: [
      {
        d: 'M -32,-12 C -28,-36 -8,-44 0,-44 C 8,-44 28,-36 32,-12 C 22,-28 10,-32 0,-30 C -10,-32 -22,-28 -32,-12 Z',
        preenchimento: '#14161a',
        traco: '#14161a',
      },
      // Linha da risca central
      { d: 'M 0,-44 L 0,-30', traco: '#fff', espessura: 1.0 },
    ],
  },

  // Dario: Cabelo tigelinha reto
  dario: {
    frontal: [
      {
        d: 'M -28,-8 C -30,-28 -18,-38 0,-38 C 18,-38 30,-28 28,-8 C 24,-16 12,-20 0,-20 C -12,-20 -24,-16 -28,-8 Z',
        preenchimento: '#fff',
        traco: '#14161a',
        espessura: 1.2,
      },
      // Franja reta
      { d: 'M -24,-14 L 24,-14', traco: '#14161a', espessura: 1.0 },
    ],
  },

  // Laura: Maria-chiquinha dupla com laços
  laura: {
    frontal: [
      {
        d: 'M -24,-10 C -26,-28 -12,-36 0,-36 C 12,-36 26,-28 24,-10 C 18,-18 8,-22 0,-22 C -8,-22 -18,-18 -24,-10 Z',
        preenchimento: '#fff',
        traco: '#14161a',
        espessura: 1.2,
      },
    ],
    acessorios: [
      // Maria-chiquinha esquerda + laço
      { d: 'M -24,-24 C -36,-32 -44,-20 -38,-10 C -34,-4 -28,-14 -24,-18 Z', preenchimento: '#fff', traco: '#14161a' },
      { d: 'M -28,-22 L -20,-26 M -28,-26 L -20,-22', traco: '#e11d48', espessura: 1.5 },
      // Maria-chiquinha direita + laço
      { d: 'M 24,-24 C 36,-32 44,-20 38,-10 C 34,-4 28,-14 24,-18 Z', preenchimento: '#fff', traco: '#14161a' },
      { d: 'M 28,-22 L 20,-26 M 28,-26 L 20,-22', traco: '#e11d48', espessura: 1.5 },
    ],
  },

  // Elizendra: Cabelo grisalho ondulado com coque e grampos
  elizendra: {
    traseiro: [
      // Coque alto com ondas
      { d: 'M -14,-42 C -18,-58 18,-58 14,-42 C 10,-48 -10,-48 -14,-42 Z', preenchimento: '#fff', traco: '#14161a' },
    ],
    frontal: [
      {
        d: 'M -32,-12 C -38,-28 -24,-44 0,-44 C 24,-44 38,-28 32,-12 C 24,-24 14,-26 0,-26 C -14,-26 -24,-24 -32,-12 Z',
        preenchimento: '#fff',
        traco: '#14161a',
      },
      // Grampos cruzados
      { d: 'M -18,-30 L -12,-26 M -18,-26 L -12,-30', traco: '#14161a', espessura: 1.0 },
      { d: 'M 18,-30 L 12,-26 M 18,-26 L 12,-30', traco: '#14161a', espessura: 1.0 },
    ],
  },

  // Artur: Cabelo curto gamer com franja diagonal
  artur: {
    frontal: [
      {
        d: 'M -30,-12 C -34,-30 -18,-42 0,-42 C 18,-42 34,-30 30,-12 C 22,-24 10,-22 2,-20 C -6,-26 -20,-20 -30,-12 Z',
        preenchimento: '#fff',
        traco: '#14161a',
      },
      // Franja desfiada
      { d: 'M -18,-26 L -6,-16 L 4,-24 L 14,-15', traco: '#14161a', espessura: 1.0 },
    ],
  },

  // Carol: Rabo de cavalo alto e moderno
  carol: {
    traseiro: [
      // Rabo de cavalo caindo para trás
      { d: 'M 16,-34 C 36,-44 48,-30 46,-8 C 44,12 36,32 30,42 C 28,34 34,16 36,-4 C 38,-18 28,-26 18,-28 Z', preenchimento: '#fff', traco: '#14161a' },
      // Elástico de prender
      { d: 'M 14,-32 L 20,-26', traco: '#0284c7', espessura: 2.2 },
    ],
    frontal: [
      {
        d: 'M -30,-12 C -32,-32 -14,-42 4,-42 C 18,-42 28,-32 26,-12 C 18,-22 4,-26 -8,-24 C -18,-26 -26,-20 -30,-12 Z',
        preenchimento: '#fff',
        traco: '#14161a',
      },
    ],
  },

  // Véia: Permanente curto e armado
  veia: {
    frontal: [
      {
        d: 'M -32,-10 C -42,-24 -36,-46 -18,-48 C -8,-58 12,-58 22,-46 C 38,-44 42,-24 32,-10 C 26,-22 14,-24 0,-24 C -14,-24 -24,-22 -32,-10 Z',
        preenchimento: '#fff',
        traco: '#14161a',
      },
      // Textura encaracolada
      { d: 'M -20,-34 A 4,4 0 1,1 -14,-34 M -6,-40 A 4,4 0 1,1 0,-40 M 8,-40 A 4,4 0 1,1 14,-40 M 18,-32 A 4,4 0 1,1 24,-32', traco: '#14161a', espessura: 0.8 },
    ],
  },

  // Véio: Calvo com mechas laterais e sobrancelhas grossas
  veio: {
    frontal: [
      // Mecha lateral esquerda
      { d: 'M -30,-16 C -36,-12 -38,0 -32,8 C -30,2 -30,-6 -28,-12 Z', preenchimento: '#fff', traco: '#14161a' },
      // Mecha lateral direita
      { d: 'M 30,-16 C 36,-12 38,0 32,8 C 30,2 30,-6 28,-12 Z', preenchimento: '#fff', traco: '#14161a' },
      // Rugas na testa
      { d: 'M -14,-32 Q 0,-35 14,-32 M -10,-26 Q 0,-28 10,-26', traco: '#14161a', espessura: 0.7 },
    ],
  },

  // Paraíba: Orelhas caídas de cão vira-lata
  paraiba: {
    frontal: [
      // Orelha esquerda caída
      { d: 'M -22,-24 C -36,-26 -44,-8 -40,12 C -36,18 -30,10 -26,-2 C -24,-12 -22,-18 -20,-22 Z', preenchimento: '#fff', traco: '#14161a' },
      // Orelha direita caída
      { d: 'M 22,-24 C 36,-26 44,-8 40,12 C 36,18 30,10 26,-2 C 24,-12 22,-18 20,-22 Z', preenchimento: '#fff', traco: '#14161a' },
    ],
  },

  // Mingau: Orelhas pontudas de gatinho
  mingau: {
    frontal: [
      // Orelha esquerda pontuda com interior
      { d: 'M -24,-22 L -34,-48 L -8,-32 Z', preenchimento: '#fff', traco: '#14161a' },
      { d: 'M -26,-26 L -31,-42 L -14,-32 Z', preenchimento: '#ffe4e6', traco: '#f43f5e', espessura: 0.7 },
      // Orelha direita pontuda com interior
      { d: 'M 24,-22 L 34,-48 L 8,-32 Z', preenchimento: '#fff', traco: '#14161a' },
      { d: 'M 26,-26 L 31,-42 L 14,-32 Z', preenchimento: '#ffe4e6', traco: '#f43f5e', espessura: 0.7 },
    ],
  },
};
