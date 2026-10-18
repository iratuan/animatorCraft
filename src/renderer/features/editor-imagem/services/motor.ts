import {
  Historico, Traco, adicionarCamada, apagarSelecao, camadaAtiva, clonarPixels, colarSobre, combinarMascaras, compor, contornoDeForma, corDeHex, cortarAoConteudo,
  criarMascara, criarPixels, duplicarCamada, espelharDocumento, extrairSelecao, girarDocumento, hexDeCor, inverterMascara, lerCor, limitesDaMascara, limitesDoConteudo,
  mascaraElipse, mascaraLaco, mascaraPorCor, mascaraRetangulo, mesclarAbaixo, moverCamada, novoDocumento, preencher, preencherForma, prepararEdicao, redimensionarDocumento,
  redimensionarTela, removerCamada, restaurarInstantaneo, tirarInstantaneo, LIMITE_LADO, type Cor, type Documento, type Instantaneo, type Mascara, type OperacaoMascara, type Pixels,
} from '@shared/editor-imagem';

export type Ferramenta = 'mover' | 'selRet' | 'selElipse' | 'laco' | 'varinha' | 'pincel' | 'lapis' | 'borracha' | 'balde' | 'conta' | 'linha' | 'retangulo' | 'elipse' | 'texto' | 'mao';

/** Referências visuais que não entram no PNG: corpo de apoio (para alinhar uma cabeça), caixa da cabeça e linha do chão. */
export interface Guias {
  corpo?: { imagem: CanvasImageSource; x: number; y: number; escala: number };
  cabeca?: { x: number; y: number; w: number; h: number };
  chao?: number;
}

export interface UiEditor {
  ferramenta: Ferramenta;
  cor: string;
  tamanho: number;
  dureza: number;
  opacidade: number;
  tolerancia: number;
  contiguo: boolean;
  amostrarTudo: boolean;
  formaPreenchida: boolean;
  zoom: number;
  w: number; h: number;
  camadas: { id: number; nome: string; visivel: boolean; opacidade: number }[];
  ativa: number;
  podeDesfazer: boolean; podeRefazer: boolean;
  temSelecao: boolean;
  flutuante: boolean;
  mostrarOriginal: boolean;
  mostrarGuias: boolean;
  cursor: { x: number; y: number } | null;
  alterado: boolean;
}

interface Flutuante { fonte: Pixels; canvas: HTMLCanvasElement; cx: number; cy: number; sx: number; sy: number; rot: number; antes: Instantaneo; origem: 'selecao' | 'colagem' | 'texto' }
type Alca = 'corpo' | 'rotacionar' | 'nw' | 'ne' | 'sw' | 'se';

const ZOOM_MIN = 0.05, ZOOM_MAX = 32;
const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const paraCanvas = (p: Pixels): HTMLCanvasElement => { const c = document.createElement('canvas'); c.width = p.w; c.height = p.h; c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(p.data), p.w, p.h), 0, 0); return c; };
const dePixels = (c: HTMLCanvasElement): Pixels => { const d = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height); return { w: c.width, h: c.height, data: d.data }; };

/**
 * O editor em si: documento (camadas), histórico, ferramentas e desenho na tela. Não depende do React; a interface só lê `ui`
 * (e é avisada por `aoMudar`) e chama os métodos públicos. Toda alteração de pixels passa por `prepararEdicao` (cópia da camada),
 * para o histórico poder guardar instantâneos sem copiar tudo.
 */
export class MotorEditor {
  doc: Documento;
  ui: UiEditor;
  guias: Guias = {};
  original: Pixels | null = null;
  aoMudar: () => void = () => {};
  /** A interface define: pede um texto ao usuário perto do ponto clicado. */
  aoPedirTexto: ((p: { x: number; y: number }) => void) | null = null;
  aoAvisar: ((m: string) => void) | null = null;

  private hist: Historico<Instantaneo>;
  private ctx: CanvasRenderingContext2D;
  private compCanvas = document.createElement('canvas');
  private sujo = true;
  private rafPendente = false;
  private ox = 0; private oy = 0; // deslocamento da imagem na tela (px)
  private visaoPronta = false;
  private flut: Flutuante | null = null;
  private clipboard: Pixels | null = null;
  private contorno: Path2D | null = null;
  private fase = 0;
  private timerFormigas: number | null = null;

  // gestos em andamento
  private traco: Traco | null = null;
  private baseForma: Pixels | null = null;
  private inicio: { x: number; y: number } | null = null;
  private atual: { x: number; y: number } | null = null;
  private pontosLaco: { x: number; y: number }[] = [];
  private arrastoFlut: { alca: Alca; x0: number; y0: number; cx0: number; cy0: number; sx0: number; sy0: number; rot0: number; ang0: number; dist0: number } | null = null;
  private panDe: { x: number; y: number; ox: number; oy: number } | null = null;
  private espaco = false;
  private ponteiros = new Map<number, { x: number; y: number }>();
  private gesto2: { dist: number; zoom: number; cx: number; cy: number } | null = null;
  private modoSelecao: OperacaoMascara = 'substituir';

  constructor(public readonly canvas: HTMLCanvasElement, base: Pixels | null, largura: number, altura: number, nomeBase = 'Sprite') {
    this.ctx = canvas.getContext('2d')!;
    this.doc = novoDocumento(largura, altura, base ?? undefined, nomeBase);
    this.hist = new Historico(tirarInstantaneo(this.doc));
    this.ui = {
      ferramenta: 'pincel', cor: '#222222', tamanho: 12, dureza: 80, opacidade: 100, tolerancia: 32, contiguo: true, amostrarTudo: false, formaPreenchida: false,
      zoom: 1, w: this.doc.w, h: this.doc.h, camadas: [], ativa: 0, podeDesfazer: false, podeRefazer: false, temSelecao: false, flutuante: false,
      mostrarOriginal: false, mostrarGuias: true, cursor: null, alterado: false,
    };
    this.sincronizar();
  }

