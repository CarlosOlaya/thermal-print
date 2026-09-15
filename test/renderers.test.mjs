import assert from 'node:assert/strict';
import {
  renderCierreCaja,
  renderComanda,
  renderCorreccion,
  renderFactura,
  renderFacturasTurno,
  renderPrecuenta,
  renderReservasDia,
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

// ── Agenda de reservas del día (hoja para reubicar mesas) ──────────────────
const reservasPayload = {
  tenant_nombre: 'Crokanza',
  fecha: '2026-08-01',
  generado_por: 'Niria',
  reservas: [
    {
      hora: '19:30:00', nombre_cliente: 'Carlos Olaya', personas: 4,
      mesa: 'Terraza 2', zona_preferida: 'Terraza junto a la ventana principal',
      motivo: 'Cumpleaños',
      notas: 'Traer la torta cuando terminen el plato fuerte, por favor',
    },
    { hora: '08:00', nombre_cliente: 'Ana Maria Restrepo Villegas', personas: 2 },
  ],
};

for (const w of [32, 48]) {
  const agenda = renderReservasDia(reservasPayload, { now, columns: w });
  const lineas = agenda.split('\n');

  assert.match(agenda, /RESERVAS DEL DIA/);
  assert.match(agenda, /Sabado 1 de agosto/);
  assert.match(agenda, /CARLOS OLAYA/);
  assert.match(agenda, / 7:30 PM/, `hora vespertina en 12h (${w} col)`);
  assert.match(agenda, / 8:00 AM/, `hora matutina en 12h (${w} col)`);
  assert.match(agenda, /4 pers/);
  assert.match(agenda, /Zona preferida: Terraza\s+junto a la ventana\s+principal/);
  assert.match(agenda, /Mesa asignada: Terraza 2/);
  assert.match(agenda, /Motivo: Cumpleanos/);
  assert.match(agenda, /Traer la torta/);
  // Sin mesa asignada ⇒ raya en blanco para anotarla a mano.
  assert.match(agenda, /Mesa asignada:\s+_{10,}/, `raya de mesa ausente (${w} col)`);
  assert.match(agenda, /Total reservas:\s+2/);
  assert.match(agenda, /Total personas:\s+6/);

  // El cuerpo de la agenda no se sale del papel: si se saliera, la impresora
  // partiría las líneas a su antojo y el bloque de cada reserva dejaría de leerse.
  const cuerpoDesde = lineas.findIndex((l) => l.startsWith('Impreso:'));
  const cuerpoHasta = lineas.findIndex((l) => l.startsWith('Total personas:'));
  for (const linea of lineas.slice(cuerpoDesde, cuerpoHasta + 1)) {
    const limpia = linea.split(escBold(true)).join('').split(escBold(false)).join('');
    assert.ok(limpia.length <= w, `linea de ${limpia.length} > ${w} col: "${limpia}"`);
  }

  // Las notas largas se envuelven por palabras: el texto debe quedar completo.
  const desde = lineas.findIndex((l) => l.includes('Notas:'));
  const hasta = lineas.findIndex((l, i) => i > desde && l.startsWith('-'));
  const notas = lineas.slice(desde, hasta).join(' ').replace(/\s+/g, ' ').trim();
  assert.equal(notas, `Notas: ${reservasPayload.reservas[0].notas}`, `notas partidas en ${w} col`);
}

const agendaVacia = renderReservasDia({ tenant_nombre: 'Crokanza', fecha: '2026-08-01' }, { now, columns: 32 });
assert.match(agendaVacia, /Sin reservas para este dia/);
assert.doesNotMatch(agendaVacia, /Total reservas:/);

console.log('OK — agenda de reservas (32/48 col, zona preferida y mesa asignada separadas)');

// ── Tirilla fiscal (documento electrónico DIAN): número, CUFE/CUDE y QR nativo ──
const feTicket = {
  tipo_label: 'DOCUMENTO EQUIVALENTE POS',
  numero: 'EPOS855848',
  es_cufe: false,
  cufe: '7b7f54d01d1dda9fef5f783f114cd2745c3e451844df2d37ed701eed3640a0457c9afeda2c609863a1cb2f2f3e0a2fc1',
  resolucion: 'Res 18760000001',
  adquirente: 'Carlos Olaya - NIT 1075317251-8',
  fecha_expedicion: '16/07/2026 11:48',
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
  assert.doesNotMatch(
    fiscal,
    /^ *PED-00064 *$/m,
    `referencia interna PED impresa en tirilla fiscal (${w} col)`,
  );
  assert.match(
    fiscal,
    /^ *EPOS855848 *$/m,
    `numero DIAN ausente en tirilla fiscal (${w} col)`,
  );
  assert.match(fiscal, /CUDE:/);
  assert.match(fiscal, /Carlos Olaya - NIT 1075317251-8/);
  assert.match(fiscal, /Expedicion: 16\/07\/2026 11:48/);
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

// Con FE no se duplica el mismo cliente ni el pie de marca cuando el bloque
// fiscal ya contiene adquirente e identificacion legal del software.
const fiscalSinDuplicados = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00071',
  cliente: 'Carlos Olaya', cliente_documento: '1075317251-8', cliente_tipo_documento: '13',
  items: [], subtotal: 0, total: 0, metodo_pago: 'efectivo',
  fe: {
    ...feTicket,
    software: 'Software: Foodly - Fabricante: Foodly NIT 1075317251-8',
  },
}, { now, columns: 32 });
assert.doesNotMatch(fiscalSinDuplicados, /Cliente: Carlos Olaya/);
assert.doesNotMatch(fiscalSinDuplicados, /CC: 1075317251-8/);
assert.doesNotMatch(fiscalSinDuplicados, /Desarrollado por/);

