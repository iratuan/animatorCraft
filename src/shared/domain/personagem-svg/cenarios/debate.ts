/**
 * Gerador de Elementos e Cenário Vetorial SVG para DEBATE
 * Estilo Whiteboard Stickman
 */

export function gerarSvgMesaDebate(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 240" width="100%" height="100%">
  <!-- Tampo da mesa de debate trapezoidal -->
  <polygon points="40,55 880,55 910,185 10,185" fill="#ffffff" stroke="#14161a" stroke-width="4" stroke-linejoin="round"/>
  <!-- Chanfro e divisão dos setores dos debatedores -->
  <polygon points="50,45 870,45 880,55 40,55" fill="#f8f9fa" stroke="#14161a" stroke-width="2"/>
  
  <!-- Divisória central / painel mediador -->
  <rect x="360" y="75" width="200" height="90" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <text x="460" y="115" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle" fill="#14161a" letter-spacing="3">GRANDE DEBATE</text>
  <text x="460" y="142" font-family="sans-serif" font-weight="700" font-size="13" text-anchor="middle" fill="#14161a">MEDIAÇÃO</text>

  <!-- Púlpitos / Microfones de mesa Gooseneck integrados -->
  <!-- Mic Lado A -->
  <g transform="translate(180, 50)">
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <path d="M 0,0 Q -10,-40 10,-70" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
    <rect x="6" y="-82" width="8" height="15" rx="3" fill="#14161a"/>
  </g>

  <!-- Mic Mediador -->
  <g transform="translate(460, 48)">
    <ellipse cx="0" cy="0" rx="14" ry="5" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <path d="M 0,0 Q 0,-30 0,-60" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
    <rect x="-4" y="-72" width="8" height="15" rx="3" fill="#14161a"/>
  </g>

  <!-- Mic Lado B -->
  <g transform="translate(740, 50)">
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <path d="M 0,0 Q 10,-40 -10,-70" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
    <rect x="-14" y="-82" width="8" height="15" rx="3" fill="#14161a"/>
  </g>

  <!-- Pés reforçados da mesa de debate -->
  <line x1="120" y1="185" x2="120" y2="235" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  <line x1="460" y1="185" x2="460" y2="235" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  <line x1="800" y1="185" x2="800" y2="235" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
</svg>`;
}

export function gerarSvgCronometroDebate(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="100%" height="100%">
  <!-- Display de cronômetro digital do debate -->
  <rect x="10" y="10" width="220" height="120" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="4"/>
  <!-- Moldura interna preta do display digital -->
  <rect x="25" y="25" width="190" height="70" rx="6" fill="#14161a"/>
  <!-- Dígitos 01:30 em estilo digital LCD -->
  <text x="120" y="75" font-family="monospace, monospace" font-weight="900" font-size="44" text-anchor="middle" fill="#ffffff" letter-spacing="4">01:30</text>
  <!-- Luzes de aviso de tempo (Verde, Amarela, Vermelha) -->
  <circle cx="60" cy="112" r="7" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
  <circle cx="120" cy="112" r="7" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
  <circle cx="180" cy="112" r="7" fill="#14161a" stroke="#14161a" stroke-width="2"/>
  <!-- Haste do pedestal -->
  <line x1="120" y1="130" x2="120" y2="155" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <line x1="80" y1="155" x2="160" y2="155" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}

export function gerarSvgMicrofoneMesa(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 140" width="100%" height="100%">
  <!-- Base de mesa pesada -->
  <ellipse cx="40" cy="125" rx="30" ry="10" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <circle cx="40" cy="123" r="4" fill="#14161a"/>
  <!-- Haste pescoço de ganso (Gooseneck) articulável -->
  <path d="M 40,120 Q 25,60 55,25" fill="none" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
  <!-- Anel de LED indicador de fala ativa -->
  <ellipse cx="56" cy="23" rx="7" ry="3" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
  <!-- Cápsula direcional do microfone -->
  <g transform="translate(56, 20) rotate(35)">
    <rect x="-5" y="-18" width="10" height="22" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <line x1="-5" y1="-8" x2="5" y2="-8" stroke="#14161a" stroke-width="1.2"/>
    <line x1="-5" y1="0" x2="5" y2="0" stroke="#14161a" stroke-width="1.2"/>
  </g>
</svg>`;
}

