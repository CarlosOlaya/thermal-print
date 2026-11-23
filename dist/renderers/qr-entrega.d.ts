import type { QrRotulado } from '../escpos';
/** Los QR del domiciliario: ruta y chat. El que no tenga dato no sale. */
export declare function qrsDeEntrega(cliente: {
    nombre?: unknown;
    telefono?: unknown;
    direccion?: unknown;
    barrio?: unknown;
}, ciudad: unknown, restaurante: unknown): QrRotulado[];
