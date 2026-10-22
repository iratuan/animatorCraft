import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, limparHistorico } from '@renderer/store/editor-store';
import { salvarProjetoZip } from '../services/projeto';

export function ConfirmarFecharProjetoModal() {
  const aberto = useEditor((s) => s.confirmarFecharProjetoAberto);
  const nomeProjeto = useEditor((s) => s.nomeProjeto);
  const fecharProjeto = useEditor((s) => s.fecharProjeto);
  const set = useEditor((s) => s.set);
  const navegar = useNavigate();
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const aoPressionarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !salvando) {
        set({ confirmarFecharProjetoAberto: false });
      }
    };
    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [aberto, salvando, set]);

  if (!aberto) return null;

  const fecharSemSalvar = () => {
    fecharProjeto();
    limparHistorico();
    set({ confirmarFecharProjetoAberto: false, mensagem: 'Projeto fechado.' });
    navegar('/');
  };

  const salvarEFechar = async () => {
    try {
      setSalvando(true);
      set({ mensagem: 'Salvando projeto antes de fechar…' });
      await salvarProjetoZip();
      fecharProjeto();
      limparHistorico();
      set({ confirmarFecharProjetoAberto: false, mensagem: 'Projeto salvo e fechado com sucesso.' });
      navegar('/');
    } catch (erro) {
      set({ mensagem: `Erro ao salvar projeto: ${(erro as Error).message}` });
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = () => {
    if (salvando) return;
    set({ confirmarFecharProjetoAberto: false });
  };

  return (
    <div className="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="titulo-fechar-projeto" onClick={cancelar}>
      <div className="modal modal-fechar-projeto" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }} aria-hidden="true">💾</span>
          <h3 id="titulo-fechar-projeto" style={{ margin: 0, fontSize: 17, color: 'var(--txt)' }}>
            Fechar projeto atual
          </h3>
        </div>

        <p style={{ color: 'var(--txt)', margin: '12px 0 16px', lineHeight: 1.5, fontSize: 13 }}>
          O projeto <strong>“{nomeProjeto || 'Sem título'}”</strong> possui alterações que ainda não foram salvas. O que deseja fazer?
        </p>

        <div className="modal-botoes" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            className="botao-modal neutro"
            onClick={cancelar}
            disabled={salvando}
            data-teste="fechar-cancelar"
          >
            Cancelar
          </button>

          <button
            type="button"
            className="botao-modal perigo"
            onClick={fecharSemSalvar}
            disabled={salvando}
            data-teste="fechar-descartar"
            title="Descarta todas as alterações feitas na sessão atual"
          >
            Descartar e Fechar
          </button>

          <button
            type="button"
            className="botao-modal primario"
            onClick={() => void salvarEFechar()}
            disabled={salvando}
            data-teste="fechar-salvar"
            title="Salva o arquivo .zip do projeto e retorna à Tela Inicial"
          >
            {salvando ? 'Salvando…' : 'Salvar e Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
}
