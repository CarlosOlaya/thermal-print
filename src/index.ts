export type {
  FacturaCerradaPayload,
  FacturaElectronicaTicket,
  ItemEvento,
  PagoEventoItem,
  ThermalComandaItem,
  ThermalComandaPayload,
  ThermalDocumentPayload,
  ThermalInventarioItem,
  ThermalRenderOptions,
  ThermalReservaItem,
  ThermalReservasDiaPayload,
  ThermalTomaInventarioPayload,
} from './types';

export {
  ESC,
  escBeep,
  escBold,
  escCashDrawerPulse,
  escCut,
  escFontSize,
  escLeftMargin,
  qrMarker,
  textToEscPosBytes,
  type EscPosByteOptions,
} from './escpos';
export { center, formatDate, formatMoney, formatTime, labelMetodo, leftRight, sanitizeText } from './utils';
export { renderComanda, renderComandaAnulacion } from './renderers/comanda';
export { renderFactura } from './renderers/factura';
export {
  renderCierreCaja,
  renderCorreccion,
  renderDatosCliente,
  renderFacturasTurno,
  renderGastosTurno,
  renderNotaCredito,
  renderPrecuenta,
  renderReporteVentas,
  renderReservasDia,
  renderTomaInventario,
  renderVentasPLU,
} from './renderers/documents';
