export declare function receiptContactLines(telefono: unknown, direccion: unknown, width: number): string[];
export declare function receiptCustomerLines(customer: {
    nombre?: unknown;
    telefono?: unknown;
    direccion?: unknown;
    barrio?: unknown;
}, width: number): string[];
export declare function receiptDetailsLines(mesa: unknown, mesero: unknown, width: number, now: Date, timezone: string): string[];
