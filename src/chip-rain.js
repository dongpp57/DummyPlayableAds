/**
 * Chip rain effect - gold chips falling from the top of the screen
 * Uses effect_chip_rain.png sprite sheet (8 frames)
 */
import { Container, Sprite, Texture, Rectangle, Assets } from 'pixi.js';
import chipSheetUrl from '../res/common/effect_chip_rain.png?url';

// Frame data from plist
const FRAMES = [
  { x: 2, y: 2, w: 103, h: 92 },
  { x: 107, y: 2, w: 93, h: 92 },
  { x: 2, y: 96, w: 61, h: 91 },
  { x: 65, y: 96, w: 47, h: 92 },
  { x: 114, y: 96, w: 48, h: 91 },
  { x: 164, y: 96, w: 61, h: 91 },
  { x: 2, y: 190, w: 93, h: 92 },
  { x: 97, y: 190, w: 103, h: 92 },
];

export async function createChipRain(app, gameWidth, gameHeight) {
  const baseTex = await Assets.load(chipSheetUrl);
  const textures = FRAMES.map(f =>
    new Texture({ source: baseTex.source, frame: new Rectangle(f.x, f.y, f.w, f.h) })
  );

  // Top-most container - ensure it's above everything
  const container = new Container();
  container.zIndex = 9999;
  app.stage.sortableChildren = true;
  app.stage.addChild(container);

  const CHIP_COUNT = 100;
  const FLOOR_Y = gameHeight - 60;
  const GRAVITY = 1.0;
  const BOUNCE_DAMPING = 0.5;
  const chips = [];

  for (let i = 0; i < CHIP_COUNT; i++) {
    const tex = textures[Math.floor(Math.random() * textures.length)];
    const chip = new Sprite(tex);
    const s = 0.8 + Math.random() * 0.4;
    chip.scale.set(s);
    chip.anchor.set(0.5);
    chip.x = Math.random() * gameWidth;
    chip.y = -chip.height;
    chip.visible = false;
    chip.rotation = Math.random() * Math.PI * 2;

    chip._delay = i * 30 + Math.random() * 30; // stagger appearance
    chip._elapsed = 0;
    chip._started = false;
    chip._vy = 14 + Math.random() * 10;
    chip._rotSpeed = (Math.random() - 0.5) * 0.12;
    chip._swaySpeed = 1 + Math.random() * 2;
    chip._swayAmp = 15 + Math.random() * 30;
    chip._startX = chip.x;
    chip._time = Math.random() * Math.PI * 2;
    chip._bounces = 0;
    chip._settled = false;
    // Animate frame
    chip._frameTime = 0;
    chip._frameInterval = 80 + Math.random() * 60;
    chip._textures = textures;
    chip._frameIdx = Math.floor(Math.random() * textures.length);

    container.addChild(chip);
    chips.push(chip);
  }

  const tickFn = () => {
    const dt = app.ticker.deltaMS;

    chips.forEach(chip => {
      if (chip._settled) return;

      // Delay before appearing
      chip._elapsed += dt;
      if (!chip._started) {
        if (chip._elapsed < chip._delay) return;
        chip._started = true;
        chip.visible = true;
      }

      // Gravity
      chip._vy += GRAVITY;
      chip.y += chip._vy;

      // Sway (only while falling down)
      if (chip._bounces === 0) {
        chip._time += dt / 1000;
        chip.x = chip._startX + Math.sin(chip._time * chip._swaySpeed) * chip._swayAmp;
      }
      chip.rotation += chip._rotSpeed;

      // Bounce off floor then fall off screen
      if (chip._bounces === 0 && chip.y >= FLOOR_Y) {
        chip.y = FLOOR_Y;
        chip._vy = -(12 + Math.random() * 8); // bounce up
        chip._bounces = 1;
        chip._rotSpeed *= 1.5;
        chip._startX = chip.x;
      }

      // After bounce, once off screen, mark settled
      if (chip._bounces > 0 && chip.y > gameHeight + 100) {
        chip._settled = true;
        chip.visible = false;
      }

      // Animate sprite frame
      chip._frameTime += dt;
      if (chip._frameTime >= chip._frameInterval) {
        chip._frameTime = 0;
        chip._frameIdx = (chip._frameIdx + 1) % chip._textures.length;
        chip.texture = chip._textures[chip._frameIdx];
      }
    });
  };
  app.ticker.add(tickFn);
}
