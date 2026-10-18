import { app, BrowserWindow, Menu } from 'electron';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NOME_APP } from '@shared/constants/video';
import { registrarIpc } from './ipc-handlers';

// Em desenvolvimento o plugin do Vite define VITE_DEV_SERVER_URL; empacotado, carrega o index.html compilado.
const urlDev = process.env.VITE_DEV_SERVER_URL;
const indiceCompilado = join(__dirname, '..', 'dist', 'index.html');

// --captura=<arquivo.png>[,<consulta>] tira um screenshot da janela e encerra (usado para gerar evidências).
const captura = process.argv.find((a) => a.startsWith('--captura='))?.slice('--captura='.length);

function criarJanela(): void {
  const [arquivo, consulta] = (captura ?? '').split(',');
  const janela = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1100, minHeight: 640,
    backgroundColor: '#1e1e1e', title: NOME_APP, show: !captura,
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  Menu.setApplicationMenu(null);

  if (urlDev) void janela.loadURL(consulta ? `${urlDev}?${consulta}` : urlDev);
  else void janela.loadFile(indiceCompilado, consulta ? { search: consulta } : undefined);

  if (arquivo) {
    janela.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        const imagem = await janela.webContents.capturePage();
        mkdirSync(dirname(arquivo), { recursive: true });
        writeFileSync(arquivo, imagem.toPNG());
        console.log('captura salva em', arquivo);
        app.quit();
      }, 2500);
    });
  }
}

app.whenReady().then(() => {
  registrarIpc();
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});
app.on('window-all-closed', () => app.quit());
