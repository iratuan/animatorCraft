import { useEffect, useState, type ReactNode } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { Modal } from '@renderer/components/Modal';

declare const __APP_VERSION__: string;
const VERSAO = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';

interface Secao { id: string; titulo: string; corpo: ReactNode }
const C = ({ children }: { children: ReactNode }) => <code>{children}</code>;
const Ex = ({ children }: { children: string }) => <pre className="exemplo">{children}</pre>;

const SECOES: Secao[] = [
  {
    id: 'comeco', titulo: 'Primeiros passos',
    corpo: (<>
      <p>O StickBoard transforma um <b>roteiro em texto</b> (em português) numa animação de quadro branco com personagens, para gravar vídeos de ciências, matemática e inglês. A tela tem cinco áreas:</p>
      <ul>
        <li><b>Roteiro</b> (esquerda): onde você escreve. Cada frase vira uma ação.</li>
        <li><b>Palco</b> (centro): mostra a animação. Botões de reproduzir, parar e repetir, zoom e <i>Exportar MP4</i>. Os botões 16:9 e 9:16 trocam entre vídeo e Shorts.</li>
        <li><b>Painel lateral</b> (direita): <i>Personagem</i> (poses e danças do personagem selecionado), <i>Biblioteca</i> (personagens e sequências prontas), <i>Imagens</i>, <i>Áudio</i> e <i>Aula</i> (papéis, fontes, modelos e cheat-sheet).</li>
        <li><b>Linha do tempo</b> (embaixo): uma faixa por personagem, mais Câmera, Quadro e Direção.</li>
        <li><b>Barra de ferramentas</b> (esquerda, ícones): inserem trechos prontos no roteiro.</li>
      </ul>
      <p>Ao abrir o programa você cai na <b>tela inicial</b>: continue o último roteiro, comece um em branco ou de um modelo, ou peça o roteiro a uma IA com o <b>prompt mestre</b>. <b>Arquivo ▸ Tela inicial</b> volta para ela.</p>
      <p>Comece por <b>Arquivo ▸ Novo a partir do modelo</b> (matemática, ciências ou inglês), troque o que está entre <C>{'{chaves}'}</C> e aperte reproduzir.</p>
    </>),
  },
  {
    id: 'roteiro', titulo: 'Escrevendo o roteiro',
    corpo: (<>
      <p>Escreva em parágrafos. Cada frase termina em ponto e vira uma ou mais ações. Um título <C># Cena</C> inicia uma cena nova (o quadro é apagado entre cenas).</p>
      <Ex>{`[papéis: professor=CringeFather, aluno=BetaSon]

# Abertura
Professor entra pela esquerda andando. Aluno entra correndo pela direita.
Professor diz "Hoje vamos aprender produtos notáveis!" irritado.
Aluno diz "Produto o quê? Eu só vim pelo lanche!" confuso.

# Resolução
Professor escreve "Quadrado da soma" no quadro.
Professor escreve $(a+b)^2 = a^2 + 2ab + b^2$ no quadro.`}</Ex>
      <table>
        <tbody>
          <tr><td><C>X entra pela esquerda andando</C></td><td>entra (também <i>correndo</i>, <i>pela direita</i>, <i>pelo centro</i>); <C>sai</C> faz o contrário</td></tr>
          <tr><td><C>X diz "texto"</C></td><td>fala em balão (também grita, pergunta, responde, sussurra…). Um adjetivo no fim muda a expressão: irritado, confuso, feliz, triste, sarcástico, surpreso…</td></tr>
          <tr><td><C>X escreve "texto" no quadro</C></td><td>escreve na lousa. Fórmulas entre <C>$…$</C> usam LaTeX simples</td></tr>
          <tr><td><C>X aponta</C></td><td>aponta para a lousa</td></tr>
          <tr><td><C>X faz cara de brava</C></td><td>muda a expressão (neutra, feliz, triste, brava, surpresa, confusa, sarcástica, assustada, empolgada, entediada)</td></tr>
          <tr><td><C>X dança por 5 segundos</C></td><td>dança padrão do personagem; também pula, cruza os braços, tropeça, acena…</td></tr>
          <tr><td><C>X faz a pose pular-corda por 3 segundos</C></td><td>usa uma pose do boneco pelo nome (poses novas dos clipes)</td></tr>
          <tr><td><C>Espera 2 segundos.</C></td><td>pausa</td></tr>
          <tr><td><C>Apaga o quadro.</C></td><td>limpa a lousa</td></tr>
          <tr><td><C>[nota: gravar com voz impaciente]</C></td><td>anotação para você; não aparece no vídeo</td></tr>
        </tbody>
      </table>
      <p><b>Papéis:</b> o roteiro pode falar “Professor” e “Aluno”; a linha <C>[papéis: professor=Erika, aluno=Dario]</C> diz quem cumpre cada um nesta aula (a aba <i>Aula</i> escreve essa linha por você).</p>
      <p>O ícone de aviso no topo do roteiro lista o que não foi entendido e se o conteúdo ultrapassa a lousa.</p>
    </>),
  },
  {
    id: 'simultaneo', titulo: 'Ações ao mesmo tempo',
    corpo: (<>
      <p>Por padrão uma ação começa quando a anterior termina. Para animar um personagem enquanto outro fala:</p>
      <Ex>{`Enquanto Professor diz "Atenção!", Aluno dança por 6 segundos.
Aluno dança por 4 segundos enquanto Erika acena.
Professor diz "Oi". Ao mesmo tempo, Aluno pula.
Professor e Aluno dançam juntos.   (também: Todos dançam.)

Ao mesmo tempo: Professor diz "Um". Aluno diz "Dois". Erika acena.`}</Ex>
      <ul>
        <li><b>Enquanto…</b> e <b>Ao mesmo tempo,…</b> fazem a ação marcada começar junto com a anterior.</li>
        <li><b>Ao mesmo tempo:</b> (com dois-pontos) abre um bloco: tudo até o fim do parágrafo roda junto.</li>
        <li>A <b>próxima</b> ação sequencial espera a mais longa do grupo terminar.</li>
        <li>Dois personagens podem falar juntos: cada um mantém o seu balão e a sincronia da boca.</li>
      </ul>
      <p><b>Pela linha do tempo:</b> clique num bloco para vê-lo; arraste-o sobre outro bloco para que aconteçam juntos, ou para um espaço livre para ficar em sequência. Arraste a borda direita de uma pose com duração (ou de uma pausa) para mudar os segundos. Os botões “Junto com o anterior”, “Sequencial” e “Excluir” fazem o mesmo. Tudo isso reescreve o roteiro: o texto continua sendo a fonte da verdade e <b>Ctrl+Z</b> do editor de texto desfaz.</p>
    </>),
  },
  {
    id: 'camera', titulo: 'Câmera e lousa',
    corpo: (<>
      <ul>
        <li><C>[close na lousa]</C>: zoom só no conteúdo; os personagens somem.</li>
        <li><C>[close no professor]</C> (ou <C>aluno</C>, ou o nome do personagem): só o rosto.</li>
        <li><C>[plano aberto]</C>: volta ao palco inteiro.</li>
      </ul>
      <p>O que é escrito na lousa se ajusta ao tamanho dela (quebra linhas e reduz a letra); se não couber nem na menor letra, o roteiro mostra um aviso para você resumir ou dividir a cena. Na aba <i>Aula</i> você escolhe a <b>fonte</b> da lousa e das falas (Comic Sans por padrão). O texto, as equações e os gráficos <b>vão sendo revelados</b> aos poucos, sem mão nem caneta.</p>
    </>),
  },
  {
    id: 'posicao', titulo: 'Posicionar personagens',
    corpo: (<>
      <p><b>Arrastando no palco:</b> com o plano aberto, clique num personagem e arraste-o para onde quiser; ao soltar, o programa escreve no roteiro, logo depois da última ação que já terminou, a frase <C>Fulano fica na posição 45%.</C> (45% da largura do palco, da esquerda para a direita). Arrastar de novo o mesmo personagem no mesmo momento só troca o número. A mudança vale <b>dali em diante</b>; um clique simples só seleciona.</p>
      <p><b>Escrevendo:</b></p>
      <Ex>{`Professor fica na posição 30%.            (aparece direto lá)
Aluno anda para a posição 70%.            (caminha até lá, cerca de 1 s)
Erika entra pela direita na posição 60%.  (para de andar em 60%, em vez do ponto padrão)`}</Ex>
      <p>A posição tem duração zero e não atrasa as ações seguintes. Para mudar o lugar de um personagem só durante uma fala, use uma posição antes e outra depois.</p>
    </>),
  },
  {
    id: 'personagens', titulo: 'Personagens',
    corpo: (<>
      <p>O elenco original traz CringeFather, BetaSon, Erika, Dario, Laura, Elizendra, Artur e Carol. Você pode criar quantos quiser:</p>
      <ol>
        <li><b>Arquivo ▸ Novo personagem…</b> (ou <i>＋ Novo personagem</i> na Biblioteca). Informe o nome, outros nomes que o roteiro pode usar, idade, altura no palco, o boneco de palito base e a dança padrão.</li>
        <li>O personagem já pode ser usado no roteiro (<C>Tia Marta entra pela esquerda andando.</C>) e aparece como boneco de palito.</li>
      </ol>
      <p>Em <i>Personagem</i> você edita a ficha dos personagens que criou, <b>duplica</b> qualquer personagem como ponto de partida. Os do elenco original não podem ser excluídos. “Professor” e “Aluno” são papéis, não nomes, e não servem como apelido.</p>
      <p><b>Estilo:</b> todos os personagens são bonecos de palito, com traço preto, rosto, cabelo, óculos e roupas de cor de destaque. Cada um tem a sua personalidade: o humor vem das expressões, das poses e das danças.</p>
    </>),
  },
  {
    id: 'animacoes', titulo: 'Expressões e clipes de animação',
    corpo: (<>
      <p>Cada personagem pode ter <b>expressões próprias</b> e <b>clipes de animação</b> próprios. Abra em <b>Personagem ▸ Expressões e clipes de …</b> (ou <i>Arquivo ▸ Expressões e clipes do personagem…</i>); a <b>prévia</b> toca ao vivo, com o mesmo motor do vídeo.</p>
      <h4>Expressões</h4>
      <ul>
        <li><b>Rosto do boneco:</b> monte o rosto (olhos, boca, inclinação das sobrancelhas). Com mais de um quadro (até 4) a expressão é <b>animada</b>, 4 quadros por segundo.</li>
        <li>No roteiro: <C>Erika faz cara de apaixonada.</C> Nome que o personagem não tem gera um aviso.</li>
      </ul>
      <h4>Clipes</h4>
      <p>Um clipe é uma sequência de <b>passos</b>; cada passo tem uma pose do boneco, um movimento (balançar, pular, girar…), a duração, a intensidade (1 = normal) e se espelha. O clipe pode valer só para um estilo. Pode também <b>substituir uma pose padrão</b> só para aquele personagem (por exemplo, a “Dança atual” do Dario).</p>
      <Ex>{`Dario faz o clipe tchau.
Dario faz o clipe "dança do foguete" por 6 segundos.`}</Ex>
      <p>Sem “por N segundos” o clipe toca uma vez; com ele, repete (se o clipe estiver marcado para repetir). Expressões e clipes vão no <b>projeto completo</b> (e no arquivo do personagem, <C>animacoes.json</C>), então passam para outro computador.</p>
    </>),
  },
  {
    id: 'biblioteca', titulo: 'Biblioteca e sequências prontas',
    corpo: (<>
      <p>Na aba <i>Biblioteca</i>, clipes prontos (comemoração, encerramento, danças, reações, expressões) inserem um trecho de roteiro para o personagem selecionado. Na aba <i>Personagem</i>, cada dança e pose é um botão que insere a frase correspondente.</p>
    </>),
  },
  {
    id: 'imagens', titulo: 'Imagens na lousa',
    corpo: (<>
      <p>Para assuntos mais complexos, coloque uma imagem (PNG, JPG ou WebP) na lousa, junto com o texto, as equações e os gráficos.</p>
      <ol>
        <li><b>Clique no roteiro</b> onde a imagem deve aparecer (a frase vai entrar logo depois da frase em que está o cursor).</li>
        <li>Use o ícone de imagem da barra de ferramentas, <b>Arquivo ▸ Inserir imagem na lousa…</b> ou a aba <b>Imagens ▸ Importar imagem</b> e depois <i>Inserir no roteiro</i>. Escolha o arquivo: ele fica na biblioteca e passa a fazer parte da animação.</li>
      </ol>
      <Ex>{`Professor mostra a imagem ciclo.png no quadro.
Professor mostra a imagem ciclo.png no quadro no canto direito pequena com efeito deslizar da direita.
Professor mostra a imagem "meu desenho.png" no quadro com efeito zoom e sai com efeito surgir por 6 segundos.
Professor tira a imagem ciclo.png com efeito zoom.`}</Ex>
      <ul>
        <li><b>Efeitos</b> de entrada e de saída: <C>surgir</C> (aparece aos poucos), <C>deslizar da esquerda/direita/de cima/de baixo</C>, <C>zoom</C>, <C>revelar</C> (varre da esquerda para a direita) e <C>sem efeito</C>. Se não disser nada, entra com “surgir”.</li>
        <li><b>Tamanho</b> (<C>pequena</C>, média, <C>grande</C>) e <b>lugar</b> (centro, <C>no canto esquerdo</C> ou <C>direito</C>). A imagem entra na pilha da lousa, na ordem do roteiro, e a lousa se ajusta para caber tudo.</li>
        <li><b>Quanto tempo fica:</b> até <C>Apaga o quadro.</C> ou o fim da cena; com <C>por N segundos</C> sai sozinha depois desse tempo. <C>Professor tira a imagem …</C> retira só essa imagem.</li>
        <li><b>Pela linha do tempo:</b> clique no bloco da imagem para trocar entrada, saída, tamanho, lugar e tempo (a frase do roteiro é reescrita) ou para <b>Excluir imagem</b>. <b>Ctrl+Z</b> desfaz.</li>
        <li>As imagens ficam coloridas, como no arquivo, e vão dentro do projeto <C>.zip</C>. Se o roteiro citar uma imagem que não está na biblioteca, o roteiro avisa e a lousa marca o lugar.</li>
      </ul>
    </>),
  },
  {
    id: 'audio', titulo: 'Áudio: narração, música e efeitos',
    corpo: (<>
      <p>Grave a narração fora do programa (um arquivo por fala, em WAV, MP3, OGG ou M4A) e importe na aba <b>Áudio</b> (ou em <b>Arquivo ▸ Importar áudio…</b>). No roteiro:</p>
      <Ex>{`Professor diz "Bem-vindos à aula!". [áudio: abertura.wav]
[música: fundo.mp3, volume 25%]
[efeito: palmas.wav]
[música: parar]`}</Ex>
      <ul>
        <li><b>[áudio: …]</b> logo depois da fala: a fala passa a durar o tempo do áudio e a <b>boca acompanha o volume da voz</b>. A etiqueta faz parte da fala (mover ou excluir a fala leva a etiqueta).</li>
        <li><b>[música: …]</b> toca até <C>[música: parar]</C> ou o fim, repete se for curta e some aos poucos no final. <b>[efeito: …]</b> toca neste ponto e não atrasa nada.</li>
        <li>Os botões da aba Áudio (Ouvir, Narrar a última fala, Música, Efeito) inserem a etiqueta certa por você. A faixa “Áudio” da linha do tempo mostra o que toca e quando.</li>
        <li>O <b>MP4 sai com o som</b> (AAC, ou Opus se o aparelho não tiver AAC). Se o aparelho não codificar áudio, o programa avisa e exporta sem som.</li>
      </ul>
    </>),
  },
  {
    id: 'graficos', titulo: 'Gráficos',
    corpo: (<>
      <Ex>{`Professor desenha o gráfico de y = x^2 - 2 no quadro.
Professor desenha o gráfico de y = sen(x) de -6 a 6 no quadro.
Professor desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3 no quadro.
Professor desenha um gráfico de pizza: Sim=70, Não=30 no quadro.`}</Ex>
      <p>Funções aceitam <C>+ − * / ^</C>, parênteses, multiplicação implícita (<C>2x</C>), <C>sen cos tan raiz abs ln log exp</C> e <C>pi</C>. O gráfico é traçado aos poucos: eixos, curva (ou barras uma a uma, ou a pizza girando). Se a função não for entendida, o roteiro mostra um aviso.</p>
      <p>Assim como o texto e as equações, o gráfico vai sendo revelado na lousa, sem mão nem caneta.</p>
    </>),
  },
  {
    id: 'barra', titulo: 'Barra de ferramentas e painéis',
    corpo: (<>
      <p>Logo abaixo dos menus fica a <b>barra de ferramentas</b>, com os atalhos mais usados: <i>Início, Novo, Abrir, Salvar</i> (projeto), <i>Desfazer/Refazer</i>, <i>Personagem</i> (novo), <i>Clipes</i> (expressões e clipes), <i>Prompt IA</i>, <i>MP4</i>, <i>Legendas</i>, <i>PNG</i> e <i>Manual</i>. Todo botão também está num menu, com o mesmo ícone. Quando a janela é estreita, os botões que não cabem ficam no menu <i>Mais</i>.</p>
      <p><b>Painéis redimensionáveis:</b> arraste a divisória entre o roteiro e o palco, entre o palco e o painel lateral, e acima da linha do tempo. Duplo clique restaura o tamanho; com a divisória focada, as setas movem de 10 em 10 px (Shift = 50). Os tamanhos ficam guardados.</p>
    </>),
  },
  {
    id: 'trilhas', titulo: 'Trilhas de áudio',
    corpo: (<>
      <p>Cada fala narrada vai para a trilha de voz do seu personagem; efeitos e músicas têm trilhas próprias. Na linha do tempo há <b>uma faixa por trilha</b> com <b>M</b> (mudo) e <b>S</b> (solo); na aba <i>Áudio ▸ Trilhas da aula</i> cada trilha tem um controle de volume. A mixagem vale na reprodução (ao vivo) e no MP4, e é guardada no projeto.</p>
      <Ex>{`[música: fundo.mp3, volume 25%]
[música: chuva.wav, volume 20%, trilha ambiente]
[efeito: passos.wav, trilha passos]
[música: parar trilha ambiente]`}</Ex>
      <p>Trilhas com nomes diferentes tocam juntas; na mesma trilha de música a nova substitui a anterior. <C>[música: parar]</C> para todas as músicas.</p>
    </>),
  },  {
    id: 'prompt-mestre', titulo: 'Prompt mestre (roteiro com qualquer IA)',
    corpo: (<>
      <p>O <b>prompt mestre</b> é um texto único que ensina qualquer IA (Claude, ChatGPT, Gemini, Llama, Copilot…) a escrever roteiros que o StickBoard entende de primeira. Abra-o pela <b>tela inicial</b> (“Gerar roteiro com qualquer IA”) ou em <b>Arquivo ▸ Prompt mestre para IA…</b>.</p>
      <ol>
        <li><b>Copiar o prompt:</b> informe o assunto, a matéria, a série, a duração e quem faz o Professor e o Aluno; clique em <i>Copiar prompt</i> (ou <i>Salvar como arquivo</i>) e cole na IA que preferir.</li>
        <li><b>Colar o roteiro da IA:</b> cole a resposta na segunda aba. O app ignora conversa e cercas de código, confere cada frase com o interpretador e lista o que não entendeu — cole esses avisos de volta na IA pedindo a correção. Quando estiver sem avisos, <i>Substituir</i> ou <i>Acrescentar</i> ao roteiro (Ctrl+Z desfaz).</li>
      </ol>
      <p>O prompt <b>carrega tudo dentro dele</b>, gerado na hora a partir da sua biblioteca: o formato do arquivo, todas as frases aceitas (entrar, falar, estados, poses, danças, lousa, fórmulas, gráficos, imagens com efeitos, câmera, áudio e ações simultâneas), as armadilhas mais comuns, sequências prontas, um exemplo completo e <b>os seus personagens</b> com apelidos, expressões extras, poses, clipes, e os nomes das <b>imagens</b> e <b>áudios</b> que você importou. Ao criar um personagem, um clipe ou importar um arquivo, o prompt seguinte já os inclui.</p>
      <p>“Melhorar o roteiro atual” gera um prompt que leva o seu roteiro junto, para a IA reescrevê-lo seguindo o seu pedido.</p>
    </>),
  },  {
    id: 'ia', titulo: 'Roteiro com IA (direto no app)',
    corpo: (<>
      <p><b>Arquivo ▸ Gerar / melhorar roteiro com IA…</b> escreve o roteiro por você: informe assunto, matéria, série, duração, quem é o professor e o aluno e quem mais pode aparecer. O programa envia as regras do formato e a lista dos seus personagens e <b>confere a resposta com o próprio interpretador</b>: se algo não for entendido, pede a correção à IA (até duas vezes). Depois você escolhe <i>Substituir</i> ou <i>Acrescentar</i>; <b>Ctrl+Z</b> desfaz.</p>
      <p>O modo <i>Melhorar o roteiro atual</i> acrescenta reações e gestos enquanto os outros falam, ou segue o pedido que você escrever.</p>
      <p><b>Serviço:</b> Claude (Anthropic), OpenAI, OpenRouter (há modelos gratuitos), Groq (camada gratuita), Ollama no seu computador (sem chave, com <C>OLLAMA_ORIGINS=*</C>) ou qualquer serviço compatível. A chave fica só neste aparelho e só é enviada ao endereço configurado. Sem chave não há como gerar, e o resto do programa funciona normalmente.</p>
    </>),
  },
  {
    id: 'projeto', titulo: 'Projeto, desfazer e legendas',
    corpo: (<>
      <ul>
        <li><b>Desfazer / Refazer:</b> <b>Ctrl+Z</b> e <b>Ctrl+Y</b> (menu Editar) desfazem qualquer edição do roteiro: digitar, arrastar na linha do tempo ou no palco, inserir da biblioteca, aplicar IA.</li>
        <li><b>Arquivo ▸ Salvar projeto completo (.zip)</b> guarda roteiro, personagens criados, estilos, áudios e preferências. <b>Abrir projeto</b> restaura tudo, inclusive em outro computador.</li>
        <li><b>Exportar ▸ Vídeo MP4 nos dois formatos</b> gera o 16:9 e o 9:16 em sequência.</li>
        <li><b>Exportar ▸ Legendas das falas (.srt)</b> cria as legendas a partir das falas (e dos áudios) para enviar ao YouTube.</li>
        <li>Clique no nome de uma cena na régua da linha do tempo para pular até ela.</li>
      </ul>
    </>),
  },
  {
    id: 'exportar', titulo: 'Exportar vídeo',
    corpo: (<>
      <p><b>Exportar ▸ Vídeo MP4</b> (ou o botão laranja no palco) grava a animação em 1920×1080 (16:9, YouTube) ou 1080×1920 (9:16, Shorts), a 30 quadros por segundo. Acompanhe o progresso na barra e escolha onde salvar. No Android o arquivo é salvo e a folha de compartilhamento abre. <b>Quadro atual (PNG)</b> salva a imagem do instante mostrado.</p>
      <p>O áudio importado (narração, música e efeitos) entra no MP4; veja a seção de áudio. Use <C>[nota: …]</C> para lembrar o tom de cada fala.</p>
    </>),
  },
  {
    id: 'solucao', titulo: 'Dúvidas comuns',
    corpo: (<>
      <ul>
        <li><b>“Ação não entendida”:</b> use um verbo conhecido (veja a tabela do roteiro) e ponha o texto falado entre aspas.</li>
        <li><b>Personagem aparece como palito:</b> ele ainda não tem <C>pose_parado.png</C>, ou o estilo está em Stickman.</li>
        <li><b>O conteúdo ultrapassa a lousa:</b> resuma, ou divida em outra cena com <C># Título</C>.</li>
      </ul>
    </>),
  },
  {
    id: 'sobre', titulo: 'Sobre o StickBoard',
    corpo: (<>
      <p><b>StickBoard {VERSAO}</b> — gerador de vídeos de quadro branco com personagens animados, para aulas de ciências, matemática e inglês.</p>
      <p>Os personagens do elenco (CringeFather, BetaSon, Erika, Dario, Laura, Elizendra, Artur, Carol, Véia, Véio, Paraíba e Mingau) são todos bonecos de palito. Tudo o que você cria (roteiros, personagens, áudios, imagens) fica no seu computador; nada é enviado a lugar nenhum, exceto o pedido à IA que você mesmo configurar em <i>Gerar roteiro com IA</i>.</p>
      <p>Atalhos: <b>F1</b> manual · <b>Espaço</b> tocar/pausar · <b>Ctrl+Z / Ctrl+Y</b> desfazer/refazer.</p>
    </>),
  },];

/** Manual de uso, aberto pelo menu Ajuda. */
export function ManualModal() {
  const aberto = useEditor((s) => s.manualAberto);
  const set = useEditor((s) => s.set);
  const secaoPedida = useEditor((s) => s.manualSecao);
  const [ativo, setAtivo] = useState(SECOES[0]!.id);
  useEffect(() => { if (aberto && secaoPedida) setAtivo(secaoPedida); }, [aberto, secaoPedida]);
  if (!aberto) return null;
  const fechar = () => set({ manualAberto: false, manualSecao: null });
  const sec = SECOES.find((s) => s.id === ativo) ?? SECOES[0]!;
  return (
    <Modal titulo="Manual de uso" classe="manual" sujo={false} onFechar={fechar}>
        <nav>
          <h3>Manual de uso</h3>
          {SECOES.map((s) => <button key={s.id} className={s.id === ativo ? 'on' : ''} onClick={() => setAtivo(s.id)}>{s.titulo}</button>)}
          <button className="fechar" onClick={fechar}>Fechar</button>
        </nav>
        <article>
          <h2>{sec.titulo}</h2>
          {sec.corpo}
        </article>
    </Modal>
  );
}


