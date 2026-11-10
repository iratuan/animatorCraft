# StickBoard 0.8.2 no emulador Android (tablet, Android 16)

Executado em `emulator-5554`. Versão instalada confirmada pelo sistema: `versionName=0.8.2`.

## Como foi feito

1. `npm run android:sync`: build web e sincronização do Capacitor sem erro.
2. `gradlew.bat assembleDebug`: `BUILD SUCCESSFUL`. APK em `release/StickBoard-0.8.2.apk` (10,4 MB).
3. `adb install -r`: a versão 0.8.2 substituiu a instalação anterior. Os dados do app foram mantidos.
4. `am start`: o app abriu e ficou em primeiro plano.

O emulador é compartilhado com outro app (`com.dicionariocientificopoc`). Ele estava em primeiro plano antes do teste. Não foi encerrado nem desinstalado; continua instalado e volta a aparecer quando o StickBoard sai do primeiro plano.

## Capturas

| Arquivo | O que mostra |
|---|---|
| `01-tela-inicial.png` | Tela inicial no tablet. Cartões de continuar, novo projeto e IA; filtros de formato com ícones de linha; cartões de modelo. |
| `02-editor.png` | Editor: roteiro com cenário podcast, palco, linha do tempo com personagens e falas, painel do personagem. |
| `03-ficha-personagem.png` | Ficha do personagem (CringeFather) em modo leitura: campos, pré-visualização vetorial, poses e expressões. |

## Limites deste teste

- **Exportar MP4 não foi executado** no aparelho. A exportação gera vídeo pesado e termina em folha de compartilhamento do Android, que não foi conferida.
- O **fechamento com alterações** e o **"Salvar como"** dependem de diálogos do desktop e do navegador. No Android não se aplicam do mesmo jeito e não foram testados aqui.
- Os toques foram feitos por coordenadas (`adb shell input tap`), convertidas da imagem de 2000 px para a resolução original de 2560 px.
