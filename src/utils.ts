const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n\r\x1B\x1D]/g, '');
}

export function labelMetodo(raw: unknown): string {
  const key = sanitizeText(raw || 'efectivo').toLowerCase().trim();
  if (key.includes('+')) {
    return key.split('+').map(part => labelMetodo(part.trim())).join(' + ');
  }

  return METODO_LABELS[key] || capitalize(key) || 'Efectivo';
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

export function footer(width = 48, text = 'Desarrollado por www.foodly.com.co'): string {
  return ['', center(text, width), '', '', '', '', ''].join('\n');
}

export function clampColumns(columns?: number): number {
  const numeric = Number(columns);
  if (!Number.isFinite(numeric)) return 48;
  return Math.min(80, Math.max(24, Math.floor(numeric)));
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}
