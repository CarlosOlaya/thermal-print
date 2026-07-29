import type {
  FacturaCerradaPayload,
  FacturaElectronicaTicket,
  ItemEvento,
  PagoEventoItem,
  ThermalRenderOptions,
} from '../types';
import { qrMarker } from '../escpos';
import {
  center,
  clampColumns,
  footer,
  formatDate,
  formatMoney,
  formatTime,
  itemRow,
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

  // Con documento electrónico ACEPTADO la tirilla es fiscal (número DIAN +
  // CUFE/CUDE + QR); sin él, sigue siendo control interno.
  if (factura.fe) {
    renderFiscal(lines, factura.fe, width, sep2);
  } else {
    lines.push('');
    lines.push(center('** SOLO PARA CONTROL INTERNO **', width));
  }
  lines.push(center('Gracias por su visita!', width));
  // El pie de marca ("Desarrollado por …") sobra cuando el bloque fiscal ya
  // declaró el software y su fabricante por exigencia legal (art. 11 num. 18):
  // sería decir dos veces lo mismo y alargar la tirilla sin aportar nada.
  if (!factura.fe?.software) {
    lines.push(footer(width, options.footer));
  }

  return lines.join('\n');
}

// Datos del cliente y localizador — todos opcionales: cada línea solo se imprime
// si el pedido trae ese dato (igual que en la comanda). Mantiene la trazabilidad
// del cliente en la factura ya pagada.
/** Sigla legible del código DIAN de tipo de documento */
const TIPO_DOC_SIGLA: Record<string, string> = {
  '13': 'CC',
  '31': 'NIT',
  '22': 'CE',
  '41': 'Pasaporte',
};

/** Compara nombres/documentos ignorando tildes, mayúsculas y separadores */
function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * ¿El bloque fiscal ya identifica a este mismo cliente? Entonces no hay que
 * imprimirlo dos veces. Se compara de verdad (no se asume) porque el cliente
 * del CRM y el ADQUIRENTE declarado a la DIAN pueden ser distintos: una venta
 * a Consumidor Final desde el perfil de un cliente de fidelización, por
 * ejemplo. Cuando difieren, ambos son informativos y ambos se imprimen.
 */
function fiscalYaIdentifica(factura: FacturaCerradaPayload): boolean {
  const adq = factura.fe?.adquirente;
  if (!adq) return false;
  const adqNorm = normalizar(adq);
  if (adqNorm.includes(normalizar('Consumidor Final'))) return false;
  const nombre = factura.cliente;
  const doc = factura.cliente_documento;
  // Basta con que el bloque fiscal contenga el documento (identificador fuerte)
  // o, si no hay documento, el nombre completo.
  if (doc) return adqNorm.includes(normalizar(doc));
  return !!nombre && adqNorm.includes(normalizar(nombre));
}

function renderCliente(lines: string[], factura: FacturaCerradaPayload): void {
  // Con FE, la identificación del adquirente vive en el bloque fiscal (es la
  // que se le declaró a la DIAN). Repetirla arriba solo alarga la tirilla.
  const duplicado = fiscalYaIdentifica(factura);
  const nombre = factura.cliente;
  if (!duplicado && nombre && nombre !== 'Consumidor final') {
    lines.push(`Cliente: ${sanitizeText(nombre)}`);
  }
  // Trazabilidad: el documento identifica al cliente aunque el restaurante no
  // tenga facturación electrónica.
  if (!duplicado && factura.cliente_documento) {
    const sigla = TIPO_DOC_SIGLA[factura.cliente_tipo_documento ?? ''] ?? 'Doc';
    lines.push(`${sigla}: ${sanitizeText(factura.cliente_documento)}`);
  }
  if (factura.cliente_telefono) lines.push(`Tel: ${sanitizeText(factura.cliente_telefono)}`);
  if (factura.cliente_direccion) lines.push(`Dir: ${sanitizeText(factura.cliente_direccion)}`);
  if (factura.cliente_barrio) lines.push(`Barrio: ${sanitizeText(factura.cliente_barrio)}`);
  if (factura.localizador) lines.push(`Localizador: ${sanitizeText(factura.localizador)}`);
}

