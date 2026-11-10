import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MODELOS, ROTEIRO_EXEMPLO } from '@shared/domain';
import { FORMATOS } from '@shared/constants/video';
import type { GrupoMenu } from '@renderer/components/BarraMenu';
import { desfazer, refazer, useEditor, limparHistorico } from '@renderer/store/editor-store';
import { useRoteiroEstatico } from '@renderer/features/roteiro';
import { gerarSrt, estadoEm, ATORES, gerarRoteiroGravacaoMarkdown } from '@shared/domain';
import { renderizarCena } from '@renderer/features/cena';
import { abrirProjeto, montarProjeto, pedirTexto } from '@renderer/features/projeto';
import { escolherEInserirImagem } from '@renderer/features/imagens';
import { useExportar } from '@renderer/features/exportacao';
import { baixarArquivo, plataforma } from '@renderer/features/sistema';

/** Menus do editor (Arquivo, Exportar, Exibir, Ajuda). Cada item chama a plataforma ou muda o store. */
export function useMenus(): GrupoMenu[] {
  const formato = useEditor((s) => s.formato);
  const roteiro = useEditor((s) => s.roteiro);
  const set = useEditor((s) => s.set);
  const navegar = useNavigate();
  const spritesOk = useEditor((s) => s.spritesOk);
  const acaoInicial = useEditor((s) => s.acaoInicial);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const { exportar, exportarTodos } = useExportar();
  const { timeline } = useRoteiroEstatico();
  const dim = FORMATOS[formato];

  const abrirRoteiro = async () => {
    const r = await plataforma.abrirRoteiro();
    if (r) { setRoteiro(r.texto); set({ t: 0, mensagem: `Aberto: ${r.nome}` }); }
  };
  const salvarRoteiro = async () => {
    const caminho = await plataforma.salvarRoteiro(roteiro, 'roteiro.stk.txt');
    if (caminho) set({ mensagem: `Roteiro salvo: ${caminho}` });
  };
  const novoProjetoComAviso = () => {
    const { modificado, novoProjeto } = useEditor.getState();
    if (modificado && typeof window !== 'undefined') {
      const confirmou = window.confirm('O projeto atual tem alterações não salvas. Deseja iniciar um novo projeto e descartar as alterações?');
      if (!confirmou) return;
    }
    novoProjeto();
    set({ mensagem: 'Novo projeto iniciado.' });
  };

  const salvarProjetoComo = async () => {
    const { nomeProjeto, marcarSalvo } = useEditor.getState();
    const nomeAtual = nomeProjeto || 'meu-projeto';
    // pergunta dentro do app: o window.prompt não é suportado no Electron
    const nomeDigitado = await pedirTexto('Nome com que deseja salvar o projeto (.zip)', nomeAtual);
    if (nomeDigitado === null) return;
    const nomeLimpo = nomeDigitado.trim() || nomeAtual;
    set({ nomeProjeto: nomeLimpo });
    set({ mensagem: 'Montando o projeto…' });
    const { zip, audios } = await montarProjeto();
    const nomeSugerido = `${nomeLimpo.replace(/[\s/\\?%*:|"<>]+/g, '_')}.zip`;
    const resultado = await plataforma.salvarZip(zip, nomeSugerido);
    marcarSalvo(null, nomeLimpo);
    set({ mensagem: `${resultado} (${audios} áudios)` });
  };

  const salvarProjeto = async () => {
    return salvarProjetoComo();
  };

  const pedirFecharProjeto = () => {
    const { modificado, fecharProjeto } = useEditor.getState();
    if (!modificado) {
      fecharProjeto();
      limparHistorico();
      set({ mensagem: 'Projeto fechado.' });
      navegar('/');
      return;
    }
    set({ confirmarFecharProjetoAberto: true });
  };

  const abrirProjetoZip = async () => {
    const { modificado } = useEditor.getState();
    if (modificado && typeof window !== 'undefined') {
      const confirmou = window.confirm('O projeto atual possui alterações não salvas. Deseja descartá-las e abrir outro projeto?');
      if (!confirmou) return;
    }
    const escolhido = await plataforma.abrirZip();
    if (!escolhido) return;
    try {
      const r = await abrirProjeto(escolhido.dados);
      const nomeBase = escolhido.nome.replace(/\.zip$/i, '');
      useEditor.getState().marcarSalvo(null, nomeBase);
      set({ mensagem: `Projeto aberto: ${r.personagens} personagem(ns), ${r.sprites} sprites, ${r.audios} áudio(s).` });
    } catch (e) { set({ mensagem: `Não consegui abrir o projeto: ${(e as Error).message}` }); }
  };
  // pedidos da tela inicial que precisam do elenco carregado (abrir projeto, criar personagem)
  useEffect(() => {
    if (!acaoInicial || !spritesOk) return;
    set({ acaoInicial: null });
    if (acaoInicial === 'abrir-projeto') void abrirProjetoZip();
    else if (acaoInicial === 'novo-personagem') set({ fichaPersonagem: {} });
  }, [acaoInicial, spritesOk]);
  // o quadro sai na resolução do vídeo (1920×1080 ou 1080×1920), não no tamanho que o palco tem na janela
  const quadroAtualPng = () => {
    const c = document.createElement('canvas'); c.width = dim.w; c.height = dim.h;
    renderizarCena(c.getContext('2d')!, estadoEm(timeline, useEditor.getState().t), dim.w, dim.h);
    c.toBlob((b) => b && baixarArquivo(b, 'quadro.png'));
  };
  const carregarModelo = (texto: string, nome: string) => { setRoteiro(texto); set({ t: 0, mensagem: `Modelo “${nome}” carregado. Troque o que está entre {chaves}.` }); };

  return [
    { nome: 'Arquivo', itens: [
      {
        rotulo: 'Projeto',
        icone: 'novo',
        itens: [
          { rotulo: 'Novo projeto em branco', icone: 'novo', barra: { grupo: 0, rotulo: 'Novo' }, acao: novoProjetoComAviso },
          {
            rotulo: 'Modelos de aula',
            icone: 'modelo',
            itens: MODELOS.map((m) => ({
              rotulo: `[${m.formato.toUpperCase()}] ${m.area} — ${m.nome}`,
              icone: 'modelo' as const,
              acao: () => carregarModelo(m.roteiro, m.nome),
            })),
          },
          { separador: true, rotulo: '' },
          { rotulo: 'Abrir projeto (.zip)…', icone: 'abrir', barra: { grupo: 0, rotulo: 'Abrir' }, atalho: 'Ctrl+O', acao: abrirProjetoZip },
          { rotulo: 'Salvar projeto (.zip)', icone: 'salvar', barra: { grupo: 0, rotulo: 'Salvar' }, atalho: 'Ctrl+S', acao: salvarProjeto },
          { rotulo: 'Salvar projeto como (.zip)…', icone: 'salvar', acao: salvarProjetoComo },
          { separador: true, rotulo: '' },
          { rotulo: 'Fechar projeto', icone: 'fechar', barra: { grupo: 0, rotulo: 'Fechar' }, atalho: 'Ctrl+W', acao: pedirFecharProjeto },
        ],
      },
      {
        rotulo: 'Roteiro & Mídia',
        icone: 'abrir',
        itens: [
          { rotulo: 'Importar roteiro de texto…', icone: 'abrir', acao: abrirRoteiro },
          { rotulo: 'Exportar roteiro de texto…', icone: 'salvar', acao: salvarRoteiro },
          { rotulo: 'Carregar exemplo', icone: 'exemplo', acao: () => { setRoteiro(ROTEIRO_EXEMPLO); set({ t: 0 }); } },
          { separador: true, rotulo: '' },
          { rotulo: 'Inserir imagem na lousa (PNG, JPG, WebP)…', icone: 'imagem', acao: () => void escolherEInserirImagem() },
          { rotulo: 'Importar áudio (narração, música, efeito)…', icone: 'audio', acao: () => set({ aba: 'audio' }) },
        ],
      },
      {
        rotulo: 'Personagens',
        icone: 'personagemNovo',
        itens: [
          { rotulo: 'Novo personagem…', icone: 'personagemNovo', barra: { grupo: 2, rotulo: 'Personagem' }, acao: () => set({ fichaPersonagem: {} }) },
          { rotulo: 'Expressões e clipes do personagem…', icone: 'clipes', barra: { grupo: 2, rotulo: 'Clipes' }, acao: () => set({ editorAnimacao: { ator: useEditor.getState().selecionado ?? 'cringefather' } }) },
        ],
      },
      {
        rotulo: 'Ferramentas & IA',
        icone: 'ia',
        itens: [
          { rotulo: 'Editor de fórmulas e gráficos LaTeX…', icone: 'modelo', barra: { grupo: 3, rotulo: 'LaTeX e Gráficos' }, acao: () => set({ editorMatematicaAberto: true, abaMatematicaInicial: 'latex' }) },
          { rotulo: 'Prompt mestre para IA (copiar e colar)…', icone: 'ia', barra: { grupo: 3, rotulo: 'Prompt IA' }, acao: () => set({ promptMestreAberto: true }) },
          { rotulo: 'Gerar / melhorar roteiro com IA (direto no app)…', icone: 'ia', acao: () => set({ iaAberta: true }) },
        ],
      },
      { separador: true, rotulo: '' },
      { rotulo: 'Tela inicial', icone: 'inicio2', barra: { grupo: 0, rotulo: 'Início' }, acao: () => navegar('/') },
    ] },
    { nome: 'Editar', itens: [
      { rotulo: 'Desfazer', icone: 'desfazer', barra: { grupo: 1, rotulo: 'Desfazer' }, atalho: 'Ctrl+Z', acao: () => { if (desfazer()) set({ mensagem: 'Desfeito.' }); } },
      { rotulo: 'Refazer', icone: 'refazer', barra: { grupo: 1, rotulo: 'Refazer' }, atalho: 'Ctrl+Y', acao: () => { if (refazer()) set({ mensagem: 'Refeito.' }); } },
    ] },
    { nome: 'Exportar', itens: [
      { rotulo: `Vídeo MP4 (${dim.nome})`, icone: 'video', barra: { grupo: 4, rotulo: 'MP4' }, acao: () => void exportar() },
      { rotulo: 'Vídeo MP4 nos dois formatos (16:9 e 9:16)', icone: 'videoDois', acao: () => void exportarTodos() },
      { rotulo: 'Legendas das falas (.srt)', icone: 'legenda', barra: { grupo: 4, rotulo: 'Legendas' }, acao: async () => { const c = await plataforma.salvarRoteiro(gerarSrt(timeline, (id) => ATORES[id]?.nome ?? id), 'legendas.srt'); if (c) set({ mensagem: `Legendas salvas: ${c}` }); } },
      { rotulo: 'Roteiro de gravação para atores (.md)…', icone: 'modelo', barra: { grupo: 4, rotulo: 'Vozes' }, acao: async () => {
        const { nomeProjeto } = useEditor.getState();
        const conteudoMd = gerarRoteiroGravacaoMarkdown(timeline, nomeProjeto);
        const nomeSugerido = `roteiro_gravacao_${(nomeProjeto || 'projeto').replace(/[\s/\\?%*:|"<>]+/g, '_')}.md`;
        const c = await plataforma.salvarRoteiro(conteudoMd, nomeSugerido);
        if (c) set({ mensagem: `Roteiro de gravação salvo: ${c}` });
      } },
      { rotulo: 'Quadro atual (PNG)', icone: 'foto', barra: { grupo: 4, rotulo: 'PNG' }, acao: quadroAtualPng },
    ] },
    { nome: 'Exibir', itens: [
      { rotulo: 'Formato 16:9 (YouTube)', icone: 'formato', acao: () => set({ formato: '16:9' }) },
      { rotulo: 'Formato 9:16 (Shorts)', icone: 'formato', acao: () => set({ formato: '9:16' }) },
      { separador: true, rotulo: '' },
      { rotulo: 'Aproximar linha do tempo', icone: 'zoomMais', acao: () => set({ zoom: Math.min(200, useEditor.getState().zoom * 1.3) }) },
      { rotulo: 'Afastar linha do tempo', icone: 'zoomMenos', acao: () => set({ zoom: Math.max(25, useEditor.getState().zoom / 1.3) }) },
    ] },
    { nome: 'Ajuda', itens: [
      { rotulo: 'Manual de uso', icone: 'manual', barra: { grupo: 5, rotulo: 'Manual' }, atalho: 'F1', acao: () => set({ manualAberto: true }) },
      { rotulo: 'Prompt mestre para IA', icone: 'ia', acao: () => set({ promptMestreAberto: true }) },
      { rotulo: 'Sintaxe do roteiro e modelos', icone: 'modelo', acao: () => set({ aba: 'aula' }) },
      { rotulo: 'Sobre o StickBoard', icone: 'sobre', acao: () => set({ manualAberto: true, manualSecao: 'sobre' }) },
    ] },
  ];
}








