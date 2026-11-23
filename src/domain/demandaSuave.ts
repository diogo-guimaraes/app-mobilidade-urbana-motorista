// Mancha de demanda suave: em vez de um hexágono por célula, as demandas viram
// um campo contínuo (uma gaussiana por célula, combinada sem passar de 1) e o
// campo é pintado numa única imagem, que o mapa estica por cima das ruas. Células
// vizinhas com demanda parecida se fundem numa mancha só, a borda sai desfocada
// e o mapa recebe um objeto só (centenas de polígonos travavam o desenho).

import { desprojetar, projetar, type Ponto } from "@/domain/dinamica";
import { corDoCampo } from "@/theme/demandaCores";

export interface AreaDeDemanda extends Ponto {
  // 0 (pouca) a 1 (muita)
  demanda: number;
}

export interface ImagemDaDemanda {
  // PNG em data URI
  uri: string;
  // [nordeste, sudoeste] em [latitude, longitude], como o Overlay do mapa pede
  bounds: [[number, number], [number, number]];
}

const MAXIMO_DE_PIXELS_POR_LADO = 160;

/**
 * Campo de demanda numa grade fina em volta das células. Os valores vão de 0 a
 * 1, em linhas de baixo para cima, a partir da origem (minX, minY) em metros da
 * projeção.
 */
export function campoDeDemanda(
  areas: AreaDeDemanda[],
  raioMetros: number,
  espalhamento: number,
) {
  const sigma = raioMetros * espalhamento;
  const alcance = sigma * 3;
  const projetadas = areas.map((a) => ({ p: projetar(a), d: a.demanda }));
  const xs = projetadas.map(({ p }) => p[0]);
  const ys = projetadas.map(({ p }) => p[1]);
  const minX = Math.min(...xs) - alcance;
  const minY = Math.min(...ys) - alcance;
  const maxX = Math.max(...xs) + alcance;
  const maxY = Math.max(...ys) + alcance;
  const passo = Math.max(
    raioMetros / 5,
    (maxX - minX) / MAXIMO_DE_PIXELS_POR_LADO,
    (maxY - minY) / MAXIMO_DE_PIXELS_POR_LADO,
  );
  const colunas = Math.ceil((maxX - minX) / passo) + 1;
  const linhas = Math.ceil((maxY - minY) / passo) + 1;
  // 1 - produto de (1 - contribuição): vizinhas somam sem estourar o teto
  const resto = new Float32Array(colunas * linhas).fill(1);
  const raioEmPassos = Math.ceil(alcance / passo);

  for (const { p, d } of projetadas) {
    const ci = Math.round((p[0] - minX) / passo);
    const cj = Math.round((p[1] - minY) / passo);
    const jFim = Math.min(cj + raioEmPassos + 1, linhas);
    const iFim = Math.min(ci + raioEmPassos + 1, colunas);

    for (let j = Math.max(cj - raioEmPassos, 0); j < jFim; j += 1) {
      for (let i = Math.max(ci - raioEmPassos, 0); i < iFim; i += 1) {
        const dx = minX + i * passo - p[0];
        const dy = minY + j * passo - p[1];
        const peso = d * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));

        resto[j * colunas + i] *= 1 - peso;
      }
    }
  }

  const valores = resto.map((r) => 1 - r);

  return { valores, colunas, linhas, minX, minY, passo };
}

// ---- PNG sem compressão: poucos KB a mais, e sem biblioteca

const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);

  for (let n = 0; n < 256; n += 1) {
    let c = n;

    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    tabela[n] = c >>> 0;
  }

  return tabela;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) {
    c = TABELA_CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }

  return (c ^ 0xffffffff) >>> 0;
};

const adler32 = (bytes: Uint8Array) => {
  let a = 1;
  let b = 0;

  for (let i = 0; i < bytes.length; i += 1) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }

  return ((b << 16) | a) >>> 0;
};

const quatroBytes = (valor: number) => [
  (valor >>> 24) & 255,
  (valor >>> 16) & 255,
  (valor >>> 8) & 255,
  valor & 255,
];

function bloco(tipo: string, dados: Uint8Array): Uint8Array {
  const saida = new Uint8Array(12 + dados.length);
  const corpo = new Uint8Array(4 + dados.length);

  for (let i = 0; i < 4; i += 1) corpo[i] = tipo.charCodeAt(i);
  corpo.set(dados, 4);
  saida.set(quatroBytes(dados.length), 0);
  saida.set(corpo, 4);
  saida.set(quatroBytes(crc32(corpo)), 8 + dados.length);

  return saida;
}

