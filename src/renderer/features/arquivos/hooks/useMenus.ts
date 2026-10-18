import { MODELOS } from '@shared/domain';
import { FORMATOS } from '@shared/constants/video';
import type { GrupoMenu } from '@renderer/components/BarraMenu';
import { useEditor } from '@renderer/store/editor-store';
import { ROTEIRO_EXEMPLO } from '@renderer/features/roteiro/services/exemplo';
import { limparPacotesSalvos, lerPacote } from '@renderer/features/pacotes-sprites/services/pacotes';
import { useExportar } from '@renderer/features/exportacao/hooks/useExportar';
import { baixarArquivo, plataforma } from '../services/plataforma';

/** Menus do editor (Arquivo, Exportar, Exibir, Ajuda). Cada item chama a plataforma ou muda o store. */
export function useMenus(): GrupoMenu[] {
  const formato = useEditor((s) => s.formato);
  const roteiro = useEditor((s) => s.roteiro);
  const set = useEditor((s) => s.set);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const { exportar } = useExportar();
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
  const carregarModelo = (texto: string, nome: string) => { setRoteiro(texto); set({ t: 0, mensagem: `Modelo “${nome}” carregado. Troque o que está entre {chaves}.` }); };

  return [
    { nome: 'Arquivo', itens: [
      { rotulo: 'Novo roteiro em branco', acao: () => { setRoteiro('[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n'); set({ t: 0 }); } },
      ...MODELOS.map((m) => ({ rotulo: `Novo a partir do modelo: ${m.area} — ${m.nome}`, acao: () => carregarModelo(m.roteiro, m.nome) })),
      { separador: true, rotulo: '' },
      { rotulo: 'Abrir roteiro…', atalho: 'Ctrl+O', acao: abrirRoteiro },
      { rotulo: 'Salvar roteiro…', atalho: 'Ctrl+S', acao: salvarRoteiro },
      { rotulo: 'Carregar exemplo', acao: () => { setRoteiro(ROTEIRO_EXEMPLO); set({ t: 0 }); } },
      { separador: true, rotulo: '' },
      { rotulo: 'Novo personagem…', acao: () => set({ fichaPersonagem: {} }) },
      { rotulo: 'Editar / exportar sprites dos personagens…', acao: () => set({ editorPersonagem: useEditor.getState().selecionado ?? 'cringefather' }) },
      { rotulo: 'Importar pacote de sprites (.zip)…', acao: importarPacote },
      { rotulo: 'Remover pacotes importados', acao: async () => { await limparPacotesSalvos(); set({ mensagem: 'Pacotes removidos. Recarregue o app para voltar aos sprites originais.' }); } },
    ] },
    { nome: 'Exportar', itens: [
      { rotulo: `Vídeo MP4 (${dim.nome})`, acao: exportar },
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



