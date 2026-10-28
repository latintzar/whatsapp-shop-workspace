# What is vendored here, and under what licence

| File | What it is | Licence |
|---|---|---|
| `three.slim.module.js` | three.js r169, tree-shaken to `entry.js`'s export list | MIT — `LICENSE` |
| `loaders.module.js` | three.js r169 `examples/jsm` GLTFLoader + DRACOLoader (+ the one function GLTFLoader takes from BufferGeometryUtils) | MIT — `LICENSE` |
| `draco/draco_wasm_wrapper.js` | Google Draco, the glTF decoder build's JS wrapper | Apache-2.0 |
| `draco/draco_decoder.wasm` | Google Draco, the glTF decoder build's WebAssembly module | Apache-2.0 |

Draco: https://github.com/google/draco — Copyright 2016 The Draco Authors, licensed under the
Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0). The two files are the
`examples/jsm/libs/draco/gltf/` builds shipped inside the same three.js release, copied byte for
byte; `DRACOLoader.setDecoderPath('/peru/vendor/three/draco/')` is what points at them.

The handset's own model and its CC BY 4.0 credit live next to it, in
`../../handset/model/CREDITS.md`; the page's footer carries the author and the licence.
