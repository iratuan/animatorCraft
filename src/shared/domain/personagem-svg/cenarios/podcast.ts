/**
 * Gerador de Elementos e Cenário Vetorial SVG para PODCAST
 * Estilo Whiteboard Stickman
 */

export function gerarSvgBancadaPodcast(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="100%" height="100%">
  <!-- Tampo da bancada acústica de podcast -->
  <defs>
    <linearGradient id="grad-mesa-pod" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f1f3f5"/>
    </linearGradient>
  </defs>
  <!-- Estrutura frontal da bancada -->
  <polygon points="60,60 740,60 790,190 10,190" fill="url(#grad-mesa-pod)" stroke="#14161a" stroke-width="3.5" stroke-linejoin="round"/>
  <!-- Chanfro superior da madeira -->
  <polygon points="80,50 720,50 740,60 60,60" fill="#ffffff" stroke="#14161a" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Painel frontal com logo de som de podcast -->
  <rect x="250" y="85" width="300" height="80" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2" stroke-dasharray="8 4"/>
  <text x="400" y="132" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle" fill="#14161a" letter-spacing="4">PODCAST LIVE</text>
  <!-- Ondas sonoras no painel -->
  <line x1="285" y1="125" x2="285" y2="135" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <line x1="295" y1="115" x2="295" y2="145" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <line x1="305" y1="120" x2="305" y2="140" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <line x1="495" y1="120" x2="495" y2="140" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <line x1="505" y1="115" x2="505" y2="145" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <line x1="515" y1="125" x2="515" y2="135" stroke="#14161a" stroke-width="3" stroke-linecap="round"/>
  <!-- Pés metálicos da bancada -->
  <line x1="120" y1="190" x2="120" y2="230" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <line x1="680" y1="190" x2="680" y2="230" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <line x1="90" y1="230" x2="150" y2="230" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
  <line x1="650" y1="230" x2="710" y2="230" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}

export function gerarSvgMicrofoneBoom(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 260" width="100%" height="100%">
  <!-- Base com grampo na mesa -->
  <rect x="20" y="240" width="30" height="15" rx="3" fill="#14161a"/>
  <!-- Braço pantográfico articulado -->
  <line x1="35" y1="240" x2="65" y2="140" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <line x1="40" y1="242" x2="70" y2="142" stroke="#14161a" stroke-width="2"/>
  <!-- Mola e articulação central -->
  <circle cx="67" cy="141" r="9" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <!-- Segundo segmento do braço -->
  <line x1="67" y1="141" x2="120" y2="70" stroke="#14161a" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Cabo espiral enrolado no braço -->
  <path d="M 40,220 Q 55,215 45,200 Q 60,195 50,180 Q 65,175 55,160 Q 70,155 65,140 Q 80,125 75,110 Q 95,100 90,85 Q 110,80 115,72" fill="none" stroke="#14161a" stroke-width="1.8" stroke-dasharray="4 2"/>
  <!-- Suporte aranha (shock mount) -->
  <circle cx="120" cy="70" r="14" fill="none" stroke="#14161a" stroke-width="2.5"/>
  <line x1="110" y1="70" x2="130" y2="70" stroke="#14161a" stroke-width="2"/>
  <!-- Cápsula condensadora do microfone (tipo Shure SM7B) -->
  <g transform="translate(112, 45) rotate(-30)">
    <rect x="-10" y="-20" width="20" height="42" rx="7" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
    <!-- Grade de espuma acústica -->
    <line x1="-10" y1="-8" x2="10" y2="-8" stroke="#14161a" stroke-width="1.5"/>
    <line x1="-10" y1="0" x2="10" y2="0" stroke="#14161a" stroke-width="1.5"/>
    <line x1="-10" y1="8" x2="10" y2="8" stroke="#14161a" stroke-width="1.5"/>
    <!-- Pop filter anexo -->
    <circle cx="-16" cy="2" r="11" fill="none" stroke="#14161a" stroke-width="2" stroke-dasharray="2 2"/>
    <line x1="-16" y1="13" x2="-2" y2="16" stroke="#14161a" stroke-width="1.8"/>
  </g>
</svg>`;
}

export function gerarSvgCaneca(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="100%" height="100%">
  <!-- Corpo da caneca -->
  <rect x="12" y="15" width="28" height="34" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <!-- Alça da caneca -->
  <path d="M 40,22 C 52,22 52,40 40,40" fill="none" stroke="#14161a" stroke-width="2.5" stroke-linecap="round"/>
  <!-- Vapor quente de café -->
  <path d="M 20,10 Q 18,5 22,2" fill="none" stroke="#14161a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 28,10 Q 32,5 28,2" fill="none" stroke="#14161a" stroke-width="1.5" stroke-linecap="round"/>
  <!-- Detalhe do stickman na caneca -->
  <circle cx="26" cy="30" r="4" fill="none" stroke="#14161a" stroke-width="1.2"/>
  <line x1="26" y1="34" x2="26" y2="42" stroke="#14161a" stroke-width="1.2"/>
</svg>`;
}

