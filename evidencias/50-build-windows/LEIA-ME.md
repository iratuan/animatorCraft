# Build do Windows (instalador e portátil) e do Android (APK)

Versão: 0.8.2 · gerado em 2026-10-26 nesta máquina.

## Artefatos

| Arquivo | Tamanho | Observação |
|---|---|---|
| `release/StickBoard Setup 0.8.2.exe` | 89,9 MB | Instalador NSIS (`npm run dist`). Sem assinatura digital. |
| `release/StickBoard-0.8.2-portatil.exe` | 89,7 MB | Versão portátil, sem instalação. Sem assinatura digital. |
| `release/StickBoard-0.8.2.apk` | 10,4 MB | APK de debug (`assembleDebug`). Cópia de `android/app/build/outputs/apk/debug/app-debug.apk`. |

A pasta `release/` está no `.gitignore`, então os arquivos não vão para o repositório.

## O que foi verificado

- **Instalador e portátil:** gerados sem erro. O executável portátil foi aberto em modo de captura (`--captura`): iniciou, carregou a tela inicial e saiu com código 0.
  - `01-exe-portatil-0.8.2.png`: a tela de abertura. Comprova que o executável inicia.
  - `02-exe-portatil-editor.png` e `03-exe-portatil-home-alinhado.png`: a tela inicial já com os ícones de formato. A `03` é a versão depois da correção de alinhamento.
- **APK:** compilou com o Gradle wrapper (`BUILD SUCCESSFUL`). O pacote contém `classes.dex`, `AndroidManifest.xml` e `assets/public/index.html`.

## O que NÃO foi verificado

- **Instalar o instalador do Windows** numa máquina limpa. Só geramos o arquivo; a instalação não foi executada.
- **Rodar o APK** num aparelho ou emulador. O emulador é compartilhado com outro app, e não foi usado.
- **Assinatura de release.** Os dois executáveis do Windows e o APK são de teste, sem assinatura de produção.
- **Fechamento com alterações e "Salvar como"** no executável. Isso tem cobertura unitária e de navegador, não foi testado no `.exe`.

## Correção feita durante o build

Os ícones de formato na tela inicial ficavam mais altos que o texto ao lado. Foram colocados num invólucro com alinhamento vertical (`.ico-formato`, em `home.css`). A captura `03` mostra o resultado.
