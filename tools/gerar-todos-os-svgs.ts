/**
 * Script de Geração em Lote de SVGs para o Sistema Stickman
 * Gera os arquivos físicos em assets/svg/ e o catálogo manifesto.json
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ATORES, type ActorId } from '../src/shared/domain/characters';
import type { ExpressaoId, PoseId } from '../src/shared/domain/poses';
import {
  gerarSvgCabeca,
  gerarSvgCompleto,
  gerarSvgBancadaPodcast,
  gerarSvgMicrofoneBoom,
  gerarSvgFoneOuvido,
  gerarSvgCaneca,
  gerarSvgCenarioCompletoPodcast,
  gerarSvgBancadaTelejornal,
  gerarSvgPainelNoticias,
  gerarSvgTarjaTicker,
  gerarSvgCenarioCompletoTelejornal,
  gerarSvgMesaDebate,
  gerarSvgCronometroDebate,
  gerarSvgMicrofoneMesa,
  gerarSvgCenarioCompletoDebate,
  gerarSvgPoltronaLounge,
  gerarSvgMesinhaCentro,
  gerarSvgCenarioCompletoPapoLivre,
  gerarSvgLousaDidatica,
  gerarSvgMesaProfessor,
  gerarSvgCenarioCompletoClassroom,
} from '../src/shared/domain/personagem-svg';

const RAIZ_PROJETO = path.resolve(__dirname, '..');
const BASE_SVG_DIR = path.join(RAIZ_PROJETO, 'assets', 'svg');

const PERSONAGENS: ActorId[] = [
  'cringefather',
  'betason',
  'erika',
  'dario',
  'laura',
  'elizendra',
  'artur',
  'carol',
  'veia',
  'veio',
  'paraiba',
  'mingau',
];

const EXPRESSOES_CANONICAS: ExpressaoId[] = [
  'neutra',
  'feliz',
  'triste',
  'brava',
  'surpresa',
  'confusa',
  'sarcastica',
  'assustada',
  'empolgada',
  'entediada',
];

const POSES_BASE: PoseId[] = [
  'parado',
  'apresentar',
  'gesticular',
  'apontar',
  'pensar',
  'andar',
  'correr',
  'pular',
  'cair',
  'sentar',
  'acenar',
  'bracos_cruzados',
  'maos_na_cintura',
  'danca_funky',
  'danca_atual',
  'danca_ballet',
  'danca_descoordenada',
  'danca_hippie',
];

interface FormatoConfig {
  dir: string;
  poses: { nome: string; pose: PoseId; expressao: ExpressaoId }[];
}

const FORMATOS_CONFIG: Record<string, FormatoConfig> = {
  podcast: {
    dir: 'podcast',
    poses: [
      { nome: 'sentado_falando', pose: 'apresentar', expressao: 'empolgada' },
      { nome: 'sentado_ouvindo', pose: 'sentar', expressao: 'neutra' },
      { nome: 'sentado_gesticulando', pose: 'gesticular', expressao: 'feliz' },
      { nome: 'sentado_rindo', pose: 'rindo', expressao: 'feliz' },
      { nome: 'sentado_surpreso', pose: 'surpreso', expressao: 'surpresa' },
    ],
  },
  news: {
    dir: 'news',
    poses: [
      { nome: 'apresentando', pose: 'apresentar', expressao: 'neutra' },
      { nome: 'olhando_painel', pose: 'apontar', expressao: 'confusa' },
      { nome: 'apontando_grafico', pose: 'apontar', expressao: 'empolgada' },
      { nome: 'serio', pose: 'bracos_cruzados', expressao: 'brava' },
      { nome: 'encerrando', pose: 'acenar', expressao: 'feliz' },
    ],
  },
  debate: {
    dir: 'debate',
    poses: [
      { nome: 'discursando', pose: 'gesticular', expressao: 'empolgada' },
      { nome: 'escutando', pose: 'bracos_cruzados', expressao: 'confusa' },
      { nome: 'concordando', pose: 'sentar', expressao: 'feliz' },
      { nome: 'discordando', pose: 'bravo', expressao: 'brava' },
      { nome: 'pedindo_fala', pose: 'apontar', expressao: 'surpresa' },
      { nome: 'mediando', pose: 'apresentar', expressao: 'neutra' },
    ],
  },
  'free-talk': {
    dir: 'free-talk',
    poses: [
      { nome: 'relaxado_falando', pose: 'gesticular', expressao: 'feliz' },
      { nome: 'rindo_livre', pose: 'rindo', expressao: 'feliz' },
      { nome: 'contando_historia', pose: 'apresentar', expressao: 'empolgada' },
      { nome: 'curioso', pose: 'pensar', expressao: 'confusa' },
    ],
  },
  classroom: {
    dir: 'classroom',
    poses: [
      { nome: 'explicando_lousa', pose: 'apresentar', expressao: 'feliz' },
      { nome: 'apontando_lousa', pose: 'apontar', expressao: 'empolgada' },
      { nome: 'escrevendo_lousa', pose: 'escrever', expressao: 'neutra' },
      { nome: 'atento_aluno', pose: 'sentar', expressao: 'neutra' },
      { nome: 'duvida_aluno', pose: 'pensar', expressao: 'confusa' },
    ],
  },
};

interface ItemCatalogo {
  id: string;
  personagem?: ActorId;
  categoria: 'base' | 'expressao' | 'pose' | 'formato' | 'cenario' | 'prop';
  formato?: string;
  arquivo: string;
  caminhoRelativo: string;
  descricao: string;
}

function salvarArquivo(caminhoAbsoluto: string, conteudo: string) {
  const pasta = path.dirname(caminhoAbsoluto);
  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta, { recursive: true });
  }
  fs.writeFileSync(caminhoAbsoluto, conteudo.trim() + '\n', 'utf-8');
}

async function executar() {
  console.log('🚀 Iniciando Geração Completa de SVGs para o Universo Stickman...');
  const catalogo: ItemCatalogo[] = [];
  let totalSvgs = 0;

  // 1. GERAR SVGS DOS PERSONAGENS
  for (const pId of PERSONAGENS) {
    const nome = ATORES[pId]?.nome ?? pId;
    console.log(`👤 Gerando recursos para o personagem: ${nome} (${pId})...`);

    // A. Base
    const dirBase = path.join(BASE_SVG_DIR, 'characters', pId, 'base');
    const svgCabeca = gerarSvgCabeca(pId, { expressao: 'neutra' });
    const arqCabeca = path.join(dirBase, 'cabeca.svg');
    salvarArquivo(arqCabeca, svgCabeca);
    catalogo.push({
      id: `${pId}-base-cabeca`,
      personagem: pId,
      categoria: 'base',
      arquivo: 'cabeca.svg',
      caminhoRelativo: `characters/${pId}/base/cabeca.svg`,
      descricao: `Cabeça/busto de referência de ${nome}`,
    });
    totalSvgs++;

    const svgCorpo = gerarSvgCompleto(pId, { pose: 'parado', expressao: 'neutra' });
    const arqCorpo = path.join(dirBase, 'corpo_inteiro.svg');
    salvarArquivo(arqCorpo, svgCorpo);
    catalogo.push({
      id: `${pId}-base-corpo`,
      personagem: pId,
      categoria: 'base',
      arquivo: 'corpo_inteiro.svg',
      caminhoRelativo: `characters/${pId}/base/corpo_inteiro.svg`,
      descricao: `Corpo inteiro em pose de referência de ${nome}`,
    });
    totalSvgs++;

    // B. Expressões Faciais
    const dirExp = path.join(BASE_SVG_DIR, 'characters', pId, 'expressions');
    for (const exp of EXPRESSOES_CANONICAS) {
      const svgExp = gerarSvgCabeca(pId, { expressao: exp });
      const arqExp = path.join(dirExp, `${exp}.svg`);
      salvarArquivo(arqExp, svgExp);
      catalogo.push({
        id: `${pId}-exp-${exp}`,
        personagem: pId,
        categoria: 'expressao',
        arquivo: `${exp}.svg`,
        caminhoRelativo: `characters/${pId}/expressions/${exp}.svg`,
        descricao: `Expressão ${exp} de ${nome}`,
      });
      totalSvgs++;
    }

    // C. Poses Corporais
    const dirPoses = path.join(BASE_SVG_DIR, 'characters', pId, 'poses');
    for (const pose of POSES_BASE) {
      const svgPose = gerarSvgCompleto(pId, { pose, expressao: 'neutra' });
      const arqPose = path.join(dirPoses, `${pose}.svg`);
      salvarArquivo(arqPose, svgPose);
      catalogo.push({
        id: `${pId}-pose-${pose}`,
        personagem: pId,
        categoria: 'pose',
        arquivo: `${pose}.svg`,
        caminhoRelativo: `characters/${pId}/poses/${pose}.svg`,
        descricao: `Pose corporal ${pose} de ${nome}`,
      });
      totalSvgs++;
    }

    // D. Formatos de Produção (podcast, news, debate, free-talk, classroom)
    for (const [fChave, fCfg] of Object.entries(FORMATOS_CONFIG)) {
      const dirFormato = path.join(BASE_SVG_DIR, 'characters', pId, 'formats', fCfg.dir);
      for (const itemPose of fCfg.poses) {
        const svgFormato = gerarSvgCompleto(pId, {
          pose: itemPose.pose,
          expressao: itemPose.expressao,
        });
        const arqFormato = path.join(dirFormato, `${itemPose.nome}.svg`);
        salvarArquivo(arqFormato, svgFormato);
        catalogo.push({
          id: `${pId}-${fChave}-${itemPose.nome}`,
          personagem: pId,
          categoria: 'formato',
          formato: fChave,
          arquivo: `${itemPose.nome}.svg`,
          caminhoRelativo: `characters/${pId}/formats/${fCfg.dir}/${itemPose.nome}.svg`,
          descricao: `Personagem ${nome} no formato ${fChave} (${itemPose.nome})`,
        });
        totalSvgs++;
      }
    }
  }

  // 2. GERAR SVGS DE CENÁRIOS E PROPS DE CENA
  console.log('🎬 Gerando cenários e objetos de cena...');

  // PODCAST
  const dirCenPod = path.join(BASE_SVG_DIR, 'scenes', 'podcast');
  salvarArquivo(path.join(dirCenPod, 'cenario_completo.svg'), gerarSvgCenarioCompletoPodcast());
  salvarArquivo(path.join(dirCenPod, 'bancada.svg'), gerarSvgBancadaPodcast());
  salvarArquivo(path.join(dirCenPod, 'microfone_boom.svg'), gerarSvgMicrofoneBoom());
  salvarArquivo(path.join(dirCenPod, 'fone_ouvido.svg'), gerarSvgFoneOuvido());
  salvarArquivo(path.join(dirCenPod, 'caneca.svg'), gerarSvgCaneca());
  catalogo.push(
    { id: 'scene-podcast-full', categoria: 'cenario', formato: 'podcast', arquivo: 'cenario_completo.svg', caminhoRelativo: 'scenes/podcast/cenario_completo.svg', descricao: 'Cenário completo de estúdio de Podcast' },
    { id: 'prop-podcast-bancada', categoria: 'prop', formato: 'podcast', arquivo: 'bancada.svg', caminhoRelativo: 'scenes/podcast/bancada.svg', descricao: 'Bancada acústica de Podcast' },
    { id: 'prop-podcast-mic', categoria: 'prop', formato: 'podcast', arquivo: 'microfone_boom.svg', caminhoRelativo: 'scenes/podcast/microfone_boom.svg', descricao: 'Microfone boom articulado de estúdio' },
    { id: 'prop-podcast-fone', categoria: 'prop', formato: 'podcast', arquivo: 'fone_ouvido.svg', caminhoRelativo: 'scenes/podcast/fone_ouvido.svg', descricao: 'Fones de ouvido acolchoados' },
    { id: 'prop-podcast-caneca', categoria: 'prop', formato: 'podcast', arquivo: 'caneca.svg', caminhoRelativo: 'scenes/podcast/caneca.svg', descricao: 'Caneca de café de Podcast' },
  );
  totalSvgs += 5;

  // TELEJORNAL / DROPS
  const dirCenNews = path.join(BASE_SVG_DIR, 'scenes', 'news');
  salvarArquivo(path.join(dirCenNews, 'cenario_completo.svg'), gerarSvgCenarioCompletoTelejornal());
  salvarArquivo(path.join(dirCenNews, 'bancada_ancora.svg'), gerarSvgBancadaTelejornal());
  salvarArquivo(path.join(dirCenNews, 'painel_noticias.svg'), gerarSvgPainelNoticias());
  salvarArquivo(path.join(dirCenNews, 'tarja_ticker.svg'), gerarSvgTarjaTicker());
  catalogo.push(
    { id: 'scene-news-full', categoria: 'cenario', formato: 'news', arquivo: 'cenario_completo.svg', caminhoRelativo: 'scenes/news/cenario_completo.svg', descricao: 'Cenário completo de estúdio de Telejornal com videowall e tarja' },
    { id: 'prop-news-bancada', categoria: 'prop', formato: 'news', arquivo: 'bancada_ancora.svg', caminhoRelativo: 'scenes/news/bancada_ancora.svg', descricao: 'Bancada curva de âncora de telejornal com tablet e pautas' },
    { id: 'prop-news-painel', categoria: 'prop', formato: 'news', arquivo: 'painel_noticias.svg', caminhoRelativo: 'scenes/news/painel_noticias.svg', descricao: 'Painel / videowall de notícias e gráficos da semana' },
    { id: 'prop-news-ticker', categoria: 'prop', formato: 'news', arquivo: 'tarja_ticker.svg', caminhoRelativo: 'scenes/news/tarja_ticker.svg', descricao: 'Tarja e ticker de notícias ao vivo' },
  );
  totalSvgs += 4;

  // DEBATE
  const dirCenDeb = path.join(BASE_SVG_DIR, 'scenes', 'debate');
  salvarArquivo(path.join(dirCenDeb, 'cenario_completo.svg'), gerarSvgCenarioCompletoDebate());
  salvarArquivo(path.join(dirCenDeb, 'mesa_debate.svg'), gerarSvgMesaDebate());
  salvarArquivo(path.join(dirCenDeb, 'cronometro.svg'), gerarSvgCronometroDebate());
  salvarArquivo(path.join(dirCenDeb, 'microfone_mesa.svg'), gerarSvgMicrofoneMesa());
  catalogo.push(
    { id: 'scene-debate-full', categoria: 'cenario', formato: 'debate', arquivo: 'cenario_completo.svg', caminhoRelativo: 'scenes/debate/cenario_completo.svg', descricao: 'Cenário completo de auditório de Debate' },
    { id: 'prop-debate-mesa', categoria: 'prop', formato: 'debate', arquivo: 'mesa_debate.svg', caminhoRelativo: 'scenes/debate/mesa_debate.svg', descricao: 'Mesa trapezoidal ampla de debate com microfones e placa de mediação' },
    { id: 'prop-debate-cronometro', categoria: 'prop', formato: 'debate', arquivo: 'cronometro.svg', caminhoRelativo: 'scenes/debate/cronometro.svg', descricao: 'Display de cronômetro oficial com luzes de aviso' },
    { id: 'prop-debate-mic', categoria: 'prop', formato: 'debate', arquivo: 'microfone_mesa.svg', caminhoRelativo: 'scenes/debate/microfone_mesa.svg', descricao: 'Microfone de mesa gooseneck articulável' },
  );
  totalSvgs += 4;

  // PAPO LIVRE
  const dirCenFree = path.join(BASE_SVG_DIR, 'scenes', 'free-talk');
  salvarArquivo(path.join(dirCenFree, 'cenario_completo.svg'), gerarSvgCenarioCompletoPapoLivre());
  salvarArquivo(path.join(dirCenFree, 'poltrona_lounge.svg'), gerarSvgPoltronaLounge());
  salvarArquivo(path.join(dirCenFree, 'mesinha_centro.svg'), gerarSvgMesinhaCentro());
  catalogo.push(
    { id: 'scene-free-full', categoria: 'cenario', formato: 'free-talk', arquivo: 'cenario_completo.svg', caminhoRelativo: 'scenes/free-talk/cenario_completo.svg', descricao: 'Cenário lounge confortável de Papo Livre' },
    { id: 'prop-free-poltrona', categoria: 'prop', formato: 'free-talk', arquivo: 'poltrona_lounge.svg', caminhoRelativo: 'scenes/free-talk/poltrona_lounge.svg', descricao: 'Poltrona confortável de lounge' },
    { id: 'prop-free-mesinha', categoria: 'prop', formato: 'free-talk', arquivo: 'mesinha_centro.svg', caminhoRelativo: 'scenes/free-talk/mesinha_centro.svg', descricao: 'Mesinha de centro com suculenta e café' },
  );
  totalSvgs += 3;

  // QUADRO DE AULA
  const dirCenClass = path.join(BASE_SVG_DIR, 'scenes', 'classroom');
  salvarArquivo(path.join(dirCenClass, 'cenario_completo.svg'), gerarSvgCenarioCompletoClassroom());
  salvarArquivo(path.join(dirCenClass, 'lousa_didatica.svg'), gerarSvgLousaDidatica());
  salvarArquivo(path.join(dirCenClass, 'mesa_professor.svg'), gerarSvgMesaProfessor());
  catalogo.push(
    { id: 'scene-class-full', categoria: 'cenario', formato: 'classroom', arquivo: 'cenario_completo.svg', caminhoRelativo: 'scenes/classroom/cenario_completo.svg', descricao: 'Cenário didático de Sala de Aula com lousa de física' },
    { id: 'prop-class-lousa', categoria: 'prop', formato: 'classroom', arquivo: 'lousa_didatica.svg', caminhoRelativo: 'scenes/classroom/lousa_didatica.svg', descricao: 'Lousa didática com moldura de alumínio e equações' },
    { id: 'prop-class-mesa', categoria: 'prop', formato: 'classroom', arquivo: 'mesa_professor.svg', caminhoRelativo: 'scenes/classroom/mesa_professor.svg', descricao: 'Mesa do professor com notebook e livros' },
  );
  totalSvgs += 3;

  // 3. SALVAR O MANIFESTO COMPLETO
  const manifesto = {
    versao: '1.0.0',
    dataGeracao: new Date().toISOString(),
    totalArquivosGerados: totalSvgs,
    elencoPersonagens: PERSONAGENS.map((id) => ({
      id,
      nome: ATORES[id]?.nome ?? id,
      descricao: ATORES[id]?.descricao ?? '',
    })),
    formatos: Object.keys(FORMATOS_CONFIG),
    cenarios: ['podcast', 'news', 'debate', 'free-talk', 'classroom'],
    matrizCobertura: PERSONAGENS.map((id) => ({
      personagem: id,
      nome: ATORES[id]?.nome ?? id,
      formatos: {
        podcast: FORMATOS_CONFIG.podcast.poses.map((p) => p.nome),
        telejornal: FORMATOS_CONFIG.news.poses.map((p) => p.nome),
        debate: FORMATOS_CONFIG.debate.poses.map((p) => p.nome),
        papoLivre: FORMATOS_CONFIG['free-talk'].poses.map((p) => p.nome),
        quadroAula: FORMATOS_CONFIG.classroom.poses.map((p) => p.nome),
      },
    })),
    itens: catalogo,
  };

  const arqManifesto = path.join(BASE_SVG_DIR, 'manifesto.json');
  salvarArquivo(arqManifesto, JSON.stringify(manifesto, null, 2));

  console.log(`\n🎉 Concluído com sucesso!`);
  console.log(`📊 Total de arquivos SVG gerados: ${totalSvgs}`);
  console.log(`📋 Manifesto gravado em: ${path.relative(RAIZ_PROJETO, arqManifesto)}`);
}

executar().catch((err) => {
  console.error('❌ Erro na geração dos SVGs:', err);
  process.exit(1);
});
