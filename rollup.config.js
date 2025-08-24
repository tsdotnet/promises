import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

export default defineConfig([
  // Main index export
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      /^node:/,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        removeComments: true
      })
    ]
  },
  // Promise subpath export
  {
    input: 'src/Promise.ts',
    output: {
      file: 'dist/esm/Promise.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      /^node:/,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        removeComments: true
      })
    ]
  },
  // LazyPromise subpath export
  {
    input: 'src/LazyPromise.ts',
    output: {
      file: 'dist/esm/LazyPromise.js',
      format: 'es',
      sourcemap: true
    },
    external: [
      /^node:/,
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.esm.json',
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        removeComments: true
      })
    ]
  }
]);




