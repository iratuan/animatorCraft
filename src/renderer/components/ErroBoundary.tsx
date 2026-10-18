import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Último recurso: se algo quebrar ao desenhar a tela, mostra o erro e deixa recarregar, em vez de uma janela em branco. */
export class ErroBoundary extends Component<{ children: ReactNode }, { erro: Error | null }> {
  state = { erro: null as Error | null };

  static getDerivedStateFromError(erro: Error) { return { erro }; }

  componentDidCatch(erro: Error, info: ErrorInfo) { console.error('Erro na interface:', erro, info.componentStack); }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;
    return (
      <div role="alert" style={{ padding: 32, color: '#eee', background: '#1e1e1e', height: '100vh', fontFamily: 'sans-serif' }}>
        <h2>Algo deu errado.</h2>
        <p>Seu roteiro fica guardado automaticamente. Recarregue para continuar.</p>
        <pre style={{ whiteSpace: 'pre-wrap', opacity: 0.7 }}>{erro.message}</pre>
        <button onClick={() => location.reload()}>Recarregar</button>
      </div>
    );
  }
}
