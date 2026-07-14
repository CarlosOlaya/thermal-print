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

export interface ThermalComandaSeccion {
  area?: string;
  items?: ThermalComandaItem[];
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
  /**
   * Comanda unificada: ítems agrupados por área en un solo ticket. Cuando viene
   * presente, el renderer imprime un encabezado por sección y omite el área única
   * del título. Si está ausente, se usa `items` (comportamiento por área).
   */
  secciones?: ThermalComandaSeccion[];
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
  cliente_telefono?: string;
  cliente_direccion?: string;
  cliente_barrio?: string;
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
  /**
   * Datos fiscales del documento electrónico DIAN. Solo presente cuando el
   * pedido ya tiene un documento ACEPTADO: convierte la tirilla de "control
   * interno" en la representación gráfica fiscal (número DIAN, CUFE/CUDE, QR).
   */
  fe?: FacturaElectronicaTicket;
  [key: string]: unknown;
}

export interface FacturaElectronicaTicket {
  /** Ej. "FACTURA ELECTRONICA DE VENTA" / "DOCUMENTO EQUIVALENTE POS" */
  tipo_label: string;
  /** Número completo con prefijo, ej. "SETP992468936" */
  numero: string;
  /** true = CUFE (factura) · false = CUDE (POS/otros) */
  es_cufe?: boolean;
  cufe?: string;
  /** Línea de resolución de numeración autorizada */
  resolucion?: string;
  /** Adquirente identificado, ej. "Carlos Olaya - NIT 1075317251-8" */
  adquirente?: string;
  /** Contenido oficial del QR de la DIAN (qrCodeContent) */
  qr?: string;
  /** URL pública de verificación del documento */
  url?: string;
}

export type ThermalDocumentPayload = Record<string, unknown>;

export interface ThermalInventarioItem {
  nombre?: string;
  producto?: string;
  unidad?: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock?: number;
  existencia?: number;
}

/**
 * Toma de inventario: tirilla para imprimir el stock actual y que el personal
 * anote el conteo físico, antes de registrar la toma en el sistema.
 */
export interface ThermalTomaInventarioPayload extends Record<string, unknown> {
  tenant_nombre?: string;
  nit?: string;
  telefono?: string;
  direccion?: string;
  bodega?: string;
  generado_por?: string;
  /** Conteo ciego: oculta el stock del sistema para no sesgar el conteo. */
  modo_ciego?: boolean;
  items?: ThermalInventarioItem[];
}
