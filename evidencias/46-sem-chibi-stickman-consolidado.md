# Relatório de Execução: Eliminação do Chibi e Adoção Exclusiva de Stickman

## 1. Visão Geral das Modificações Realizadas

Em conformidade com a solicitação do usuário, o estilo **Chibi** (sprites rasterizados) foi completamente eliminado da aplicação, tornando o estilo **Stickman** (animação procedural de bonecos de palito estilo lousa branca) o padrão único e absoluto do StickBoard. Não existe mais a necessidade de escolha ou alternância de estilos no sistema.

### Modificações Estruturais Implementadas:
1. **Domínio de Animações e Clipes (`src/shared/domain/clipes.ts`)**:
   - `EstiloClipe` simplificado para `'stickman' | 'ambos'`.
   - `clipeDaPose` e `acharClipe` unificados para resolução de animação procedural stickman.
   - Remoção de branches condicionais ao Chibi em todo o cálculo de poses e transformações.
2. **Motor de Renderização do Palco (`src/renderer/features/cena/services/`)**:
   - `cena.ts`: Desacoplado de `calcularAtorSprite` e `temSprites`. O loop de renderização desenha `desenharAtor(...)` diretamente em estilo whiteboard stickman para todos os personagens.
   - `miniatura.ts`: Renderização de miniaturas no catálogo e nos seletores totalmente procedural em boneco stickman.
   - `sprites.ts`: `temSprites` neutralizado para `false` e remoção de estados globais de chaveamento de skin.
3. **Interface e Modais (`src/renderer/features/`)**:
   - `PropriedadesPanel.tsx` e `AulaPanel.tsx`: Removidos todos os seletores de estilo (`SeletorSkin`) e menções à troca Chibi/Stickman.
   - `useSkins.tsx`: `skinPadrao` e `skinDe` fixados permanentemente em `'stickman'`, eliminando renderização de botões de estilo.
   - `EditorAnimacaoModal.tsx`: Removidos os botões de prévia Chibi e gavetas de sprites Chibi; prévia agora é exclusivamente em boneco stickman procedural.
4. **Persistência de Projetos (`src/renderer/features/projeto/services/projeto.ts`)**:
   - Novo padrão de abertura e exportação gravando `skinPadrao: 'stickman'` e garantindo retrocompatibilidade total com projetos antigos.

---

## 2. Bateria de Verificação e Testes Automatizados

O comando de checagem completa (`npm run check`) foi executado com sucesso:
- **TypeScript**: 0 erros em `tsconfig.json` e `tsconfig.main.json`.
- **Arquitetura**: Camadas estritas respeitadas (`tools/verificar-arquitetura.mjs`).
- **Vitest**: **25 arquivos de teste e 220 testes unitários/integração passaram (100% GREEN)**.

---

## 3. Instaladores e Pacotes Gerados na Pasta `release/`

Todos os binários foram empacotados com sucesso na pasta `release/`:
| Arquivo | Tamanho | Descrição |
| :--- | :--- | :--- |
| `release/StickBoard Setup 0.8.0.exe` | ~92.2 MB | Instalador Windows NSIS |
| `release/StickBoard-0.8.0-portatil.exe` | ~92.0 MB | Executável Portátil Windows |
| `release/StickBoard-0.8.0.apk` | ~9.66 MB | Pacote APK Android atualizado |

---

## 4. Evidências Capturadas

### Windows (Playwright via `release/win-unpacked/StickBoard.exe`):
- `evidencias/46-sem-chibi-stickman-windows/01-windows-home.png`: Tela inicial com novos projetos.
- `evidencias/46-sem-chibi-stickman-windows/02-windows-editor-stickman.png`: Editor carregado com os personagens estilizados em boneco de palito.
- `evidencias/46-sem-chibi-stickman-windows/03-windows-stickman-erika-betason.png`: Roteiro de palco com Erika (mais alta) e BetaSon em ação como stickmen.
- `evidencias/46-sem-chibi-stickman-windows/04-windows-painel-lateral.png`: Painel lateral limpo, sem opções nem seletores de skin/estilo.
- `evidencias/46-sem-chibi-stickman-windows/05-windows-modal-animacoes-stickman.png`: Modal de Expressões e Clipes operando exclusivamente no modo Stickman.

### Android (Emulador `emulator-5554` via ADB):
- `evidencias/46-sem-chibi-stickman-android/01-android-home.png`: Tela inicial do StickBoard 0.8.0 no Android.
- `evidencias/46-sem-chibi-stickman-android/02-android-editor-stickman.png`: Editor carregado no tablet com suporte stickman nativo.
- `evidencias/46-sem-chibi-stickman-android/03-android-palco-stickman-acao.png`: Execução do palco com animação procedural.
