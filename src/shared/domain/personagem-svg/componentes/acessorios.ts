import type { CaminhoSVG } from '../tipos';

/** Acessórios faciais (óculos) */
export const OCULOS_SVG: Record<string, CaminhoSVG[]> = {
  // CringeFather: Armação retangular fina com ponte
  cringefather: [
    { d: 'M -24,-14 L -4,-14 L -4,0 L -24,0 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.2 },
    { d: 'M 4,-14 L 24,-14 L 24,0 L 4,0 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.2 },
    { d: 'M -4,-7 L 4,-7', traco: '#14161a', espessura: 1.2 },
    { d: 'M -24,-7 L -32,-7 M 24,-7 L 32,-7', traco: '#14161a', espessura: 0.9 }, // hastes
  ],

  // BetaSon: Óculos redondos clássicos
  betason: [
    { d: 'M -14,-7 A 9,9 0 1,1 -14,11 A 9,9 0 1,1 -14,-7 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.3 },
    { d: 'M 14,-7 A 9,9 0 1,1 14,11 A 9,9 0 1,1 14,-7 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.3 },
    { d: 'M -5,2 L 5,2', traco: '#14161a', espessura: 1.2 },
    { d: 'M -23,2 L -30,2 M 23,2 L 30,2', traco: '#14161a', espessura: 0.9 },
  ],

  // Erika: Óculos elegantes ovais/finos
  erika: [
    { d: 'M -22,-10 Q -13,-12 -4,-10 Q -4,2 -13,4 Q -22,2 -22,-10 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.0 },
    { d: 'M 4,-10 Q 13,-12 22,-10 Q 22,2 13,4 Q 4,2 4,-10 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.0 },
    { d: 'M -4,-5 L 4,-5', traco: '#14161a', espessura: 1.0 },
  ],

  // Elizendra: Óculos ovais com correntinha pendurada
  elizendra: [
    { d: 'M -22,-8 A 8,6 0 1,1 -6,-8 A 8,6 0 1,1 -22,-8 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.1 },
    { d: 'M 6,-8 A 8,6 0 1,1 22,-8 A 8,6 0 1,1 6,-8 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.1 },
    { d: 'M -6,-8 L 6,-8', traco: '#14161a', espessura: 1.1 },
    // Correntinha pendurada
    { d: 'M -22,-8 Q -28,8 -20,24 M 22,-8 Q 28,8 20,24', traco: '#14161a', espessura: 0.7, linhaTracejada: [2, 2] },
  ],

  // Artur: Óculos gamer quadrados
  artur: [
    { d: 'M -24,-12 L -4,-12 L -4,2 L -24,2 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.4 },
    { d: 'M 4,-12 L 24,-12 L 24,2 L 4,2 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.4 },
    { d: 'M -4,-5 L 4,-5', traco: '#14161a', espessura: 1.4 },
  ],
};

/** Emblemas e adereços de corpo */
export const EMBLEMAS_CORPO_SVG: Record<string, CaminhoSVG[]> = {
  // CringeFather: Jaleco com lapelas e gravata
  cringefather: [
    { d: 'M -18,-15 L -6,25 L -14,25', traco: '#14161a', espessura: 1.1 }, // lapela esquerda
    { d: 'M 18,-15 L 6,25 L 14,25', traco: '#14161a', espessura: 1.1 },   // lapela direita
    { d: 'M -3,-12 L 3,-12 L 2,-6 L 4,14 L 0,20 L -4,14 L -2,-6 Z', preenchimento: '#14161a', traco: '#14161a' }, // gravata
    { d: 'M 0,32 L 0,70', traco: '#14161a', espessura: 0.8 },             // fenda do jaleco
  ],

  // BetaSon: Estampa de Alienígena no peito
  betason: [
    // Cabeça de alien
    { d: 'M -9,12 C -15,5 -12,-3 0,-3 C 12,-3 15,5 9,12 C 5,16 -5,16 -9,12 Z', preenchimento: 'none', traco: '#14161a', espessura: 1.1 },
    // Olhos ovais inclinados de alien
    { d: 'M -6,4 Q -4,2 -2,5 Q -3,8 -6,6 Z', preenchimento: '#14161a', traco: '#14161a' },
    { d: 'M 6,4 Q 4,2 2,5 Q 3,8 6,6 Z', preenchimento: '#14161a', traco: '#14161a' },
  ],

  // Dario: Crista dorsal de dinossauro
  dario: [
    { d: 'M -12,-6 L -18,-2 L -12,2 M -12,8 L -18,12 L -12,16 M -12,22 L -18,26 L -12,30', traco: '#14161a', espessura: 1.3 },
  ],

  // Laura: Coração no peito
  laura: [
    { d: 'M 0,22 C -6,14 -12,10 -12,3 C -12,-4 -4,-4 0,1 C 4,-4 12,-4 12,3 C 12,10 6,14 0,22 Z', preenchimento: '#f43f5e', traco: '#14161a', espessura: 1.0 },
  ],

  // Elizendra: Bolso do avental com flor e colher de pau
  elizendra: [
    // Bolso quadrado
    { d: 'M -10,18 L 10,18 L 9,34 L -9,34 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.1 },
    // Flor bordada
    { d: 'M -2,26 A 2,2 0 1,1 2,26 A 2,2 0 1,1 -2,26 Z', preenchimento: '#14161a', traco: '#14161a' },
    // Colher de pau inclinada
    { d: 'M 3,24 L 8,6 M 7,5 A 4,6 0 1,1 11,8 A 4,6 0 1,1 7,5 Z', traco: '#14161a', espessura: 1.0 },
  ],

  // Artur: Controle de videogame retrô
  artur: [
    // Corpo do controle
    { d: 'M -16,14 L 16,14 Q 20,20 16,28 L 10,26 L 8,24 L -8,24 L -10,26 L -16,28 Q -20,20 -16,14 Z', preenchimento: '#fff', traco: '#14161a', espessura: 1.2 },
    // D-Pad (+)
    { d: 'M -10,17 L -6,17 M -8,15 L -8,19', traco: '#14161a', espessura: 1.6 },
    // Botões (A, B)
    { d: 'M 6,19 A 1.5,1.5 0 1,1 9,19 M 9,16 A 1.5,1.5 0 1,1 12,16', traco: '#14161a', espessura: 1.2 },
  ],

  // Carol: Raio elétrico moderno
  carol: [
    { d: 'M 3,4 L -5,16 L 1,16 L -3,28 L 7,14 L 1,14 Z', preenchimento: '#0284c7', traco: '#14161a', espessura: 1.1 },
  ],

  // Véia: Colar de pérolas
  veia: [
    { d: 'M -14,-8 A 3,3 0 1,1 -8,-8 A 3,3 0 1,1 -2,-6 A 3,3 0 1,1 4,-6 A 3,3 0 1,1 10,-8 A 3,3 0 1,1 16,-8', traco: '#14161a', espessura: 1.0 },
  ],

  // Véio: Gravata borboleta
  veio: [
    { d: 'M -10,-10 L 0,-6 L -10,-2 Z M 10,-10 L 0,-6 L 10,-2 Z M -2,-8 A 2,2 0 1,1 2,-8 A 2,2 0 1,1 -2,-8 Z', preenchimento: '#14161a', traco: '#14161a' },
  ],

  // Paraíba: Coleira com medalhinha
  paraiba: [
    { d: 'M -14,6 L 14,6', traco: '#b45309', espessura: 3.5 },
    { d: 'M 0,9 A 4,4 0 1,1 0,17 A 4,4 0 1,1 0,9 Z', preenchimento: '#eab308', traco: '#14161a', espessura: 1.0 },
  ],

  // Mingau: Coleira vermelha com guizo
  mingau: [
    { d: 'M -11,5 L 11,5', traco: '#dc2626', espessura: 2.5 },
    { d: 'M 0,7 A 3,3 0 1,1 0,13 A 3,3 0 1,1 0,7 Z', preenchimento: '#fde047', traco: '#14161a', espessura: 0.9 },
  ],
};
