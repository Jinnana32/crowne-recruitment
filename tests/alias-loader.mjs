import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isFile(candidate) {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = path.join(root, "src", specifier.slice(2));
    const found = [`${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")].find(isFile);
    if (!found) throw new Error(`Cannot resolve ${specifier}`);
    return nextResolve(pathToFileURL(found).href, context);
  }
  return nextResolve(specifier, context);
}
