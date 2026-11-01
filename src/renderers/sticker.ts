import type { ThermalDocumentPayload } from '../types';
import { sanitizeText } from '../utils';
import { ICONO_BOLSA, ICONO_MOTO } from './sticker-iconos';

/**
 * Sticker de entrega en TSPL, el lenguaje de etiquetas de la PT-260 y similares.
 * Todo se mide en puntos: 8 por milímetro a 203 dpi. El cabezal imprime 48 mm (384
 * puntos) aunque el sticker sea más ancho; un sticker más angosto se asume centrado
 * en el cabezal (verificado en papel solo con 50 x 30 mm).
 */
const PUNTOS_MM = 8;
const CABEZAL = 384;
const MARGEN = 8;
/** Fuentes internas de TSPL: ancho y alto de cada carácter, en puntos. */
const FUENTES = { '1': [8, 12], '2': [12, 20], '3': [16, 24], '4': [24, 32] } as const;
type Fuente = keyof typeof FUENTES;
/**
 * El QR (celda de 3 puntos, corrección L) se limita a 78 bytes: versión 4, 99 puntos.
 * Así el teléfono completo cabe a su lado en un sticker de 50 mm.
 */
const QR_CAJA = 100;
const QR_MAX = 78;
const ICONO = 36;

export type StickerIcono = 'logo' | 'tipo' | 'ninguno';

export interface StickerBitmap {
  ancho: number;
  alto: number;
  /** Fila por fila, de izquierda a derecha: verdadero (o 1) = punto con tinta. */
  puntos: ArrayLike<boolean | number>;
}

export interface StickerOptions {
  /** Medidas del rollo de stickers (Empresa: 40x30, 50x30, 50x40, 57x40). Default 50 x 30. */
  anchoMm?: number;
  altoMm?: number;
  /** Logo del restaurante, moto/bolsa según el pedido o nada. Sin `logo` cae a moto/bolsa. */
  icono?: StickerIcono;
  /** Logo ya reducido a blanco y negro, de hasta 26 x 26 (ver `stickerBitmapDesdeRgba`). */
  logo?: StickerBitmap;
  /** QR con la dirección para Google Maps. Solo en domicilios y stickers de 50 mm o más. */
  qr?: boolean;
  timezone?: string;
  now?: Date;
}

/**
 * El sticker que se pega en la bolsa de un domicilio o un pedido para llevar: tipo de
 * pedido y hora en una franja negra con el icono, y debajo el cliente. Usa el mismo
 * payload que `renderDatosCliente` (`mesa_nombre`, `tenant_nombre`, `cliente`).
 * Devuelve los bytes listos para la impresora: el icono va como imagen binaria.
 */
