import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const manifestPath = fileURLToPath(new URL('./src/image-manifest.json', import.meta.url));

function pictureTags() {
  return {
    name: 'motoyuna-picture-tags',
    transformIndexHtml(html) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      return html.replace(/<img\s+data-pic="([\w-]+)"([^>]*)>/g, (match, name, rest) => {
        const m = manifest[name];
        if (!m) throw new Error(`data-pic "${name}" not found in image-manifest.json`);
        const srcset = m.widths.map((w) => `img/${name}-${w}.webp ${w}w`).join(', ');
        const fallback = m.widths.find((w) => w >= 1080) ?? m.widths[m.widths.length - 1];
        const height = Math.round((m.h / m.w) * 1000);
        return `<img src="img/${name}-${fallback}.webp" srcset="${srcset}" width="1000" height="${height}" style="--dominant:${m.dominant}"${rest}>`;
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [pictureTags()],
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
