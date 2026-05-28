import assert from 'node:assert/strict';
import {
  renderCierreCaja,
  renderComanda,
  renderFactura,
  renderFacturasTurno,
  renderPrecuenta,
  renderVentasPLU,
  textToEscPosBytes,
} from '../dist/index.mjs';

const now = new Date('2026-05-27T15:30:00Z');

const comanda = renderComanda({
  comanda: 12,
  mesa_nombre: 'Terraza 1',
  mesero: 'Niria',
  area: 'cocina',
  hora: '10:30 AM',
  items: [
    { nombre: 'Hamburguesa doble', cantidad: 2, comentario: 'Sin cebolla' },
  ],
}, { now, columns: 48 });

assert.match(comanda, /COMANDA #12/);
assert.match(comanda, /TERRAZA 1/);
assert.match(comanda, /HAMBURGUESA DOBLE/);
assert.match(comanda, /Sin cebolla/);

const factura = renderFactura({
  tenant_nombre: 'Crokanza',
  nit: '64676604-3',
  numero_factura: 'PED-00012',
  mesa_nombre: 'Mesa 4',
  mesero: 'Niria',
  items: [
    { plato: 'Combo doble', cantidad: 1, precio_unitario: 25000 },
    { plato: 'Gaseosa', cantidad: 1, precio_unitario: 5000, descuento_monto: 1000, motivo_descuento: 'Promo' },
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
assert.match(factura, /DOMICILIO/);
assert.match(factura, /Nequi/);

const bytes = textToEscPosBytes(factura);
assert.ok(bytes instanceof Uint8Array);
assert.equal(bytes[0], 0x1b);
assert.equal(bytes[1], 0x40);

const precuenta = renderPrecuenta({
  tenant_nombre: 'Crokanza',
  mesa_nombre: 'Mesa 4',
  mesero: 'Niria',
  items: [{ nombre: 'Combo doble', cantidad: 1, precio_unitario: 25000 }],
  subtotal: 25000,
  total: 25000,
  propina_sugerida: 2500,
}, { now, columns: 32 });

assert.match(precuenta, /VERIFICACION DE PEDIDO/);
assert.match(precuenta, /Mesa 4/);

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
