import { escBold } from '../escpos';
import type { ThermalComandaPayload, ThermalRenderOptions } from '../types';
import { center, clampColumns, formatDate, formatTime, sanitizeText } from '../utils';

export function renderComanda(payload: ThermalComandaPayload, options: ThermalRenderOptions = {}): string {
  if (payload.tipo_comanda === 'anulacion') return renderComandaAnulacion(payload, options);

  const width = clampColumns(options.columns);
  const now = options.now || new Date();
  const timezone = options.timezone || 'America/Bogota';
  const sep = '-'.repeat(width);
  const sep2 = '='.repeat(width);
  const bold = escBold(true);
  const boldOff = escBold(false);
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  const lines: string[] = ['', '', ''];

  lines.push(center(`COMANDA #${payload.comanda || ''} | ${sanitizeText(payload.area || '').toUpperCase()}`, width));
  lines.push(sep2);

  const mesaLabel = sanitizeText(String(payload.mesa_nombre || `Mesa: ${payload.mesa || ''}`).toUpperCase());
  lines.push(`${bold}${mesaLabel}${boldOff}   Mesero: ${sanitizeText(payload.mesero || '')}`);
  if (payload.cliente_nombre) lines.push(`${bold}Cliente: ${sanitizeText(payload.cliente_nombre)}${boldOff}`);
  if (payload.localizador) lines.push(`${bold}Localizador: ${sanitizeText(payload.localizador)}${boldOff}`);
  if (payload.comensales) lines.push(`Personas: ${payload.comensales}`);
  lines.push(`Fecha: ${formatDate(now, timezone)}   Hora: ${hora}`);
  lines.push(sep);
  lines.push('CANT  PRODUCTO');
  lines.push(sep);

  for (const item of payload.items || []) {
    const name = sanitizeText((item.nombre || item.producto || '').toUpperCase()).substring(0, Math.max(10, width - 6));
    const qty = String(item.cantidad || 1).padStart(3, ' ');
    lines.push(bold + `${qty}  ${name}` + boldOff);
    if (item.comentario) lines.push(`      > ${sanitizeText(item.comentario)}`);
    lines.push('');
  }

  lines.push(sep2, '', '', '', '');
  return lines.join('\n');
}

export function renderComandaAnulacion(payload: ThermalComandaPayload, options: ThermalRenderOptions = {}): string {
  const width = clampColumns(options.columns);
  const now = options.now || new Date();
  const timezone = options.timezone || 'America/Bogota';
  const sep = '-'.repeat(width);
  const sep2 = '='.repeat(width);
  const sepX = 'X'.repeat(width);
  const bold = escBold(true);
  const boldOff = escBold(false);
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  const lines: string[] = ['', '', ''];

  lines.push(sep2);
  lines.push(bold + center('*** ANULACION ***', width) + boldOff);
  lines.push(center(`COMANDA #${payload.comanda || ''} | ${sanitizeText(payload.area || '').toUpperCase()}`, width));
  lines.push(sep2);

  const mesaLabel = sanitizeText(String(payload.mesa_nombre || `Mesa: ${payload.mesa || ''}`).toUpperCase());
  lines.push(`${bold}${mesaLabel}${boldOff}   Mesero: ${sanitizeText(payload.mesero || '')}`);
  if (payload.cliente_nombre) lines.push(`${bold}Cliente: ${sanitizeText(payload.cliente_nombre)}${boldOff}`);
  if (payload.localizador) lines.push(`${bold}Localizador: ${sanitizeText(payload.localizador)}${boldOff}`);
  lines.push(`Fecha: ${formatDate(now, timezone)}   Hora: ${hora}`);
  lines.push(sep);

  if (payload.motivo) {
    lines.push(bold + `MOTIVO: ${sanitizeText(String(payload.motivo).toUpperCase())}` + boldOff);
    lines.push(sep);
  }

  lines.push(bold + center('** NO PREPARAR **', width) + boldOff);
  lines.push(sep);

  for (const item of payload.items || []) {
    const name = sanitizeText((item.nombre || item.producto || '').toUpperCase()).substring(0, Math.max(10, width - 6));
    const qty = String(Math.abs(Number(item.cantidad) || 1)).padStart(3, ' ');
    lines.push(bold + `${qty}  ${name}` + boldOff);
    if (item.comentario) lines.push(`      > ${sanitizeText(item.comentario)}`);
    lines.push('');
  }

  lines.push(sepX);
  lines.push(bold + center('** ANULADO **', width) + boldOff);
  lines.push(sepX, '', '', '', '');
  return lines.join('\n');
}
