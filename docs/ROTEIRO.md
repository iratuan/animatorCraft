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

Atores: o nome (ou apelido) de qualquer personagem (CringeFather, BetaSon, Erika, Dario, Laura, Elizendra, Artur, Carol e os que você criar) e os papéis **Professor** e **Aluno**, que a linha `[papéis: professor=Erika, aluno=Dario]` atribui a quem cumpre cada um na aula.

## Câmera, áudio e gráficos

- `[close na lousa]` · `[close em Erika]` (ou `[close no professor]`) · `[plano aberto]`.
- `Professor diz "Bem-vindos!". [áudio: abertura.wav]` (a boca acompanha a voz) · `[música: fundo.mp3, volume 25%]` · `[música: parar]` · `[efeito: palmas.wav]`.
- `Professor desenha o gráfico de y = x^2 - 2 no quadro.` · `... um gráfico de barras: A=5, B=8 no quadro.` · `... um gráfico de pizza: Sim=70, Não=30 no quadro.`
- `Professor faz a pose pular-corda por 3 segundos.` usa um sprite do pacote pelo nome.

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

## Expressões e clipes do personagem

- `Erika faz cara de apaixonada.` · qualquer expressão que o personagem tenha (as 10 padrão, as criadas para o boneco e os sprites `rosto_<nome>.png`).
- `Dario faz o clipe tchau.` (toca uma vez) · `Dario faz o clipe "dança do foguete" por 6 segundos.` · clipes criados em Personagem ▸ Expressões e clipes. Nome desconhecido gera aviso.
- Durações escritas no roteiro têm teto de 10 minutos.

## Referências e ações entre colchetes duplos

- `[[...]]` dentro de uma frase é lido como texto comum: `Professor [[aponta para a lousa]].` é igual a `Professor aponta para a lousa.`.
- Digite `[[` no roteiro: o app fecha com `]]` e mostra o menu com **Elementos** (lousa e imagens já citadas no roteiro) e **Ações** (poses, expressões, clipes criados). Enter insere; Esc fecha.
- Elementos: `Professor aponta para [[lousa]].` · `Erika [[mostra a imagem ciclo.png]]` (o menu insere a ação completa, porque "imagem" sozinha não diz o que fazer com ela).
- Ações: `Professor [[faz cara de feliz]].` · `Dario [[dança]].`
- Os colchetes simples continuam sendo comandos (`[nota: ...]`, `[câmera: lousa]`, `[música: ...]`).

## Prompt mestre (roteiro por qualquer IA)

Arquivo ▸ Prompt mestre para IA (ou a tela inicial) gera um texto único com o formato, todas as frases aceitas, os personagens, sprites, clipes, imagens e áudios da sua biblioteca. Cole-o em qualquer IA, traga a resposta de volta na segunda aba e o app a confere frase a frase. Um exemplo gerado está em `docs/prompt-mestre-exemplo.md`. O código fica em `src/shared/domain/prompt-mestre.ts` e os testes garantem que toda frase documentada no prompt é entendida pelo interpretador.

## Trilhas de áudio

A voz de cada personagem, os efeitos e a música ficam em trilhas separadas (uma faixa para cada na linha do tempo, com M = mudo e S = solo; o volume fica na aba Áudio e tudo vale no MP4). Para tocar mais de uma música ou efeito ao mesmo tempo, dê nome à trilha: `[música: chuva.wav, volume 20%, trilha ambiente]`, `[efeito: passos.wav, trilha passos]`. `[música: parar trilha ambiente]` para só aquela; `[música: parar]` para todas as músicas. Na mesma trilha de música, a nova substitui a anterior.