export function gerarSvgCenarioCompletoDebate(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <!-- Fundo auditório de debate -->
  <rect width="1280" height="720" fill="#ffffff"/>
  
  <!-- Linhas de perspectiva do auditório / palco -->
  <line x1="0" y1="520" x2="1280" y2="520" stroke="#14161a" stroke-width="2"/>
  <line x1="0" y1="200" x2="350" y2="280" stroke="#14161a" stroke-width="1.5" stroke-dasharray="8 6"/>
  <line x1="1280" y1="200" x2="930" y2="280" stroke="#14161a" stroke-width="1.5" stroke-dasharray="8 6"/>

  <!-- Painel de Fundo com tema do debate -->
  <g transform="translate(420, 60)">
    <rect x="0" y="0" width="440" height="150" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="3.5"/>
    <rect x="15" y="15" width="410" height="120" rx="8" fill="#f8f9fa" stroke="#14161a" stroke-width="1.5" stroke-dasharray="4 4"/>
    <text x="220" y="55" font-family="sans-serif" font-weight="900" font-size="28" text-anchor="middle" fill="#14161a" letter-spacing="4">DEBATE DE IDEIAS</text>
    <text x="220" y="90" font-family="sans-serif" font-weight="700" font-size="16" text-anchor="middle" fill="#14161a">TEMPORADA OFICIAL DE DISCUSSÕES</text>
    <!-- Balões de fala opostos estilizados -->
    <path d="M 60,115 Q 80,100 110,105 Q 120,120 100,125 L 85,130 Z" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <path d="M 380,115 Q 360,100 330,105 Q 320,120 340,125 L 355,130 Z" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
  </g>

  <!-- Cronômetro Oficial Flutuante de Tempo de Fala -->
  <g transform="translate(540, 230)">
    <rect x="0" y="0" width="200" height="90" rx="10" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
    <rect x="15" y="15" width="170" height="50" rx="5" fill="#14161a"/>
    <text x="100" y="52" font-family="monospace, monospace" font-weight="900" font-size="36" text-anchor="middle" fill="#ffffff" letter-spacing="3">01:30</text>
    <circle cx="50" cy="78" r="5" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>
    <circle cx="100" cy="78" r="5" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>
    <circle cx="150" cy="78" r="5" fill="#14161a" stroke="#14161a" stroke-width="1.5"/>
  </g>

  <!-- Cadeira do debatedor esquerdo -->
  <rect x="230" y="310" width="100" height="130" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <!-- Cadeira do mediador central -->
  <rect x="590" y="310" width="100" height="130" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <!-- Cadeira do debatedor direito -->
  <rect x="950" y="310" width="100" height="130" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>

  <!-- Mesa Principal do Debate -->
  <g transform="translate(180, 430)">
    <polygon points="30,45 890,45 920,180 0,180" fill="#ffffff" stroke="#14161a" stroke-width="4" stroke-linejoin="round"/>
    <polygon points="40,35 880,35 890,45 30,45" fill="#f8f9fa" stroke="#14161a" stroke-width="2"/>
    
    <!-- Painel central da mediação -->
    <rect x="360" y="70" width="200" height="85" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <text x="460" y="112" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle" fill="#14161a" letter-spacing="3">GRANDE DEBATE</text>
    <text x="460" y="136" font-family="sans-serif" font-weight="700" font-size="12" text-anchor="middle" fill="#14161a">MEDIAÇÃO</text>

    <!-- Microfones dos 3 participantes -->
    <!-- Debatedor 1 (Esquerda) -->
    <g transform="translate(130, 40)">
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <path d="M 0,0 Q -8,-35 12,-65" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
      <rect x="8" y="-76" width="8" height="14" rx="3" fill="#14161a"/>
    </g>

    <!-- Mediador (Centro) -->
    <g transform="translate(460, 38)">
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <path d="M 0,0 Q 0,-30 0,-60" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
      <rect x="-4" y="-72" width="8" height="14" rx="3" fill="#14161a"/>
    </g>

    <!-- Debatedor 2 (Direita) -->
    <g transform="translate(790, 40)">
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <path d="M 0,0 Q 8,-35 -12,-65" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
      <rect x="-16" y="-76" width="8" height="14" rx="3" fill="#14161a"/>
    </g>

    <!-- Pés da mesa -->
    <line x1="80" y1="180" x2="80" y2="250" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
    <line x1="460" y1="180" x2="460" y2="250" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
    <line x1="840" y1="180" x2="840" y2="250" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>`;
}