// El cliente operativo se conserva cuando no coincide con el adquirente DIAN.
const fiscalClienteDiferente = renderFactura({
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00072',
  cliente: 'Ana Perez', cliente_documento: '1020304050', cliente_tipo_documento: '13',
  items: [], subtotal: 0, total: 0, metodo_pago: 'efectivo',
  fe: {
    ...feTicket,
    software: 'Software: Foodly - Fabricante: Foodly NIT 1075317251-8',
  },
}, { now, columns: 48 });
assert.match(fiscalClienteDiferente, /Cliente: Ana Perez/);
assert.match(fiscalClienteDiferente, /CC: 1020304050/);

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
for (const w of [32, 48]) {
  const noFiscal = renderFactura({
    tenant_nombre: 'Restaurante', numero_factura: 'PED-1', items: [], total: 0,
  }, { now, columns: w });
  assert.match(
    noFiscal,
    /^ *PED-1 *$/m,
    `identificador operativo ausente sin FE (${w} col)`,
  );
  assert.match(noFiscal, /SOLO PARA CONTROL INTERNO/);
  assert.match(noFiscal, /Desarrollado por/);
  assert.doesNotMatch(noFiscal, /CUDE:|CUFE:/);
}

// ── Denominación legal larga (art. 19 num. 1 Res. 000165/2023) ─────────────
// Son 86 caracteres: no cabe ni en 80mm. Debe envolverse por PALABRAS y quedar
// reconstruible letra por letra — si la impresora la parte a su antojo, el
// documento queda mal denominado.
const DENOMINACION_POS =
  'DOCUMENTO EQUIVALENTE ELECTRONICO TIQUETE DE MAQUINA REGISTRADORA CON SISTEMA P.O.S.';
