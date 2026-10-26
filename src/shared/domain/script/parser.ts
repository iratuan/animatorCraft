import { semAcento } from '../../util/texto';
import { ATORES, PAPEIS_PADRAO, type ActorId, type Papeis } from '../characters';
import { acharClipe, clipesPersonalizados, duracaoDoClipe, nomeDeClipe } from '../clipes';
import { ehExpressao, expressoesDe } from '../expressoes';
import { DANCA_PADRAO, DURACAO_PADRAO_DANCA, FRASE_POSE, POSES_DE_DANCA, type ExpressaoId, type PoseId } from '../poses';
import type { Acao, Cena, CenarioTipo, Diagnostico, FormatoProducao, Lado, Roteiro } from '../types';
import { desembrulharColchetes } from './colchetes';
import { diagnosticoDe } from './sugestoes';
import { lerGrafico } from '../grafico';
import { lerEfeito } from '../imagem';
import { nomeDeTrilha } from '../audio';


/** Teto de qualquer duração escrita no roteiro (10 min): um zero a mais por engano não pode travar o vídeo nem a exportação. */
const MAX_SEGUNDOS = 600;
const lerSegundos = (s: string): number => Math.min(MAX_SEGUNDOS, Math.max(0, parseFloat(s.replace(',', '.')) || 0));

/** Adjetivo falado -> pose e/ou expressão. */
export const ESTADOS: Record<string, { pose?: PoseId; expressao?: ExpressaoId }> = {
  confuso: { pose: 'confuso', expressao: 'confusa' },
  surpreso: { pose: 'surpreso', expressao: 'surpresa' },
  bravo: { pose: 'bravo', expressao: 'brava' },
  irritado: { pose: 'bravo', expressao: 'brava' },
  neutro: { expressao: 'neutra' },
  feliz: { expressao: 'feliz' },
  triste: { expressao: 'triste' },
  assustado: { expressao: 'assustada' },
  empolgado: { expressao: 'empolgada' },
  entediado: { expressao: 'entediada' },
  sarcastico: { pose: 'sarcastico', expressao: 'sarcastica' },
  pensativo: { pose: 'pensar', expressao: 'pensativa' },
  envergonhado: { pose: 'envergonhado' },
  rindo: { pose: 'rindo', expressao: 'feliz' },
  chorando: { pose: 'chorando', expressao: 'triste' },
  deboche: { expressao: 'deboche', pose: 'sarcastico' },
  desesperado: { expressao: 'desespero', pose: 'maos_na_cabeca' },
  comemorando: { pose: 'comemorar', expressao: 'empolgada' },
  apresentando: { pose: 'apresentar', expressao: 'feliz' },
  gesticulando: { pose: 'gesticular' },
  piscando: { expressao: 'piscadela' },
};

export const VERBOS_FALA = ['diz', 'fala', 'grita', 'pergunta', 'responde', 'sussurra', 'reclama', 'exclama'];
const REGEX_VERBOS_FALA = new RegExp(`\\b(?:${VERBOS_FALA.join('|')})\\b`);

const REGEX_ESTADOS: [RegExp, { pose?: PoseId; expressao?: ExpressaoId }][] = Object.entries(ESTADOS).map(
  ([palavra, estado]) => [new RegExp(`\\b${palavra}\\b`), estado]
);

const cacheRegexAtores = new Map<string, RegExp[]>();
function regexesDoAtor(id: string, apelidos: string[]): RegExp[] {
  let list = cacheRegexAtores.get(id);
  if (!list || list.length !== apelidos.length) {
    list = apelidos.map((ap) => new RegExp(`\\b${ap}\\b`));
    cacheRegexAtores.set(id, list);
  }
  return list;
}

interface FraseComPosicao { texto: string; ini: number; fim: number }

