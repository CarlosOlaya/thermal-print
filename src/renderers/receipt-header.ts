import { escBold } from '../escpos';
import { center, formatDate, formatTime, sanitizeText, wrapWords } from '../utils';

function oneLine(value: unknown): string {
  return sanitizeText(value).replace(/\s+/g, ' ').trim();
}

export function receiptContactLines(telefono: unknown, direccion: unknown, width: number): string[] {
  const tel = oneLine(telefono);
  return [tel && `Tel: ${tel}`, oneLine(direccion)]
    .filter(Boolean)
    .flatMap(line => wrapWords(line, width).map(part => center(part, width)));
}

export function receiptDetailsLines(
  mesa: unknown,
  mesero: unknown,
  width: number,
  now: Date,
  timezone: string,
): string[] {
  const nombreMesa = oneLine(mesa);
  const nombreMesero = oneLine(mesero);
  const fecha = `Fecha: ${formatDate(now, timezone)}`;
  const hora = `Hora: ${formatTime(now, timezone)}`;
  const atencion = nombreMesero ? `Mesero: ${nombreMesero}` : '';
  const column = width >= 42 ? 25 : Math.min(12, width - Math.max(hora.length, atencion.length));
  const fitsPair = (left: string, right: string) =>
    Boolean(left && right && left.length + 2 <= column && right.length <= width - column);
  const servicePair = fitsPair(nombreMesa, atencion) && hora.length <= width - column;
  const lines = fitsPair(fecha, hora)
    ? [fecha.padEnd(column) + hora]
    : [fecha, servicePair ? hora.padStart(column + hora.length) : hora];
  const bold = (line: string) => escBold(true) + line + escBold(false);
  if (servicePair) {
    return [...lines, bold(nombreMesa) + ' '.repeat(column - nombreMesa.length) + atencion];
  }
  return [
    ...lines,
    ...(nombreMesa ? wrapWords(nombreMesa, width).map(bold) : []),
    ...(atencion ? wrapWords(atencion, width) : []),
  ];
}
