import { create, type StoreApi } from 'zustand'
import { v4 as uuid } from 'uuid'

export interface Stroke {
  id: string
  color: string
  width: number
  points: number[]          // flat [x0,y0,x1,y1,...]
  done?: boolean            // mark finished on pointer-up
}

interface State {
  strokes: Record<string, Stroke>   // key = stroke.id
  currentId: string | null          // which stroke am I drawing?
  isDrawing: boolean
  startStroke: (x: number, y: number, color: string, width: number) => void
  addPoint:  (x: number, y: number) => void
  endStroke: () => void
}


type SetFn = StoreApi<State>['setState'];
type GetFn = StoreApi<State>['getState'];

export const useBoard = create<State>()((set: SetFn, _get: GetFn) => ({
  strokes: {},
  currentId: null,
  isDrawing: false,

  // pointer-down
  startStroke: (x:number, y:number, color:string, width:number) => {
    const id = uuid()
    set((s:State) => ({
      isDrawing: true,
      currentId: id,
      strokes: {
        ...s.strokes,
        [id]: { id, color, width, points: [x, y] }
      }
    }))
},

  // pointer-move
  addPoint: (x:number, y:number) => set((s:State) => {
    if (!s.isDrawing || !s.currentId) return s
    const stroke = s.strokes[s.currentId]
    stroke.points.push(x, y)
    return { strokes: { ...s.strokes, [stroke.id]: stroke } }
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
  })
}))
