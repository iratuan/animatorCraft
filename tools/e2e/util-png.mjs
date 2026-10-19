// Utilidades dos testes: gera PNGs reais, zips e arquivos de áudio, sem depender de pacotes extras.
import { deflateSync } from 'node:zlib';
import { zipSync, strToU8 } from 'fflate';

const tabela = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = tabela[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const bloco = (tipo, dados) => {
  const t = Buffer.from(tipo, 'ascii'), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(dados.length); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([len, t, dados, crc]);
};

/** PNG RGBA. `pixel(x, y)` devolve [r, g, b, a]. */
export function criarPng(w, h, pixel) {
  const bruto = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    bruto[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) { const p = pixel(x, y), i = y * (w * 4 + 1) + 1 + x * 4; bruto[i] = p[0]; bruto[i + 1] = p[1]; bruto[i + 2] = p[2]; bruto[i + 3] = p[3] ?? 255; }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return new Uint8Array(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloco('IHDR', ihdr), bloco('IDAT', deflateSync(bruto)), bloco('IEND', Buffer.alloc(0))]));
}

const NADA = [0, 0, 0, 0];
/** Boneco simples (cabeça e corpo) numa tela w×h com fundo transparente; `cor` muda o desenho para distinguir os arquivos. */
export const sprite = (w, h, cor = [20, 20, 20]) => criarPng(w, h, (x, y) => {
  const cx = w / 2, dentroCabeca = Math.hypot(x - cx, y - h * 0.22) < h * 0.16;
  const corpo = Math.abs(x - cx) < w * 0.06 && y > h * 0.38 && y < h * 0.8;
  const braco = y > h * 0.45 && y < h * 0.5 && Math.abs(x - cx) < w * 0.25;
  const perna = y >= h * 0.8 && y < h * 0.95 && Math.abs(Math.abs(x - cx) - w * 0.1) < w * 0.03;
  return dentroCabeca || corpo || braco || perna ? [...cor, 255] : NADA;
});
/** Só a cabeça (rosto): disco com olhos e boca. */
export const rosto = (w = 120, h = 120, cor = [30, 30, 30]) => criarPng(w, h, (x, y) => {
  const d = Math.hypot(x - w / 2, y - h / 2);
  if (d > w * 0.45) return NADA;
  const borda = d > w * 0.40;
  const olho = (Math.hypot(x - w * 0.35, y - h * 0.42) < 6) || (Math.hypot(x - w * 0.65, y - h * 0.42) < 6);
  const boca = Math.abs(y - h * 0.68) < 3 && Math.abs(x - w / 2) < w * 0.18;
  return borda || olho || boca ? [...cor, 255] : [250, 220, 190, 255];
});
/** Imagem com fundo branco opaco (sem transparência), com um quadrado preto no meio. */
export const fundoBranco = (w, h) => criarPng(w, h, (x, y) => (Math.abs(x - w / 2) < w * 0.2 && Math.abs(y - h / 2) < h * 0.2 ? [0, 0, 0, 255] : [255, 255, 255, 255]));
/** Imagem totalmente transparente. */
export const transparente = (w, h) => criarPng(w, h, () => NADA);
/** Gradiente colorido opaco (para imagens da lousa). */
export const gradiente = (w, h) => criarPng(w, h, (x, y) => [(x * 255) / w, (y * 255) / h, 128, 255]);

export const zip = (arquivos) => zipSync(Object.fromEntries(Object.entries(arquivos).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v])));

/** WAV mono 16 bits com um tom (para narração, música e efeitos de teste). */
export function wav(segundos = 1, freq = 440, taxa = 22050) {
  const n = Math.round(taxa * segundos), b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(taxa, 24); b.writeUInt32LE(taxa * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin((2 * Math.PI * freq * i) / taxa) * 9000 * (0.4 + 0.6 * Math.abs(Math.sin(i / 2500)))), 44 + i * 2);
  return new Uint8Array(b);
}

/** Pequeno executor de verificações: conta, lista as falhas e devolve o código de saída. */
export function criarVerificador() {
  const falhas = []; let passou = 0;
  return {
    ok(cond, msg) { if (cond) passou++; else { falhas.push(msg); console.log('  ✖ FALHOU:', msg); } },
    igual(a, b, msg) { const sa = JSON.stringify(a), sb = JSON.stringify(b); if (sa === sb) passou++; else { falhas.push(msg); console.log(`  ✖ FALHOU: ${msg}\n     obtido:   ${sa}\n     esperado: ${sb}`); } },
    fim(nome) { console.log(`\n${nome}: ${passou} verificações ok, ${falhas.length} falha(s)`); return falhas.length ? 1 : 0; },
    get falhas() { return falhas.length; },
  };
}

import http from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
/** Servidor local de arquivos (com Range, como um servidor de vídeo de verdade): o navegador só deixa ler os quadros de um vídeo de mesma origem. */
export function servirArquivos(pasta) {
  const s = http.createServer((req, res) => {
    try {
      const f = join(pasta, normalize(decodeURIComponent((req.url ?? '/').slice(1).split('?')[0])).replace(/^(\.\.[\\/])+/, ''));
      const { size } = statSync(f), r = req.headers.range, tipo = f.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';
      if (r) {
        const m = /bytes=(\d*)-(\d*)/.exec(r), ini = m[1] ? Number(m[1]) : 0, fim = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
        res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${ini}-${fim}/${size}`, 'Content-Length': fim - ini + 1, 'Accept-Ranges': 'bytes' });
        createReadStream(f, { start: ini, end: fim }).pipe(res);
      } else { res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); createReadStream(f).pipe(res); }
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => s.listen(0, '127.0.0.1', () => ok({ porta: s.address().port, fechar: () => s.close() })));
}
