import { useEffect, useRef } from 'react';
import { infoDaImagem, listarImagens } from '@shared/domain';
import { imagemDoQuadro } from '@renderer/features/cena';
import { useEditor } from '@renderer/store/editor-store';
import { excluirImagem, importarImagem, TIPOS_IMAGEM } from '../services/armazenamento';
import { inserirImagemNoRoteiro } from '../services/inserir';

function Miniatura({ nome, versao }: { nome: string; versao: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, img = imagemDoQuadro(nome), ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!img) return;
    const k = Math.min(c.width / img.width, c.height / img.height), w = img.width * k, h = img.height * k;
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  }, [nome, versao]);
  return <canvas ref={ref} width={96} height={72} className="mini-imagem" />;
}

/** Aba "Imagens": importa PNG/JPG/WebP e insere no roteiro (no ponto do cursor) a frase que mostra a imagem na lousa. */
export function ImagensPanel() {
  const set = useEditor((s) => s.set);
  const versao = useEditor((s) => s.versaoImagens);
  const novaVersao = useEditor((s) => s.novaVersaoImagens);
  const entrada = useRef<HTMLInputElement>(null);
  const lista = listarImagens();

  const receber = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    const fila = Array.from(arquivos), falhas: string[] = [];
    set({ mensagem: 'Lendo imagens…' });
    for (const f of fila) { try { await importarImagem(f); } catch { falhas.push(f.name); } }
    novaVersao();
    set({ mensagem: falhas.length ? `Não consegui ler: ${falhas.join(', ')} (use PNG, JPG ou WebP).` : `${fila.length - falhas.length} imagem(ns) na biblioteca. Use “Inserir no roteiro”.` });
  };

  return (
    <div className="propriedades">
      <h4>Imagens na lousa</h4>
      <p className="dica">Importe PNG, JPG ou WebP. Clique no roteiro onde a imagem deve aparecer e use <b>Inserir no roteiro</b>: ela entra na lousa junto com o texto e as equações, com um efeito de entrada. Para trocar o efeito, selecione o bloco dela na linha do tempo; para excluir, apague a frase ou use o botão Excluir do bloco.</p>
      <input ref={entrada} type="file" accept={TIPOS_IMAGEM} multiple hidden onChange={(e) => { void receber(e.target.files); e.target.value = ''; }} />
      <button className="botao-novo-personagem" onClick={() => entrada.current?.click()}>＋ Importar imagem…</button>
      {lista.length === 0 && <p className="dica">Nenhuma imagem ainda.</p>}
      {lista.map((i) => (
        <div key={i.nome} className="item-imagem">
          <Miniatura nome={i.nome} versao={versao} />
          <div className="dados">
            <b title={i.nome}>{i.nome}</b>
            <small>{infoDaImagem(i.nome)!.w}×{infoDaImagem(i.nome)!.h}</small>
            <div className="acoes-ficha">
              <button onClick={() => inserirImagemNoRoteiro(i)}>Inserir no roteiro</button>
              <button className="perigo-leve" onClick={() => { void excluirImagem(i.nome).then(novaVersao); set({ mensagem: `“${i.nome}” excluída da biblioteca. Frases do roteiro que a usam vão mostrar um aviso.` }); }}>Excluir</button>
            </div>
          </div>
        </div>
      ))}
      <h4>No roteiro</h4>
      <dl className="cheat">
        <dt>Professor mostra a imagem ciclo.png no quadro.</dt><dd>entra com “surgir”</dd>
        <dt>… no canto direito pequena com efeito deslizar da direita</dt><dd>posição, tamanho e efeito</dd>
        <dt>… e sai com efeito zoom por 6 segundos.</dt><dd>some sozinha depois de 6 s</dd>
        <dt>Professor tira a imagem ciclo.png com efeito surgir.</dt><dd>retira só essa imagem</dd>
      </dl>
    </div>
  );
}
