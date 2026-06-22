import type { FacturaCerradaPayload, ItemEvento, PagoEventoItem, ThermalRenderOptions } from '../types';
import {
  center,
  clampColumns,
  footer,
  formatDate,
  formatMoney,
  formatTime,
  labelMetodo,
  leftRight,
  rightPadMoney,
  sanitizeText,
} from '../utils';

export function renderFactura(factura: FacturaCerradaPayload, options: ThermalRenderOptions = {}): string {
  const width = clampColumns(options.columns);
  const now = options.now || new Date();
  const timezone = options.timezone || 'America/Bogota';
  const sep = '-'.repeat(width);
  const sep2 = '='.repeat(width);
  const lines: string[] = [];

  if (factura.tenant_nombre) lines.push(center(String(factura.tenant_nombre).toUpperCase(), width));
  if (factura.nit) lines.push(center(`NIT: ${factura.nit}`, width));
  lines.push(sep);
  lines.push(center(factura.numero_factura || 'PEDIDO', width));
  lines.push(sep);
  if (width >= 42) {
    lines.push(`Fecha: ${formatDate(now, timezone)}        Hora: ${formatTime(now, timezone)}`);
  } else {
    lines.push(`Fecha: ${formatDate(now, timezone)}`);
    lines.push(`Hora:  ${formatTime(now, timezone)}`);
  }
  lines.push(sanitizeText(factura.mesa_nombre || `Mesa: ${factura.mesa_numero || ''}`));
  lines.push(`Mesero: ${sanitizeText(factura.mesero || '')}`);
  renderCliente(lines, factura);
  lines.push(sep);

  renderItems(lines, factura.items || [], width, sep);
  renderTotals(lines, factura, width, sep2);
  renderPayments(lines, factura, width, sep);

  lines.push('');
  lines.push(center('** SOLO PARA CONTROL INTERNO **', width));
  lines.push(center('Gracias por su visita!', width));
  lines.push(footer(width, options.footer));

  return lines.join('\n');
}

// Datos del cliente y localizador — todos opcionales: cada línea solo se imprime
// si el pedido trae ese dato (igual que en la comanda). Mantiene la trazabilidad
// del cliente en la factura ya pagada.
function renderCliente(lines: string[], factura: FacturaCerradaPayload): void {
  const nombre = factura.cliente;
  if (nombre && nombre !== 'Consumidor final') lines.push(`Cliente: ${sanitizeText(nombre)}`);
  if (factura.cliente_telefono) lines.push(`Tel: ${sanitizeText(factura.cliente_telefono)}`);
  if (factura.cliente_direccion) lines.push(`Dir: ${sanitizeText(factura.cliente_direccion)}`);
  if (factura.cliente_barrio) lines.push(`Barrio: ${sanitizeText(factura.cliente_barrio)}`);
  if (factura.localizador) lines.push(`Localizador: ${sanitizeText(factura.localizador)}`);
}

function renderItems(lines: string[], items: ItemEvento[], width: number, sep: string): void {
  if (!items.length) return;

  if (width >= 42) lines.push('CANT  PRODUCTO                V.UNI    TOTAL');
  else lines.push('CANT  PRODUCTO');
  lines.push(sep);

  for (const item of items) {
    if (width >= 42) {
      renderWideItem(lines, item);
    } else {
      renderNarrowItem(lines, item, width);
    }
  }

  lines.push(sep);
}

