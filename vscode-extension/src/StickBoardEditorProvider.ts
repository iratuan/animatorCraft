import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Provedor de Custom Editor para arquivos de animação do StickBoard no VS Code.
 * Garante sincronização bidirecional entre o arquivo de roteiro no editor e o palco/timeline no Webview.
 */
export class StickBoardEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'stickboard.editor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new StickBoardEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(
      StickBoardEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, '..', 'dist')),
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist-webview')),
      ],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

    let isUpdatingFromWebview = false;

    // Envia o roteiro inicial para o Webview assim que estiver pronto
    const enviarRoteiro = () => {
      webviewPanel.webview.postMessage({
        tipo: 'carregar-roteiro',
        texto: document.getText(),
        nome: path.basename(document.fileName),
      });
    };

    // Atualiza o Webview quando o documento de texto for alterado externamente
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !isUpdatingFromWebview) {
        enviarRoteiro();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    // Recebe comandos e mensagens vindas do Webview do StickBoard
    webviewPanel.webview.onDidReceiveMessage(async (mensagem) => {
      switch (mensagem.tipo) {
        case 'webview-pronto': {
          enviarRoteiro();
          break;
        }

        case 'atualizar-roteiro': {
          isUpdatingFromWebview = true;
          const edit = new vscode.WorkspaceEdit();
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(document.getText().length)
          );
          edit.replace(document.uri, fullRange, mensagem.texto);
          await vscode.workspace.applyEdit(edit);
          isUpdatingFromWebview = false;
          break;
        }

        case 'salvar-video': {
          try {
            const folderUri = vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(path.dirname(document.fileName));
            const saveUri = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.joinPath(folderUri, mensagem.nome || 'animacao.mp4'),
              filters: { 'Vídeo MP4': ['mp4'] },
            });
            if (saveUri) {
              const buffer = Buffer.from(mensagem.dadosBase64, 'base64');
              await vscode.workspace.fs.writeFile(saveUri, buffer);
              vscode.window.showInformationMessage(`Vídeo StickBoard exportado com sucesso em ${path.basename(saveUri.fsPath)}!`);
            }
          } catch (err: unknown) {
            vscode.window.showErrorMessage(`Erro ao salvar vídeo: ${(err as Error).message}`);
          }
          break;
        }

        case 'notificacao': {
          vscode.window.showInformationMessage(mensagem.texto);
          break;
        }

        case 'erro': {
          vscode.window.showErrorMessage(mensagem.texto);
          break;
        }
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
    // Procura o bundle gerado pelo Vite na pasta dist do projeto
    const distPath = path.join(this.context.extensionPath, '..', 'dist');
    const indexPath = path.join(distPath, 'index.html');

    let html = '';
    if (fs.existsSync(indexPath)) {
      html = fs.readFileSync(indexPath, 'utf-8');
      // Converte URIs relativas do Vite para URIs seguras do Webview
      html = html.replace(/(href|src)="\.\/assets\/([^"]+)"/g, (_match, attr, file) => {
        const uri = webview.asWebviewUri(vscode.Uri.file(path.join(distPath, 'assets', file)));
        return `${attr}="${uri}"`;
      });
      html = html.replace(/(href|src)="\/assets\/([^"]+)"/g, (_match, attr, file) => {
        const uri = webview.asWebviewUri(vscode.Uri.file(path.join(distPath, 'assets', file)));
        return `${attr}="${uri}"`;
      });
    } else {
      // Fallback amigável enquanto o build do Vite não foi executado
      html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #18181b; color: #f4f4f5; text-align: center; }
    h2 { margin-bottom: 8px; color: #38bdf8; }
    p { max-width: 480px; line-height: 1.5; color: #a1a1aa; font-size: 14px; }
    code { background: #27272a; padding: 4px 8px; border-radius: 4px; color: #fbbf24; }
  </style>
</head>
<body>
  <h2>▶ StickBoard Studio</h2>
  <p>Compilação da interface necessária. Execute no terminal:</p>
  <p><code>npm run build</code></p>
  <p>para gerar os pacotes do Webview.</p>
</body>
</html>`;
    }

    // Injeta o bridge do VS Code antes do fechamento do head
    const bridgeScript = `
      <script>
        window.__VSCODE_API__ = acquireVsCodeApi();
        window.__STICKBOARD_DOC_NAME__ = ${JSON.stringify(path.basename(document.fileName))};
      </script>
    `;

    return html.replace('</head>', `${bridgeScript}</head>`);
  }
}
