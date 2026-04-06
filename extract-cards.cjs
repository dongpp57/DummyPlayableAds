const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// Parse plist XML
const plistContent = fs.readFileSync('res/common/cards.plist', 'utf-8');

// Simple plist parser for format 2
function parsePlist(xml) {
  const frames = {};
  // Match each frame entry: <key>name</key> followed by <dict>...</dict>
  const framesSection = xml.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata<\/key>/);
  if (!framesSection) throw new Error('Cannot find frames section');

  const content = framesSection[1];
  // Split by <key> to get each sprite entry
  const keyRegex = /<key>(card_\d+_\w+\.png)<\/key>\s*<dict>\s*<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>\s*<key>offset<\/key>\s*<string>[^<]*<\/string>\s*<key>rotated<\/key>\s*<(true|false)\/>/g;

  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const [, name, x, y, w, h, rotated] = match;
    frames[name] = {
      x: parseInt(x),
      y: parseInt(y),
      w: parseInt(w),
      h: parseInt(h),
      rotated: rotated === 'true'
    };
  }
  return frames;
}

async function extractCards() {
  const frames = parsePlist(plistContent);
  const spriteSheet = sharp('res/common/cards.png');
  const metadata = await spriteSheet.metadata();

  console.log(`Sprite sheet: ${metadata.width}x${metadata.height}`);
  console.log(`Found ${Object.keys(frames).length} card sprites`);

  const outputDir = 'res/common/cards';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [name, frame] of Object.entries(frames)) {
    const outputPath = path.join(outputDir, name);

    if (frame.rotated) {
      // When rotated in TexturePacker format 2, w and h in the frame are swapped
      // The sprite is stored rotated 90 degrees clockwise in the atlas
      // So we extract with swapped dimensions, then rotate back
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

  console.log('\nDone!');
}

extractCards().catch(console.error);
