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
