/**
 * Card rendering using real sprite images from composed cards.
 *
 * Each scenario imports only the card image URLs it needs and registers
 * them via `registerCardTexture(key, url)` BEFORE calling `preloadCardTextures()`.
 * This lets Vite tree-shake the bundle down to only the cards used.
 */
import { Sprite, Container, Graphics, Assets } from 'pixi.js';

export const CARD_WIDTH = 96;
export const CARD_HEIGHT = 135;
const CARD_RADIUS = 8;

// Scenario-supplied map: "value_suit" → URL (base64 inlined by Vite)
const registeredCardUrls = {};

/**
 * Register a card image URL for a given key.
 * Called by each scenario's main file for the cards it needs.
 * @param {string} key e.g. '7_hearts'
 * @param {string} url imported asset URL
 */
export function registerCardTexture(key, url) {
  registeredCardUrls[key] = url;
}

/**
 * Preload all registered card textures.
 * Must be called AFTER scenario has registered its cards.
 */
export async function preloadCardTextures() {
  const entries = Object.entries(registeredCardUrls);
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
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
    bg.fill({ color: 0xffffff });
    bg.stroke({ color: 0xcccccc, width: 1.5 });
    container.addChild(bg);
  }

  const highlight = new Graphics();
  container.addChild(highlight);
  container._highlight = highlight;

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
