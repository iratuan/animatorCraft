/**
 * Gerador de Elementos e Cenário Vetorial SVG para QUADRO DE AULA / DIDÁTICO
 * Estilo Whiteboard Stickman
 */

export function gerarSvgLousaDidatica(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 520" width="100%" height="100%">
  <!-- Moldura de alumínio externa da lousa -->
  <rect x="15" y="15" width="890" height="470" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="4.5"/>
  <rect x="25" y="25" width="870" height="450" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
  
  <!-- Calha / bandeja porta-apagador e pincéis na parte inferior -->
  <rect x="80" y="485" width="760" height="18" rx="3" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
  <!-- Apagador de feltro na calha -->
  <rect x="120" y="475" width="60" height="14" rx="2" fill="#14161a"/>
  <!-- Marcador azul -->
  <rect x="210" y="477" width="45" height="10" rx="2" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>
  <!-- Marcador vermelho -->
  <rect x="265" y="477" width="45" height="10" rx="2" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>

  <!-- Conteúdo didático na lousa: Título, fórmulas e diagramas stickman -->
  <!-- Título da aula -->
  <text x="60" y="70" font-family="sans-serif" font-weight="900" font-size="26" fill="#14161a" letter-spacing="2">AULA: FÍSICA &amp; ANIMAÇÃO</text>
  <line x1="60" y1="80" x2="420" y2="80" stroke="#14161a" stroke-width="2.5"/>

  <!-- Equações clássicas na lousa -->
  <text x="60" y="130" font-family="monospace, monospace" font-weight="700" font-size="22" fill="#14161a">E = m · c²</text>
  <text x="60" y="170" font-family="monospace, monospace" font-weight="700" font-size="20" fill="#14161a">F = m · a</text>
  <text x="60" y="210" font-family="monospace, monospace" font-weight="700" font-size="20" fill="#14161a">v(t) = v₀ + a · t</text>
  <text x="60" y="250" font-family="monospace, monospace" font-weight="700" font-size="20" fill="#14161a">S = S₀ + v₀t + ½at²</text>

  <!-- Diagrama vetorial de trajetória de projétil à direita -->
  <g transform="translate(480, 110)">
    <!-- Eixos cartesianos X e Y -->
    <line x1="20" y1="200" x2="340" y2="200" stroke="#14161a" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="20" y1="200" x2="20" y2="20" stroke="#14161a" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Setas dos eixos -->
    <polyline points="15,30 20,15 25,30" fill="none" stroke="#14161a" stroke-width="2"/>
    <polyline points="330,195 345,200 330,205" fill="none" stroke="#14161a" stroke-width="2"/>
    <text x="12" y="15" font-family="sans-serif" font-weight="700" font-size="14" fill="#14161a">Y</text>
    <text x="350" y="205" font-family="sans-serif" font-weight="700" font-size="14" fill="#14161a">X</text>

    <!-- Parábola pontilhada de lançamento oblíquo -->
    <path d="M 20,200 Q 150,20 280,200" fill="none" stroke="#14161a" stroke-width="3" stroke-dasharray="6 4"/>
    <!-- Vetores de velocidade -->
    <line x1="20" y1="200" x2="70" y2="135" stroke="#14161a" stroke-width="2.5"/>
    <polygon points="65,130 75,135 60,145" fill="#14161a"/>
    <text x="80" y="135" font-family="sans-serif" font-weight="700" font-size="13" fill="#14161a">v₀</text>

    <!-- Ponto no ápice -->
    <circle cx="150" cy="110" r="4" fill="#14161a"/>
    <line x1="150" y1="110" x2="190" y2="110" stroke="#14161a" stroke-width="2"/>
    <polygon points="185,107 195,110 185,113" fill="#14161a"/>
    <text x="198" y="114" font-family="sans-serif" font-weight="700" font-size="12" fill="#14161a">v_x</text>
  </g>

  <!-- Caixa de destaque com dica / nota -->
  <g transform="translate(60, 310)">
    <rect x="0" y="0" width="340" height="95" rx="6" fill="#ffffff" stroke="#14161a" stroke-width="2" stroke-dasharray="6 3"/>
    <text x="20" y="30" font-family="sans-serif" font-weight="800" font-size="16" fill="#14161a">DICA IMPORTANTE:</text>
    <text x="20" y="55" font-family="sans-serif" font-weight="600" font-size="14" fill="#14161a">A aceleração da gravidade é</text>
    <text x="20" y="78" font-family="sans-serif" font-weight="600" font-size="14" fill="#14161a">constante e dirigida para baixo (g ≈ 9.8 m/s²)</text>
  </g>
</svg>`;
}

export function gerarSvgMesaProfessor(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="100%" height="100%">
  <!-- Tampo da mesa do professor -->
  <polygon points="20,40 260,40 275,100 5,100" fill="#ffffff" stroke="#14161a" stroke-width="3.5" stroke-linejoin="round"/>
  <!-- Gaveteiro à direita -->
  <rect x="180" y="100" width="80" height="90" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
  <line x1="180" y1="130" x2="260" y2="130" stroke="#14161a" stroke-width="2"/>
  <line x1="180" y1="160" x2="260" y2="160" stroke="#14161a" stroke-width="2"/>
  <circle cx="220" cy="115" r="3" fill="#14161a"/>
  <circle cx="220" cy="145" r="3" fill="#14161a"/>
  <circle cx="220" cy="175" r="3" fill="#14161a"/>
  <!-- Pés da mesa -->
  <line x1="25" y1="100" x2="25" y2="190" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
  <!-- Notebook aberto sobre a mesa -->
  <g transform="translate(60, 20)">
    <polygon points="10,25 70,25 65,40 15,40" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <polygon points="15,4 65,4 70,25 10,25" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    <rect x="20" y="8" width="40" height="14" fill="#14161a"/>
  </g>
  <!-- Pilha de provas / livros -->
  <g transform="translate(140, 26)">
    <polygon points="0,15 35,15 35,22 0,22" fill="#ffffff" stroke="#14161a" stroke-width="1.8"/>
    <polygon points="3,8 38,8 38,15 3,15" fill="#ffffff" stroke="#14161a" stroke-width="1.8"/>
    <polygon points="1,0 36,0 36,8 1,8" fill="#ffffff" stroke="#14161a" stroke-width="1.8"/>
  </g>
</svg>`;
}

