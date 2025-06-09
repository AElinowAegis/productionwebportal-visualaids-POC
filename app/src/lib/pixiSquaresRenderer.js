import * as PIXI from 'pixi.js';

export async function createPixi(canvas, scene, onDragStartCallback, onDragEndCallback) {
  const app = new PIXI.Application();
  await app.init({ canvas, background: 0xffffff, antialias: false, autoDensity: true }); 
  app.ticker.stop();

  const tex = PIXI.Texture.WHITE;
  let built = 0;

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  let dragTarget = null;
  let dragOffset = new PIXI.Point();

  document.getElementById('update-scene-button').addEventListener('click', () => {
    console.log("updating scene!");
    const start = performance.now();

    app.stage.children.forEach(rect => {
      rect.tint = getRandomColor();
    });

    const end = performance.now();
    console.log(`pixi UPDATE took ${end - start} ms`);
  });

  // --- Layout Calculations to fit all sprites in the canvas --- 
  const numSprites = scene.length;
  if (numSprites === 0) {
    return { app }; // Nothing to render
  }
  const cols = Math.ceil(Math.sqrt(numSprites));
  const rows = Math.ceil(numSprites / cols);
  
  // Calculate cell dimensions
  const cellWidth = app.screen.width / cols;
  const cellHeight = app.screen.height / rows;
  
  // Determine the side length for the square (to ensure it's a square)
  const squareSide = Math.min(cellWidth, cellHeight);

  function onSpritePointerDown(event) {
    dragTarget = this;
    const localPos = event.getLocalPosition(this.parent);
    dragOffset.set(localPos.x - this.x, localPos.y - this.y);
    app.stage.addChild(this);
    app.stage.on('pointermove', onDragMove);
    app.stage.on('pointerup', onDragEnd);
    app.stage.on('pointerupoutside', onDragEnd);
    if (onDragStartCallback) onDragStartCallback();
  }

  function onDragMove(event) {
    if (dragTarget) {
      const newPosition = event.global;
      dragTarget.x = newPosition.x - dragOffset.x;
      dragTarget.y = newPosition.y - dragOffset.y;
    }
  }

  function onDragEnd() {
    if (dragTarget) {
      app.stage.off('pointermove', onDragMove);
      app.stage.off('pointerup', onDragEnd);
      app.stage.off('pointerupoutside', onDragEnd);
      dragTarget = null;
      if (onDragEndCallback) onDragEndCallback();
    }
  }

  await new Promise(resolve => {
    function addChunk() {
      const CHUNK = 2000; // Keep chunking for potentially large scenes
      const end = Math.min(built + CHUNK, scene.length);

      for (; built < end; built++) {
        const s = scene[built];
        const obj = new PIXI.Sprite(tex);

        obj.tint = (typeof s.fill === 'number') ? (s.fill & 0xFFFFFF) : 0xFFFFFF;
        
        // Set sprite to be a square using squareSide
        obj.width = squareSide;
        obj.height = squareSide;

        // Add performance optimizations for static rectangles
        obj.roundPixels = true;  // Optimize pixel rendering for static content

        const col = built % cols;
        const row = Math.floor(built / cols);

        // Center the square within its grid cell
        obj.x = col * cellWidth + (cellWidth - squareSide) / 2;
        obj.y = row * cellHeight + (cellHeight - squareSide) / 2;
        
        s.hndl = obj;

        obj.eventMode = 'static';
        obj.cursor = 'pointer';
        obj.on('pointerdown', onSpritePointerDown);

        app.stage.addChild(obj);
      }
      if (built < scene.length) {
        requestAnimationFrame(addChunk);
      } else {
        resolve();
      }
    }
    addChunk();
  });

  await new Promise(r => requestAnimationFrame(r));

  return {
    app,
  };
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  return '#' + Array.from({ length: 6 })
    .map(() => letters[Math.floor(Math.random() * 16)])
    .join('');
}