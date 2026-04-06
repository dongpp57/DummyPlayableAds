/**
 * Drag and drop handler for card swapping
 * Drag a card and drop on another to swap positions
 * Supports both flat layout (style 2) and fan layout (style 3/4)
 */
import { highlightCard, CARD_WIDTH, CARD_HEIGHT } from './card-renderer.js';

let cardSlotMap = new Map();
let slotCardMap = new Map();
let dragging = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragStartX = 0;
let dragStartY = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let allCards = [];
let allSlots = [];
let onSwapCallback = null;
let isFanLayout = false;

export function initDragAndDrop(cards, slots, onSwap) {
  allCards = cards;
  allSlots = slots;
  onSwapCallback = onSwap;
  isFanLayout = slots.some(s => s.rotation || s.scale);

  cards.forEach((card, index) => {
    cardSlotMap.set(card, index);
    slotCardMap.set(index, card);

    card.on('pointerdown', (e) => onDragStart(card, e));
  });

  // Listen on stage for move/up
  const stage = cards[0]?.parent;
  if (stage) {
    stage.eventMode = 'static';
    stage.hitArea = { contains: () => true };
    stage.on('pointermove', onDragMove);
    stage.on('pointerup', onDragEnd);
    stage.on('pointerupoutside', onDragEnd);
  }
}

function getSlotPos(slot) {
  if (isFanLayout) {
    const s = slot.scale || 1;
    return { x: slot.x + CARD_WIDTH * s / 2, y: slot.y + CARD_HEIGHT * s };
  }
  return { x: slot.x, y: slot.y };
}

function getSlotCenter(slot) {
  if (isFanLayout) {
    const s = slot.scale || 1;
    return { x: slot.x + CARD_WIDTH * s / 2, y: slot.y + CARD_HEIGHT * s / 2 };
  }
  return { x: slot.x + CARD_WIDTH / 2, y: slot.y + CARD_HEIGHT / 2 };
}

function onDragStart(card, e) {
  dragging = card;

  const pos = e.getLocalPosition(card.parent);
  dragOffsetX = card.x - pos.x;
  dragOffsetY = card.y - pos.y;
  dragStartX = card.x;
  dragStartY = card.y;

  // Bring to front
  const parent = card.parent;
  parent.removeChild(card);
  parent.addChild(card);
}

function onDragMove(e) {
  if (!dragging) return;
  const pos = e.getLocalPosition(dragging.parent);
  lastPointerX = pos.x;
  lastPointerY = pos.y;
  dragging.x = pos.x + dragOffsetX;
  dragging.y = pos.y + dragOffsetY;
}

function onDragEnd() {
  if (!dragging) return;

  const card = dragging;
  dragging = null;

  // Find closest card to pointer position
  let closestCard = null;
  let closestDist = Infinity;

  allCards.forEach((other) => {
    if (other === card) return;
    if (other.eventMode === 'none') return;
    const slotIdx = cardSlotMap.get(other);
    const slot = allSlots[slotIdx];
    const center = getSlotCenter(slot);
    const dist = Math.sqrt((lastPointerX - center.x) ** 2 + (lastPointerY - center.y) ** 2);
    if (dist < closestDist) {
      closestDist = dist;
      closestCard = other;
    }
  });

  // Swap if dropped close enough
  const s = allSlots[0].scale || 1;
  if (closestCard && closestDist < CARD_WIDTH * s * 1.5) {
    swapCards(card, closestCard);
  } else {
    // Snap back
    const slotIdx = cardSlotMap.get(card);
    const slotData = allSlots[slotIdx];
    const target = getSlotPos(slotData);
    animateCardTo(card,
      target.x,
      target.y,
      slotData.rotation || 0,
      () => { applySlotTransform(card, slotData); reorderZIndex(); }
    );
  }
}

function swapCards(cardA, cardB) {
  const slotA = cardSlotMap.get(cardA);
  const slotB = cardSlotMap.get(cardB);

  cardSlotMap.set(cardA, slotB);
  cardSlotMap.set(cardB, slotA);
  slotCardMap.set(slotA, cardB);
  slotCardMap.set(slotB, cardA);

  const slotAData = allSlots[slotA];
  const slotBData = allSlots[slotB];

  const targetB = getSlotPos(slotBData);
  const targetA = getSlotPos(slotAData);

  console.log(`[swap] slotA=${slotA}(${slotAData.x.toFixed(1)},${slotAData.y}) slotB=${slotB}(${slotBData.x.toFixed(1)},${slotBData.y}) targetA=(${targetA.x.toFixed(1)},${targetA.y}) targetB=(${targetB.x.toFixed(1)},${targetB.y})`);
  animateCardTo(cardA,
    targetB.x,
    targetB.y,
    slotBData.rotation || 0,
    () => { applySlotTransform(cardA, slotBData); reorderZIndex(); console.log(`[animDone A] x=${cardA.x.toFixed(1)} y=${cardA.y.toFixed(1)} scale=${cardA.scale.x}`); }
  );
  animateCardTo(cardB,
    targetA.x,
    targetA.y,
    slotAData.rotation || 0,
    () => { applySlotTransform(cardB, slotAData); console.log(`[animDone B] x=${cardB.x.toFixed(1)} y=${cardB.y.toFixed(1)} scale=${cardB.scale.x}`); }
  );

  if (onSwapCallback) onSwapCallback();
}


/** Re-sort card z-order by slot index (row order) */
function reorderZIndex() {
  const parent = allCards[0]?.parent;
  if (!parent) return;
  const sorted = [...allCards].sort((a, b) => cardSlotMap.get(a) - cardSlotMap.get(b));
  sorted.forEach((card) => {
    parent.removeChild(card);
    parent.addChild(card);
  });
}

/** Apply slot transform to a card */
function applySlotTransform(card, slot) {
  if (isFanLayout) {
    const s = slot.scale || 1;
    card.scale.set(s);
    card.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT);
    card.x = slot.x + CARD_WIDTH * s / 2;
    card.y = slot.y + CARD_HEIGHT * s;
    card.rotation = slot.rotation || 0;
  } else {
    const s = slot.scale || 1;
    if (s !== 1) card.scale.set(s);
    card.x = slot.x;
    card.y = slot.y;
    card.rotation = 0;
  }
}

function animateCardTo(card, targetX, targetY, targetRotation, onComplete) {
  const startX = card.x;
  const startY = card.y;
  const startRotation = card.rotation;
  const duration = 200;
  const startTime = Date.now();

  function tick() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    card.x = startX + (targetX - startX) * ease;
    card.y = startY + (targetY - startY) * ease;
    card.rotation = startRotation + (targetRotation - startRotation) * ease;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else if (onComplete) {
      onComplete();
    }
  }

  requestAnimationFrame(tick);
}

export function getCardSlotIndex(card) {
  return cardSlotMap.get(card) ?? -1;
}

export function resetSelection() {}
