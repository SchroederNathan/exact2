import { expect, test } from 'bun:test';
import { wasmExtractionImports } from './wasm-imports.mjs';
import { wasmBindgenImportFixture } from './tests/fixtures/wasm-bindgen-import.mjs';

const exactImports = {};

test('plan extraction tolerates unrelated wasm-bindgen placeholder imports', async () => {
  const module = new WebAssembly.Module(wasmBindgenImportFixture);
  expect(WebAssembly.Module.imports(module)).toEqual([
    {
      module: '__wbindgen_placeholder__',
      name: '__wbg_now_8b265300afd5f2b9',
      kind: 'function',
    },
    {
      module: '__wbindgen_externref_xform__',
      name: '__wbindgen_externref_table_grow',
      kind: 'function',
    },
  ]);
  await expect(WebAssembly.instantiate(module, exactImports)).rejects.toThrow(
    /__wbindgen_placeholder__/,
  );
  const instance = await WebAssembly.instantiate(
    module,
    wasmExtractionImports(exactImports),
  );
  expect(instance.exports.exact_plan()).toBe(36);
  expect(instance.exports.exact_out()).toBe(0);
});
