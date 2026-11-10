const leb = (value) => {
  const bytes = [];
  do {
    const next = value & 0x7f;
    value >>>= 7;
    bytes.push(next | (value ? 0x80 : 0));
  } while (value);
  return bytes;
};
const string = (value) => [...leb(value.length), ...Buffer.from(value)];
const section = (id, body) => [id, ...leb(body.length), ...body];

// A tiny plan carrier with the wasm-bindgen import emitted by a dependent
// module. Its exports are enough to exercise build.mjs's extraction step.
const importBody = [
  2,
  ...string('__wbindgen_placeholder__'),
  ...string('__wbg_now_8b265300afd5f2b9'),
  0,
  1,
  ...string('__wbindgen_externref_xform__'),
  ...string('__wbindgen_externref_table_grow'),
  0,
  0,
];
const typeBody = [2, 0x60, 0, 1, 0x7f, 0x60, 0, 1, 0x7c];
const functionBody = [2, 0, 0];
const memoryBody = [1, 0, 1];
const exportBody = [
  3,
  ...string('memory'),
  2,
  0,
  ...string('exact_plan'),
  0,
  2,
  ...string('exact_out'),
  0,
  3,
];
const codeBody = [2, 4, 0, 0x41, 36, 0x0b, 4, 0, 0x41, 0, 0x0b];

export const wasmBindgenImportFixture = Buffer.from([
  0,
  0x61,
  0x73,
  0x6d,
  1,
  0,
  0,
  0,
  ...section(1, typeBody),
  ...section(2, importBody),
  ...section(3, functionBody),
  ...section(5, memoryBody),
  ...section(7, exportBody),
  ...section(10, codeBody),
]);
