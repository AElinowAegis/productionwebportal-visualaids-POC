import SquaresBenchmark from '@/components/SquaresBenchmark';
import DiverseBenchmark from '@/components/DiverseBenchmark';

export default async function Home({ searchParams }) {
    const validSquaresDatasets = ['s', 'm', 'l'];
    let datasetKey = await searchParams?.dataset?.toLowerCase();
    const validDiverseDatasets = ['diverse-s','diverse-m','example', 'diverse-VA'];

    const validRenderers = ['pixi', 'konva','svg','svgpre', 'hybrid'];
    let rendererType = await searchParams?.renderer?.toLowerCase() || 'hybrid';

    const validBenchmarks = ['squares','diverse'];
    let benchmarkType = await searchParams?.benchmarkType?.toLowerCase() || 'diverse';

    if (!validRenderers.includes(rendererType)) {
        rendererType = 'hybrid';
    }
    if(!validBenchmarks.includes(benchmarkType)){
        benchmarkType = 'diverse';
    }

    if(benchmarkType == 'squares'){
        if (!validSquaresDatasets.includes(datasetKey)) {
            datasetKey = 'm'; 
        }
    }
    else if (benchmarkType == 'diverse'){
        if(!validDiverseDatasets.includes(datasetKey)){
            datasetKey = 'example';
        }
    }

    console.log('Render test parameters: ',rendererType, benchmarkType, datasetKey);

    const scenePath = `/data/scene-${datasetKey}.json`;

    if(benchmarkType == 'diverse'){
        return (
            <main style={{ width: 'calc(100dvw - 20px)', height: 'calc(100dvh - 20px)', margin: 0, padding: 0 }}>
                <DiverseBenchmark scenePath={scenePath} datasetName={datasetKey} rendererType={rendererType} />
            </main>
        );
    } else if(benchmarkType == 'squares'){
        return (
            <main style={{ width: 'calc(100dvw - 20px)', height: 'calc(100dvh - 20px)', margin: 0, padding: 0 }}>
                <SquaresBenchmark scenePath={scenePath} datasetName={datasetKey} rendererType={rendererType} />
            </main>
        );
    }
}