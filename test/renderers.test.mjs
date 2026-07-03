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
