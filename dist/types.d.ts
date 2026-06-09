export interface ThermalRenderOptions {
    columns?: number;
    timezone?: string;
    now?: Date;
    footer?: string;
}
export interface ThermalComandaItem {
    nombre?: string;
    producto?: string;
    cantidad?: number;
    comentario?: string;
}
export interface ThermalComandaPayload {
    comanda?: number | string;
    mesa?: number | string;
    mesa_nombre?: string;
    mesero?: string;
    cliente_nombre?: string;
    localizador?: string;
    area?: string;
    items?: ThermalComandaItem[];
    hora?: string;
    comensales?: number;
    tipo_comanda?: string;
    motivo?: string;
}
export interface PagoEventoItem {
    metodo: string;
    metodo_pago?: string;
    monto: number;
    propina: number;
}
export interface ItemEvento {
    nombre?: string;
    plato?: string;
    cantidad: number;
    precio_unitario: number;
    descuento_porcentaje?: number;
    descuento_monto?: number;
    es_cortesia?: boolean;
    comentario?: string;
    motivo_descuento?: string;
}
export interface FacturaCerradaPayload {
    id?: string;
    factura_id?: string;
    mesa_id?: string;
    numero_factura?: string;
    tenant_nombre?: string;
    nit?: string;
    mesa_numero?: number;
    mesa_nombre?: string;
    localizador?: string;
    mesero?: string;
    cliente?: string;
    items?: ItemEvento[];
    subtotal?: number;
    bruto?: number;
    descuento_items?: number;
    monto_servicio?: number;
    monto_iva?: number;
    descuento_monto?: number;
    motivo_descuento?: string;
    motivo_descuento_mesa?: string;
    justificacion_descuento?: string;
    descuento_motivo?: string;
    propina?: number;
    total?: number;
    metodo_pago?: string;
    pagos?: PagoEventoItem[];
    recaudo_domicilio_monto?: number;
    total_cliente?: number;
    entrega?: {
        nombre?: string;
        telefono?: string;
        barrio?: string;
        direccion?: string;
    };
    [key: string]: unknown;
}
export type ThermalDocumentPayload = Record<string, unknown>;