function codificarPng(largura: number, altura: number, rgba: Uint8Array) {
  // cada linha começa com o byte de filtro 0
  const cru = new Uint8Array((largura * 4 + 1) * altura);

  for (let y = 0; y < altura; y += 1) {
    cru.set(
      rgba.subarray(y * largura * 4, (y + 1) * largura * 4),
      y * (largura * 4 + 1) + 1,
    );
  }

  // zlib em blocos "stored" (sem compressão), de até 65535 bytes
  const blocos = Math.ceil(cru.length / 65535);
  const zlib = new Uint8Array(2 + cru.length + blocos * 5 + 4);
  let posicao = 0;

  zlib[posicao++] = 0x78;
  zlib[posicao++] = 0x01;

  for (let b = 0; b < blocos; b += 1) {
    const parte = cru.subarray(b * 65535, (b + 1) * 65535);

    zlib[posicao++] = b === blocos - 1 ? 1 : 0;
    zlib[posicao++] = parte.length & 255;
    zlib[posicao++] = parte.length >>> 8;
    zlib[posicao++] = ~parte.length & 255;
    zlib[posicao++] = (~parte.length >>> 8) & 255;
    zlib.set(parte, posicao);
    posicao += parte.length;
  }

  zlib.set(quatroBytes(adler32(cru)), posicao);

  const cabecalho = new Uint8Array(13);

  cabecalho.set(quatroBytes(largura), 0);
  cabecalho.set(quatroBytes(altura), 4);
  cabecalho.set([8, 6, 0, 0, 0], 8); // 8 bits, RGBA

  const partes = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    bloco("IHDR", cabecalho),
    bloco("IDAT", zlib),
    bloco("IEND", new Uint8Array(0)),
  ];
  const png = new Uint8Array(partes.reduce((soma, p) => soma + p.length, 0));
  let ponto = 0;

  for (const parte of partes) {
    png.set(parte, ponto);
    ponto += parte.length;
  }

  return png;
}

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function paraBase64(bytes: Uint8Array) {
  const partes: string[] = [];

  for (let i = 0; i < bytes.length; i += 3) {
    const n =
      (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);

    partes.push(
      BASE64[(n >> 18) & 63] +
        BASE64[(n >> 12) & 63] +
        (i + 1 < bytes.length ? BASE64[(n >> 6) & 63] : "=") +
        (i + 2 < bytes.length ? BASE64[n & 63] : "="),
    );
  }

  return partes.join("");
}

// célula "q:r" da grade hexagonal (pontas para cima) que contém um ponto da
// projeção; é a mesma conta do backend (GradeHexagonal)
function celulaDoPonto(x: number, y: number, raioMetros: number) {
  const q = ((Math.sqrt(3) / 3) * x - y / 3) / raioMetros;
  const r = ((2 / 3) * y) / raioMetros;
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;

  return `${rq}:${rr}`;
}

/**
 * A mancha de demanda como uma imagem e o retângulo do mapa que ela cobre. As
 * células em `ocultas` ficam transparentes: ali há outra camada por cima, e a
 * mancha não pode aparecer por baixo (ou por cima) dela.
 */
export function imagemDaDemanda(
  areas: AreaDeDemanda[],
  raioMetros: number,
  espalhamento: number,
  ocultas?: ReadonlySet<string>,
): ImagemDaDemanda | null {
  if (areas.length === 0) return null;

  const { valores, colunas, linhas, minX, minY, passo } = campoDeDemanda(
    areas,
    raioMetros,
    espalhamento,
  );
  const rgba = new Uint8Array(colunas * linhas * 4);

  for (let j = 0; j < linhas; j += 1) {
    // a imagem começa pelo norte; o campo, pelo sul
    const linhaDaImagem = linhas - 1 - j;

    for (let i = 0; i < colunas; i += 1) {
      if (
        ocultas !== undefined &&
        ocultas.size > 0 &&
        ocultas.has(
          celulaDoPonto(minX + i * passo, minY + j * passo, raioMetros),
        )
      ) {
        continue;
      }

      const [r, g, b, a] = corDoCampo(valores[j * colunas + i]);
      const destino = (linhaDaImagem * colunas + i) * 4;

      rgba[destino] = r;
      rgba[destino + 1] = g;
      rgba[destino + 2] = b;
      rgba[destino + 3] = a;
    }
  }

  // cada pixel é o centro de uma célula da grade: a imagem vai meio pixel além
  const sudoeste = desprojetar(minX - passo / 2, minY - passo / 2);
  const nordeste = desprojetar(
    minX + (colunas - 0.5) * passo,
    minY + (linhas - 0.5) * passo,
  );

  return {
    uri: `data:image/png;base64,${paraBase64(codificarPng(colunas, linhas, rgba))}`,
    bounds: [
      [nordeste.latitude, nordeste.longitude],
      [sudoeste.latitude, sudoeste.longitude],
    ],
  };
}