  // ---------------------------------------------------------------- estado exposto à interface

  private sincronizar(): void {
    const u = this.ui;
    u.w = this.doc.w; u.h = this.doc.h; u.ativa = this.doc.ativa;
    u.camadas = this.doc.camadas.map((c) => ({ id: c.id, nome: c.nome, visivel: c.visivel, opacidade: c.opacidade })).reverse(); // a de cima aparece primeiro
    u.podeDesfazer = this.hist.podeDesfazer || !!this.flut; u.podeRefazer = this.hist.podeRefazer;
    u.temSelecao = !!this.doc.selecao; u.flutuante = !!this.flut;
    this.aoMudar();
  }
  definir<K extends keyof UiEditor>(k: K, v: UiEditor[K]): void {
    if (k === 'ferramenta') this.confirmarFlutuanteSeNaoMover(v as Ferramenta);
    (this.ui as unknown as Record<string, unknown>)[k] = v;
    if (k === 'mostrarOriginal' || k === 'mostrarGuias') this.marcar();
    this.aoMudar();
  }
  private confirmarFlutuanteSeNaoMover(proxima: Ferramenta): void { if (proxima !== 'mover') this.confirmarFlutuante(); }
  get cor(): Cor { return corDeHex(this.ui.cor); }

  // ---------------------------------------------------------------- desenho na tela