/** Divide em frases e informa onde cada uma está no texto de entrada (para a linha do tempo reescrever o roteiro). */
function dividirFrases(texto: string): FraseComPosicao[] {
  const frases: FraseComPosicao[] = [];
  let ini = 0;
  let aspas = false;
  let latex = false;
  const fechar = (ate: number) => {
    const bruto = texto.slice(ini, ate);
    const esq = bruto.length - bruto.trimStart().length;
    const t = bruto.trim();
    if (t) frases.push({ texto: t, ini: ini + esq, fim: ini + esq + t.length });
    ini = ate;
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    // comandos entre colchetes ([nota: ...], [close na lousa], [plano aberto]) são frases por si só
    // "[[...]]" é referência ou ação dentro da frase, não comando: o trecho continua na mesma frase
    if (c === '[' && texto[i + 1] === '[' && !aspas && !latex) { i++; continue; }
    if (c === '[' && !aspas && !latex) {
      fechar(i);
      const fim = texto.indexOf(']', i);
      const ate = fim === -1 ? texto.length - 1 : fim;
      ini = i; fechar(ate + 1);
      i = ate;
      continue;
    }
    if (c === '"') aspas = !aspas;
    else if (c === '$' && !aspas) latex = !latex;
    else if (!aspas && !latex && '.!?'.includes(c) && (i + 1 === texto.length || /\s/.test(texto[i + 1]!))) fechar(i + 1);
  }
  fechar(texto.length);
  return frases;
}
function acharLado(norm: string): Lado {
  if (/esquerda/.test(norm)) return 'esquerda';
  if (/direita/.test(norm)) return 'direita';
  return /centro|meio/.test(norm) ? 'centro' : 'esquerda';
}

function acharEstado(norm: string) {
  for (const [regex, estado] of REGEX_ESTADOS) {
    if (regex.test(norm)) return estado;
  }
  return undefined;
}

function estadoParaAcoes(ator: ActorId, estado: { pose?: PoseId; expressao?: ExpressaoId }): Acao[] {
  const acoes: Acao[] = [];
  if (estado.pose) acoes.push({ tipo: 'pose', ator, pose: estado.pose });
  if (estado.expressao) acoes.push({ tipo: 'expressao', ator, expressao: estado.expressao });
  return acoes;
}

function acharAtores(norm: string): ActorId[] {
  const achados: { id: ActorId; pos: number }[] = [];
  for (const spec of Object.values(ATORES)) {
    let minPos = Infinity;
    for (const rx of regexesDoAtor(spec.id, spec.apelidos)) {
      const idx = rx.exec(norm)?.index;
      if (idx !== undefined && idx < minPos) minPos = idx;
    }
    if (minPos !== Infinity) achados.push({ id: spec.id, pos: minPos });
  }
  return achados.sort((a, b) => a.pos - b.pos).map((a) => a.id);
}

/** Verbos no plural ("dançam", "entram", "saem") para a forma singular que o interpretador conhece. */
function singularizar(norm: string): string {
  return norm
    .replace(/\bsaem\b/g, 'sai').replace(/\bcaem\b/g, 'cai').replace(/\briem\b/g, 'ri').replace(/\bpoem\b/g, 'poe')
    .replace(/\b(\w{3,})am\b/g, '$1a').replace(/\b(\w{5,})em\b/g, '$1e');
}

/** Os papéis da aula ("Professor", "Aluno") viram o apelido de quem os cumpre nesta aula. */
function aplicarPapeis(norm: string, papeis: Papeis): string {
  return norm
    .replace(/\bprofessor(?:a)?\b/g, ATORES[papeis.professor]!.apelidos[0]!)
    .replace(/\baluno\b/g, ATORES[papeis.aluno]!.apelidos[0]!);
}

/** [close na lousa] · [close no professor] · [close em Erika] · [plano aberto]. */
function interpretarCamera(frase: string, avisos: string[], papeis: Papeis): Acao[] | null {
  const m = /^\[\s*(close|plano|volta|zoom)\b(.*)\]$/i.exec(frase);
  if (!m) return null;
  const inner = aplicarPapeis(semAcento(`${m[1]} ${m[2]}`), papeis);
  if (/\b(plano|volta|aberto|geral|normal)\b/.test(inner) && !/\b(lousa|quadro)\b/.test(inner)) return [{ tipo: 'camera', alvo: 'aberto' }];
  if (/\b(lousa|quadro)\b/.test(inner)) return [{ tipo: 'camera', alvo: 'lousa' }];
  const ator = acharAtores(inner)[0];
  if (ator) return [{ tipo: 'camera', alvo: 'personagem', ator }];
  avisos.push(`Câmera não entendida: "${frase}"`);
  return [];
}

