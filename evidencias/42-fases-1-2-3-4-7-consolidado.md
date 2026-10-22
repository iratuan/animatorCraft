# Evidências — Fase 1, 2, 3, 4 e 7

Data: 2026-10-20
Status da Suíte: 25 arquivos de teste / 216 testes passando (100% verde)
Typecheck: TypeScript 0 erros (tsconfig.json + tsconfig.main.json)
Arquitetura: Limites de camadas estritamente respeitados

---

## 1. Fundação de Dados e Gestão de Projetos (Fase 1)
- **Versão do Projeto**: `projeto.json` atualizado para versão 2 com metadados de `nome` e `modificadoEm`.
- **Compatibilidade Retroativa**: Projetos legados salvos na versão 1 continuam sendo abertos sem qualquer quebra de dados.
- **Ações de Projeto**:
  - `Novo projeto em branco`: Confirmação com o usuário caso existam alterações pendentes antes de resetar o editor.
  - `Abrir projeto (.zip)`: Diálogo nativo e confirmação de descarte de alterações não salvas.
  - `Salvar projeto (.zip)` / `Salvar projeto como (.zip)...`: Gravação com nome sugerido e reset do indicador de alteração.
- **Título do Projeto**: Exibição em tempo real do nome ativo do projeto com indicador `*` na barra de menu quando houver alterações não salvas.

---

## 2. Roteiro de Gravação de Voz (Fase 7 parcial)
- **Módulo**: `src/shared/domain/roteiro-gravacao.ts`
- **Funcionalidades**:
  - Extração de todas as falas da `Timeline` compilada.
  - Cálculo de quantidade de falas e duração estimada de voz por ator.
  - Exportação direta em Markdown pelo menu `Exportar > Roteiro de gravação para atores (.md)...` e botão de atalho `Vozes` na barra de ferramentas.
  - Geração de roteiro cronológico por cena e seções individuais dedicadas a cada personagem.

---

## 3. Regras de Conflito da Linha do Tempo (Fase 4 parcial)
- **Módulo**: `src/shared/domain/conflitos.ts`
- **Validações**:
  - Detecção de sobreposição de vozes simultâneas entre múltiplos personagens com alerta temporal exato.
  - Detecção de conflitos de locomoção e teletransporte para o mesmo personagem.
  - Exibição de conflitos na barra de status e lista de avisos contextuais do editor.

---

## 4. Multiformato, Cenas e UX/UI (Fases 2 e 3)
- **Navegação Direta por Cenas**: Dropdown dinâmico inserido no cabeçalho do `RoteiroPanel` para saltar a reprodução (`t`) direto para o timestamp inicial de qualquer cena.
- **Barra de Status Enriquecida**:
  - Evento ativo no instante da animação.
  - Timestamp atual / Duração total (`X.Xs / Y.Ys`).
  - Identificador da cena ativa (`X/Total: Título`).
  - Formato de vídeo (`YouTube 16:9` ou `Vertical 9:16`).
  - Indicador de conflitos identificados (`⚠ N conflito(s)`).
  - Nome do projeto e status de salvamento.

---

## 5. Evidências de Empacotamento e Execução Real (Windows e Android)

Pasta: `evidencias/43-fase-3-windows/`

### A. Executável Windows (`release/win-unpacked/StickBoard.exe`):
- `01-windows-tela-inicial.png`: Abertura limpa da tela inicial.
- `02-windows-editor-barra-status.png`: Editor aberto no executável nativo do Windows com a nova barra de status completa e dropdown de salto de cenas.
- `03-windows-menu-arquivo.png`: Menu "Arquivo" com as novas opções de "Novo projeto em branco", "Salvar projeto (.zip)" e "Salvar projeto como (.zip)...".
- `04-windows-menu-exportar-vozes.png`: Menu "Exportar" com a nova opção "Roteiro de gravação para atores (.md)..." e botão "Vozes" na barra de ferramentas.

### B. Aplicativo Android APK (`android/app/build/outputs/apk/debug/app-debug.apk`):
- Compilado com sucesso via Gradle (`gradlew.bat assembleDebug` com JDK 21).
- Instalado e executado no emulador oficial de tablet (`MindCraft_Tablet` 2560×1600):
  - `05-android-tela-inicial.png`: Tela inicial rodando no Android.
  - `06-android-editor-barra-status.png`: Editor carregado no tablet Android com a nova barra de status e o novo seletor de cenas no roteiro.
  - `07-android-menu-arquivo.png`: Menu do StickBoard aberto no tablet Android.