export function gerarSvgCenarioCompletoClassroom(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%">
  <!-- Fundo sala de aula / lousa -->
  <rect width="1280" height="720" fill="#ffffff"/>
  
  <!-- Chão da sala de aula -->
  <line x1="0" y1="600" x2="1280" y2="600" stroke="#14161a" stroke-width="3"/>
  <line x1="0" y1="615" x2="1280" y2="615" stroke="#14161a" stroke-width="1.5"/>

  <!-- Grande Lousa Branca Didática no centro da parede -->
  <g transform="translate(180, 50)">
    <!-- Moldura de alumínio -->
    <rect x="0" y="0" width="920" height="460" rx="8" fill="#ffffff" stroke="#14161a" stroke-width="4.5"/>
    <rect x="10" y="10" width="900" height="440" rx="4" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
    
    <!-- Calha porta marcadores -->
    <rect x="60" y="460" width="800" height="18" rx="3" fill="#ffffff" stroke="#14161a" stroke-width="2.5"/>
    <rect x="100" y="452" width="55" height="12" rx="2" fill="#14161a"/>
    <rect x="180" y="454" width="40" height="8" rx="2" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>
    <rect x="230" y="454" width="40" height="8" rx="2" fill="#ffffff" stroke="#14161a" stroke-width="1.5"/>

    <!-- Conteúdo da Lousa -->
    <text x="40" y="55" font-family="sans-serif" font-weight="900" font-size="24" fill="#14161a" letter-spacing="2">AULA: FÍSICA &amp; ANIMAÇÃO</text>
    <line x1="40" y1="65" x2="380" y2="65" stroke="#14161a" stroke-width="2"/>

    <text x="40" y="110" font-family="monospace, monospace" font-weight="700" font-size="20" fill="#14161a">E = m · c²</text>
    <text x="40" y="145" font-family="monospace, monospace" font-weight="700" font-size="18" fill="#14161a">F = m · a</text>
    <text x="40" y="180" font-family="monospace, monospace" font-weight="700" font-size="18" fill="#14161a">v(t) = v₀ + a · t</text>
    <text x="40" y="215" font-family="monospace, monospace" font-weight="700" font-size="18" fill="#14161a">S = S₀ + v₀t + ½at²</text>

    <!-- Gráfico cartesiano parabólico -->
    <g transform="translate(450, 80)">
      <line x1="20" y1="180" x2="320" y2="180" stroke="#14161a" stroke-width="2.5"/>
      <line x1="20" y1="180" x2="20" y2="20" stroke="#14161a" stroke-width="2.5"/>
      <path d="M 20,180 Q 140,20 260,180" fill="none" stroke="#14161a" stroke-width="3" stroke-dasharray="6 4"/>
      <line x1="20" y1="180" x2="65" y2="125" stroke="#14161a" stroke-width="2.5"/>
      <polygon points="60,120 70,125 55,135" fill="#14161a"/>
      <text x="75" y="125" font-family="sans-serif" font-weight="700" font-size="13" fill="#14161a">v₀</text>
      <circle cx="140" cy="100" r="4" fill="#14161a"/>
      <text x="150" y="104" font-family="sans-serif" font-weight="700" font-size="12" fill="#14161a">v_x</text>
    </g>

    <g transform="translate(40, 270)">
      <rect x="0" y="0" width="320" height="90" rx="6" fill="#ffffff" stroke="#14161a" stroke-width="2" stroke-dasharray="5 3"/>
      <text x="15" y="28" font-family="sans-serif" font-weight="800" font-size="15" fill="#14161a">DICA IMPORTANTE:</text>
      <text x="15" y="52" font-family="sans-serif" font-weight="600" font-size="13" fill="#14161a">Aceleração da gravidade:</text>
      <text x="15" y="74" font-family="sans-serif" font-weight="600" font-size="13" fill="#14161a">g ≈ 9.8 m/s² (sentido para baixo)</text>
    </g>
  </g>

  <!-- Mesa do professor no canto direito inferior -->
  <g transform="translate(980, 470) scale(0.9)">
    <polygon points="15,40 250,40 265,95 0,95" fill="#ffffff" stroke="#14161a" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="170" y="95" width="80" height="85" fill="#ffffff" stroke="#14161a" stroke-width="3"/>
    <line x1="170" y1="125" x2="250" y2="125" stroke="#14161a" stroke-width="2"/>
    <line x1="170" y1="155" x2="250" y2="155" stroke="#14161a" stroke-width="2"/>
    <line x1="20" y1="95" x2="20" y2="180" stroke="#14161a" stroke-width="5" stroke-linecap="round"/>
    <!-- Notebook -->
    <g transform="translate(50, 22)">
      <polygon points="10,25 65,25 60,38 15,38" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <polygon points="15,5 60,5 65,25 10,25" fill="#ffffff" stroke="#14161a" stroke-width="2"/>
      <rect x="20" y="8" width="35" height="13" fill="#14161a"/>
    </g>
  </g>
</svg>`;
}