function interpretarFrase(fraseOriginal: string, avisos: string[], presentes: Set<ActorId>, papeis: Papeis): Acao[] {
  const frase = desembrulharColchetes(fraseOriginal);
  const nota = /^\[\s*nota\s*:\s*(.*?)\s*\]$/i.exec(frase);
  if (nota) return [{ tipo: 'nota', texto: nota[1]! }];
  const camera = interpretarCamera(frase, avisos, papeis);
  if (camera) return camera;
  if (/^\[\s*(?:cen[aá]rio|formato|sem\s+lousa|sem\s+quadro)\b/i.test(frase)) return [];

  const citacao = /"([^"]*)"/.exec(frase)?.[1];
  const latex = /\$\$([^$]+)\$\$/.exec(frase)?.[1] ?? /\$([^$]+)\$/.exec(frase)?.[1];
  // Remove trechos literais antes de analisar verbos, para que o conteúdo não seja confundido com comandos.
  const norm = aplicarPapeis(semAcento(frase.replace(/"[^"]*"/g, ' ').replace(/\$\$[^$]+\$\$/g, ' ').replace(/\$[^$]+\$/g, ' ')), papeis);

  // o nome de um clipe ou de uma pose pode ser uma palavra de comando ("faz o clipe pausa por 3 segundos"): nesse caso a frase não é um comando de pausa/apagar
  const nomeDeRecurso = /\b(faz|executa|toca|usa|roda)\b.*\bclipe\b/.test(norm) || /\b(?:faz|assume|usa) a pose [a-z0-9]+(?:-[a-z0-9]+)*\b/.test(norm);
  const espera = nomeDeRecurso ? null : /\b(espera|pausa|aguarda)\b.*?(\d+(?:[.,]\d+)?)\s*segundo/.exec(norm);
  if (espera) return [{ tipo: 'esperar', segundos: lerSegundos(espera[2]!) }];
  if (!nomeDeRecurso && /\bapaga\b/.test(norm) && !/\bimagem\b/.test(norm)) return [{ tipo: 'apagar' }];

  // "Professor e Aluno dançam juntos" / "Todos dançam": uma ação por ator, todas começando juntas.
  let atores = acharAtores(norm);
  const todos = /\b(todos|todas)\b/.test(norm);
  if (todos && atores.length === 0) atores = [...presentes];
  const coletivo = todos || /\b(juntos|juntas)\b/.test(norm) || (atores.length >= 2 && /\be\b/.test(norm));
  if (!coletivo) atores = atores.slice(0, 1);
  if (atores.length === 0) {
    avisos.push(`Sem ator reconhecido: "${frase}"`);
    return [];
  }
  const normVerbos = atores.length > 1 ? singularizar(norm) : norm;
  return atores.flatMap((ator, i) =>
    interpretarAtor(frase, normVerbos, citacao, latex, ator, avisos).map((a): Acao => (i > 0 ? { ...a, junto: true } : a)),
  );
}

/**
 * "Professor mostra a imagem ciclo.png no quadro no canto direito pequena com efeito deslizar da direita e sai com efeito zoom por 6 segundos."
 * "Professor tira a imagem ciclo.png com efeito surgir."  (o nome pode vir entre aspas se tiver espaços)
 */
function interpretarImagem(frase: string, ator: ActorId, avisos: string[]): Acao[] | null {
  const m = /\bimagem\s+(?:"([^"]+)"|([^\s"]+))/i.exec(frase);
  if (!m) return null;
  const arquivo = (m[1] ?? m[2]!).replace(/[.,;!?]+$/, '');
  if (!arquivo) { avisos.push(`Diga o nome do arquivo da imagem: "${frase}"`); return []; }
  const resto = semAcento(frase.replace(m[0], ' ')); // sem o nome do arquivo, para ele não ser lido como efeito ("zoom.png")
  const retirar = /\b(tira|remove|retira|esconde|apaga|guarda|some com)\b/.test(resto);
  const partes = /^(.*?)\b(?:e\s+)?(?:sai|some|saindo|sumindo|saida)\b(.*)$/.exec(resto);
  const entrada = lerEfeito(partes ? partes[1]! : resto) ?? 'surgir';
  const saida = lerEfeito(partes ? partes[2]! : '') ?? (retirar ? lerEfeito(resto) : undefined);
  if (retirar) return [{ tipo: 'remover', ator, arquivo, saida: saida ?? entrada }];
  if (!/\b(mostra|coloca|poe|insere|exibe|adiciona|projeta|apresenta|cola)\b/.test(resto)) return null;
  const por = /\bpor (\d+(?:[.,]\d+)?) segundos?\b/.exec(resto)?.[1];
  const canto = /\bcanto (esquerdo|direito)\b/.exec(resto)?.[1];
  const tamanho = /\b(pequena|pequeno|menor)\b/.test(resto) ? 'pequena' : /\b(grande|maior|inteira|tela cheia)\b/.test(resto) ? 'grande' : 'media';
  return [{
    tipo: 'escrever', ator,
    conteudo: { tipo: 'imagem', arquivo, entrada, ...(saida ? { saida } : {}), ...(por ? { exibirPor: lerSegundos(por) } : {}), posicao: canto === 'esquerdo' ? 'esquerda' : canto === 'direito' ? 'direita' : 'centro', tamanho },
  }];
}

