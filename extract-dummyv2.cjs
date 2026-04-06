/**
 * Extract cards from CardsV2 sprite sheet
 * Maps sprite IDs to {value}_{suit}.webp naming convention
 *
 * Dummy card ordering (to be verified):
 * Suits: clubs=1-13, diamonds=14-26, hearts=27-39, spades=40-52
 * Values: 2,3,4,5,6,7,8,9,10,J,Q,K,A (index 0-12 → ID offset 1-13)
 *
 * i.e.: 1=2♣, 2=3♣, ..., 13=A♣, 14=2♦, ..., 26=A♦, 27=2♥, ..., 52=A♠
 */
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PLIST_PATH = path.join(SCRIPT_DIR, 'dummyCard/cardsV2/CardsV2.plist');
const SPRITE_PATH = path.join(SCRIPT_DIR, 'dummyCard/cardsV2/CardsV2.png');
const OUTPUT_DIR = path.join(SCRIPT_DIR, 'res/common/composed');

const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['clubs','diamonds','hearts','spades'];

// Mapping: value-major, suit cycle clubs→diamonds→hearts→spades
// 1=2♣, 2=2♦, 3=2♥, 4=2♠, 5=3♣, ..., 52=A♠
function getCardName(spriteNum) {
  const idx = spriteNum - 1;
  const valueIdx = Math.floor(idx / 4);
  const suitIdx = idx % 4;
  return `${VALUES[valueIdx]}_${SUITS[suitIdx]}`;
}

function parsePlist(xml) {
  const frames = {};
  // Match the full frames section — use the last </dict> before <key>metadata</key>
  const metaIdx = xml.indexOf('<key>metadata</key>');
  const framesStart = xml.indexOf('<key>frames</key>');
  if (metaIdx < 0 || framesStart < 0) throw new Error('Cannot find frames section');
  const content = xml.slice(framesStart, metaIdx);

  // Match entries like: <key>1.png</key> <dict> <key>frame</key> <string>{{x,y},{w,h}}</string> ... <key>rotated</key> <true/false/>
  const keyRegex = /<key>(\d+)\.png<\/key>\s*<dict>\s*<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>\s*<key>offset<\/key>\s*<string>[^<]*<\/string>\s*<key>rotated<\/key>\s*<(true|false)\s*\/>/g;

  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const [, name, x, y, w, h, rotated] = match;
    const num = parseInt(name);
    if (num >= 1 && num <= 52) {
      frames[num] = { x: parseInt(x), y: parseInt(y), w: parseInt(w), h: parseInt(h), rotated: rotated === 'true' };
    }
  }
  return frames;
}

async function main() {
  const xml = fs.readFileSync(PLIST_PATH, 'utf-8');
  const frames = parsePlist(xml);

  console.log(`Found ${Object.keys(frames).length} card frames`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // First extract a sample to verify mapping (cards 1, 14, 27, 40 = first of each suit)
  const PREVIEW_DIR = path.join(SCRIPT_DIR, 'dummyCard/cardsV2/preview');
  if (!fs.existsSync(PREVIEW_DIR)) fs.mkdirSync(PREVIEW_DIR, { recursive: true });

  // Card dimensions for composited output
  const CARD_W = 105;
  const CARD_H = 145;
  const RADIUS = 10;

  // Special cards with yellow background (Dummy wildcards/specials)
  const SPECIAL_YELLOW = new Set(['2_clubs', 'Q_spades']);

  function makeBgSvg(bgColor) {
    return Buffer.from(`<svg width="${CARD_W}" height="${CARD_H}">
      <rect x="0" y="0" width="${CARD_W}" height="${CARD_H}" rx="${RADIUS}" ry="${RADIUS}"
            fill="${bgColor}" stroke="#888" stroke-width="1.5"/>
    </svg>`);
  }

  console.log('\nExtracting all 52 cards...');
  for (const [numStr, frame] of Object.entries(frames)) {
    const num = parseInt(numStr);
    const cardName = getCardName(num);
    const outPath = path.join(OUTPUT_DIR, `${cardName}.webp`);

    // Extract sprite (with rotation if needed)
    let spriteBuf;
    if (frame.rotated) {
      spriteBuf = await sharp(SPRITE_PATH)
        .extract({ left: frame.x, top: frame.y, width: frame.h, height: frame.w })
        .rotate(-90)
        .toBuffer();
    } else {
      spriteBuf = await sharp(SPRITE_PATH)
        .extract({ left: frame.x, top: frame.y, width: frame.w, height: frame.h })
        .toBuffer();
    }

    // Resize sprite to fit inside card with padding
    const innerPad = 4;
    const innerW = CARD_W - innerPad * 2;
    const innerH = CARD_H - innerPad * 2;
    const resizedSprite = await sharp(spriteBuf)
      .resize(innerW, innerH, { fit: 'inside' })
      .toBuffer();
    const resizedMeta = await sharp(resizedSprite).metadata();
    const offsetX = Math.floor((CARD_W - resizedMeta.width) / 2);
    const offsetY = Math.floor((CARD_H - resizedMeta.height) / 2);

    // Choose background color
    const bgColor = SPECIAL_YELLOW.has(cardName) ? '#FFE066' : '#ffffff';
    const bgSvg = makeBgSvg(bgColor);

    // Composite: bg + sprite
    await sharp(bgSvg)
      .composite([{ input: resizedSprite, left: offsetX, top: offsetY }])
      .webp({ quality: 92 })
      .toFile(outPath);

    console.log(`  ${cardName}.webp${SPECIAL_YELLOW.has(cardName) ? ' (yellow)' : ''}`);
  }
  console.log('\nDone! Cards extracted to res/common/composed/');
}

main().catch(console.error);
