# StickBoard — Extensão para VS Code

Transforme o **VS Code** em um estúdio completo de animação whiteboard com stickmen animados, roteiro inteligente, lousa matemática interativa e exportação de vídeos para YouTube e Shorts.

---

## 🚀 Funcionalidades Integradas ao VS Code

1. **Custom Editor para Roteiros (.stk, .stk.txt, .stickboard)**:
   - Abra qualquer arquivo de roteiro diretamente no StickBoard Studio com preview do palco e timeline em tempo real.
   - **Sincronização Bidirecional**: edições de texto no VS Code atualizam o palco instantaneamente; ações no palco/timeline gravam no arquivo com suporte total ao Desfazer/Refazer (`Ctrl+Z` / `Ctrl+Y`) nativo do VS Code.

2. **Drag & Drop do Palco**:
   - Arraste personagens da biblioteca lateral diretamente para o palco para posicioná-los ou fazê-los entrar em cena.

3. **Lousa e Fórmulas LaTeX**:
   - Equações matemáticas KaTeX desenhadas e animadas dinamicamente na lousa.

4. **Exportação de Vídeo Direto no Workspace**:
   - Renderização MP4 local nos formatos 16:9 (Horizontal) e 9:16 (Vertical) salva direto na pasta do seu projeto.

---

## 🛠️ Como Testar no Modo de Desenvolvimento

1. **Compilar a interface web**:
   Na raiz do projeto principal:
   ```bash
   npm run build
   ```

2. **Instalar dependências e compilar a extensão**:
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   ```

3. **Executar no VS Code**:
   - Abra a pasta `vscode-extension` no VS Code.
   - Pressione **`F5`** (inicia a janela de desenvolvimento de extensão *Extension Development Host*).
   - Na nova janela, abra qualquer arquivo `.stk` ou execute o comando `StickBoard: Abrir Estúdio StickBoard` na Paleta de Comandos (`Ctrl+Shift+P`).

---

## 📦 Como Empacotar para Instalação (.vsix)

Para criar o arquivo `.vsix` para instalar em qualquer VS Code:
```bash
npx @vscode/vsce package
```
O arquivo `stickboard-vscode-0.8.2.vsix` será gerado e poderá ser instalado via:
`code --install-extension stickboard-vscode-0.8.2.vsix` ou pelo menu *Extensions -> Install from VSIX...* do VS Code.
