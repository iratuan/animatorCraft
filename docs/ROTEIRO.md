# Formato do roteiro

Parágrafos de ações em português. `# Título` inicia uma cena. Cada frase é uma ou mais ações.

```
# Produtos notáveis

Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Hoje vamos aprender!" irritado. Professor escreve $(a+b)^2$ no quadro. Aluno fica confuso. Espera 1,5 segundos. Apaga o quadro.

[nota: gravar a fala do professor com voz impaciente]
```

| Construção | Exemplo |
|---|---|
| Entrar / sair | `Aluno entra correndo pela direita.` · `Professor sai pela esquerda.` |
| Fala | `Aluno grita "Não entendi!" assustado.` (verbos: diz, fala, grita, pergunta, responde, sussurra, reclama, exclama) |
| Escrever texto | `Professor escreve "Teorema" no quadro.` |
| Escrever fórmula | `Professor escreve $x^2 + 2x + 1$ no quadro.` |
| Estado / emoção | `Aluno fica confuso.` (confuso, surpreso, bravo, irritado, feliz, triste, assustado, empolgado, entediado, sarcástico, pensativo, envergonhado, rindo, chorando) |
| Dança | `Professor dança.` (cada um no seu estilo: Professor funky anos 70, Aluno atual, Mãe hippie, Caçula descoordenada, Priminha balé) · `Mãe dança hippie por 6 segundos.` (duração padrão: 4 s) |
| Simultâneo | `Professor e Aluno dançam juntos por 5 segundos.` · `Todos dançam.` (quem já entrou em cena) · `Professor e Caçula entram juntos pela esquerda.` A frase seguinte começa quando a mais longa termina. |
| Apontar | `Professor aponta.` |
| Pausa | `Espera 2 segundos.` |
| Limpar | `Apaga o quadro.` |
| Nota de produção | `[nota: texto livre]` (não aparece no vídeo) |

Frases não reconhecidas geram aviso no editor (não quebram o vídeo).

Atores: professor, aluno, mãe, caçula (ou irmão), priminha (ou prima).

## Ações simultâneas

- `Enquanto Professor diz "Atenção!", Aluno dança por 6 segundos.` · `Aluno dança por 4 segundos enquanto Erika acena.`
- `Ao mesmo tempo, Dario pula.` (junto com a frase anterior) · `Ao mesmo tempo: A. B. C.` (bloco; tudo no parágrafo roda junto)
- A próxima ação sequencial espera a mais longa do grupo terminar. Dois personagens podem falar juntos, cada um com o seu balão.
- Na linha do tempo, arrastar um bloco sobre outro reescreve o roteiro com "Ao mesmo tempo,"; arrastar para um espaço livre volta a sequencial; arrastar a borda de uma pose com duração muda os segundos.

## Posição dos personagens

- `Professor fica na posição 30%.` (aparece direto) · `Aluno anda para a posição 70%.` (caminha) · `Erika entra pela direita na posição 60%.`
- Arrastar o sprite no palco (plano aberto) escreve a frase "fica na posição N%." logo depois da última ação concluída.

## Personagens criados pelo usuário

Arquivo > Novo personagem cria nome, apelidos, idade, altura, boneco de palito base e dança padrão; os sprites entram pelo editor de sprites. A lista fica no armazenamento do app; o zip exportado leva `ficha.json`.

## Imagens na lousa

- `Professor mostra a imagem ciclo.png no quadro [no canto esquerdo|direito] [pequena|grande] [com efeito E] [e sai com efeito S] [por N segundos].`
- Efeitos: surgir, deslizar da esquerda/direita/de cima/de baixo, zoom, revelar, sem efeito. Nome entre aspas se tiver espaços.
- `Professor tira a imagem ciclo.png [com efeito E].` retira só essa imagem. `Apaga o quadro.` limpa tudo.
- A imagem é importada na aba Imagens (PNG, JPG, WebP) e a frase é inserida no ponto do cursor do roteiro.