for (const w of [32, 48]) {
  const largo = renderFactura({
    tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00073',
    items: [], subtotal: 0, total: 0, metodo_pago: 'efectivo',
    fe: { ...feTicket, tipo_label: DENOMINACION_POS },
  }, { now, columns: w });

  const lineas = largo.split('\n').map((l) => l.trim());
  const desde = lineas.findIndex((l) => l.startsWith('DOCUMENTO EQUIVALENTE'));
  const hasta = lineas.findIndex((l) => l.includes('EPOS855848'));
  assert.ok(desde >= 0 && hasta > desde, `denominación ausente en ${w} col`);
  const reconstruida = lineas.slice(desde, hasta).join(' ').replace(/\s+/g, ' ').trim();
  assert.equal(reconstruida, DENOMINACION_POS, `denominación partida en ${w} col`);
  for (const l of lineas.slice(desde, hasta)) {
    assert.ok(l.length <= w, `línea de ${l.length} > ${w} col: "${l}"`);
  }
}

// ── Requisitos mínimos de la tirilla fiscal (art. 35 par. 1 Res. 000165/2023) ──
// Réplica de FELA5 (La Alejandría): el nombre en Foodly es el comercial, la
// razón social es otra, dos líneas con descuento y una cortesía.
const feRequisitos = {
  ...feTicket,
  tipo_label: 'FACTURA ELECTRONICA DE VENTA',
  numero: 'FELA5',
  es_cufe: true,
  software: 'Proveedor tecnologico: Soluciones Alegra S.A.S - Software: Alegra - NIT 900.559.088-2',
  emisor: { razon_social: 'SILGADO VILORIA ELKIN DAVID', nit: '1104869101-4' },
  fecha_generacion: '2026-07-16T16:48:00Z',
  forma_pago: 'CONTADO',
  responsabilidades: ['Régimen simple de tributación - SIMPLE'],
};
const itemsFela5 = [
  { cantidad: 6, nombre: 'Colombia 454 Gramos', precio_unitario: 38500, descuento_porcentaje: 14, descuento_monto: 33000, codigo: '124ef936', unidad: 'UND' },
  { cantidad: 5, nombre: 'Bolsa Para Maquila 500 Gr', precio_unitario: 2000, descuento_porcentaje: 100, descuento_monto: 10000, es_cortesia: true, codigo: '03b9bcc9', unidad: 'UND' },
  { cantidad: 7, nombre: 'Gesha 250 Gramos', precio_unitario: 45000, descuento_porcentaje: 22, descuento_monto: 70000, codigo: '5b35eb70', unidad: 'UND' },
];
const sinNegrilla = (texto) => texto.split(escBold(true)).join('').split(escBold(false)).join('');
for (const w of [32, 48]) {
  const t = renderFactura({
    tenant_nombre: 'Coffee Lab La Alejandría', nit: '1104869101', numero_factura: 'PED-00004',
    items: itemsFela5, subtotal: 443000, total: 443000,
    pagos: [{ metodo: 'efectivo', monto: 443000, propina: 0 }], fe: feRequisitos,
  }, { now, columns: w });

  // Num. 16: con el QR impreso la URL ya no va en texto (vive dentro del QR)
  assert.doesNotMatch(t, /Verifica en la DIAN/, `URL impresa junto al QR (${w} col)`);
  // Num. 2: marca comercial + razón social + NIT con DV
  assert.match(t, /COFFEE LAB LA ALEJANDRIA/, `marca ausente (${w} col)`);
  assert.match(t, /SILGADO VILORIA ELKIN DAVID/, `razon social ausente (${w} col)`);
  assert.match(t, /NIT: 1104869101-4/, `NIT con DV ausente (${w} col)`);
  // Num. 12: calidad tributaria declarada
  // En 58mm la calidad tributaria ocupa dos renglones: se valida sobre el texto corrido
  const corrido = t.split('\n').map((l) => l.trim()).join(' ');
  assert.match(corrido, /Regimen simple de tributacion - SIMPLE/, `regimen SIMPLE ausente (${w} col)`);
  // Num. 5: fecha de GENERACIÓN, no la de impresión (now = 27/05/2026)
  assert.match(t, /16\/0?7\/2026/, `fecha de generacion ausente (${w} col)`);
  assert.doesNotMatch(t, /27\/0?5\/2026/, `imprimio la hora de impresion (${w} col)`);
  // Num. 8: número de línea, código, unidad y total de líneas
  assert.match(t, /Cod 124ef936 UND/, `codigo de linea ausente (${w} col)`);
  assert.match(t, /Cod 03b9bcc9 UND/, `codigo de la cortesia ausente (${w} col)`);
  assert.match(t, /\*\* CORTESIA \*\*/);
  assert.match(t, /^Total items: 3$/m, `total de lineas ausente (${w} col)`);
  assert.match(t, /^ 3 /m, `numero de linea ausente (${w} col)`);
  // Num. 10: la forma de pago en el título, sin renglón extra
  assert.match(t, /FORMA DE PAGO: CONTADO/, `forma de pago ausente (${w} col)`);

  // Ninguna línea del encabezado ni del detalle más ancha que el rollo
  const lineas = sinNegrilla(t).split('\n');
  const finDetalle = lineas.findIndex((l) => l.startsWith('Total items:'));
  for (const l of lineas.slice(0, finDetalle + 1)) {
    assert.ok(l.length <= w, `linea de ${l.length} > ${w} col: "${l}"`);
  }
}

