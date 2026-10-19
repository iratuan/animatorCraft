import { ATORES, ORDEM_ATORES, type ActorId } from './characters';
import { clipesPersonalizados } from './clipes';
import { expressoesDe } from './expressoes';
import { EFEITOS_IMAGEM, type InfoImagem } from './imagem';
import { DANCA_PADRAO, DURACAO_PADRAO_DANCA, EXPRESSOES, FRASE_POSE, NOME_POSE, POSES_DE_DANCA, type PoseId } from './poses';
import { ESTADOS, VERBOS_FALA } from './script/parser';
import { SEQUENCIAS } from './sequencias';
import type { InfoAudio } from './audio';

/**
 * PROMPT MESTRE: o texto que se entrega a qualquer IA (Claude, ChatGPT, Gemini, Llama...) para ela escrever um roteiro que o StickBoard
 * entende de primeira. Tudo o que a IA precisa saber mora aqui: o formato, cada frase aceita, o elenco, os sprites, clipes, imagens e áudios
 * da biblioteca do usuário. As listas saem do próprio código do app (parser, poses, personagens), então o prompt nunca fica desatualizado;
 * os testes conferem que todo exemplo escrito aqui é interpretado sem aviso.
 */

export interface AtorNaBiblioteca {
  id: ActorId;
  nome: string;
  apelidos: string[];
  idade: string;
  descricao: string;
  /** frase de dança padrão ("dança funky") */
  danca: string;
  /** expressões além das 10 padrão (criadas para o boneco ou sprites rosto_*) */
  expressoesExtras: string[];
  /** nomes de sprites de pose do personagem (usados em "faz a pose <nome>") */
  poses: string[];
  /** clipes criados para o personagem */
  clipes: { nome: string; duracao?: number }[];
}

export interface BibliotecaMestre {
  atores: AtorNaBiblioteca[];
  imagens: InfoImagem[];
  audios: InfoAudio[];
}

/** Sprites de pose que o personagem tem (o renderer sabe; o domínio não guarda pixels). */
export type SpritesDe = (id: ActorId) => string[];

/** Fotografia da biblioteca do usuário neste momento: elenco, sprites, expressões, clipes, imagens e áudios. */
export function coletarBiblioteca(spritesDe: SpritesDe, imagens: InfoImagem[] = [], audios: InfoAudio[] = [], somente?: ActorId[]): BibliotecaMestre {
  const ids = ORDEM_ATORES.filter((id) => ATORES[id] && (!somente?.length || somente.includes(id)));
  return {
    atores: ids.map((id) => {
      const a = ATORES[id]!;
      const danca = (DANCA_PADRAO[id] ?? a.dancaPadrao ?? 'danca_atual') as PoseId;
      return {
        id, nome: a.nome, apelidos: a.apelidos, idade: a.idade, descricao: a.descricao,
        danca: FRASE_POSE[danca] ?? 'dança',
        expressoesExtras: expressoesDe(id).filter((e) => !(EXPRESSOES as readonly string[]).includes(e)),
        poses: spritesDe(id).filter((p) => p !== 'parado').sort(),
        clipes: clipesPersonalizados(id).map((c) => ({ nome: c.id })).filter((c, i, l) => l.findIndex((x) => x.nome === c.nome) === i),
      };
    }),
    imagens: [...imagens],
    audios: [...audios],
  };
}

export type DuracaoAula = 'curta' | 'media' | 'longa';
export const DURACAO_AULA: Record<DuracaoAula, { rotulo: string; texto: string; segundos: number }> = {
  curta: { rotulo: 'Curta (~1 min)', texto: 'cerca de 1 minuto de vídeo (2 cenas)', segundos: 60 },
  media: { rotulo: 'Média (~3 min)', texto: 'cerca de 3 minutos de vídeo (4 a 5 cenas)', segundos: 180 },
  longa: { rotulo: 'Longa (~6 min)', texto: 'cerca de 6 minutos de vídeo (7 a 9 cenas)', segundos: 360 },
};

