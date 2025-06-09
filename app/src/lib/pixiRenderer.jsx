import * as PIXI from 'pixi.js';
 
export async function createPixi(canvasElement, sceneData) {
  console.log("createPixi");

  const app = new PIXI.Application();
  await app.init({
    canvas: canvasElement,
    width: canvasElement.clientWidth,
    height: canvasElement.clientHeight,
    backgroundColor: 0xffffff, // White background
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
 
  const container = new PIXI.Container();
  app.stage.addChild(container);
 
  console.log(sceneData.length);

  sceneData.forEach((s, index) => {
    console.log(` Adding ${s.type} | `,s);

      switch (s.type) {
        case 'rect':
          drawRectangle(container, s);
          break;
        case 'polygon':
          drawPolygon(container, s);
          break;
        case 'line':
          drawLine(container, s);
          break;
        case 'text':
          drawText(container, s);
          break;
        case 'image':
          // PIXI.Assets.load returns a promise
          const texture = PIXI.Assets.load(s.value);
          drawImage(container, s, texture);
          break;
        default:
          console.warn('Unknown element type:', s.type);
      }
  })
 
  // Handle resize
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      app.renderer.resize(width, height);
      // You might want to re-layout or re-scale elements here
    }
  });
  resizeObserver.observe(canvasElement.parentElement || canvasElement);
 
 
  return {
    destroy: () => {
      resizeObserver.disconnect();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    },
    app: app // Exposing app for potential further direct manipulations
  };
}
 
function drawRectangle(container, element) {
  const graphics = new PIXI.Graphics();
  if (element.fill) {
    graphics.fill(element.fill); // Hex color, e.g., 0xFF0000 for red
  }
  if (element.stroke && element.strokeWidth) {
    graphics.stroke({ width: element.strokeWidth, color: element.stroke});
  }
  graphics.rect(element.x, element.y, element.w, element.h);
  graphics.fill(); // Ensure fill is applied if specified
  container.addChild(graphics);
}

function drawPolygon(container, element) {
  const graphics = new PIXI.Graphics();

  // Begin stroke
  if (element.stroke && element.strokeWidth) {
    graphics.stroke({
      width: element.strokeWidth,
      color: element.stroke,
      alpha: element.opacity ?? 1
    });
  }

  // Begin fill
  if (element.fill !== undefined) {
    graphics.fill({
      color: element.fill
    });
  }

  let x = element.x;
  let y = element.y;

  graphics.moveTo(x, y);
  // Draw polygon
  graphics.moveTo(element.points[0]+x, element.points[1]+y);
  for (let i = 2; i < element.points.length; i += 2) {
    graphics.lineTo(element.points[i]+x, element.points[i + 1]+y);
  }
  graphics.closePath();

  graphics.endFill(); // ignore the 'depracated' warning msg. If this is removed, the shape won't be rendered for some reason
  container.addChild(graphics);
}
 
function drawLine(container, element) {
  const graphics = new PIXI.Graphics();
  if (element.stroke && element.strokeWidth) {
    // PIXI.Graphics.path requires moveTo for the first point, then lineTo for subsequent points
    graphics.moveTo(element.points[0], element.points[1]);
    for (let i = 2; i < element.points.length; i += 2) {
      graphics.lineTo(element.points[i], element.points[i + 1]);
    }
     graphics.stroke({ width: element.strokeWidth, color: element.stroke });
 
  }
  container.addChild(graphics);
}
 
function drawText(container, element) {
  const pixiText = new PIXI.Text({
    text: element.text, 
    style:{
      fill: element.fill,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily
    }
  });
  pixiText.x = element.x;
  pixiText.y = element.y;
  pixiText.width = element.w;
  pixiText.height = element.h;
  container.addChild(pixiText);
}
 
async function drawImage(container, element, texture) {
  const sprite = new PIXI.Sprite(texture);
  sprite.x = element.x;
  sprite.y = element.y;
  if (element.width) sprite.width = element.width;
  if (element.height) sprite.height = element.height;
  // You might want to add anchor, rotation, etc. based on element properties
  container.addChild(sprite);
}