// Sin QR la URL sigue saliendo: la tirilla nunca pierde el numeral 16
const fiscalSinQr = renderFactura({
  tenant_nombre: 'Restaurante', items: [], total: 0, fe: { ...feRequisitos, qr: undefined },
}, { now, columns: 32 });
assert.match(fiscalSinQr, /Verifica en la DIAN:/);

// La marca no se repite cuando ya es la razón social
const mismoNombre = renderFactura({
  tenant_nombre: 'VELEZ HOYOS JULIAN DAVID', items: [], total: 0,
  fe: { ...feRequisitos, emisor: { razon_social: 'Velez Hoyos Julian David', nit: '1100335229-1' } },
}, { now, columns: 48 });
assert.equal((mismoNombre.match(/VELEZ HOYOS JULIAN DAVID/g) || []).length, 1);

// Sin documento electrónico la tirilla de control interno no cambia
const interno = renderFactura({
  tenant_nombre: 'Restaurante', numero_factura: 'PED-9', items: itemsFela5, total: 443000,
  pagos: [{ metodo: 'efectivo', monto: 443000, propina: 0 }],
}, { now, columns: 48 });
assert.match(interno, /CANT  PRODUCTO/);
assert.match(interno, /FORMAS DE PAGO/);
assert.doesNotMatch(interno, /Cod 124ef936|Total items|FORMA DE PAGO:/);

// Entre el QR y el bloque del software queda UN renglón en blanco, no dos
{
  const t = renderFactura({ tenant_nombre: 'Restaurante', items: [], total: 0, fe: feRequisitos }, { now, columns: 48 });
  const lineas = t.split('\n');
  const finQr = lineas.map((l, i) => (l.includes('\x1E') ? i : -1)).filter((i) => i >= 0).pop();
  assert.equal(lineas[finQr + 1], '', 'falta el renglon en blanco despues del QR');
  assert.match(lineas[finQr + 2], /Proveedor tecnologico/, 'doble renglon en blanco entre el QR y el software');
}
console.log('OK — requisitos minimos de la tirilla fiscal (num. 2, 5, 8, 10, 12 y 16)');

console.log('OK — tirilla fiscal DIAN (QR + CUFE + impuesto discriminado, 58mm y 80mm)');
console.log('OK — denominación legal larga envuelta por palabras (32 y 48 col)');

