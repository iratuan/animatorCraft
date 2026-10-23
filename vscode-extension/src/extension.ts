import * as vscode from 'vscode';
import { StickBoardEditorProvider } from './StickBoardEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  // Registra o editor customizado para arquivos .stk, .stk.txt e .stickboard
  context.subscriptions.push(
    StickBoardEditorProvider.register(context)
  );

  // Comando: Abrir Estúdio StickBoard (Webview Standalone ou focado no arquivo)
  context.subscriptions.push(
    vscode.commands.registerCommand('stickboard.abrir', async (uri?: vscode.Uri) => {
      if (uri) {
        await vscode.commands.executeCommand('vscode.openWith', uri, 'stickboard.editor');
      } else {
        const activeUri = vscode.window.activeTextEditor?.document.uri;
        if (activeUri && (activeUri.fsPath.endsWith('.stk') || activeUri.fsPath.endsWith('.stk.txt') || activeUri.fsPath.endsWith('.stickboard'))) {
          await vscode.commands.executeCommand('vscode.openWith', activeUri, 'stickboard.editor');
        } else {
          // Cria documento temporário sem título
          const doc = await vscode.workspace.openTextDocument({
            language: 'stickboard-script',
            content: '# Roteiro StickBoard\n\n[cenario telejornal]\nBetaSon entra pela esquerda.\nBetaSon diz "Olá, mundo! Este é o StickBoard no VS Code!" feliz.\n',
          });
          await vscode.commands.executeCommand('vscode.openWith', doc.uri, 'stickboard.editor');
        }
      }
    })
  );

  // Comando: Criar Novo Roteiro StickBoard
  context.subscriptions.push(
    vscode.commands.registerCommand('stickboard.novoRoteiro', async () => {
      const doc = await vscode.workspace.openTextDocument({
        language: 'stickboard-script',
        content: `# StickBoard — Novo Roteiro\n\n[cenario quadro-aula]\nCringeFather entra pela esquerda.\nCringeFather diz "Bem-vindos à aula de hoje!" feliz.\nCringeFather aponta para a lousa.\n`,
      });
      await vscode.window.showTextDocument(doc);
    })
  );
}

export function deactivate() {}
