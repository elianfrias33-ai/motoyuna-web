import sharp from 'sharp';
import { mkdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = (f) => path.join(root, 'raw', f);
const out = (f) => path.join(root, 'public', f);

const RED = { r: 230, g: 27, b: 31 };
const PHOTO_WIDTHS = [640, 1080, 1600, 2200];

// name, source, optional crop {left, top, width, height} in source pixels
const photos = [
  ['hero-equipo', 'Deu67DyiXLF.jpg'],
  ['kymco-rs-gris', 'De5Mz0ziWh0.jpg'],
  ['kymco-rs-rojo', 'De0DPaOCfeS.jpg'],
  ['kymco-rs-azul', 'Deu6l71iceo.jpg'],
  ['honda-negra', 'De2oYQ2iZJj.jpg'],
  ['honda-plata', 'Dexad-hiRgV.jpg'],
  ['yamaha-gear-promo', 'Dezz3ShJDuD.jpg'],
  ['yamaha-gear-showroom', 'Dez0OPapro-.jpg'],
  ['yamaha-blanca', 'DewxJ19xxel.jpg', { left: 0, top: 0, width: 1290, height: 2347 }],
  ['suzuki-lets', 'DeuqIW6pSM-.jpg', { left: 0, top: 400, width: 720, height: 880 }],
  ['hijet-cliente', 'Deu2VfspdoG.jpg'],
  ['hijet-importada', 'De4q0gSJOHZ.jpg', { left: 0, top: 345, width: 720, height: 535 }],
];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function optimizePhotos() {
  await mkdir(out('img'), { recursive: true });
  const manifest = {};
  for (const [name, src, crop] of photos) {
    let base = sharp(raw(src)).rotate();
    if (crop) base = base.extract(crop);
    const buf = await base.toBuffer();
    const meta = await sharp(buf).metadata();
    const widths = PHOTO_WIDTHS.filter((w) => w < meta.width).concat(meta.width <= 2200 ? [meta.width] : []);
    const uniq = [...new Set(widths)].sort((a, b) => a - b);
    for (const w of uniq) {
      await sharp(buf).resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(out(`img/${name}-${w}.webp`));
    }
    const { dominant } = await sharp(buf).stats();
    manifest[name] = { w: meta.width, h: meta.height, widths: uniq, dominant: `rgb(${dominant.r},${dominant.g},${dominant.b})` };
    console.log(name, meta.width, 'x', meta.height, uniq.join(','));
  }
  return manifest;
}

// Honda press shots carry a white caption band at the bottom; keep only the photo
const PRODUCT_CROP_HEIGHT = { 'honda-supercub-50': 2600, 'honda-lead-100': 1230, 'honda-dio-50': 1160 };
// only manufacturer / official-distributor imagery; never another dealer's own photos
const PRODUCT_EXCLUDE = new Set([]);
const EXCLUDED_SOURCES = ['luismlabreumotors.com'];

async function optimizeProducts() {
  const dirs = [raw('products'), raw('products/pass2')];
  await mkdir(out('img/products'), { recursive: true });
  const result = {};
  for (const dir of dirs) {
    const manifestPath = path.join(dir, 'manifest.json');
    if (!(await exists(manifestPath))) continue;
    const list = JSON.parse(await readFile(manifestPath, 'utf8'));
    const items = Array.isArray(list) ? list : list.found || list.items || [];
    for (const it of items) {
      if (PRODUCT_EXCLUDE.has(it.slug) || result[it.slug]) continue;
      if (EXCLUDED_SOURCES.some((d) => `${it.pageUrl} ${it.sourceUrl}`.includes(d))) continue;
      const src = path.join(dir, it.file);
      if (!(await exists(src))) continue;
      let img = sharp(src).rotate();
      const meta0 = await img.metadata();
      if (PRODUCT_CROP_HEIGHT[it.slug]) img = img.extract({ left: 0, top: 0, width: meta0.width, height: Math.min(PRODUCT_CROP_HEIGHT[it.slug], meta0.height) });
      let buf = await img.flatten({ background: '#ffffff' }).toBuffer();
      // studio shots on a grey sweep fill the card; white/transparent ones float on white
      const { data } = await sharp(buf).extract({ left: 4, top: 4, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true });
      const corner = data.reduce((s, v) => s + v, 0) / data.length;
      const cover = corner < 236;
      if (!cover) buf = await sharp(buf).trim({ threshold: 12 }).toBuffer();
      else {
        // pad the studio sweep to the card's 4:4.2 ratio by repeating edge pixels, so nothing gets cropped
        const m = await sharp(buf).metadata();
        const extra = Math.max(0, Math.round((m.width * 4.2) / 4) - m.height);
        if (extra) buf = await sharp(buf).extend({ top: Math.floor(extra / 2), bottom: Math.ceil(extra / 2), extendWith: 'copy' }).toBuffer();
      }
      const meta = await sharp(buf).metadata();
      const target = Math.min(1200, meta.width);
      await sharp(buf).resize({ width: target }).webp({ quality: 82 }).toFile(out(`img/products/${it.slug}.webp`));
      result[it.slug] = { w: target, h: Math.round((meta.height * target) / meta.width), cover, confidence: it.confidence };
      console.log('product', it.slug, meta.width, 'x', meta.height, cover ? 'cover' : 'contain', it.confidence);
    }
  }
  return result;
}

async function logoMask(left, width, file, trim = true) {
  const { data, info } = await sharp(raw('../public/brand/motoyuna-blanco.png'))
    .extract({ left, top: 0, width, height: 197 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < data.length; i++) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = data[i];
  }
  let img = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (trim) img = sharp(await img.png().toBuffer()).trim();
  await img.png({ compressionLevel: 9 }).toFile(out(`brand/${file}`));
  const m = await sharp(out(`brand/${file}`)).metadata();
  console.log('mask', file, m.width, 'x', m.height);
  return { w: m.width, h: m.height };
}

async function brandAssets(manifest) {
  const logos = {
    full: await logoMask(0, 2000, 'logo-mask.png'),
    moto: await logoMask(0, 966, 'logo-moto.png', false),
    yuna: await logoMask(968, 1032, 'logo-yuna.png', false),
    m: await logoMask(0, 515, 'logo-m.png'),
  };

  const tint = async (file, color, width) =>
    sharp({ create: { width: logos[file].w, height: logos[file].h, channels: 4, background: { ...color, alpha: 1 } } })
      .composite([{ input: out(`brand/logo-${file === 'full' ? 'mask' : file}.png`), blend: 'dest-in' }])
      .png()
      .toBuffer()
      .then((b) => sharp(b).resize({ width }).png().toBuffer());

  // favicon: brand-red tile with the white "M" glyph
  const fav = 512;
  const glyph = await tint('m', { r: 255, g: 255, b: 255 }, 330);
  const gm = await sharp(glyph).metadata();
  const tile = await sharp({ create: { width: fav, height: fav, channels: 4, background: { ...RED, alpha: 1 } } })
    .composite([{ input: glyph, left: Math.round((fav - gm.width) / 2), top: Math.round((fav - gm.height) / 2) }])
    .png()
    .toBuffer();
  const rounded = Buffer.from(`<svg width="${fav}" height="${fav}"><rect width="${fav}" height="${fav}" rx="112" ry="112"/></svg>`);
  const favicon = await sharp(tile).composite([{ input: rounded, blend: 'dest-in' }]).png().toBuffer();
  await sharp(favicon).toFile(out('favicon-512.png'));
  await sharp(favicon).resize(180).flatten({ background: RED }).toFile(out('apple-touch-icon.png'));
  await sharp(favicon).resize(48).toFile(out('favicon-48.png'));
  await sharp(favicon).resize(32).toFile(out('favicon-32.png'));

  // Open Graph card 1200x630: hero photo, dark gradient, red logo
  const W = 1200, H = 630;
  const photo = await sharp(raw('Deu67DyiXLF.jpg')).resize({ width: W, height: H, fit: 'cover', position: 'attention' }).toBuffer();
  const shade = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0a0a" stop-opacity="0.15"/><stop offset="0.55" stop-color="#0a0a0a" stop-opacity="0.55"/><stop offset="1" stop-color="#0a0a0a" stop-opacity="0.95"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>` +
      `<text x="64" y="${H - 64}" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="2">MOTOS · PASOLAS · FINANCIAMIENTO PROPIO · BONAO, RD</text></svg>`
  );
  const ogLogo = await tint('full', { r: 255, g: 255, b: 255 }, 760);
  await sharp(photo)
    .composite([{ input: shade }, { input: ogLogo, left: 64, top: H - 64 - 46 - 92 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out('og-image.jpg'));
  console.log('favicon + og-image done');
  manifest.__logos = logos;
}

const manifest = await optimizePhotos();
manifest.__products = await optimizeProducts();
await brandAssets(manifest);
await (await import('node:fs/promises')).writeFile(path.join(root, 'src', 'image-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('manifest written');
