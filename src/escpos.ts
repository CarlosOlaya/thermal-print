import { create as crearQr } from 'qrcode/lib/core/qrcode.js';
import { center, sanitizeText } from './utils';
import { FOODLY_FOOTER_MARKER, FOODLY_FOOTER_RASTER, isFoodlyFooterLine } from './foodly-footer';

export const ESC = '\x1B';
const GS = '\x1D';

export interface EscPosByteOptions {
  cut?: boolean;
  openCashDrawer?: boolean;
  beepAfterPrint?: boolean;
  logo?: RasterLogo;
  leftMarginDots?: number;
}

export interface RasterLogo {
  widthBytes: number;
  height: number;
  data: string;
  escala?: LogoScale;
  /** Ancho del ticket que lleva este logo. Sin dato se usa el límite de 58 mm. */
  columns?: number;
}

export const MAX_LOGO_WIDTH_BYTES = 18;
export const MAX_LOGO_HEIGHT = 80;
export const LOGO_SCALES = [75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400] as const;
export type LogoScale = (typeof LOGO_SCALES)[number];
export const DEFAULT_LOGO_SCALE: LogoScale = 200;

/** Recorta filas blancas y escala el logo al ancho útil sin deformarlo. */
function rasterLogoBytes(logo?: RasterLogo): number[] {
  if (!logo) return [];
  const { widthBytes, height, data } = logo;
  if (!Number.isInteger(widthBytes) || widthBytes < 1 || widthBytes > MAX_LOGO_WIDTH_BYTES ||
      !Number.isInteger(height) || height < 1 || height > MAX_LOGO_HEIGHT ||
      typeof data !== 'string' || data.length !== Math.ceil(widthBytes * height / 3) * 4) return [];
  let image: string;
  try {
    image = atob(data);
  } catch {
    return [];
  }
  if (image.length !== widthBytes * height) return [];
  let firstInk = 0;
  let lastInk = image.length - 1;
  while (firstInk <= lastInk && image.charCodeAt(firstInk) === 0) firstInk++;
  if (firstInk > lastInk) return [];
  while (image.charCodeAt(lastInk) === 0) lastInk--;
  const top = Math.floor(firstInk / widthBytes);
  const inkHeight = Math.floor(lastInk / widthBytes) - top + 1;
  const scale = logo.escala !== undefined && LOGO_SCALES.includes(logo.escala)
    ? logo.escala : DEFAULT_LOGO_SCALE;
  const width = widthBytes * 8;
  const paperDots = logo.columns === 48 ? 576 : 384;
  const ratio = Math.min(scale / 100, paperDots / width);
  const scaledWidth = Math.round(width * ratio);
  const scaledHeight = Math.max(1, Math.round(inkHeight * ratio));
  const scaledWidthBytes = Math.ceil(scaledWidth / 8);
  const raster = new Uint8Array(scaledWidthBytes * scaledHeight);
  for (let y = 0; y < scaledHeight; y++) {
    const sourceRow = (top + Math.floor(y * inkHeight / scaledHeight)) * widthBytes;
    for (let x = 0; x < scaledWidth; x++) {
      const sourceX = Math.floor(x * width / scaledWidth);
      if (image.charCodeAt(sourceRow + (sourceX >> 3)) & (0x80 >> (sourceX % 8))) {
        raster[y * scaledWidthBytes + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }
  }
  // Separa el logo de cabecera del nombre.
  return [...centeredRasterBytes(scaledWidthBytes, scaledHeight, raster), 0x0a];
}

function centeredRasterBytes(widthBytes: number, height: number, raster: Iterable<number>): number[] {
  return [
    0x1b, 0x61, 0x01,
    0x1d, 0x76, 0x30, 0x00, widthBytes & 0xff, widthBytes >> 8, height & 0xff, height >> 8,
    ...raster,
    0x1b, 0x61, 0x00,
  ];
}

const footerRasterBytes = centeredRasterBytes(
  FOODLY_FOOTER_RASTER.widthBytes,
  FOODLY_FOOTER_RASTER.height,
  Array.from(atob(FOODLY_FOOTER_RASTER.data), byte => byte.charCodeAt(0)),
);

export function escBold(active: boolean): string {
  return ESC + (active ? '\x45\x01' : '\x45\x00');
}

export function escFontSize(size: 1 | 2 | 3 | 4): string {
  const map = {
    1: '\x1D\x21\x00',
    2: '\x1D\x21\x01',
    3: '\x1D\x21\x10',
    4: '\x1D\x21\x11',
  };
  return map[size];
}

export function escCut(): string {
  return GS + '\x56\x00';
}

export function escLeftMargin(dots = 0): string {
  const safeDots = Math.max(0, Math.min(65535, Math.trunc(dots)));
  return GS + '\x4C' + String.fromCharCode(safeDots & 0xff, (safeDots >> 8) & 0xff);
}

export function escCashDrawerPulse(): string {
  return ESC + '\x70\x00\x19\xFA';
}

export function escBeep(count = 2, duration = 3): string {
  const safeCount = Math.max(1, Math.min(9, Math.trunc(count)));
  const safeDuration = Math.max(1, Math.min(9, Math.trunc(duration)));
  return ESC + '\x42' + String.fromCharCode(safeCount, safeDuration);
}

/**
 * Separador (0x1E, RS) que delimita un bloque de QR dentro del texto. No
 * aparece ni en tirillas ni en el contenido DIAN, así que es seguro como marca.
 * Formato: SENTINEL + <char tamaño de módulo> + <datos> + SENTINEL.
 */
const QR_SENTINEL = '\x1E';

/**
 * Marca un QR en el texto renderizado. El contenido (`data`) se imprime como
 * QR NATIVO de la impresora (comando GS ( k) al convertir a bytes — no como
 * texto. `moduleSize` (3–8) ajusta el tamaño del punto: 5 en 58mm, 7 en 80mm.
 */
export function qrMarker(data: string, moduleSize = 6): string {
  const size = Math.max(3, Math.min(8, Math.trunc(moduleSize)));
  return QR_SENTINEL + String.fromCharCode(size) + (data || '') + QR_SENTINEL;
}

/** Bytes del QR nativo (modelo 2, corrección M), centrado */
function escQrCommandBytes(data: string, moduleSize: number): number[] {
  const enc: number[] = [];
  for (const ch of data) enc.push(ch.charCodeAt(0) & 0xff);
  const store = enc.length + 3;
  return [
    0x1b, 0x61, 0x01, // ESC a 1 — centrar
    0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00, // modelo 2
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize & 0xff, // tamaño módulo
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31, // corrección M
    0x1d, 0x28, 0x6b, store & 0xff, (store >> 8) & 0xff, 0x31, 0x50, 0x30, ...enc, // datos
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30, // imprimir
    0x1b, 0x61, 0x00, // ESC a 0 — volver a izquierda
  ];
}

export interface QrRotulado {
  data: string;
  /** Texto corto debajo del QR */
  rotulo: string;
}

/**
 * Separador (0x1C, FS) que abre el renglón entre dos QR que van en la MISMA fila. Los
 * puentes anteriores lo descartan e imprimen los dos QR nativos uno debajo del otro,
 * cada uno con su rótulo: la tirilla sirve igual mientras se actualizan.
 */
const QR_FILA = '\x1C';

/** Uno o dos QR con rótulo. El renglón del primer rótulo mide `columns`: de ahí sale el ancho. */
export function qrFilaMarker(qrs: QrRotulado[], columns: number): string {
  const size = columns >= 42 ? 5 : 4;
  const [a, b] = qrs.filter(qr => qr.data);
  if (!a) return '';
  if (!b) return `${qrMarker(a.data, size)}\n${center(a.rotulo, columns)}`;
  return `${qrMarker(a.data, size)}\n${QR_FILA}${center(a.rotulo, columns).padEnd(columns)}\n` +
    `${qrMarker(b.data, size)}\n${center(b.rotulo, columns)}`;
}

/**
 * Dos QR como UNA imagen: el QR nativo siempre ocupa su propio renglón. Cada uno va
 * centrado en su mitad del papel, con la zona blanca que pide el lector. Null si no cabe.
 */
function qrFilaBytes(datos: [string, string], columns: number): number[] | null {
  try {
    const version = Math.max(...datos.map(d => crearQr(d, { errorCorrectionLevel: 'M' }).version));
    const [a, b] = datos.map(d => crearQr(d, { errorCorrectionLevel: 'M', version }).modules);
    const mitad = columns * 6; // 12 puntos por columna
    const punto = Math.min(5, Math.floor(mitad / (a.size + 6)));
    if (punto < 3) return null;
    const lado = a.size * punto;
    // Se recorta lo mismo a los dos lados: la impresora centra la imagen.
    const recorte = Math.floor((mitad - lado) / 2 / 8) * 8;
    const widthBytes = (mitad - recorte) / 4;
    const xA = Math.floor((mitad - lado) / 2) - recorte;
    const blanco = punto * 4;
    const height = lado + blanco * 2;
    const raster = new Uint8Array(widthBytes * height);
    for (let y = 0; y < lado; y++) {
      const fila = Math.floor(y / punto);
      for (let x = 0; x < lado; x++) {
        const col = Math.floor(x / punto);
        for (const [simbolo, x0] of [[a, xA], [b, xA + mitad]] as const) {
          if (!simbolo.get(fila, col)) continue;
          raster[(blanco + y) * widthBytes + ((x0 + x) >> 3)] |= 0x80 >> ((x0 + x) % 8);
        }
      }
    }
    return centeredRasterBytes(widthBytes, height, raster);
  } catch {
    return null;
  }
}

/** Si los segmentos que siguen son una fila de dos QR, sus bytes (imagen y rótulos). */
function filaDesdeSegmentos(segmentos: string[], s: number): number[] | null {
  const primero = /^\n\x1C([^\n]+)\n$/.exec(segmentos[s + 1] ?? '');
  const segundo = /^\n([^\n]*)/.exec(segmentos[s + 3] ?? '');
  if (!primero || !segundo) return null;
  const columns = primero[1].length;
  const imagen = qrFilaBytes([segmentos[s].slice(1), segmentos[s + 2].slice(1)], columns);
  if (!imagen) return null;
  const mitad = columns / 2;
  const rotulos = center(primero[1].trim(), mitad).padEnd(mitad) + center(segundo[1].trim(), mitad);
  segmentos[s + 3] = segmentos[s + 3].slice(segundo[0].length);
  return [...imagen, ...textSegmentToBytes(rotulos)];
}

/** Convierte un segmento de TEXTO (sin QR) a bytes ESC/POS con la whitelist */
function textSegmentToBytes(segment: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < segment.length; i++) {
    if (segment[i] === FOODLY_FOOTER_MARKER && (i === 0 || segment[i - 1] === '\n')) {
      const lineBreak = segment.indexOf('\n', i);
      const end = lineBreak === -1 ? segment.length : lineBreak;
      if (isFoodlyFooterLine(segment.slice(i, end))) {
        bytes.push(...footerRasterBytes);
        i = end - 1;
        continue;
      }
    }
    const code = segment.charCodeAt(i);
    if (code === 0x1b || code === 0x1d || code === 0x0a || code === 0x0d) {
      bytes.push(code);
      if (code === 0x1b || code === 0x1d) {
        const command = segment.charCodeAt(i + 1);
        if (Number.isFinite(command)) {
          bytes.push(command);
          const paramCount = escPosParamCount(code, command);
          for (let param = 0; param < paramCount && i + 2 + param < segment.length; param++) {
            bytes.push(segment.charCodeAt(i + 2 + param) & 0xff);
          }
          i += 1 + paramCount;
        }
      }
      continue;
    }
    const safe = sanitizeText(segment[i]);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 0x20 && safeCode <= 0x7e) bytes.push(safeCode);
    }
  }
  return bytes;
}

