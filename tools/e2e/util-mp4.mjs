// Leitor mínimo de MP4 (ISO BMFF) para conferir os arquivos exportados sem depender do ffprobe.
const u32 = (b, o) => b.readUInt32BE(o);
const tipo = (b, o) => b.toString('latin1', o, o + 4);

function* caixas(b, ini = 0, fim = b.length) {
  let o = ini;
  while (o + 8 <= fim) {
    let tam = u32(b, o), cab = 8;
    const t = tipo(b, o + 4);
    if (tam === 1) { tam = Number(b.readBigUInt64BE(o + 8)); cab = 16; } else if (tam === 0) tam = fim - o;
    if (tam < cab || o + tam > fim) throw new Error(`caixa "${t}" com tamanho inválido (${tam}) em ${o}`);
    yield { tipo: t, ini: o, corpo: o + cab, fim: o + tam };
    o += tam;
  }
}
const achar = (b, pai, t) => { for (const c of caixas(b, pai.corpo, pai.fim)) if (c.tipo === t) return c; return null; };

/** Lê o essencial: marca, ordem moov/mdat, e por faixa: tipo, codec, dimensões, nº de amostras, duração e quadros-chave. */
export function lerMp4(buffer) {
  const b = Buffer.from(buffer);
  const topo = [...caixas(b)];
  const ftyp = topo.find((c) => c.tipo === 'ftyp');
  const moov = topo.find((c) => c.tipo === 'moov'), mdat = topo.find((c) => c.tipo === 'mdat');
  if (!ftyp || !moov || !mdat) throw new Error(`faltam caixas: ${topo.map((c) => c.tipo).join(',')}`);
  const mvhd = achar(b, moov, 'mvhd');
  const escalaFilme = u32(b, mvhd.corpo + 12), duracaoFilme = u32(b, mvhd.corpo + 16) / escalaFilme;
  const faixas = [];
  for (const trak of caixas(b, moov.corpo, moov.fim)) {
    if (trak.tipo !== 'trak') continue;
    const tkhd = achar(b, trak, 'tkhd'), mdia = achar(b, trak, 'mdia'), mdhd = achar(b, mdia, 'mdhd'), hdlr = achar(b, mdia, 'hdlr'), minf = achar(b, mdia, 'minf'), stbl = achar(b, minf, 'stbl');
    const stsd = achar(b, stbl, 'stsd'), stsz = achar(b, stbl, 'stsz'), stss = achar(b, stbl, 'stss');
    const entrada = u32(b, stsd.corpo + 8 + 4); // primeira entrada de descrição de amostra
    const codec = tipo(b, stsd.corpo + 8 + 4);
    const f = { handler: tipo(b, hdlr.corpo + 8), codec, amostras: u32(b, stsz.corpo + 8), quadrosChave: stss ? u32(b, stss.corpo + 4) : 0, tamanhoEntrada: entrada };
    const escala = u32(b, mdhd.corpo + 12); f.duracao = u32(b, mdhd.corpo + 16) / escala;
    if (f.handler === 'vide') { f.w = b.readUInt16BE(stsd.corpo + 8 + 8 + 24); f.h = b.readUInt16BE(stsd.corpo + 8 + 8 + 26); f.tkhdW = u32(b, tkhd.corpo + 76) / 65536; f.tkhdH = u32(b, tkhd.corpo + 80) / 65536; }
    if (f.handler === 'soun') { f.canais = b.readUInt16BE(stsd.corpo + 8 + 8 + 16); f.taxa = u32(b, stsd.corpo + 8 + 8 + 24) / 65536; }
    faixas.push(f);
  }
  return { marca: tipo(b, ftyp.corpo), moovAntesDeMdat: moov.ini < mdat.ini, duracaoFilme, faixas, video: faixas.find((f) => f.handler === 'vide'), audio: faixas.find((f) => f.handler === 'soun'), tamanho: b.length };
}
