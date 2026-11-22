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

export function receiptCustomerLines(
  customer: { nombre?: unknown; telefono?: unknown; direccion?: unknown; barrio?: unknown },
  width: number,
): string[] {
  const labelValue = (label: string, value: unknown) => {
    const text = oneLine(value);
    return text && `${label}: ${text}`;
  };
  const name = labelValue('Cliente', customer.nombre);
  const phone = labelValue('Tel', customer.telefono);
  const address = labelValue('Dir', customer.direccion);
  const neighborhood = labelValue('Barrio', customer.barrio);
  const column = width >= 42 ? 25 : Math.floor(width / 2);
  const pair = (left: string, right: string) => {
    const leftLines = left ? wrapWords(left, column - 1) : [];
    const rightLines = right ? wrapWords(right, width - column) : [];
    return Array.from({ length: Math.max(leftLines.length, rightLines.length) }, (_, i) => {
      const leftLine = leftLines[i] ?? '';
      return rightLines[i] ? leftLine.padEnd(column) + rightLines[i] : leftLine;
    });
  };
  return phone || neighborhood
    ? [...pair(name, phone), ...pair(address, neighborhood)]
    : [name, address].filter(Boolean).flatMap(line => wrapWords(line, width));
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
