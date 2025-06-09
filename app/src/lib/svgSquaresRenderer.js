import { SVG } from '@svgdotjs/svg.js'

export async function createSVG(SVGContainerElement, scene, onDragStartCallback, onDragEndCallback) {
  if (!SVGContainerElement) {
    console.error("SVG renderer: Provided container element is null or undefined.");
    return {}; // Return an empty object or handle error appropriately
  }

  document.getElementById('update-scene-button').addEventListener('click', updateSVGItemsAndReRender);

  // Ensure the provided container has an ID, as Konva requires it.
  // If it doesn't have one, assign a dynamic one. The ID from JSX (`svg-host-container`) should be used.
  if (!SVGContainerElement.id) {
    // This case should ideally not be hit if the JSX provides an id.
    SVGContainerElement.id = 'svg-dynamic-target-' + Date.now(); 
  }
  
  // Remove only previous Konva-generated content (the div with class .konvajs-content)
  // from *within this specific SVGContainerElement*.
  let oldSVGContent = SVGContainerElement.querySelector('.svgjs-content');
  if (oldSVGContent) {
    oldSVGContent.remove();
  }
  
  function updateSVGItemsAndReRender() {
    let svgElements = draw.children();

    const start = performance.now();

    svgElements.forEach(el => {
        if (el.type === 'rect' || el.type === 'polygon') {
          el.fill(getRandomColor());
        }
    });

    const end = performance.now();
    console.log(`SVG.js update took ${(end - start).toFixed(2)} ms`);
  }
  
  // draw to 'layer'

  const draw = SVG().addTo(SVGContainerElement).size('100%', '100%');
  const width = SVGContainerElement.clientWidth;
  const height = SVGContainerElement.clientHeight;
  draw.viewbox(0, 0, width, height);

  scene.forEach((s,index) => {
    draw.add(
      draw.rect(s.w, s.h)
        .fill(typeof s.fill === 'number' ? `#${(s.fill & 0xFFFFFF).toString(16).padStart(6, '0')}` : s.fill || '#FFFFFF')
        .move(s.x, s.y)
        .opacity(s.opacity)
      );
  });

  return {
    draw
  };
} 




function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}