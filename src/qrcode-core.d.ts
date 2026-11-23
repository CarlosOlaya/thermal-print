declare module 'qrcode/lib/core/qrcode.js' {
  export interface QrSymbol {
    version: number;
    modules: { size: number; get(row: number, col: number): number | boolean };
  }
  export function create(
    data: string,
    options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; version?: number },
  ): QrSymbol;
}
