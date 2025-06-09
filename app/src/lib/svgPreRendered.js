import { SVG } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';

export async function createSVGJS(svgContainerElement, scene, onDragStartCallback, onDragEndCallback) {
  if (!svgContainerElement) {
    console.error("SVG.js renderer: Provided container element is null or undefined.");
    return {};
  }
  document.getElementById('update-scene-button').addEventListener('click', updateSVGItemsAndReRender);

  // Clear old SVG content
  svgContainerElement.innerHTML = '';

  function updateSVGItemsAndReRender() {
        let svgElements = draw.children()[0].children();

        const start = performance.now();

        svgElements.forEach(el => {
            if (el.type === 'rect' || el.type === 'polygon') {
              el.fill(getRandomColor());
            }
            else if (el.type === 'line') {
              el.stroke({ color: getRandomColor() });
            }
            else if (el.type === 'text') {
              el.fill(getRandomColor());
              el.text('Updated!');
            }
            else if (el.type === 'image') {
              el.opacity(Math.random()); // Example change
            }
        });

        const end = performance.now();
        console.log(`SVG.js update took ${(end - start).toFixed(2)} ms`);
    }

  const draw = SVG().addTo(svgContainerElement).size('100%', '100%');
  
  // Load an external SVG file
  fetch('/data/svg-diverse-M.svg') // CHANGE THIS FILEPATH TO MATCH DATASET
    .then(response => response.text())
    .then(svgText => {
      draw.svg(svgText)
    })
    .catch(err => {
      console.error("Failed to load SVG:", err)
    })

  return { draw };
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}