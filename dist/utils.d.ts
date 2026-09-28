/**
 * Un VALOR (nombre, nota, dirección…) listo para el papel: sin tildes, porque la
 * impresora no trae la página de códigos, y sin caracteres de control. Los
 * comandos ESC/POS los arman los renderers por fuera de esta función. Un ESC o
 * GS que viniera en el valor llegaría a la impresora como comando: con
 * "\x1Bp0dd" en una nota se abre el cajón monedero y con "\x1DV" se corta el
 * papel. Solo queda el salto de línea, con el que los renderers parten
 * renglones: el retorno de carro pasa a salto y el tabulador a espacio.
 */
export declare function sanitizeText(value: unknown): string;
export declare function labelMetodo(raw: unknown): string;
export declare function center(text: unknown, width?: number): string;
export declare function leftRight(left: unknown, right: unknown, width?: number): string;
/**
 * Fila de ítem en UNA sola línea: "cant nombre ........... valor".
 * El nombre se trunca para que la cantidad, el nombre y el valor derecho quepan en
 * `width` columnas — uniforme en 58mm y 80mm. Ahorra papel vs. poner el total abajo.
 */
export declare function itemRow(qty: unknown, name: unknown, right: unknown, width?: number): string;
export declare function rightPadMoney(value: unknown, width: number): string;
export declare function formatMoney(value: unknown): string;
export declare function formatDate(date: Date, timezone?: string): string;
export declare function formatTime(date: Date, timezone?: string): string;
/**
 * Líneas en blanco con que termina toda tirilla. La cuchilla queda unas cuatro
 * líneas por encima del cabezal y el print-server corta apenas llega el último
 * byte: sin este avance, el corte cae sobre lo último impreso y ese texto sale
 * pegado al comienzo de la tirilla siguiente.
 */
export declare const AVANCE_CORTE: readonly string[];
export declare function footer(width?: number, text?: string): string;
export declare function clampColumns(columns?: number): number;
