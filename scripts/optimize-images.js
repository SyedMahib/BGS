#!/usr/bin/env node

/**
 * BGS Image Optimizer
 * -------------------
 * Converts local /Assets/ images to WebP format.
 * Keeps original files as fallback.
 *
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'Assets');
const QUALITY = 80;
const MAX_WIDTH = 1920;

// Images to skip (already WebP or too small to matter)
const SKIP_PATTERNS = [
  '.webp',        // Already WebP
  '.svg',         // Vector - no optimization needed
];

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath, ext);
  const outputWebP = path.join(ASSETS_DIR, `${basename}.webp`);

  // Skip if already WebP or SVG
  if (SKIP_PATTERNS.includes(ext)) {
    console.log(`⏭  Skipping (already optimal): ${path.basename(filePath)}`);
    return null;
  }

  // Skip if WebP already exists
  if (fs.existsSync(outputWebP)) {
    console.log(`⏭  Skipping (WebP exists): ${path.basename(filePath)}`);
    return null;
  }

  try {
    const metadata = await sharp(filePath).metadata();
    const originalSize = fs.statSync(filePath).size;

    let pipeline = sharp(filePath);

    // Resize if width exceeds MAX_WIDTH (maintain aspect ratio)
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    // Convert to WebP
    await pipeline
      .webp({ quality: QUALITY, effort: 4 })
      .toFile(outputWebP);

    const webpSize = fs.statSync(outputWebP).size;
    const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(`✅ ${path.basename(filePath)} → ${basename}.webp`);
    console.log(`   ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (${savings}% smaller)`);

    return { original: filePath, webp: outputWebP, savings };
  } catch (err) {
    console.error(`❌ Error processing ${path.basename(filePath)}:`, err.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  console.log('🖼  BGS Image Optimizer');
  console.log('========================\n');

  const files = fs.readdirSync(ASSETS_DIR);
  const imageFiles = files.filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });

  console.log(`Found ${imageFiles.length} images to optimize\n`);

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of imageFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    const result = await optimizeImage(filePath);
    if (result) {
      totalOriginal += fs.statSync(result.original).size;
      totalOptimized += fs.statSync(result.webp).size;
    }
  }

  console.log('\n========================');
  if (totalOriginal > 0) {
    const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
    console.log(`\n📊 Summary:`);
    console.log(`   Original: ${formatBytes(totalOriginal)}`);
    console.log(`   Optimized: ${formatBytes(totalOptimized)}`);
    console.log(`   Saved: ${formatBytes(totalOriginal - totalOptimized)} (${totalSavings}%)`);
  }
  console.log('\n✨ Done! Original files preserved as fallback.');
}

main().catch(console.error);
