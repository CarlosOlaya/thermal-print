import assert from 'node:assert/strict';
import {
  renderCierreCaja,
  renderComanda,
  renderCorreccion,
  renderFactura,
  renderFacturasTurno,
  renderPrecuenta,
  renderTomaInventario,
  renderVentasPLU,
  escBeep,
  escBold,
  escCashDrawerPulse,
  escCut,
  textToEscPosBytes,
} from '../dist/index.mjs';

const now = new Date('2026-05-27T15:30:00Z');

const comanda = renderComanda({
  comanda: 12,
  mesa_nombre: 'Terraza 1',
  mesero: 'Niria',
  cliente_nombre: 'Alfredo Payares',
  localizador: 'A12',
  area: 'cocina',
  hora: '10:30 AM',
  items: [
    { nombre: 'Hamburguesa doble', cantidad: 2, comentario: 'Sin cebolla' },
  ],
}, { now, columns: 48 });

assert.match(comanda, /COMANDA #12/);
assert.match(comanda, /TERRAZA 1/);
assert.match(comanda, /Cliente: Alfredo Payares/);
assert.ok(comanda.includes(`${escBold(true)}Cliente: Alfredo Payares${escBold(false)}`));
assert.match(comanda, /Localizador: A12/);
assert.ok(comanda.includes(`${escBold(true)}Localizador: A12${escBold(false)}`));
assert.match(comanda, /HAMBURGUESA DOBLE/);
assert.match(comanda, /Sin cebolla/);

const comandaSinCliente = renderComanda({
  comanda: 13,
  mesa_nombre: 'Llevar 1',
  mesero: 'Niria',
  area: 'cocina',
  items: [{ nombre: 'Ajiaco', cantidad: 1 }],
}, { now, columns: 32 });

assert.doesNotMatch(comandaSinCliente, /Cliente:/);

// Comanda unificada: secciones por área en un solo ticket
const comandaUnificada = renderComanda({
  comanda: 14,
  mesa_nombre: 'Mesa 3',
  mesero: 'Niria',
  secciones: [
    { area: 'cocina', items: [{ nombre: 'Burger', cantidad: 2 }] },
    { area: 'bar', items: [{ nombre: 'Cerveza', cantidad: 3, comentario: 'Bien fria' }] },
  ],
}, { now, columns: 48 });

assert.match(comandaUnificada, /COMANDA #14/);
assert.doesNotMatch(comandaUnificada, /COMANDA #14 \|/); // sin área en el título
assert.match(comandaUnificada, /\* COCINA \*/);
assert.match(comandaUnificada, /\* BAR \*/);
assert.match(comandaUnificada, /BURGER/);
assert.match(comandaUnificada, /CERVEZA/);
assert.match(comandaUnificada, /Bien fria/);

// Sin secciones → fallback a items planos (comportamiento por área)
const comandaFlat = renderComanda({
  comanda: 15, mesa_nombre: 'Mesa 9', mesero: 'Niria', area: 'cocina',
  items: [{ nombre: 'Ajiaco', cantidad: 1 }],
}, { now, columns: 48 });
assert.match(comandaFlat, /COMANDA #15 \| COCINA/);
assert.match(comandaFlat, /CANT  PRODUCTO/);

const factura = renderFactura({
  tenant_nombre: 'Crokanza',
  nit: '64676604-3',
  numero_factura: 'PED-00012',
  mesa_nombre: 'Mesa 4',
  mesero: 'Niria',
  items: [
    { plato: 'Combo doble', cantidad: 1, precio_unitario: 25000, comentario: 'Sin cebolla' },
    { plato: 'Gaseosa', cantidad: 1, precio_unitario: 5000, descuento_monto: 1000, motivo_descuento: 'Promo' },
    { plato: 'Postre', cantidad: 1, precio_unitario: 6000, es_cortesia: true, comentario: 'Cumpleanos' },
  ],
  subtotal: 29000,
  descuento_monto: 2000,
  motivo_descuento_mesa: 'Cliente frecuente',
  propina: 3000,
  total: 32000,
  metodo_pago: 'nequi',
  pagos: [{ metodo: 'nequi', monto: 29000, propina: 3000 }],
  recaudo_domicilio_monto: 4000,
  total_cliente: 36000,
}, { now, columns: 48 });

assert.match(factura, /CROKANZA/);
assert.match(factura, /DESC. MESA/);
assert.match(factura, /Cliente frecuente/);
assert.match(factura, /\*\* CORTESIA \*\*/);
assert.match(factura, /Cumpleanos/);
assert.match(factura, /Promo/);
assert.doesNotMatch(factura, /Sin cebolla/);
assert.match(factura, /DOMICILIO/);
assert.match(factura, /Nequi/);
assert.doesNotMatch(factura, /DATOS DE ENTREGA/);

const bytes = textToEscPosBytes(factura);
assert.ok(bytes instanceof Uint8Array);
assert.equal(bytes[0], 0x1b);
assert.equal(bytes[1], 0x40);
assert.deepEqual(Array.from(textToEscPosBytes(escBold(true)).slice(2)), [0x1b, 0x45, 0x01]);
assert.deepEqual(Array.from(textToEscPosBytes(escBold(false)).slice(2)), [0x1b, 0x45, 0x00]);
assert.deepEqual(Array.from(textToEscPosBytes('X', { openCashDrawer: true }).slice(2, 7)), Array.from(escCashDrawerPulse()).map(char => char.charCodeAt(0)));
assert.deepEqual(Array.from(textToEscPosBytes('X', { cut: true }).slice(-3)), Array.from(escCut()).map(char => char.charCodeAt(0)));
assert.deepEqual(Array.from(textToEscPosBytes('X', { beepAfterPrint: true }).slice(-4)), Array.from(escBeep()).map(char => char.charCodeAt(0)));
assert.notDeepEqual(Array.from(textToEscPosBytes('X').slice(2, 7)), Array.from(escCashDrawerPulse()).map(char => char.charCodeAt(0)));

const precuenta = renderPrecuenta({
  tenant_nombre: 'Crokanza',
  mesa_nombre: 'Mesa 4',
  mesero: 'Niria',
  items: [
    { nombre: 'Combo doble', cantidad: 1, precio_unitario: 25000, comentario: 'Sin cebolla' },
    { nombre: 'Gaseosa', cantidad: 1, precio_unitario: 5000, descuento_monto: 1000, motivo_descuento: 'Promo' },
    { nombre: 'Postre', cantidad: 1, precio_unitario: 6000, es_cortesia: true, comentario: 'Cumpleanos' },
  ],
  subtotal: 25000,
  total: 25000,
  propina_sugerida: 2500,
}, { now, columns: 32 });

assert.match(precuenta, /VERIFICACION DE PEDIDO/);
assert.match(precuenta, /Mesa 4/);
assert.match(precuenta, /SERVICIO SUGERIDO \(10%\):/);
assert.match(precuenta, /\*\* CORTESIA \*\*/);
assert.match(precuenta, /Cumpleanos/);
assert.match(precuenta, /Promo/);
assert.doesNotMatch(precuenta, /Sin cebolla/);

const precuentaSinServicioSugerido = renderPrecuenta({
  tenant_nombre: 'Crokanza',
  mesa_nombre: 'Mesa 7',
  mesero: 'Niria',
  items: [
    { nombre: 'Jugo natural', cantidad: 1, precio_unitario: 7600 },
    { nombre: 'Hatsu soda', cantidad: 1, precio_unitario: 6000 },
    { nombre: 'Punta de anca', cantidad: 1, precio_unitario: 46900 },
  ],
  subtotal: 60400,
  total: 60400,
  propina_sugerida: 0,
  porcentaje_propina_sugerida: 0,
}, { now, columns: 32 });

assert.doesNotMatch(precuentaSinServicioSugerido, /SERVICIO SUGERIDO/);
assert.doesNotMatch(precuentaSinServicioSugerido, /TOTAL \+ SERVICIO/);
assert.match(precuentaSinServicioSugerido, /TOTAL A PAGAR:\s+\$60\.400/);

const precuentaDomicilio = renderPrecuenta({
  mesa_nombre: 'Domicilio 1',
  subtotal: 25000,
  total: 25000,
  recaudo_domicilio_monto: 4000,
  cliente: { nombre: 'Alfredo', direccion: 'Calle 1' },
}, { now, columns: 48 });

assert.match(precuentaDomicilio, /\x1D\x56\x00/);
assert.match(precuentaDomicilio, /DATOS PARA ENTREGA/);

const cierre = renderCierreCaja({
  cajero: 'Niria',
  total_ventas: 144000,
  total_propinas: 5500,
  metodos_desglose: [
    { clave: 'efectivo', venta: 29900, servicio: 2100 },
    { clave: 'nequi', venta: 30000, servicio: 3000 },
    { clave: 'daviplata', venta: 4000, servicio: 400 },
  ],
  efectivo_inicial: 0,
  efectivo_esperado: 24000,
  efectivo_contado: 24000,
  diferencia: 0,
  domicilios: {
    total_recaudado: 7000,
    recaudado_efectivo: 7000,
    total_liquidado: 7000,
    liquidado_efectivo: 7000,
    pendiente: 0,
    num_pedidos: 1,
  },
}, { now, columns: 48 });

assert.match(cierre, /Nequi/);
assert.match(cierre, /Daviplata/);
assert.match(cierre, /DOMICILIOS/);
assert.match(cierre, /Liq. domicilio/);

const facturasTurno = renderFacturasTurno({
  cajero: 'Niria',
  facturas: [{ numero_factura: 'PED-00001', metodo_pago: 'transferencia', total: 67000 }],
  total_ventas: 67000,
  total_propinas: 0,
}, { now, columns: 48 });

assert.match(facturasTurno, /PEDIDOS DEL TURNO/);
assert.match(facturasTurno, /Transferencia/);

const plu = renderVentasPLU({
  productos: [{ nombre: 'Combo doble', cantidad: 2, valor: 50000 }],
  total_items: 2,
  total_productos: 50000,
}, { now, columns: 32 });

assert.match(plu, /VENTAS POR PRODUCTO/);
assert.match(plu, /Combo doble/);

const correccion = renderCorreccion({
  numero_factura: 'PED-00005',
  motivo: 'Propina asignada al metodo correcto',
  cambios: [{
    campo: 'pagos',
    anterior: [{ metodo_pago: 'efectivo', monto: 30000, propina: 3000 }],
    nuevo: [{ metodo_pago: 'nequi', monto: 30000, propina: 3000 }],
  }],
}, { now, columns: 32 });

assert.match(correccion, /Pagos anteriores/);
assert.match(correccion, /Servicio/);
assert.match(correccion, /Nequi/);

const tomaInventario = renderTomaInventario({
  tenant_nombre: 'Crokanza',
  bodega: 'Principal',
  generado_por: 'Niria',
  items: [
    { nombre: 'Papas francesas', stock_actual: 12.5, unidad: 'kg' },
    { producto: 'Gaseosa personal', existencia: 8, unidad_medida: 'u' },
  ],
}, { now, columns: 48 });

assert.match(tomaInventario, /TOMA DE INVENTARIO/);
assert.match(tomaInventario, /Bodega:\s+Principal/);
assert.match(tomaInventario, /Papas francesas/);
assert.match(tomaInventario, /12.5 kg/);
assert.match(tomaInventario, /Total productos:\s+2/);

const tomaInventarioCiega = renderTomaInventario({
  tenant_nombre: 'Crokanza',
  modo_ciego: true,
  items: [{ nombre: 'Tomate', stock_actual: 3, unidad: 'kg' }],
}, { now, columns: 32 });

assert.match(tomaInventarioCiega, /TOMA DE INVENTARIO/);
// Modo ciego + una sola fila: el producto sale con las columnas SIST/FISICO en blanco.
assert.match(tomaInventarioCiega, /Tomate\s+_{4,}/);
assert.doesNotMatch(tomaInventarioCiega, /3 kg/);

// ── Tirilla fiscal (documento electrónico DIAN): número, CUFE/CUDE y QR nativo ──
const feTicket = {
  tipo_label: 'DOCUMENTO EQUIVALENTE POS',
  numero: 'EPOS855848',
  es_cufe: false,
  cufe: '7b7f54d01d1dda9fef5f783f114cd2745c3e451844df2d37ed701eed3640a0457c9afeda2c609863a1cb2f2f3e0a2fc1',
  resolucion: 'Res 18760000001',
  adquirente: 'Carlos Olaya - NIT 1075317251-8',
  qr: 'NumFac: EPOS855848\nQRCode: https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=abc',
  url: 'https://catalogo-vpfe-hab.dian.gov.co/document/searchqr?documentkey=abc',
};
for (const w of [32, 48]) {
  const fiscal = renderFactura({
    tenant_nombre: 'Restaurante Prueba', nit: '900559088-2', numero_factura: 'PED-00064',
    items: [{ cantidad: 1, nombre: 'Alitas', precio_unitario: 27900 }],
    subtotal: 27900, total: 27900, metodo_pago: 'efectivo', fe: feTicket,
  }, { now, columns: w });
  assert.match(fiscal, /DOCUMENTO EQUIVALENTE POS/);
  assert.match(fiscal, /EPOS855848/);
  assert.match(fiscal, /CUDE:/);
  assert.match(fiscal, /Carlos Olaya - NIT 1075317251-8/);
  // El CUFE de 96 chars quedó ENVUELTO en fragmentos que caben en el ancho
  const fragmentosCufe = fiscal.split('\n').filter(l => /^[0-9a-f]{8,}$/.test(l.trim()));
  assert.ok(fragmentosCufe.length >= 2, `CUFE no se envolvió en ${w} col`);
  for (const frag of fragmentosCufe) assert.ok(frag.trim().length <= w, `fragmento CUFE excede ${w}`);
  // El QR NATIVO aparece como comando GS ( k en los bytes
  const bytes = textToEscPosBytes(fiscal, { cut: true });
  let hasQr = false;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x1d && bytes[i + 1] === 0x28 && bytes[i + 2] === 0x6b) { hasQr = true; break; }
  }
  assert.ok(hasQr, `QR nativo ausente en ${w} col`);
}

// ── Impuesto discriminado (INC/IVA) ────────────────────────────────────────
// El precio de carta YA lo incluye (Art. 512-9 ET): la tirilla lo SEPARA, no
// lo suma. El total tiene que quedar igualito al que pagó el comensal.
for (const w of [32, 48]) {
  const conInc = renderFactura({
    tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00065',
    items: [{ cantidad: 1, nombre: 'Alitas', precio_unitario: 27900 }],
    subtotal: 27900, total: 27900, metodo_pago: 'efectivo',
    fe: { ...feTicket, impuesto: { label: 'IMPOCONSUMO', tarifa: 8, base: 25833.33, monto: 2066.67 } },
  }, { now, columns: w });
  assert.match(conInc, /BASE GRAVABLE:/, `base ausente en ${w} col`);
  assert.match(conInc, /IMPOCONSUMO 8%:/, `INC ausente en ${w} col`);
  // Lo único que no puede moverse: el total sigue siendo el del POS
  assert.match(conInc, /TOTAL PEDIDO:\s+\$ ?27\.900/, `total alterado en ${w} col`);
}

// IVA 19% usa la misma ruta, solo cambia la etiqueta
const conIva = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00066',
  items: [{ cantidad: 1, nombre: 'Alitas', precio_unitario: 27900 }],
  subtotal: 27900, total: 27900, metodo_pago: 'efectivo',
  fe: { ...feTicket, impuesto: { label: 'IVA', tarifa: 19, base: 23445.38, monto: 4454.62 } },
}, { now, columns: 48 });
assert.match(conIva, /IVA 19%:/);
assert.doesNotMatch(conIva, /IMPOCONSUMO/);

