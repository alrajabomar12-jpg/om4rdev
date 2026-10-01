// Generates app/icon.png, app/apple-icon.png and app/opengraph-image.png from the logo.
// Run: node scripts/generate-brand-assets.mjs (outputs are committed; rerun if the logo changes).
import sharp from "sharp";

const LOGO = "public/brand/om4r-logo.png";
const BG = { r: 5, g: 7, b: 13, alpha: 1 };

// The "o" of the wordmark is the mark: crop it, pad it square on the page background.
const MARK = { left: 30, top: 270, width: 350, height: 360 };
// The wordmark is italic and the "o" touches the "m": a slanted cut keeps only the "o".
const MARK_CLIP = `<svg width="350" height="360"><polygon points="0,0 336,0 244,360 0,360" fill="#fff"/></svg>`;

async function icon(size, out, radius) {
  const inner = Math.round(size * 0.86);
  const clipped = await sharp(LOGO).extract(MARK).composite([{ input: Buffer.from(MARK_CLIP), blend: "dest-in" }]).png().toBuffer();
  const mark = await sharp(clipped).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`);
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: "center" }, { input: mask, blend: "dest-in" }])
    .png()
    .toFile(out);
}

async function og() {
  const W = 1200, H = 630;
  const logo = await sharp(LOGO).resize(860).toBuffer();
  const glow = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#1e8cff" stop-opacity=".35"/><stop offset="1" stop-color="#05070d" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>` +
      `<text x="50%" y="540" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="40" font-weight="600" fill="#9aa6c4">Roblox 3D Modeler &amp; Builder</text></svg>`,
  );
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite([{ input: glow }, { input: logo, top: 140, left: Math.round((W - 860) / 2) }])
    .png({ compressionLevel: 9 })
    .toFile("app/opengraph-image.png");
}

await icon(64, "app/icon.png", 14);
await icon(180, "app/apple-icon.png", 0);
await og();
console.log("brand assets written");
