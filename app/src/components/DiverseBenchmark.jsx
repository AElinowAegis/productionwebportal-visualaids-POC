'use client';
import { useEffect, useRef, useState } from 'react';
import StatsPanel from './StatsPanel';

export default function DiverseBenchmark({ scenePath, datasetName, rendererType }){
    const pixiCanvasRef = useRef(null); // For Pixi
    const konvaContainerRef = useRef(null); // For Konva
    const svgRef = useRef(null); // for SVG

    const rendererRef = useRef(null);
    const rendererModule = useRef(null);

    const [_, forceRerender] = useState(0);

    const metrics = useRef({
        buildTime: undefined,
        fpsIdle: 'N/A',
        fpsDrag: undefined,
        heap: undefined,
        isUserDragging: false,
    }).current;

    useEffect(() => {

        // constrol renderer visibility
        if (rendererType === 'pixi' && pixiCanvasRef.current) {
            pixiCanvasRef.current.style.display = 'block';

            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';
            
        } else if (rendererType === 'konva' && konvaContainerRef.current) {
            konvaContainerRef.current.style.display = 'block';

            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

        } else if (rendererType === 'svg' && svgRef.current){
            svgRef.current.style.display = 'block';

            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
        } else if (rendererType === 'hybrid' && konvaContainerRef.current) {
            konvaContainerRef.current.style.display = 'block';

            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

        }

        let worker;

        async function loadScene() {

            if (rendererType === 'konva') {
                rendererModule.current = await import('@/lib/konvaRenderer');
            } else if (rendererType == "hybrid"){
                rendererModule.current = await import('@/lib/SVGKonvaRenderer');
            } else if (rendererType == 'pixi') {
                rendererModule.current = await import('@/lib/pixiRenderer');
            } else if (rendererType == 'svg'){
                rendererModule.current = await import('@/lib/svgRenderer');
            }

            if (scenePath.endsWith('.json')) {
                console.log("found scene ")
                const scene = await fetch(scenePath).then(r => r.json());
                startRenderer(scene);
            } else {
                worker = new Worker('/parser.js', { type: 'module' });
                worker.onmessage = ({ data }) => startRenderer(data.scene);
                const xml = await fetch(scenePath).then(r => r.text());
                worker.postMessage({ xml });
            }
        }

        loadScene();
        return () => worker && worker.terminate();
    }, [scenePath, rendererType]);

    const handleDragStart = () => {
        metrics.isUserDragging = true;
        dragFrames.current = 0;
        tDragStart.current = performance.now();
        metrics.fpsDrag = '-';
        forceRerender(c => c + 1);
    };

    const handleDragEnd = () => {
        metrics.isUserDragging = false;
        const dragDurationSeconds = (performance.now() - tDragStart.current) / 1000;
        if (dragDurationSeconds > 0 && dragFrames.current > 0) {
            metrics.fpsDrag = (dragFrames.current / dragDurationSeconds).toFixed(1);
        } else {
            metrics.fpsDrag = 'N/A';
        }
        forceRerender(c => c + 1);
    };

    async function startRenderer(scene) {

        const t0 = performance.now();
        
        let createFunction;
        let targetElement; 

        if (rendererType === 'konva') {
            console.log("Diverse | Using Konva renderer");

            rendererModule.current = rendererModule.current || await import('@/lib/konvaRenderer');
            createFunction = rendererModule.current.createKonva;
            targetElement = konvaContainerRef.current;
            
            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

            if (targetElement) targetElement.style.display = 'block';
        } else if(rendererType == "hybrid") {
            console.log("Diverse | Using Hybrid Konva/SVG renderer");

            rendererModule.current = rendererModule.current || await import('@/lib/SVGKonvaRenderer');
            createFunction = rendererModule.current.createHybrid;
            targetElement = konvaContainerRef.current;
            
            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

            if (targetElement) targetElement.style.display = 'block';
        } else if (rendererType == 'pixi' ) { // Pixi (default)
            console.log("Diverse | Using PixiJS renderer");

            rendererModule.current = rendererModule.current || await import('@/lib/pixiRenderer');
            createFunction = rendererModule.current.createPixi;
            targetElement = pixiCanvasRef.current;
            
            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

            if (targetElement) targetElement.style.display = 'block';
        } else if (rendererType == 'svg') {
            console.log("Diverse | Using SVG renderer");

            rendererModule.current = rendererModule.current || await import('@/lib/svgRenderer');
            createFunction = rendererModule.current.createSVGJS;
            targetElement = svgRef.current;

            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
            if (targetElement) targetElement.style.display = 'block';
        } else if (rendererType == 'svgpre'){
            console.log("Diverse | Using SVG pre-rendered img");

            rendererModule.current = rendererModule.current || await import('@/lib/svgPreRendered');
            createFunction = rendererModule.current.createSVGJS;
            targetElement = svgRef.current;

            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
            if (targetElement) targetElement.style.display = 'block';
        }

        if (!targetElement) {
            console.error(`Target element for ${rendererType} renderer is not available.`);
            metrics.buildTime = -1;
            forceRerender(c => c + 1);
            return;
        }
        if (!createFunction) {
            console.error(`Create function for ${rendererType} renderer is not available.`);
            metrics.buildTime = -1;
            forceRerender(c => c + 1);
            return;
        }

        const renderer = await createFunction(targetElement, scene, handleDragStart, handleDragEnd);
        rendererRef.current = renderer;
        metrics.buildTime = performance.now() - t0;
        forceRerender(c => c + 1);

        function loop(now) {
            if (metrics.isUserDragging) {
                dragFrames.current++;
            }

            if (rendererRef.current) {
                if (rendererType === 'pixi' && rendererRef.current.app) {
                    rendererRef.current.app.render();
                } else if (rendererType === 'konva' && rendererRef.current.layer) {
                    rendererRef.current.layer.batchDraw();
                }
                else if(rendererType == 'svg' && rendererRef.current){
                    // svg render
                }else if(rendererType == 'svgpre' && rendererRef.current){
                    // svg pre render
                }

                metrics.heap = performance.memory?.usedJSHeapSize / 1048576;
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    async function rerenderChangesTest(scene){
        console.log("Performing re-render test");
    
        if (rendererRef.current) {
            if (rendererType === 'pixi' && rendererRef.current.app) {
                rendererRef.current.app.UpdateItemsAndReRender();
            } else if (rendererType === 'konva' && rendererRef.current.layer) {
                rendererRef.current.layer.UpdateItemsAndReRender();
            }
            else if(rendererType == 'svg' && rendererRef.current){
                rendererRef.current.UpdateItemsAndReRender();
            }else if(rendererType == 'svgpre' && rendererRef.current){
                renderRef.current.UpdateItemsAndReRender();
            }
            metrics.heap = performance.memory?.usedJSHeapSize / 1048576;
        }

        const renderer = await createFunction(targetElement, scene, handleDragStart, handleDragEnd);
        rendererRef.current = renderer;
        metrics.buildTime = performance.now() - t0;
    }

    return (
        <>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px' }}>
                Dataset: {datasetName} {rendererType && `(${rendererType})`}
                <button type="button" id="update-scene-button">Update Scene</button>
                <button type="button" id="advance-dynamic">Next Activity</button>
                <button type="button" id="change-arrow-color">Change Arrow Color</button>
                <button type="button" id="play-video">Play</button>
                <button type="button" id="pause-video">Pause</button>
            </div>
            
            <div style={{ width: '100%', height: '100%', position: 'relative', border:'4px solid black' }}>
                <canvas 
                    ref={pixiCanvasRef} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: rendererType === 'pixi' ? 'block' : 'none', 
                        border: "2px solid blue"
                    }}
                />
                <div 
                    ref={konvaContainerRef} 
                    id="konva-host-container" // Static ID for Konva
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: "2px solid red",
                        display: rendererType === 'konva' ? 'block' : 'none' 
                    }}
                />
                <div
                    ref={svgRef}
                    id="svg-host-container"
                    style={{
                        width:'100%',
                        height:'100%',
                        border: "2px solid green",
                        display: rendererType === 'svg' ? 'block' : 'none'
                    }}
                />
            </div>

            <StatsPanel metrics={metrics} />
        </>
    );
}