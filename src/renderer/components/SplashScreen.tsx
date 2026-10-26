import { useEffect, useState } from 'react';
import { carregarFontesDoApp, carregarImagensEAudios, prepararPersonagens } from '@renderer/bootstrap';

interface SplashScreenProps {
  duracaoMinimaMs?: number;
  onFinalizar?: () => void;
}

export function SplashScreen({ duracaoMinimaMs = 1000, onFinalizar }: SplashScreenProps) {
  const [progresso, setProgresso] = useState(15);
  const [etapaTexto, setEtapaTexto] = useState('Carregando fontes caligráficas da lousa…');
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    let montado = true;
    const inicio = Date.now();

    const executarInicializacao = async () => {
      try {
        // Etapa 1: Fontes
        setProgresso(25);
        setEtapaTexto('Carregando fontes caligráficas da lousa…');
        await carregarFontesDoApp().catch(() => undefined);

        if (!montado) return;

        // Etapa 2: Áudio e Mídias
        setProgresso(55);
        setEtapaTexto('Inicializando banco de vozes e áudio…');
        await carregarImagensEAudios().catch(() => undefined);

        if (!montado) return;

        // Etapa 3: Elenco e Personagens
        setProgresso(85);
        setEtapaTexto('Preparando o elenco…');
        prepararPersonagens();

        if (!montado) return;

        // Etapa 4: Concluído
        setProgresso(100);
        setEtapaTexto('Pronto!');

        // Garantir tempo mínimo para transição suave sem flicker
        const decorrido = Date.now() - inicio;
        const restante = Math.max(0, duracaoMinimaMs - decorrido);

        await new Promise((resolve) => setTimeout(resolve, restante));

        if (!montado) return;

        // Fade-out suave
        setSaindo(true);
        setTimeout(() => {
          if (montado && onFinalizar) {
            onFinalizar();
          }
        }, 380);
      } catch {
        // Fallback gracioso em caso de qualquer exceção
        if (montado) {
          setSaindo(true);
          setTimeout(() => onFinalizar?.(), 300);
        }
      }
    };

    void executarInicializacao();

    return () => {
      montado = false;
    };
  }, [duracaoMinimaMs, onFinalizar]);

  return (
    <div
      className={`splash-tela ${saindo ? 'saindo' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Inicializando StickBoard"
      data-teste="splash-screen"
    >
      <div className="splash-conteudo">
        <div className="splash-arte-stickman" aria-hidden="true">
          <svg className="splash-svg-lousa" viewBox="0 0 200 120" role="img">
            {/* Lousa com moldura e efeito de giz */}
            <rect x="70" y="10" width="120" height="90" rx="6" className="splash-lousa-borda" />
            <rect x="74" y="14" width="112" height="82" rx="4" className="splash-lousa-fundo" />
            <line x1="86" y1="35" x2="160" y2="35" className="splash-traco-giz giz-1" />
            <line x1="86" y1="52" x2="175" y2="52" className="splash-traco-giz giz-2" />
            <line x1="86" y1="69" x2="140" y2="69" className="splash-traco-giz giz-3" />
            <circle cx="162" cy="69" r="3" className="splash-ponto-giz" />

            {/* Suporte da Lousa */}
            <path d="M100 100 L95 115 M160 100 L165 115" className="splash-pes-lousa" />

            {/* Stickman animado desenhando na lousa */}
            <g className="splash-stickman">
              {/* Cabeça */}
              <circle cx="45" cy="35" r="14" className="splash-stick-corpo" />
              {/* Tronco */}
              <line x1="45" y1="49" x2="45" y2="85" className="splash-stick-corpo" />
              {/* Braço que desenha na lousa */}
              <path d="M45 56 L62 50 L84 42" className="splash-stick-braco-giz" />
              {/* Giz na ponta da mão */}
              <circle cx="85" cy="41" r="2.5" className="splash-giz-ponta" />
              {/* Outro braço apoiado na cintura */}
              <path d="M45 56 L32 66 L42 74" className="splash-stick-corpo" />
              {/* Pernas */}
              <path d="M45 85 L32 112 M45 85 L58 112" className="splash-stick-corpo" />
            </g>
          </svg>
        </div>

        <div className="splash-identidade">
          <div className="splash-titulo" aria-hidden="true">
            <span className="splash-titulo-stick">Stick</span>
            <span className="splash-titulo-board">Board</span>
          </div>
          <p className="splash-assinatura">
            Gerador de vídeos whiteboard com personagens animados
          </p>
        </div>

        <div className="splash-progresso-container">
          <div
            className="splash-barra-progresso"
            role="progressbar"
            aria-valuenow={progresso}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="splash-barra-preenchimento"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <div className="splash-status">
            <span className="splash-etapa-texto">{etapaTexto}</span>
            <span className="splash-porcentagem">{progresso}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
