export function createStockfish() {
  const wasmSupported =
    typeof WebAssembly === "object" &&
    WebAssembly.validate(
      Uint8Array.of(
        0x0,
        0x61,
        0x73,
        0x6d,
        0x01,
        0x00,
        0x00,
        0x00
      )
    );

  const workerPath = wasmSupported
    ? "/stockfish/stockfish.wasm.js"
    : "/stockfish/stockfish.js";

  const worker = new Worker(workerPath);

  return worker;
}