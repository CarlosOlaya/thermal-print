import { sanitizeText } from './utils';

export const ESC = '\x1B';
const GS = '\x1D';

export interface EscPosByteOptions {
  cut?: boolean;
  openCashDrawer?: boolean;
  beepAfterPrint?: boolean;
}

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

/** Convierte un segmento de TEXTO (sin QR) a bytes ESC/POS con la whitelist */
function textSegmentToBytes(segment: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < segment.length; i++) {
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
  const document = [
    options.openCashDrawer ? escCashDrawerPulse() : '',
    text || '',
    options.cut ? escCut() : '',
    options.beepAfterPrint ? escBeep() : '',
  ].join('');

  // Los segmentos impares (entre SENTINELs) son bloques de QR nativo; los pares
  // son texto normal. Un doc sin QR es un único segmento par (comportamiento
  // idéntico al anterior).
  const segmentos = document.split(QR_SENTINEL);
  for (let s = 0; s < segmentos.length; s++) {
    if (s % 2 === 1) {
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
