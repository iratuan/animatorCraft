import { dialog, type BrowserWindow } from 'electron';

/** O renderer avisa quando há alterações que ainda não foram salvas (ver `definirAlteracoesPendentes` no preload). */
let alteracoesPendentes = false;

export function definirAlteracoesPendentes(pendentes: boolean): void {
  alteracoesPendentes = pendentes === true;
}

/**
 * Fechar a janela com alterações não salvas pergunta antes.
 * "Cancelar" mantém o app aberto; "Fechar sem salvar" fecha e descarta. Sem alterações, fecha direto.
 */
export function protegerFechamento(janela: BrowserWindow): void {
  let fechamentoAutorizado = false; // por janela: a resposta "Fechar sem salvar" vale só para esta janela
  janela.on('close', (evento) => {
    if (fechamentoAutorizado || !alteracoesPendentes) return;
    evento.preventDefault();
    const escolha = dialog.showMessageBoxSync(janela, {
      type: 'warning',
      title: 'StickBoard',
      message: 'Há alterações que não foram salvas.',
      detail: 'Para guardar o projeto, use Arquivo ▸ Salvar antes de fechar. Fechar sem salvar descarta as alterações.',
      buttons: ['Cancelar', 'Fechar sem salvar'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (escolha === 1) {
      fechamentoAutorizado = true;
      janela.close();
    }
  });
}