  private marcar(): void { this.sujo = true; this.pedirQuadro(); }
  private pedirQuadro(): void {
    if (this.rafPendente) return;
    this.rafPendente = true;
    requestAnimationFrame(() => { this.rafPendente = false; this.desenhar(); });
  }
  /** Ajusta o tamanho do canvas visível ao do contêiner. */
  redimensionarVisao(w: number, h: number): void {
    // a imagem acompanha o centro da área quando a janela muda de tamanho
    if (this.canvas.width > 1 && this.visaoPronta) { this.ox += (w - this.larguraVisao) / 2; this.oy += (h - this.alturaVisao) / 2; }
    this.visaoPronta = true;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(w * dpr)); this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.canvas.style.width = `${w}px`; this.canvas.style.height = `${h}px`;
    this.marcar();
  }
  private get dpr(): number { return window.devicePixelRatio || 1; }
  private get larguraVisao(): number { return this.canvas.width / this.dpr; }
  private get alturaVisao(): number { return this.canvas.height / this.dpr; }

  ajustarNaTela(): void {
    const margem = 40, z = Math.min((this.larguraVisao - margem) / this.doc.w, (this.alturaVisao - margem) / this.doc.h);
    this.ui.zoom = limitar(Math.min(z, 8), ZOOM_MIN, ZOOM_MAX);
    this.centralizar();
    this.aoMudar(); this.marcar();
  }
  private centralizar(): void { this.ox = (this.larguraVisao - this.doc.w * this.ui.zoom) / 2; this.oy = (this.alturaVisao - this.doc.h * this.ui.zoom) / 2; }
  zoomPara(z: number, cx = this.larguraVisao / 2, cy = this.alturaVisao / 2): void {
    const novo = limitar(z, ZOOM_MIN, ZOOM_MAX), k = novo / this.ui.zoom;
    this.ox = cx - (cx - this.ox) * k; this.oy = cy - (cy - this.oy) * k;
    this.ui.zoom = novo;
    this.aoMudar(); this.marcar();
  }

  paraDoc(clientX: number, clientY: number): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left - this.ox) / this.ui.zoom, y: (clientY - r.top - this.oy) / this.ui.zoom };
  }
  private paraTela(x: number, y: number): { x: number; y: number } { return { x: this.ox + x * this.ui.zoom, y: this.oy + y * this.ui.zoom }; }

  private recompor(): void {
    const c = this.compCanvas;
    if (c.width !== this.doc.w || c.height !== this.doc.h) { c.width = this.doc.w; c.height = this.doc.h; }
    const p = compor(this.doc);
    c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(p.data), p.w, p.h), 0, 0);
    this.sujo = false;
  }

  desenhar(): void {
    const ctx = this.ctx, z = this.ui.zoom;
    if (this.sujo) this.recompor();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, 0, this.larguraVisao, this.alturaVisao);
    const x = this.ox, y = this.oy, w = this.doc.w * z, h = this.doc.h * z;
    // xadrez da transparência (quadrados de 8 px da tela)
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const q = 8;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#d9d9d9';
    for (let yy = 0; yy * q < h; yy++) for (let xx = (yy % 2); xx * q < w; xx += 2) ctx.fillRect(x + xx * q, y + yy * q, q, q);
    ctx.imageSmoothingEnabled = z < 2;
    ctx.drawImage(this.compCanvas, x, y, w, h);
    if (this.ui.mostrarOriginal && this.original) { ctx.globalAlpha = 0.45; ctx.drawImage(paraCanvas(this.original), x, y, this.original.w * z, this.original.h * z); ctx.globalAlpha = 1; }
    if (this.flut) this.desenharFlutuante(ctx);
    ctx.restore();
    this.desenharGuias(ctx);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.setLineDash([]); ctx.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    this.desenharSelecao(ctx);
    this.desenharPrevia(ctx);
    if (this.flut) this.desenharAlcas(ctx);
    this.desenharCursor(ctx);
  }

  private desenharFlutuante(ctx: CanvasRenderingContext2D): void {
    const f = this.flut!, z = this.ui.zoom;
    const c = this.paraTela(f.cx, f.cy);
    ctx.save();
    ctx.translate(c.x, c.y); ctx.rotate(f.rot); ctx.scale(f.sx * z, f.sy * z);
    ctx.imageSmoothingEnabled = f.rot !== 0 || f.sx !== 1 || f.sy !== 1 || z < 2; // girado ou escalado: suaviza a pré-visualização
    ctx.drawImage(f.canvas, -f.fonte.w / 2, -f.fonte.h / 2);
    ctx.restore();
  }
  private cantosFlutuante(): { x: number; y: number }[] {
    const f = this.flut!, hw = (f.fonte.w * f.sx) / 2, hh = (f.fonte.h * f.sy) / 2, cos = Math.cos(f.rot), sin = Math.sin(f.rot);
    return [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]].map(([lx, ly]) => this.paraTela(f.cx + lx! * cos - ly! * sin, f.cy + lx! * sin + ly! * cos));
  }
  private posRotacao(): { x: number; y: number } {
    const f = this.flut!, hh = (f.fonte.h * f.sy) / 2 + 28 / this.ui.zoom, cos = Math.cos(f.rot), sin = Math.sin(f.rot);
    return this.paraTela(f.cx + hh * sin, f.cy - hh * cos);
  }
  private desenharAlcas(ctx: CanvasRenderingContext2D): void {
    const [nw, ne, sw, se] = this.cantosFlutuante() as [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }];
    ctx.save();
    ctx.strokeStyle = '#3aa0ff'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(nw.x, nw.y); ctx.lineTo(ne.x, ne.y); ctx.lineTo(se.x, se.y); ctx.lineTo(sw.x, sw.y); ctx.closePath(); ctx.stroke();
    const r = this.posRotacao(), topo = { x: (nw.x + ne.x) / 2, y: (nw.y + ne.y) / 2 };
    ctx.beginPath(); ctx.moveTo(topo.x, topo.y); ctx.lineTo(r.x, r.y); ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const p of [nw, ne, sw, se]) { ctx.beginPath(); ctx.rect(p.x - 5, p.y - 5, 10, 10); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(r.x, r.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  private desenharGuias(ctx: CanvasRenderingContext2D): void {
    if (!this.ui.mostrarGuias) return;
    const g = this.guias, z = this.ui.zoom;
    ctx.save();
    ctx.beginPath(); ctx.rect(this.ox - 60, this.oy - 60, this.doc.w * z + 120, this.doc.h * z + 120); ctx.clip();
    if (g.corpo) {
      const im = g.corpo.imagem as HTMLCanvasElement;
      ctx.globalAlpha = 0.35; ctx.drawImage(im, this.ox + g.corpo.x * z, this.oy + g.corpo.y * z, im.width * g.corpo.escala * z, im.height * g.corpo.escala * z); ctx.globalAlpha = 1;
    }
    ctx.setLineDash([6, 5]); ctx.lineWidth = 1.2;
    if (g.cabeca) { ctx.strokeStyle = '#ff8a3d'; ctx.strokeRect(this.ox + g.cabeca.x * z, this.oy + g.cabeca.y * z, g.cabeca.w * z, g.cabeca.h * z); }
    if (g.chao !== undefined) { ctx.strokeStyle = '#4ade80'; ctx.beginPath(); ctx.moveTo(this.ox, this.oy + g.chao * z); ctx.lineTo(this.ox + this.doc.w * z, this.oy + g.chao * z); ctx.stroke(); }
    ctx.restore();
  }

  private construirContorno(): void {
    const m = this.doc.selecao;
    if (!m) { this.contorno = null; return; }
    const p = new Path2D(), { w, h } = m, d = m.data;
    const dentroM = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[y * w + x]! > 127;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!dentroM(x, y)) continue;
      if (!dentroM(x, y - 1)) { p.moveTo(x, y); p.lineTo(x + 1, y); }
      if (!dentroM(x, y + 1)) { p.moveTo(x, y + 1); p.lineTo(x + 1, y + 1); }
      if (!dentroM(x - 1, y)) { p.moveTo(x, y); p.lineTo(x, y + 1); }
      if (!dentroM(x + 1, y)) { p.moveTo(x + 1, y); p.lineTo(x + 1, y + 1); }
    }
    this.contorno = p;
  }
  private desenharSelecao(ctx: CanvasRenderingContext2D): void {
    if (!this.contorno) return;
    ctx.save();
    ctx.translate(this.ox, this.oy); ctx.scale(this.ui.zoom, this.ui.zoom);
    ctx.lineWidth = 1 / this.ui.zoom;
    ctx.strokeStyle = '#000'; ctx.setLineDash([4 / this.ui.zoom, 4 / this.ui.zoom]); ctx.lineDashOffset = -this.fase / this.ui.zoom; ctx.stroke(this.contorno);
    ctx.strokeStyle = '#fff'; ctx.lineDashOffset = (-this.fase + 4) / this.ui.zoom; ctx.stroke(this.contorno);
    ctx.restore();
  }
  private iniciarFormigas(): void {
    if (this.timerFormigas !== null || !this.contorno) return;
    this.timerFormigas = window.setInterval(() => { if (!this.contorno) { this.pararFormigas(); return; } this.fase = (this.fase + 1) % 8; this.pedirQuadro(); }, 120);
  }
  private pararFormigas(): void { if (this.timerFormigas !== null) { clearInterval(this.timerFormigas); this.timerFormigas = null; } }

  private desenharPrevia(ctx: CanvasRenderingContext2D): void {
    const t = this.ui.ferramenta;
    if (!this.inicio || !this.atual) return;
    const a = this.paraTela(this.inicio.x, this.inicio.y), b = this.paraTela(this.atual.x, this.atual.y);
    ctx.save();
    ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.strokeStyle = '#3aa0ff';
    if (t === 'selRet') ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    else if (t === 'selElipse') { ctx.beginPath(); ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2); ctx.stroke(); }
    else if (t === 'laco' && this.pontosLaco.length > 1) {
      ctx.beginPath(); this.pontosLaco.forEach((p, i) => { const s = this.paraTela(p.x, p.y); if (i) ctx.lineTo(s.x, s.y); else ctx.moveTo(s.x, s.y); }); ctx.stroke();
    }
    ctx.restore();
  }
  private desenharCursor(ctx: CanvasRenderingContext2D): void {
    const t = this.ui.ferramenta, c = this.ui.cursor;
    if (!c || !['pincel', 'lapis', 'borracha'].includes(t) || this.panDe) return;
    const s = this.paraTela(c.x, c.y), r = (this.ui.tamanho * this.ui.zoom) / 2;
    ctx.save();
    ctx.setLineDash([]); ctx.lineWidth = 1; ctx.strokeStyle = '#000'; ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(1.5, r), 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(1.5, r) + 1, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- histórico

  private registrar(): void {
    // cada passo guarda uma cópia da camada alterada: em imagens grandes o histórico é mais curto para não consumir a memória do aparelho
    this.hist.limite = limitar(Math.floor(240e6 / (this.doc.w * this.doc.h * 4 * Math.max(1, this.doc.camadas.length * 0.6))), 8, 80);
    this.hist.registrar(tirarInstantaneo(this.doc));
    this.ui.alterado = true;
    this.construirContorno(); this.iniciarFormigas();
    this.marcar(); this.sincronizar();
  }
  private aplicarInstantaneo(s: Instantaneo): void {
    restaurarInstantaneo(this.doc, s);
    this.construirContorno(); this.iniciarFormigas();
    this.marcar(); this.sincronizar();
  }
  desfazer(): void {
    if (this.flut) { this.cancelarFlutuante(); return; }
    const s = this.hist.desfazer();
    if (s) { this.aplicarInstantaneo(s); this.ui.alterado = true; this.aoMudar(); }
  }
  refazer(): void {
    this.confirmarFlutuante();
    const s = this.hist.refazer();
    if (s) { this.aplicarInstantaneo(s); this.ui.alterado = true; this.aoMudar(); }
  }

  // ---------------------------------------------------------------- ponteiro

  private pressao(e: PointerEvent): number { return e.pointerType === 'pen' && e.pressure > 0 ? Math.max(0.1, e.pressure) : 1; }
  private opcoesPincel(modo: 'pintar' | 'apagar', serrilhado = false) {
    return { tamanho: this.ui.tamanho, dureza: this.ui.dureza, opacidade: this.ui.opacidade / 100, cor: this.cor, modo, serrilhado };
  }
  private camadaEditavel(): boolean { return camadaAtiva(this.doc).visivel; }
  /** Amostra a cor sob o ponto, na camada ativa ou na imagem composta. */
  private amostra(): Pixels { return this.ui.amostrarTudo ? compor(this.doc) : camadaAtiva(this.doc).pixels; }

  aoPressionar(e: PointerEvent): void {
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* ponteiro sintético ou já encerrado: segue sem captura */ }
    const r = this.canvas.getBoundingClientRect();
    this.ponteiros.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    if (this.ponteiros.size === 2) { this.cancelarGestoAtual(); this.iniciarGesto2(); return; }
    if (this.ponteiros.size > 2) return;
    const p = this.paraDoc(e.clientX, e.clientY);
    // mover a tela: ferramenta mão, espaço, botão do meio
    if (this.ui.ferramenta === 'mao' || this.espaco || e.button === 1) { this.panDe = { x: e.clientX, y: e.clientY, ox: this.ox, oy: this.oy }; return; }
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.altKey && ['pincel', 'lapis', 'borracha', 'balde'].includes(this.ui.ferramenta)) { this.pegarCor(p); return; }
    this.iniciarFerramenta(e, p);
  }

  private pegarCor(p: { x: number; y: number }): void {
    const x = Math.floor(p.x), y = Math.floor(p.y), comp = this.amostra();
    if (x < 0 || y < 0 || x >= comp.w || y >= comp.h) return;
    const c = lerCor(comp, x, y);
    if (c.a === 0) return;
    this.ui.cor = hexDeCor(c); this.aoMudar();
  }

  private iniciarFerramenta(e: PointerEvent, p: { x: number; y: number }): void {
    const t = this.ui.ferramenta;
    this.modoSelecao = e.shiftKey ? 'somar' : e.altKey ? 'subtrair' : 'substituir';
    if (this.flut && t !== 'mover') this.confirmarFlutuante();
    switch (t) {
      case 'pincel': case 'lapis': case 'borracha': {
        if (!this.camadaEditavel()) { this.aviso('A camada está oculta: mostre-a para desenhar.'); return; }
        const px = prepararEdicao(this.doc);
        const modo = t === 'borracha' ? 'apagar' : 'pintar';
        this.traco = new Traco(px, this.opcoesPincel(modo, t === 'lapis'), this.doc.selecao);
        this.traco.mover(p.x, p.y, this.pressao(e));
        this.traco.aplicar(); this.marcar();
        break;
      }
      case 'linha': case 'retangulo': case 'elipse': {
        if (!this.camadaEditavel()) { this.aviso('A camada está oculta: mostre-a para desenhar.'); return; }
        const px = prepararEdicao(this.doc);
        this.baseForma = clonarPixels(px);
        this.inicio = p; this.atual = p;
        break;
      }
      case 'balde': {
        if (!this.camadaEditavel()) { this.aviso('A camada está oculta: mostre-a para pintar.'); return; }
        const ref = this.amostra(), px = prepararEdicao(this.doc);
        const r = preencher(px, ref, Math.floor(p.x), Math.floor(p.y), { ...this.cor, a: 255 * (this.ui.opacidade / 100) }, this.ui.tolerancia, this.ui.contiguo, this.doc.selecao, 1);
        if (r) this.registrar(); else this.marcar();
        break;
      }
      case 'conta': this.pegarCor(p); break;
      case 'selRet': case 'selElipse': this.inicio = p; this.atual = p; break;
      case 'laco': this.inicio = p; this.atual = p; this.pontosLaco = [p]; break;
      case 'varinha': {
        const m = mascaraPorCor(this.amostra(), Math.floor(p.x), Math.floor(p.y), this.ui.tolerancia, this.ui.contiguo);
        this.doc.selecao = combinarMascaras(this.doc.selecao, m, this.modoSelecao);
        if (!limitesDaMascara(this.doc.selecao)) this.doc.selecao = null;
        this.registrar();
        break;
      }
      case 'mover': this.iniciarMover(e, p); break;
      case 'texto': this.aoPedirTexto?.(p); break;
    }
  }
  private aviso(m: string): void { this.aoAvisar?.(m); }

  aoMover(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    if (this.ponteiros.has(e.pointerId)) this.ponteiros.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    const p = this.paraDoc(e.clientX, e.clientY);
    const antes = this.ui.cursor;
    this.ui.cursor = p;
    if (['pincel', 'lapis', 'borracha'].includes(this.ui.ferramenta) && (!antes || Math.abs(antes.x - p.x) + Math.abs(antes.y - p.y) > 0.01)) this.pedirQuadro();
    if (this.ponteiros.size === 2) { this.moverGesto2(); return; }
    if (this.panDe) { this.ox = this.panDe.ox + (e.clientX - this.panDe.x); this.oy = this.panDe.oy + (e.clientY - this.panDe.y); this.marcar(); return; }
    if (this.traco) {
      // eventos agrupados da caneta/mouse dão traços mais suaves
      const evs = e.getCoalescedEvents?.() ?? [];
      for (const ev of evs.length ? evs : [e]) { const q = this.paraDoc(ev.clientX, ev.clientY); this.traco.mover(q.x, q.y, this.pressao(ev)); }
      this.traco.aplicar(); this.marcar();
      return;
    }
    if (this.arrastoFlut) { this.arrastarFlutuante(e, p); return; }
    if (!this.inicio) return;
    this.atual = this.restringir(e, p);
    const t = this.ui.ferramenta;
    if (t === 'laco') this.pontosLaco.push(p);
    if ((t === 'linha' || t === 'retangulo' || t === 'elipse') && this.baseForma) this.previaForma();
    this.pedirQuadro();
  }

  /** Shift: quadrado/círculo perfeitos e linha em múltiplos de 45°. */
  private restringir(e: PointerEvent, p: { x: number; y: number }): { x: number; y: number } {
    if (!e.shiftKey || !this.inicio) return p;
    const t = this.ui.ferramenta, dx = p.x - this.inicio.x, dy = p.y - this.inicio.y;
    if (t === 'linha') { const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), d = Math.hypot(dx, dy); return { x: this.inicio.x + Math.cos(a) * d, y: this.inicio.y + Math.sin(a) * d }; }
    if (t === 'retangulo' || t === 'elipse' || t === 'selRet' || t === 'selElipse') { const m = Math.max(Math.abs(dx), Math.abs(dy)); return { x: this.inicio.x + Math.sign(dx || 1) * m, y: this.inicio.y + Math.sign(dy || 1) * m }; }
    return p;
  }

  private previaForma(): void {
    const px = camadaAtiva(this.doc).pixels, base = this.baseForma!, a = this.inicio!, b = this.atual!, t = this.ui.ferramenta as 'linha' | 'retangulo' | 'elipse';
    px.data.set(base.data);
    if (t !== 'linha' && this.ui.formaPreenchida) preencherForma(px, t, a.x, a.y, b.x, b.y, this.cor, this.ui.opacidade / 100, this.doc.selecao);
    else contornoDeForma(px, t, a.x, a.y, b.x, b.y, this.opcoesPincel('pintar'), this.doc.selecao);
    this.marcar();
  }

  aoSoltar(e: PointerEvent): void {
    this.ponteiros.delete(e.pointerId);
    if (this.gesto2) { if (this.ponteiros.size < 2) this.gesto2 = null; return; }
    if (this.panDe) { this.panDe = null; return; }
    const t = this.ui.ferramenta;
    if (this.traco) { this.traco.aplicar(); this.traco = null; this.registrar(); return; }
    if (this.arrastoFlut) { this.arrastoFlut = null; this.pedirQuadro(); return; }
    if (!this.inicio || !this.atual) { this.inicio = this.atual = null; return; }
    const a = this.inicio, b = this.atual;
    if ((t === 'linha' || t === 'retangulo' || t === 'elipse') && this.baseForma) {
      const moveu = Math.hypot(b.x - a.x, b.y - a.y) > 1;
      if (moveu) { this.previaForma(); this.baseForma = null; this.inicio = this.atual = null; this.registrar(); }
      else { camadaAtiva(this.doc).pixels.data.set(this.baseForma.data); this.baseForma = null; this.inicio = this.atual = null; this.marcar(); }
      return;
    }
    let nova: Mascara | null = null;
    const w = this.doc.w, h = this.doc.h;
    if (t === 'selRet') nova = mascaraRetangulo(w, h, a.x, a.y, b.x - a.x, b.y - a.y);
    else if (t === 'selElipse') nova = mascaraElipse(w, h, a.x, a.y, b.x - a.x, b.y - a.y);
    else if (t === 'laco') nova = mascaraLaco(w, h, this.pontosLaco);
    this.inicio = this.atual = null; this.pontosLaco = [];
    if (!nova) return;
    if (!limitesDaMascara(nova)) { // clique sem arrastar: limpa a seleção
      if (this.modoSelecao === 'substituir' && this.doc.selecao) { this.doc.selecao = null; this.registrar(); } else this.marcar();
      return;
    }
    this.doc.selecao = combinarMascaras(this.doc.selecao, nova, this.modoSelecao);
    if (!limitesDaMascara(this.doc.selecao)) this.doc.selecao = null;
    this.registrar();
  }
  aoCancelar(e: PointerEvent): void { this.ponteiros.delete(e.pointerId); this.cancelarGestoAtual(); }

  private cancelarGestoAtual(): void {
    if (this.traco) { this.traco.cancelar(); this.traco = null; }
    if (this.baseForma) { camadaAtiva(this.doc).pixels.data.set(this.baseForma.data); this.baseForma = null; }
    this.inicio = this.atual = null; this.pontosLaco = []; this.arrastoFlut = null; this.panDe = null;
    this.marcar();
  }

  // gesto de dois dedos: zoom e movimento
  private iniciarGesto2(): void {
    const [a, b] = [...this.ponteiros.values()] as [{ x: number; y: number }, { x: number; y: number }];
    this.gesto2 = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: this.ui.zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  }
  private moverGesto2(): void {
    if (!this.gesto2) return;
    const [a, b] = [...this.ponteiros.values()] as [{ x: number; y: number }, { x: number; y: number }];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1, cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    this.ox += cx - this.gesto2.cx; this.oy += cy - this.gesto2.cy;
    this.gesto2.cx = cx; this.gesto2.cy = cy;
    this.zoomPara(this.gesto2.zoom * (dist / this.gesto2.dist), cx, cy);
  }

  aoRolar(e: WheelEvent): void {
    e.preventDefault();
    const r = this.canvas.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) this.zoomPara(this.ui.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    else { this.ox -= e.deltaX; this.marcar(); }
  }
  definirEspaco(v: boolean): void { this.espaco = v; }
  aoSair(): void { this.ui.cursor = null; this.pedirQuadro(); }

  // ---------------------------------------------------------------- flutuante (mover, colar, texto)

  private iniciarMover(e: PointerEvent, p: { x: number; y: number }): void {
    if (!this.flut) {
      if (!this.camadaEditavel()) { this.aviso('A camada está oculta.'); return; }
      this.levantar();
      if (!this.flut) { this.aviso('Nada para mover: a camada (ou a seleção) está vazia.'); return; }
    }
    const alca = this.alcaEm(e.clientX, e.clientY);
    const f = this.flut!;
    this.arrastoFlut = { alca, x0: p.x, y0: p.y, cx0: f.cx, cy0: f.cy, sx0: f.sx, sy0: f.sy, rot0: f.rot, ang0: Math.atan2(p.y - f.cy, p.x - f.cx), dist0: Math.hypot(p.x - f.cx, p.y - f.cy) || 1 };
  }
  private alcaEm(clientX: number, clientY: number): Alca {
    const r = this.canvas.getBoundingClientRect(), sx = clientX - r.left, sy = clientY - r.top;
    const perto = (q: { x: number; y: number }) => Math.hypot(q.x - sx, q.y - sy) <= 11;
    if (perto(this.posRotacao())) return 'rotacionar';
    const [nw, ne, sw, se] = this.cantosFlutuante();
    if (perto(nw!)) return 'nw'; if (perto(ne!)) return 'ne'; if (perto(sw!)) return 'sw'; if (perto(se!)) return 'se';
    return 'corpo';
  }
  private arrastarFlutuante(e: PointerEvent, p: { x: number; y: number }): void {
    const f = this.flut!, g = this.arrastoFlut!;
    if (g.alca === 'corpo') { f.cx = g.cx0 + (p.x - g.x0); f.cy = g.cy0 + (p.y - g.y0); }
    else if (g.alca === 'rotacionar') {
      let rot = g.rot0 + (Math.atan2(p.y - f.cy, p.x - f.cx) - g.ang0);
      if (e.shiftKey) rot = Math.round(rot / (Math.PI / 12)) * (Math.PI / 12); // passos de 15°
      f.rot = rot;
    } else if (e.shiftKey) { // com Shift a escala mantém a proporção
      const k = Math.hypot(p.x - f.cx, p.y - f.cy) / g.dist0;
      f.sx = limitar(g.sx0 * k, 0.02, 40); f.sy = limitar(g.sy0 * k, 0.02, 40);
    } else { // sem Shift a escala é livre: cada eixo acompanha o ponteiro no sistema da própria imagem
      const cos = Math.cos(f.rot), sin = Math.sin(f.rot), lx = (p.x - f.cx) * cos + (p.y - f.cy) * sin, ly = -(p.x - f.cx) * sin + (p.y - f.cy) * cos;
      f.sx = limitar(Math.abs(lx) / (f.fonte.w / 2), 0.02, 40); f.sy = limitar(Math.abs(ly) / (f.fonte.h / 2), 0.02, 40);
    }
    this.pedirQuadro();
  }

  /** Tira a seleção (ou todo o conteúdo da camada) da camada e a deixa "solta", para mover, escalar e girar. */
  private levantar(): void {
    const antes = tirarInstantaneo(this.doc);
    const px = camadaAtiva(this.doc).pixels;
    const mascara = this.doc.selecao ?? this.mascaraDoConteudo(px);
    const ex = mascara ? extrairSelecao(px, mascara) : null;
    if (!ex || !mascara) return;
    const novo = prepararEdicao(this.doc);
    apagarSelecao(novo, mascara);
    this.flut = { fonte: ex.pixels, canvas: paraCanvas(ex.pixels), cx: ex.x + ex.pixels.w / 2, cy: ex.y + ex.pixels.h / 2, sx: 1, sy: 1, rot: 0, antes, origem: 'selecao' };
    this.doc.selecao = null; this.construirContorno();
    this.marcar(); this.sincronizar();
  }
  private mascaraDoConteudo(p: Pixels): Mascara | null {
    if (!limitesDoConteudo(p, 0)) return null;
    const m = criarMascara(p.w, p.h);
    for (let k = 0; k < m.data.length; k++) m.data[k] = p.data[k * 4 + 3]! > 0 ? 255 : 0;
    return m;
  }
  private novoFlutuante(pixels: Pixels, cx: number, cy: number, origem: Flutuante['origem']): void {
    this.confirmarFlutuante();
    this.flut = { fonte: pixels, canvas: paraCanvas(pixels), cx, cy, sx: 1, sy: 1, rot: 0, antes: tirarInstantaneo(this.doc), origem };
    this.doc.selecao = null; this.construirContorno();
    this.ui.ferramenta = 'mover';
    this.marcar(); this.sincronizar();
  }

  /** Cola o item solto na camada (com a escala e a rotação atuais) e o deixa selecionado. */
  confirmarFlutuante(): void {
    const f = this.flut;
    if (!f) return;
    this.flut = null; this.arrastoFlut = null;
    const c = document.createElement('canvas'); c.width = this.doc.w; c.height = this.doc.h;
    const x = c.getContext('2d', { willReadFrequently: true })!;
    x.translate(f.cx, f.cy); x.rotate(f.rot); x.scale(f.sx, f.sy);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(f.canvas, -f.fonte.w / 2, -f.fonte.h / 2);
    const resultado = dePixels(c);
    const px = prepararEdicao(this.doc);
    colarSobre(px, resultado, 0, 0, 1, null);
    const m = criarMascara(this.doc.w, this.doc.h);
    for (let k = 0; k < m.data.length; k++) m.data[k] = resultado.data[k * 4 + 3]! > 8 ? 255 : 0;
    this.doc.selecao = limitesDaMascara(m) ? m : null;
    this.registrar();
  }
  /** Desiste do que está solto e volta ao estado de antes de pegar. */
  cancelarFlutuante(): void {
    const f = this.flut;
    if (!f) return;
    this.flut = null; this.arrastoFlut = null;
    this.aplicarInstantaneo(f.antes);
  }

  // ---------------------------------------------------------------- seleção e área de transferência

  selecionarTudo(): void { this.confirmarFlutuante(); this.doc.selecao = mascaraRetangulo(this.doc.w, this.doc.h, 0, 0, this.doc.w, this.doc.h); this.registrar(); }
  desselecionar(): void { this.confirmarFlutuante(); if (this.doc.selecao) { this.doc.selecao = null; this.registrar(); } }
  inverterSelecao(): void {
    this.confirmarFlutuante();
    this.doc.selecao = this.doc.selecao ? inverterMascara(this.doc.selecao) : mascaraRetangulo(this.doc.w, this.doc.h, 0, 0, this.doc.w, this.doc.h);
    if (!limitesDaMascara(this.doc.selecao)) this.doc.selecao = null;
    this.registrar();
  }

  private recorteAtual(): Pixels | null {
    const px = camadaAtiva(this.doc).pixels, m = this.doc.selecao ?? this.mascaraDoConteudo(px);
    return m ? extrairSelecao(px, m)?.pixels ?? null : null;
  }
  copiar(): boolean {
    if (this.flut) { this.clipboard = this.flut.fonte; return true; }
    const r = this.recorteAtual();
    if (!r) return false;
    this.clipboard = r; return true;
  }
  cortar(): void { if (this.copiar()) this.apagarConteudo(); }
  /** Apaga a seleção (ou a camada toda, sem seleção). */
  apagarConteudo(): void {
    if (this.flut) { this.flut = null; this.arrastoFlut = null; this.registrar(); return; }
    if (!this.camadaEditavel()) return;
    const px = prepararEdicao(this.doc);
    if (this.doc.selecao) apagarSelecao(px, this.doc.selecao);
    else px.data.fill(0);
    this.registrar();
  }
  colar(): void { if (this.clipboard) this.colarPixels(this.clipboard); }
  /** Cola uma imagem (da área de transferência do sistema, ou de um arquivo) no centro da área visível. */
  colarPixels(p: Pixels): void {
    let src = p;
    if (p.w > this.doc.w || p.h > this.doc.h) src = this.redimensionarSimples(p, Math.min(this.doc.w / p.w, this.doc.h / p.h));
    const r = this.canvas.getBoundingClientRect(), centro = this.paraDoc(r.left + this.larguraVisao / 2, r.top + this.alturaVisao / 2);
    this.novoFlutuante(src, limitar(centro.x, 0, this.doc.w), limitar(centro.y, 0, this.doc.h), 'colagem');
  }
  private redimensionarSimples(p: Pixels, k: number): Pixels {
    const c = paraCanvas(p), o = document.createElement('canvas');
    o.width = Math.max(1, Math.round(p.w * k)); o.height = Math.max(1, Math.round(p.h * k));
    const x = o.getContext('2d', { willReadFrequently: true })!; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, o.width, o.height);
    return dePixels(o);
  }

  /** Abre uma imagem como camada nova (reduzida para caber, se for maior que a tela). */
  adicionarImagemComoCamada(p: Pixels, nome: string): void {
    this.confirmarFlutuante();
    let src = p;
    if (p.w > this.doc.w || p.h > this.doc.h) src = this.redimensionarSimples(p, Math.min(this.doc.w / p.w, this.doc.h / p.h));
    const px = criarPixels(this.doc.w, this.doc.h);
    colarSobre(px, src, Math.round((this.doc.w - src.w) / 2), Math.round((this.doc.h - src.h) / 2));
    adicionarCamada(this.doc, nome, px);
    this.registrar();
  }

  /** Cria um texto como item solto, centrado em (x,y). */
  inserirTexto(texto: string, x: number, y: number, tamanho: number, negrito: boolean, fonte: string): void {
    if (!texto.trim()) return;
    const medidor = document.createElement('canvas').getContext('2d')!;
    const fontCSS = `${negrito ? '700 ' : ''}${tamanho}px ${fonte}`;
    medidor.font = fontCSS;
    const linhas = texto.split('\n'), larg = Math.ceil(Math.max(...linhas.map((l) => medidor.measureText(l).width))) + 8, alt = Math.ceil(tamanho * 1.3 * linhas.length) + 8;
    const c = document.createElement('canvas'); c.width = Math.max(1, larg); c.height = Math.max(1, alt);
    const cx = c.getContext('2d', { willReadFrequently: true })!;
    cx.font = fontCSS; cx.fillStyle = this.ui.cor; cx.textBaseline = 'top';
    linhas.forEach((l, i) => cx.fillText(l, 4, 4 + i * tamanho * 1.3));
    this.novoFlutuante(dePixels(c), x, y, 'texto');
  }

  // ---------------------------------------------------------------- camadas

  novaCamada(): void { this.confirmarFlutuante(); adicionarCamada(this.doc); this.registrar(); }
  duplicar(): void { this.confirmarFlutuante(); duplicarCamada(this.doc); this.registrar(); }
  excluirCamada(): void { this.confirmarFlutuante(); if (removerCamada(this.doc)) this.registrar(); else this.aviso('A imagem precisa ter pelo menos uma camada.'); }
  moverCamadaAtiva(delta: 1 | -1): void { this.confirmarFlutuante(); if (moverCamada(this.doc, delta)) this.registrar(); }
  mesclar(): void { this.confirmarFlutuante(); if (mesclarAbaixo(this.doc)) this.registrar(); else this.aviso('Não há camada abaixo para mesclar.'); }
  escolherCamada(indiceDeCima: number): void {
    this.confirmarFlutuante();
    this.doc.ativa = this.doc.camadas.length - 1 - indiceDeCima;
    this.sincronizar();
  }
  alternarVisivel(indiceDeCima: number): void {
    this.confirmarFlutuante();
    const c = this.doc.camadas[this.doc.camadas.length - 1 - indiceDeCima]!;
    c.visivel = !c.visivel; this.registrar();
  }
  renomear(indiceDeCima: number, nome: string): void {
    const c = this.doc.camadas[this.doc.camadas.length - 1 - indiceDeCima]!;
    c.nome = nome.trim() || c.nome; this.registrar();
  }
  /** Opacidade da camada: `definitivo` registra no histórico (ao soltar o controle). */
  opacidadeDaCamada(indiceDeCima: number, v: number, definitivo: boolean): void {
    const c = this.doc.camadas[this.doc.camadas.length - 1 - indiceDeCima]!;
    c.opacidade = limitar(v, 0, 1);
    if (definitivo) this.registrar(); else { this.marcar(); this.sincronizar(); }
  }

  // ---------------------------------------------------------------- imagem inteira

  espelhar(horizontal: boolean): void { this.confirmarFlutuante(); espelharDocumento(this.doc, horizontal); this.depoisDeTamanho(); }
  girar(horario: boolean): void { this.confirmarFlutuante(); girarDocumento(this.doc, horario); this.depoisDeTamanho(); }
  tamanhoDaImagem(w: number, h: number): void { this.confirmarFlutuante(); redimensionarDocumento(this.doc, w, h); this.depoisDeTamanho(); }
  tamanhoDaTela(w: number, h: number): void {
    this.confirmarFlutuante();
    redimensionarTela(this.doc, w, h, (w - this.doc.w) / 2, (h - this.doc.h) / 2);
    this.depoisDeTamanho();
  }
  cortarAoConteudo(): void { this.confirmarFlutuante(); if (cortarAoConteudo(this.doc, 0)) this.depoisDeTamanho(); else this.aviso('Não há nada desenhado para cortar.'); }
  private depoisDeTamanho(): void { this.doc.selecao = null; this.registrar(); this.ajustarNaTela(); }
  get limiteLado(): number { return LIMITE_LADO; }

  // ---------------------------------------------------------------- saída

  /** Imagem final: as camadas visíveis achatadas. */
  achatar(): Pixels { this.confirmarFlutuante(); return compor(this.doc); }
  async exportarPng(): Promise<Blob> {
    const p = this.achatar(), c = paraCanvas(p);
    return new Promise((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('Não consegui gerar o PNG.'))), 'image/png'));
  }
  conteudoVazio(): boolean { return !limitesDoConteudo(compor(this.doc), 0); }

  destruir(): void { this.pararFormigas(); }
  /** Chamado pela interface depois de montar: desenha a primeira vez e inicia as formigas se houver seleção. */
  iniciar(): void { this.construirContorno(); this.iniciarFormigas(); this.marcar(); }
}




