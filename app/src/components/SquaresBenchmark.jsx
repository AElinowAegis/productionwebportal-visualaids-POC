'use client';
import { useEffect, useRef, useState } from 'react';
import StatsPanel from './StatsPanel';

// Dynamically import renderers
// import { createPixi } from '@/lib/pixiRenderer';

export default function SquaresBenchmark({ scenePath, datasetName, rendererType }) {
    const pixiCanvasRef = useRef(null); // For Pixi
    const konvaContainerRef = useRef(null); // For Konva
    const svgRef = useRef(null); // for svg

    const metrics = useRef({
        buildTime: undefined,
        fpsIdle: 'N/A',
        fpsDrag: undefined,
        heap: undefined,
        isUserDragging: false,
    }).current;
    const [_, forceRerender] = useState(0);

    const dragFrames = useRef(0);
    const tDragStart = useRef(0);
    const rendererRef = useRef(null);
    const rendererModule = useRef(null);

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
        }

        let worker;

        async function loadScene() {

            if (rendererType === 'konva') {
                rendererModule.current = await import('@/lib/konvaSquaresRenderer');
            } else if (rendererType == 'pixi') {
                rendererModule.current = await import('@/lib/pixiSquaresRenderer');
            } else if (rendererType == 'svg'){
                rendererModule.current = await import('@/lib/svgSquaresRenderer');
            }

            if (scenePath.endsWith('.json')) {
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
            rendererModule.current = rendererModule.current || await import('@/lib/konvaSquaresRenderer');
            createFunction = rendererModule.current.createKonva;
            targetElement = konvaContainerRef.current;
            
            if (pixiCanvasRef.current) pixiCanvasRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

            if (targetElement) targetElement.style.display = 'block';
        } else if (rendererType == 'pixi' ) { // Pixi (default)
            rendererModule.current = rendererModule.current || await import('@/lib/pixiSquaresRenderer');
            createFunction = rendererModule.current.createPixi;
            targetElement = pixiCanvasRef.current;
            
            if (konvaContainerRef.current) konvaContainerRef.current.style.display = 'none';
            if (svgRef.current) svgRef.current.style.display = 'none';

            if (targetElement) targetElement.style.display = 'block';
        } else if (rendererType == 'svg') {
            rendererModule.current = rendererModule.current || await import('@/lib/svgSquaresRenderer');
            createFunction = rendererModule.current.createSVG;
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
                metrics.heap = performance.memory?.usedJSHeapSize / 1048576;
            }
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
    }

    return (
        <>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100, color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px' }}>
                Dataset: {datasetName} {rendererType && `(${rendererType})`}
                <button type="button" id="update-scene-button">Update Scene</button>
            </div>
            
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <canvas 
                    ref={pixiCanvasRef} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: rendererType === 'pixi' ? 'block' : 'none' 
                    }}
                />
                <div 
                    ref={konvaContainerRef} 
                    id="konva-host-container" // Static ID for Konva
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: rendererType === 'konva' ? 'block' : 'none' 
                    }}
                />
                <div
                    ref={svgRef}
                    id="svg-host-container"
                    style={{
                        width:'100%',
                        height:'100%',
                        display: rendererType === 'svg' ? 'block' : 'none'
                    }}
                />
            </div>

            <StatsPanel metrics={metrics} />
        </>
    );
}