export type { FacturaCerradaPayload, ItemEvento, PagoEventoItem, ThermalComandaItem, ThermalComandaPayload, ThermalDocumentPayload, ThermalRenderOptions, } from './types';
export { ESC, escBeep, escBold, escCashDrawerPulse, escCut, escFontSize, escLeftMargin, textToEscPosBytes, type EscPosByteOptions, } from './escpos';
export { center, formatDate, formatMoney, formatTime, labelMetodo, leftRight, sanitizeText } from './utils';
export { renderComanda, renderComandaAnulacion } from './renderers/comanda';
export { renderFactura } from './renderers/factura';
export { renderCierreCaja, renderCorreccion, renderDatosCliente, renderFacturasTurno, renderGastosTurno, renderNotaCredito, renderPrecuenta, renderReporteVentas, renderVentasPLU, } from './renderers/documents';
