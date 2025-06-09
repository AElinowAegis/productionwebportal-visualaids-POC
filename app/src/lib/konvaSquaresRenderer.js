import Konva from 'konva';

export async function createKonva(konvaContainerElement, scene, onDragStartCallback, onDragEndCallback) {
  if (!konvaContainerElement) {
    console.error("Konva renderer: Provided container element is null or undefined.");
    return {}; // Return an empty object or handle error appropriately
  }

  document.getElementById('update-scene-button').addEventListener('click', () => {
    console.log("updating scene!");
    const start = performance.now();
    const shapes = layer.getChildren();

    shapes.forEach((shape) => {
      const newColor = getRandomColor();

      // Apply color changes
      if (shape instanceof Konva.Rect || shape instanceof Konva.RegularPolygon) {
        shape.fill(newColor);
      }
    });

    

    
    layer.batchDraw();
    const end = performance.now();
    console.log(`batchDraw UPDATE took ${end - start} ms`);
  });

  Konva.dragDistance = 0; // Attempt to make drag initiation more immediate

  // Ensure the provided container has an ID, as Konva requires it.
  // If it doesn't have one, assign a dynamic one. The ID from JSX (`konva-host-container`) should be used.
  if (!konvaContainerElement.id) {
    // This case should ideally not be hit if the JSX provides an id.
    konvaContainerElement.id = 'konva-dynamic-target-' + Date.now(); 
  }
  
  // Remove only previous Konva-generated content (the div with class .konvajs-content)
  // from *within this specific konvaContainerElement*.
  let oldKonvaContent = konvaContainerElement.querySelector('.konvajs-content');
  if (oldKonvaContent) {
    oldKonvaContent.remove();
  }

  const stage = new Konva.Stage({
    container: konvaContainerElement.id, // Use the ID of the passed-in div
    width: konvaContainerElement.clientWidth,
    height: konvaContainerElement.clientHeight,
  });

  const layer = new Konva.Layer({
    perfectDrawEnabled: false, // Performance optimization
  });
  stage.add(layer);

  let built = 0;

  // --- Layout Calculations to fit all shapes in the canvas ---
  const numShapes = scene.length;
  if (numShapes === 0) {
    return { stage, layer }; // Nothing to render
  }
  const cols = Math.ceil(Math.sqrt(numShapes));
  const rows = Math.ceil(numShapes / cols);

  const cellWidth = stage.width() / cols;
  const cellHeight = stage.height() / rows;
  const squareSide = Math.min(cellWidth, cellHeight);

  let dragTarget = null;

  scene.forEach((s, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    const rect = new Konva.Rect({
      x: col * cellWidth + (cellWidth - squareSide) / 2,
      y: row * cellHeight + (cellHeight - squareSide) / 2,
      width: squareSide,
      height: squareSide,
      fill: (typeof s.fill === 'number') ? `#${(s.fill & 0xFFFFFF).toString(16).padStart(6, '0')}` : '#FFFFFF',
      draggable: true,
      id: 'shape-' + index // For easier identification if needed
    });

    rect.on('dragstart', () => {
      dragTarget = rect;
      if (onDragStartCallback) onDragStartCallback();
    });

    rect.on('dragend', () => {
      dragTarget = null;
      if (onDragEndCallback) onDragEndCallback();
    });

    layer.add(rect);
    s.hndl = rect;
  });

  layer.batchDraw(); // Initial draw

  return {
    stage,
    layer,
  };
} 

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  return '#' + Array.from({ length: 6 })
    .map(() => letters[Math.floor(Math.random() * 16)])
    .join('');
}