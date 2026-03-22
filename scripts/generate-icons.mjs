import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'products', 'bengalpng.png');
const SIZES = [180, 192, 512];
const CROP = { left: 0, top: 0, width: 250, height: 120 };
// Scale factor: 0.55 = logo is 55% of icon size (smaller 'b', more padding). Range 0.4-0.7.
const LOGO_SCALE = 0.55;

async function main() {
  console.log('Reading Bengal Welding logo from local file...');
  const logoBuffer = fs.readFileSync(LOGO_PATH);

  for (const size of SIZES) {
    const outputPath = path.join(PUBLIC_DIR, `icon-${size}.png`);
    const logoSize = Math.round(size * LOGO_SCALE);
    await sharp(logoBuffer)
      .extract(CROP)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer()
      .then((resized) =>
        sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
          },
        })
          .composite([{ input: resized, gravity: 'center' }])
          .png()
          .toFile(outputPath)
      );
    console.log(`Created icon-${size}.png`);
  }
  console.log('Done!');
}

main().catch(console.error);
