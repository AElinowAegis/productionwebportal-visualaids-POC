import Konva from 'konva';
import { SVG } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';

export async function createHybrid(hybridContainerElement, scene, onDragStartCallback, onDragEndCallback) {
  if (!hybridContainerElement) {
    console.error("Hybrid renderer: Provided container element is null or undefined.");
    return {}; // Return an empty object or handle error appropriately
}

console.log("adding update scene listener");
document.getElementById('update-scene-button').addEventListener('click', () => {
    console.log("updating scene!");
    const start = performance.now();
    const shapes = dynamiclayer.getChildren();

    shapes.forEach((shape) => {
      const newColor = getRandomColor();

      // Apply color changes
      if (shape instanceof Konva.Rect || shape instanceof Konva.RegularPolygon) {
        shape.fill(newColor);
    }

    if (shape instanceof Konva.Line) {
        shape.stroke(newColor);
    }

    if (shape instanceof Konva.Text) {
        shape.fill(newColor);
        shape.text("Updated!");
    }

    if (shape instanceof Konva.Image) {
        shape.stroke(newColor); // Optional visual update
    }
});

    dynamiclayer.batchDraw();
    const end = performance.now();
    console.log(`batchDraw ARROW-COLOR took ${end - start} ms`);
});

console.log("Loading rendering");
function renderTo(layer, items){
    items.forEach((s,index) => {

    console.log(`${index} | Adding ${s.type} | `,s);

    if(s.type == 'line'){
        let ln = new Konva.Line({
          x: s.x,
          y: s.y,
          width: s.w,
          height: s.h,
          opacity: s.opacity,
          points: s.points,
          stroke: s.stroke,
          name: s.name,
          scaleable: s.scaleable,
          strokeWidth: s.strokeWidth,
          id: 'item-' + index // For easier identification if needed
      });
        ln.draggable = s.draggable;
        ln.scaleable = s.scaleable;
        layer.add(ln);
    }else if(s.type == 'rect'){
        let rect = new Konva.Rect({
          x: s.x,
          y: s.y,
          name: s.name,
          width: s.w,
          opacity: s.opacity,
          height: s.h,
          fill: (typeof s.fill === 'number') ? `#${(s.fill & 0xFFFFFF).toString(16).padStart(6, '0')}` : s.fill,
          stroke: s.stroke,
          strokeWidth: s.strokeWidth,
          draggable: s.draggable,
          scaleable: s.scaleable,
          id: 'item-' + index // For easier identification if needed
      });
        rect.scaleable = s.scaleable;
        layer.add(rect);
    }
    else if(s.type == 'text'){
        let txt = new Konva.Text({
          x: s.x,
          y: s.y,
          name: s.name,
          width: s.w,
          height: s.h,
          text: s.value,
          fontSize: s.fontSize,
          fontFamily: s.fontFamily,
          opacity: s.opacity,
          fill: s.fill,
          stroke: s.stroke,
          draggable: s.draggable,
          scaleable: s.scaleable,
          id: 'item-' + index // For easier identification if needed
      });
        txt.scaleable = s.scaleable;
        layer.add(txt);
    }
    else if(s.type == "polygon"){
        let poly = new Konva.RegularPolygon({
          x: s.x,
          y: s.y,
          name: s.name,
          width: s.w,
          height: s.h,
          fill: s.fill,
          stroke: s.stroke,
          opacity: s.opacity,
          draggable: s.draggable,
          id: 'item-' + index, // For easier identification if needed
          sides: s.sides,
          radius: s.radius,
          strokeWidth: s.strokeWidth
      });
        poly.scaleable = s.scaleable;
        layer.add(poly);
    }
    else if(s.type == "image"){
        console.log("rendering img");
        Konva.Image.fromURL(s.value, function (img) {
            img.setAttrs({
                x: s.x,
                y: s.y,
                name: s.name,
                width: s.w,
                height: s.h,
                fill: s.fill,
                opacity: s.opacity,
                stroke: s.stroke,
            id: 'item-' + index, // For easier identification if needed
        });
            img.draggable(true);
            img.scaleable = s.scaleable;
            console.log(`img ${ img.scaleable ? 'is' : 'is not' } scaleable`);

            layer.add(img);
        });
    }
    else if(s.type == 'ecad'){
        console.log("rendering ECAD");
        // render ECAD SVG
        Konva.Image.fromURL(s.value, function (img) {
                img.setAttrs({
                    x: s.x,
                    y: s.y,
                    name: s.name,
                    width: s.width,
                    height: s.height,
                    scale: {x: s.scaleX, y: s.scaleY},
                    fill: s.fill,
                    opacity: s.opacity,
                    id: s.id // For easier identification if needed
                });
                img.draggable(true);
                img.scaleable = true;

                dynamiclayer.add(img);
            });
    }
    else if(s.type == 'video'){
        console.log('loading Video');

        // create buttons
        const width = window.innerWidth;
        const height = 300; 

        const video = document.createElement('video');
        video.src =
          s.value;

        const videoImg = new Konva.Image({
          image: video,
          draggable: s.draggable,
          x: 50,
          y: 20,
        });
        videoImg.scaleable = s.scaleable;
        dynamiclayer.add(videoImg);

        const text = new Konva.Text({
          text: 'Loading video...',
          width: stage.width(),
          height: stage.height(),
          align: 'center',
          verticalAlign: 'middle',
        });
        dynamiclayer.add(text);

        const anim = new Konva.Animation(function () {
          // do nothing, animation just needs to update the layer
        }, dynamiclayer);

        video.addEventListener('loadedmetadata', function () {
          text.text('Press PLAY...');
          videoImg.width(video.videoWidth);
          videoImg.height(video.videoHeight);
        });

        document.getElementById('play-video').addEventListener('click', function () {
          text.destroy();
          video.play();
          anim.start();
        });
        document.getElementById('pause-video').addEventListener('click', function () {
          video.pause();
          anim.stop();
        });
    }   
    });
}

    console.log("adding event listener for changing arrow color");
    document.getElementById('change-arrow-color')
        .addEventListener('click', () => {
          console.log("updating arrow color");
          const start = performance.now();
          const shapes = dynamiclayer.find('.arrow');

          shapes.forEach((shape) => {
            const newColor = shape.attrs.stroke == 'green' ? 'red' : 'green';

            if (shape instanceof Konva.Line) {
              shape.stroke(newColor);
          }

        });

          dynamiclayer.batchDraw();
          const end = performance.now();
          console.log(`batchDraw ARROW-COLOR took ${end - start} ms`);
        });


  Konva.dragDistance = 0; // Attempt to make drag initiation more immediate

    // Ensure the provided container has an ID, as Konva requires it.
    // If it doesn't have one, assign a dynamic one. The ID from JSX (`konva-host-container`) should be used.
    if (!hybridContainerElement.id) {
        // This case should ideally not be hit if the JSX provides an id.
        hybridContainerElement.id = 'konva-dynamic-target-' + Date.now(); 
    }

      // Remove only previous Konva-generated content (the div with class .konvajs-content)
      // from *within this specific konvaContainerElement*.
    let oldKonvaContent = hybridContainerElement.querySelector('.konvajs-content');
    if (oldKonvaContent) {
        oldKonvaContent.remove();
    }

    const stage = new Konva.Stage({
        container: hybridContainerElement.id, // Use the ID of the passed-in div
        width: hybridContainerElement.clientWidth,
        height: hybridContainerElement.clientHeight,
    });

    const baselayer = new Konva.Layer({
        perfectDrawEnabled: false, // Performance optimization
    });
    const dynamiclayer = new Konva.Layer({
        perfectDrawEnabled: false
    });

    let activityID = null;

    console.log("adding event listener for advancing activity");
    document.getElementById('advance-dynamic')
        .addEventListener('click', async () => {
            console.log("advancing activity");
            const start = performance.now();
            dynamiclayer.destroyChildren();

            try{

                if(!activityID) {
                    activityID = 1;
                }else{
                    activityID++;
                }

                const res = await fetch(`/data/activity${activityID}.json`);
                const json = await res.json();  

                renderTo(dynamiclayer, json);

            }catch(err){
                console.log(`failed to load activity ${activityID} JSON`, err);
                activityID = null;
            }

            if(!activityID){
                activityID = 0;
            }

            dynamiclayer.batchDraw();
            const end = performance.now();
            console.log(`batchDraw ADVANCE ACTIVITY took ${end - start} ms`);
        });

    let svglayer = SVG().addTo(hybridContainerElement).size('100%', '100%');
    const width = hybridContainerElement.clientWidth;
    const height = hybridContainerElement.clientHeight;
    svglayer.viewbox(0, 0, width, height);
    svglayer.node.style.position = 'absolute';
    svglayer.node.style.top = '-190px';
    svglayer.node.style.zIndex = '-1';
    
    stage.add(baselayer);
    stage.add(dynamiclayer);

    let built = 0;

      // --- Layout Calculations to fit all shapes in the canvas ---
    const numItems = scene.length;
    if (numItems === 0) {
        return { stage, baselayer, dynamicLayer }; // Nothing to render
    }

    // draw to 'baselayer'
    // static SVG background
    let start = performance.now();
    
    const bg = await fetch('/data/img/hybrid-bg1.svg');
    const svgTxt = await bg.text();

    const bgStatic = svglayer.svg(svgTxt);

    let end = performance.now();
    console.log(`hybrid SVG background rendering took ${end - start} ms`);

    //renderTo(baselayer, scene);


    function scaleHandler(layer, e){
        e.evt.preventDefault();

        //scrollToScale(baselayer, pointer);

        const pointer = stage.getPointerPosition();
        const shapeAtPointer = layer.getIntersection(pointer);

        if(shapeAtPointer && shapeAtPointer.scaleable){
            if(!shapeAtPointer.scaleFactor) shapeAtPointer.scaleFactor = 1;

            // Get current scale
            const currentScale = shapeAtPointer.scaleX(); // assuming uniform scale
            const factor = 1.1;
            const direction = e.evt.deltaY < 0 ? 1 : -1;
            const newScale = direction > 0 ? currentScale * factor : currentScale / factor;

            let box = shapeAtPointer.getClientRect();
            let centerX = box.x + box.width / 2;
            let centerY = box.y + box.height / 2;

            shapeAtPointer.scale({ x: newScale, y: newScale });

            box = shapeAtPointer.getClientRect();
            let newCenterX = box.x + box.width / 2;
            let newCenterY = box.y + box.height / 2;

            let dx = centerX - newCenterX;
            let dy = centerY - newCenterY;
            shapeAtPointer.position({
                x: shapeAtPointer.x() + dx,
                y: shapeAtPointer.y() + dy
            });

            //re-render layer
            layer.batchDraw();

        }else{
          console.log(`shape is not scaleable`);
        
            if(shapeAtPointer)
                console.log(shapeAtPointer);
        }
    }

    baselayer.on('wheel', (e) => scaleHandler(baselayer, e));
    dynamiclayer.on('wheel', (e) => scaleHandler(dynamiclayer, e));


    console.log("Hybrid Konva/SVG setup complete.");

    start = performance.now();
    baselayer.batchDraw();
    end = performance.now();
    console.log(`batchDraw INITIAL took ${end - start} ms`);

    return {
        svglayer,
        stage, 
        dynamiclayer
    };
} 


function getRandomColor() {
  const letters = '0123456789ABCDEF';
  return '#' + Array.from({ length: 6 })
  .map(() => letters[Math.floor(Math.random() * 16)])
  .join('');
}

export async function UpdateItemsAndReRender(){

  const textItems = layer.find('Text');
  textItems.forEach((txt, index) => {
    txt.text = "Changed!";
});

  const lineItems = layer.find('Line');
  lineItems.forEach((line, index) => {
    line.stroke = "red";
});

  // polygons

  // image

  layer.draw();

}