export function gerarSvgFoneOuvido(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90" width="100%" height="100%">
  <!-- Arco superior almofadado -->
  <path d="M 18,55 C 15,15 75,15 72,55" fill="none" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <path d="M 24,42 C 22,22 68,22 66,42" fill="none" stroke="#ffffff" stroke-width="2"/>
  <!-- Concha esquerda -->
  <rect x="8" y="45" width="16" height="26" rx="7" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <rect x="11" y="49" width="10" height="18" rx="4" fill="#14161a"/>
  <!-- Concha direita -->
  <rect x="66" y="45" width="16" height="26" rx="7" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <rect x="69" y="49" width="10" height="18" rx="4" fill="#14161a"/>
</svg>`;
}

export function gerarSvgCenarioCompletoPodcast(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <!-- Fundo estúdio com painéis acústicos stickman -->
  <rect width="1280" height="720" fill="#ffffff"/>
  
  <!-- Linha do horizonte do estúdio -->
  <line x1="0" y1="560" x2="1280" y2="560" stroke="#14161a" stroke-width="2" stroke-dasharray="8 6"/>

  <!-- Placas acústicas hexagonais / retangulares estilizadas ao fundo -->
  <g opacity="0.4" stroke="#14161a" stroke-width="2" fill="none">
    <!-- Placa 1 -->
    <rect x="150" y="80" width="140" height="200" rx="6"/>
    <line x1="170" y1="80" x2="170" y2="280"/>
    <line x1="200" y1="80" x2="200" y2="280"/>
    <line x1="230" y1="80" x2="230" y2="280"/>
    <line x1="260" y1="80" x2="260" y2="280"/>

    <!-- Placa 2 Central com letreiro neon ON AIR -->
    <rect x="520" y="60" width="240" height="110" rx="10" fill="#ffffff"/>
    <rect x="530" y="70" width="220" height="90" rx="6" stroke-width="2.5"/>
    <text x="640" y="125" font-family="sans-serif" font-weight="900" font-size="34" text-anchor="middle" fill="#14161a" letter-spacing="6">ON AIR</text>

    <!-- Placa 3 -->
    <rect x="990" y="80" width="140" height="200" rx="6"/>
    <line x1="1010" y1="80" x2="1010" y2="280"/>
    <line x1="1040" y1="80" x2="1040" y2="280"/>
    <line x1="1070" y1="80" x2="1070" y2="280"/>
    <line x1="1100" y1="80" x2="1100" y2="280"/>
  </g>

  <!-- Iluminação superior pendente (Spotlights de estúdio) -->
  <line x1="320" y1="0" x2="320" y2="70" stroke="#14161a" stroke-width="2.5"/>
  <polygon points="305,70 335,70 345,100 295,100" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <line x1="960" y1="0" x2="960" y2="70" stroke="#14161a" stroke-width="2.5"/>
  <polygon points="945,70 975,70 985,100 935,100" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>

  <!-- Cadeiras de estúdio (encostos atrás da bancada) -->
  <!-- Cadeira esquerda -->
  <rect x="300" y="320" width="110" height="140" rx="16" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <line x1="355" y1="460" x2="355" y2="540" stroke="#14161a" stroke-width="5"/>
  
  <!-- Cadeira direita -->
  <rect x="870" y="320" width="110" height="140" rx="16" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <line x1="925" y1="460" x2="925" y2="540" stroke="#14161a" stroke-width="5"/>

  <!-- Bancada Principal em primeiro plano -->
  <g transform="translate(240, 440)">
    <!-- Bancada -->
    <polygon points="40,50 760,50 820,190 -20,190" fill="#ffffff" stroke="#14161a" stroke-width="4" stroke-linejoin="round"/>
    <polygon points="60,40 740,40 760,50 40,50" fill="#f8f9fa" stroke="#14161a" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="260" y="80" width="280" height="75" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="2.5" stroke-dasharray="6 3"/>
    <text x="400" y="125" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle" fill="#14161a" letter-spacing="4">PODCAST TALK</text>
    <line x1="100" y1="190" x2="100" y2="270" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>
    <line x1="700" y1="190" x2="700" y2="270" stroke="#14161a" stroke-width="6" stroke-linecap="round"/>

    <!-- Caneca Host -->
    <g transform="translate(180, 20) scale(0.7)">
      <rect x="12" y="15" width="28" height="34" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
      <path d="M 40,22 C 52,22 52,40 40,40" fill="none" stroke="#14161a" stroke-width="2.5"/>
      <path d="M 20,10 Q 18,5 22,2" fill="none" stroke="#14161a" stroke-width="1.5"/>
    </g>

    <!-- Caneca Convidado -->
    <g transform="translate(600, 20) scale(0.7)">
      <rect x="12" y="15" width="28" height="34" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
      <path d="M 40,22 C 52,22 52,40 40,40" fill="none" stroke="#14161a" stroke-width="2.5"/>
      <path d="M 28,10 Q 32,5 28,2" fill="none" stroke="#14161a" stroke-width="1.5"/>
    </g>
  </g>

  <!-- Microfones Boom dos dois lados da bancada -->
  <!-- Mic Host -->
  <g transform="translate(350, 310) scale(0.9)">
    <line x1="35" y1="190" x2="55" y2="100" stroke="#14161a" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="55" cy="100" r="7" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <line x1="55" y1="100" x2="95" y2="40" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="95" cy="40" r="11" fill="none" stroke="#14161a" stroke-width="2"/>
    <g transform="translate(90, 25) rotate(-25)">
      <rect x="-8" y="-16" width="16" height="32" rx="5" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
      <line x1="-8" y1="-5" x2="8" y2="-5" stroke="#14161a" stroke-width="1.2"/>
      <line x1="-8" y1="3" x2="8" y2="3" stroke="#14161a" stroke-width="1.2"/>
    </g>
  </g>

  <!-- Mic Convidado -->
  <g transform="translate(850, 310) scale(-0.9, 0.9)">
    <line x1="35" y1="190" x2="55" y2="100" stroke="#14161a" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="55" cy="100" r="7" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <line x1="55" y1="100" x2="95" y2="40" stroke="#14161a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="95" cy="40" r="11" fill="none" stroke="#14161a" stroke-width="2"/>
    <g transform="translate(90, 25) rotate(-25)">
      <rect x="-8" y="-16" width="16" height="32" rx="5" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
      <line x1="-8" y1="-5" x2="8" y2="-5" stroke="#14161a" stroke-width="1.2"/>
      <line x1="-8" y1="3" x2="8" y2="3" stroke="#14161a" stroke-width="1.2"/>
    </g>
  </g>
</svg>`;
}
