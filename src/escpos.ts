import { sanitizeText } from './utils';

export const ESC = '\x1B';

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

export function textToEscPosBytes(text: string): Uint8Array {
  const bytes: number[] = [0x1b, 0x40];

  for (const char of text || '') {
    const code = char.charCodeAt(0);
    if (code === 0x1b || code === 0x1d || code === 0x0a || code === 0x0d) {
      bytes.push(code);
      continue;
    }

    const safe = sanitizeText(char);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 0x20 && safeCode <= 0x7e) bytes.push(safeCode);
    }
  }

  return new Uint8Array(bytes);
}
