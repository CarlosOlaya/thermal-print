import { escBold } from '../escpos';
import type { ThermalDocumentPayload, ThermalRenderOptions } from '../types';
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

type Row = Record<string, unknown>;

export function renderPrecuenta(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const lines = header(data, 'VERIFICACION DE PEDIDO', ctx);
  const subtotal = num(data.subtotal);
  const descuentoMesa = num(data.descuento_mesa ?? data.descuento_monto);
  const propinaPct = numOrDefault(data.porcentaje_propina_sugerida, 10);
  const propina = numOrDefault(data.propina_sugerida, Math.round(subtotal * propinaPct / 100));
  const total = num(data.total);
  const domicilio = num(data.recaudo_domicilio_monto);
  const mesaNombre = text(data.mesa_nombre || `MESA: ${data.mesa_numero || ''}`);
  const esDelivery = /domicilio|llevar/i.test(mesaNombre);

  pushDateTime(lines, ctx);
  lines.push(escBold(true) + mesaNombre + escBold(false));
  lines.push(`MESERO: ${text(data.mesero)}`);
  lines.push(ctx.sep);
  renderItemTable(lines, arr(data.items), ctx, 'nombre', false);

  lines.push(leftRight('SUBTOTAL:', money(subtotal + descuentoMesa), ctx.width));
  if (descuentoMesa > 0) {
    lines.push(leftRight('DESC. MESA:', `-${money(descuentoMesa)}`, ctx.width));
    renderReason(lines, data.motivo_descuento || data.motivo_descuento_mesa || data.justificacion_descuento || data.descuento_motivo);
    lines.push(leftRight('NETO:', money(subtotal), ctx.width));
  }
  if (num(data.monto_servicio) > 0 && !esDelivery) lines.push(leftRight('Servicio:', money(data.monto_servicio), ctx.width));
  if (num(data.monto_iva) > 0) lines.push(leftRight('IVA:', money(data.monto_iva), ctx.width));
  lines.push(ctx.sep);

  if (propina > 0 && !esDelivery) {
    lines.push(leftRight(`SERVICIO SUGERIDO (${propinaPct}%):`, money(propina), ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight('TOTAL + SERVICIO:', money(total + propina), ctx.width));
  } else if (domicilio > 0) {
    lines.push(leftRight('TOTAL PEDIDO:', money(total), ctx.width));
    lines.push(leftRight('DOMICILIO:', money(domicilio), ctx.width));
    lines.push(ctx.sep);
    lines.push(escBold(true) + leftRight('TOTAL A PAGAR:', money(num(data.total_cliente) || total + domicilio), ctx.width) + escBold(false));
  } else {
    lines.push(leftRight('TOTAL A PAGAR:', money(total), ctx.width));
  }

  lines.push(ctx.sep2);
  lines.push('');
  lines.push(center('Documento no fiscal - verificacion', ctx.width));
  lines.push(center('Gracias por su visita!', ctx.width));
  lines.push(footer(ctx.width, options.footer));

  if (esDelivery && isRecord(data.cliente)) {
    lines.push('');
    lines.push('');
    lines.push('\x1D\x56\x00');
    lines.push('\x1B\x40');
    lines.push('\x1D\x4C\x00\x00');
    lines.push(renderDatosCliente(data, options));
  }

  return lines.join('\n');
}

export function renderDatosCliente(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const cliente = isRecord(data.cliente) ? data.cliente : undefined;
  const lines: string[] = [];

  if (!cliente) {
    lines.push(center('No hay datos de cliente.', ctx.width));
    lines.push(ctx.sep2);
    lines.push(footer(ctx.width, options.footer));
    return lines.join('\n');
  }

  lines.push(ctx.sep2);
  lines.push(escBold(true) + center('DATOS PARA ENTREGA', ctx.width) + escBold(false));
  lines.push(center(text(data.mesa_nombre).toUpperCase(), ctx.width));
  lines.push(ctx.sep2);
  lines.push('');
  if (cliente.nombre) lines.push(escBold(true) + 'Cliente: ' + escBold(false) + text(cliente.nombre));
  if (cliente.telefono) lines.push(escBold(true) + 'Telefono: ' + escBold(false) + text(cliente.telefono));
  if (cliente.barrio) lines.push(escBold(true) + 'Barrio: ' + escBold(false) + text(cliente.barrio));
  if (cliente.direccion) lines.push(escBold(true) + 'Direccion: ' + escBold(false) + text(cliente.direccion));
  if (cliente.notas) {
    lines.push(ctx.sep);
    lines.push(escBold(true) + 'Notas:' + escBold(false));
    lines.push(text(cliente.notas));
  }
  lines.push('');
  lines.push(ctx.sep2);
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderCierreCaja(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const lines = header(data, 'CIERRE DE CAJA', ctx);
  const metodos = arr(data.metodos_desglose);
  const tieneDesglose = metodos.length > 0;
  const gastos = isRecord(data.gastos) ? data.gastos : undefined;
  const ingresosCaja = isRecord(data.ingresos_caja) ? data.ingresos_caja : undefined;
  const domicilios = isRecord(data.domicilios) ? data.domicilios : undefined;

  lines.push(leftRight('Cajero:', text(data.cajero), ctx.width));
  if (data.fecha_apertura) lines.push(leftRight('Apertura:', dateTime(data.fecha_apertura, ctx), ctx.width));
  lines.push(leftRight('Cierre:', dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);

  lines.push(escBold(true) + 'VENTAS POR METODO DE PAGO' + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.venta) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.venta), ctx.width));
    }
  } else {
    lines.push(leftRight('  Efectivo:', money(data.total_efectivo), ctx.width));
    lines.push(leftRight('  Datafono:', money(data.total_datafono), ctx.width));
    lines.push(leftRight('  Transferencia:', money(data.total_transferencia), ctx.width));
    if (num(data.total_credito) > 0) lines.push(leftRight('  Credito:', money(data.total_credito), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL VENTAS:', money(data.total_ventas), ctx.width) + escBold(false));
  lines.push('');

  lines.push(escBold(true) + 'SERVICIO' + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.servicio) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.servicio), ctx.width));
    }
  } else {
    if (num(data.propina_efectivo) > 0) lines.push(leftRight('  Efectivo:', money(data.propina_efectivo), ctx.width));
    if (num(data.propina_datafono) > 0) lines.push(leftRight('  Datafono:', money(data.propina_datafono), ctx.width));
    if (num(data.propina_transferencia) > 0) lines.push(leftRight('  Transferencia:', money(data.propina_transferencia), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL SERVICIO:', money(data.total_propinas), ctx.width) + escBold(false));
  lines.push('');

  if (num(data.num_anulaciones) > 0 || num(data.items_anulados) > 0) {
    lines.push(escBold(true) + 'ANULACIONES' + escBold(false));
    lines.push(ctx.sep);
    if (num(data.num_anulaciones) > 0) lines.push(leftRight('  Pedidos anulados:', data.num_anulaciones, ctx.width));
    if (num(data.monto_anulaciones) > 0) lines.push(leftRight('  Monto anulado:', money(data.monto_anulaciones), ctx.width));
    if (num(data.items_anulados) > 0) lines.push(leftRight('  Items anulados:', data.items_anulados, ctx.width));
    lines.push('');
  }

  const totalIngreso = num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas);
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight('TOTAL INGRESO:', money(totalIngreso), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push('');

  renderDiscountSummary(lines, data, ctx);
  renderExpenseSummary(lines, gastos, ctx);
  renderCashIncomeSummary(lines, ingresosCaja, ctx);
  renderCashSummary(lines, data, metodos, gastos, ingresosCaja, domicilios, ctx);
  renderOrderSummary(lines, data, ctx);
  renderDeliverySummary(lines, domicilios, ctx);

  if (data.observaciones) {
    lines.push(ctx.sep);
    lines.push(`Obs: ${text(data.observaciones)}`);
  }
  lines.push(ctx.sep2);
  lines.push('');
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderGastosTurno(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const gastos = isRecord(data.gastos) ? data.gastos : {};
  const items = arr(gastos.items);
  if (!items.length) return '';
  const lines = header(data, 'EGRESOS DEL TURNO', ctx);

  lines.push(leftRight('Cajero:', text(data.cajero), ctx.width));
  lines.push(leftRight('Cierre:', dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(ctx.width >= 42 ? 'CONCEPTO                          METODO  MONTO' : 'CONCEPTO');
  lines.push(ctx.sep);

  for (const item of items) {
    if (ctx.width >= 42) {
      const concepto = text(item.concepto).substring(0, 30).padEnd(30, ' ');
      const metodo = text(item.metodo_pago || 'efec').substring(0, 7).padEnd(7, ' ');
      lines.push(`${concepto} ${metodo} ${money(item.monto)}`);
    } else {
      lines.push(text(item.concepto).substring(0, ctx.width));
      lines.push(leftRight(`  ${labelMetodo(item.metodo_pago)}:`, `-${money(item.monto)}`, ctx.width));
    }
    const proveedor = isRecord(item.proveedor) ? item.proveedor : undefined;
    if (proveedor?.nombre) lines.push(`  Prov: ${text(proveedor.nombre)}`);
    if (item.observacion) lines.push(`  Obs: ${text(item.observacion)}`);
  }

  renderExpenseSummary(lines, gastos, ctx);
  lines.push(ctx.sep2);
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderFacturasTurno(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const facturas = arr(data.facturas);
  const lines = header(data, 'PEDIDOS DEL TURNO', ctx);
  const cerradas = num(data.num_facturas_cerradas) || facturas.filter(f => text(f.tipo || 'cerrada').toLowerCase() === 'cerrada').length;
  const anuladas = num(data.num_facturas_anuladas) || facturas.filter(f => text(f.tipo).toLowerCase() === 'anulada').length;
  const notas = num(data.num_notas_credito) || facturas.filter(f => text(f.tipo).toLowerCase() === 'nc').length;
  const totalCons = num(data.num_facturas_total) || cerradas + anuladas;

  lines.push(leftRight('Cajero:', text(data.cajero), ctx.width));
  lines.push(leftRight('Cierre:', dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(leftRight('Pedidos cobrados:', cerradas, ctx.width));
  if (anuladas > 0) lines.push(leftRight('Pedidos anulados:', anuladas, ctx.width));
  if (notas > 0) lines.push(leftRight('Notas de ajuste:', notas, ctx.width));
  if (totalCons !== cerradas) lines.push(leftRight('Total consecutivos:', totalCons, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? 'PED       METODO              TOTAL' : 'PED       TOTAL') + escBold(false));
  lines.push(ctx.sep);

  for (const factura of facturas) {
    renderFacturaTurno(lines, factura, ctx);
  }

  lines.push(ctx.sep2);
  lines.push(leftRight('Total ventas:', money(data.total_ventas), ctx.width));
  lines.push(leftRight('Total servicio:', money(data.total_propinas), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL INGRESO:', money(num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas)), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push('');
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderVentasPLU(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const lines = header(data, 'VENTAS POR PRODUCTO', ctx);
  const productos = arr(data.productos);

  lines.push(leftRight('Cajero:', text(data.cajero), ctx.width));
  lines.push(leftRight('Cierre:', dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? 'PRODUCTO                  CANT    TOTAL' : 'PRODUCTO') + escBold(false));
  lines.push(ctx.sep);

  for (const item of productos) {
    if (ctx.width >= 42) {
      const nombre = text(item.nombre).substring(0, 24).padEnd(24, ' ');
      lines.push(`${nombre} ${String(item.cantidad || 0).padStart(4, ' ')} ${money(item.valor).padStart(10, ' ')}`);
    } else {
      lines.push(text(item.nombre).substring(0, ctx.width));
      lines.push(leftRight(`  Cant: ${item.cantidad || 0}`, money(item.valor), ctx.width));
    }
  }

  const totalProductos = num(data.total_productos ?? data.total_valor);
  const descuentoMesa = num(data.total_descuento_mesa);
  const totalCuadre = num(data.total_cuadre) || totalProductos - descuentoMesa;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight('Unidades vendidas:', data.total_items || 0, ctx.width) + escBold(false));
  lines.push(leftRight('Total productos:', money(totalProductos), ctx.width));
  if (descuentoMesa > 0) lines.push(leftRight('Desc. mesa:', `-${money(descuentoMesa)}`, ctx.width));
  lines.push(escBold(true) + leftRight('Total cuadre:', money(totalCuadre), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderReporteVentas(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const lines = header(data, 'REPORTE DE VENTAS', ctx);

  lines.push(leftRight('Periodo:', `${text(data.desde)} a ${text(data.hasta)}`, ctx.width));
  lines.push(leftRight('Generado:', dateTime(ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);

  if (isRecord(data.resumen)) {
    const r = data.resumen;
    lines.push(escBold(true) + 'RESUMEN' + escBold(false));
    lines.push(ctx.sep);
    lines.push(leftRight('  Pedidos:', r.total_facturas || 0, ctx.width));
    lines.push(leftRight('  Venta bruta:', money(r.venta_bruta), ctx.width));
    if (num(r.total_descuentos) > 0) lines.push(leftRight('  Descuentos:', `-${money(r.total_descuentos)}`, ctx.width));
    lines.push(leftRight('  Venta neta:', money(r.venta_neta), ctx.width));
    if (num(r.total_propinas) > 0) lines.push(leftRight('  Propinas:', money(r.total_propinas), ctx.width));
    lines.push(leftRight('  Ticket prom:', money(r.ticket_promedio), ctx.width));
    lines.push(leftRight('  Comensales:', r.total_comensales || 0, ctx.width));
    lines.push('');
  }

  const productos = arr(data.productos);
  if (productos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + 'PRODUCTOS VENDIDOS' + escBold(false));
    lines.push(ctx.sep);
    let totalCant = 0;
    let totalIngreso = 0;
    for (const p of productos) {
      const cant = num(p.cantidad);
      const ingreso = num(p.ingreso_neto);
      totalCant += cant;
      totalIngreso += ingreso;
      if (ctx.width >= 42) {
        lines.push(`${String(cant).padStart(3, ' ')}   ${text(p.nombre).substring(0, 16).padEnd(16, ' ')} ${money(ingreso).padStart(12, ' ')}`);
      } else {
        lines.push(`${String(cant).padStart(3, ' ')} ${text(p.nombre).substring(0, ctx.width - 5)}`);
        lines.push(leftRight('  Ingreso:', money(ingreso), ctx.width));
      }
    }
    lines.push(ctx.sep);
    lines.push(escBold(true) + leftRight(`TOTAL (${totalCant})`, money(totalIngreso), ctx.width) + escBold(false));
    lines.push('');
  }

  const metodos = arr(data.metodos);
  if (metodos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + 'METODOS DE PAGO' + escBold(false));
    lines.push(ctx.sep);
    for (const metodo of metodos) {
      lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, money(metodo.total), ctx.width));
    }
  }

  lines.push(ctx.sep2);
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderCorreccion(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const lines: string[] = [];

  lines.push(ctx.sep2);
  lines.push(escBold(true) + center('CORRECCION DE PEDIDO', ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(leftRight('Pedido:', data.numero_factura || 'N/A', ctx.width));
  if (data.mesa_numero) lines.push(leftRight('Mesa:', data.mesa_numero, ctx.width));
  if (data.mesero) lines.push(leftRight('Mesero:', text(data.mesero), ctx.width));
  lines.push(leftRight('Fecha:', formatDate(ctx.now, ctx.timezone), ctx.width));
  lines.push(leftRight('Hora:', formatTime(ctx.now, ctx.timezone), ctx.width));
  if (data.corregido_por) lines.push(leftRight('Corregido por:', text(data.corregido_por), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + 'CAMBIOS REALIZADOS' + escBold(false));
  lines.push(ctx.sep);

  for (const cambio of arr(data.cambios)) {
    const campo = text(cambio.campo);
    if (campo === 'metodo_pago') {
      lines.push(leftRight('  Metodo anterior:', text(cambio.anterior).toUpperCase(), ctx.width));
      lines.push(leftRight('  Metodo nuevo:', text(cambio.nuevo).toUpperCase(), ctx.width));
    } else if (campo === 'servicio') {
      lines.push(leftRight('  Servicio anterior:', money(cambio.anterior), ctx.width));
      lines.push(leftRight('  Servicio nuevo:', money(cambio.nuevo), ctx.width));
    } else if (campo === 'total') {
      lines.push(leftRight('  Total anterior:', money(cambio.anterior), ctx.width));
      lines.push(leftRight('  Total nuevo:', money(cambio.nuevo), ctx.width));
    } else if (campo === 'pagos') {
      lines.push('  Pagos anteriores:');
      renderCorrectionPayments(lines, arr(cambio.anterior), ctx);
      lines.push('  Pagos nuevos:');
      renderCorrectionPayments(lines, arr(cambio.nuevo), ctx);
    }
    lines.push('');
  }

  lines.push(ctx.sep);
  lines.push(escBold(true) + `Motivo: ${text(data.motivo || 'No especificado')}` + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center('DOCUMENTO DE AUDITORIA', ctx.width));
  lines.push(center('Conservar para registros', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

export function renderNotaCredito(data: ThermalDocumentPayload, options: ThermalRenderOptions = {}): string {
  const ctx = context(options);
  const detalle = isRecord(data.detalle) ? data.detalle : {};
  const lines = header(data, '*** NOTA DE AJUSTE ***', ctx);

  if (data.numero_nota) lines.push(center(text(data.numero_nota), ctx.width));
  lines.push(ctx.sep2);
  lines.push(leftRight('Pedido anulado:', text(data.factura_original), ctx.width));
  pushDateTime(lines, ctx);
  lines.push(text(data.mesa_nombre || `Mesa: ${data.mesa_numero || ''}`));
  if (data.mesero) lines.push(`Mesero: ${text(data.mesero)}`);
  lines.push(ctx.sep);
  renderItemTable(lines, arr(detalle.items_anulados), ctx, 'plato_nombre');

  const subtotal = num(detalle.subtotal_original);
  const descMesa = num(detalle.descuento_monto_mesa);
  lines.push(leftRight('SUBTOTAL:', money(subtotal + descMesa), ctx.width));
  if (descMesa > 0) {
    const pct = num(detalle.descuento_porcentaje_mesa);
    lines.push(leftRight(pct > 0 ? `DESC. MESA (${pct}%):` : 'DESC. MESA:', `-${money(descMesa)}`, ctx.width));
    renderReason(lines, detalle.motivo_descuento);
    lines.push(leftRight('NETO:', money(subtotal), ctx.width));
  }
  if (num(detalle.monto_iva_original) > 0) lines.push(leftRight('IVA:', money(detalle.monto_iva_original), ctx.width));
  if (num(detalle.servicio_original) > 0) lines.push(leftRight('SERVICIO:', money(detalle.servicio_original), ctx.width));
  if (num(detalle.recaudo_domicilio_monto) > 0) lines.push(leftRight('DOMICILIO:', money(detalle.recaudo_domicilio_monto), ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight('TOTAL ANULADO:', money(data.monto_anulado), ctx.width) + escBold(false));
  lines.push(ctx.sep2);

  renderPayments(lines, arr(detalle.pagos), detalle.metodo_pago, data.monto_anulado, ctx);
  lines.push(ctx.sep2);
  lines.push('');
  lines.push(escBold(true) + 'MOTIVO DE ANULACION:' + escBold(false));
  lines.push(text(data.motivo || 'No especificado'));
  lines.push('');
  lines.push(ctx.sep2);
  lines.push(center('** SOLO PARA CONTROL INTERNO **', ctx.width));
  lines.push(center('Nota de Ajuste - Conservar', ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join('\n');
}

function renderItemTable(lines: string[], items: Row[], ctx: Ctx, nameKey = 'nombre', renderOperationalComments = true): void {
  if (!items.length) return;

  lines.push(ctx.width >= 42 ? 'CANT  PRODUCTO                V.UNI    TOTAL' : 'CANT  PRODUCTO');
  lines.push(ctx.sep);
  for (const item of items) renderItem(lines, item, ctx, nameKey, renderOperationalComments);
  lines.push(ctx.sep);
}

function renderItem(lines: string[], item: Row, ctx: Ctx, nameKey: string, renderOperationalComments: boolean): void {
  const qty = num(item.cantidad) || 1;
  const name = text(item[nameKey] || item.plato || item.producto || item.plato_nombre);
  const unit = num(item.precio_unitario);
  const descAmount = num(item.descuento_monto);
  const descPct = num(item.descuento_porcentaje);
  const gross = unit * qty;
  const net = item.es_cortesia ? 0 : gross - descAmount;

  if (ctx.width >= 42) {
    lines.push(`${String(qty).padStart(3, ' ')}  ${name.substring(0, 22).padEnd(22, ' ')} ${rightPadMoney(formatMoney(unit), 8)} ${rightPadMoney(`$${formatMoney(net)}`, 8)}`);
  } else {
    lines.push(`${String(qty).padStart(3, ' ')}  ${name.substring(0, Math.max(10, ctx.width - 6))}`);
    lines.push(leftRight('      Total:', money(net), ctx.width));
  }

  if (item.es_cortesia) lines.push('      ** CORTESIA **');
  if (descAmount > 0) lines.push(`      ${descPct > 0 ? `Dcto -${descPct}% (-${money(descAmount)})` : `Dcto (-${money(descAmount)})`}`);
  renderReason(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : undefined));
  if (renderOperationalComments && item.comentario && !item.es_cortesia && !item.motivo_descuento) {
    lines.push(`      > ${text(item.comentario)}`);
  }
}

function renderPayments(lines: string[], pagos: Row[], metodoPago: unknown, total: unknown, ctx: Ctx): void {
  if (pagos.length > 1) {
    lines.push(center('FORMAS DE PAGO (DIVIDIDO)', ctx.width));
    lines.push(ctx.sep);
    for (const pago of pagos) {
      const metodo = labelMetodo(pago.metodo || pago.metodo_pago);
      const monto = num(pago.monto);
      const propina = num(pago.propina);
      lines.push(`${metodo}:`);
      lines.push(leftRight('  Subtotal:', money(monto), ctx.width));
      if (propina > 0) lines.push(leftRight('  + Servicio:', money(propina), ctx.width));
      lines.push(leftRight('  Total metodo:', money(monto + propina), ctx.width));
      lines.push(ctx.sep);
    }
  } else if (pagos.length === 1) {
    const pago = pagos[0];
    lines.push(center('FORMA DE PAGO', ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(pago.metodo || pago.metodo_pago)}:`, money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight('  + Servicio:', money(pago.propina), ctx.width));
  } else if (metodoPago) {
    lines.push(center('FORMA DE PAGO', ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(metodoPago)}:`, money(total), ctx.width));
  }
}

function renderFacturaTurno(lines: string[], factura: Row, ctx: Ctx): void {
  const tipo = text(factura.tipo || 'cerrada').toLowerCase();
  const numero = text(factura.numero_factura).padEnd(8, ' ');
  if (tipo === 'anulada') {
    lines.push(`${numero}  ANULADA ${money(factura.total).padStart(Math.max(10, ctx.width - 18), ' ')}`);
    const nota = isRecord(factura.nota_credito) ? factura.nota_credito : undefined;
    if (nota?.numero) lines.push(`  >> Anulada por ${text(nota.numero)}`);
    if (nota?.motivo) lines.push(`     Motivo: ${text(nota.motivo)}`);
    if (!nota && factura.motivo_anulacion) lines.push(`  >> ${text(factura.motivo_anulacion)}`);
    return;
  }
  if (tipo === 'nc') {
    lines.push(`[NA]      Nota de Ajuste ${money(factura.total).padStart(10, ' ')}`);
    const nota = isRecord(factura.nota_credito) ? factura.nota_credito : undefined;
    if (nota?.numero) lines.push(`  >> ${text(nota.numero)}: ${text(nota.motivo || 'ajuste')}`);
    return;
  }

  if (ctx.width >= 42) {
    const metodo = text(labelMetodo(factura.metodo_pago)).substring(0, 18).padEnd(18, ' ');
    lines.push(`${numero}  ${metodo}  ${money(factura.total).padStart(14, ' ')}`);
  } else {
    lines.push(`${numero} ${money(factura.total)}`);
    lines.push(`  ${labelMetodo(factura.metodo_pago)}`);
  }
  if (factura.factura_origen_nc) lines.push('  >> Refactura (origen NA)');
  for (const pago of arr(factura.pagos)) {
    const prop = num(pago.propina) > 0 ? ` +serv ${money(pago.propina)}` : '';
    lines.push(`          ${labelMetodo(pago.metodo)}: ${money(pago.monto)}${prop}`);
  }
}

function renderDiscountSummary(lines: string[], data: ThermalDocumentPayload, ctx: Ctx): void {
  const totalDesc = num(data.total_descuentos);
  const totalCort = num(data.total_cortesias);
  if (totalDesc <= 0 && totalCort <= 0) return;
  lines.push(escBold(true) + 'DESCUENTOS Y CORTESIAS' + escBold(false));
  lines.push(ctx.sep);
  if (num(data.total_descuentos_mesa) > 0) lines.push(leftRight('  Dcto Mesa:', `-${money(data.total_descuentos_mesa)}`, ctx.width));
  if (num(data.total_descuentos_items) > 0) lines.push(leftRight('  Dcto Items:', `-${money(data.total_descuentos_items)}`, ctx.width));
  if (totalCort > 0) lines.push(leftRight('  Cortesias:', `-${money(totalCort)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL DCTOS:', `-${money(totalDesc + totalCort)}`, ctx.width) + escBold(false));
  lines.push('');
}

function renderExpenseSummary(lines: string[], gastos: Row | undefined, ctx: Ctx): void {
  if (!gastos || num(gastos.total) <= 0) return;
  lines.push(escBold(true) + 'EGRESOS DEL TURNO' + escBold(false));
  lines.push(ctx.sep);
  for (const metodo of arr(gastos.por_metodo)) {
    lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, `-${money(metodo.total)}`, ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL EGRESOS:', `-${money(gastos.total)}`, ctx.width) + escBold(false));
  lines.push('');
}

function renderCashIncomeSummary(lines: string[], ingresosCaja: Row | undefined, ctx: Ctx): void {
  if (!ingresosCaja || num(ingresosCaja.total_efectivo) <= 0) return;
  lines.push(escBold(true) + 'INGRESOS DE CAJA' + escBold(false));
  lines.push(ctx.sep);
  for (const ingreso of arr(ingresosCaja.items)) {
    lines.push(leftRight(`  ${text(ingreso.concepto || 'Ingreso').substring(0, 28)}:`, money(ingreso.monto), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('TOTAL INGRESOS:', money(ingresosCaja.total_efectivo), ctx.width) + escBold(false));
  lines.push('');
}

function renderCashSummary(lines: string[], data: ThermalDocumentPayload, metodos: Row[], gastos: Row | undefined, ingresosCaja: Row | undefined, domicilios: Row | undefined, ctx: Ctx): void {
  const efectivo = metodos.length ? metodos.find(m => text(m.clave) === 'efectivo') : undefined;
  const ventaEf = efectivo ? num(efectivo.venta) : num(data.total_efectivo);
  const servicioEf = efectivo ? num(efectivo.servicio) : num(data.propina_efectivo);
  const gastosEf = arr(gastos?.por_metodo).find(m => text(m.metodo) === 'efectivo');

  lines.push(ctx.sep2);
  lines.push(escBold(true) + 'RESUMEN EFECTIVO' + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight('Inicial:', money(data.efectivo_inicial), ctx.width));
  lines.push(leftRight('+ Ventas:', money(ventaEf), ctx.width));
  lines.push(leftRight('+ Propinas:', money(servicioEf), ctx.width));
  if (num(ingresosCaja?.total_efectivo) > 0) lines.push(leftRight('+ Ingresos caja:', money(ingresosCaja?.total_efectivo), ctx.width));
  if (num(gastosEf?.total) > 0) lines.push(leftRight('- Egresos:', `-${money(gastosEf?.total)}`, ctx.width));
  if (num(domicilios?.recaudado_efectivo) > 0) lines.push(leftRight('+ Domicilio:', money(domicilios?.recaudado_efectivo), ctx.width));
  if (num(domicilios?.liquidado_efectivo) > 0) lines.push(leftRight('- Liq. domicilio:', `-${money(domicilios?.liquidado_efectivo)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('Esperado:', money(data.efectivo_esperado), ctx.width) + escBold(false));
  lines.push(leftRight('Contado:', money(data.efectivo_contado), ctx.width));
  const diff = num(data.diferencia);
  lines.push(escBold(true) + leftRight('DIFERENCIA:', `${diff >= 0 ? '+' : '-'}${money(Math.abs(diff))} ${diff === 0 ? 'OK' : diff > 0 ? '(sobrante)' : '(faltante)'}`, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push('');
}

function renderOrderSummary(lines: string[], data: ThermalDocumentPayload, ctx: Ctx): void {
  lines.push(escBold(true) + 'RESUMEN DE PEDIDOS' + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight('Pedidos cobrados:', data.num_facturas_cerradas || data.num_facturas || 0, ctx.width));
  if (num(data.num_facturas_anuladas) > 0) lines.push(leftRight('Pedidos anulados:', data.num_facturas_anuladas, ctx.width));
  if (num(data.num_notas_credito) > 0) lines.push(leftRight('Notas de ajuste:', data.num_notas_credito, ctx.width));
  if (num(data.num_facturas_total) > 0) lines.push(leftRight('Total consecutivos:', data.num_facturas_total, ctx.width));
}

function renderDeliverySummary(lines: string[], dom: Row | undefined, ctx: Ctx): void {
  if (!dom || num(dom.total_recaudado) <= 0) return;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + 'DOMICILIOS' + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight('Pedidos:', dom.num_pedidos || 0, ctx.width));
  lines.push(leftRight('Recaudado:', money(dom.total_recaudado), ctx.width));
  if (num(dom.total_liquidado) > 0) lines.push(leftRight('Liquidado:', `-${money(dom.total_liquidado)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight('PENDIENTE:', money(dom.pendiente), ctx.width) + escBold(false));
  const liquidaciones = arr(dom.liquidaciones);
  if (liquidaciones.length) {
    lines.push('');
    for (const liq of liquidaciones) {
      lines.push(leftRight(`  ${text(liq.nombre)}`, money(liq.monto), ctx.width));
      lines.push(`  (${text(liq.metodo_salida)})`);
    }
  }
}

function header(data: ThermalDocumentPayload, title: string, ctx: Ctx): string[] {
  const lines: string[] = [];
  if (data.tenant_nombre) lines.push(center(text(data.tenant_nombre).toUpperCase(), ctx.width));
  if (data.nit) lines.push(center(`NIT: ${text(data.nit)}`, ctx.width));
  if (data.telefono) lines.push(center(`Tel: ${text(data.telefono)}`, ctx.width));
  if (data.direccion) lines.push(center(text(data.direccion), ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center(title, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  return lines;
}

function renderReason(lines: string[], reason: unknown): void {
  if (reason) lines.push(`      Motivo: ${text(reason)}`);
}

function renderCorrectionPayments(lines: string[], pagos: Row[], ctx: Ctx): void {
  if (!pagos.length) {
    lines.push('    Sin pagos');
    return;
  }

  for (const pago of pagos) {
    const metodo = labelMetodo(pago.metodo_pago || pago.metodo);
    const total = num(pago.monto) + num(pago.propina);
    lines.push(leftRight(`    ${metodo}:`, money(total), ctx.width));
    if (num(pago.monto) > 0) lines.push(leftRight('      Base:', money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight('      Servicio:', money(pago.propina), ctx.width));
  }
}

function pushDateTime(lines: string[], ctx: Ctx): void {
  if (ctx.width >= 42) {
    lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}        Hora: ${formatTime(ctx.now, ctx.timezone)}`);
    return;
  }

  lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}`);
  lines.push(`Hora:  ${formatTime(ctx.now, ctx.timezone)}`);
}

interface Ctx {
  width: number;
  sep: string;
  sep2: string;
  now: Date;
  timezone: string;
}

function context(options: ThermalRenderOptions): Ctx {
  const width = clampColumns(options.columns);
  return {
    width,
    sep: '-'.repeat(width),
    sep2: '='.repeat(width),
    now: options.now || new Date(),
    timezone: options.timezone || 'America/Bogota',
  };
}

function dateTime(value: unknown, ctx: Ctx): string {
  const date = value instanceof Date ? value : new Date(String(value || Date.now()));
  return `${formatDate(date, ctx.timezone)}, ${formatTime(date, ctx.timezone)}`;
}

function money(value: unknown): string {
  return `$${formatMoney(value)}`;
}

function text(value: unknown): string {
  return sanitizeText(value);
}

function num(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function numOrDefault(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function arr(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is Row {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
