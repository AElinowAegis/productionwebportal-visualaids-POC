import { SVG } from '@svgdotjs/svg.js';
import '@svgdotjs/svg.draggable.js';

export async function createSVGJS(svgContainerElement, scene, onDragStartCallback, onDragEndCallback) {
    if (!svgContainerElement) {
        console.error("SVG.js renderer: Provided container element is null or undefined.");
        return {};
    }
    document.getElementById('update-scene-button').addEventListener('click', updateSVGItemsAndReRender);
    document.getElementById('advance-dynamic').addEventListener('click', advanceDynamicContent);

    // Clear old SVG content
    svgContainerElement.innerHTML = '';

    function updateSVGItemsAndReRender() {
        let svgElements = draw.children();

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

    async function renderECAD(s){
        const start = performance.now();

        const pcb = await fetch(s.value);
        const svgTxt = await pcb.text();

        const importedPCB = dynamic.svg(svgTxt);

        // Make all elements draggable and scaleable if needed
        importedPCB.each(function () {
            this.draggable();

            // Optional: Add scroll-to-scale on each shape
            this.on('wheel', (e) => {
                e.preventDefault();

                if (!this.data('scale')) this.data('scale', 1);
                let scale = this.data('scale');
                scale *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
                this.data('scale', scale);
                this.transform({ scale: scale, transform: 'center center' });
            });
        });

        const end = performance.now();
        console.log(`SVG.js 'render ECAD' took ${(end - start).toFixed(2)} ms`);
    }

    let activityID = null;

    function renderTo(canvas, scene){
        for (let [index, s] of scene.entries()) {
            console.log(`${index} | Adding ${s.type} | `, s);

            let shape = null;

            if (s.type === 'line') {
              shape = canvas.polyline(s.points)
                .stroke({ color: s.stroke, width: s.strokeWidth })
                .move(s.x, s.y)
                .opacity(s.opacity);
            }

            else if (s.type === 'rect') {
              console.log("adding rect");
              shape = canvas.rect(s.w, s.h)
                .fill(s.fill)
                .move(s.x, s.y)
                .opacity(s.opacity);
                console.log('rect:',shape);
            }

            else if (s.type === 'text') {
              shape = canvas.text(s.value || '')
              .move(s.x, s.y)
              .font({
                size: s.fontSize || 16,
                family: s.fontFamily || 'sans-serif',
                anchor: 'start'
              })
              .fill(s.fill || '#000')
              .opacity(s.opacity);
            }

            else if (s.type === 'polygon') {
              console.log(s.points);

              shape = canvas.polygon(s.points)
                .fill(s.fill)
                .stroke({ color: s.stroke, width: s.strokeWidth })
                .move(s.x, s.y)
                .opacity(s.opacity);
            }

            else if (s.type === 'image') {
              shape = canvas.image(s.value)
              .size(s.w, s.h)
              .move(s.x, s.y)
              .opacity(s.opacity);
            }
            else if(s.type === 'ecad'){
                // render ECAD SVG here 

                renderECAD(s);

            }
            else if(s.type === 'video'){

            }


            if(shape){
                if(s.draggable){
                    shape.draggable();
                }

                if(s.scaleable){
                    console.log(shape, s.scaleable);
                    shape.on('wheel',(e) => {
                      console.log("scrolling scale!");
                      e.preventDefault();

                      if(!shape.scale)
                        shape.scale = 1;

                      shape.scale *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
                      console.log(`new scale for ${shape}: ${shape.scale}`)
                      shape.transform({ scale: shape.scale, origin: 'center center' });
                    });
                }
            }
        }
    }

    async function advanceDynamicContent(){
        dynamic.clear();

        const start = performance.now();

        dynamic.front();

        try{

            if(!activityID) {
                activityID = 1;
            }else{
                activityID++;
            }

            const res = await fetch(`/data/activity${activityID}.json`);
            const json = await res.json();  

            renderTo(dynamic, json);
        } catch (err){
            console.log(`failed to load activity ${activityID} JSON`, err);
            activityID = null;
        }
        
        const end = performance.now();
        console.log(`SVG.js 'advance dynamic content' took ${(end - start).toFixed(2)} ms`);
    } 

    function changeArrowColor(){
        let svgElements = dynamic.children();

        const start = performance.now();

        const end = performance.now();
        console.log(`SVG.js 'change arrow color' took ${(end - start).toFixed(2)} ms`);
    }

    const draw = SVG().addTo(svgContainerElement).size('100%', '100%');
    const dynamic = draw.group().id('dynamic-layer');

    const width = svgContainerElement.clientWidth;
    const height = svgContainerElement.clientHeight;
    draw.viewbox(0, 0, width, height);

    if (!scene || scene.length === 0) return { draw };

    renderTo(draw, scene);

    return { draw, dynamic };
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
}