const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const plistContent = fs.readFileSync('res/common/cards.plist', 'utf-8');

function parseAllFrames(xml) {
  const frames = {};
  const framesSection = xml.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata<\/key>/);
  if (!framesSection) throw new Error('Cannot find frames section');

  const content = framesSection[1];
  const keyRegex = /<key>([^<]+\.png)<\/key>\s*<dict>\s*<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>\s*<key>offset<\/key>\s*<string>[^<]*<\/string>\s*<key>rotated<\/key>\s*<(true|false)\/>/g;

  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const [, name, x, y, w, h, rotated] = match;
    frames[name] = {
      x: parseInt(x), y: parseInt(y),
      w: parseInt(w), h: parseInt(h),
      rotated: rotated === 'true'
    };
  }
  return frames;
}

async function extractAll() {
  const frames = parseAllFrames(plistContent);
  const outputDir = 'res/common/cards';

  console.log(`Found ${Object.keys(frames).length} sprites total`);

  for (const [name, frame] of Object.entries(frames)) {
    const outputPath = path.join(outputDir, name);
    if (fs.existsSync(outputPath)) continue; // skip already extracted

    if (frame.rotated) {
      await sharp('res/common/cards.png')
        .extract({ left: frame.x, top: frame.y, width: frame.h, height: frame.w })
        .rotate(-90)
        .toFile(outputPath);
    } else {
      await sharp('res/common/cards.png')
        .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
        .toFile(outputPath);
    }
    console.log(`  Extracted: ${name} (${frame.w}x${frame.h}${frame.rotated ? ' rotated' : ''})`);
  }
  console.log('Done extracting all sprites!');
}

extractAll().catch(console.error);
