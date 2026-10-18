import { MODELOS } from '@shared/domain';
import { FORMATOS } from '@shared/constants/video';
import type { GrupoMenu } from '@renderer/components/BarraMenu';
import { desfazer, refazer, useEditor } from '@renderer/store/editor-store';
import { ROTEIRO_EXEMPLO } from '@renderer/features/roteiro/services/exemplo';
import { limparPacotesSalvos, lerPacote } from '@renderer/features/pacotes-sprites/services/pacotes';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';
import { gerarSrt, ATORES } from '@shared/domain';
import { abrirProjeto, montarProjeto } from '@renderer/features/projeto/services/projeto';
import { escolherEInserirImagem } from '@renderer/features/imagens/services/inserir';
import { useExportar } from '@renderer/features/exportacao/hooks/useExportar';
import { baixarArquivo, plataforma } from '../services/plataforma';

/** Menus do editor (Arquivo, Exportar, Exibir, Ajuda). Cada item chama a plataforma ou muda o store. */
export function useMenus(): GrupoMenu[] {
  const formato = useEditor((s) => s.formato);
  const roteiro = useEditor((s) => s.roteiro);
  const set = useEditor((s) => s.set);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const { exportar, exportarTodos } = useExportar();
  const { timeline } = useRoteiroDerivado();
  const dim = FORMATOS[formato];

  const abrirRoteiro = async () => {
    const r = await plataforma.abrirRoteiro();
    if (r) { setRoteiro(r.texto); set({ t: 0, mensagem: `Aberto: ${r.nome}` }); }
  };
  const salvarRoteiro = async () => {
    const caminho = await plataforma.salvarRoteiro(roteiro, 'roteiro.stk.txt');
    if (caminho) set({ mensagem: `Roteiro salvo: ${caminho}` });
  };
  const importarPacote = async () => {
    const escolhido = await plataforma.abrirPacoteSprites();
    if (!escolhido) return;
    try {
      const pacote = lerPacote(escolhido.dados);
      const fichaCompleta = Object.values(pacote.relatorio.resumo).some((r) => r.poses.length >= 3);
      set({ importacao: { pacote, substituir: fichaCompleta, nome: escolhido.nome } });
    } catch (e) { set({ mensagem: `Não consegui ler o zip: ${(e as Error).message}` }); }
  };
  const salvarProjeto = async () => {
    set({ mensagem: 'Montando o projeto…' });
    const { zip, sprites, audios } = await montarProjeto();
    set({ mensagem: `${await plataforma.salvarPacoteSprites(zip, 'projeto-stickboard.zip')} (${sprites} sprites, ${audios} áudios)` });
  };
  const abrirProjetoZip = async () => {
    const escolhido = await plataforma.abrirPacoteSprites();
    if (!escolhido) return;
    try {
      const r = await abrirProjeto(escolhido.dados);
      set({ mensagem: `Projeto aberto: ${r.personagens} personagem(ns), ${r.sprites} sprites, ${r.audios} áudio(s).` });
    } catch (e) { set({ mensagem: `Não consegui abrir o projeto: ${(e as Error).message}` }); }
  };
  const carregarModelo = (texto: string, nome: string) => { setRoteiro(texto); set({ t: 0, mensagem: `Modelo “${nome}” carregado. Troque o que está entre {chaves}.` }); };

  return [
    { nome: 'Arquivo', itens: [
      { rotulo: 'Novo roteiro em branco', acao: () => { setRoteiro('[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n'); set({ t: 0 }); } },
      ...MODELOS.map((m) => ({ rotulo: `Novo a partir do modelo: ${m.area} — ${m.nome}`, acao: () => carregarModelo(m.roteiro, m.nome) })),
      { separador: true, rotulo: '' },
      { rotulo: 'Abrir roteiro…', atalho: 'Ctrl+O', acao: abrirRoteiro },
      { rotulo: 'Salvar roteiro…', atalho: 'Ctrl+S', acao: salvarRoteiro },
      { rotulo: 'Salvar projeto completo (.zip)…', acao: salvarProjeto },
      { rotulo: 'Abrir projeto (.zip)…', acao: abrirProjetoZip },
      { rotulo: 'Carregar exemplo', acao: () => { setRoteiro(ROTEIRO_EXEMPLO); set({ t: 0 }); } },
      { rotulo: 'Gerar / melhorar roteiro com IA…', acao: () => set({ iaAberta: true }) },
      { separador: true, rotulo: '' },
      { rotulo: 'Novo personagem…', acao: () => set({ fichaPersonagem: {} }) },
      { rotulo: 'Editar / exportar sprites dos personagens…', acao: () => set({ editorPersonagem: useEditor.getState().selecionado ?? 'cringefather' }) },
      { rotulo: 'Inserir imagem na lousa (PNG, JPG, WebP)…', acao: () => void escolherEInserirImagem() },
      { rotulo: 'Importar áudio (narração, música, efeito)…', acao: () => set({ aba: 'audio' }) },
      { rotulo: 'Importar pacote de sprites (.zip)…', acao: importarPacote },
      { rotulo: 'Remover pacotes importados', acao: async () => { await limparPacotesSalvos(); set({ mensagem: 'Pacotes removidos. Recarregue o app para voltar aos sprites originais.' }); } },
    ] },
    { nome: 'Editar', itens: [
      { rotulo: 'Desfazer', atalho: 'Ctrl+Z', acao: () => { if (desfazer()) set({ mensagem: 'Desfeito.' }); } },
      { rotulo: 'Refazer', atalho: 'Ctrl+Y', acao: () => { if (refazer()) set({ mensagem: 'Refeito.' }); } },
    ] },
    { nome: 'Exportar', itens: [
      { rotulo: `Vídeo MP4 (${dim.nome})`, acao: () => void exportar() },
      { rotulo: 'Vídeo MP4 nos dois formatos (16:9 e 9:16)', acao: () => void exportarTodos() },
      { rotulo: 'Legendas das falas (.srt)', acao: async () => { const c = await plataforma.salvarRoteiro(gerarSrt(timeline, (id) => ATORES[id]?.nome ?? id), 'legendas.srt'); if (c) set({ mensagem: `Legendas salvas: ${c}` }); } },
      { rotulo: 'Quadro atual (PNG)', acao: () => document.querySelector<HTMLCanvasElement>('.area-palco canvas')?.toBlob((b) => b && baixarArquivo(b, 'quadro.png')) },
    ] },
    { nome: 'Exibir', itens: [
      { rotulo: 'Formato 16:9 (YouTube)', acao: () => set({ formato: '16:9' }) },
      { rotulo: 'Formato 9:16 (Shorts)', acao: () => set({ formato: '9:16' }) },
      { separador: true, rotulo: '' },
      { rotulo: 'Aproximar linha do tempo', acao: () => set({ zoom: Math.min(200, useEditor.getState().zoom * 1.3) }) },
      { rotulo: 'Afastar linha do tempo', acao: () => set({ zoom: Math.max(25, useEditor.getState().zoom / 1.3) }) },
    ] },
    { nome: 'Ajuda', itens: [
      { rotulo: 'Manual de uso', atalho: 'F1', acao: () => set({ manualAberto: true }) },
      { rotulo: 'Sintaxe do roteiro e modelos', acao: () => set({ aba: 'aula' }) },
    ] },
  ];
}







