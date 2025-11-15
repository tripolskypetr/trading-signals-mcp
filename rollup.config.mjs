import typescript from "@rollup/plugin-typescript";
import path from "path";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: path.join("build", "index.mjs"),
        sourcemap: false,
        format: "esm",
        banner: "#!/usr/bin/env node",
      },
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        noEmit: true,
      }),
    ],
  },
];
