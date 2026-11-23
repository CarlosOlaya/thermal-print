import { build } from 'esbuild';

const shared = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  // 'neutral' no mira `main`, y el codificador QR (dijkstrajs) solo trae ese campo.
  mainFields: ['module', 'main'],
  sourcemap: true,
  target: ['es2020'],
  logLevel: 'info',
};

await Promise.all([
  build({
    ...shared,
    format: 'esm',
    outfile: 'dist/index.mjs',
    platform: 'neutral',
  }),
  build({
    ...shared,
    format: 'cjs',
    outfile: 'dist/index.cjs',
    platform: 'node',
  }),
]);
