// src/utils.ts
var METODO_LABELS = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  datafono: "Tarjeta",
  transferencia: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  bold: "Bold",
  rappi_pay: "Rappi Pay",
  pse: "PSE",
  bonos: "Bonos",
  credito: "Credito",
  mixto: "Mixto"
};
function sanitizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n\r\x1B\x1D]/g, "");
}
function labelMetodo(raw) {
  const key = sanitizeText(raw || "efectivo").toLowerCase().trim();
  if (key.includes("+")) {
    return key.split("+").map((part) => labelMetodo(part.trim())).join(" + ");
  }
  return METODO_LABELS[key] || capitalize(key) || "Efectivo";
}
function center(text2, width = 48) {
  const safe = sanitizeText(text2);
  if (safe.length >= width) return safe;
  return " ".repeat(Math.floor((width - safe.length) / 2)) + safe;
}
function leftRight(left, right, width = 48) {
  const safeLeft = sanitizeText(left);
  const safeRight = sanitizeText(right);
  const gap = width - safeLeft.length - safeRight.length;
  return safeLeft + " ".repeat(Math.max(gap, 1)) + safeRight;
}
function itemRow(qty, name, right, width = 48) {
  const qtyStr = String(Number(qty) || 1).padStart(2, " ");
  const safeRight = sanitizeText(right);
  const nameMax = Math.max(6, width - qtyStr.length - safeRight.length - 2);
  const nameStr = sanitizeText(name).substring(0, nameMax);
  return leftRight(`${qtyStr} ${nameStr}`, safeRight, width);
}
function rightPadMoney(value, width) {
  const safe = sanitizeText(value);
  return safe.length >= width ? safe : " ".repeat(width - safe.length) + safe;
}
function formatMoney(value) {
  return (Number(value) || 0).toLocaleString("es-CO");
}
function formatDate(date, timezone = "America/Bogota") {
  try {
    return sanitizeText(date.toLocaleDateString("es-CO", { timeZone: timezone }));
  } catch {
    return sanitizeText(date.toLocaleDateString("es-CO"));
  }
}
function formatTime(date, timezone = "America/Bogota") {
  try {
    return sanitizeText(date.toLocaleTimeString("es-CO", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }));
  } catch {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}
function footer(width = 48, text2 = "Desarrollado por www.foodly.com.co") {
  return ["", center(text2, width), "", "", "", "", ""].join("\n");
}
function clampColumns(columns) {
  const numeric = Number(columns);
  if (!Number.isFinite(numeric)) return 48;
  return Math.min(80, Math.max(24, Math.floor(numeric)));
}
function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

// src/escpos.ts
var ESC = "\x1B";
var GS = "";
function escBold(active) {
  return ESC + (active ? "E" : "E\0");
}
function escFontSize(size) {
  const map = {
    1: "!\0",
    2: "!",
    3: "!",
    4: "!"
  };
  return map[size];
}
function escCut() {
  return GS + "V\0";
}
function escLeftMargin(dots = 0) {
  const safeDots = Math.max(0, Math.min(65535, Math.trunc(dots)));
  return GS + "L" + String.fromCharCode(safeDots & 255, safeDots >> 8 & 255);
}
function escCashDrawerPulse() {
  return ESC + "p\0\xFA";
}
function escBeep(count = 2, duration = 3) {
  const safeCount = Math.max(1, Math.min(9, Math.trunc(count)));
  const safeDuration = Math.max(1, Math.min(9, Math.trunc(duration)));
  return ESC + "B" + String.fromCharCode(safeCount, safeDuration);
}
function textToEscPosBytes(text2, options = {}) {
  const bytes = [27, 64];
  const document = [
    options.openCashDrawer ? escCashDrawerPulse() : "",
    text2 || "",
    options.cut ? escCut() : "",
    options.beepAfterPrint ? escBeep() : ""
  ].join("");
  for (let i = 0; i < document.length; i++) {
    const code = document.charCodeAt(i);
    if (code === 27 || code === 29 || code === 10 || code === 13) {
      bytes.push(code);
      if (code === 27 || code === 29) {
        const command = document.charCodeAt(i + 1);
        if (Number.isFinite(command)) {
          bytes.push(command);
          const paramCount = escPosParamCount(code, command);
          for (let param = 0; param < paramCount && i + 2 + param < document.length; param++) {
            bytes.push(document.charCodeAt(i + 2 + param) & 255);
          }
          i += 1 + paramCount;
        }
      }
      continue;
    }
    const safe = sanitizeText(document[i]);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 32 && safeCode <= 126) bytes.push(safeCode);
    }
  }
  return new Uint8Array(bytes);
}
function escPosParamCount(prefix, command) {
  if (prefix === 27) {
    if (command === 66) return 2;
    if (command === 69) return 1;
    if (command === 112) return 3;
    if (command === 97) return 1;
    return 0;
  }
  if (prefix === 29) {
    if (command === 33) return 1;
    if (command === 76) return 2;
    if (command === 86) return 1;
    return 0;
  }
  return 0;
}

