# Evidências de Execução: Formatos de Produção, Biblioteca de Cenários e Elenco Expandido

**Data:** 20/10/2026  
**Status do Pipeline:** 100% Verde (`npm run check` passou sem erros ou desvios de arquitetura).  
**Executáveis Gerados:**
- **Windows:** `release/win-unpacked/StickBoard.exe`
- **Android APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (9,69 MB)

---

## 1. Melhorias Implementadas nesta Fase

1. **Biblioteca de Cenários e Formatos de Produção (RF-ARCH-01, RF-ARCH-02, RF-ARCH-03)**:
   - Suporte a tags no roteiro: `[cenário: podcast|telejornal|lousa|neutro]`, `[formato: aula|podcast|telejornal|livre]`, e `[sem lousa]`.
   - Renderização gráfica do estúdio de podcast: bancada curva estilizada com pedestais e microfones de estúdio desenhados em traço stickman.
   - Renderização gráfica do telejornal / *Drops da Semana*: bancada de notícias e tarja dinâmica de manchetes ("🔴 DROPS DA SEMANA | NOTÍCIAS & ATUALIDADES").
   - Desativação limpa e opcional da moldura escolar (`semLousa`) sem quebrar a execução ou o fluxo das cenas.

2. **Ajuste e Clamping de Balões de Fala com Câmera Fechada (RF-ARCH-03)**:
   - Na função `desenharBalao`, a ancoragem e as margens agora respeitam o retângulo de interpolação da câmera (`viewRect`), evitando que o texto ou balão fiquem cortados fora da tela em closes de rosto ou planos específicos.

3. **Expansão do Elenco Oficial (RF-CHAR-04, RF-CHAR-05)**:
   - Registro nativo dos personagens:
     - **Véia** (70 anos, sogra provocadora e geniosa de Cringefather, modelo palito mãe, pose e expressão padrão brava).
     - **Véio** (80 anos, poeta expressivo com olhos grandes, modelo palito professor).
     - **Paraíba** (3 anos, cachorro brincalhão sempre com fome, modelo palito caçula, dança descoordenada).
   - Suporte nos testes e no Prompt Mestre.

4. **Modelos Reutilizáveis de Produção (RF-ARCH-04)**:
   - Adicionados modelos "Gravação de Podcast" e "Drops da Semana (Notícias)" no painel *Aula* e em `modelos.ts`.

---

## 2. Resultados dos Testes Automatizados

- **Suíte Vitest:** 25 arquivos de teste, **219 testes aprovados** (0 falhas).
- **TypeScript & Typecheck:** 0 erros de tipagem em `tsconfig.json` e `tsconfig.main.json`.
- **Verificação de Arquitetura:** Camadas respeitadas (`tools/verificar-arquitetura.mjs`).

---

## 3. Capturas de Tela de Execução Real (Windows Executable)

As evidências foram coletadas via Playwright executando diretamente o binário `release/win-unpacked/StickBoard.exe`:

| Arquivo | Descrição |
|---|---|
| `01-windows-tela-inicial.png` | Tela inicial limpa com cards de navegação rápida e projeto ativo. |
| `02-windows-aba-aula-modelos.png` | Aba *Aula* com lista expandida de modelos (Podcast, Telejornal, Matemática, Ciências). |
| `03-windows-cenario-podcast.png` | Renderização do cenário de estúdio de podcast com bancada e microfones. |
| `04-windows-cenario-telejornal.png` | Renderização do estúdio *Drops da Semana* com tarja de telejornal. |
| `05-windows-novos-personagens-veia-veio.png` | Cena com Véia e Véio atuando no palco sem conflitos e com balões delimitados. |

Capturas armazenadas na pasta: [evidencias/44-formatos-cenarios-windows/](file:///e:/SANDBOX_CLAUDE/projeto_animacao_stickman/evidencias/44-formatos-cenarios-windows)
