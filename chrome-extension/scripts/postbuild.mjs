import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");

mkdirSync(dist, { recursive: true });

// Copy manifest into dist
copyFileSync(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));

// Fix popup HTML script path (Vite emits absolute /popup.js)
const popupHtml = resolve(dist, "src/popup/index.html");
if (existsSync(popupHtml)) {
  let html = readFileSync(popupHtml, "utf8");
  html = html.replace(/src="\/popup\.js"/g, 'src="../../popup.js"');
  html = html.replace(/src="\.\/popup\.js"/g, 'src="../../popup.js"');
  writeFileSync(popupHtml, html);
}

// Minimal 16x16 PNG placeholder (indigo square)
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const pngBuffer = Buffer.from(PNG_BASE64, "base64");

mkdirSync(resolve(dist, "icons"), { recursive: true });
for (const size of ["16", "48", "128"]) {
  writeFileSync(resolve(dist, "icons", `icon${size}.png`), pngBuffer);
}

console.log("Extension postbuild complete: manifest and assets copied to dist/");
