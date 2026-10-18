import type { ReactNode } from 'react';

export function Painel({ titulo, children, acoes, className = '' }: { titulo: ReactNode; children: ReactNode; acoes?: ReactNode; className?: string }) {
  return (
    <section className={`painel ${className}`}>
      <header><span>{titulo}</span><div>{acoes}</div></header>
      <div className="corpo">{children}</div>
    </section>
  );
}
