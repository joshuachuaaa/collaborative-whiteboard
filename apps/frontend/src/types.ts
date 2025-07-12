import {type Stroke} from "./store.ts"
// src/types/ws.ts
export type StrokeMsg =
  | { kind: 'stroke-start'; stroke: Omit<Stroke, 'points' | 'done'>; first: [number, number] }
  | { kind: 'stroke-points'; id: string; pts: number[] }   // 1‑N new points
  | { kind: 'stroke-end';    id: string; }                 // pointer‑up
