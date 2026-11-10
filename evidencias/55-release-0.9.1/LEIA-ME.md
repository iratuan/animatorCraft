# 55 - Release 0.9.1 (animais no palco, expressões e tempo no roteiro)

## O que entrou nesta versão
- Paraíba e Mingau com corpo de quadrúpede no palco (cabeça, rosto, orelha, rabo e quatro patas).
- Pernas da pose de pular corrigidas (coxa para cima e para a frente, canela recolhida).
- Calças e sapatos pretos sólidos trocados pelo padrão lineart branco, como nos outros personagens.
- Expressões próprias de fábrica para Paraíba, Mingau, Véio, Véia, Elizendra, Artur e Carol.
- Roteiro: "às N s" fixa o início de uma ação; "por N segundos" dá a duração de fala, entrada, saída e pose.

## Testes
- Verificação completa (
pm run check): 254 testes unitários passam.
- Baterias de navegador (
pm run e2e): 20 de 20 passam.

## Evidências
- 01-apk-0.9.1-tela-inicial.png: APK 0.9.1 instalado e aberto no emulador (tela inicial, versão 0.9.1 no rodapé).
- 02-apk-0.9.1-modelo-com-paraiba-e-mingau.png: modelo "Confusão em Família com Pets" no emulador, com Paraíba e Mingau na linha do tempo.
- hashes.txt: tamanhos e SHA256 dos instaladores e do APK.

## Pendências conhecidas
- No celular em retrato, o palco fica pequeno (o painel de personagens ocupa a tela). Não foi corrigido nesta versão.
- Arrastar a borda de um bloco na linha do tempo ainda não muda a duração; a mudança é pelo texto "por N segundos".
- Os ângulos de correr e tropeçar foram verificados pelos números, não visualmente em todas as capturas.