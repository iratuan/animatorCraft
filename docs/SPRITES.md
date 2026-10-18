# Padrão de nomes dos sprites

Para trocar ou acrescentar sprites de um personagem, monte um **.zip** com PNGs nomeados assim. O app (Arquivo → Importar pacote de sprites…) ou eu (importador de linha de comando) lemos o zip, validamos os nomes e a biblioteca e as animações se ajustam ao que veio.

## Estrutura

```
meu-pacote.zip
└── betason/                          pasta = id do personagem (ou use o prefixo: betason_pose_parado.png)
    ├── meta.json                     opcional (veja abaixo)
    ├── pose_parado.png               OBRIGATÓRIA: personagem de frente, em pé
    ├── pose_andar_1.png              quadros de uma animação: _1, _2, _3...
    ├── pose_andar_2.png
    ├── pose_comemorar.png            pose única
    ├── pose_bracos-cruzados.png
    ├── rosto_feliz.png               cabeça com uma expressão
    ├── rosto_boca-a.png              cabeça falando "A"      ┐
    ├── rosto_boca-e.png              cabeça falando "E"      │ sincronia labial
    ├── rosto_boca-o.png              cabeça falando "O/U"    │
    ├── rosto_boca-m.png              lábios juntos "M/B/P"   ┘
    ├── rosto_olhos-fechados.png      cabeça piscando
    └── prop_skate.png                objetos (uso futuro)
```

Ids de personagem: `cringefather`, `betason`, `erika`, `dario`, `laura`, `elizendra`, `artur`, `carol`.

## Regras de nome

`<tipo>_<nome>[_<n>].png`, tudo em **minúsculas, sem acento**, hífen dentro do nome (`bracos-cruzados`) e **underscore só como separador**.

| Tipo | Nome | Para que serve |
|---|---|---|
| `pose` | livre (`parado`, `andar`, `comemorar`, `skate`...) | Corpo. Uma imagem = uma pose. Várias com `_1`, `_2`... = **quadros de uma animação** (8 quadros por segundo). Nomes que o app não conhece viram "pose nova". |
| `rosto` | uma expressão (`neutra`, `feliz`, `triste`, `brava`, `surpresa`, `confusa`, `sarcastica`, `assustada`, `empolgada`, `entediada`) ou `boca-a`, `boca-e`, `boca-o`, `boca-m`, `olhos-fechados` | Cabeça que entra por cima da cabeça do corpo (só na pose de frente). Expressões respondem a `faz cara de feliz`; `boca-*` acompanham a fala; `olhos-fechados` é a piscada. |
| `prop` | livre | Objetos. |

## Como o roteiro usa os nomes

- Poses conhecidas continuam com as frases de sempre (`pula`, `cruza os braços`, `dança funky`...).
- **Qualquer pose do pacote** serve com: `Betason faz a pose skate.` / `Dario faz a pose pular-corda por 3 segundos.` Se o personagem não tiver o sprite, o editor avisa.
- Animação por quadros: `pose_andar_1..4` vira o ciclo de caminhada automaticamente.
- Rostos: `Erika faz cara de brava.` troca a cabeça; enquanto fala, a boca troca sozinha (`boca-a/e/o/m`) e o personagem pisca (`olhos-fechados`).

## Tamanho e fundo

- Fundo **transparente**. Se o PNG vier com fundo branco, o app remove o branco ligado às bordas.
- As bordas vazias são aparadas automaticamente; mantenha a **mesma escala** entre as poses do personagem.
- Resolução alta (altura de 1000 a 2000 px) para o close ficar nítido.
- Personagem sempre **virado para a direita** nas poses de lado (o app espelha quando precisa).
- `rosto_*`: só a cabeça (cabelo e pescoço), com o mesmo ângulo e tamanho em todas.

## meta.json (opcional, por personagem)

```json
{
  "cabeca": { "x": 0.12, "y": 0.0, "w": 0.7, "h": 0.28 },
  "ancora": { "gesticular": "topo", "bracos-cruzados": "topo" }
}
```

- `cabeca`: caixa da cabeça em frações (0 a 1) do `pose_parado`. Define o enquadramento do `[close no personagem]` e onde os `rosto_*` encaixam.
- `ancora`: poses cortadas na cintura alinham pelo `topo` (a cabeça fica na altura da pose parada) em vez dos `pes`.

## Importar

- **No app:** Arquivo → Importar pacote de sprites (.zip)… mostra o relatório (erros bloqueiam; avisos não). Marque "Substituir" quando o pacote traz a ficha completa. Fica salvo no navegador.
- **No projeto (definitivo):** `node tools/sprites/importar-sprites.mjs pacote.zip` grava os sprites em `apps/web/src/assets/personagens/` e atualiza o manifesto; depois é só recompilar.

## Exportar para editar e importar de volta

- **Arquivo ▸ Editar / exportar sprites dos personagens…** (ou o botão no painel Propriedades) abre o editor: cada espaço padrão (poses, 10 expressões, bocas `a/e/o/m`, piscada) aparece preenchido ou vazio (`+`). Clique para trocar ou criar o PNG daquele espaço; “Criar a partir de um PNG…” cria poses/objetos novos.
- **Exportar (.zip)** gera `<personagem>/pose_*.png`, `rosto_*.png`, `prop_*.png`, `meta.json` e `FALTANDO.txt` (o que ainda pode ser criado), mais um `LEIA-ME.txt` com as regras. Edite os PNGs em qualquer programa, **mantendo os nomes**, e importe o zip em Arquivo ▸ Importar pacote. Pode devolver só os arquivos alterados.
- Rostos: só a cabeça, com a mesma pele/cabelo/óculos; para uma expressão nova copie `rosto_neutra` e mude olhos, sobrancelhas e boca. O encaixe sobre o corpo é guardado em `meta.json` (`encaixe`, medido sobre o `pose_parado` de tamanho `base`); se mudar o tamanho do `pose_parado`, o app recalcula pela caixa da cabeça.

## Receitas das fichas (atlas)

`tools/sprites/segmentar-atlas.mjs <atlas.png> <pasta>` recorta cada sprite de uma ficha (fundo transparente ou branco/xadrez) e gera `diagnostico.png` com os números; `tools/sprites/folha-contato.mjs` monta uma grade numerada dos recortes. `tools/sprites/receitas/<personagem>.json` diz qual número vira qual nome (`pose_*`, `rosto_*`, `prop_*`) e `node tools/sprites/montar-biblioteca.mjs <personagem>` normaliza a escala, mede o encaixe das cabeças e grava os sprites e o manifesto.

## Editor de imagem integrado

Cada espaço do editor de sprites abre um editor de imagem (camadas, pincel, lápis, borracha, balde, conta-gotas, seleções, formas, texto, mover/escalar/girar, zoom e desfazer). `Salvar no sprite` grava o PNG achatado, **sem remover fundo nem aparar**, para o mesmo nome padrão (`pose_*`, `rosto_*`, `prop_*`; quadros de animação como `pose_correr_2`). Rostos editados mantêm o encaixe medido enquanto a tela tiver o mesmo tamanho.
O núcleo (pixels, camadas, pincel, balde, seleção, histórico) está em `src/shared/editor-imagem` e é testado em Node; a interface está em `src/renderer/features/editor-imagem`.
