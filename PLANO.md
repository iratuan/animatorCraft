# StickBoard — plano

Gerador de vídeos MP4 estilo whiteboard com atores stickman, para ensino de ciências e matemática (YouTube, Shorts, Instagram). Uso pessoal.

## Decisões

| Tema | Decisão |
|---|---|
| Autoria | Roteiro em parágrafos de ações em português; a UI visual é preview + ajustes finos |
| Atores | Professor, Aluno, Mãe, Irmão caçula, Priminha (esqueleto 2D + biblioteca de poses/expressões) |
| Efeito | Traço revelado progressivamente + mão com caneta |
| Fórmulas | LaTeX (KaTeX) convertido em traços animados (escrita manuscrita) |
| Gráficos | Simples e lúdicos (eixos, funções, barras, setas), desenhados com o mesmo efeito de traço |
| Áudio | Narração gravada fora; o app importa o áudio para sincronizar e tem notas de produção `[nota: ...]` |
| Saída | 16:9 (1920x1080) e vertical 9:16 (1080x1920), 30 fps |
| Idioma | pt-BR; textos da UI em arquivos de tradução (i18n) desde o início |
| Plataformas | Windows (Electron, .exe) e tablet Android >10" (Capacitor, .apk) |
| Android | Editor completo com exportação MP4 |

## Arquitetura

```
packages/core      roteiro -> ações -> timeline determinística (sem DOM; testável)
packages/render    desenha um frame em t (Canvas 2D): quadro, atores, traços, mão, balões
packages/export    frames -> MP4 (WebCodecs + muxer; FFmpeg no desktop como plano B)
apps/web           UI React compartilhada (editor de roteiro, preview, biblioteca)
apps/desktop       casca Electron
apps/mobile        casca Capacitor (Android)
```

Princípio central: `frame = render(timeline, t)`. O preview e a exportação usam a mesma função, com relógio determinístico, para o vídeo sair idêntico ao preview.

## Fases

1. **Núcleo (em andamento):** tipos, atores, poses, parser de roteiro (feito, com testes).
2. **Timeline:** converter ações em eventos com duração (andar leva X s, fala dura pelo texto ou pelo áudio, escrita dura pelo comprimento do traço).
3. **Render + rig:** esqueleto, 1 ator (Professor) com poses básicas, quadro branco, balão de fala, preview no navegador.
4. **Escrita à mão:** texto e LaTeX viram traços (fonte de traço única/Hershey ou contornos de KaTeX), mão com caneta.
5. **Elenco completo:** os 5 atores, expressões faciais, biblioteca completa de poses.
6. **Exportação MP4:** desktop primeiro, depois Android. Verificar compatibilidade com YouTube/Instagram.
7. **Apps:** empacotamento Electron (.exe) e Capacitor (.apk), UI para toque (tablet).
8. **Áudio:** importar narração, marcar sincronia, notas de produção.
9. **Gráficos lúdicos** e i18n.

## Estado atual (PC)

Feito: parser de roteiro (inclui dança, "por N segundos" e simultâneo com "junto/todos"), timeline, render em lineart preto e branco com contorno trêmulo, 5 personagens com roupas e 5 danças, Biblioteca com sequências padrão, editor estilo Animate, exportação MP4 (WebCodecs) 16:9 e 9:16, casca Electron.
Próximo: escrita de fórmulas em traço de caneta; áudio (importar narração, sincronizar na linha do tempo, mixar no MP4 com AudioEncoder); empacotar `.exe`; depois Android.

## Riscos

- **Exportação no Android:** WebCodecs depende da versão do WebView. Validar cedo (fase 6 em protótipo antes da UI final).
- **LaTeX para traço:** o contorno do KaTeX é preenchido, não é traço de caneta. Precisa de esqueletização ou fonte de traço única; é a parte mais incerta da fase 4.
- **Qualidade dos personagens:** a personalidade (sarcástico, bobo) vem das poses e expressões; vale iterar com você no visual.

## Formato do roteiro

Ver `docs/ROTEIRO.md`.
