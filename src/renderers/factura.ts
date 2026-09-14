import type {
  FacturaCerradaPayload,
  FacturaElectronicaTicket,
  ItemEvento,
  PagoEventoItem,
  ThermalRenderOptions,
} from '../types';
import { escBold, qrMarker } from '../escpos';
import {
  AVANCE_CORTE,
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
  const timezone = options.timezone || 'America/Bogota';
  const fiscal = factura.fe;
  // Art. 11 num. 5 (Res. 000165/2023): la tirilla fiscal muestra la fecha y hora
  // de GENERACIÓN del documento. La hora de impresión solo vale sin documento:
  // en una reimpresión sería la de hoy, no la del documento que se representa.
  const now = fechaValida(fiscal?.fecha_generacion) || options.now || new Date();

  const encabezado: string[] = [];
  renderEncabezado(encabezado, factura, width);

  const datos: string[] = [];
  // `numero_factura` es el consecutivo operativo PED-xxxxx. En una tirilla
  // fiscal el identificador válido es `fe.numero`, que se imprime en el bloque
  // DIAN; mostrar ambos confunde el pedido interno con el número autorizado.
  // Sin FE aceptada se conserva el PED para la trazabilidad de control interno.
  if (!fiscal) datos.push(center(factura.numero_factura || 'PEDIDO', width));
  if (width >= 42) {
    datos.push(`Fecha: ${formatDate(now, timezone)}        Hora: ${formatTime(now, timezone)}`);
  } else {
    datos.push(`Fecha: ${formatDate(now, timezone)}`);
    datos.push(`Hora:  ${formatTime(now, timezone)}`);
  }
  datos.push(sanitizeText(factura.mesa_nombre || `Mesa: ${factura.mesa_numero || ''}`));
  datos.push(`Mesero: ${sanitizeText(factura.mesero || '')}`);
  renderCliente(datos, factura);

  const detalle: string[] = [];
  if (fiscal) renderItemsFiscales(detalle, factura.items || [], width);
  else renderItems(detalle, factura.items || [], width);

  const totales: string[] = [];
  renderTotals(totales, factura, width);

  const pagos: string[] = [];
  renderPayments(pagos, factura, width);
  renderCambio(pagos, factura, width);

  // Una sola raya ENTRE secciones, y solo entre las que tienen contenido. Antes
  // cada bloque abría y cerraba la suya: la tirilla acumulaba rayas pegadas
  // (---- seguida de ====) que gastaban papel sin separar nada nuevo.
  const sep = '-'.repeat(width);
  const lines = unirSecciones([encabezado, datos, detalle, totales, pagos], sep);

  // Con documento electrónico ACEPTADO la tirilla es fiscal (número DIAN +
  // CUFE/CUDE + QR); sin él, sigue siendo control interno. La doble raya queda
  // solo para abrir el bloque fiscal: marca dónde empieza lo declarado a la DIAN.
  if (fiscal) {
    lines.push('='.repeat(width));
    renderFiscal(lines, fiscal, width);
  } else {
    lines.push(sep);
    lines.push(center('** SOLO PARA CONTROL INTERNO **', width));
  }
  lines.push(center('Gracias por su visita!', width));
  // El pie de marca ("Desarrollado por …") sobra cuando el bloque fiscal ya
  // declaró el software y su fabricante por exigencia legal (art. 11 num. 18):
  // sería decir dos veces lo mismo. Lo que NO sobra es el avance de papel que
  // traía ese pie: sin él la cuchilla cortaba sobre las últimas líneas del
  // bloque fiscal, y el software, su NIT y el agradecimiento salían pegados al
  // comienzo de la tirilla siguiente.
  if (fiscal?.software) {
    lines.push(...AVANCE_CORTE);
  } else {
    lines.push(footer(width, options.footer));
  }

  return lines.join('\n');
}

