import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroEstatico } from '@renderer/features/roteiro';
import { useExportar } from '@renderer/features/exportacao';
import { Icones } from '@renderer/components/Icones';
import { fmtTempo } from '../services/tempo';

export function Transporte() {
  const t = useEditor((s) => s.t);
  const tocando = useEditor((s) => s.tocando);
  const repetir = useEditor((s) => s.repetir);
  const zoom = useEditor((s) => s.zoom);
  const set = useEditor((s) => s.set);
  const alternar = useEditor((s) => s.alternarReproducao);
  const { timeline } = useRoteiroEstatico();
  const { exportando, exportar, podeExportar } = useExportar();

  return (
    <div className="transporte">
      <button title="Início" onClick={() => set({ t: 0, tocando: false })}>{Icones.inicio}</button>
      <button className="play" title="Reproduzir / pausar (Espaço)" onClick={() => alternar(timeline.duracao)}>{tocando ? Icones.pause : Icones.play}</button>
      <button title="Parar" onClick={() => set({ tocando: false, t: 0 })}>{Icones.stop}</button>
      <button className={repetir ? 'on' : ''} title="Repetir" onClick={() => set({ repetir: !repetir })}>{Icones.loop}</button>
      <span className="tempo">{fmtTempo(t)} / {fmtTempo(timeline.duracao)}</span>
      <div style={{ flex: 1 }} />
      <label className="zoom" title="Zoom da linha do tempo"><span className="zoom-rotulo">Zoom</span> <input type="range" min={25} max={200} value={zoom} aria-label="Zoom da linha do tempo" onChange={(e) => set({ zoom: Number(e.target.value) })} /></label>
      <button className="exportar" title="Exportar animação em vídeo MP4 (WebCodecs H.264/AAC)" onClick={() => void exportar()} disabled={exportando !== null || !podeExportar}>
        {exportando === null ? 'Exportar MP4' : `Exportando ${Math.round(exportando * 100)}%`}
      </button>
    </div>
  );
}