function interpretarAtor(frase: string, norm: string, citacao: string | undefined, latex: string | undefined, ator: ActorId, avisos: string[]): Acao[] {
  const imagem = interpretarImagem(frase, ator, avisos);
  if (imagem) return imagem;
  // "Betason faz a pose pular-corda [por 3 segundos]": usa um sprite do pacote pelo nome
  const etiqueta = /\b(?:faz|assume|usa) a pose ([a-z0-9]+(?:-[a-z0-9]+)*)\b/.exec(norm)?.[1];
  if (etiqueta) {
    const por = /\bpor (\d+(?:[.,]\d+)?) segundos?\b/.exec(norm)?.[1];
    return [{ tipo: 'pose', ator, pose: 'parado', etiqueta, ...(por ? { duracao: lerSegundos(por) } : {}) }];
  }
  // "Betason faz o clipe tchau [por 3 segundos]": clipe criado pelo usuário para o personagem
  if (/\b(faz|executa|toca|usa|roda)\b.*\bclipe\b/.test(norm)) {
    const m = /\bclipe\s+(?:"([^"]+)"|([^\s".,;!?]+))/i.exec(frase);
    const nome = nomeDeClipe(m?.[1] ?? m?.[2] ?? '');
    const clipe = nome ? acharClipe(ator, nome) : undefined;
    if (!clipe) {
      const tem = clipesPersonalizados(ator).map((c) => c.id);
      avisos.push(`${ATORES[ator]!.nome} não tem o clipe “${nome || '?'}”.${tem.length ? ` Clipes: ${[...new Set(tem)].join(', ')}.` : ' Crie em Personagem ▸ Expressões e clipes.'}`);
      return [];
    }
    const por = /\bpor (\d+(?:[.,]\d+)?) segundos?\b/.exec(norm)?.[1];
    return [{ tipo: 'pose', ator, pose: 'parado', clipe: clipe.id, duracao: por ? Math.max(0.1, lerSegundos(por)) : Math.max(0.3, duracaoDoClipe(clipe)) }];
  }
  // "desenha o gráfico de y = x^2 no quadro"
  if (/\b(desenha|plota|mostra|traca|faz|coloca)\b/.test(norm) && /\bgrafico\b/.test(norm)) {
    const g = lerGrafico(frase);
    if (g && 'erro' in g) { avisos.push(g.erro); return []; }
    if (g) return [{ tipo: 'escrever', ator, conteudo: { tipo: 'grafico', grafico: g.grafico } }];
  }
  const estado = acharEstado(norm);

  if (citacao !== undefined && REGEX_VERBOS_FALA.test(norm)) {
    return [{ tipo: 'fala', ator, texto: citacao }, ...(estado ? estadoParaAcoes(ator, estado) : [])];
  }
  if (/\bescreve\b/.test(norm)) {
    if (latex) return [{ tipo: 'escrever', ator, conteudo: { tipo: 'latex', latex } }];
    if (citacao !== undefined) {
      const temSintaxeLatex = citacao.includes('\\') || /[\^_{}]/.test(citacao) || /^\s*[\$]/.test(citacao);
      const ehFormula = /\b(f[oó]rmula|formula|latex|equa[cç][aã]o)\b/i.test(frase) || temSintaxeLatex;
      if (ehFormula) return [{ tipo: 'escrever', ator, conteudo: { tipo: 'latex', latex: citacao } }];
      return [{ tipo: 'escrever', ator, conteudo: { tipo: 'texto', texto: citacao } }];
    }
  }
  // "fica na posição 35%" / "anda para a posição 60%" / "entra pela esquerda na posição 20%"
  const pct = /\bposicao\s*(?:de\s*)?(\d+(?:[.,]\d+)?)\s*%?/.exec(norm)?.[1];
  const xPos = pct ? Math.min(100, Math.max(0, parseFloat(pct.replace(',', '.')))) / 100 : undefined;
  if (/\b(entra|chega)\b/.test(norm)) {
    const pose: PoseId = /correndo/.test(norm) ? 'correr' : 'andar';
    return [{ tipo: 'entrar', ator, lado: acharLado(norm), pose, ...(xPos !== undefined ? { x: xPos } : {}) }];
  }
  if (/\b(sai|vai embora)\b/.test(norm)) {
    const pose: PoseId = /correndo/.test(norm) ? 'correr' : 'andar';
    return [{ tipo: 'sair', ator, lado: acharLado(norm), pose }];
  }
  if (xPos !== undefined && /\b(fica|vai|vem|anda|corre|caminha|move|muda|posiciona|se posiciona)\b/.test(norm)) {
    return [{ tipo: 'posicionar', ator, x: xPos, ...(/\b(vai|vem|anda|corre|caminha|move)\b/.test(norm) ? { andando: true } : {}) }];
  }
  if (/\baponta\b/.test(norm)) return [{ tipo: 'apontar', ator }];
  // "faz cara de brava" · "faz cara de apaixonada" (expressão criada para o personagem)
  const cara = /\bcara de ([a-z0-9]+(?:-[a-z0-9]+)*)/.exec(norm)?.[1];
  if (cara) {
    if (ehExpressao(ator, cara)) return [{ tipo: 'expressao', ator, expressao: cara }];
    avisos.push(`${ATORES[ator]!.nome} não tem a expressão “${cara}”. Expressões: ${expressoesDe(ator).join(', ')}.`);
    return [];
  }
  if (estado) return estadoParaAcoes(ator, estado);
  const poseTemporaria = (pose: PoseId): Acao => {
    const por = /\bpor (\d+(?:[.,]\d+)?) segundos?\b/.exec(norm)?.[1];
    const dura = por ? lerSegundos(por) : POSES_DE_DANCA.includes(pose) ? DURACAO_PADRAO_DANCA : undefined;
    return { tipo: 'pose', ator, pose, ...(dura ? { duracao: dura } : {}) };
  };
  for (const [pose, fraseDaPose] of Object.entries(FRASE_POSE)) {
    if (new RegExp(`\\b${semAcento(fraseDaPose)}\\b`).test(norm)) return [poseTemporaria(pose as PoseId)];
  }
  if (/\b(danca|dancando)\b/.test(norm)) return [poseTemporaria((DANCA_PADRAO[ator] ?? ATORES[ator]?.dancaPadrao ?? 'danca_atual') as PoseId)];

  avisos.push(`Ação não entendida: "${frase}"`);
  return [];
}

