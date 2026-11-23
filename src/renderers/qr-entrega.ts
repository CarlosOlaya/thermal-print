import type { QrRotulado } from '../escpos';
import { sanitizeText } from '../utils';

/** Con corrección M: versión 6 (cabe a 4 puntos en 58 mm) y versión 10, el tope legible. */
const QR_COMODO = 106;
const QR_MAX = 213;
const RUTA = 'https://www.google.com/maps/dir/?api=1&destination=';

function limpio(value: unknown): string {
  return sanitizeText(value).replace(/\s+/g, ' ').trim();
}

/** La coma es legal en una query y sin escapar el QR queda más pequeño. */
function codificar(valor: string): string {
  return encodeURIComponent(valor).replace(/%2C/g, ',');
}

/** Ruta en Google Maps desde donde está el domiciliario. Si no cabe, se pierde primero el barrio. */
function urlRuta(direccion: string, barrio: string, ciudad: string): string {
  const armar = (dir: string, conBarrio: boolean) =>
    RUTA + codificar([dir, conBarrio ? barrio : '', ciudad].filter(Boolean).join(', ')).replace(/%20/g, '+');
  const completa = armar(direccion, true);
  if (completa.length <= QR_MAX) return completa;
  let dir = direccion;
  while (dir && armar(dir, false).length > QR_MAX) dir = dir.slice(0, -1).trimEnd();
  return armar(dir, false);
}

/** Celular colombiano, o un número guardado con su indicativo (`+`). Un fijo no tiene chat. */
function numeroWhatsapp(value: unknown): string {
  const [primero] = limpio(value).split(/[/,;]|\by\b/i);
  const digitos = primero.replace(/\D/g, '');
  if (/^3\d{9}$/.test(digitos)) return `57${digitos}`;
  if (/^573\d{9}$/.test(digitos)) return digitos;
  return primero.trim().startsWith('+') && digitos.length >= 10 && digitos.length <= 15 ? digitos : '';
}

/** Chat del cliente con el saludo escrito. El restaurante va si no agranda el QR. */
function urlWhatsapp(numero: string, nombre: string, restaurante: string): string {
  const cliente = nombre.split(' ')[0].slice(0, 20);
  const saludo = `${cliente ? `Hola ${cliente}` : 'Hola'}, voy en camino con tu domicilio`;
  const armar = (texto: string) => `https://wa.me/${numero}?text=${codificar(texto)}`;
  const conRestaurante = armar(`${saludo} de ${restaurante}`);
  return restaurante && conRestaurante.length <= QR_COMODO ? conRestaurante : armar(saludo);
}

/** Los QR del domiciliario: ruta y chat. El que no tenga dato no sale. */
export function qrsDeEntrega(
  cliente: { nombre?: unknown; telefono?: unknown; direccion?: unknown; barrio?: unknown },
  ciudad: unknown,
  restaurante: unknown,
): QrRotulado[] {
  const direccion = limpio(cliente.direccion);
  const numero = numeroWhatsapp(cliente.telefono);
  const qrs: QrRotulado[] = [];
  if (direccion) qrs.push({ rotulo: 'RUTA', data: urlRuta(direccion, limpio(cliente.barrio), limpio(ciudad)) });
  if (numero) qrs.push({ rotulo: 'WHATSAPP', data: urlWhatsapp(numero, limpio(cliente.nombre), limpio(restaurante)) });
  return qrs;
}