// ── Apoyo de vueltas: efectivo recibido y cambio ───────────────────────────
// El comensal ve en su tirilla cuánto entregó y cuánto le devuelven. Va después
// de las formas de pago (es un dato del efectivo, no del pedido) y antes del
// bloque fiscal o del aviso de control interno, que cierran la tirilla.
const pedidoEfectivo = {
  tenant_nombre: 'Restaurante Prueba', numero_factura: 'PED-00080',
  items: [{ cantidad: 1, nombre: 'Bandeja paisa', precio_unitario: 38000 }],
  subtotal: 38000, propina: 3800, total: 41800, metodo_pago: 'efectivo',
  pagos: [{ metodo: 'efectivo', monto: 38000, propina: 3800 }],
};
for (const w of [32, 48]) {
  const conCambio = renderFactura({ ...pedidoEfectivo, efectivo_recibido: 50000, cambio: 8200 }, { now, columns: w });
  const lineas = conCambio.split('\n');
  const recibido = lineas.findIndex((l) => /^EFECTIVO RECIBIDO: +\$50\.000$/.test(l));
  const cambio = lineas.findIndex((l) => /^CAMBIO: +\$8\.200$/.test(l));
  assert.ok(recibido >= 0, `efectivo recibido ausente (${w} col)`);
  assert.equal(cambio, recibido + 1, `el cambio va justo debajo de lo recibido (${w} col)`);
  assert.ok(recibido > lineas.findIndex((l) => l.includes('FORMAS DE PAGO')), `recibido antes de las formas de pago (${w} col)`);
  assert.ok(cambio < lineas.findIndex((l) => l.includes('SOLO PARA CONTROL INTERNO')), `cambio fuera del cuerpo de la tirilla (${w} col)`);
  for (const linea of [lineas[recibido], lineas[cambio]]) {
    assert.ok(linea.length <= w, `linea de ${linea.length} > ${w} col: "${linea}"`);
  }
}

// Pago exacto: cambio $0, que también se informa (confirma que no hay vueltas)
const exacto = renderFactura({ ...pedidoEfectivo, efectivo_recibido: 41800, cambio: 0 }, { now, columns: 32 });
assert.match(exacto, /EFECTIVO RECIBIDO: +\$41\.800/);
assert.match(exacto, /CAMBIO: +\$0$/m);

// Pago dividido: lo recibido es solo de la parte en efectivo y va tras el total cobrado
const dividido = renderFactura({
  ...pedidoEfectivo,
  metodo_pago: 'efectivo+tarjeta',
  pagos: [
    { metodo: 'efectivo', monto: 20000, propina: 2000 },
    { metodo: 'tarjeta', monto: 18000, propina: 1800 },
  ],
  efectivo_recibido: 30000, cambio: 8000,
}, { now, columns: 48 });
assert.ok(dividido.indexOf('TOTAL COBRADO:') < dividido.indexOf('EFECTIVO RECIBIDO:'));
assert.match(dividido, /CAMBIO: +\$8\.000/);

// Con documento electrónico, el cambio queda antes del bloque fiscal
const fiscalConCambio = renderFactura(
  { ...pedidoEfectivo, fe: feTicket, efectivo_recibido: 50000, cambio: 8200 },
  { now, columns: 48 },
);
assert.ok(fiscalConCambio.indexOf('CAMBIO:') < fiscalConCambio.indexOf('CUDE:'), 'el cambio va antes del bloque fiscal');

// Sin el dato completo y coherente la tirilla queda como siempre: caja sin
// apoyo de vueltas, reimpresión, o un cambio que no cuadra.
for (const payload of [
  pedidoEfectivo,
  { ...pedidoEfectivo, efectivo_recibido: 0, cambio: 0 },
  { ...pedidoEfectivo, efectivo_recibido: 50000 },
  { ...pedidoEfectivo, efectivo_recibido: 30000, cambio: -11800 },
  { ...pedidoEfectivo, efectivo_recibido: 50000, cambio: 60000 },
]) {
  assert.doesNotMatch(renderFactura(payload, { now, columns: 32 }), /EFECTIVO RECIBIDO|CAMBIO:/);
}

console.log('OK — efectivo recibido y cambio (32 y 48 col, exacto, dividido, fiscal y sin dato)');

