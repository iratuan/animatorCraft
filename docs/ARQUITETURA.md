# Arquitetura

StickBoard é **Electron + React** (obrigatório). Três camadas, com dependências em um só sentido:

```
src/shared     domínio puro (roteiro, linha do tempo, personagens, editor de imagem). Sem React, sem DOM, sem Electron.
   ▲
src/renderer   interface React
   │  pages/      composição das telas (EditorPage, atalhos, menus, carga inicial)
   │  features/   uma pasta por assunto; cada uma expõe só o seu index.ts
   │  components/ peças visuais genéricas   store/ estado global (Zustand)   layouts/ routes/ assets/
src/main       processo Electron: janela, IPC, arquivos, exportação de vídeo (preload.ts expõe window.stickboard)
```

## Regras (verificadas por `npm run check`)

1. `shared` não importa de `renderer` nem de `main`; funciona em Node puro (as ferramentas em `tools/` carregam o domínio direto).
2. Uma feature só usa outra pelo **index** dela: `@renderer/features/audio`, nunca `.../audio/services/...`.
3. `features` não importam de `pages`; quem junta várias features é a página.
4. Sem ciclos de importação (`node tools/analisar-codigo.mjs` lista ciclos, dependências entre features e exportações sem uso).
5. Dentro da própria feature, imports são relativos (`./`, `../`).

## Features

| Feature | Responsabilidade |
|---|---|
| `cena` | motor de desenho (lousa, atores de palito, câmera) em canvas — sem React |
| `palco` | visualização, arraste de personagem, reprodução |
| `roteiro` | editor de texto do roteiro e interpretação (`useRoteiroDerivado`) |
| `linha-do-tempo` | linha do tempo editável |
| `personagens` | cadastro, fichas, clipes e expressões dos bonecos |
| `editor-imagem` | editor de imagem (camadas, pincel, seleção) sobre `shared/editor-imagem` |
| `audio`, `imagens`, `ia`, `exportacao`, `projeto`, `aula`, `ajuda`, `fontes`, `ferramentas`, `biblioteca` | recursos do app |
| `sistema` | plataforma (Electron/Android/web), arquivos, `localStorage` e IndexedDB com rede de segurança |

## Persistência

`localStorage` via `sistema/lerJson|gravarJson|lerTexto|gravarTexto`; blobs (áudios, imagens) em IndexedDB via `sistema/criarLoja`.

## Ferramentas (`tools/`)

`e2e/` (baterias Playwright; `npm run e2e` com `npm run dev:web` ligado), `captura/` (evidências), `refatorar/`, `analisar-codigo.mjs`, `verificar-arquitetura.mjs`.

## Segurança do Electron

`contextIsolation`, `sandbox`, sem `nodeIntegration`; navegação externa, novas janelas e permissões de dispositivo são negadas.
