import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';
import { useExportar } from '@renderer/features/exportacao/hooks/useExportar';
import { Icones } from '@renderer/components/Icones';
import { fmtTempo } from '../services/tempo';

export function Transporte() {
  const t = useEditor((s) => s.t);
  const tocando = useEditor((s) => s.tocando);
  const repetir = useEditor((s) => s.repetir);
  const zoom = useEditor((s) => s.zoom);
  const set = useEditor((s) => s.set);
  const alternar = useEditor((s) => s.alternarReproducao);
  const { timeline } = useRoteiroDerivado();
  const { exportando, exportar, podeExportar } = useExportar();

  return (
    <div className="transporte">
      <button title="Início" onClick={() => set({ t: 0, tocando: false })}>{Icones.inicio}</button>
      <button className="play" title="Reproduzir / pausar (Espaço)" onClick={() => alternar(timeline.duracao)}>{tocando ? Icones.pause : Icones.play}</button>
      <button title="Parar" onClick={() => set({ tocando: false, t: 0 })}>{Icones.stop}</button>
      <button className={repetir ? 'on' : ''} title="Repetir" onClick={() => set({ repetir: !repetir })}>{Icones.loop}</button>
      <span className="tempo">{fmtTempo(t)} / {fmtTempo(timeline.duracao)}</span>
      <div className="espaco" />
      <label className="zoom">Zoom <input type="range" min={25} max={200} value={zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} /></label>
      <button className="exportar" onClick={exportar} disabled={exportando !== null || !podeExportar}>
        {exportando === null ? 'Exportar MP4' : `Exportando ${Math.round(exportando * 100)}%`}
      </button>
    </div>
  );
}