export function textToEscPosBytes(text: string, options: EscPosByteOptions = {}): Uint8Array {
  const bytes: number[] = [0x1b, 0x40];
  if (options.openCashDrawer) bytes.push(...textSegmentToBytes(escCashDrawerPulse()));
  if (options.leftMarginDots !== undefined) bytes.push(...textSegmentToBytes(escLeftMargin(options.leftMarginDots)));
  const logo = rasterLogoBytes(options.logo);
  bytes.push(...logo);
  const document = [
    (text || '').replace(/^(?:[ \t]*(?:\r\n?|\n))+/, ''),
    options.cut ? escCut() : '',
    options.beepAfterPrint ? escBeep() : '',
  ].join('');

  // Los segmentos impares (entre SENTINELs) son bloques de QR nativo; los pares
  // son texto normal. Un doc sin QR es un único segmento par (comportamiento
  // idéntico al anterior).
  const segmentos = document.split(QR_SENTINEL);
  for (let s = 0; s < segmentos.length; s++) {
    if (s % 2 === 1) {
      const fila = filaDesdeSegmentos(segmentos, s);
      if (fila) {
        bytes.push(...fila);
        s += 2;
        continue;
      }
      const seg = segmentos[s];
      const moduleSize = seg.charCodeAt(0) || 6;
      const data = seg.slice(1);
      if (data) bytes.push(...escQrCommandBytes(data, moduleSize));
    } else {
      bytes.push(...textSegmentToBytes(segmentos[s]));
    }
  }

  return new Uint8Array(bytes);
}

function escPosParamCount(prefix: number, command: number): number {
  if (prefix === 0x1b) {
    if (command === 0x42) return 2; // ESC B n t
    if (command === 0x45) return 1; // ESC E n
    if (command === 0x70) return 3; // ESC p m t1 t2
    if (command === 0x61) return 1; // ESC a n
    return 0;
  }

  if (prefix === 0x1d) {
    if (command === 0x21) return 1; // GS ! n
    if (command === 0x4c) return 2; // GS L nL nH
    if (command === 0x56) return 1; // GS V m
    return 0;
  }

  return 0;
}