// ---------------------------------------------------------------- áudio
// [áudio: aula1.wav]            anexa a narração à fala anterior (a fala dura o tempo do áudio e a boca acompanha a voz)
// [música: fundo.mp3]           música de fundo até [música: parar] ou o fim · [música: fundo.mp3, volume 30%]
// [efeito: palmas.wav]          efeito sonoro neste ponto (não atrasa as ações)

function interpretarAudio(frase: string, anteriores: Acao[], avisos: string[]): { nova?: Acao; anexada?: boolean } | null {
  const m = /^\[\s*(áudio|audio|música|musica|efeito|voz)\s*:\s*(.*?)\s*\]$/i.exec(frase);
  if (!m) return null;
  const tipo = semAcento(m[1]!);
  let corpo = m[2]!;
  // opções no fim da etiqueta, em qualquer ordem: \", volume 30%\" e \", trilha ambiente\"
  let volume: number | undefined, trilha: string | undefined;
  for (let i = 0; i < 2; i++) {
    const tr = /[,;]?\s*trilha\s+([^,;]+?)\s*$/i.exec(corpo);
    if (tr) { trilha = nomeDeTrilha(tr[1]!); corpo = corpo.slice(0, tr.index).trim(); continue; }
    const vol = /[,;]?\s*volume\s*(\d+(?:[.,]\d+)?)\s*%?\s*$/i.exec(corpo);
    if (vol) { volume = Math.min(1, parseFloat(vol[1]!.replace(',', '.')) / 100); corpo = corpo.slice(0, vol.index).trim(); }
  }
  if (!corpo) { avisos.push(`Falta o nome do arquivo: "${frase}"`); return {}; }
  if (tipo === 'musica' && /^(parar|para|fim|silencio)$/.test(semAcento(corpo))) return { nova: { tipo: 'audio', arquivo: '', papel: 'musica', parar: true, ...(trilha ? { trilha } : {}) } };
  if (tipo === 'audio' || tipo === 'voz') {
    const ultima = anteriores[anteriores.length - 1];
    if (ultima?.tipo === 'fala' && !ultima.audio) { ultima.audio = corpo; return { anexada: true }; }
    return { nova: { tipo: 'audio', arquivo: corpo, papel: 'voz', ...(volume !== undefined ? { volume } : {}), ...(trilha ? { trilha } : {}) } };
  }
  return { nova: { tipo: 'audio', arquivo: corpo, papel: tipo === 'musica' ? 'musica' : 'efeito', ...(volume !== undefined ? { volume } : {}), ...(trilha ? { trilha } : {}) } };
}

