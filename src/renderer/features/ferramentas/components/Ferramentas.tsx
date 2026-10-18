import { ATORES } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { escolherEInserirImagem } from '@renderer/features/imagens';
import { Icones, type NomeIcone } from '@renderer/components/Icones';

interface Ferramenta { id: string; icone: NomeIcone; dica: string; acao?: () => void; desativado?: boolean }

/** Barra lateral de ferramentas: cada botão acrescenta uma frase pronta ao roteiro, para o personagem selecionado. */
export function Ferramentas() {
  const selecionado = useEditor((s) => s.selecionado);
  // cada botão insere a frase no ponto do roteiro onde está o cursor (ou no fim, se ele nunca foi posicionado)
  const inserir = useEditor((s) => s.inserirNoCursor);
  const nome = selecionado ? ATORES[selecionado]!.nome : 'Professor';
  const lado = selecionado && ['betason', 'dario', 'laura', 'artur'].includes(selecionado) ? 'direita' : 'esquerda';

  const lista: Ferramenta[] = [
    { id: 'sel', icone: 'selecionar', dica: 'Selecionar ator no palco (V)' },
    { id: 'ent', icone: 'ator', dica: `${nome} entra`, acao: () => inserir(`${nome} entra pela ${lado} andando.`) },
    { id: 'fala', icone: 'fala', dica: 'Balão de fala', acao: () => inserir(`${nome} diz "Digite a fala aqui".`) },
    { id: 'txt', icone: 'texto', dica: 'Escrever texto no quadro', acao: () => inserir(`${nome} escreve "Título" no quadro.`) },
    { id: 'fx', icone: 'formula', dica: 'Escrever fórmula (LaTeX)', acao: () => inserir(`${nome} escreve $x^2 + 2x + 1$ no quadro.`) },
    { id: 'graf', icone: 'grafico', dica: 'Gráfico de função no quadro', acao: () => inserir(`${nome} desenha o gráfico de y = x^2 no quadro.`) },
    { id: 'img', icone: 'imagem', dica: 'Imagem (PNG, JPG, WebP) na lousa: escolhe o arquivo e insere no roteiro', acao: () => void escolherEInserirImagem() },
    { id: 'ap', icone: 'apagar', dica: 'Apagar o quadro', acao: () => inserir('Apaga o quadro.') },
    { id: 'pausa', icone: 'pausa', dica: 'Pausa de 1 segundo', acao: () => inserir('Espera 1 segundos.') },
    { id: 'nota', icone: 'nota', dica: 'Nota de produção', acao: () => inserir('[nota: lembrete para a gravação]') },
    { id: 'c1', icone: 'closeLousa', dica: 'Close na lousa: só o conteúdo, personagens somem', acao: () => inserir('[close na lousa]') },
    { id: 'c2', icone: 'closeRosto', dica: `Close no rosto de ${nome}`, acao: () => inserir(`[close em ${nome}]`) },
    { id: 'c3', icone: 'planoAberto', dica: 'Plano aberto: volta ao palco todo', acao: () => inserir('[plano aberto]') },
  ];

  return (
    <nav className="ferramentas">
      {lista.map((f) => (
        <button key={f.id} className={f.id === 'sel' ? 'on' : ''} title={f.dica} disabled={f.desativado} onClick={f.acao}>{Icones[f.icone]}</button>
      ))}
    </nav>
  );
}

