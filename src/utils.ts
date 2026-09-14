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

export function sanitizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E\n\r\x1B\x1D]/g, '');
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

export function footer(width = 48, text = 'Desarrollado por www.foodly.com.co'): string {
  // En 58mm la marca completa no cabe (34 > 32) y la impresora dejaba "co"
  // solo en otra línea: sin el "www." sí cabe.
  const marca = text.length > width ? text.replace(/www\./i, '') : text;
  return ['', center(marca, width), ...AVANCE_CORTE].join('\n');
}

export function clampColumns(columns?: number): number {
  const numeric = Number(columns);
  if (!Number.isFinite(numeric)) return 48;
  return Math.min(80, Math.max(24, Math.floor(numeric)));
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
