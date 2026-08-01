import type { ThermalDocumentPayload, ThermalRenderOptions, ThermalReservasDiaPayload, ThermalTomaInventarioPayload } from '../types';
export declare function renderPrecuenta(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderDatosCliente(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderCierreCaja(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderGastosTurno(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderFacturasTurno(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderVentasPLU(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderReporteVentas(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderCorreccion(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderNotaCredito(data: ThermalDocumentPayload, options?: ThermalRenderOptions): string;
export declare function renderTomaInventario(data: ThermalTomaInventarioPayload, options?: ThermalRenderOptions): string;
/**
 * Agenda de reservas de un día: la hoja de trabajo con la que el encargado
 * reubica las mesas. Cada reserva ocupa un bloque con hora, nombre, personas y
 * ubicación; el motivo y las notas solo salen si existen. Cuando la reserva no
 * tiene mesa asignada, la ubicación se imprime como una raya en blanco para
 * anotarla a mano.
 */
export declare function renderReservasDia(data: ThermalReservasDiaPayload, options?: ThermalRenderOptions): string;