export interface OpcoesPromptMestre {
  /** 'novo' pede um roteiro do zero; 'melhorar' reescreve o `roteiroAtual` */
  modo?: 'novo' | 'melhorar';
  tema?: string;
  materia?: string;
  serie?: string;
  duracao?: DuracaoAula;
  professor?: ActorId;
  aluno?: ActorId;
  extras?: string;
  /** só estes personagens podem aparecer (vazio = todos da biblioteca) */
  personagens?: ActorId[];
  roteiroAtual?: string;
  instrucao?: string;
  /** omite a seção PEDIDO (o app a envia à parte, como mensagem do usuário) */
  semPedido?: boolean;
}

const SEM_ACENTO_PARA_ACENTO: Record<string, string> = { sarcastico: 'sarcástico' };
const listar = (xs: string[]) => xs.join(', ');
const lista = (xs: string[]) => (xs.length ? listar(xs) : 'nenhum');
const nomeDoId = (id: ActorId) => ATORES[id]?.nome ?? id;

/** Estados ("irritado", "feliz"...) que o app reconhece depois de uma fala ou sozinhos. */
export const ESTADOS_ACEITOS = (): string[] => Object.keys(ESTADOS).map((e) => SEM_ACENTO_PARA_ACENTO[e] ?? e);
export const VERBOS_DE_FALA = (): string[] => [...VERBOS_FALA];

/** As frases de pose que o app entende, com o nome amigável. */
function frasesDePose(): { frase: string; nome: string }[] {
  return (Object.entries(FRASE_POSE) as [PoseId, string][])
    .filter(([pose, frase]) => !POSES_DE_DANCA.includes(pose) && (!frase.startsWith('fica ') || pose === 'parado'))
    .map(([pose, frase]) => ({ frase, nome: NOME_POSE[pose] }));
}

function secaoElenco(b: BibliotecaMestre): string {
  return b.atores.map((a) => {
    const linhas = [`- **${a.nome}**${a.idade ? ` (${a.idade})` : ''} — chame de: ${listar(a.apelidos.map((x) => `"${x}"`))}. ${a.descricao || 'Sem descrição.'}`];
    linhas.push(`  - "${a.nome} dança." faz ${a.danca}. Expressões extras: ${lista(a.expressoesExtras)}. Poses de sprite: ${lista(a.poses)}. Clipes: ${lista(a.clipes.map((c) => c.nome))}.`);
    return linhas.join('\n');
  }).join('\n');
}

function secaoBiblioteca(b: BibliotecaMestre): string {
  const imagens = b.imagens.length
    ? b.imagens.map((i) => `  - ${i.nome} (${i.w}x${i.h}${i.w >= i.h ? ', horizontal' : ', vertical'})`).join('\n')
    : '  - (nenhuma imagem importada ainda)';
  const audios = b.audios.length
    ? b.audios.map((a) => `  - ${a.nome} (${a.duracao.toFixed(1).replace('.', ',')} s)`).join('\n')
    : '  - (nenhum áudio importado ainda)';
  return `IMAGENS que o usuário já importou (use SOMENTE estes nomes de arquivo):\n${imagens}\nÁUDIOS que o usuário já importou (use SOMENTE estes nomes):\n${audios}`;
}

