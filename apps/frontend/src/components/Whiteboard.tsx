import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { useBoard } from '../store';
import useWebSocket from '../hooks/useWebSocket';

export default function Whiteboard() {
  const { strokes, startStroke, addPoint, endStroke, isDrawing } = useBoard();

  // ─── WebSocket ────────────────────────────────
  const { send, connected } = useWebSocket('ws://localhost:8000/ws');

  // ─── Drawing timing overlay ───────────────────
  const stageRef = useRef<any>(null);
  const [avgMs, setAvgMs] = useState(0);
  const stats = useRef({ lastT: performance.now(), sum: 0, count: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      if (stats.current.count) {
        setAvgMs(stats.current.sum / stats.current.count);
        stats.current.sum = stats.current.count = 0;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pointerPos = () => {
    const stage = stageRef.current;
    const p = stage?.getPointerPosition() ?? { x: 0, y: 0 };
    return [p.x, p.y] as [number, number];
  };

  return (
    <>
      {/* Overlay: timing + socket status */}
      <div style={{
        position: 'fixed', top: 8, left: 8, zIndex: 10,
        padding: '4px 8px', background: 'rgba(0,0,0,.6)',
        color: '#fff', fontFamily: 'monospace', borderRadius: 4,
      }}>
        {avgMs.toFixed(1)}ms&nbsp;/sample&nbsp;•&nbsp;
        {connected ? 'socket ✓' : 'socket ✗'}
      </div>

      {/* Canvas */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={() => {
          const [x, y] = pointerPos();
          startStroke(x, y, '#1e40af', 2);
          stats.current.lastT = performance.now();

          // Tell the server a new stroke started
          send({ type: 'stroke-start', x, y });
        }}
        onMouseMove={() => {
          if (isDrawing == true){
            const [x, y] = pointerPos();
          addPoint(x, y);

          const now = performance.now();
          stats.current.sum += now - stats.current.lastT;
          stats.current.count += 1;
          stats.current.lastT = now;

          // Stream points to the server (optional – comment out if too chatty)
          send({ type: 'stroke-point', x, y });

          }
        }}
        onMouseUp={() => {
          endStroke();
          send({ type: 'stroke-end' });
        }}
      >
        <Layer>
          {Object.values(strokes).map(s => (
            <Line
              key={s.id}
              points={s.points}
              stroke={s.color}
              strokeWidth={s.width}
              tension={0.5}
              lineCap="round"
              listening={false}
            />
          ))}
        </Layer>
      </Stage>
    </>
  );
}
