import type { ThermalRenderOptions } from '../types';
export interface ThermalCompraPayload extends Record<string, unknown> {
    numero: string;
    estado: 'pendiente' | 'pagada' | 'anulada' | 'reversada';
    empresa_nombre: string;
    empresa_nit?: string | null;
    registrado_en: Date | string;
    registrado_por_nombre: string;
    proveedor_nombre?: string | null;
    proveedor_nit?: string | null;
    pagado_por_nombre?: string | null;
    metodo_pago?: string | null;
    total: number | string;
    lineas: Array<{
        nombre: string;
        unidad: string;
        cantidad: number | string;
        precio_unitario: number | string;
        subtotal: number | string;
    }>;
}
export declare function renderCompra(data: ThermalCompraPayload, options?: ThermalRenderOptions): string;
