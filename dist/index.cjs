var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ESC: () => ESC,
  center: () => center,
  escBold: () => escBold,
  escFontSize: () => escFontSize,
  formatDate: () => formatDate,
  formatMoney: () => formatMoney,
  formatTime: () => formatTime,
  labelMetodo: () => labelMetodo,
  leftRight: () => leftRight,
  renderComanda: () => renderComanda,
  renderComandaAnulacion: () => renderComandaAnulacion,
  renderFactura: () => renderFactura,
  sanitizeText: () => sanitizeText,
  textToEscPosBytes: () => textToEscPosBytes
});
module.exports = __toCommonJS(index_exports);

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
function center(text, width = 48) {
  const safe = sanitizeText(text);
  if (safe.length >= width) return safe;
  return " ".repeat(Math.floor((width - safe.length) / 2)) + safe;
}
function leftRight(left, right, width = 48) {
  const safeLeft = sanitizeText(left);
  const safeRight = sanitizeText(right);
  const gap = width - safeLeft.length - safeRight.length;
  return safeLeft + " ".repeat(Math.max(gap, 1)) + safeRight;
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
function footer(width = 48, text = "Desarrollado por www.foodly.com.co") {
  return ["", center(text, width), "", "", "", "", ""].join("\n");
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
function textToEscPosBytes(text) {
  const bytes = [27, 64];
  for (const char of text || "") {
    const code = char.charCodeAt(0);
    if (code === 27 || code === 29 || code === 10 || code === 13) {
      bytes.push(code);
      continue;
    }
    const safe = sanitizeText(char);
    for (const safeChar of safe) {
      const safeCode = safeChar.charCodeAt(0);
      if (safeCode >= 32 && safeCode <= 126) bytes.push(safeCode);
    }
  }
  return new Uint8Array(bytes);
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
  lines.push(center(`COMANDA #${payload.comanda || ""} | ${sanitizeText(payload.area || "").toUpperCase()}`, width));
  lines.push(sep2);
  const mesaLabel = sanitizeText(String(payload.mesa_nombre || `Mesa: ${payload.mesa || ""}`).toUpperCase());
  lines.push(`${bold}${mesaLabel}${boldOff}   Mesero: ${sanitizeText(payload.mesero || "")}`);
  if (payload.comensales) lines.push(`Personas: ${payload.comensales}`);
  lines.push(`Fecha: ${formatDate(now, timezone)}   Hora: ${hora}`);
  lines.push(sep);
  lines.push("CANT  PRODUCTO");
  lines.push(sep);
  for (const item of payload.items || []) {
    const name = sanitizeText((item.nombre || item.producto || "").toUpperCase()).substring(0, Math.max(10, width - 6));
    const qty = String(item.cantidad || 1).padStart(3, " ");
    lines.push(bold + `${qty}  ${name}` + boldOff);
    if (item.comentario) lines.push(`      > ${sanitizeText(item.comentario)}`);
    lines.push("");
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
  lines.push(`Fecha: ${formatDate(now, timezone)}        Hora: ${formatTime(now, timezone)}`);
  lines.push(sanitizeText(factura.mesa_nombre || `Mesa: ${factura.mesa_numero || ""}`));
  lines.push(`Mesero: ${sanitizeText(factura.mesero || "")}`);
  lines.push(sep);
  renderItems(lines, factura.items || [], width, sep);
  renderTotals(lines, factura, width, sep2);
  renderPayments(lines, factura, width, sep);
  renderDelivery(lines, factura, width, sep);
  lines.push("");
  lines.push(center("** SOLO PARA CONTROL INTERNO **", width));
  lines.push(center("Gracias por su visita!", width));
  lines.push(footer(width, options.footer));
  return lines.join("\n");
}
function renderItems(lines, items, width, sep) {
  if (!items.length) return;
  if (width >= 42) lines.push("CANT  PRODUCTO                V.UNI    TOTAL");
  else lines.push("CANT  PRODUCTO");
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
  if (item.comentario && !item.motivo_descuento) lines.push(`      > ${sanitizeText(item.comentario)}`);
}
function renderNarrowItem(lines, item, width) {
  const qty = String(item.cantidad || 1).padStart(3, " ");
  const name = sanitizeText(item.nombre || item.plato || "").substring(0, Math.max(10, width - 6));
  const price = Number(item.precio_unitario) || 0;
  const qtyNum = Number(item.cantidad) || 1;
  const descAmount = Number(item.descuento_monto) || 0;
  const gross = price * qtyNum;
  const net = item.es_cortesia ? 0 : gross - descAmount;
  lines.push(`${qty}  ${name}`);
  lines.push(leftRight("      Total:", `$${formatMoney(net)}`, width));
  if (item.es_cortesia) lines.push("      ** CORTESIA **");
  if (descAmount > 0) lines.push(`      Dcto (-$${formatMoney(descAmount)})`);
  renderReason(lines, item.motivo_descuento || (item.es_cortesia ? item.comentario : void 0));
  if (item.comentario && !item.es_cortesia && !item.motivo_descuento) lines.push(`      > ${sanitizeText(item.comentario)}`);
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
function renderDelivery(lines, factura, width, sep) {
  if (!factura.entrega) return;
  const bold = escBold(true);
  const boldOff = escBold(false);
  lines.push("");
  lines.push(bold + center("DATOS DE ENTREGA", width) + boldOff);
  lines.push(sep);
  if (factura.entrega.nombre) lines.push(`Nombre:    ${sanitizeText(factura.entrega.nombre)}`);
  if (factura.entrega.telefono) lines.push(`Telefono:  ${sanitizeText(factura.entrega.telefono)}`);
  if (factura.entrega.barrio) lines.push(`Barrio:    ${sanitizeText(factura.entrega.barrio)}`);
  if (factura.entrega.direccion) lines.push(`Direccion: ${sanitizeText(factura.entrega.direccion)}`);
  lines.push(sep);
}
function renderReason(lines, reason, prefix = "      Motivo: ") {
  if (reason) lines.push(`${prefix}${sanitizeText(reason)}`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ESC,
  center,
  escBold,
  escFontSize,
  formatDate,
  formatMoney,
  formatTime,
  labelMetodo,
  leftRight,
  renderComanda,
  renderComandaAnulacion,
  renderFactura,
  sanitizeText,
  textToEscPosBytes
});
//# sourceMappingURL=index.cjs.map
