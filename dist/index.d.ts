export type { FacturaCerradaPayload, ItemEvento, PagoEventoItem, ThermalComandaItem, ThermalComandaPayload, ThermalRenderOptions, } from './types';
export { ESC, escBold, escFontSize, textToEscPosBytes } from './escpos';
export { center, formatDate, formatMoney, formatTime, labelMetodo, leftRight, sanitizeText } from './utils';
export { renderComanda, renderComandaAnulacion } from './renderers/comanda';
export { renderFactura } from './renderers/factura';
