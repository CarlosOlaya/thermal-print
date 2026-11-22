import { FOODLY_FOOTER_MARKER } from './foodly-footer';

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  tarjeta_debito: 'Tarjeta debito',
  tarjeta_credito: 'Tarjeta credito',
  datafono: 'Tarjeta',
  transferencia: 'Transferencia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bold: 'Bold',
  rappi_pay: 'Rappi Pay',
  pse: 'PSE',
  bonos: 'Bonos',
  credito: 'Credito',
  mixto: 'Mixto',
};

/**
 * Un VALOR (nombre, nota, dirección…) listo para el papel: sin tildes, porque la
 * impresora no trae la página de códigos, y sin caracteres de control. Los
 * comandos ESC/POS los arman los renderers por fuera de esta función. Un ESC o
 * GS que viniera en el valor llegaría a la impresora como comando: con
 * "\x1Bp0dd" en una nota se abre el cajón monedero y con "\x1DV" se corta el
 * papel. Solo queda el salto de línea, con el que los renderers parten
 * renglones: el retorno de carro pasa a salto y el tabulador a espacio.
 */
export function sanitizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, '');
}

export function labelMetodo(raw: unknown): string {
  const key = sanitizeText(raw || 'efectivo').toLowerCase().trim();
  if (key.includes('+')) {
    return key.split('+').map(part => labelMetodo(part.trim())).join(' + ');
  }

  // Una clave del catálogo sin etiqueta propia nunca debe salir cruda en papel
  // ("Tarjeta_credito"): el guion bajo pasa a espacio.
  return METODO_LABELS[key] || capitalize(key.replace(/_+/g, ' ')) || 'Efectivo';
}

export function center(text: unknown, width = 48): string {
  const safe = sanitizeText(text);
  if (safe.length >= width) return safe;
  return ' '.repeat(Math.floor((width - safe.length) / 2)) + safe;
}

export function leftRight(left: unknown, right: unknown, width = 48): string {
  const safeLeft = sanitizeText(left);
  const safeRight = sanitizeText(right);
  const gap = width - safeLeft.length - safeRight.length;
  return safeLeft + ' '.repeat(Math.max(gap, 1)) + safeRight;
}

/** Envuelve por palabras; una palabra más larga que el ancho se corta duro. */
export function wrapWords(value: string, width: number): string[] {
  const clean = String(value || '').trim();
  if (clean.length <= width) return [clean];
  const out: string[] = [];
  let actual = '';
  for (const palabra of clean.split(/\s+/)) {
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length <= width) {
      actual = tentativa;
      continue;
    }
    if (actual) out.push(actual);
    if (palabra.length > width) {
      for (let i = 0; i < palabra.length; i += width) out.push(palabra.slice(i, i + width));
      actual = out.pop() || '';
    } else {
      actual = palabra;
    }
  }
  if (actual) out.push(actual);
  return out;
}

/**
 * Fila de ítem en UNA sola línea: "cant nombre ........... valor".
 * El nombre se trunca para que la cantidad, el nombre y el valor derecho quepan en
 * `width` columnas — uniforme en 58mm y 80mm. Ahorra papel vs. poner el total abajo.
 */
export function itemRow(qty: unknown, name: unknown, right: unknown, width = 48): string {
  const qtyStr = String(Number(qty) || 1).padStart(2, ' ');
  const safeRight = sanitizeText(right);
  const nameMax = Math.max(6, width - qtyStr.length - safeRight.length - 2);
  const nameStr = sanitizeText(name).substring(0, nameMax);
  return leftRight(`${qtyStr} ${nameStr}`, safeRight, width);
}

export function rightPadMoney(value: unknown, width: number): string {
  const safe = sanitizeText(value);
  return safe.length >= width ? safe : ' '.repeat(width - safe.length) + safe;
}

export function formatMoney(value: unknown): string {
  return (Number(value) || 0).toLocaleString('es-CO');
}

export function formatDate(date: Date, timezone = 'America/Bogota'): string {
  try {
    return sanitizeText(date.toLocaleDateString('es-CO', { timeZone: timezone }));
  } catch {
    return sanitizeText(date.toLocaleDateString('es-CO'));
  }
}

export function formatTime(date: Date, timezone = 'America/Bogota'): string {
  try {
    return sanitizeText(date.toLocaleTimeString('es-CO', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }));
  } catch {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}

/**
 * Líneas en blanco con que termina toda tirilla. La cuchilla queda unas cuatro
 * líneas por encima del cabezal y el print-server corta apenas llega el último
 * byte: sin este avance, el corte cae sobre lo último impreso y ese texto sale
 * pegado al comienzo de la tirilla siguiente.
 */
export const AVANCE_CORTE: readonly string[] = ['', '', '', '', ''];

export function footer(width = 48, text?: string): string {
  const marca = text === undefined
    ? FOODLY_FOOTER_MARKER + center('Foodly', width)
    : center(text.length > width ? text.replace(/www\./i, '') : text, width);
  return ['', marca, ...AVANCE_CORTE].join('\n');
}

export function clampColumns(columns?: number): number {
  const numeric = Number(columns);
  if (!Number.isFinite(numeric)) return 48;
  return Math.min(80, Math.max(24, Math.floor(numeric)));
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