// ---------------------------------------------------------------- simultaneidade
// "Enquanto Professor diz "Oi", Aluno dança."  ·  "Aluno dança enquanto Professor diz "Oi"."
// "Ao mesmo tempo, Erika acena."  ·  "Enquanto isso, Dario pula."  ·  "Ao mesmo tempo:" abre um bloco (cada frase seguinte do parágrafo roda junto com a primeira).
// A ação marcada começa junto com a anterior; a próxima ação sequencial espera a mais longa terminar.

const mascarar = (f: string) => f.replace(/"[^"]*"|\$[^$]*\$/g, (m) => ' '.repeat(m.length));
const juntar = (acoes: Acao[]): Acao[] => acoes.map((a): Acao => ({ ...a, junto: true }));

interface EstadoBloco { aberto: boolean; primeira: boolean }

function interpretarComSimultaneidade(frase: string, avisos: string[], presentes: Set<ActorId>, papeis: Papeis, bloco: EstadoBloco): Acao[] {
  const base = (f: string) => interpretarFrase(f.trim(), avisos, presentes, papeis);
  const m = mascarar(semAcento(frase));

  const marcador = /^(ao mesmo tempo|simultaneamente|enquanto isso)\s*([,:])?\s*/.exec(m);
  if (marcador) {
    const resto = frase.slice(marcador[0].length).trim();
    if (marcador[2] === ':') { // "Ao mesmo tempo: A. B. C." — a primeira abre o grupo e as outras do parágrafo rodam junto com ela
      bloco.aberto = true; bloco.primeira = true;
      return resto ? interpretarComSimultaneidade(resto, avisos, presentes, papeis, bloco) : [];
    }
    return juntar(base(resto));
  }
  if (/^enquanto\s/.test(m)) {
    const virgula = m.indexOf(',');
    if (virgula < 0) { avisos.push(`"Enquanto" precisa de vírgula entre as duas ações: "${frase}"`); return []; }
    const a = base(frase.slice('enquanto'.length, virgula));
    return [...a, ...juntar(base(frase.slice(virgula + 1)))];
  }
  const meio = /\senquanto\s/.exec(m);
  if (meio) {
    const a = base(frase.slice(0, meio.index));
    return [...a, ...juntar(base(frase.slice(meio.index + meio[0].length)))];
  }
  const acoes = base(frase);
  if (bloco.aberto) {
    if (bloco.primeira) { bloco.primeira = false; return acoes.map((a, i): Acao => (i === 0 ? a : { ...a, junto: true })); }
    return juntar(acoes);
  }
  return acoes;
}
/**
 * Converte o roteiro em parágrafos para ações.
 * Linhas "# Título" iniciam uma cena; o restante é dividido em frases, cada frase vira uma ou mais ações.
 */
