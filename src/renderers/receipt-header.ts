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

export function receiptServiceLines(mesa: unknown, mesero: unknown, width: number): string[] {
  const nombreMesa = oneLine(mesa);
  const nombreMesero = oneLine(mesero);
  const derecha = nombreMesero ? `Mesero: ${nombreMesero}` : '';
  const bold = (line: string) => escBold(true) + line + escBold(false);
  if (nombreMesa && derecha && nombreMesa.length + 2 + derecha.length <= width) {
    const gap = ' '.repeat(width - nombreMesa.length - derecha.length);
    return [bold(nombreMesa) + gap + derecha];
  }
  return [
    ...(nombreMesa ? wrapWords(nombreMesa, width).map(bold) : []),
    ...(derecha ? wrapWords(derecha, width) : []),
  ];
}
