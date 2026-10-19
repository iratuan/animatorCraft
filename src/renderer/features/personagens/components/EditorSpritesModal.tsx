import { useRef, useState } from 'react';
import { zipSync } from 'fflate';
import { ATORES, EXPRESSOES, ORDEM_ATORES, ROSTOS_ESPECIAIS, type ActorId, type ExpressaoId } from '@shared/domain';
import { listarSprites } from '@renderer/features/cena';
import { Miniatura } from '@renderer/components/Miniatura';
import { useEditor } from '@renderer/store/editor-store';
import { plataforma } from '@renderer/features/sistema';
import { aplicarPacote, lerPacote } from '../services/pacotes';
import { montarPacoteExportacao, nomeDoZip } from '../services/exportarSprites';

type Espaco = { tipo: 'pose' | 'rosto' | 'prop'; nome: string; rotulo: string };

const nomeValido = (n: string) => /^[a-z0-9]+(-[a-z0-9]+)*(_\d+)?$/.test(n);

/**
 * Editor de sprites de um personagem: mostra os espaços padrão (pose_parado, expressões, bocas, piscada) preenchidos ou vazios,
 * troca o PNG de qualquer espaço, cria poses/props novos e exporta o zip para editar fora do app.
 */
export function EditorSpritesModal() {
  const alvo = useEditor((s) => s.editorPersonagem);
  const versao = useEditor((s) => s.versaoBib);
  const set = useEditor((s) => s.set);
  useEditor((s) => s.versaoPersonagens); // redesenha quando a lista de personagens muda
  const novaVersao = useEditor((s) => s.novaVersaoBib);
  const entrada = useRef<HTMLInputElement>(null);
  const pendente = useRef<Espaco | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState<'pose' | 'prop'>('pose');
  if (!alvo) return null;

  const id: ActorId = alvo;
  const tem = listarSprites(id);
  const fechar = () => set({ editorPersonagem: null });
  const avisar = (mensagem: string) => set({ mensagem });

  const espacosRosto: Espaco[] = [
    ...EXPRESSOES.map((x) => ({ tipo: 'rosto' as const, nome: x, rotulo: x })),
    ...tem.rostos.filter((r) => !(EXPRESSOES as readonly string[]).includes(r) && !ROSTOS_ESPECIAIS.includes(r)).map((x) => ({ tipo: 'rosto' as const, nome: x, rotulo: `${x} (nova)` })),
    ...ROSTOS_ESPECIAIS.map((x) => ({ tipo: 'rosto' as const, nome: x, rotulo: x === 'olhos-fechados' ? 'piscada (olhos-fechados)' : `fala ${x}` })),
  ];
  // poses animadas (andar_1, andar_2…) aparecem quadro a quadro, para cada um poder ser editado
  const poses: Espaco[] = [...new Set(['parado', ...tem.poses])].flatMap((n) => (tem.quadros[n] ? Array.from({ length: tem.quadros[n]! }, (_, i) => ({ tipo: 'pose' as const, nome: `${n}_${i + 1}`, rotulo: `${n} ${i + 1}` })) : [{ tipo: 'pose' as const, nome: n, rotulo: n }]));
  const props: Espaco[] = tem.props.map((n) => ({ tipo: 'prop', nome: n, rotulo: n }));

  const trocar = (e: Espaco) => { pendente.current = e; entrada.current?.click(); };
  const receber = async (arquivo: File | undefined) => {
    const e = pendente.current;
    if (!arquivo || !e) return;
    try {
      // vira um pacote de um arquivo só e passa pelo mesmo caminho da importação (fundo branco, recorte, persistência)
      const zip = zipSync({ [`${id}/${e.tipo}_${e.nome}.png`]: new Uint8Array(await arquivo.arrayBuffer()) });
      const pacote = lerPacote(zip, { exigirParado: false });
      if (pacote.relatorio.erros.length) { avisar(`Não deu: ${pacote.relatorio.erros[0]}`); return; }
      const { falhas, persistido } = await aplicarPacote(pacote, false);
      novaVersao();
      avisar(falhas.length ? `Falhou: ${falhas[0]}` : `${e.tipo}_${e.nome} atualizado para ${ATORES[id]!.nome}.${persistido ? '' : ' Atenção: não consegui guardar no aparelho; ao fechar o app volta ao que era.'}`);
    } catch (erro) { avisar(`Não consegui ler a imagem: ${(erro as Error).message}`); }
  };

  const exportar = async (ids: ActorId[]) => {
    avisar('Montando o zip de sprites…');
    const { zip, total } = await montarPacoteExportacao(ids);
    if (!total) { avisar('Nada para exportar: esse personagem ainda não tem sprites.'); return; }
    avisar(await plataforma.salvarPacoteSprites(zip, nomeDoZip(ids)));
  };

  // abre o editor de imagem (camadas, pincel, seleção…) no sprite do espaço; o PNG achatado volta para o mesmo espaço
  const editar = (e: Espaco) => set({ editorImagem: { personagem: id, tipo: e.tipo, nome: e.nome } });
  const criarNoEditor = () => {
    const nome = novoNome.trim().toLowerCase().replace(/\s+/g, '-');
    if (!nomeValido(nome)) { avisar('Nome inválido: use minúsculas, números e hífen (ex.: bracos-cruzados, andar_1).'); return; }
    setNovoNome('');
    editar({ tipo: novoTipo, nome, rotulo: nome });
  };
  const criar = () => {
    const nome = novoNome.trim().toLowerCase().replace(/\s+/g, '-');
    if (!nomeValido(nome)) { avisar('Nome inválido: use minúsculas, números e hífen (ex.: bracos-cruzados, andar_1).'); return; }
    setNovoNome('');
    trocar({ tipo: novoTipo, nome, rotulo: nome });
  };

  // função comum (não componente): evita remontar todos os espaços a cada renderização do app (ex.: com a animação tocando)
  const celula = (e: Espaco) => {
    const baseDoNome = e.nome.replace(/_\d+$/, '');
    const existe = e.tipo === 'pose' ? tem.poses.includes(baseDoNome) : e.tipo === 'rosto' ? tem.rostos.includes(e.nome) : tem.props.includes(e.nome);
    return (
      <div key={`${e.tipo}-${e.nome}-${versao}`} className="espaco-caixa">
        <button className={`espaco ${existe ? '' : 'vazio'}`} data-espaco={`${e.tipo}_${e.nome}`} title={existe ? `Editar ${e.tipo}_${e.nome}.png no editor de imagem` : `Criar ${e.tipo}_${e.nome}.png no editor de imagem`} onClick={() => editar(e)}>
          {existe
            ? <Miniatura ator={id} etiqueta={e.tipo === 'pose' ? e.nome : undefined} expressao={e.tipo === 'rosto' ? (e.nome as ExpressaoId) : undefined} modo={e.tipo === 'rosto' ? 'rosto' : 'corpo'} tamanho={64} />
            : <span className="mais">+</span>}
          <span>{e.rotulo}</span>
        </button>
        <button className="espaco-png" title={`Enviar um PNG pronto para ${e.tipo}_${e.nome}`} aria-label={`Enviar PNG para ${e.tipo}_${e.nome}`} onClick={() => trocar(e)}>PNG</button>
      </div>
    );
  };

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal largo" role="dialog" aria-label="Editor de sprites do personagem" onClick={(ev) => ev.stopPropagation()}>
        <h3>Sprites de {ATORES[id]!.nome}</h3>
        <p className="dica">
          Clique em um espaço para editá-lo no editor de imagem integrado (camadas, pincel, borracha, seleção…); o botão PNG envia um arquivo pronto. Fundo transparente; nos rostos, só a cabeça com a pele do personagem. Para editar fora do app (Photoshop, Krita, Photopea…), exporte o zip,
          edite os PNGs mantendo os nomes e importe de volta em Arquivo ▸ Importar pacote.
        </p>
        <div className="seletor-personagem">
          {ORDEM_ATORES.map((a) => <button key={a} className={a === id ? 'on' : ''} onClick={() => set({ editorPersonagem: a })}>{ATORES[a]!.nome}</button>)}
        </div>

        <h4>Poses <small>pose_parado é obrigatório; pose_andar_1, _2… formam uma animação</small></h4>
        <div className="grade-espacos">{poses.map((e) => celula(e))}</div>
        <h4>Rostos <small>expressões, fala (a, e, o, m) e piscada</small></h4>
        <div className="grade-espacos">{espacosRosto.map((e) => celula(e))}</div>
        {props.length > 0 && (<><h4>Objetos</h4><div className="grade-espacos">{props.map((e) => celula(e))}</div></>)}

        <div className="novo-sprite">
          <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as 'pose' | 'prop')}><option value="pose">pose</option><option value="prop">objeto</option></select>
          <input placeholder="nome novo (ex.: bracos-cruzados, andar_3)" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criar()} />
          <button onClick={criarNoEditor} disabled={!novoNome.trim()}>Criar no editor</button>
          <button onClick={criar} disabled={!novoNome.trim()}>Criar a partir de um PNG…</button>
        </div>

        <input ref={entrada} type="file" accept="image/png,image/webp,image/jpeg" hidden onChange={(e) => { void receber(e.target.files?.[0]); e.target.value = ''; }} />
        <div className="modal-botoes">
          <button onClick={() => void exportar([id])}>Exportar {ATORES[id]!.nome} (.zip)</button>
          <button onClick={() => void exportar([...ORDEM_ATORES])}>Exportar todos (.zip)</button>
          <button className="primario" onClick={fechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}