// src/renderers/comanda.ts
function renderComanda(payload, options = {}) {
  if (payload.tipo_comanda === "anulacion") return renderComandaAnulacion(payload, options);
  const width = clampColumns(options.columns);
  const now = options.now || /* @__PURE__ */ new Date();
  const timezone = options.timezone || "America/Bogota";
  const sep = "-".repeat(width);
  const sep2 = "=".repeat(width);
  const bold = escBold(true);
  const boldOff = escBold(false);
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  const lines = ["", "", ""];
  const secciones = Array.isArray(payload.secciones) && payload.secciones.length > 0 ? payload.secciones : null;
  const titulo = secciones ? `COMANDA #${payload.comanda || ""}` : `COMANDA #${payload.comanda || ""} | ${sanitizeText(payload.area || "").toUpperCase()}`;
  lines.push(center(titulo, width));
  lines.push(sep2);
  const mesaLabel = sanitizeText(String(payload.mesa_nombre || `Mesa: ${payload.mesa || ""}`).toUpperCase());
  lines.push(`${bold}${mesaLabel}${boldOff}   Mesero: ${sanitizeText(payload.mesero || "")}`);
  if (payload.cliente_nombre) lines.push(`${bold}Cliente: ${sanitizeText(payload.cliente_nombre)}${boldOff}`);
  if (payload.localizador) lines.push(`${bold}Localizador: ${sanitizeText(payload.localizador)}${boldOff}`);
  if (payload.comensales) lines.push(`Personas: ${payload.comensales}`);
  lines.push(`Fecha: ${formatDate(now, timezone)}   Hora: ${hora}`);
  const pushItems = (items) => {
    for (const item of items || []) {
      const name = sanitizeText((item.nombre || item.producto || "").toUpperCase()).substring(0, Math.max(10, width - 6));
      const qty = String(item.cantidad || 1).padStart(3, " ");
      lines.push(bold + `${qty}  ${name}` + boldOff);
      if (item.comentario) lines.push(`      > ${sanitizeText(item.comentario)}`);
      lines.push("");
    }
  };
  if (secciones) {
    for (const seccion of secciones) {
      lines.push(sep);
      lines.push(bold + center(`* ${sanitizeText(seccion.area || "").toUpperCase()} *`, width) + boldOff);
      lines.push(sep);
      pushItems(seccion.items);
    }
  } else {
    lines.push(sep);
    lines.push("CANT  PRODUCTO");
    lines.push(sep);
    pushItems(payload.items);
  }
  lines.push(sep2, "", "", "", "");
  return lines.join("\n");
}
function renderComandaAnulacion(payload, options = {}) {
  const width = clampColumns(options.columns);
  const now = options.now || /* @__PURE__ */ new Date();
  const timezone = options.timezone || "America/Bogota";
  const sep = "-".repeat(width);
  const sep2 = "=".repeat(width);
  const sepX = "X".repeat(width);
  const bold = escBold(true);
  const boldOff = escBold(false);
  const hora = payload.hora ? sanitizeText(payload.hora) : formatTime(now, timezone);
  const lines = ["", "", ""];
  lines.push(sep2);
  lines.push(bold + center("*** ANULACION ***", width) + boldOff);
  lines.push(center(`COMANDA #${payload.comanda || ""} | ${sanitizeText(payload.area || "").toUpperCase()}`, width));
  lines.push(sep2);
  const mesaLabel = sanitizeText(String(payload.mesa_nombre || `Mesa: ${payload.mesa || ""}`).toUpperCase());
  lines.push(`${bold}${mesaLabel}${boldOff}   Mesero: ${sanitizeText(payload.mesero || "")}`);
  if (payload.cliente_nombre) lines.push(`${bold}Cliente: ${sanitizeText(payload.cliente_nombre)}${boldOff}`);
  if (payload.localizador) lines.push(`${bold}Localizador: ${sanitizeText(payload.localizador)}${boldOff}`);
  lines.push(`Fecha: ${formatDate(now, timezone)}   Hora: ${hora}`);
  lines.push(sep);
  if (payload.motivo) {
    lines.push(bold + `MOTIVO: ${sanitizeText(String(payload.motivo).toUpperCase())}` + boldOff);
    lines.push(sep);
  }
  lines.push(bold + center("** NO PREPARAR **", width) + boldOff);
  lines.push(sep);
  for (const item of payload.items || []) {
    const name = sanitizeText((item.nombre || item.producto || "").toUpperCase()).substring(0, Math.max(10, width - 6));
    const qty = String(Math.abs(Number(item.cantidad) || 1)).padStart(3, " ");
    lines.push(bold + `${qty}  ${name}` + boldOff);
    if (item.comentario) lines.push(`      > ${sanitizeText(item.comentario)}`);
    lines.push("");
  }
  lines.push(sepX);
  lines.push(bold + center("** ANULADO **", width) + boldOff);
  lines.push(sepX, "", "", "", "");
  return lines.join("\n");
}

