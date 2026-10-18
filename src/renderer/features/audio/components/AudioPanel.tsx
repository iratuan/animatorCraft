import { useRef, useState } from 'react';
import { infoDoAudio, listarAudios } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { excluirAudio, importarAudio } from '../services/armazenamento';
import { pararAudio, tocarAgenda } from '../services/mixer';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Aba "Áudio": importa narração, música e efeitos, e insere a etiqueta certa no roteiro. */
export function AudioPanel() {
  const set = useEditor((s) => s.set);
  const inserir = useEditor((s) => s.inserir);
  const versao = useEditor((s) => s.versaoAudio);
  const novaVersao = useEditor((s) => s.novaVersaoAudio);
  const entrada = useRef<HTMLInputElement>(null);
  const [tocando, setTocando] = useState<string | null>(null);
  const lista = listarAudios();
  void versao;

  const receber = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    const lista = Array.from(arquivos);
    set({ mensagem: 'Lendo áudio…' });
    const falhas: string[] = [];
    for (const f of lista) { try { await importarAudio(f); } catch { falhas.push(f.name); } }
    novaVersao();
    set({ mensagem: falhas.length ? `Não consegui ler: ${falhas.join(', ')} (use WAV, MP3, OGG ou M4A).` : `${lista.length - falhas.length} áudio(s) importado(s).` });
  };
  const ouvir = async (nome: string) => {
    if (tocando === nome) { pararAudio(); setTocando(null); return; }
    const d = infoDoAudio(nome)!.duracao;
    await tocarAgenda([{ arquivo: nome, inicio: 0, fim: d, papel: 'voz', volume: 1 }], 0);
    setTocando(nome);
    setTimeout(() => setTocando((n) => (n === nome ? null : n)), d * 1000 + 100);
  };

  return (
    <div className="propriedades">
      <h4>Áudio da aula</h4>
      <p className="dica">Importe a narração gravada (um arquivo por fala), músicas e efeitos. A fala passa a durar o tempo do áudio, a boca do personagem acompanha o volume da voz e tudo entra no MP4.</p>
      <input ref={entrada} type="file" accept="audio/*,.wav,.mp3,.ogg,.m4a,.aac" multiple hidden onChange={(e) => { void receber(e.target.files); e.target.value = ''; }} />
      <button className="botao-novo-personagem" onClick={() => entrada.current?.click()}>＋ Importar áudio…</button>
      {lista.length === 0 && <p className="dica">Nenhum áudio ainda.</p>}
      {lista.map((a) => (
        <div key={a.nome} className="item-audio">
          <div className="topo"><b title={a.nome}>{a.nome}</b><span>{fmt(a.duracao)}</span></div>
          <div className="acoes-ficha">
            <button onClick={() => void ouvir(a.nome)}>{tocando === a.nome ? '■ Parar' : '▶ Ouvir'}</button>
            <button title="Anexa à última fala do roteiro" onClick={() => { inserir(`[áudio: ${a.nome}]`); set({ mensagem: `Narração “${a.nome}” anexada à última fala.` }); }}>Narrar a última fala</button>
            <button onClick={() => { inserir(`[música: ${a.nome}, volume 25%]`); set({ mensagem: 'Música de fundo inserida.' }); }}>Música</button>
            <button onClick={() => { inserir(`[efeito: ${a.nome}]`); set({ mensagem: 'Efeito inserido.' }); }}>Efeito</button>
            <button className="perigo-leve" onClick={() => { void excluirAudio(a.nome).then(novaVersao); }}>Excluir</button>
          </div>
        </div>
      ))}
      <h4>No roteiro</h4>
      <dl className="cheat">
        <dt>Professor diz "Oi". [áudio: oi.wav]</dt><dd>narração da fala anterior</dd>
        <dt>[música: fundo.mp3, volume 25%]</dt><dd>música até <code>[música: parar]</code> ou o fim</dd>
        <dt>[efeito: palmas.wav]</dt><dd>efeito neste ponto</dd>
      </dl>
    </div>
  );
}

