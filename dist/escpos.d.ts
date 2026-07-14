export declare const ESC = "\u001B";
export interface EscPosByteOptions {
    cut?: boolean;
    openCashDrawer?: boolean;
    beepAfterPrint?: boolean;
}
export declare function escBold(active: boolean): string;
export declare function escFontSize(size: 1 | 2 | 3 | 4): string;
export declare function escCut(): string;
export declare function escLeftMargin(dots?: number): string;
export declare function escCashDrawerPulse(): string;
export declare function escBeep(count?: number, duration?: number): string;
/**
 * Marca un QR en el texto renderizado. El contenido (`data`) se imprime como
 * QR NATIVO de la impresora (comando GS ( k) al convertir a bytes — no como
 * texto. `moduleSize` (3–8) ajusta el tamaño del punto: 5 en 58mm, 7 en 80mm.
 */
export declare function qrMarker(data: string, moduleSize?: number): string;
export declare function textToEscPosBytes(text: string, options?: EscPosByteOptions): Uint8Array;
