import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const BRAND_MARK_PATH = path.join(__dirname, '../assets/brand/haradan-mark.png');
const PUBLIC_DIR = path.join(__dirname, '../public');
const ASSETS_DIR = path.join(__dirname, '../assets');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const sourceBuffer = fs.readFileSync(BRAND_MARK_PATH);
const sourcePng = PNG.sync.read(sourceBuffer);

console.log(`Loaded brand mark: ${sourcePng.width}x${sourcePng.height}`);

function createIcon(size: number, bgHex = '#0d1117', logoScalePercent = 0.62): PNG {
  const icon = new PNG({ width: size, height: size, filterType: -1 });

  // Parse background color
  const rBg = parseInt(bgHex.slice(1, 3), 16);
  const gBg = parseInt(bgHex.slice(3, 5), 16);
  const bBg = parseInt(bgHex.slice(5, 7), 16);

  // Fill background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      icon.data[idx] = rBg;
      icon.data[idx + 1] = gBg;
      icon.data[idx + 2] = bBg;
      icon.data[idx + 3] = 255;
    }
  }

  // Calculate logo target size and position
  const maxTargetWidth = Math.round(size * logoScalePercent);
  const maxTargetHeight = Math.round(size * logoScalePercent);

  const srcAspect = sourcePng.width / sourcePng.height;
  let targetWidth = maxTargetWidth;
  let targetHeight = Math.round(maxTargetWidth / srcAspect);

  if (targetHeight > maxTargetHeight) {
    targetHeight = maxTargetHeight;
    targetWidth = Math.round(maxTargetHeight * srcAspect);
  }

  const offsetX = Math.round((size - targetWidth) / 2);
  const offsetY = Math.round((size - targetHeight) / 2);

  // Bilinear interpolation scaling & alpha blending
  for (let dy = 0; dy < targetHeight; dy++) {
    for (let dx = 0; dx < targetWidth; dx++) {
      const srcX = (dx / targetWidth) * (sourcePng.width - 1);
      const srcY = (dy / targetHeight) * (sourcePng.height - 1);

      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, sourcePng.width - 1);
      const y1 = Math.min(y0 + 1, sourcePng.height - 1);

      const wx = srcX - x0;
      const wy = srcY - y0;

      const idx00 = (sourcePng.width * y0 + x0) << 2;
      const idx10 = (sourcePng.width * y0 + x1) << 2;
      const idx01 = (sourcePng.width * y1 + x0) << 2;
      const idx11 = (sourcePng.width * y1 + x1) << 2;

      for (let c = 0; c < 4; c++) {
        const top = sourcePng.data[idx00 + c] * (1 - wx) + sourcePng.data[idx10 + c] * wx;
        const bottom = sourcePng.data[idx01 + c] * (1 - wx) + sourcePng.data[idx11 + c] * wx;
        const val = top * (1 - wy) + bottom * wy;

        const targetX = offsetX + dx;
        const targetY = offsetY + dy;

        if (targetX >= 0 && targetX < size && targetY >= 0 && targetY < size) {
          const destIdx = (size * targetY + targetX) << 2;

          if (c === 3) {
            // Alpha blend logo over background
            const alpha = val / 255;
            const prevR = icon.data[destIdx];
            const prevG = icon.data[destIdx + 1];
            const prevB = icon.data[destIdx + 2];

            // Horse logo pixels in source are white (or dark)
            // If source pixel alpha > 0, blend white (255, 255, 255) onto dark bg
            icon.data[destIdx] = Math.round(prevR * (1 - alpha) + 255 * alpha);
            icon.data[destIdx + 1] = Math.round(prevG * (1 - alpha) + 255 * alpha);
            icon.data[destIdx + 2] = Math.round(prevB * (1 - alpha) + 255 * alpha);
            icon.data[destIdx + 3] = 255;
          }
        }
      }
    }
  }

  return icon;
}

function savePng(png: PNG, filePath: string) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Saved: ${path.relative(process.cwd(), filePath)} (${png.width}x${png.height})`);
}

// Generate all required size variants
savePng(createIcon(512), path.join(PUBLIC_DIR, 'icon-512.png'));
savePng(createIcon(192), path.join(PUBLIC_DIR, 'icon-192.png'));
savePng(createIcon(180), path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
savePng(createIcon(180), path.join(PUBLIC_DIR, 'apple-touch-icon-precomposed.png'));
savePng(createIcon(32), path.join(PUBLIC_DIR, 'icon-32.png'));
savePng(createIcon(32), path.join(PUBLIC_DIR, 'favicon.png'));

// Assets directory for Expo app icons
savePng(createIcon(512), path.join(ASSETS_DIR, 'icon.png'));
savePng(createIcon(512), path.join(ASSETS_DIR, 'adaptive-icon.png'));
savePng(createIcon(32), path.join(ASSETS_DIR, 'favicon.png'));

console.log('Icon generation completed successfully!');
