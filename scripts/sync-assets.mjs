import { cp, link, lstat, mkdir, rm, symlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(project, "..", "static-version");
const publicDirectory = path.join(project, "public");

await mkdir(publicDirectory, { recursive: true });

async function replaceLink(name, type = "dir") {
  const from = path.join(source, name);
  const to = path.join(publicDirectory, name);
  try {
    const current = await lstat(to);
    if (current) await rm(to, { recursive: true, force: true });
  } catch {}
  if (type === "file") await link(from, to);
  else await symlink(from, to, process.platform === "win32" ? "junction" : "dir");
  console.log(`Linked public/${name}`);
}

for (const directory of ["assets", "plans", "textures", "unit-assets"]) await replaceLink(directory);
await replaceLink("volta-skai.glb", "file");

const threeLibraries = path.join(project, "node_modules", "three", "examples", "jsm", "libs");
const vendorDirectory = path.join(publicDirectory, "vendor");
await rm(vendorDirectory, { recursive: true, force: true });
await mkdir(vendorDirectory, { recursive: true });
await cp(path.join(threeLibraries, "draco", "gltf"), path.join(vendorDirectory, "draco"), { recursive: true });
await cp(path.join(threeLibraries, "basis"), path.join(vendorDirectory, "basis"), { recursive: true });
console.log("Copied local Three.js decoder runtimes");
