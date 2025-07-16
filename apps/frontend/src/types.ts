import {type Stroke} from "./store/store.ts"
// src/types/ws.ts
export type StrokeMsg =
  | { kind: 'stroke-start'; stroke: Omit<Stroke, 'points' | 'done'>; first: [number, number] }
  | { kind: 'stroke-points'; id: string; pts: number[] }   // 1‑N new points
  | { kind: 'stroke-end';    id: string; }   // pointer‑up
  | { kind: 'undo';    id: string; }    
  | { kind: 'stroke-full'; stroke: Stroke }
  | { kind: 'stroke-snapshot'; id: string; points: number[] }            
