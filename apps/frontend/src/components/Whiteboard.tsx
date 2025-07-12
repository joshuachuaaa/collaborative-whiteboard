import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { useBoard } from '../store.ts';
import useWebSocket from '../hooks/useWebSocket.ts';
import { v4 as uuid } from 'uuid'
import './whiteboard.css'


export default function Whiteboard() {
  const { strokes, startStroke, addPoint, mergeStroke, endStroke, isDrawing, color} = useBoard();

  // ─── WebSocket ────────────────────────────────
  const { send, connected } = useWebSocket('ws://localhost:8000/ws', mergeStroke);

  // ─── Drawing timing overlay ───────────────────
  const stageRef = useRef<any>(null);
  const [avgMs, setAvgMs] = useState(0);
  const stats = useRef({ lastT: performance.now(), sum: 0, count: 0 });
  const activeId = useRef<string | null>(null);

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
      <div className='metrics'>
        {avgMs.toFixed(1)}ms&nbsp;/sample&nbsp;•&nbsp;
        {connected ? 'socket ✓' : 'socket ✗'}
      </div>

      {/* Canvas */}
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}

        onMouseDown={() => {
          activeId.current = uuid();
          const [x, y] = pointerPos();
          startStroke(activeId.current, x, y, color, 2);

          // Tell the server a new stroke started
          send({
            kind: 'stroke-start',
            stroke: { id : activeId.current, color, width: 2 },
            first: [x, y],
            });
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
          send({ kind: 'stroke-points', id: activeId.current, pts: [x, y] });
          }
        }}
        onMouseUp={() => {
          if (!activeId.current) return;
          endStroke();
          send({ kind: 'stroke-end', id: activeId.current });
          activeId.current = null;
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
