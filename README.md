# StickBoard

Gerador de vídeos whiteboard com personagens animados (ensino de ciências, matemática e inglês). **React + Electron** (Windows) e o mesmo renderer empacotado com Capacitor para o **APK** (tablet Android).

## Estrutura

```
├── assets/                     ícone do app (icon.png)
├── release/                    instaladores gerados (StickBoard Setup *.exe e portátil)
├── android/                    projeto Android (Capacitor) — empacota a build do renderer
├── src/
│   ├── main/                   PROCESSO PRINCIPAL (Node/Electron)
│   │   ├── index.ts            janela, ciclo de vida, --captura para screenshots
│   │   ├── preload.ts          contextBridge: expõe window.stickboard (5 funções, nada mais)
│   │   ├── ipc-handlers.ts     registra os canais IPC e delega para services/
│   │   └── services/           arquivos (abrir/salvar roteiro, abrir pacote) e vídeo (salvar MP4)
│   ├── renderer/               FRONTEND REACT
│   │   ├── assets/             sprites dos personagens (png + manifesto) e estilos globais
│   │   ├── components/         UI reutilizável (Painel, BarraMenu, Miniatura, Icones)
│   │   ├── features/           um módulo por domínio, cada um com components/ hooks/ services/
│   │   │   ├── palco/          canvas, transporte, reprodução e render/ (motor de desenho)
│   │   │   ├── roteiro/        editor de texto e derivação (parser → timeline → estado)
│   │   │   ├── linha-do-tempo/ ├ biblioteca/ ├ aula/ ├ ferramentas/ ├ fontes/
│   │   │   ├── pacotes-sprites/ importação de .zip de sprites (padrão em docs/SPRITES.md)
│   │   │   ├── exportacao/     codificação MP4 (WebCodecs)
│   │   │   └── arquivos/       plataforma: Electron (IPC) | Android (Capacitor) | web
│   │   ├── layouts/            EditorLayout
│   │   ├── pages/              EditorPage
│   │   ├── routes/             HashRouter (funciona em file:// e no WebView)
│   │   ├── store/              estado global (Zustand)
│   │   ├── App.tsx  main.tsx
│   └── shared/                 código comum aos dois processos
│       ├── constants/          canais IPC, formatos de vídeo
│       ├── types/              contrato IPC (StickboardApi...)
│       └── domain/             regras puras sem DOM nem Node: parser do roteiro, timeline, poses,
│                               clipes, personagens, sequências, modelos, nomenclatura de sprites (com testes)
├── tools/                      scripts de apoio (recorte de fichas, importação de pacotes, capturas)
├── docs/  referencias/  evidencias/
├── index.html  vite.config.ts  tsconfig.json  tsconfig.main.json  capacitor.config.ts
```

## Comandos

| | |
|---|---|
| `npm run dev` | Vite + Electron com recarga |
| `npm run dev:web` | só o renderer no navegador (http://127.0.0.1:5173) |
| `npm test` | testes do domínio (vitest) |
| `npm run typecheck` | renderer e processo principal |
| `npm run build` | compila renderer (`dist/`) e main/preload (`dist-electron/`) |
| `npm run dist` | instalador NSIS e executável portátil em `release/` |
| `npm run android:apk` | build web + `cap sync` + Gradle → `android/app/build/outputs/apk/debug/app-debug.apk` |

Android: use o JDK do Android Studio (`JAVA_HOME=C:\Ambiente\Android Studio\jbr`).

## Regras de arquitetura

- O renderer **nunca** usa Node: tudo que precisa de disco passa por `plataforma` (`features/arquivos`), que fala com o Electron pelo IPC, com o Capacitor no Android ou com o navegador.
- O preload expõe só funções específicas (`window.stickboard`); `contextIsolation` e `sandbox` ligados.
- `shared/domain` é código puro e testável; o desenho (canvas) fica no renderer.
- Documentos: `docs/ROTEIRO.md` (sintaxe), `docs/SPRITES.md` (nomes dos sprites), `docs/FICHAS.md` (como gerar fichas), `PLANO.md`.

## Testes
- `npm test`: testes de domínio (roteiro, timeline, áudio, gráficos, IA, personagens, desfazer).
- `npm run e2e`: testes de tela no navegador (com `npm run dev:web` rodando): simultâneas, posição no palco, áudio com MP4, gráficos, IA (servidor simulado), projeto, editor de sprites.
