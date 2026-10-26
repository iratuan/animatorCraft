# StickBoard

Gerador de vídeos whiteboard com personagens animados (ensino de ciências, matemática e inglês). **React + Electron** (Windows) e o mesmo renderer empacotado com Capacitor para o **APK** (tablet Android).

## Estrutura

```
├── assets/  release/  android/       ícone, instaladores gerados, projeto Android (Capacitor)
├── src/
│   ├── main/        processo Electron: janela (com navegação/permissões bloqueadas), IPC, arquivos, vídeo
│   ├── renderer/    interface React
│   │   ├── pages/editor/   composição da tela, atalhos, menus, carga inicial
│   │   ├── features/       um módulo por assunto, cada um com index.ts (cena, palco, roteiro, linha-do-tempo,
│   │   │                   personagens, editor-imagem, audio, imagens, ia, exportacao, projeto, aula, ajuda, sistema…)
│   │   ├── components/  layouts/  routes/  store/  assets/
│   └── shared/      domínio puro (roteiro, linha do tempo, personagens, expressões, clipes, editor de imagem) + util
├── tools/           e2e/ (baterias), captura/, auditoria/, verificação de arquitetura
└── docs/  referencias/  evidencias/
```

Regras de camadas, features e persistência: **docs/ARQUITETURA.md** (`npm run check` as verifica).
## Comandos

| | |
|---|---|
| `npm run dev` | Vite + Electron com recarga |
| `npm run dev:web` | só o renderer no navegador (http://127.0.0.1:5173) |
| `npm run check` | tipos + regras de arquitetura + testes |
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
- Documentos: `docs/ROTEIRO.md` (sintaxe), `PLANO.md`.

## Testes
- `npm test`: testes de domínio (roteiro, timeline, áudio, gráficos, IA, personagens, desfazer).
- `npm run e2e`: testes de tela no navegador (com `npm run dev:web` rodando): simultâneas, posição no palco, áudio com MP4, gráficos, IA (servidor simulado), projeto, menções e colchetes do roteiro, diagnósticos, exportação e tela inicial.

## 0.7.0
- **Tela inicial** leve (o editor carrega em segundo plano): continuar, novo, modelos, abrir roteiro/projeto, criar personagem, manual.
- **Prompt mestre**: texto para qualquer IA gerar roteiros válidos, montado a partir da sua biblioteca; a resposta é conferida e aplicada no app (`docs/prompt-mestre-exemplo.md`).
- Revisão de lançamento: baterias `revisao-*` (biblioteca, sprites, clipes, importação, exportação) e ~110 testes unitários novos; dezenas de correções (veja o commit).

## 0.8.0
- Barra de ferramentas no topo (tudo também nos menus, agora com ícones), painéis redimensionáveis (arrastar, setas, duplo clique restaura), exportar/importar sprites do personagem selecionado direto da barra.
- Trilhas de áudio: voz de cada personagem, efeitos e música em faixas próprias (M/S na linha do tempo, volume na aba Áudio, vale no MP4 e no projeto); \[música: x.wav, trilha nome]\ cria trilhas extras.
