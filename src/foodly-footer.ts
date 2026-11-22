// Icono oficial de Foodly en monocromo a 48 puntos (6 mm a 203 dpi).
// Fuente: dashboard-foodly/src/assets/icons/web/brand-512x512.png.
export const FOODLY_FOOTER_RASTER = {
  widthBytes: 6,
  height: 48,
  data: 'AAAAAAAAAA/////8AD/////8AP/////8Af/////4A//////4B//////4D/gD///wD4AB///gH//A///AH//A//+A' +
    'H4AAAAAAH4AAAAAAP//AAAAAP//AAAAAP4AAAAAAP4ACAAAAP//+AAAAP//8H8AAP//4P/gAP/AA//wAP8AA//8A' +
    'PwAH//8APA////+AOD////+AMP////+AIf////8AA//B//8AB/+A//4AD/8Af/gAD/4AP+AAH/4AAgAAH/wAAAAA' +
    'H/wAAAAAH/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAAP/wAAAAA' +
    'P/gAAAAAP/AAAAAAP+AAAAAAH4AAAAAA',
  escala: 100,
} as const;

export const FOODLY_FOOTER_PNG = 'data:image/png;base64,' +
    'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwAQMAAABtzGvEAAAABlBMVEVMaXEAAACaXKEdAAAAAXRSTlMAQObYZgAA' +
    'AAlwSFlzAAAD6AAAA+gBtXtSawAAAIpJREFUGJWlz7ENwzAMBdFzXLjUCEI2SJkiAEcLR1M20QguVRj+AU0XTh01' +
    'D2BBnuB8RdIGluhgCgZzsiRlzNJK8UnqVDWpJU71Y9eJqV05h37L4Z5stQXDBtjK0dCQwOIivKLMeUaZ84gI5x7A' +
    'rE+wyGNdEe8BZcc61J24VLdM+sH+ZCRr0i+f/gLyOXSGKeqgaAAAAABJRU5ErkJggg==';

// Los puentes anteriores omiten el marcador y conservan el texto Foodly.
export const FOODLY_FOOTER_MARKER = '\x1f';

export function isFoodlyFooterLine(line: string): boolean {
  return line.startsWith(FOODLY_FOOTER_MARKER) && line.slice(1).trimStart() === 'Foodly';
}