export function renderStickerEntrega(data: ThermalDocumentPayload, options: StickerOptions = {}): Uint8Array {
  const anchoMm = acotar(options.anchoMm, 30, 80, 50);
  const altoMm = acotar(options.altoMm, 20, 80, 30);
  const etiquetaAncho = anchoMm * PUNTOS_MM;
  const etiquetaAlto = altoMm * PUNTOS_MM;
  const x0 = MARGEN + Math.max(0, Math.floor((CABEZAL - etiquetaAncho) / 2));
  const ancho = Math.min(etiquetaAncho, CABEZAL) - 2 * MARGEN;
  const grande = altoMm >= 40;

  const mesa = texto(data.mesa_nombre);
  const llevar = /llevar/i.test(mesa);
  const cliente = isRecord(data.cliente) ? data.cliente : {};
  const p = new Programa();

  p.cmd(`SIZE ${anchoMm} mm,${altoMm} mm`);
  p.cmd('GAP 2 mm,0 mm');
  p.cmd('DIRECTION 1,0');
  p.cmd('REFERENCE 0,0');
  p.cmd('DENSITY 8');
  p.cmd('SET TEAR ON');
  p.cmd('CLS');

  // Franja negra: se escribe el texto y se invierte la zona; el icono va encima.
  const franjaAlto = grande ? 48 : 40;
  const yFranja = MARGEN;
  const icono = iconoDeFranja(options, llevar);
  const xTitulo = x0 + (icono ? 4 + 40 + 6 : 8);
  const hora = horaCorta(options.now || new Date(), options.timezone || 'America/Bogota');
  const xHora = x0 + ancho - 6 - hora.length * FUENTES['2'][0];
  const titulo = recortar((mesa || (llevar ? 'Para llevar' : 'Domicilio')).toUpperCase(), Math.floor((xHora - 8 - xTitulo) / FUENTES['3'][0]));
  p.texto(xTitulo, yFranja + (franjaAlto - 24) / 2, '3', titulo);
  p.texto(xHora, yFranja + (franjaAlto - 20) / 2, '2', hora);
  p.cmd(`REVERSE ${x0},${yFranja},${ancho},${franjaAlto}`);
  if (icono) p.bitmap(x0 + 4, yFranja + (franjaAlto - ICONO) / 2, iconoCircular(icono));

  // Pie con el nombre del restaurante, solo en los stickers altos.
  let fondo = etiquetaAlto - MARGEN;
  const restaurante = texto(data.tenant_nombre);
  if (grande && restaurante) {
    const yPie = etiquetaAlto - MARGEN - FUENTES['2'][1];
    const nombre = recortar(restaurante, Math.floor(ancho / FUENTES['2'][0]));
    p.cmd(`BAR ${x0},${yPie - 6},${ancho},2`);
    p.texto(x0 + Math.floor((ancho - nombre.length * FUENTES['2'][0]) / 2), yPie, '2', nombre);
    fondo = yPie - 10;
  }

  let y = yFranja + franjaAlto + 8;
  const nombre = texto(cliente.nombre).toUpperCase();
  if (nombre) {
    // Grande si cabe; para llevar el nombre es lo único que importa y puede usar dos
    // renglones; en domicilio un nombre largo baja a la fuente mediana.
    const cabenGrande = Math.floor(ancho / FUENTES['4'][0]);
    let fuente: Fuente = '4';
    let lineas = [nombre];
    if (nombre.length > cabenGrande) {
      if (llevar) lineas = envolver(nombre, cabenGrande, 2);
      else { fuente = '3'; lineas = [recortar(nombre, Math.floor(ancho / FUENTES['3'][0]))]; }
    }
    for (const l of lineas) {
      p.texto(x0, y, fuente, l);
      y += FUENTES[fuente][1] + 4;
    }
    y += 2;
  }

  // QR a Google Maps a la derecha, debajo del nombre; el resto va en la columna izquierda.
  const direccion = texto(cliente.direccion);
  const barrio = texto(cliente.barrio);
  const conQr = !llevar && options.qr !== false && anchoMm >= 50 && !!direccion
    && y + QR_CAJA - 1 <= fondo;
  const finQr = conQr ? y + QR_CAJA : 0;
  if (conQr) {
    p.cmd(`QRCODE ${x0 + ancho - QR_CAJA},${y},L,3,A,0,"${urlMaps([direccion, barrio, texto(data.ciudad)])}"`);
  }
  const anchoEn = (yLinea: number) => (conQr && yLinea < finQr + 4 ? ancho - QR_CAJA - 8 : ancho);

  const linea = (fuente: Fuente, valor: string, maxLineas = 1): void => {
    const [w, h] = FUENTES[fuente];
    for (const l of envolver(valor, Math.floor(anchoEn(y) / w), maxLineas)) {
      if (y + h > fondo) return;
      p.texto(x0, y, fuente, l);
      y += h + 3;
    }
  };

  if (cliente.telefono) linea('3', `Tel ${texto(cliente.telefono)}`);
  if (!llevar && direccion) linea('2', direccion, 2);
  if (!llevar && barrio) linea('2', barrio);

  const nota = texto(cliente.notas);
  if (nota) {
    const fuente: Fuente = grande || llevar ? '2' : '1';
    const [w, h] = FUENTES[fuente];
    if (grande) {
      // En los stickers altos la nota va en un recuadro, como en el diseño aprobado.
      const top = y + 2;
      const caja = anchoEn(top);
      const caben = Math.floor((fondo - top - 8) / (h + 3));
      const lineas = caben > 0 ? envolver(`Nota: ${nota}`, Math.floor((caja - 12) / w), caben) : [];
      if (lineas.length) {
        p.cmd(`BOX ${x0},${top},${x0 + caja},${top + 8 + lineas.length * (h + 3)},2`);
        lineas.forEach((l, i) => p.texto(x0 + 6, top + 5 + i * (h + 3), fuente, l));
      }
    } else {
      const caben = Math.floor((fondo - y) / (h + 3));
      if (caben > 0) linea(fuente, `Nota: ${nota}`, caben);
    }
  }

  p.cmd('PRINT 1,1');
  return p.bytes();
}

