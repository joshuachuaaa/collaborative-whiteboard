import { Stage, Layer, Line } from 'react-konva';
import { useRef } from 'react';
import { useBoard } from '../store';
//import { useSocket } from '../hooks/useSocket';

export default function Whiteboard() {
  const { strokes, startStroke, addPoint, endStroke } = useBoard();
  //const { send } = useSocket();
  const stageRef = useRef<any>(null);

  const pointerPos = () => {
    const stage = stageRef.current as any;
    const p = stage.getPointerPosition();
    return [p.x, p.y] as [number, number];
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      ref={stageRef}
      onMouseDown={() => {
        const [x, y] = pointerPos();
        startStroke(x, y, '#1e40af', 2);            // default colour/width
      }}
      onMouseMove={() => {
        const [x, y] = pointerPos();
        addPoint(x, y);
      }}
      onMouseUp={() => endStroke()}>
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
  );
}
