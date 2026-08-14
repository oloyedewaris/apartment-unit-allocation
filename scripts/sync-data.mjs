import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(project, "..", "static-version");
const dataDirectory = path.join(project, "data");

await mkdir(dataDirectory, { recursive: true });
for (const file of ["apartments.json", "unit-assets.json", "plan-labels.json"]) {
  await copyFile(path.join(source, file), path.join(dataDirectory, file));
  console.log(`Copied ${file}`);
}