/** Sticker de muestra para el botón «Probar sticker» de los puentes. */
export function renderStickerPrueba(options: StickerOptions & { empresa?: string } = {}): Uint8Array {
  return renderStickerEntrega({
    mesa_nombre: 'Domicilio 1',
    tenant_nombre: options.empresa || 'Foodly',
    cliente: {
      nombre: 'Prueba de sticker',
      telefono: '300 000 0000',
      direccion: 'Calle 1 # 2-3',
      barrio: 'Centro',
      notas: 'Si lees esto, la impresora de stickers funciona.',
    },
  }, options);
}

/** Pitido al terminar el sticker. Lo agrega el puente cuando la regla tiene «Beep». */
export function tsplBeep(): Uint8Array {
  return ascii('SOUND 5,200\r\n');
}

/**
 * Pasa una imagen RGBA (ya reducida, p. ej. con sharp a 26 x 26) a puntos de tinta: un
 * punto lleva tinta si es opaco y no es casi blanco. Sirve para el logo del restaurante.
 */
export function stickerBitmapDesdeRgba(rgba: ArrayLike<number>, ancho: number, alto: number): StickerBitmap {
  const puntos: boolean[] = [];
  for (let i = 0; i < ancho * alto; i++) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
    const luz = 0.299 * r + 0.587 * g + 0.114 * b;
    puntos.push(a > 110 && luz < 200);
  }
  return { ancho, alto, puntos };
}

function iconoDeFranja(options: StickerOptions, llevar: boolean): StickerBitmap | null {
  const tipo = options.icono || 'logo';
  if (tipo === 'ninguno') return null;
  if (tipo === 'logo' && options.logo && options.logo.ancho > 0 && options.logo.alto > 0) return options.logo;
  return llevar ? ICONO_BOLSA : ICONO_MOTO;
}

/**
 * Icono de 36 x 36 para la franja: círculo blanco con el dibujo en negro adentro y el
 * resto negro, para que se funda con la franja invertida. Lo que pase de 28 puntos se recorta.
 */
function iconoCircular(dibujo: StickerBitmap): boolean[][] {
  const r = ICONO / 2;
  const ox = Math.floor((ICONO - Math.min(dibujo.ancho, 28)) / 2) - Math.max(0, Math.floor((dibujo.ancho - 28) / 2));
  const oy = Math.floor((ICONO - Math.min(dibujo.alto, 28)) / 2) - Math.max(0, Math.floor((dibujo.alto - 28) / 2));
  const filas: boolean[][] = [];
  for (let y = 0; y < ICONO; y++) {
    const fila: boolean[] = [];
    for (let x = 0; x < ICONO; x++) {
      const dentro = (x - r + 0.5) ** 2 + (y - r + 0.5) ** 2 <= r * r;
      let tinta = !dentro;
      const dx = x - ox, dy = y - oy;
      if (dentro && dx >= 0 && dy >= 0 && dx < dibujo.ancho && dy < dibujo.alto) {
        tinta = Boolean(dibujo.puntos[dy * dibujo.ancho + dx]);
      }
      fila.push(tinta);
    }
    filas.push(fila);
  }
  return filas;
}

class Programa {
  private partes: Uint8Array[] = [];

  cmd(linea: string): void {
    this.partes.push(ascii(`${linea}\r\n`));
  }

  texto(x: number, y: number, fuente: Fuente, valor: string): void {
    if (valor) this.cmd(`TEXT ${Math.round(x)},${Math.round(y)},"${fuente}",0,1,1,"${valor}"`);
  }