// ── Documento del cliente (trazabilidad, con o sin FE) ─────────────────────
const conDocumento = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00068',
  cliente: 'Empresa ACME SAS', cliente_documento: '900123456', cliente_tipo_documento: '31',
  items: [{ cantidad: 1, nombre: 'Alitas', precio_unitario: 27900 }],
  subtotal: 27900, total: 27900, metodo_pago: 'efectivo',
}, { now, columns: 32 });
assert.match(conDocumento, /Cliente: Empresa ACME SAS/);
assert.match(conDocumento, /NIT: 900123456/);

const conCedula = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00069',
  cliente: 'Ana Perez', cliente_documento: '1020304050', cliente_tipo_documento: '13',
  items: [], subtotal: 0, total: 0, metodo_pago: 'efectivo',
}, { now, columns: 32 });
assert.match(conCedula, /CC: 1020304050/);

// Sin documento no se inventa la línea
const sinDocumento = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00070',
  cliente: 'Pedro', items: [], subtotal: 0, total: 0, metodo_pago: 'efectivo',
}, { now, columns: 32 });
assert.doesNotMatch(sinDocumento, /CC:|NIT:|Doc:/);

// Sin impuesto configurado: la tirilla no inventa líneas
const feSinImpuesto = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00067',
  items: [{ cantidad: 1, nombre: 'Alitas', precio_unitario: 27900 }],
  subtotal: 27900, total: 27900, metodo_pago: 'efectivo', fe: feTicket,
}, { now, columns: 48 });
assert.doesNotMatch(feSinImpuesto, /BASE GRAVABLE|IMPOCONSUMO/);

// Sin `fe`: la tirilla sigue siendo de control interno (retrocompatible)
const noFiscal = renderFactura({
  tenant_nombre: 'Restaurante', numero_factura: 'PED-1', items: [], total: 0,
}, { now, columns: 48 });
assert.match(noFiscal, /SOLO PARA CONTROL INTERNO/);
assert.doesNotMatch(noFiscal, /CUDE:|CUFE:/);

console.log('OK — tirilla fiscal DIAN (QR + CUFE + impuesto discriminado, 58mm y 80mm)');