// Bloque fiscal DIAN: tipo + número, adquirente, CUFE/CUDE (envuelto al ancho),
// resolución, QR nativo y URL de verificación. Funciona en 58mm y 80mm porque
// todo se centra/envuelve al `width` real.
function renderFiscal(
  lines: string[],
  fe: FacturaElectronicaTicket,
  width: number,
  sep2: string,
): void {
  lines.push(sep2);
  // La denominación legal del documento equivalente P.O.S. (art. 19 num. 1 de
  // la Res. 000165/2023) son 86 caracteres: no cabe ni en 80mm. Se envuelve por
  // PALABRAS — `center` con una línea más larga que el ancho la devuelve cruda y
  // la impresora la partía donde quisiera, dejando el nombre del documento roto.
  for (const l of wrapWords(sanitizeText(fe.tipo_label || 'DOCUMENTO ELECTRONICO'), width)) {
    lines.push(center(l, width));
  }
  lines.push(center(sanitizeText(fe.numero || ''), width));
  if (fe.adquirente) lines.push(center(sanitizeText(fe.adquirente), width));
  // Art. 11 num. 6: la fecha de EXPEDICIÓN (validación DIAN) es distinta de la
  // de generación que ya va arriba de la tirilla.
  if (fe.fecha_expedicion) {
    lines.push(center(`Expedicion: ${sanitizeText(fe.fecha_expedicion)}`, width));
  }
  if (fe.resolucion) {
    for (const l of wrap(sanitizeText(fe.resolucion), width)) lines.push(center(l, width));
  }
  if (fe.cufe) {
    lines.push(center(fe.es_cufe === false ? 'CUDE:' : 'CUFE:', width));
    for (const l of wrap(fe.cufe, width)) lines.push(center(l, width));
  }
  if (fe.qr) {
    lines.push('');
    // Módulo más pequeño en 58mm para que el QR quepa en el ancho angosto
    lines.push(qrMarker(fe.qr, width >= 42 ? 7 : 5));
    lines.push('');
  }
  if (fe.url) {
    lines.push(center('Verifica en la DIAN:', width));
    for (const l of wrap(fe.url, width)) lines.push(center(l, width));
  }
  // Art. 11 num. 18 Res. 000042/2020 — va de último, después del QR, para no
  // desplazar los datos que el cliente busca primero (número, CUFE, QR).
  // Se parte por segmento (" - ") antes de envolver: `wrap` corta por carácter
  // y en 58mm dejaría los NIT partidos a la mitad, ilegibles en un bloque legal.
  if (fe.software) {
    lines.push('');
    for (const parte of sanitizeText(fe.software).split(' - ')) {
      for (const l of wrap(parte.trim(), width)) lines.push(center(l, width));
    }
  }
}

/**
 * Envuelve por PALABRAS (para textos legibles: denominaciones legales, avisos).
 * Una palabra más larga que el ancho cae al corte por carácter de `wrap`.
 */
function wrapWords(text: string, width: number): string[] {
  const clean = String(text || '').trim();
  if (clean.length <= width) return [clean];
  const out: string[] = [];
  let actual = '';
  for (const palabra of clean.split(/\s+/)) {
    if (palabra.length > width) {
      if (actual) { out.push(actual); actual = ''; }
      out.push(...wrap(palabra, width));
      continue;
    }
    const tentativa = actual ? `${actual} ${palabra}` : palabra;
    if (tentativa.length > width) {
      out.push(actual);
      actual = palabra;
    } else {
      actual = tentativa;
    }
  }
  if (actual) out.push(actual);
  return out;
}

/** Parte un texto largo (CUFE, URL) en líneas de a lo sumo `width` caracteres */
function wrap(text: string, width: number): string[] {
  const clean = String(text || '');
  if (clean.length <= width) return [clean];
  const out: string[] = [];
  for (let i = 0; i < clean.length; i += width) out.push(clean.slice(i, i + width));
  return out;
}

function renderItems(lines: string[], items: ItemEvento[], width: number, sep: string): void {
  if (!items.length) return;

  if (width >= 42) lines.push('CANT  PRODUCTO                V.UNI    TOTAL');
  else lines.push(leftRight('CANT PRODUCTO', 'TOTAL', width));
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
  const qtyNum = Number(item.cantidad) || 1;
  const price = Number(item.precio_unitario) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = item.es_cortesia ? 0 : gross - descAmount;

  // Una sola fila: cant · nombre · total (ahorra papel; el total ya no va abajo).
  lines.push(itemRow(qtyNum, item.nombre || item.plato || '', `$${formatMoney(net)}`, width));
  if (item.es_cortesia) lines.push('   ** CORTESIA **');
  if (descAmount > 0) lines.push(`   Dcto (-$${formatMoney(descAmount)})`);
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
  // Impuesto INCLUIDO en el precio (norma CO): NO se suma al total, se separa.
  // Debe decir lo mismo que se le declaró a la DIAN, o la tirilla contradice al
  // documento que representa.
  const imp = factura.fe?.impuesto;
  if (imp && imp.monto > 0) {
    lines.push(leftRight('BASE GRAVABLE:', `$${formatMoney(imp.base)}`, width));
    lines.push(leftRight(`${imp.label} ${imp.tarifa}%:`, `$${formatMoney(imp.monto)}`, width));
  }
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
