const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const CARDS_DIR = 'res/common/cards';
const OUTPUT_DIR = 'res/common/composed';

// rank index -> rank name for file naming
const RANK_NAMES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

// suit config: name, color (for number sprite), suit icon file, face card file (if applicable)
const SUITS = [
  { name: 'spades',   color: 'black', icon: 'card_spade_black.png' },
  { name: 'hearts',   color: 'red',   icon: 'card_heart_red.png' },
  { name: 'diamonds', color: 'red',   icon: 'card_diamond_red.png' },
  { name: 'clubs',    color: 'black', icon: 'card_club_black.png' },
];

// Face card center images (rank index -> file)
const FACE_CARDS = {
  9:  'card_jack.png',   // J
  10: 'card_queen.png',  // Q
  11: 'card_king.png',   // K
};

async function composeCard(rankIdx, suit) {
  const bg = path.join(CARDS_DIR, 'card_front_side_small.png');
  const numberFile = path.join(CARDS_DIR, `card_${rankIdx}_${suit.color}.png`);
  const suitIconFile = path.join(CARDS_DIR, suit.icon);

  const bgMeta = await sharp(bg).metadata();
  const cardW = bgMeta.width;  // 81
  const cardH = bgMeta.height; // 113

  // Prepare composites
  const composites = [];

  // Padding from edges
  const padLeft = 5;
  const padTop = 5;

  // 1. Number sprite - top-left, scaled ~0.9x
  const numOrigBuf = await sharp(numberFile).toBuffer();
  const numOrigMeta = await sharp(numOrigBuf).metadata();
  const numScale = 0.9;
  const numW = Math.round(numOrigMeta.width * numScale);
  const numH = Math.round(numOrigMeta.height * numScale);
  const numBuf = await sharp(numOrigBuf)
    .resize(numW, numH, { fit: 'fill' })
    .toBuffer();
  composites.push({
    input: numBuf,
    left: padLeft,
    top: padTop,
  });

  // 2. Small suit icon below number
  const suitSmallSize = 17;
  const suitSmallBuf = await sharp(suitIconFile)
    .resize(suitSmallSize, suitSmallSize, { fit: 'inside' })
    .toBuffer();
  const suitSmallMeta = await sharp(suitSmallBuf).metadata();
  composites.push({
    input: suitSmallBuf,
    left: padLeft + Math.floor((numW - suitSmallMeta.width) / 2),
    top: padTop + numH + 1,
  });

  // 3. Large image - bottom-right corner
  const padRight = 5;
  const padBottom = 5;
  const faceFile = FACE_CARDS[rankIdx];
  if (faceFile) {
    const facePath = path.join(CARDS_DIR, faceFile);
    const faceBuf = await sharp(facePath)
      .resize(55, 64, { fit: 'inside' })
      .toBuffer();
    const faceMeta = await sharp(faceBuf).metadata();
    composites.push({
      input: faceBuf,
      left: cardW - faceMeta.width - padRight,
      top: cardH - faceMeta.height - padBottom,
    });
  } else {
    // Large suit icon bottom-right
    const suitBigSize = 55;
    const suitBigBuf = await sharp(suitIconFile)
      .resize(suitBigSize, suitBigSize, { fit: 'inside' })
      .toBuffer();
    const suitBigMeta = await sharp(suitBigBuf).metadata();
    composites.push({
      input: suitBigBuf,
      left: cardW - suitBigMeta.width - padRight,
      top: cardH - suitBigMeta.height - padBottom,
    });
  }

  // Compose final card
  const rankName = RANK_NAMES[rankIdx];
  const outputName = `${rankName}_${suit.name}.png`;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  await sharp(bg)
    .composite(composites)
    .toFile(outputPath);

  return outputName;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let count = 0;
  for (const suit of SUITS) {
    for (let rank = 0; rank < 13; rank++) {
      const name = await composeCard(rank, suit);
      count++;
      console.log(`  Composed: ${name}`);
    }
  }
  console.log(`\nDone! ${count} cards composed to ${OUTPUT_DIR}/`);
}

main().catch(console.error);
