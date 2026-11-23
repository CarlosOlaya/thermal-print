export type {
  BonoQrItem,
  BonoQrTicket,
  ComandaFontSize,
  CreditoTicket,
  FacturaCerradaPayload,
  FacturaElectronicaTicket,
  ImpuestoTarifaTicket,
  ItemEvento,
  PagoEventoItem,
  ThermalComandaItem,
  ThermalComandaPayload,
  ThermalDocumentPayload,
  ThermalInventarioItem,
  ThermalReciboAbonoPayload,
  ThermalRenderOptions,
  ThermalReservaItem,
  ThermalReservasDiaPayload,
  ThermalTomaInventarioPayload,
} from './types';
export { COMANDA_FONT_SIZES } from './types';
export { FOODLY_FOOTER_PDF_WIDTH, FOODLY_FOOTER_PNG, isFoodlyFooterLine } from './foodly-footer';

export {
  ESC,
  DEFAULT_LOGO_SCALE,
  LOGO_SCALES,
  MAX_LOGO_HEIGHT,
  MAX_LOGO_WIDTH_BYTES,
  escBeep,
  escBold,
  escCashDrawerPulse,
  escCut,
  escFontSize,
  escLeftMargin,
  qrMarker,
  textToEscPosBytes,
  type EscPosByteOptions,
  type LogoScale,
  type RasterLogo,
} from './escpos';
export { center, formatDate, formatMoney, formatTime, labelMetodo, leftRight, sanitizeText } from './utils';
export { renderComanda, renderComandaAnulacion } from './renderers/comanda';
export {
  renderStickerEntrega,
  renderStickerPrueba,
  stickerBitmapDesdeRgba,
  tsplBeep,
  type StickerBitmap,
  type StickerIcono,
  type StickerOptions,
} from './renderers/sticker';
export { renderFactura } from './renderers/factura';
export { renderCompra, type ThermalCompraPayload } from './renderers/compra';
export {
  renderCierreCaja,
  renderCorreccion,
  renderDatosCliente,
  renderFacturasTurno,
  renderGastosTurno,
  renderNotaCredito,
  renderPrecuenta,
  renderReciboAbono,
  renderReporteVentas,
  renderReservasDia,
  renderRetirosCaja,
  renderTomaInventario,
  renderVentasPLU,
} from './renderers/documents';
