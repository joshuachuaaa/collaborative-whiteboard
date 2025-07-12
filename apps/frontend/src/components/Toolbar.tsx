import { useState } from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useBoard } from "../store";

/**
 * Ultra-minimal toolbar: just colour picker + brush-width slider.
 * Sits bottom-left, semi-transparent; no erase/clear logic.
 */

const preset = [
  "#1e40af", // indigo-800 (default)
  "#ef4444", // red-500
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#0ea5e9", // sky-500
  "#000000", // black
  "#ffffff", // white
];

export default function Toolbar() {
  const { color, width, setColor, setWidth } = useBoard();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-20 flex items-center gap-4 rounded-xl bg-white/70 backdrop-blur px-4 py-2 shadow-lg">
      {/* Colour palette */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="hover:bg-slate-200">
            <Palette className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 grid grid-cols-7 gap-2">
          {preset.map((c) => (
            <button
              key={c}
              className="h-6 w-6 rounded-full border-2"
              style={{
                backgroundColor: c,
                borderColor: c === color ? "#000" : "transparent",
              }}
              onClick={() => {
                setColor(c);
                setOpen(false);
              }}
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
    </div>
  );
}