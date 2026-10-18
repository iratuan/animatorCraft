import { useState, type ReactNode } from 'react';
import { useEditor } from '@renderer/store/editor-store';

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
        <li><b>Painel lateral</b> (direita): <i>Propriedades</i> (poses e danças do personagem selecionado), <i>Biblioteca</i> (personagens e sequências prontas) e <i>Aula</i> (papéis, fontes, modelos e cheat-sheet).</li>
        <li><b>Linha do tempo</b> (embaixo): uma faixa por personagem, mais Câmera, Quadro e Direção.</li>
        <li><b>Barra de ferramentas</b> (esquerda, ícones): inserem trechos prontos no roteiro.</li>
      </ul>
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
          <tr><td><C>X faz a pose pular-corda por 3 segundos</C></td><td>usa um sprite pelo nome (poses novas dos pacotes)</td></tr>
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
        <li>O personagem já pode ser usado no roteiro (<C>Tia Marta entra pela esquerda andando.</C>) e aparece como stickman.</li>
        <li>Abra o <b>editor de sprites</b> para enviar os PNGs de cada pose e expressão (veja “Sprites”).</li>
      </ol>
      <p>Em <i>Propriedades</i> você edita a ficha dos personagens que criou, <b>duplica</b> qualquer personagem como ponto de partida e escolhe o estilo. Os do elenco original não podem ser excluídos. “Professor” e “Aluno” são papéis, não nomes, e não servem como apelido.</p>
      <p><b>Estilo (skin):</b> cada personagem pode ser <b>Chibi</b> (sprites desenhados) ou <b>Stickman</b> (boneco de palito de traço fino, com rosto, cabelo e óculos). A aba <i>Aula</i> define o padrão de todos. Quem não tem sprites aparece como stickman.</p>
    </>),
  },
  {
    id: 'sprites', titulo: 'Sprites: editar, exportar e importar',
    corpo: (<>
      <p><b>Arquivo ▸ Editar / exportar sprites dos personagens…</b> abre o editor: cada espaço padrão (poses, 10 expressões, bocas <C>a e o m</C>, piscada) aparece preenchido ou vazio. Clique para trocar ou criar o PNG daquele espaço; use <i>Criar a partir de um PNG</i> para poses e objetos novos.</p>
      <p><b>Nomes dos arquivos</b> (minúsculas, sem acento, hífen no lugar de espaço):</p>
      <ul>
        <li><C>pose_parado.png</C> é obrigatória (corpo inteiro, de frente). Outras: <C>pose_andar</C>, <C>pose_correr</C>, <C>pose_sentado</C>… Quadros de animação: <C>pose_andar_1</C>, <C>pose_andar_2</C>… (8 quadros por segundo).</li>
        <li><C>rosto_neutra</C>, <C>rosto_feliz</C>… (só a <b>cabeça</b>, com a mesma pele e cabelo). Fala: <C>rosto_boca-a</C>, <C>-e</C>, <C>-o</C>, <C>-m</C>. Piscada: <C>rosto_olhos-fechados</C>.</li>
        <li><C>prop_skate.png</C>: objetos soltos.</li>
      </ul>
      <p><b>Para editar fora do programa:</b> <i>Exportar (.zip)</i>, edite os PNGs em Photoshop, Krita ou Photopea mantendo os nomes e importe o zip em <b>Arquivo ▸ Importar pacote de sprites</b>. Pode devolver só o que mudou. O zip também leva a ficha dos personagens criados por você, então serve para passar um personagem para outro computador.</p>
      <p>Dicas: use PNG com fundo transparente (fundo branco é removido automaticamente); numa expressão nova copie <C>rosto_neutra</C> e mude só olhos e boca; o desenho final é convertido para escala de cinza.</p>
    </>),
  },
  {
    id: 'biblioteca', titulo: 'Biblioteca e sequências prontas',
    corpo: (<>
      <p>Na aba <i>Biblioteca</i>, clipes prontos (comemoração, encerramento, danças, reações, expressões) inserem um trecho de roteiro para o personagem selecionado. Na aba <i>Propriedades</i>, cada dança e pose é um botão que insere a frase correspondente.</p>
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
    id: 'ia', titulo: 'Roteiro com IA',
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
        <li><b>Arquivo ▸ Salvar projeto completo (.zip)</b> guarda roteiro, personagens criados, estilos, sprites trocados, áudios e preferências. <b>Abrir projeto</b> restaura tudo, inclusive em outro computador.</li>
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
        <li><b>“Não tem a pose …”:</b> importe um pacote com esse <C>pose_nome.png</C>; enquanto isso ele fica parado.</li>
        <li><b>O conteúdo ultrapassa a lousa:</b> resuma, ou divida em outra cena com <C># Título</C>.</li>
        <li><b>Voltar aos sprites originais:</b> <i>Arquivo ▸ Remover pacotes importados</i> e reabra o programa.</li>
      </ul>
    </>),
  },
];

/** Manual de uso, aberto pelo menu Ajuda. */
export function ManualModal() {
  const aberto = useEditor((s) => s.manualAberto);
  const set = useEditor((s) => s.set);
  const [ativo, setAtivo] = useState(SECOES[0]!.id);
  if (!aberto) return null;
  const fechar = () => set({ manualAberto: false });
  const sec = SECOES.find((s) => s.id === ativo) ?? SECOES[0]!;
  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal manual" role="dialog" aria-label="Manual de uso" onClick={(e) => e.stopPropagation()}>
        <nav>
          <h3>Manual de uso</h3>
          {SECOES.map((s) => <button key={s.id} className={s.id === ativo ? 'on' : ''} onClick={() => setAtivo(s.id)}>{s.titulo}</button>)}
          <button className="fechar" onClick={fechar}>Fechar</button>
        </nav>
        <article>
          <h2>{sec.titulo}</h2>
          {sec.corpo}
        </article>
      </div>
    </div>
  );
}


