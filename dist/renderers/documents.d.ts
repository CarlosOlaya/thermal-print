import type { ThermalDocumentPayload, ThermalReciboAbonoPayload, ThermalRenderOptions, ThermalReservasDiaPayload, ThermalTomaInventarioPayload } from '../types';
export declare function renderPrecuenta(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderDatosCliente(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderCierreCaja(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderGastosTurno(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderFacturasTurno(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderVentasPLU(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderReporteVentas(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderCorreccion(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderNotaCredito(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
/**
 * Recibo de un abono a la cartera: cuánto entró, con qué método, a qué pedidos
 * se aplicó y cómo queda el cliente. Compacto: una raya entre secciones y
 * negrilla para lo que se busca primero (el valor y el saldo).
 */
export declare function renderReciboAbono(data: ThermalReciboAbonoPayload, options?: ThermalRenderOptions): string;
export declare function renderTomaInventario(data: ThermalTomaInventarioPayload, options?: ThermalRenderOptions): string;
/**
 * Agenda de reservas de un día: la hoja de trabajo con la que el encargado
 * organiza las mesas. Cada reserva ocupa un bloque con hora, nombre, personas,
 * zona preferida y mesa asignada; el motivo y las notas solo salen si existen.
 * Cuando la reserva no tiene mesa, se imprime una raya para anotarla a mano.
 */
export declare function renderReservasDia(data: ThermalReservasDiaPayload, options?: ThermalRenderOptions): string;