// ── Rayas justas, total en negrilla y avance al corte (tirilla DJFE30) ─────
// Una raya ENTRE secciones y la doble solo para abrir el bloque fiscal: antes
// salían "----" y "====" pegadas, y dobles rayas encerrando el total.
const esRaya = (l) => /^(-+|=+)$/.test(l);
const feAlegra = {
  ...feTicket,
  tipo_label: 'FACTURA ELECTRONICA DE VENTA',
  es_cufe: true,
  software: 'Proveedor tecnologico: Soluciones Alegra S.A.S - Software: Alegra - NIT 900.559.088-2',
};
const tirillaFoto = {
  tenant_nombre: 'Ramirez Camargo Juan de Jesus', nit: '1140879485', numero_factura: 'PED-00030',
  mesa_nombre: 'Principal 1', mesero: 'Admin DJR',
  items: [{ cantidad: 1, nombre: 'Servicio Comedor', precio_unitario: 99800 }],
  subtotal: 99800, total: 99800, metodo_pago: 'tarjeta_credito',
  pagos: [{ metodo: 'tarjeta_credito', monto: 99800, propina: 0 }],
  fe: feAlegra,
};
const escenariosRayas = {
  'fiscal con tarjeta': tirillaFoto,
  'fiscal con servicio e impuesto': {
    ...pedidoEfectivo, fe: { ...feAlegra, impuesto: { label: 'IMPOCONSUMO', tarifa: 8, base: 35185.19, monto: 2814.81 } },
  },
  'control interno con servicio y cambio': { ...pedidoEfectivo, efectivo_recibido: 50000, cambio: 8200 },
  'descuento, domicilio y dividido': {
    ...pedidoEfectivo,
    descuento_monto: 2000, motivo_descuento_mesa: 'Cliente frecuente',
    recaudo_domicilio_monto: 4000, total_cliente: 45800, metodo_pago: 'efectivo+nequi',
    pagos: [{ metodo: 'efectivo', monto: 20000, propina: 2000 }, { metodo: 'nequi', monto: 16000, propina: 1800 }],
  },
  'sin items ni pagos': { tenant_nombre: 'Restaurante', numero_factura: 'PED-2', items: [], total: 0 },
};
for (const [nombre, payload] of Object.entries(escenariosRayas)) {
  for (const w of [32, 48]) {
    const lineas = renderFactura(payload, { now, columns: w }).split('\n');
    for (let i = 1; i < lineas.length; i++) {
      assert.ok(!(esRaya(lineas[i - 1]) && esRaya(lineas[i])), `rayas pegadas en "${nombre}" (${w} col), linea ${i}`);
    }
    const dobles = lineas.filter((l) => /^=+$/.test(l));
    if (payload.fe) {
      assert.equal(dobles.length, 1, `una sola doble raya en "${nombre}" (${w} col)`);
      const abre = lineas[lineas.findIndex((l) => /^=+$/.test(l)) + 1];
      assert.match(abre, /FACTURA ELECTRONICA DE VENTA/, `la doble raya abre el bloque fiscal en "${nombre}" (${w} col)`);
    } else {
      assert.equal(dobles.length, 0, `sin dobles rayas en "${nombre}" (${w} col)`);
    }
  }
}

const foto = renderFactura(tirillaFoto, { now, columns: 48 });
assert.match(foto, /^Tarjeta credito: +\$99\.800$/m, 'el metodo sale con su nombre, no con la clave del catalogo');
assert.doesNotMatch(foto, /Tarjeta_credito/i);
assert.doesNotMatch(foto, /SUBTOTAL/, 'sin ajustes el subtotal solo repetia el total');
assert.ok(foto.includes(`${escBold(true)}TOTAL PEDIDO:`), 'el total va en negrilla');
assert.match(renderFactura(pedidoEfectivo, { now, columns: 32 }), /SUBTOTAL: +\$38\.000/, 'con servicio el subtotal si informa');
assert.match(
  renderFactura({ ...pedidoEfectivo, pagos: [{ metodo: 'bono_regalo', monto: 38000, propina: 3800 }] }, { now, columns: 48 }),
  /^Bono regalo: +\$38\.000$/m,
  'una clave sin etiqueta tampoco sale con guion bajo',
);

