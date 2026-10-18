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
      <p>O que é escrito na lousa se ajusta ao tamanho dela (quebra linhas e reduz a letra); se não couber nem na menor letra, o roteiro mostra um aviso para você resumir ou dividir a cena. Na aba <i>Aula</i> você escolhe a <b>fonte</b> da lousa e das falas (Comic Sans por padrão) e se a escrita aparece <b>só revelando</b> o conteúdo ou com uma <b>mão com marcador</b>.</p>
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
    id: 'exportar', titulo: 'Exportar vídeo',
    corpo: (<>
      <p><b>Exportar ▸ Vídeo MP4</b> (ou o botão laranja no palco) grava a animação em 1920×1080 (16:9, YouTube) ou 1080×1920 (9:16, Shorts), a 30 quadros por segundo. Acompanhe o progresso na barra e escolha onde salvar. No Android o arquivo é salvo e a folha de compartilhamento abre. <b>Quadro atual (PNG)</b> salva a imagem do instante mostrado.</p>
      <p>O áudio é gravado à parte: use a linha <C>[nota: …]</C> para lembrar o tom de cada fala e monte o som no seu editor de vídeo.</p>
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
