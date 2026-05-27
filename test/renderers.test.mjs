import assert from 'node:assert/strict';
import { renderComanda, renderFactura, textToEscPosBytes } from '../dist/index.mjs';

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