export function parseRoteiro(textoOriginal: string): Roteiro {
  const avisos: string[] = [];
  // diagnósticos com posição: cada aviso gerado por uma frase fica com o intervalo dela no roteiro
  const diagnosticos: Diagnostico[] = [];
  const registrarAvisos = (de: number, origem: { ini: number; fim: number }, frase: string) => {
    for (const msg of avisos.slice(de)) diagnosticos.push(diagnosticoDe(msg, frase, origem.ini, origem.fim));
  };
  const cenas: Cena[] = [];
  let cena: Cena | undefined;
  let buffer: { txt: string; off: number }[] = [];
  const presentes = new Set<ActorId>();

  // Linha de papéis da aula: [papéis: professor=Erika, aluno=Dario]
  const papeis: Papeis = { ...PAPEIS_PADRAO };
  const texto = textoOriginal.replace(/^[ \t]*\[\s*pap[eé]is\s*:([^\]]*)\][ \t]*$/gim, (_inteiro, corpo: string) => {
    for (const par of corpo.split(',')) {
      const [papel, nome] = par.split('=').map((s) => semAcento(s.trim()));
      const ator = nome ? acharAtores(nome)[0] : undefined;
      if ((papel === 'professor' || papel === 'aluno') && ator) papeis[papel] = ator;
      else if (par.trim()) avisos.push(`Papel não entendido: "${par.trim()}"`);
    }
    return ' '.repeat(_inteiro.length);
  });

  const fecharBuffer = () => {
    if (!buffer.length) return;
    cena ??= { titulo: 'Cena 1', acoes: [], origens: [] };
    if (!cenas.includes(cena)) cenas.push(cena);
    const bloco: EstadoBloco = { aberto: false, primeira: false };
    // texto do parágrafo (linhas unidas por espaço) e, para cada caractere, a posição dele no roteiro original
    const unido = buffer.map((l) => l.txt).join(' ');
    const mapa: number[] = [];
    buffer.forEach((l, i) => { if (i > 0) mapa.push(l.off - 1); for (let k = 0; k < l.txt.length; k++) mapa.push(l.off + k); });
    for (const frase of dividirFrases(unido)) {
      const antes = avisos.length;
      const origem = { ini: mapa[frase.ini]!, fim: mapa[frase.fim - 1]! + 1 };
      const audio = interpretarAudio(frase.texto, cena.acoes, avisos);
      if (audio) {
        if (audio.nova) { cena.acoes.push(audio.nova); cena.origens.push(origem); }
        // a etiqueta [áudio: …] faz parte da frase da fala: mover/excluir a fala leva a etiqueta junto
        if (audio.anexada) { const ult = cena.origens[cena.origens.length - 1]; if (ult) ult.fim = origem.fim; }
        registrarAvisos(antes, origem, frase.texto);
        continue;
      }
      const acoes = interpretarComSimultaneidade(frase.texto, avisos, presentes, papeis, bloco);
      registrarAvisos(antes, origem, frase.texto);
      for (const a of acoes) if ('ator' in a && a.ator) { if (a.tipo === 'sair') presentes.delete(a.ator); else presentes.add(a.ator); }
      cena.acoes.push(...acoes);
      cena.origens.push(...acoes.map(() => origem));
    }
    buffer = [];
  };

  let cenarioGlobal: CenarioTipo | undefined;
  let formatoGlobal: FormatoProducao | undefined;
  let semLousaGlobal = false;
  let pos = 0;

  for (const linha of texto.split(/\r?\n/)) {
    const off = pos;
    pos += linha.length + (texto[pos + linha.length] === '\r' ? 2 : 1);
    const titulo = /^#\s+(.*)$/.exec(linha);
    if (titulo) {
      fecharBuffer();
      if (cena && cena.acoes.length === 0) {
        cena.titulo = titulo[1]!.trim();
        if (cenarioGlobal && !cena.cenario) cena.cenario = cenarioGlobal;
        if (formatoGlobal && !cena.formato) cena.formato = formatoGlobal;
        if (semLousaGlobal) cena.semLousa = true;
      } else {
        cena = {
          titulo: titulo[1]!.trim(),
          acoes: [],
          origens: [],
          cenario: cenarioGlobal,
          formato: formatoGlobal,
          semLousa: semLousaGlobal || undefined,
        };
        cenas.push(cena);
      }
    } else if (linha.trim()) {
      const tagCenario = /^\[\s*cen[aá]rio\s*:\s*(lousa|podcast|telejornal|jornal|not[ií]cias|debate|papo[_\s-]?livre|lounge|neutro)\s*\]$/i.exec(linha.trim());
      const tagFormato = /^\[\s*formato\s*:\s*(aula|podcast|telejornal|jornal|drops|not[ií]cias|debate|papo[_\s-]?livre|livre)\s*\]$/i.exec(linha.trim());
      const tagSemLousa = /^\[\s*(sem\s+lousa|sem\s+quadro)\s*\]$/i.exec(linha.trim());
      if (tagCenario) {
        const normC = semAcento(tagCenario[1]!.toLowerCase()).replace(/[\s-]/g, '_');
        const cTipo: CenarioTipo = (normC === 'noticias' || normC === 'jornal') ? 'telejornal'
          : (normC === 'papo_livre' || normC === 'papolivre' || normC === 'lounge') ? 'papo_livre'
          : (normC as CenarioTipo);
        cenarioGlobal = cTipo;
        if (cena) cena.cenario = cTipo;
        else {
          cena = { titulo: 'Cena 1', acoes: [], origens: [], cenario: cTipo, formato: formatoGlobal, semLousa: semLousaGlobal || undefined };
          cenas.push(cena);
        }
      } else if (tagFormato) {
        const normF = semAcento(tagFormato[1]!.toLowerCase()).replace(/[\s-]/g, '_');
        const fTipo: FormatoProducao = (normF === 'drops' || normF === 'jornal' || normF === 'noticias') ? 'telejornal'
          : (normF === 'papo_livre' || normF === 'papolivre') ? 'papo_livre'
          : (normF as FormatoProducao);
        formatoGlobal = fTipo;
        if (cena) cena.formato = fTipo;
        else {
          cena = { titulo: 'Cena 1', acoes: [], origens: [], cenario: cenarioGlobal, formato: fTipo, semLousa: semLousaGlobal || undefined };
          cenas.push(cena);
        }
      } else if (tagSemLousa) {
        semLousaGlobal = true;
        if (cena) cena.semLousa = true;
        else {
          cena = { titulo: 'Cena 1', acoes: [], origens: [], cenario: cenarioGlobal, formato: formatoGlobal, semLousa: true };
          cenas.push(cena);
        }
      } else {
        buffer.push({ txt: linha.trim(), off: off + (linha.length - linha.trimStart().length) });
      }
    } else {
      fecharBuffer();
    }
  }
  fecharBuffer();
  return { cenas, avisos, diagnosticos, papeis };
}






