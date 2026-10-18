/**
 * Histórico genérico de desfazer/refazer: cada passo é um instantâneo do estado *depois* da ação; o primeiro é o estado inicial.
 */
export class Historico<T> {
  private passos: T[];
  private posicao = 0;
  /** passos guardados (o mais antigo cai quando passa disso); pode ser mudado a qualquer hora (ex.: imagens grandes guardam menos) */
  limite: number;
  constructor(inicial: T, limite = 60) { this.passos = [inicial]; this.limite = limite; }

  registrar(estado: T): void {
    this.passos.length = this.posicao + 1; // uma ação nova descarta o "refazer"
    this.passos.push(estado);
    this.posicao++;
    while (this.passos.length > Math.max(2, this.limite)) { this.passos.shift(); this.posicao--; }
  }
  get podeDesfazer(): boolean { return this.posicao > 0; }
  get podeRefazer(): boolean { return this.posicao < this.passos.length - 1; }
  desfazer(): T | null { if (!this.podeDesfazer) return null; this.posicao--; return this.passos[this.posicao]!; }
  refazer(): T | null { if (!this.podeRefazer) return null; this.posicao++; return this.passos[this.posicao]!; }
  get atual(): T { return this.passos[this.posicao]!; }
  get tamanho(): number { return this.passos.length; }
}

