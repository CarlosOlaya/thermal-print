import type { ThermalDocumentPayload } from '../types';
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
export declare function renderStickerEntrega(data: ThermalDocumentPayload, options?: StickerOptions): Uint8Array;
/** Sticker de muestra para el botón «Probar sticker» de los puentes. */
export declare function renderStickerPrueba(options?: StickerOptions & {
    empresa?: string;
}): Uint8Array;
/** Pitido al terminar el sticker. Lo agrega el puente cuando la regla tiene «Beep». */
export declare function tsplBeep(): Uint8Array;
/**
 * Pasa una imagen RGBA (ya reducida, p. ej. con sharp a 26 x 26) a puntos de tinta: un
 * punto lleva tinta si es opaco y no es casi blanco. Sirve para el logo del restaurante.
 */
export declare function stickerBitmapDesdeRgba(rgba: ArrayLike<number>, ancho: number, alto: number): StickerBitmap;
