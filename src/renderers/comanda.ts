import { escBold, escFontSize } from '../escpos';
import type { ThermalComandaItem, ThermalComandaPayload, ThermalRenderOptions } from '../types';
import { center, clampColumns, formatDate, formatTime, sanitizeText } from '../utils';

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let remaining = paragraph.trim();
    while (remaining.length > width) {
      const space = remaining.lastIndexOf(' ', width);
      const end = space > 0 ? space : width;
      lines.push(remaining.slice(0, end).trimEnd());
      remaining = remaining.slice(end).trimStart();
    }
    lines.push(remaining);
  }
  return lines;
}

export function renderComanda(payload: ThermalComandaPayload, options: ThermalRenderOptions = {}): string {
  return render(payload, options, payload.tipo_comanda === 'anulacion');
}

export function renderComandaAnulacion(payload: ThermalComandaPayload, options: ThermalRenderOptions = {}): string {
  return render(payload, options, true);
}

function render(payload: ThermalComandaPayload, options: ThermalRenderOptions, anulacion: boolean): string {
  const size = options.comandaFontSize === 'extra_grande' ? 4 : options.comandaFontSize === 'grande' ? 2 : 1;
  const width = clampColumns(options.columns) / (size === 4 ? 2 : 1);
  const now = options.now || new Date();
  const timezone = options.timezone || 'America/Bogota';
  const sep = '-'.repeat(width);
  const sep2 = '='.repeat(width);
  const sepX = 'X'.repeat(width);
  const bold = (text: string) => escBold(true) + text + escBold(false);
  const lines: string[] = ['', '', ''];

  function add(text: string, style: { bold?: boolean; center?: boolean } = {}): void {
    for (const part of wrap(text, width)) {
      const line = style.center ? center(part, width) : part;
      lines.push(style.bold ? bold(line) : line);
    }
  }

  function addPair(first: string, second: string, gap: string, style: { center?: boolean; bold?: boolean } = {}): void {
    const combined = first + gap + second;
    if (combined.length <= width && !combined.includes('\n')) {
      lines.push(style.center ? center(combined, width) : (style.bold ? bold(first) : first) + gap + second);
      return;
    }
    add(first, style);
    add(second, { center: style.center });
  }

  // La comanda unificada lleva un encabezado por área y las anulaciones salen por separado.
  const secciones = !anulacion && Array.isArray(payload.secciones) && payload.secciones.length ? payload.secciones : null;
  const numero = 'COMANDA #' + sanitizeText(payload.comanda || '');
  const area = sanitizeText(payload.area || '').toUpperCase();
  if (anulacion) {
    lines.push(sep2);
    add(width < 17 ? '* ANULACION *' : '*** ANULACION ***', { bold: true, center: true });
  }
  if (secciones) add(numero, { center: true });
  else addPair(numero, area, ' | ', { center: true });
  lines.push(sep2);

  const mesa = sanitizeText(payload.mesa_nombre || 'Mesa: ' + (payload.mesa || '')).toUpperCase();
  addPair(mesa, 'Mesero: ' + sanitizeText(payload.mesero || ''), '   ', { bold: true });
  if (payload.cliente_nombre) add('Cliente: ' + sanitizeText(payload.cliente_nombre), { bold: true });
  if (payload.localizador) add('Localizador: ' + sanitizeText(payload.localizador), { bold: true });
  if (!anulacion && payload.comensales) add('Personas: ' + sanitizeText(payload.comensales));
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  addPair('Fecha: ' + formatDate(now, timezone), 'Hora: ' + hora, '   ');

  function addItems(items: ThermalComandaItem[] | undefined): void {
    for (const item of items || []) {
      const qty = sanitizeText(anulacion ? Math.abs(Number(item.cantidad) || 1) : item.cantidad || 1).padStart(3, ' ');
      let prefix = qty + '  ';
      if (prefix.length >= width) {
        add(qty, { bold: true });
        prefix = '     ';
      }
      const name = sanitizeText(item.nombre || item.producto || '').toUpperCase();
      const continuation = ' '.repeat(prefix.length);
      wrap(name, width - prefix.length).forEach((line, index) => {
        lines.push(bold((index === 0 ? prefix : continuation) + line));
      });
      if (item.comentario) {
        const indent = '      ';
        for (const line of wrap('> ' + sanitizeText(item.comentario), width - indent.length)) lines.push(indent + line);
      }
      lines.push('');
    }
  }

  if (secciones) {
    for (const seccion of secciones) {
      lines.push(sep);
      add('* ' + sanitizeText(seccion.area || '').toUpperCase() + ' *', { bold: true, center: true });
      lines.push(sep);
      addItems(seccion.items);
    }
  } else {
    lines.push(sep);
    if (anulacion && payload.motivo) {
      add('MOTIVO: ' + sanitizeText(payload.motivo).toUpperCase(), { bold: true });
      lines.push(sep);
    }
    if (anulacion) add(width < 17 ? '* NO PREPARAR *' : '** NO PREPARAR **', { bold: true, center: true });
    else lines.push('CANT  PRODUCTO');
    lines.push(sep);
    addItems(payload.items);
  }

  if (anulacion) {
    lines.push(sepX);
    add('** ANULADO **', { bold: true, center: true });
  }
  lines.push(anulacion ? sepX : sep2);
  if (size !== 1) {
    lines[3] = escFontSize(size) + lines[3];
    lines[lines.length - 1] += escFontSize(1);
  }
  return lines.concat('', '', '', '').join('\n');
}
