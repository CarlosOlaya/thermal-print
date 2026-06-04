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

export function textToEscPosBytes(text: string, options: EscPosByteOptions = {}): Uint8Array {
  const bytes: number[] = [0x1b, 0x40];
  const document = [
    options.openCashDrawer ? escCashDrawerPulse() : '',
    text || '',
    options.cut ? escCut() : '',
    options.beepAfterPrint ? escBeep() : '',
  ].join('');

  for (let i = 0; i < document.length; i++) {
    const code = document.charCodeAt(i);
    if (code === 0x1b || code === 0x1d || code === 0x0a || code === 0x0d) {
      bytes.push(code);
      if (code === 0x1b || code === 0x1d) {
        const command = document.charCodeAt(i + 1);
        if (Number.isFinite(command)) {
          bytes.push(command);
          const paramCount = escPosParamCount(code, command);
          for (let param = 0; param < paramCount && i + 2 + param < document.length; param++) {
            bytes.push(document.charCodeAt(i + 2 + param) & 0xff);
          }
          i += 1 + paramCount;
        }
      }
      continue;
    }

    const safe = sanitizeText(document[i]);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 0x20 && safeCode <= 0x7e) bytes.push(safeCode);
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
