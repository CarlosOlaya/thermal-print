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
export declare function footer(width?: number, text?: string): string;
export declare function clampColumns(columns?: number): number;
