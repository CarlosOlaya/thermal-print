import { escBold } from '../escpos';
import { center, sanitizeText, wrapWords } from '../utils';

function oneLine(value: unknown): string {
  return sanitizeText(value).replace(/\s+/g, ' ').trim();
}

export function receiptContactLines(telefono: unknown, direccion: unknown, width: number): string[] {
  const tel = oneLine(telefono);
  return [tel && `Tel: ${tel}`, oneLine(direccion)]
    .filter(Boolean)
    .flatMap(line => wrapWords(line, width).map(part => center(part, width)));
}

export function receiptServiceLines(mesero: unknown, mesa: unknown, width: number): string[] {
  const nombreMesero = oneLine(mesero);
  const nombreMesa = oneLine(mesa);
  const izquierda = nombreMesero ? `Mesero: ${nombreMesero}` : '';
  const bold = (line: string) => escBold(true) + line + escBold(false);
  if (izquierda && nombreMesa && izquierda.length + 2 + nombreMesa.length <= width) {
    const gap = ' '.repeat(width - izquierda.length - nombreMesa.length);
    return [izquierda + gap + bold(nombreMesa)];
  }
  return [
    ...(izquierda ? wrapWords(izquierda, width) : []),
    ...(nombreMesa ? wrapWords(nombreMesa, width).map(bold) : []),
  ];
}
