// src/components/Whiteboard.tsx
import { Stage, Layer, Line } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';

import { useBoard, type Stroke } from '../store/store.ts';  // Zustand store
import { bus } from '../bus.ts';                            // single event bus
import './whiteboard.css';

export default function Whiteboard() {
  /* ---------- reactive state from the store ---------- */
  const {
    strokes,          // Record<string, Stroke>
    ownerId,          // my ID (needed in stroke-start payload)
    isDrawing,
    startStroke,
    addPoint,
    endStroke,
    color,
    width,            // current brush width
    connected,        // socket status (socketService writes this)
  } = useBoard();

  /* ---------- perf-overlay local state ---------- */
  const stageRef = useRef<any>(null);
  const activeId = useRef<string | null>(null);
  const [avgMs, setAvgMs] = useState(0);
  const stats = useRef({ lastT: performance.now(), sum: 0, count: 0 });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (stats.current.count) {
        setAvgMs(stats.current.sum / stats.current.count);
        stats.current.sum = stats.current.count = 0;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pointerPos = () => {
    const p = stageRef.current?.getPointerPosition() ?? { x: 0, y: 0 };
    return [p.x, p.y] as [number, number];
  };

  /* ---------- drawing handlers ---------- */
  const startDrawing = () => {
    activeId.current = uuid();
    const [x, y] = pointerPos();

    /* local update */
    startStroke(activeId.current, x, y, color, width);

    /* outbound frame */
    bus.emit('outbound', {
      kind: 'stroke-start',
      stroke: { id: activeId.current, ownerId, color, width },
      first: [x, y],
    });
  };

  const continueDrawing = () => {
    if (!isDrawing) return;

    const [x, y] = pointerPos();
    addPoint(x, y);

    /* perf overlay bookkeeping */
    const now = performance.now();
    stats.current.sum  += now - stats.current.lastT;
    stats.current.count += 1;
    stats.current.lastT  = now;

    bus.emit('outbound', {
      kind: 'stroke-points',
      id:  activeId.current!,
      pts: [x, y],
    });
  };

  const finishDrawing = () => {
    if (!activeId.current) return;

    endStroke();
    bus.emit('outbound', {
      kind:  'stroke-end',
      id   : activeId.current,
      stroke: {
        id:      activeId.current,
        ownerId,          
        color,
        width
      }
    });    
    activeId.current = null;
      };

  /* ---------- UI ---------- */
  return (
    <>
      {/* overlay: perf + socket */}
      <div className="metrics">
        {avgMs.toFixed(1)} ms/sample&nbsp;•&nbsp;
        {connected ? 'socket ✓' : 'socket ✗'}
      </div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        onMouseDown={startDrawing}
        onMouseMove={continueDrawing}
        onMouseUp={finishDrawing}
      >
        <Layer>
          {(Object.values(strokes) as Stroke[]).map((s) => (
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
