import { create, type StoreApi } from 'zustand'
import type { StrokeMsg } from './types'

export interface Stroke {
  id: string
  color: string
  width: number
  points: number[]          // flat [x0,y0,x1,y1,...]
  done?: boolean            // mark finished on pointer-up
}

export interface State {
  strokes: Record<string, Stroke>   // key = stroke.id
  currentId: string | null          // which stroke am I drawing?
  isDrawing: boolean
  startStroke: (id:string, x: number, y: number, color: string, width: number) => void
  addPoint:  (x: number, y: number) => void
  endStroke: () => void
  mergeStroke : (msg: StrokeMsg) => void
}


type SetFn = StoreApi<State>['setState'];
type GetFn = StoreApi<State>['getState'];

export const useBoard = create<State>()((set: SetFn, _get: GetFn) => ({
  strokes: {},
  currentId: null,
  isDrawing: false,

  // pointer-down
  startStroke: (id:string, x:number, y:number, color:string, width:number) => {
    set((s:State) => ({
      isDrawing: true,
      currentId: id,
      strokes: {
        ...s.strokes,
        [id]: { id, color, width, points: [x, y] }
      }
    }
  ))
},

  // pointer-move
  addPoint: (x: number, y: number) =>
    set(s => {
      if (!s.isDrawing || !s.currentId) return s
      const stroke = s.strokes[s.currentId]
      const newPoints = [...stroke.points, x, y]
      return {
        strokes: {
          ...s.strokes,
          [stroke.id]: { ...stroke, points: newPoints }
        }
      }
    }),

  // pointer-up 
  endStroke: () => set((s:State) => {
    if (!s.currentId) return s
    const stroke = { ...s.strokes[s.currentId], done: true }
    return {
      isDrawing: false,
      currentId: null,
      strokes: { ...s.strokes, [stroke.id]: stroke }
    }
  }),
  mergeStroke: (msg: StrokeMsg) =>
    set(s => {
      switch (msg.kind) {
        case 'stroke-start':
          return {
            strokes: {
              ...s.strokes,
              [msg.stroke.id]: {
                ...msg.stroke,
                points: [...msg.first]    
              }
            }
          };

        case 'stroke-points': {
          const t = s.strokes[msg.id];
          if (!t) return s;                    
          // copy + append
          const newPts = [...t.points, ...msg.pts];
          return {
            strokes: {
              ...s.strokes,
              [t.id]: { ...t, points: newPts }
            }
          };
        }

        case 'stroke-end': {
          const t = s.strokes[msg.id];
          if (!t) return s;
          return {
            strokes: {
              ...s.strokes,
              [t.id]: { ...t, done: true }
            }
          };
        }
      }
    }),
}))
