/**
 * Gerador de Elementos e Cenário Vetorial SVG para TELEJORNAL / DROPS
 * Estilo Whiteboard Stickman
 */

export function gerarSvgBancadaTelejornal(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 240" width="100%" height="100%">
  <!-- Tampo curvo e futurista da bancada de telejornal -->
  <path d="M 40,65 Q 420,35 800,65 L 750,195 Q 420,165 90,195 Z" fill="#ffffff" stroke="#14161a" stroke-width="4" stroke-linejoin="round"/>
  <!-- Borda superior chanfrada de iluminação de estúdio -->
  <path d="M 40,65 Q 420,35 800,65 L 790,78 Q 420,48 50,78 Z" fill="#f1f3f5" stroke="#14161a" stroke-width="2"/>
  <!-- Painel frontal com logo de jornalismo stickman -->
  <rect x="260" y="95" width="320" height="70" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <text x="420" y="140" font-family="sans-serif" font-weight="900" font-size="24" text-anchor="middle" fill="#14161a" letter-spacing="6">NEWS 24H</text>
  <!-- Tablet e folhas de pauta sobre a bancada -->
  <g transform="translate(360, 52) rotate(-5)">
    <rect x="0" y="0" width="45" height="30" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <rect x="5" y="4" width="35" height="22" rx="2" fill="none" stroke="#14161a" stroke-width="1.2"/>
  </g>
  <g transform="translate(435, 54) rotate(4)">
    <polygon points="0,0 35,0 35,25 0,25" fill="#ffffff" stroke="#14161a" stroke-width="1.8"/>
    <line x1="5" y1="6" x2="30" y2="6" stroke="#14161a" stroke-width="1"/>
    <line x1="5" y1="12" x2="25" y2="12" stroke="#14161a" stroke-width="1"/>
    <line x1="5" y1="18" x2="28" y2="18" stroke="#14161a" stroke-width="1"/>
  </g>
  <!-- Base metálica estrutural -->
  <line x1="160" y1="195" x2="160" y2="235" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  <line x1="680" y1="195" x2="680" y2="235" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  <line x1="120" y1="235" x2="200" y2="235" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
  <line x1="640" y1="235" x2="720" y2="235" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}

export function gerarSvgPainelNoticias(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460 280" width="100%" height="100%">
  <!-- Moldura de monitor de estúdio jornalístico -->
  <rect x="10" y="10" width="440" height="260" rx="12" fill="#ffffff" stroke="#14161a" stroke-width="4"/>
  <!-- Header do painel -->
  <rect x="10" y="10" width="440" height="42" rx="10" fill="#14161a"/>
  <text x="30" y="38" font-family="sans-serif" font-weight="900" font-size="18" fill="#ffffff" letter-spacing="2">PLANTÃO / EDIÇÃO ESPECIAL</text>
  <circle cx="420" cy="31" r="8" fill="#ff4d4f"/>
  
  <!-- Linhas e gráfico estilizado stickman de notícias -->
  <!-- Mapa mundi estilizado em linhas -->
  <path d="M 60,110 Q 90,80 130,95 Q 160,130 140,160 Q 110,180 80,150 Z" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="4 2"/>
  <path d="M 230,85 Q 290,70 330,105 Q 350,150 300,165 Q 260,185 240,140 Z" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="4 2"/>
  <path d="M 330,170 Q 370,160 390,190 Q 360,220 330,205 Z" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="4 2"/>

  <!-- Gráfico de barras estatístico -->
  <g transform="translate(60, 200)">
    <line x1="0" y1="50" x2="340" y2="50" stroke="#14161a" stroke-width="2"/>
    <rect x="20" y="25" width="22" height="25" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <rect x="60" y="10" width="22" height="40" fill="#14161a"/>
    <rect x="100" y="18" width="22" height="32" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <rect x="140" y="5" width="22" height="45" fill="#14161a"/>
    <!-- Linha de tendência -->
    <polyline points="31,25 71,10 111,18 151,5 200,2 250,12 300,-5" fill="none" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;
}

