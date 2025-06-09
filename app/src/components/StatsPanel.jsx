'use client';
import { useState, useEffect } from 'react';

export default function StatsPanel({ metrics }) {
    
  const [now, setNow] = useState(0);          // force a repaint once /s

  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (v, f = 1) =>
    v === undefined ? '—' : typeof v === 'number' ? v.toFixed(f) : v;

  return (
    <div style={{
      position: 'fixed',
      top: 8, right: 8,
      background: '#000c',
      color: '#fff',
      fontSize: 12,
      lineHeight: 1.4,
      padding: '6px 8px',
      borderRadius: 4,
      zIndex: 1000,
      pointerEvents: 'none',
    }}>
      <div><b>Build&nbsp;</b>{fmt(metrics.buildTime, 0)} ms</div>
      <div><b>Idle&nbsp;FPS&nbsp;</b>{fmt(metrics.fpsIdle)}</div>
      <div><b>Drag&nbsp;FPS </b>{fmt(metrics.fpsDrag)}</div>
      <div><b>Heap&nbsp;</b>{fmt(metrics.heap, 1)} MB</div>
    </div>
  );
}