import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';

// Explicit public entrypoints (subpaths)
const entries = {
  index: 'src/index.ts',
  Promise: 'src/Promise.ts',
  LazyPromise: 'src/LazyPromise.ts'
};

function external(id) {
  // keep deps external (don’t inline)
  return !id.startsWith('.') && !path.isAbsolute(id);
}

export default defineConfig({
  input: entries,
  external,
  plugins: [
    typescript({
      tsconfig: './tsconfig.esm.json',
        declaration: false,
      declarationMap: false,
      sourceMap: true
    })
  ],
  output: {
    dir: 'dist/esm',
    format: 'esm',
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js'
  }
});