/** Exemplo completo e curto. O teste confere que ele roda sem avisos para qualquer elenco que contenha os dois nomes. */
export function exemploDeRoteiro(professor: string, aluno: string, outro?: string): string {
  const extra = outro ? `\n${outro} entra pela direita andando. ${outro} diz "Eu sei a resposta!" empolgado. Ao mesmo tempo, ${aluno} dança por 3 segundos.` : '';
  return `[papéis: professor=${professor}, aluno=${aluno}]

# Abertura
Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Hoje vamos descobrir como funciona o quadrado da soma!" empolgado. Aluno diz "Quadrado de quê? Eu só vim pelo lanche!" confuso. Professor cruza os braços. Professor diz "Claro. Porque lanche é o que move a ciência." sarcástico.
[nota: gravar a fala do professor com voz impaciente]

# Na lousa
[close na lousa]
Professor escreve "Quadrado da soma" no quadro. Professor escreve $(a+b)^2 = a^2 + 2ab + b^2$ no quadro. Professor escreve "O termo do meio é 2ab!" no quadro.
[plano aberto]
Enquanto Professor aponta, Aluno fica surpreso. Aluno diz "Então não é só elevar cada um ao quadrado?" empolgado. Professor diz "Parabéns, você descobriu o óbvio." sarcástico.${extra}

# Resumo
Professor desenha o gráfico de y = x^2 de -3 a 3 no quadro. Espera 2 segundos. Professor apaga o quadro. Professor diz "Até a próxima!" feliz. Todos dançam por ${DURACAO_PADRAO_DANCA} segundos. Professor sai pela esquerda andando. Aluno sai pela direita andando.
`;
}