// src/renderers/factura.ts
function renderFactura(factura, options = {}) {
  const width = clampColumns(options.columns);
  const now = options.now || /* @__PURE__ */ new Date();
  const timezone = options.timezone || "America/Bogota";
  const sep = "-".repeat(width);
  const sep2 = "=".repeat(width);
  const lines = [];
  if (factura.tenant_nombre) lines.push(center(String(factura.tenant_nombre).toUpperCase(), width));
  if (factura.nit) lines.push(center(`NIT: ${factura.nit}`, width));
  lines.push(sep);
  lines.push(center(factura.numero_factura || "PEDIDO", width));
  lines.push(sep);
  if (width >= 42) {
    lines.push(`Fecha: ${formatDate(now, timezone)}        Hora: ${formatTime(now, timezone)}`);
  } else {
    lines.push(`Fecha: ${formatDate(now, timezone)}`);
    lines.push(`Hora:  ${formatTime(now, timezone)}`);
  }
  lines.push(sanitizeText(factura.mesa_nombre || `Mesa: ${factura.mesa_numero || ""}`));
  lines.push(`Mesero: ${sanitizeText(factura.mesero || "")}`);
  renderCliente(lines, factura);
  lines.push(sep);
  renderItems(lines, factura.items || [], width, sep);
  renderTotals(lines, factura, width, sep2);
  renderPayments(lines, factura, width, sep);
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", width));
  lines.push(center("Gracias por su visita!", width));
  lines.push(footer(width, options.footer));
  return lines.join("\n");
}
function renderCliente(lines, factura) {
  const nombre = factura.cliente;
  if (nombre && nombre !== "Consumidor final") lines.push(`Cliente: ${sanitizeText(nombre)}`);
  if (factura.cliente_telefono) lines.push(`Tel: ${sanitizeText(factura.cliente_telefono)}`);
  if (factura.cliente_direccion) lines.push(`Dir: ${sanitizeText(factura.cliente_direccion)}`);
  if (factura.cliente_barrio) lines.push(`Barrio: ${sanitizeText(factura.cliente_barrio)}`);
  if (factura.localizador) lines.push(`Localizador: ${sanitizeText(factura.localizador)}`);
}
function renderItems(lines, items, width, sep) {
  if (!items.length) return;
  if (width >= 42) lines.push("CANT  PRODUCTO                V.UNI    TOTAL");
  else lines.push(leftRight("CANT PRODUCTO", "TOTAL", width));
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
function renderWideItem(lines, item) {
  const qty = String(item.cantidad || 1).padStart(3, " ");
  const name = sanitizeText(item.nombre || item.plato || "").substring(0, 22).padEnd(22, " ");
  const price = Number(item.precio_unitario) || 0;
  const qtyNum = Number(item.cantidad) || 1;
  const descPct = Number(item.descuento_porcentaje) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = gross - descAmount;
  if (item.es_cortesia) {
    lines.push(`${qty}  ${name} ${rightPadMoney(formatMoney(price), 8)}       $0`);
    lines.push("      ** CORTESIA **");
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
function renderNarrowItem(lines, item, width) {
  const qtyNum = Number(item.cantidad) || 1;
  const price = Number(item.precio_unitario) || 0;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = item.es_cortesia ? 0 : gross - descAmount;
  lines.push(itemRow(qtyNum, item.nombre || item.plato || "", `$${formatMoney(net)}`, width));
  if (item.es_cortesia) lines.push("   ** CORTESIA **");
  if (descAmount > 0) lines.push(`   Dcto (-$${formatMoney(descAmount)})`);
  renderReason(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : void 0));
}
function renderTotals(lines, factura, width, sep2) {
  const subtotalVisible = Number(factura.subtotal) + Number(factura.descuento_monto || 0);
  const descMesa = Number(factura.descuento_monto) || 0;
  lines.push(leftRight("SUBTOTAL:", `$${formatMoney(subtotalVisible)}`, width));
  if (descMesa > 0) {
    lines.push(leftRight("DESC. MESA:", `-$${formatMoney(descMesa)}`, width));
    const reason = factura.motivo_descuento || factura.motivo_descuento_mesa || factura.justificacion_descuento || factura.descuento_motivo;
    renderReason(lines, reason, "  Motivo: ");
    lines.push(leftRight("NETO:", `$${formatMoney(factura.subtotal)}`, width));
  }
  if (Number(factura.monto_iva) > 0) lines.push(leftRight("IVA:", `$${formatMoney(factura.monto_iva)}`, width));
  if (Number(factura.propina) > 0) lines.push(leftRight("SERVICIO:", `$${formatMoney(factura.propina)}`, width));
  lines.push(sep2);
  lines.push(leftRight("TOTAL PEDIDO:", `$ ${formatMoney(factura.total)}`, width));
  const deliveryAmount = Number(factura.recaudo_domicilio_monto) || 0;
  if (deliveryAmount > 0) {
    lines.push(leftRight("DOMICILIO:", `$${formatMoney(deliveryAmount)}`, width));
    lines.push(sep2);
    lines.push(leftRight("TOTAL A PAGAR:", `$ ${formatMoney(Number(factura.total_cliente) || Number(factura.total) + deliveryAmount)}`, width));
  }
  lines.push(sep2);
}
function renderPayments(lines, factura, width, sep) {
  const payments = factura.pagos || [];
  if (payments.length > 1) {
    lines.push(center("FORMAS DE PAGO (DIVIDIDO)", width));
    lines.push(sep);
    for (const payment of payments) renderPayment(lines, payment, width, true, sep);
    const totalCobrado = payments.reduce((sum, payment) => sum + Number(payment.monto || 0) + Number(payment.propina || 0), 0);
    lines.push(leftRight("TOTAL COBRADO:", `$${formatMoney(totalCobrado)}`, width));
  } else if (payments.length === 1) {
    lines.push(center("FORMAS DE PAGO", width));
    lines.push(sep);
    renderPayment(lines, payments[0], width, false, sep);
  } else if (factura.metodo_pago) {
    lines.push(center("FORMAS DE PAGO", width));
    lines.push(sep);
    lines.push(leftRight(`${labelMetodo(factura.metodo_pago)}:`, `$${formatMoney(factura.total)}`, width));
  }
  lines.push(sep);
}
function renderPayment(lines, payment, width, detailed, sep) {
  const method = labelMetodo(payment.metodo || payment.metodo_pago);
  const amount = Number(payment.monto) || 0;
  const tip = Number(payment.propina) || 0;
  if (detailed) {
    lines.push(`${method}:`);
    lines.push(leftRight("  Subtotal:", `$${formatMoney(amount)}`, width));
    if (tip > 0) lines.push(leftRight("  + Servicio:", `$${formatMoney(tip)}`, width));
    lines.push(leftRight("  Total metodo:", `$${formatMoney(amount + tip)}`, width));
    lines.push(sep);
    return;
  }
  lines.push(leftRight(`${method.padEnd(14, " ")}:`, `$${formatMoney(amount)}`, width));
  if (tip > 0) lines.push(leftRight("  + Servicio:", `$${formatMoney(tip)}`, width));
}
function renderReason(lines, reason, prefix = "      Motivo: ") {
  if (reason) lines.push(`${prefix}${sanitizeText(reason)}`);
}

// src/renderers/documents.ts
function renderPrecuenta(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "VERIFICACION DE PEDIDO", ctx);
  const subtotal = num(data.subtotal);
  const descuentoMesa = num(data.descuento_mesa ?? data.descuento_monto);
  const propinaPct = numOrDefault(data.porcentaje_propina_sugerida, 10);
  const propina = numOrDefault(data.propina_sugerida, Math.round(subtotal * propinaPct / 100));
  const total = num(data.total);
  const domicilio = num(data.recaudo_domicilio_monto);
  const mesaNombre = text(data.mesa_nombre || `MESA: ${data.mesa_numero || ""}`);
  const esDelivery = /domicilio|llevar/i.test(mesaNombre);
  pushDateTime(lines, ctx);
  lines.push(escBold(true) + mesaNombre + escBold(false));
  lines.push(`MESERO: ${text(data.mesero)}`);
  lines.push(ctx.sep);
  renderItemTable(lines, arr(data.items), ctx, "nombre", false);
  lines.push(leftRight("SUBTOTAL:", money(subtotal + descuentoMesa), ctx.width));
  if (descuentoMesa > 0) {
    lines.push(leftRight("DESC. MESA:", `-${money(descuentoMesa)}`, ctx.width));
    renderReason2(lines, data.motivo_descuento || data.motivo_descuento_mesa || data.justificacion_descuento || data.descuento_motivo);
    lines.push(leftRight("NETO:", money(subtotal), ctx.width));
  }
  if (num(data.monto_servicio) > 0 && !esDelivery) lines.push(leftRight("Servicio:", money(data.monto_servicio), ctx.width));
  if (num(data.monto_iva) > 0) lines.push(leftRight("IVA:", money(data.monto_iva), ctx.width));
  lines.push(ctx.sep);
  if (propina > 0 && !esDelivery) {
    lines.push(leftRight(`SERVICIO SUGERIDO (${propinaPct}%):`, money(propina), ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight("TOTAL + SERVICIO:", money(total + propina), ctx.width));
  } else if (domicilio > 0) {
    lines.push(leftRight("TOTAL PEDIDO:", money(total), ctx.width));
    lines.push(leftRight("DOMICILIO:", money(domicilio), ctx.width));
    lines.push(ctx.sep);
    lines.push(escBold(true) + leftRight("TOTAL A PAGAR:", money(num(data.total_cliente) || total + domicilio), ctx.width) + escBold(false));
  } else {
    lines.push(leftRight("TOTAL A PAGAR:", money(total), ctx.width));
  }
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(center("Documento no fiscal - verificacion", ctx.width));
  lines.push(center("Gracias por su visita!", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  if (esDelivery && isRecord(data.cliente)) {
    lines.push("");
    lines.push("");
    lines.push("V\0");
    lines.push("\x1B@");
    lines.push("L\0\0");
    lines.push(renderDatosCliente(data, options));
  }
  return lines.join("\n");
}
function renderDatosCliente(data, options = {}) {
  const ctx = context(options);
  const cliente = isRecord(data.cliente) ? data.cliente : void 0;
  const lines = [];
  if (!cliente) {
    lines.push(center("No hay datos de cliente.", ctx.width));
    lines.push(ctx.sep2);
    lines.push(footer(ctx.width, options.footer));
    return lines.join("\n");
  }
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center("DATOS PARA ENTREGA", ctx.width) + escBold(false));
  lines.push(center(text(data.mesa_nombre).toUpperCase(), ctx.width));
  lines.push(ctx.sep2);
  lines.push("");
  if (cliente.nombre) lines.push(escBold(true) + "Cliente: " + escBold(false) + text(cliente.nombre));
  if (cliente.telefono) lines.push(escBold(true) + "Telefono: " + escBold(false) + text(cliente.telefono));
  if (cliente.barrio) lines.push(escBold(true) + "Barrio: " + escBold(false) + text(cliente.barrio));
  if (cliente.direccion) lines.push(escBold(true) + "Direccion: " + escBold(false) + text(cliente.direccion));
  if (cliente.notas) {
    lines.push(ctx.sep);
    lines.push(escBold(true) + "Notas:" + escBold(false));
    lines.push(text(cliente.notas));
  }
  lines.push("");
  lines.push(ctx.sep2);
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderCierreCaja(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "CIERRE DE CAJA", ctx);
  const metodos = arr(data.metodos_desglose);
  const tieneDesglose = metodos.length > 0;
  const gastos = isRecord(data.gastos) ? data.gastos : void 0;
  const ingresosCaja = isRecord(data.ingresos_caja) ? data.ingresos_caja : void 0;
  const domicilios = isRecord(data.domicilios) ? data.domicilios : void 0;
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  if (data.fecha_apertura) lines.push(leftRight("Apertura:", dateTime(data.fecha_apertura, ctx), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + "VENTAS POR METODO DE PAGO" + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.venta) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.venta), ctx.width));
    }
  } else {
    lines.push(leftRight("  Efectivo:", money(data.total_efectivo), ctx.width));
    lines.push(leftRight("  Datafono:", money(data.total_datafono), ctx.width));
    lines.push(leftRight("  Transferencia:", money(data.total_transferencia), ctx.width));
    if (num(data.total_credito) > 0) lines.push(leftRight("  Credito:", money(data.total_credito), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL VENTAS:", money(data.total_ventas), ctx.width) + escBold(false));
  lines.push("");
  lines.push(escBold(true) + "SERVICIO" + escBold(false));
  lines.push(ctx.sep);
  if (tieneDesglose) {
    for (const item of metodos) {
      if (num(item.servicio) > 0) lines.push(leftRight(`  ${labelMetodo(item.clave)}:`, money(item.servicio), ctx.width));
    }
  } else {
    if (num(data.propina_efectivo) > 0) lines.push(leftRight("  Efectivo:", money(data.propina_efectivo), ctx.width));
    if (num(data.propina_datafono) > 0) lines.push(leftRight("  Datafono:", money(data.propina_datafono), ctx.width));
    if (num(data.propina_transferencia) > 0) lines.push(leftRight("  Transferencia:", money(data.propina_transferencia), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL SERVICIO:", money(data.total_propinas), ctx.width) + escBold(false));
  lines.push("");
  if (num(data.num_anulaciones) > 0 || num(data.items_anulados) > 0) {
    lines.push(escBold(true) + "ANULACIONES" + escBold(false));
    lines.push(ctx.sep);
    if (num(data.num_anulaciones) > 0) lines.push(leftRight("  Pedidos anulados:", data.num_anulaciones, ctx.width));
    if (num(data.monto_anulaciones) > 0) lines.push(leftRight("  Monto anulado:", money(data.monto_anulaciones), ctx.width));
    if (num(data.items_anulados) > 0) lines.push(leftRight("  Items anulados:", data.items_anulados, ctx.width));
    lines.push("");
  }
  const totalIngreso = num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas);
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("TOTAL INGRESO:", money(totalIngreso), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
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
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderGastosTurno(data, options = {}) {
  const ctx = context(options);
  const gastos = isRecord(data.gastos) ? data.gastos : {};
  const items = arr(gastos.items);
  if (!items.length) return "";
  const lines = header(data, "EGRESOS DEL TURNO", ctx);
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(ctx.width >= 42 ? "CONCEPTO                          METODO  MONTO" : "CONCEPTO");
  lines.push(ctx.sep);
  for (const item of items) {
    if (ctx.width >= 42) {
      const concepto = text(item.concepto).substring(0, 30).padEnd(30, " ");
      const metodo = text(item.metodo_pago || "efec").substring(0, 7).padEnd(7, " ");
      lines.push(`${concepto} ${metodo} ${money(item.monto)}`);
    } else {
      lines.push(text(item.concepto).substring(0, ctx.width));
      lines.push(leftRight(`  ${labelMetodo(item.metodo_pago)}:`, `-${money(item.monto)}`, ctx.width));
    }
    const proveedor = isRecord(item.proveedor) ? item.proveedor : void 0;
    if (proveedor?.nombre) lines.push(`  Prov: ${text(proveedor.nombre)}`);
    if (item.observacion) lines.push(`  Obs: ${text(item.observacion)}`);
  }
  renderExpenseSummary(lines, gastos, ctx);
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderFacturasTurno(data, options = {}) {
  const ctx = context(options);
  const facturas = arr(data.facturas);
  const lines = header(data, "PEDIDOS DEL TURNO", ctx);
  const cerradas = num(data.num_facturas_cerradas) || facturas.filter((f) => text(f.tipo || "cerrada").toLowerCase() === "cerrada").length;
  const anuladas = num(data.num_facturas_anuladas) || facturas.filter((f) => text(f.tipo).toLowerCase() === "anulada").length;
  const notas = num(data.num_notas_credito) || facturas.filter((f) => text(f.tipo).toLowerCase() === "nc").length;
  const totalCons = num(data.num_facturas_total) || cerradas + anuladas;
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos cobrados:", cerradas, ctx.width));
  if (anuladas > 0) lines.push(leftRight("Pedidos anulados:", anuladas, ctx.width));
  if (notas > 0) lines.push(leftRight("Notas de ajuste:", notas, ctx.width));
  if (totalCons !== cerradas) lines.push(leftRight("Total consecutivos:", totalCons, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PED       METODO              TOTAL" : "PED       TOTAL") + escBold(false));
  lines.push(ctx.sep);
  for (const factura of facturas) {
    renderFacturaTurno(lines, factura, ctx);
  }
  lines.push(ctx.sep2);
  lines.push(leftRight("Total ventas:", money(data.total_ventas), ctx.width));
  lines.push(leftRight("Total servicio:", money(data.total_propinas), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL INGRESO:", money(num(data.total_ingreso) || num(data.total_ventas) + num(data.total_propinas)), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderVentasPLU(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "VENTAS POR PRODUCTO", ctx);
  const productos = arr(data.productos);
  lines.push(leftRight("Cajero:", text(data.cajero), ctx.width));
  lines.push(leftRight("Cierre:", dateTime(data.fecha_cierre || ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PRODUCTO                  CANT    TOTAL" : "PRODUCTO") + escBold(false));
  lines.push(ctx.sep);
  for (const item of productos) {
    if (ctx.width >= 42) {
      const nombre = text(item.nombre).substring(0, 24).padEnd(24, " ");
      lines.push(`${nombre} ${String(item.cantidad || 0).padStart(4, " ")} ${money(item.valor).padStart(10, " ")}`);
    } else {
      lines.push(text(item.nombre).substring(0, ctx.width));
      lines.push(leftRight(`  Cant: ${item.cantidad || 0}`, money(item.valor), ctx.width));
    }
  }
  const totalProductos = num(data.total_productos ?? data.total_valor);
  const descuentoMesa = num(data.total_descuento_mesa);
  const totalCuadre = num(data.total_cuadre) || totalProductos - descuentoMesa;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("Unidades vendidas:", data.total_items || 0, ctx.width) + escBold(false));
  lines.push(leftRight("Total productos:", money(totalProductos), ctx.width));
  if (descuentoMesa > 0) lines.push(leftRight("Desc. mesa:", `-${money(descuentoMesa)}`, ctx.width));
  lines.push(escBold(true) + leftRight("Total cuadre:", money(totalCuadre), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderReporteVentas(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "REPORTE DE VENTAS", ctx);
  lines.push(leftRight("Periodo:", `${text(data.desde)} a ${text(data.hasta)}`, ctx.width));
  lines.push(leftRight("Generado:", dateTime(ctx.now, ctx), ctx.width));
  lines.push(ctx.sep);
  if (isRecord(data.resumen)) {
    const r = data.resumen;
    lines.push(escBold(true) + "RESUMEN" + escBold(false));
    lines.push(ctx.sep);
    lines.push(leftRight("  Pedidos:", r.total_facturas || 0, ctx.width));
    lines.push(leftRight("  Venta bruta:", money(r.venta_bruta), ctx.width));
    if (num(r.total_descuentos) > 0) lines.push(leftRight("  Descuentos:", `-${money(r.total_descuentos)}`, ctx.width));
    lines.push(leftRight("  Venta neta:", money(r.venta_neta), ctx.width));
    if (num(r.total_propinas) > 0) lines.push(leftRight("  Propinas:", money(r.total_propinas), ctx.width));
    lines.push(leftRight("  Ticket prom:", money(r.ticket_promedio), ctx.width));
    lines.push(leftRight("  Comensales:", r.total_comensales || 0, ctx.width));
    lines.push("");
  }
  const productos = arr(data.productos);
  if (productos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + "PRODUCTOS VENDIDOS" + escBold(false));
    lines.push(ctx.sep);
    let totalCant = 0;
    let totalIngreso = 0;
    for (const p of productos) {
      const cant = num(p.cantidad);
      const ingreso = num(p.ingreso_neto);
      totalCant += cant;
      totalIngreso += ingreso;
      if (ctx.width >= 42) {
        lines.push(`${String(cant).padStart(3, " ")}   ${text(p.nombre).substring(0, 16).padEnd(16, " ")} ${money(ingreso).padStart(12, " ")}`);
      } else {
        lines.push(`${String(cant).padStart(3, " ")} ${text(p.nombre).substring(0, ctx.width - 5)}`);
        lines.push(leftRight("  Ingreso:", money(ingreso), ctx.width));
      }
    }
    lines.push(ctx.sep);
    lines.push(escBold(true) + leftRight(`TOTAL (${totalCant})`, money(totalIngreso), ctx.width) + escBold(false));
    lines.push("");
  }
  const metodos = arr(data.metodos);
  if (metodos.length) {
    lines.push(ctx.sep2);
    lines.push(escBold(true) + "METODOS DE PAGO" + escBold(false));
    lines.push(ctx.sep);
    for (const metodo of metodos) {
      lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, money(metodo.total), ctx.width));
    }
  }
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderCorreccion(data, options = {}) {
  const ctx = context(options);
  const lines = [];
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center("CORRECCION DE PEDIDO", ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push(leftRight("Pedido:", data.numero_factura || "N/A", ctx.width));
  if (data.mesa_numero) lines.push(leftRight("Mesa:", data.mesa_numero, ctx.width));
  if (data.mesero) lines.push(leftRight("Mesero:", text(data.mesero), ctx.width));
  lines.push(leftRight("Fecha:", formatDate(ctx.now, ctx.timezone), ctx.width));
  lines.push(leftRight("Hora:", formatTime(ctx.now, ctx.timezone), ctx.width));
  if (data.corregido_por) lines.push(leftRight("Corregido por:", text(data.corregido_por), ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + "CAMBIOS REALIZADOS" + escBold(false));
  lines.push(ctx.sep);
  for (const cambio of arr(data.cambios)) {
    const campo = text(cambio.campo);
    if (campo === "metodo_pago") {
      lines.push(leftRight("  Metodo anterior:", text(cambio.anterior).toUpperCase(), ctx.width));
      lines.push(leftRight("  Metodo nuevo:", text(cambio.nuevo).toUpperCase(), ctx.width));
    } else if (campo === "servicio") {
      lines.push(leftRight("  Servicio anterior:", money(cambio.anterior), ctx.width));
      lines.push(leftRight("  Servicio nuevo:", money(cambio.nuevo), ctx.width));
    } else if (campo === "total") {
      lines.push(leftRight("  Total anterior:", money(cambio.anterior), ctx.width));
      lines.push(leftRight("  Total nuevo:", money(cambio.nuevo), ctx.width));
    } else if (campo === "pagos") {
      lines.push("  Pagos anteriores:");
      renderCorrectionPayments(lines, arr(cambio.anterior), ctx);
      lines.push("  Pagos nuevos:");
      renderCorrectionPayments(lines, arr(cambio.nuevo), ctx);
    }
    lines.push("");
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + `Motivo: ${text(data.motivo || "No especificado")}` + escBold(false));
  lines.push(ctx.sep2);
  lines.push(center("DOCUMENTO DE AUDITORIA", ctx.width));
  lines.push(center("Conservar para registros", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderNotaCredito(data, options = {}) {
  const ctx = context(options);
  const detalle = isRecord(data.detalle) ? data.detalle : {};
  const lines = header(data, "*** NOTA DE AJUSTE ***", ctx);
  if (data.numero_nota) lines.push(center(text(data.numero_nota), ctx.width));
  lines.push(ctx.sep2);
  lines.push(leftRight("Pedido anulado:", text(data.factura_original), ctx.width));
  pushDateTime(lines, ctx);
  lines.push(text(data.mesa_nombre || `Mesa: ${data.mesa_numero || ""}`));
  if (data.mesero) lines.push(`Mesero: ${text(data.mesero)}`);
  lines.push(ctx.sep);
  renderItemTable(lines, arr(detalle.items_anulados), ctx, "plato_nombre");
  const subtotal = num(detalle.subtotal_original);
  const descMesa = num(detalle.descuento_monto_mesa);
  lines.push(leftRight("SUBTOTAL:", money(subtotal + descMesa), ctx.width));
  if (descMesa > 0) {
    const pct = num(detalle.descuento_porcentaje_mesa);
    lines.push(leftRight(pct > 0 ? `DESC. MESA (${pct}%):` : "DESC. MESA:", `-${money(descMesa)}`, ctx.width));
    renderReason2(lines, detalle.motivo_descuento);
    lines.push(leftRight("NETO:", money(subtotal), ctx.width));
  }
  if (num(detalle.monto_iva_original) > 0) lines.push(leftRight("IVA:", money(detalle.monto_iva_original), ctx.width));
  if (num(detalle.servicio_original) > 0) lines.push(leftRight("SERVICIO:", money(detalle.servicio_original), ctx.width));
  if (num(detalle.recaudo_domicilio_monto) > 0) lines.push(leftRight("DOMICILIO:", money(detalle.recaudo_domicilio_monto), ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + leftRight("TOTAL ANULADO:", money(data.monto_anulado), ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  renderPayments2(lines, arr(detalle.pagos), detalle.metodo_pago, data.monto_anulado, ctx);
  lines.push(ctx.sep2);
  lines.push("");
  lines.push(escBold(true) + "MOTIVO DE ANULACION:" + escBold(false));
  lines.push(text(data.motivo || "No especificado"));
  lines.push("");
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(center("Nota de Ajuste - Conservar", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderTomaInventario(data, options = {}) {
  const ctx = context(options);
  const lines = header(data, "TOMA DE INVENTARIO", ctx);
  const items = arr(data.items);
  const ciego = data.modo_ciego === true;
  const blank = "_".repeat(ctx.width >= 42 ? 8 : 6);
  const sistW = 8;
  const nameW = Math.max(8, ctx.width - blank.length - sistW - 2);
  if (data.bodega) lines.push(leftRight("Bodega:", text(data.bodega), ctx.width));
  if (data.generado_por) lines.push(leftRight("Genera:", text(data.generado_por), ctx.width));
  pushDateTime(lines, ctx);
  lines.push(ctx.sep);
  lines.push(escBold(true) + (ctx.width >= 42 ? "PRODUCTO              SISTEMA   FISICO" : `${"PRODUCTO".padEnd(nameW)} ${"SIST".padStart(sistW)} FISICO`) + escBold(false));
  lines.push(ctx.sep);
  if (!items.length) lines.push(center("Sin productos para tomar.", ctx.width));
  for (const item of items) {
    const nombre = text(item.nombre || item.producto);
    const unidad = text(item.unidad || item.unidad_medida || "u");
    const sist = ciego ? blank : `${formatQty(item.stock_actual ?? item.stock ?? item.existencia)} ${unidad}`.trim();
    if (ctx.width >= 42) {
      lines.push(`${nombre.substring(0, 20).padEnd(20, " ")} ${sist.padStart(8, " ")}  ${blank}`);
    } else {
      lines.push(`${nombre.substring(0, nameW).padEnd(nameW, " ")} ${sist.padStart(sistW, " ")} ${blank}`);
    }
  }
  lines.push(ctx.sep2);
  lines.push(leftRight("Total productos:", items.length, ctx.width));
  lines.push("");
  lines.push(center("Cuente el fisico, anote en FISICO", ctx.width));
  lines.push(center("y registre la toma en el sistema.", ctx.width));
  lines.push("");
  lines.push(leftRight("Contado por:", "________________", ctx.width));
  lines.push(leftRight("Firma:", "________________", ctx.width));
  lines.push(ctx.sep2);
  lines.push(center("** SOLO PARA CONTROL INTERNO **", ctx.width));
  lines.push(footer(ctx.width, options.footer));
  return lines.join("\n");
}
function renderItemTable(lines, items, ctx, nameKey = "nombre", renderOperationalComments = true) {
  if (!items.length) return;
  lines.push(ctx.width >= 42 ? "CANT  PRODUCTO                V.UNI    TOTAL" : leftRight("CANT PRODUCTO", "TOTAL", ctx.width));
  lines.push(ctx.sep);
  for (const item of items) renderItem(lines, item, ctx, nameKey, renderOperationalComments);
  lines.push(ctx.sep);
}
function renderItem(lines, item, ctx, nameKey, renderOperationalComments) {
  const qty = num(item.cantidad) || 1;
  const name = text(item[nameKey] || item.plato || item.producto || item.plato_nombre);
  const unit = num(item.precio_unitario);
  const descAmount = num(item.descuento_monto);
  const descPct = num(item.descuento_porcentaje);
  const gross = unit * qty;
  const net = item.es_cortesia ? 0 : gross - descAmount;
  if (ctx.width >= 42) {
    lines.push(`${String(qty).padStart(3, " ")}  ${name.substring(0, 22).padEnd(22, " ")} ${rightPadMoney(formatMoney(unit), 8)} ${rightPadMoney(`$${formatMoney(net)}`, 8)}`);
  } else {
    lines.push(itemRow(qty, name, money(net), ctx.width));
  }
  if (item.es_cortesia) lines.push("      ** CORTESIA **");
  if (descAmount > 0) lines.push(`      ${descPct > 0 ? `Dcto -${descPct}% (-${money(descAmount)})` : `Dcto (-${money(descAmount)})`}`);
  renderReason2(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : void 0));
  if (renderOperationalComments && item.comentario && !item.es_cortesia && !item.motivo_descuento) {
    lines.push(`      > ${text(item.comentario)}`);
  }
}
function renderPayments2(lines, pagos, metodoPago, total, ctx) {
  if (pagos.length > 1) {
    lines.push(center("FORMAS DE PAGO (DIVIDIDO)", ctx.width));
    lines.push(ctx.sep);
    for (const pago of pagos) {
      const metodo = labelMetodo(pago.metodo || pago.metodo_pago);
      const monto = num(pago.monto);
      const propina = num(pago.propina);
      lines.push(`${metodo}:`);
      lines.push(leftRight("  Subtotal:", money(monto), ctx.width));
      if (propina > 0) lines.push(leftRight("  + Servicio:", money(propina), ctx.width));
      lines.push(leftRight("  Total metodo:", money(monto + propina), ctx.width));
      lines.push(ctx.sep);
    }
  } else if (pagos.length === 1) {
    const pago = pagos[0];
    lines.push(center("FORMA DE PAGO", ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(pago.metodo || pago.metodo_pago)}:`, money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight("  + Servicio:", money(pago.propina), ctx.width));
  } else if (metodoPago) {
    lines.push(center("FORMA DE PAGO", ctx.width));
    lines.push(ctx.sep);
    lines.push(leftRight(`${labelMetodo(metodoPago)}:`, money(total), ctx.width));
  }
}
function renderFacturaTurno(lines, factura, ctx) {
  const tipo = text(factura.tipo || "cerrada").toLowerCase();
  const numero = text(factura.numero_factura).padEnd(8, " ");
  if (tipo === "anulada") {
    lines.push(`${numero}  ANULADA ${money(factura.total).padStart(Math.max(10, ctx.width - 18), " ")}`);
    const nota = isRecord(factura.nota_credito) ? factura.nota_credito : void 0;
    if (nota?.numero) lines.push(`  >> Anulada por ${text(nota.numero)}`);
    if (nota?.motivo) lines.push(`     Motivo: ${text(nota.motivo)}`);
    if (!nota && factura.motivo_anulacion) lines.push(`  >> ${text(factura.motivo_anulacion)}`);
    return;
  }
  if (tipo === "nc") {
    lines.push(`[NA]      Nota de Ajuste ${money(factura.total).padStart(10, " ")}`);
    const nota = isRecord(factura.nota_credito) ? factura.nota_credito : void 0;
    if (nota?.numero) lines.push(`  >> ${text(nota.numero)}: ${text(nota.motivo || "ajuste")}`);
    return;
  }
  if (ctx.width >= 42) {
    const metodo = text(labelMetodo(factura.metodo_pago)).substring(0, 18).padEnd(18, " ");
    lines.push(`${numero}  ${metodo}  ${money(factura.total).padStart(14, " ")}`);
  } else {
    lines.push(`${numero} ${money(factura.total)}`);
    lines.push(`  ${labelMetodo(factura.metodo_pago)}`);
  }
  if (factura.factura_origen_nc) lines.push("  >> Refactura (origen NA)");
  for (const pago of arr(factura.pagos)) {
    const prop = num(pago.propina) > 0 ? ` +serv ${money(pago.propina)}` : "";
    lines.push(`          ${labelMetodo(pago.metodo)}: ${money(pago.monto)}${prop}`);
  }
}
function renderDiscountSummary(lines, data, ctx) {
  const totalDesc = num(data.total_descuentos);
  const totalCort = num(data.total_cortesias);
  if (totalDesc <= 0 && totalCort <= 0) return;
  lines.push(escBold(true) + "DESCUENTOS Y CORTESIAS" + escBold(false));
  lines.push(ctx.sep);
  if (num(data.total_descuentos_mesa) > 0) lines.push(leftRight("  Dcto Mesa:", `-${money(data.total_descuentos_mesa)}`, ctx.width));
  if (num(data.total_descuentos_items) > 0) lines.push(leftRight("  Dcto Items:", `-${money(data.total_descuentos_items)}`, ctx.width));
  if (totalCort > 0) lines.push(leftRight("  Cortesias:", `-${money(totalCort)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL DCTOS:", `-${money(totalDesc + totalCort)}`, ctx.width) + escBold(false));
  lines.push("");
}
function renderExpenseSummary(lines, gastos, ctx) {
  if (!gastos || num(gastos.total) <= 0) return;
  lines.push(escBold(true) + "EGRESOS DEL TURNO" + escBold(false));
  lines.push(ctx.sep);
  for (const metodo of arr(gastos.por_metodo)) {
    lines.push(leftRight(`  ${labelMetodo(metodo.metodo)}:`, `-${money(metodo.total)}`, ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL EGRESOS:", `-${money(gastos.total)}`, ctx.width) + escBold(false));
  lines.push("");
}
function renderCashIncomeSummary(lines, ingresosCaja, ctx) {
  if (!ingresosCaja || num(ingresosCaja.total_efectivo) <= 0) return;
  lines.push(escBold(true) + "INGRESOS DE CAJA" + escBold(false));
  lines.push(ctx.sep);
  for (const ingreso of arr(ingresosCaja.items)) {
    lines.push(leftRight(`  ${text(ingreso.concepto || "Ingreso").substring(0, 28)}:`, money(ingreso.monto), ctx.width));
  }
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("TOTAL INGRESOS:", money(ingresosCaja.total_efectivo), ctx.width) + escBold(false));
  lines.push("");
}
function renderCashSummary(lines, data, metodos, gastos, ingresosCaja, domicilios, ctx) {
  const efectivo = metodos.length ? metodos.find((m) => text(m.clave) === "efectivo") : void 0;
  const ventaEf = efectivo ? num(efectivo.venta) : num(data.total_efectivo);
  const servicioEf = efectivo ? num(efectivo.servicio) : num(data.propina_efectivo);
  const gastosEf = arr(gastos?.por_metodo).find((m) => text(m.metodo) === "efectivo");
  lines.push(ctx.sep2);
  lines.push(escBold(true) + "RESUMEN EFECTIVO" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Inicial:", money(data.efectivo_inicial), ctx.width));
  lines.push(leftRight("+ Ventas:", money(ventaEf), ctx.width));
  lines.push(leftRight("+ Propinas:", money(servicioEf), ctx.width));
  if (num(ingresosCaja?.total_efectivo) > 0) lines.push(leftRight("+ Ingresos caja:", money(ingresosCaja?.total_efectivo), ctx.width));
  if (num(gastosEf?.total) > 0) lines.push(leftRight("- Egresos:", `-${money(gastosEf?.total)}`, ctx.width));
  if (num(domicilios?.recaudado_efectivo) > 0) lines.push(leftRight("+ Domicilio:", money(domicilios?.recaudado_efectivo), ctx.width));
  if (num(domicilios?.liquidado_efectivo) > 0) lines.push(leftRight("- Liq. domicilio:", `-${money(domicilios?.liquidado_efectivo)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("Esperado:", money(data.efectivo_esperado), ctx.width) + escBold(false));
  lines.push(leftRight("Contado:", money(data.efectivo_contado), ctx.width));
  const diff = num(data.diferencia);
  lines.push(escBold(true) + leftRight("DIFERENCIA:", `${diff >= 0 ? "+" : "-"}${money(Math.abs(diff))} ${diff === 0 ? "OK" : diff > 0 ? "(sobrante)" : "(faltante)"}`, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  lines.push("");
}
function renderOrderSummary(lines, data, ctx) {
  lines.push(escBold(true) + "RESUMEN DE PEDIDOS" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos cobrados:", data.num_facturas_cerradas || data.num_facturas || 0, ctx.width));
  if (num(data.num_facturas_anuladas) > 0) lines.push(leftRight("Pedidos anulados:", data.num_facturas_anuladas, ctx.width));
  if (num(data.num_notas_credito) > 0) lines.push(leftRight("Notas de ajuste:", data.num_notas_credito, ctx.width));
  if (num(data.num_facturas_total) > 0) lines.push(leftRight("Total consecutivos:", data.num_facturas_total, ctx.width));
}
function renderDeliverySummary(lines, dom, ctx) {
  if (!dom || num(dom.total_recaudado) <= 0) return;
  lines.push(ctx.sep2);
  lines.push(escBold(true) + "DOMICILIOS" + escBold(false));
  lines.push(ctx.sep);
  lines.push(leftRight("Pedidos:", dom.num_pedidos || 0, ctx.width));
  lines.push(leftRight("Recaudado:", money(dom.total_recaudado), ctx.width));
  if (num(dom.total_liquidado) > 0) lines.push(leftRight("Liquidado:", `-${money(dom.total_liquidado)}`, ctx.width));
  lines.push(ctx.sep);
  lines.push(escBold(true) + leftRight("PENDIENTE:", money(dom.pendiente), ctx.width) + escBold(false));
  const liquidaciones = arr(dom.liquidaciones);
  if (liquidaciones.length) {
    lines.push("");
    for (const liq of liquidaciones) {
      lines.push(leftRight(`  ${text(liq.nombre)}`, money(liq.monto), ctx.width));
      lines.push(`  (${text(liq.metodo_salida)})`);
    }
  }
}
function header(data, title, ctx) {
  const lines = [];
  if (data.tenant_nombre) lines.push(center(text(data.tenant_nombre).toUpperCase(), ctx.width));
  if (data.nit) lines.push(center(`NIT: ${text(data.nit)}`, ctx.width));
  if (data.telefono) lines.push(center(`Tel: ${text(data.telefono)}`, ctx.width));
  if (data.direccion) lines.push(center(text(data.direccion), ctx.width));
  lines.push(ctx.sep2);
  lines.push(escBold(true) + center(title, ctx.width) + escBold(false));
  lines.push(ctx.sep2);
  return lines;
}
function renderReason2(lines, reason) {
  if (reason) lines.push(`      Motivo: ${text(reason)}`);
}
function renderCorrectionPayments(lines, pagos, ctx) {
  if (!pagos.length) {
    lines.push("    Sin pagos");
    return;
  }
  for (const pago of pagos) {
    const metodo = labelMetodo(pago.metodo_pago || pago.metodo);
    const total = num(pago.monto) + num(pago.propina);
    lines.push(leftRight(`    ${metodo}:`, money(total), ctx.width));
    if (num(pago.monto) > 0) lines.push(leftRight("      Base:", money(pago.monto), ctx.width));
    if (num(pago.propina) > 0) lines.push(leftRight("      Servicio:", money(pago.propina), ctx.width));
  }
}
function pushDateTime(lines, ctx) {
  if (ctx.width >= 42) {
    lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}        Hora: ${formatTime(ctx.now, ctx.timezone)}`);
    return;
  }
  lines.push(`Fecha: ${formatDate(ctx.now, ctx.timezone)}`);
  lines.push(`Hora:  ${formatTime(ctx.now, ctx.timezone)}`);
}
function context(options) {
  const width = clampColumns(options.columns);
  return {
    width,
    sep: "-".repeat(width),
    sep2: "=".repeat(width),
    now: options.now || /* @__PURE__ */ new Date(),
    timezone: options.timezone || "America/Bogota"
  };
}
function dateTime(value, ctx) {
  const date = value instanceof Date ? value : new Date(String(value || Date.now()));
  return `${formatDate(date, ctx.timezone)}, ${formatTime(date, ctx.timezone)}`;
}
function money(value) {
  return `$${formatMoney(value)}`;
}
function text(value) {
  return sanitizeText(value);
}
function num(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
function formatQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : String(Math.round(numeric * 100) / 100);
}
function numOrDefault(value, fallback) {
  if (value === void 0 || value === null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
function arr(value) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}
function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export {
  ESC,
  center,
  escBeep,
  escBold,
  escCashDrawerPulse,
  escCut,
  escFontSize,
  escLeftMargin,
  formatDate,
  formatMoney,
  formatTime,
  labelMetodo,
  leftRight,
  renderCierreCaja,
  renderComanda,
  renderComandaAnulacion,
  renderCorreccion,
  renderDatosCliente,
  renderFactura,
  renderFacturasTurno,
  renderGastosTurno,
  renderNotaCredito,
  renderPrecuenta,
  renderReporteVentas,
  renderTomaInventario,
  renderVentasPLU,
  sanitizeText,
  textToEscPosBytes
};
//# sourceMappingURL=index.mjs.map