  /** TSPL BITMAP: bit 1 = blanco, 0 = negro, el más alto a la izquierda; el relleno va negro. */
  bitmap(x: number, y: number, filas: boolean[][]): void {
    const alto = filas.length;
    const bytesFila = Math.ceil(filas[0].length / 8);
    const datos = new Uint8Array(bytesFila * alto);
    for (let fy = 0; fy < alto; fy++) {
      for (let b = 0; b < bytesFila; b++) {
        let v = 0;
        for (let bit = 0; bit < 8; bit++) {
          const fx = b * 8 + bit;
          if (fx < filas[fy].length && !filas[fy][fx]) v |= 0x80 >> bit;
        }
        datos[fy * bytesFila + b] = v;
      }
    }
    this.partes.push(ascii(`BITMAP ${Math.round(x)},${Math.round(y)},${bytesFila},${alto},0,`), datos, ascii('\r\n'));
  }

  bytes(): Uint8Array {
    const total = this.partes.reduce((n, parte) => n + parte.length, 0);
    const salida = new Uint8Array(total);
    let i = 0;
    for (const parte of this.partes) {
      salida.set(parte, i);
      i += parte.length;
    }
    return salida;
  }
}

/**
 * Un valor del cliente listo para ir entre comillas en TSPL: sin tildes, en una sola
 * línea, sin comillas dobles ni barra invertida. Un salto de línea o una comilla en la
 * nota cerraría el TEXT y lo que siga llegaría a la impresora como comando.
 */
function texto(value: unknown): string {
  return sanitizeText(value).replace(/\s+/g, ' ').replace(/"/g, "'").replace(/\\/g, '/').trim();
}

/** Búsqueda de Maps con la dirección; si no cabe en el QR se pierde primero el final (barrio, ciudad). */
function urlMaps(partes: string[]): string {
  const base = 'https://maps.google.com/?q=';
  const codificar = (valor: string) => encodeURIComponent(valor.trim()).replace(/%20/g, '+');
  let consulta = partes.filter(Boolean).join(', ');
  while (consulta && (base + codificar(consulta)).length > QR_MAX) consulta = consulta.slice(0, -1);
  return base + codificar(consulta);
}

function envolver(valor: string, maxChars: number, maxLineas: number): string[] {
  if (maxChars < 1 || maxLineas < 1 || !valor) return [];
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of valor.split(' ')) {
    let resto = palabra;
    while (resto.length > maxChars) {
      if (actual) { lineas.push(actual); actual = ''; }
      lineas.push(resto.slice(0, maxChars));
      resto = resto.slice(maxChars);
    }
    if (!resto) continue;
    if (!actual) actual = resto;
    else if (actual.length + 1 + resto.length <= maxChars) actual += ` ${resto}`;
    else { lineas.push(actual); actual = resto; }
  }
  if (actual) lineas.push(actual);
  if (lineas.length <= maxLineas) return lineas;
  const visibles = lineas.slice(0, maxLineas);
  visibles[maxLineas - 1] = recortar(`${visibles[maxLineas - 1]} ${lineas[maxLineas]}`, maxChars, true);
  return visibles;
}

function recortar(valor: string, maxChars: number, siempreMarcar = false): string {
  if (maxChars < 1) return '';
  if (valor.length <= maxChars && !siempreMarcar) return valor;
  if (maxChars <= 3) return valor.slice(0, maxChars);
  return `${valor.slice(0, maxChars - 3).trimEnd()}...`;
}

function horaCorta(fecha: Date, timezone: string): string {
  try {
    return fecha.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true })
      .toLowerCase().replace(/\s+/g, ' ');
  } catch {
    const h = fecha.getHours();
    return `${h % 12 || 12}:${String(fecha.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`;
  }
}

function acotar(valor: unknown, min: number, max: number, defecto: number): number {
  const n = Math.round(Number(valor));
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : defecto;
}

function ascii(valor: string): Uint8Array {
  const salida = new Uint8Array(valor.length);
  for (let i = 0; i < valor.length; i++) salida[i] = valor.charCodeAt(i) & 0x7f;
  return salida;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