/** O texto do prompt mestre. Seção "PEDIDO" no fim: preenchida pelas opções, ou com um modelo para o usuário completar. */
export function gerarPromptMestre(b: BibliotecaMestre, o: OpcoesPromptMestre = {}): string {
  const elenco = b.atores.length ? b.atores : coletarBiblioteca(() => []).atores;
  const professor = o.professor && ATORES[o.professor] ? o.professor : (elenco[0]?.id ?? 'cringefather');
  const aluno = o.aluno && ATORES[o.aluno] ? o.aluno : (elenco[1]?.id ?? 'betason');
  const p = nomeDoId(professor), a = nomeDoId(aluno);
  const outro = elenco.find((x) => x.id !== professor && x.id !== aluno)?.nome;
  const poses = frasesDePose().map((x) => `"${x.frase}" (${x.nome})`);
  const dancas = POSES_DE_DANCA.map((d) => `"${FRASE_POSE[d]}"`);
  const efeitos = EFEITOS_IMAGEM.filter((e) => e !== 'nenhum').map((e) => e.replace('deslizar-', 'deslizar da ')).concat('sem efeito');
  const bibliotecaPronta = secaoBiblioteca({ ...b, atores: elenco });

  const pedido = o.modo === 'melhorar'
    ? `PEDIDO
Melhore o roteiro abaixo seguindo este pedido: ${o.instrucao?.trim() || 'acrescente reações, gestos e expressões dos personagens enquanto os outros falam (use "Enquanto..." e "Ao mesmo tempo,"), sem mudar o conteúdo da aula'}.
Devolva o roteiro COMPLETO, no mesmo formato, já corrigido.

ROTEIRO ATUAL
${o.roteiroAtual?.trim() || '<<COLE AQUI O ROTEIRO ATUAL>>'}`
    : `PEDIDO
- Assunto da aula: ${o.tema?.trim() || '<<ESCREVA AQUI O ASSUNTO, ex.: produtos notáveis (quadrado da soma)>>'}
- Matéria: ${o.materia?.trim() || 'Matemática'}. Público: ${o.serie?.trim() || '8º ano'}.
- Duração: ${DURACAO_AULA[o.duracao ?? 'curta'].texto}.
- Professor desta aula: ${p}. Aluno: ${a}.
- Personagens que podem aparecer: ${o.personagens?.length ? listar(o.personagens.map(nomeDoId)) : 'todos os da lista de PERSONAGENS, usando só os que fizerem sentido'}.${o.extras?.trim() ? `\n- Pedidos extras: ${o.extras.trim()}` : ''}`;

  return `# PROMPT MESTRE DO STICKBOARD

Você é roteirista do **StickBoard**, um programa que transforma texto em vídeo de quadro branco com personagens desenhados em linhas pretas sobre fundo branco (estilo caderno/“lineart”), para ensinar ciências, matemática e inglês a crianças e adolescentes, em português do Brasil, com humor leve e relaxado.

O programa NÃO entende texto livre: ele lê frases em um formato fixo, descrito abaixo, e transforma cada frase em uma animação. Frase fora do formato é ignorada e vira um aviso para o usuário. Por isso: **use somente as frases deste documento, exatamente como estão escritas**, trocando apenas os nomes, textos e números.

## 1. O QUE VOCÊ DEVE ENTREGAR
- Responda **somente com o roteiro**, dentro de **um único bloco de código** (\`\`\`), sem explicações antes ou depois.
- O roteiro é texto puro (não é JSON, não é markdown, não tem negrito nem listas).
- Escreva em português do Brasil, com acentos.

## 2. ESTRUTURA DO ARQUIVO
1. Primeira linha: \`[papéis: professor=NOME, aluno=NOME]\` — diz quem faz o Professor e quem faz o Aluno. Depois disso você pode escrever "Professor" e "Aluno" no lugar dos nomes.
2. Uma linha em branco.
3. Cada cena começa com uma linha \`# Título da cena\` (o quadro é apagado automaticamente entre cenas).
4. Em cada cena, um ou dois parágrafos de frases curtas. **Toda frase termina em ponto final** (ou ! ou ?). Parágrafos são separados por linha em branco.
5. Comandos de câmera, nota e áudio ficam entre colchetes, **cada um na sua própria linha** (ou logo após uma frase).
6. O texto entre aspas duplas ("...") NUNCA contém aspas dentro. Fórmulas ficam entre cifrões: \`$ ... $\`.

## 3. TODAS AS FRASES QUE O PROGRAMA ENTENDE
Troque NOME por um personagem da lista (ou por "Professor"/"Aluno"). **Uma ação por frase e um personagem por frase** (exceto nos casos de grupo da seção 4).

**Entrar e sair** (duram ~1,6 s; "correndo" ~0,9 s)
- \`NOME entra pela esquerda andando.\` · \`NOME entra correndo pela direita.\` · \`NOME entra pelo centro.\`
- \`NOME entra pela direita na posição 60%.\` (para onde caminha: 0% = borda esquerda, 100% = borda direita)
- \`NOME sai pela esquerda andando.\` · \`NOME sai correndo pela direita.\`

**Posição no palco**
- \`NOME fica na posição 30%.\` (aparece direto) · \`NOME anda para a posição 70%.\` (caminha até lá)

**Falar** (verbos: ${listar(VERBOS_DE_FALA())})
- \`NOME diz "texto falado" irritado.\` — o texto da fala vai entre aspas; um estado opcional vem DEPOIS do fecha-aspas.
- Cada fala fica em UMA frase, com o ponto depois do estado ou do fecha-aspas. Fala curta é melhor: 4 a 14 palavras (dura ~0,4 s por palavra, mínimo 1,4 s). Para falas longas, divida em várias frases.

**Estados e emoções** — sozinhos ("NOME fica confuso.") ou depois de uma fala (muda a cara e o corpo): ${listar(ESTADOS_ACEITOS())}.

**Expressões do rosto** — \`NOME faz cara de brava.\`  Expressões padrão de todos: ${listar(EXPRESSOES as unknown as string[])}. Algumas pessoas da lista têm expressões extras (veja PERSONAGENS). Use "cara de" + o nome exato da expressão.

**Gestos e poses** (cada uma dura ~0,9 s, depois o personagem volta a ficar parado)
- ${poses.join(' · ')}
- Formato: \`NOME pula.\` · \`NOME põe as mãos na cabeça.\` · \`NOME aponta.\`  (use a frase entre aspas acima, sem as aspas; "aponta" também funciona)
- \`NOME faz a pose NOME-DO-SPRITE por 3 segundos.\` — usa um sprite que o personagem tem (lista em PERSONAGENS). Sem "por N segundos" dura ~0,9 s.
- \`NOME faz o clipe NOME-DO-CLIPE por 5 segundos.\` — usa um clipe criado para o personagem (lista em PERSONAGENS). Sem "por", toca uma vez.

**Danças** (duram ${DURACAO_PADRAO_DANCA} s se não disser quanto)
- \`NOME dança.\` — cada personagem dança no seu estilo. \`NOME dança por 6 segundos.\`
- Estilos que você pode pedir: ${dancas.join(', ')} → \`NOME dança hippie por 5 segundos.\`

**Esperar** — \`Espera 2 segundos.\` (ou \`Espera 1,5 segundos.\`; máximo 600).

**Lousa (quadro)** — o conteúdo é revelado aos poucos, sem mão:
- Texto: \`NOME escreve "Teorema de Pitágoras" no quadro.\`
- Fórmula: \`NOME escreve $a^2 + b^2 = c^2$ no quadro.\` — LaTeX simples: ^ (potência), _ (índice), \\frac{a}{b}, \\sqrt{x}, \\cdot, \\times, \\div, \\pm, \\neq, \\leq, \\geq, \\approx, \\infty, \\pi, \\theta, \\alpha, \\beta, \\Delta, \\rightarrow, \\degree.
- Gráfico de função: \`NOME desenha o gráfico de y = x^2 - 2 no quadro.\` · com intervalo: \`... o gráfico de y = sen(x) de -6 a 6 no quadro.\` (funções: sen, cos, tan, raiz, abs, ln, log, exp; constantes pi e e; multiplicação pode ser implícita: 2x)
- Gráfico de barras: \`NOME desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3 no quadro.\`
- Gráfico de pizza: \`NOME desenha um gráfico de pizza: Sim=70, Não=30 no quadro.\`
- Apagar tudo: \`NOME apaga o quadro.\` (ou só \`Apaga o quadro.\`)
- **A lousa é pequena**: no máximo 4 linhas curtas (ou 1 gráfico + 1 linha) por cena. O texto da lousa deve ser curto (até ~40 caracteres por linha).

**Imagens na lousa** (somente arquivos da lista IMAGENS; sem imagem na lista, não use esta frase)
- \`NOME mostra a imagem ciclo.png no quadro.\`
- Opções (todas opcionais, nesta ordem): \`no canto esquerdo\` ou \`no canto direito\` · \`pequena\` / \`grande\` · \`com efeito EFEITO\` · \`e sai com efeito EFEITO\` · \`por 6 segundos\`.
  Ex.: \`NOME mostra a imagem ciclo.png no quadro no canto direito pequena com efeito deslizar da direita e sai com efeito zoom por 6 segundos.\`
- Efeitos: ${listar(efeitos)}. Nome com espaços vai entre aspas: \`a imagem "ciclo da água.png"\`.
- \`NOME tira a imagem ciclo.png com efeito surgir.\` retira só essa imagem.

**Câmera** (linha própria)
- \`[close na lousa]\` — mostra só a lousa (use enquanto explica) · \`[close no professor]\` · \`[close em NOME]\` — mostra só o rosto · \`[plano aberto]\` — volta ao palco inteiro (use para as reações).

**Notas de produção** — \`[nota: texto livre]\` não aparece no vídeo; serve para avisar o usuário (ex.: tom de voz, imagem que falta).

**Áudio** (somente arquivos da lista ÁUDIOS)
- \`NOME diz "Bem-vindos!". [áudio: abertura.wav]\` — a narração gravada toca e a boca acompanha a voz; a fala dura o tempo do áudio.
- \`[música: fundo.mp3, volume 25%]\` começa a música de fundo · \`[música: parar]\` · \`[efeito: palmas.wav]\` toca um efeito neste ponto.

## 4. AÇÕES AO MESMO TEMPO
Por padrão cada frase espera a anterior terminar. Para juntar:
- \`Enquanto ${p} diz "Atenção!", ${a} dança por 6 segundos.\` (a vírgula é obrigatória)
- \`${a} dança por 4 segundos enquanto ${outro ?? p} acena.\`
- \`Ao mesmo tempo, ${a} pula.\` (junto com a frase anterior)
- \`Ao mesmo tempo: ${p} diz "Um". ${a} diz "Dois".\` (bloco: tudo até o fim do parágrafo roda junto)
- Grupo: \`${p} e ${a} dançam juntos por 5 segundos.\` · \`${p} e ${a} entram juntos pela esquerda.\` · \`Todos dançam.\` (todos que já entraram em cena).
A próxima ação sequencial começa quando a mais longa do grupo termina.

## 5. REGRAS DE OURO (o que mais dá errado)
1. **Um personagem por frase.** Se aparecer o nome de dois personagens na mesma frase e a palavra "e", o programa faz os dois agirem. Para falar de outro personagem, coloque dentro das aspas: \`${p} diz "${a}, presta atenção!" bravo.\`
2. **Só os verbos da lista.** Palavras soltas como "entra", "chega", "sai", "apaga", "espera", "dança", "aponta", "escreve" são lidas como comando mesmo no meio de uma frase narrativa. Não escreva narração ("Então o professor, cansado, resolve…"): escreva apenas ações.
3. **Todo personagem precisa entrar antes de agir** ("NOME entra…") e pode sair no fim. Ninguém fala, escreve ou dança antes de entrar.
4. Frases curtas, com ponto final. Nada de reticências "…" no fim de frase fora das aspas.
5. Dentro das aspas pode ter qualquer palavra, mas **sem aspas duplas** e sem cifrão ($).
6. Números com vírgula ou ponto funcionam em durações ("1,5 segundos"). Percentuais de posição: 0 a 100.
7. Se precisar de algo que o programa não tem (imagem, áudio, objeto), **não invente nome de arquivo**: escreva \`[nota: falta imagem de TAL COISA]\` e continue.
8. Nunca invente personagem fora da lista PERSONAGENS.

## 6. ESTILO DOS ROTEIROS
- Humor: o professor é sarcástico e exagerado; o aluno é desastrado e engraçado; piadas curtas, nunca ofensivas.
- **Um conceito por cena**, com um exemplo do dia a dia. A cena de lousa explica (use [close na lousa]); depois [plano aberto] para as reações.
- Os personagens **reagem** (expressões, poses, danças, "Enquanto…") em vez de só falar.
- Termine com um **resumo curto no quadro**, uma despedida e uma dança ou saída dos personagens.
- Ritmo: ~0,4 s por palavra falada; entradas ~1,6 s; escrever na lousa ~0,13 s por caractere; gráfico 3,5 s. Calcule a duração para chegar perto do tempo pedido.
- Com crianças pequenas, frases mais simples; com adolescentes, humor mais ágil. Inglês: pode misturar frases em inglês dentro das aspas, com tradução na fala seguinte.

## 7. PERSONAGENS (a lista é da biblioteca do usuário neste momento)
Use o nome (ou um apelido) — ou os papéis "Professor"/"Aluno" definidos na primeira linha.
${secaoElenco({ ...b, atores: elenco })}

## 8. BIBLIOTECA
${bibliotecaPronta}

## 9. TRECHOS PRONTOS (podem ser copiados trocando o nome)
${SEQUENCIAS.filter((s) => !s.atores).map((s) => `- ${s.nome}: \`${s.roteiro.replaceAll('{A}', a)}\``).join('\n')}

## 10. EXEMPLO COMPLETO (siga este formato)
\`\`\`
${exemploDeRoteiro(p, a, outro).trimEnd()}
\`\`\`

## 11. CONFIRA ANTES DE RESPONDER
- [ ] A primeira linha é \`[papéis: professor=..., aluno=...]\` com nomes da lista?
- [ ] Todo personagem entra antes de agir? Toda frase termina com ponto?
- [ ] Cada frase usa um modelo da seção 3 (ou 4), com um só personagem?
- [ ] A lousa tem no máximo 4 linhas curtas por cena? Fórmulas entre $...$?
- [ ] Só usei imagens e áudios da lista da seção 8?
- [ ] Fechei todas as aspas e colchetes? Nenhuma fala tem aspas dentro?
- [ ] Respondi só com o roteiro, em um bloco de código?
${o.semPedido ? '' : `\n---\n${pedido}\n`}`;
}
