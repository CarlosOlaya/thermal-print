import { escBold } from '../escpos';
import type { ThermalRenderOptions } from '../types';
import { receiptContactLines } from './receipt-header';
import { center, clampColumns, footer, formatDate, formatMoney, formatTime, labelMetodo, leftRight, sanitizeText, wrapWords } from '../utils';

export interface ThermalCompraPayload extends Record<string, unknown> {
  numero: string;
  estado: 'pendiente' | 'pagada' | 'anulada' | 'reversada';
  empresa_nombre: string;
  empresa_nit?: string | null;
  empresa_direccion?: string | null;
  empresa_telefono?: string | null;
  registrado_en: Date | string;
  registrado_por_nombre: string;
  proveedor_nombre?: string | null;
  proveedor_nit?: string | null;
  pagado_por_nombre?: string | null;
  metodo_pago?: string | null;
  total: number | string;
  lineas: Array<{
    nombre: string;
    unidad: string;
    cantidad: number | string;
    precio_unitario: number | string;
    subtotal: number | string;
  }>;
}

export function renderCompra(data: ThermalCompraPayload, options: ThermalRenderOptions = {}): string {
  const width = clampColumns(options.columns);
  const wrap = (value: string) => wrapWords(sanitizeText(value).replace(/\s+/g, ' '), width);
  const fecha = new Date(data.registrado_en);
  const estados = { pendiente: 'PENDIENTE DE PAGO', pagada: 'PAGADA', anulada: 'ANULADA', reversada: 'REVERSADA' };
  const lines = [
    ...wrap(data.empresa_nombre).map(line => escBold(true) + center(line, width) + escBold(false)),
    ...(data.empresa_nit ? wrap('NIT: ' + data.empresa_nit).map(line => center(line, width)) : []),
    ...receiptContactLines(data.empresa_telefono, data.empresa_direccion, width),
    '-'.repeat(width),
    center('COMPROBANTE DE COMPRA', width),
    center(data.numero, width),
    escBold(true) + center(estados[data.estado], width) + escBold(false),
    leftRight(formatDate(fecha, options.timezone), formatTime(fecha, options.timezone), width),
  ];
  if (data.registrado_por_nombre) lines.push(...wrap('Registro: ' + data.registrado_por_nombre));
  if (data.proveedor_nombre) lines.push(...wrap('Proveedor: ' + data.proveedor_nombre));
  if (data.proveedor_nit) lines.push(...wrap('Doc: ' + data.proveedor_nit));
  lines.push('-'.repeat(width));
  lines.push(leftRight('INSUMO / CANTIDAD x PRECIO', 'TOTAL', width));
  for (const item of data.lineas) {
    lines.push(...wrap(item.nombre));
    const cantidad = Number(item.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 4 });
    const medida = sanitizeText(item.unidad).replace(/\s+/g, ' ');
    const precio = cantidad + ' ' + medida + ' x $' + formatMoney(item.precio_unitario);
    const importe = '$' + formatMoney(item.subtotal);
    if (precio.length + importe.length + 1 <= width) lines.push(leftRight(precio, importe, width));
    else lines.push(...wrap(precio), importe.padStart(width));
  }
  lines.push('-'.repeat(width));
  const label = data.estado === 'pendiente' ? 'TOTAL POR PAGAR' : 'TOTAL COMPRA';
  const total = '$' + formatMoney(data.total);
  const totalLines = label.length + total.length + 1 <= width
    ? [leftRight(label, total, width)]
    : [label, total.padStart(width)];
  lines.push(...totalLines.map(line => escBold(true) + line + escBold(false)));
  if (data.metodo_pago) lines.push(...wrap('Medio de pago: ' + labelMetodo(data.metodo_pago)));
  if (data.pagado_por_nombre) lines.push(...wrap('Pago: ' + data.pagado_por_nombre));
  lines.push(footer(width, options.footer));
  return lines.join('\n');
}
