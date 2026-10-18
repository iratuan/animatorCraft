import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Icones = {
  selecionar: <svg {...base}><path d="M5 3l14 8-6 2 4 7-3 1-4-7-5 4z" /></svg>,
  ator: <svg {...base}><circle cx="12" cy="5" r="2.5" /><path d="M12 8v7M12 10l-5 3M12 10l5 3M12 15l-4 6M12 15l4 6" /></svg>,
  fala: <svg {...base}><path d="M4 5h16v10H12l-5 4v-4H4z" /></svg>,
  texto: <svg {...base}><path d="M5 6h14M12 6v13M9 19h6" /></svg>,
  formula: <svg {...base}><path d="M17 4H8l5 8-5 8h9" /></svg>,
  grafico: <svg {...base}><path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7" /></svg>,
  imagem: <svg {...base}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M3 17l5-5 4 4 3-3 6 6" /></svg>,
  apagar: <svg {...base}><path d="M4 16l8-10 8 8-5 6H9zM9 20h11" /></svg>,
  pausa: <svg {...base}><path d="M9 5v14M15 5v14" /></svg>,
  nota: <svg {...base}><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" /></svg>,
  closeLousa: <svg {...base}><rect x="4" y="5" width="16" height="11" rx="1" /><path d="M8 9h8M8 12h5M2 21h20" /></svg>,
  closeRosto: <svg {...base}><circle cx="12" cy="11" r="7" /><circle cx="9.5" cy="10" r="1" /><circle cx="14.5" cy="10" r="1" /><path d="M9.5 14c1.5 1.2 3.5 1.2 5 0" /></svg>,
  planoAberto: <svg {...base}><path d="M3 9V4h5M16 4h5v5M21 15v5h-5M8 20H3v-5" /><circle cx="12" cy="12" r="2.5" /></svg>,
  play: <svg {...base} fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>,
  pause: <svg {...base} fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>,
  stop: <svg {...base} fill="currentColor"><path d="M5 5h14v14H5z" /></svg>,
  inicio: <svg {...base} fill="currentColor"><path d="M5 4h2v16H5zM9 12l10-8v16z" /></svg>,
  loop: <svg {...base}><path d="M4 12a5 5 0 015-5h9l-3-3M20 12a5 5 0 01-5 5H6l3 3" /></svg>,
};

export type NomeIcone = keyof typeof Icones;

