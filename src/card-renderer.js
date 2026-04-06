/**
 * Card rendering using real sprite images from composed cards
 */
import { Sprite, Texture, Container, Graphics, Assets } from 'pixi.js';

export const CARD_WIDTH = 96;
export const CARD_HEIGHT = 135;
const CARD_RADIUS = 8;

// Import all composed card images via Vite glob
const cardImageModules = import.meta.glob('../res/common/composed/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

// Build a lookup: "2_spades" -> url
const cardImageUrls = {};
for (const [path, url] of Object.entries(cardImageModules)) {
  const filename = path.split('/').pop().replace('.webp', '');
  cardImageUrls[filename] = url;
}

/**
 * Preload all card textures
 */
export async function preloadCardTextures() {
  const entries = Object.entries(cardImageUrls);
  for (const [key, url] of entries) {
    await Assets.load({ alias: `card_${key}`, src: url });
  }
}

/**
 * Create a visual card container using real sprite
 * @param {object} cardData - { value, suit }
 * @returns {Container} PixiJS container representing the card
 */
export function createCardSprite(cardData) {
  const container = new Container();
  container.cardData = cardData;

  const key = `${cardData.value}_${cardData.suit}`;
  const texture = Assets.get(`card_${key}`);

  if (texture) {
    const sprite = new Sprite(texture);
    sprite.width = CARD_WIDTH;
    sprite.height = CARD_HEIGHT;
    container.addChild(sprite);
  } else {
    // Fallback: white card
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    bg.fill({ color: 0xffffff });
    bg.stroke({ color: 0xcccccc, width: 1.5 });
    container.addChild(bg);
  }

  // Highlight overlay (hidden by default)
  const highlight = new Graphics();
  container.addChild(highlight);
  container._highlight = highlight;

  // Make interactive
  container.eventMode = 'static';
  container.cursor = 'pointer';

  return container;
}

/**
 * Draw highlight border around a card
 */
export function highlightCard(container, highlighted) {
  const hl = container._highlight;
  hl.clear();
  if (highlighted) {
    hl.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    hl.stroke({ color: 0xFFEB40, width: 4 });
  }
}
