import { transformSync } from "esbuild";

export function process(src, filename) {
  if (/\.(ts|tsx|js|jsx)$/.test(filename)) {
    const result = transformSync(src, {
      loader: filename.endsWith(".tsx") || filename.endsWith(".jsx") ? "tsx" : "ts",
      format: "cjs",
      target: "es2020",
      jsx: "automatic",
    });
    return { code: result.code };
  }
  return src;
}

export default { process };
