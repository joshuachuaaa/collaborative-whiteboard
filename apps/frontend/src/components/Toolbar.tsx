import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Undo } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover.tsx";
import { Slider } from "./ui/slider.tsx";
import "./toolbar.css";         
import { bus } from '../bus.ts';
import { useBoard } from '../store/store.ts';


const preset = [
  "#1e40af", "#ef4444", "#22c55e",
  "#eab308", "#0ea5e9", "#000000", "#ffffff",
];

export default function Toolbar() {
  const { color, width, setColor, setWidth, ownerId, undoLast, getLastStrokeId } = useBoard();
  const [open, setOpen] = useState(false);

  const handleUndo = () => {
    const id = getLastStrokeId(ownerId);
    if (!id) return;
    undoLast(ownerId);                         // local state change
    bus.emit('outbound', { kind: 'undo', id }); // network frame
  };

  return (
    <div className="toolbar-sm">        {/* single utility class */}
      {/* Colour palette */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="lg" variant="ghost" className="hover:bg-slate-200">
            <Palette className="h-20 w-20" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 grid grid-cols-7 gap-4 border border-s-black">
          {preset.map((c) => (
            <button
              key={c}
              className="h-[40px] w-[40px] rounded-lg mx-10"
              style={{
                backgroundColor: c,
                borderColor: c === color ? "#000" : "transparent",
              }}
              onClick={() => { setColor(c); setOpen(false); }}
            />
          ))}
        </PopoverContent>
      </Popover>

      {/* Brush width slider */}
      <div className="w-32">
        <Slider
          min={1}
          max={20}
          step={1}
          defaultValue={[width]}
          onValueChange={([w]) => setWidth(w)}
        />
      </div>
        <Button onClick={handleUndo}>
          <Undo className="h-5 w-5" />
        </Button>
    </div>
  );
}