// Dividido: sin servicio, una línea por método; con servicio conserva su desglose.
const divididoSinServicio = renderFactura({
  ...pedidoEfectivo, propina: 0, total: 38000, metodo_pago: 'efectivo+transferencia',
  pagos: [{ metodo: 'efectivo', monto: 20000, propina: 0 }, { metodo: 'transferencia', monto: 18000, propina: 0 }],
}, { now, columns: 32 });
assert.match(divididoSinServicio, /^Efectivo: +\$20\.000$/m);
assert.match(divididoSinServicio, /^Transferencia: +\$18\.000$/m);
assert.doesNotMatch(divididoSinServicio, /Total metodo/);
assert.match(dividido, /\+ Servicio: +\$2\.000/);
assert.match(dividido, /Total metodo: +\$22\.000/);

// El avance de papel va SIEMPRE al final: con FE el pie de marca se omite y sin
// su avance la cuchilla cortaba sobre el software, su NIT y el agradecimiento.
for (const payload of [tirillaFoto, pedidoEfectivo]) {
  for (const w of [32, 48]) {
    assert.match(renderFactura(payload, { now, columns: w }), /\n{5}$/, `sin avance al corte (${w} col)`);
  }
}
const cierreFiscal = foto.split('\n');
const iGracias = cierreFiscal.findIndex((l) => l.includes('Gracias por su visita!'));
assert.ok(cierreFiscal.slice(0, iGracias).some((l) => l.includes('NIT 900.559.088-2')), 'el software va completo antes del agradecimiento');
assert.deepEqual(cierreFiscal.slice(iGracias + 1), ['', '', '', '', ''], 'tras el agradecimiento solo queda el avance al corte');

// Nada se sale del papel: una línea más ancha que el rollo la parte la impresora
// donde quiera (en 58mm el pie dejaba "co" solo y el software salía "Solucione / s").
const sinMarcas = (t) => t.split(escBold(true)).join('').split(escBold(false)).join('');
for (const [nombre, payload] of Object.entries(escenariosRayas)) {
  for (const w of [32, 48]) {
    for (const linea of sinMarcas(renderFactura(payload, { now, columns: w })).split('\n')) {
      if (linea.includes('\x1E')) continue; // el QR es un bloque nativo, no una línea de texto
      assert.ok(linea.length <= w, `linea de ${linea.length} > ${w} col en "${nombre}": "${linea}"`);
    }
  }
}
assert.match(
  renderFactura(tirillaFoto, { now, columns: 32 }),
  /^ *Soluciones Alegra S\.A\.S *$/m,
  'el proveedor tecnologico se envuelve por palabras en 58mm',
);

// Resolución y adquirente largos, también por palabras: en 58mm el rango
// autorizado salía partido ("DJFE 1-5000" / "000").
const fiscalLargo = renderFactura({
  ...tirillaFoto,
  fe: {
    ...feAlegra,
    resolucion: 'Res 18764115326150 - DJFE 1-5000000',
    adquirente: 'Distribuidora de Alimentos del Caribe SAS - NIT 900123456-7',
  },
}, { now, columns: 32 });
assert.match(fiscalLargo, /^ *1-5000000 *$/m, 'el rango de la resolucion no se parte a la mitad');
assert.match(fiscalLargo, /^ *Caribe SAS - NIT 900123456-7 *$/m, 'el adquirente largo se envuelve por palabras');
for (const linea of sinMarcas(fiscalLargo).split('\n')) {
  if (!linea.includes('\x1E')) assert.ok(linea.length <= 32, `linea de ${linea.length} > 32 col: "${linea}"`);
}

console.log('OK — rayas justas, total en negrilla, metodo legible y avance al corte (32 y 48 col)');
