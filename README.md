# @foodly/thermal-print

Renderers termicos compartidos por Foodly.

Este paquete no conecta impresoras ni escucha WebSocket. Solo recibe payloads canonicos y genera texto/bytes ESC/POS.

## Uso

```ts
import { renderComanda, renderFactura, textToEscPosBytes } from '@foodly/thermal-print';

const text = renderComanda(payload, { columns: 48, timezone: 'America/Bogota' });
const bytes = textToEscPosBytes(text);
```

## Responsabilidades

- `api-foodly`: genera payload canonico y emite eventos.
- `@foodly/thermal-print`: renderiza tirillas.
- `print-server`: transporta a impresora local.
- `dashboard-foodly`: transporta por Web Serial cuando hay Bluetooth conectado.