/** Fecha ISO utilizable, o null si no viene o no se puede leer */
function fechaValida(valor: unknown): Date | null {
  if (typeof valor !== 'string' || !valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Une las secciones con UNA raya entre cada par que tenga contenido. */
function unirSecciones(secciones: string[][], sep: string): string[] {
  const lines: string[] = [];
  for (const seccion of secciones) {
    if (seccion.length === 0) continue;
    if (lines.length > 0) lines.push(sep);
    lines.push(...seccion);
  }
  return lines;
}

/** Destaca una línea sin gastar papel en rayas alrededor. */
function negrilla(linea: string): string {
  return escBold(true) + linea + escBold(false);
}

/** Centra un texto envolviéndolo por palabras al ancho real */
function centrado(lines: string[], texto: string, width: number): void {
  for (const l of wrapWords(texto, width)) lines.push(center(l, width));
}

/**
 * Emisor. Con documento electrónico manda lo que se le declaró a la DIAN
 * (art. 11 num. 2 y 12 de la Res. 000165/2023): razón social, NIT con DV y las
 * calidades tributarias que correspondan. El nombre del restaurante en Foodly
 * suele ser el comercial; se conserva arriba porque es el que el comensal
 * reconoce, pero solo cuando es distinto de la razón social.
 */
function renderEncabezado(lines: string[], factura: FacturaCerradaPayload, width: number): void {
  const emisor = factura.fe?.emisor;
  if (!emisor?.razon_social) {
    if (factura.tenant_nombre) lines.push(center(String(factura.tenant_nombre).toUpperCase(), width));
    if (factura.nit) lines.push(center(`NIT: ${factura.nit}`, width));
    return;
  }
  const marca = factura.tenant_nombre || emisor.nombre_comercial;
  if (marca && normalizar(marca) !== normalizar(emisor.razon_social)) {
    centrado(lines, sanitizeText(marca).toUpperCase(), width);
  }
  centrado(lines, sanitizeText(emisor.razon_social).toUpperCase(), width);
  if (emisor.nit) lines.push(center(`NIT: ${sanitizeText(emisor.nit)}`, width));
  for (const calidad of factura.fe?.responsabilidades || []) {
    if (calidad) centrado(lines, sanitizeText(calidad), width);
  }
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
    .replace(/[̀-ͯ]/g, '')
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
// resolución y QR nativo. Funciona en 58mm y 80mm porque todo se centra/envuelve
// al `width` real. La doble raya que lo abre la pone `renderFactura`.
function renderFiscal(lines: string[], fe: FacturaElectronicaTicket, width: number): void {
  // La denominación legal del documento equivalente P.O.S. (art. 19 num. 1 de
  // la Res. 000165/2023) son 86 caracteres: no cabe ni en 80mm. Se envuelve por
  // PALABRAS — `center` con una línea más larga que el ancho la devuelve cruda y
  // la impresora la partía donde quisiera, dejando el nombre del documento roto.
  centrado(lines, sanitizeText(fe.tipo_label || 'DOCUMENTO ELECTRONICO'), width);
  lines.push(center(sanitizeText(fe.numero || ''), width));
  // Adquirente y resolución se envuelven por PALABRAS: cortando por carácter,
  // en 58mm el rango autorizado salía "DJFE 1-5000 / 000", que parece otro número.
  if (fe.adquirente) centrado(lines, sanitizeText(fe.adquirente), width);
  // Art. 11 num. 6: la fecha de EXPEDICIÓN (validación DIAN) es distinta de la
  // de generación que ya va arriba de la tirilla.
  if (fe.fecha_expedicion) {
    lines.push(center(`Expedicion: ${sanitizeText(fe.fecha_expedicion)}`, width));
  }
  if (fe.resolucion) centrado(lines, sanitizeText(fe.resolucion), width);
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
  // Art. 11 num. 16 y art. 35 par. 1 (Res. 000165/2023): la dirección de la DIAN
  // va DENTRO del QR, y es el QR lo que la representación gráfica debe llevar
  // (confirmado por Alegra, ticket 3808). El texto con la URL solo sale de
  // respaldo cuando no hay QR, para que la tirilla nunca pierda el requisito.
  if (fe.url && !fe.qr) {
    lines.push(center('Verifica en la DIAN:', width));
    for (const l of wrap(fe.url, width)) lines.push(center(l, width));
  }
  // Art. 11 num. 18 — va de último, después del QR, para no desplazar los datos
  // que el cliente busca primero (número, CUFE, QR). Se parte por segmento
  // (" - ") y luego por PALABRAS: cortando por carácter, en 58mm salía
  // "Solucione / s Alegra" y los NIT partidos a la mitad, ilegibles en un
  // bloque legal.
  if (fe.software) {
    // UN renglón en blanco antes del bloque: sin la URL, el QR ya dejó el suyo
    if (lines[lines.length - 1] !== '') lines.push('');
    for (const parte of sanitizeText(fe.software).split(' - ')) {
      centrado(lines, parte.trim(), width);
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

function renderItems(lines: string[], items: ItemEvento[], width: number): void {
  if (!items.length) return;

  // Sin raya bajo los títulos: van en mayúsculas y ya se distinguen de las filas.
  if (width >= 42) lines.push('CANT  PRODUCTO                V.UNI    TOTAL');
  else lines.push(leftRight('CANT PRODUCTO', 'TOTAL', width));

  for (const item of items) {
    if (width >= 42) {
      renderWideItem(lines, item);
    } else {
      renderNarrowItem(lines, item, width);
    }
  }
}

/**
 * Detalle de la tirilla FISCAL (art. 11 num. 8 Res. 000165/2023): cada línea
 * lleva su número, cantidad, unidad de medida, descripción y el código con el
 * que viajó en el documento electrónico, y al final va el total de líneas.
 * Para no gastar papel, el código comparte renglón con el descuento o la
 * cortesía cuando caben juntos en el ancho.
 */
function renderItemsFiscales(lines: string[], items: ItemEvento[], width: number): void {
  if (!items.length) return;
  const ancho = width >= 42;
  // # (2) · cantidad (4) · nombre · precio (8) · total (8), con un espacio entre columnas
  const anchoNombre = Math.max(8, width - 26);

  if (ancho) {
    lines.push(` # CANT ${'PRODUCTO'.padEnd(anchoNombre, ' ')} ${'V.UNI'.padStart(8, ' ')} ${'TOTAL'.padStart(8, ' ')}`);
  } else {
    lines.push(leftRight(' # CANT PRODUCTO', 'TOTAL', width));
  }

  items.forEach((item, indice) => {
    const numero = String(indice + 1).padStart(2, ' ');
    const cantidad = Number(item.cantidad) || 1;
    const precio = Number(item.precio_unitario) || 0;
    const descuento = Number(item.descuento_monto) || 0;
    const porcentaje = Number(item.descuento_porcentaje) || 0;
    const neto = item.es_cortesia ? 0 : Math.max(0, precio * cantidad - descuento);
    const nombre = sanitizeText(item.nombre || item.plato || '');

    if (ancho) {
      const total = item.es_cortesia ? '$0' : formatMoney(neto);
      lines.push(
        `${numero} ${String(cantidad).padStart(4, ' ')} ${nombre.substring(0, anchoNombre).padEnd(anchoNombre, ' ')} ` +
          `${rightPadMoney(formatMoney(precio), 8)} ${rightPadMoney(total, 8)}`,
      );
    } else {
      const derecha = `$${formatMoney(neto)}`;
      const izquierda = `${numero} ${cantidad}x `;
      const maxNombre = Math.max(4, width - izquierda.length - derecha.length - 1);
      lines.push(leftRight(`${izquierda}${nombre.substring(0, maxNombre)}`, derecha, width));
    }

    const identificacion = [
      item.codigo ? `Cod ${sanitizeText(item.codigo)}` : '',
      item.unidad ? sanitizeText(item.unidad) : '',
    ].filter(Boolean).join(' ');
    const marca = item.es_cortesia
      ? '** CORTESIA **'
      : descuento > 0
        ? ancho && porcentaje > 0
          ? `Dcto -${porcentaje}% (-$${formatMoney(descuento)})`
          : `Dcto (-$${formatMoney(descuento)})`
        : '';
    // Misma sangría que el "Motivo:" de la línea, para que el bloque se lea junto
    const sangria = ancho ? '      ' : '   ';
    const juntos = [identificacion, marca].filter(Boolean).join('  ');
    if (juntos && sangria.length + juntos.length <= width) {
      lines.push(sangria + juntos);
    } else {
      if (identificacion) lines.push(sangria + identificacion);
      if (marca) lines.push(sangria + marca);
    }

    if (item.es_cortesia || descuento > 0) {
      renderReason(lines, item.motivo_descuento || (ancho || item.es_cortesia ? item.comentario : undefined));
    }
  });

  lines.push(`Total items: ${items.length}`);
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

function renderTotals(lines: string[], factura: FacturaCerradaPayload, width: number): void {
  const descMesa = Number(factura.descuento_monto) || 0;
  const subtotalVisible = (Number(factura.subtotal) || 0) + descMesa;
  const iva = Number(factura.monto_iva) || 0;
  const servicio = Number(factura.propina) || 0;
  const total = Number(factura.total) || 0;
  // Impuesto INCLUIDO en el precio (norma CO): NO se suma al total, se separa.
  // Debe decir lo mismo que se le declaró a la DIAN, o la tirilla contradice al
  // documento que representa.
  const imp = factura.fe?.impuesto;
  const conImpuesto = Boolean(imp && imp.monto > 0);

  // Sin nada entre el subtotal y el total, las dos líneas dirían el mismo
  // número: con el total basta.
  if (descMesa > 0 || iva > 0 || conImpuesto || servicio > 0 || subtotalVisible !== total) {
    lines.push(leftRight('SUBTOTAL:', `$${formatMoney(subtotalVisible)}`, width));
  }
  if (descMesa > 0) {
    lines.push(leftRight('DESC. MESA:', `-$${formatMoney(descMesa)}`, width));
    const reason = factura.motivo_descuento
      || factura.motivo_descuento_mesa
      || factura.justificacion_descuento
      || factura.descuento_motivo;
    renderReason(lines, reason, '  Motivo: ');
    lines.push(leftRight('NETO:', `$${formatMoney(factura.subtotal)}`, width));
  }
  if (iva > 0) lines.push(leftRight('IVA:', `$${formatMoney(iva)}`, width));
  if (imp && imp.monto > 0) {
    lines.push(leftRight('BASE GRAVABLE:', `$${formatMoney(imp.base)}`, width));
    lines.push(leftRight(`${imp.label} ${imp.tarifa}%:`, `$${formatMoney(imp.monto)}`, width));
  }
  if (servicio > 0) lines.push(leftRight('SERVICIO:', `$${formatMoney(servicio)}`, width));

  // El total va en negrilla en vez de encerrado entre dobles rayas. Con
  // domicilio se destaca lo que paga el cliente: TOTAL A PAGAR.
  const totalPedido = leftRight('TOTAL PEDIDO:', `$ ${formatMoney(total)}`, width);
  const deliveryAmount = Number(factura.recaudo_domicilio_monto) || 0;
  if (deliveryAmount > 0) {
    const totalCliente = Number(factura.total_cliente) || (total + deliveryAmount);
    lines.push(totalPedido);
    lines.push(leftRight('DOMICILIO:', `$${formatMoney(deliveryAmount)}`, width));
    lines.push(negrilla(leftRight('TOTAL A PAGAR:', `$ ${formatMoney(totalCliente)}`, width)));
  } else {
    lines.push(negrilla(totalPedido));
  }
}

function renderPayments(lines: string[], factura: FacturaCerradaPayload, width: number): void {
  const payments = factura.pagos || [];
  // Art. 11 num. 10: con documento electrónico el título dice la FORMA de pago
  // declarada (contado o crédito) en el mismo renglón, sin gastar otro.
  const forma = factura.fe?.forma_pago ? sanitizeText(factura.fe.forma_pago).toUpperCase() : '';
  const titulo = (dividido: boolean): string =>
    forma
      ? `FORMA DE PAGO: ${forma}${dividido ? ' (DIVIDIDO)' : ''}`
      : `FORMAS DE PAGO${dividido ? ' (DIVIDIDO)' : ''}`;

  if (payments.length > 1) {
    centrado(lines, titulo(true), width);
    for (const payment of payments) renderPayment(lines, payment, width, true);
    const totalCobrado = payments.reduce((sum, payment) => sum + Number(payment.monto || 0) + Number(payment.propina || 0), 0);
    lines.push(leftRight('TOTAL COBRADO:', `$${formatMoney(totalCobrado)}`, width));
  } else if (payments.length === 1) {
    centrado(lines, titulo(false), width);
    renderPayment(lines, payments[0], width, false);
  } else if (factura.metodo_pago) {
    centrado(lines, titulo(false), width);
    lines.push(leftRight(`${labelMetodo(factura.metodo_pago)}:`, `$${formatMoney(factura.total)}`, width));
  }
}

function renderPayment(lines: string[], payment: PagoEventoItem, width: number, detailed: boolean): void {
  const method = labelMetodo(payment.metodo || payment.metodo_pago);
  const amount = Number(payment.monto) || 0;
  const tip = Number(payment.propina) || 0;
  // En el pago dividido el desglose solo aporta cuando el método lleva servicio:
  // sin él, subtotal y total del método son el mismo número y basta una línea.
  if (detailed && tip > 0) {
    lines.push(`${method}:`);
    lines.push(leftRight('  Subtotal:', `$${formatMoney(amount)}`, width));
    lines.push(leftRight('  + Servicio:', `$${formatMoney(tip)}`, width));
    lines.push(leftRight('  Total metodo:', `$${formatMoney(amount + tip)}`, width));
    return;
  }

  lines.push(leftRight(`${method}:`, `$${formatMoney(amount)}`, width));
  if (tip > 0) lines.push(leftRight('  + Servicio:', `$${formatMoney(tip)}`, width));
}

/**
 * Efectivo que entregó el cliente y el cambio que le corresponde (apoyo de
 * vueltas). La API ya lo midió contra lo que el pedido cobra en efectivo, así
 * que aquí no se recalcula nada; un dato incompleto o incoherente no se imprime,
 * porque en papel le prometería al comensal un cambio que no es.
 */
function renderCambio(lines: string[], factura: FacturaCerradaPayload, width: number): void {
  const recibido = factura.efectivo_recibido;
  const cambio = factura.cambio;
  if (typeof recibido !== 'number' || typeof cambio !== 'number') return;
  if (!(recibido > 0) || !(cambio >= 0) || cambio > recibido) return;
  lines.push(leftRight('EFECTIVO RECIBIDO:', `$${formatMoney(recibido)}`, width));
  lines.push(leftRight('CAMBIO:', `$${formatMoney(cambio)}`, width));
}

function renderReason(lines: string[], reason: unknown, prefix = '      Motivo: '): void {
  if (reason) lines.push(`${prefix}${sanitizeText(reason)}`);
}