function renderWideItem(lines: string[], item: ItemEvento): void {
  const qty = String(item.cantidad || 1).padStart(3, ' ');
  const name = sanitizeText(item.nombre || item.plato || '').substring(0, 22).padEnd(22, ' ');
  const price = Number(item.precio_unitario) || 0;
  const qtyNum = Number(item.cantidad) || 1;
  const descPct = Number(item.descuento_porcentaje) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = gross - descAmount;

  if (item.es_cortesia) {
    lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)}       $0`);
    lines.push('      ** CORTESIA **');
    renderReason(lines, item.motivo_descuento || item.comentario);
    return;
  }

  if (descAmount > 0) {
    lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)} ${rightPadMoney(formatMoney(net), 8)}`);
    lines.push(`      ${descPct > 0 ? `Dcto -${descPct}% (-$${formatMoney(descAmount)})` : `Dcto (-$${formatMoney(descAmount)})`}`);
    renderReason(lines, item.motivo_descuento || item.comentario);
    return;
  }

  lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)} ${rightPadMoney(formatMoney(gross), 8)}`);
}

function renderNarrowItem(lines: string[], item: ItemEvento, width: number): void {
  const qty = String(item.cantidad || 1).padStart(3, ' ');
  const name = sanitizeText(item.nombre || item.plato || '').substring(0, Math.max(10, width - 6));
  const price = Number(item.precio_unitario) || 0;
  const qtyNum = Number(item.cantidad) || 1;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = item.es_cortesia ? 0 : gross - descAmount;

  lines.push(`${qty}  ${name}`);
  lines.push(leftRight('      Total:', `$${formatMoney(net)}`, width));
  if (item.es_cortesia) lines.push('      ** CORTESIA **');
  if (descAmount > 0) lines.push(`      Dcto (-$${formatMoney(descAmount)})`);
  renderReason(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : undefined));
}

function renderTotals(lines: string[], factura: FacturaCerradaPayload, width: number, sep2: string): void {
  const subtotalVisible = Number(factura.subtotal) + Number(factura.descuento_monto || 0);
  const descMesa = Number(factura.descuento_monto) || 0;

  lines.push(leftRight('SUBTOTAL:', `$${formatMoney(subtotalVisible)}`, width));
  if (descMesa > 0) {
    lines.push(leftRight('DESC. MESA:', `-$${formatMoney(descMesa)}`, width));
    const reason = factura.motivo_descuento
      || factura.motivo_descuento_mesa
      || factura.justificacion_descuento
      || factura.descuento_motivo;
    renderReason(lines, reason, '  Motivo: ');
    lines.push(leftRight('NETO:', `$${formatMoney(factura.subtotal)}`, width));
  }
  if (Number(factura.monto_iva) > 0) lines.push(leftRight('IVA:', `$${formatMoney(factura.monto_iva)}`, width));
  if (Number(factura.propina) > 0) lines.push(leftRight('SERVICIO:', `$${formatMoney(factura.propina)}`, width));
  lines.push(sep2);
  lines.push(leftRight('TOTAL PEDIDO:', `$ ${formatMoney(factura.total)}`, width));

  const deliveryAmount = Number(factura.recaudo_domicilio_monto) || 0;
  if (deliveryAmount > 0) {
    lines.push(leftRight('DOMICILIO:', `$${formatMoney(deliveryAmount)}`, width));
    lines.push(sep2);
    lines.push(leftRight('TOTAL A PAGAR:', `$ ${formatMoney(Number(factura.total_cliente) || (Number(factura.total) + deliveryAmount))}`, width));
  }
  lines.push(sep2);
}

function renderPayments(lines: string[], factura: FacturaCerradaPayload, width: number, sep: string): void {
  const payments = factura.pagos || [];
  if (payments.length > 1) {
    lines.push(center('FORMAS DE PAGO (DIVIDIDO)', width));
    lines.push(sep);
    for (const payment of payments) renderPayment(lines, payment, width, true, sep);
    const totalCobrado = payments.reduce((sum, payment) => sum + Number(payment.monto || 0) + Number(payment.propina || 0), 0);
    lines.push(leftRight('TOTAL COBRADO:', `$${formatMoney(totalCobrado)}`, width));
  } else if (payments.length === 1) {
    lines.push(center('FORMAS DE PAGO', width));
    lines.push(sep);
    renderPayment(lines, payments[0], width, false, sep);
  } else if (factura.metodo_pago) {
    lines.push(center('FORMAS DE PAGO', width));
    lines.push(sep);
    lines.push(leftRight(`${labelMetodo(factura.metodo_pago)}:`, `$${formatMoney(factura.total)}`, width));
  }
  lines.push(sep);
}

function renderPayment(lines: string[], payment: PagoEventoItem, width: number, detailed: boolean, sep: string): void {
  const method = labelMetodo(payment.metodo || payment.metodo_pago);
  const amount = Number(payment.monto) || 0;
  const tip = Number(payment.propina) || 0;
  if (detailed) {
    lines.push(`${method}:`);
    lines.push(leftRight('  Subtotal:', `$${formatMoney(amount)}`, width));
    if (tip > 0) lines.push(leftRight('  + Servicio:', `$${formatMoney(tip)}`, width));
    lines.push(leftRight('  Total metodo:', `$${formatMoney(amount + tip)}`, width));
    lines.push(sep);
    return;
  }

  lines.push(leftRight(`${method.padEnd(14, ' ')}:`, `$${formatMoney(amount)}`, width));
  if (tip > 0) lines.push(leftRight('  + Servicio:', `$${formatMoney(tip)}`, width));
}

function renderReason(lines: string[], reason: unknown, prefix = '      Motivo: '): void {
  if (reason) lines.push(`${prefix}${sanitizeText(reason)}`);
}
