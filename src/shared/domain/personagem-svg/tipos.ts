import type { ActorId } from '../characters';
import type { ExpressaoId, PoseId } from '../poses';

/** Elemento de caminho vetorial com atributos de traço e preenchimento */
export interface CaminhoSVG {
  id?: string;
  d: string;
  preenchimento?: string; // padrão: 'none' ou '#fff'
  traco?: string;        // padrão: '#14161a'
  espessura?: number;    // multiplicador sobre o lineWidth base
  fechado?: boolean;
  linhaTracejada?: number[];
}

/** Círculo ou elipse vetorial */
export interface ElipseSVG {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  preenchimento?: string;
  traco?: string;
  espessura?: number;
}

/** Grupo de elementos vetoriais com transformações locais */
export interface GrupoVetorialSVG {
  id: string;
  caminhos?: CaminhoSVG[];
  elipses?: ElipseSVG[];
  rotacao?: number;
  translacao?: { x: number; y: number };
  escala?: { x: number; y: number };
}

/** Componentes anatômicos modulares de um personagem */
export interface MoldePersonagemSVG {
  id: ActorId;
  nome: string;
  proporcoes: {
    alturaPadrao: number; // ex: 560
    raioCabeca: number;   // raio padrão da cabeça
    larguraOmbro: number;
    comprimentoTronco: number;
  };
  cabeca: {
    silhueta: CaminhoSVG | ElipseSVG;
    detalhesOrelhas?: CaminhoSVG[];
  };
  cabelo?: {
    frontal?: CaminhoSVG[];
    traseiro?: CaminhoSVG[];
    presilhasOuLacos?: CaminhoSVG[];
  };
  olhos: {
    estilo: 'rick-and-morty' | 'expressivo' | 'canino' | 'felino' | 'pontos';
    posicaoRelativa: { x: number; y: number; espacamento: number; raioOlho: number };
    oculos?: {
      tipo: 'retangular' | 'redondo' | 'fino' | 'gamer' | 'correntinha';
      armacao: CaminhoSVG[];
    };
    cilios?: boolean;
  };
  boca: {
    formatoBase: string; // caminho SVG neutro
    tipoFocinho?: 'humano' | 'canino' | 'felino';
    bigodes?: CaminhoSVG[];
  };
  roupa: {
    tronco: CaminhoSVG[];
    estampa?: CaminhoSVG[];
    acessorios?: CaminhoSVG[]; // jaleco, colher de pau, colar, crista dino, coleira
    manga: 'curta' | 'longa' | 'regata' | 'nenhuma';
    tipoInferior: 'calca' | 'bermuda' | 'saia' | 'vestido' | 'pata';
    calcaPreta?: boolean;
  };
  membros: {
    tipoMao: 'humana' | 'pata-canina' | 'pata-felina';
    sapato: 'social' | 'tenis' | 'sandalia' | 'sapatilha' | 'nenhum';
  };
}

/** Configuração para geração de SVG sob demanda */
export interface OpcoesRenderizacaoSVG {
  escala?: number;
  expressao?: ExpressaoId;
  visema?: string;
  pose?: PoseId;
  piscar?: boolean;
  olharDirecao?: { x: number; y: number }; // -1 a 1
  falarAbertura?: number;                 // 0 a 1
  larguraLinhaBase?: number;
  corTraco?: string;
  corPreenchimento?: string;
  incluirFundo?: boolean;
  modoIcone?: boolean; // só a cabeça/busto para avatar
}
