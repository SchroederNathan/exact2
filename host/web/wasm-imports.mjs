// Plan extraction only needs Exact's imports. A wasm-bindgen dependency may
// leave unrelated adapter imports in the module; those must not make
// extraction fail before exact_plan can return the baked bytes.
const wasmBindgenNamespace = new Proxy(Object.create(null), {
  get: () => () => 0,
});

export const wasmExtractionImports = (imports) =>
  new Proxy(
    { ...imports },
    {
      get: (target, module) =>
        target[module] ??
        (typeof module === 'string' && module.startsWith('__wbindgen_')
          ? wasmBindgenNamespace
          : undefined),
    },
  );
