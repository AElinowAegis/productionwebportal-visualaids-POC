// Helper function to convert ARGB hex string to RGB integer
function argbToRgbInt(argbString) {
  // Remove # if present and ensure we have 8 chars
  const hex = argbString.replace('#', '').padStart(8, '0');
  // Extract RGB part (last 6 chars) and convert to integer
  return parseInt(hex.slice(2), 16);
}

// Helper function to parse points string into array of [x,y] pairs
function parsePoints(pointsAttr) {
  if (!pointsAttr) return [];
  return pointsAttr.split(' ')
    .map(pair => pair.split(',').map(Number))
    .filter(([x, y]) => !isNaN(x) && !isNaN(y));
}

// Main parsing function
function parseVisualAidXml(xml) {
  const domParser = self.DOMParser
    ? new self.DOMParser()
    : null;                     // defensive for very old browsers

  if (!domParser)
    return [];                  // or post back an error message

  const doc = domParser.parseFromString(xml, 'application/xml');
  const scene = [];

  // Get all DesignerItem nodes
  const items = doc.getElementsByTagName('DesignerItem');
  
  for (const item of items) {
    const id = item.getAttribute('ID');
    const left = parseFloat(item.getAttribute('Left')) || 0;
    const top = parseFloat(item.getAttribute('Top')) || 0;
    const width = parseFloat(item.getAttribute('Width')) || 0;
    const height = parseFloat(item.getAttribute('Height')) || 0;

    // Look for Rectangle or Polyline in Content
    const content = item.querySelector('Content');
    if (!content) continue;

    const rect = content.querySelector('Rectangle');
    const polyline = content.querySelector('Polyline');

    if (rect) {
      const shape = {
        id,
        type: 'rect',
        x: left,
        y: top,
        w: width,
        h: height
      };

      const fill = rect.getAttribute('Fill');
      if (fill) shape.fill = argbToRgbInt(fill);

      const stroke = rect.getAttribute('Stroke');
      if (stroke) shape.stroke = argbToRgbInt(stroke);

      const strokeWidth = rect.getAttribute('StrokeThickness');
      if (strokeWidth) shape.strokeWidth = parseFloat(strokeWidth);

      scene.push(shape);
    }
    else if (polyline) {
      const points = parsePoints(polyline.getAttribute('Points'));
      if (points.length < 2) continue;

      const shape = {
        id,
        type: 'line',
        x: left,
        y: top,
        points
      };

      const stroke = polyline.getAttribute('Stroke');
      if (stroke) shape.stroke = argbToRgbInt(stroke);

      const strokeWidth = polyline.getAttribute('StrokeThickness');
      if (strokeWidth) shape.strokeWidth = parseFloat(strokeWidth);

      scene.push(shape);
    }
  }

  return scene;
}

// Worker message handler
self.onmessage = function(e) {
  if (!e.data || !e.data.xml) return;

  console.time('parseVisualAid');
  const scene = parseVisualAidXml(e.data.xml);
  console.timeEnd('parseVisualAid');

  self.postMessage({ scene });
}; 