export function gerarSvgTarjaTicker(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 100" width="100%" height="100%">
  <!-- Bloco AO VIVO -->
  <polygon points="0,20 180,20 200,80 0,80" fill="#14161a"/>
  <text x="80" y="60" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="3">AO VIVO</text>
  <!-- Barra de título principal -->
  <polygon points="180,20 1280,20 1280,80 200,80" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <text x="230" y="58" font-family="sans-serif" font-weight="800" font-size="20" fill="#14161a">STICKMAN NEWS: PRINCIPAIS DESTAQUES DA SEMANA EM PRIMEIRA MÃO</text>
  <!-- Barra inferior ticker de cotações / drops -->
  <rect x="0" y="80" width="1280" height="20" fill="#f1f3f5" stroke="#14161a" stroke-width="1.5"/>
  <text x="40" y="95" font-family="sans-serif" font-weight="600" font-size="12" fill="#14161a" letter-spacing="1">/// ECONOMIA EM ALTA +2.4% /// CIÊNCIA E TECNOLOGIA ANUNCIAM NOVOS AVANÇOS /// TEMPO: ENSOLARADO</text>
</svg>`;
}

export function gerarSvgCenarioCompletoTelejornal(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <!-- Fundo estúdio telejornal -->
  <rect width="1280" height="720" fill="#ffffff"/>
  
  <!-- Linhas curvas de perspectiva do estúdio de TV -->
  <path d="M 0,220 Q 640,160 1280,220" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="10 6"/>
  <path d="M 0,540 Q 640,490 1280,540" fill="none" stroke="#14161a" stroke-width="2"/>

  <!-- Painel de Notícias / Telão do Jornal à direita -->
  <g transform="translate(760, 100)">
    <rect x="0" y="0" width="460" height="270" rx="10" fill="#ffffff" stroke="#14161a" stroke-width="3.5"/>
    <rect x="0" y="0" width="460" height="38" rx="8" fill="#14161a"/>
    <text x="25" y="26" font-family="sans-serif" font-weight="900" font-size="16" fill="#ffffff" letter-spacing="2">DROPS DA SEMANA / RESUMO</text>
    <circle cx="430" cy="19" r="6" fill="#ff4d4f"/>

    <!-- Conteúdo do Telão -->
    <path d="M 40,90 Q 70,60 110,75 Q 140,110 120,140 Q 90,160 60,130 Z" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="4 2"/>
    <path d="M 180,65 Q 240,50 280,85 Q 300,130 250,145 Z" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="4 2"/>
    
    <g transform="translate(30, 160)">
      <line x1="0" y1="60" x2="380" y2="60" stroke="#14161a" stroke-width="2"/>
      <rect x="20" y="30" width="20" height="30" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <rect x="60" y="15" width="20" height="45" fill="#14161a"/>
      <rect x="100" y="22" width="20" height="38" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <polyline points="30,30 70,15 110,22 170,8 240,16 320,5" fill="none" stroke="#14161a" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </g>

  <!-- Painel vertical informativo à esquerda -->
  <g transform="translate(80, 110)">
    <rect x="0" y="0" width="200" height="250" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <rect x="0" y="0" width="200" height="32" rx="6" fill="#f1f3f5" stroke="#14161a" stroke-width="1.5"/>
    <text x="100" y="22" font-family="sans-serif" font-weight="800" font-size="13" text-anchor="middle" fill="#14161a">TELEJORNAL</text>
    <line x1="20" y1="60" x2="180" y2="60" stroke="#14161a" stroke-width="1.5"/>
    <line x1="20" y1="90" x2="150" y2="90" stroke="#14161a" stroke-width="1.5"/>
    <line x1="20" y1="120" x2="170" y2="120" stroke="#14161a" stroke-width="1.5"/>
    <line x1="20" y1="150" x2="140" y2="150" stroke="#14161a" stroke-width="1.5"/>
    <line x1="20" y1="180" x2="160" y2="180" stroke="#14161a" stroke-width="1.5"/>
    <line x1="20" y1="210" x2="130" y2="210" stroke="#14161a" stroke-width="1.5"/>
  </g>

  <!-- Bancada Principal de Apresentação -->
  <g transform="translate(220, 420)">
    <path d="M 30,50 Q 420,20 810,50 L 760,185 Q 420,155 80,185 Z" fill="#ffffff" stroke="#14161a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M 30,50 Q 420,20 810,50 L 800,62 Q 420,32 40,62 Z" fill="#f1f3f5" stroke="#14161a" stroke-width="2"/>
    <rect x="260" y="80" width="320" height="70" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <text x="420" y="125" font-family="sans-serif" font-weight="900" font-size="24" text-anchor="middle" fill="#14161a" letter-spacing="6">NEWS 24H</text>

    <!-- Tablet de apoio -->
    <g transform="translate(360, 36) rotate(-5)">
      <rect x="0" y="0" width="45" height="30" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <rect x="5" y="4" width="35" height="22" rx="2" fill="none" stroke="#14161a" stroke-width="1.2"/>
    </g>

    <!-- Pés estruturais -->
    <line x1="160" y1="185" x2="160" y2="250" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
    <line x1="680" y1="185" x2="680" y2="250" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Tarja Ticker ao vivo na parte inferior -->
  <g transform="translate(0, 620)">
    <polygon points="0,20 180,20 200,80 0,80" fill="#14161a"/>
    <text x="75" y="60" font-family="sans-serif" font-weight="900" font-size="22" fill="#ffffff" letter-spacing="3">AO VIVO</text>
    <polygon points="180,20 1280,20 1280,80 200,80" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
    <text x="230" y="58" font-family="sans-serif" font-weight="800" font-size="20" fill="#14161a">STICKMAN NEWS: PRINCIPAIS DESTAQUES DA SEMANA EM PRIMEIRA MÃO</text>
    <rect x="0" y="80" width="1280" height="20" fill="#f1f3f5" stroke="#14161a" stroke-width="1.5"/>
    <text x="40" y="95" font-family="sans-serif" font-weight="600" font-size="12" fill="#14161a" letter-spacing="1">/// ECONOMIA EM ALTA +2.4% /// CIÊNCIA E TECNOLOGIA ANUNCIAM NOVOS AVANÇOS /// TEMPO: ENSOLARADO</text>
  </g>
</svg>`;
}
