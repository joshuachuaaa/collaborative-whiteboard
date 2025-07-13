import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { StrokeMsg } from '../types.ts';   // your existing WebSocket message union

export interface Stroke {
  id: string;
  ownerId: string;
  color: string;
  width: number;
  points: number[];      // [x0, y0, x1, y1, …]
  done?: boolean;        // set when pointer-up / undo
}

/* ──────────────────────────────── state shape ─────────────────────────────── */
interface State {
  /* dual index */
  strokes:     Record<string, Stroke>;   // fast streaming lookup
  history:     Record<string, string[]>; // ownerId → stack of strokeIds

  /* misc UI state */
  currentId: string | null;
  ownerId:   string;
  isDrawing: boolean;
  color:     string;
  width:     number;
  connected: boolean;

  /* drawing actions */
  startStroke(id: string, x: number, y: number, 
    color: string, width: number):  void;
  addPoint(x: number, y: number):   void;
  endStroke():                      void;
  undoLast(owner?:string):          void;
  mergeStroke(msg: StrokeMsg):      void;

  /* simple setters */
  setColor(c: string):              void;
  setWidth(w: number):              void;
  setOwnerId(id?: string):          void;
  getLastStrokeId(owner? : string): string | null;
}

/* ───────────────────────── owner-id persistence helper ────────────────────── */
const STORAGE_KEY = 'ownerId';
const ensureOwnerId = (): string => {
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};

/* ──────────────────────────────── the store ───────────────────────────────── */
export const useBoard = create<State>((set, get) => ({
    /* ---------- initial state ---------- */
    strokes:     {},
    history:     {},
    currentId:   null,
    ownerId:     ensureOwnerId(),
    isDrawing:   false,
    color:       '#000000',
    width:       2,
    connected :false,

    /* ---------- simple setters ---------- */
    setColor:  (color) => set({ color }),
    setWidth:  (width) => set({ width }),
    setOwnerId: (id) => {
    const newId = id ?? uuid();
    sessionStorage.setItem(STORAGE_KEY, newId);
    set({ ownerId: newId });
    
    },

    /* ───────────────── drawing actions ───────────────── */
    /** pointer-down (local) */
    startStroke: (id, x, y, color, width) =>
        set((s) => {
        const owner = s.ownerId;
        const newStroke: Stroke = { id, ownerId: owner, color, width, points: [x, y] };

        return {
            isDrawing: true,
            currentId: id,
            /* --- dual index updates ---- */
            strokes: {
            ...s.strokes,
            [id]: newStroke,
            },
            history: {
            ...s.history,
            [owner]: [...(s.history[owner] ?? []), id],   // push
            },
        };
        }),

    /** pointer-move (local) */
    addPoint: (x, y) =>
        set((s) => {
        if (!s.isDrawing || !s.currentId) return s;

        const st = s.strokes[s.currentId];
        return {
            strokes: {
            ...s.strokes,
            [st.id]: { ...st, points: [...st.points, x, y] },
            },
        };
        }),

    /** pointer-up (local) */
    endStroke: () =>
        set((s) => {
        if (!s.currentId) return s;
        const st = s.strokes[s.currentId];
        return {
            isDrawing: false,
            currentId: null,
            strokes: {
            ...s.strokes,
            [st.id]: { ...st, done: true },
            },
        };
        }),

    /** undo newest active stroke for owner (local shortcut or remote command) */
    undoLast: (owner = get().ownerId) =>
        set((s) => {
            const stack = s.history[owner];
            if (!stack?.length) return s;

            const lastId = stack[stack.length - 1];
            const st     = s.strokes[lastId];
            if (!st) return s;

            const { [lastId]: _, ...rest } = s.strokes;   // omit the entry
            return {
            strokes: rest,
            history: {
                ...s.history,
                [owner]: stack.slice(0, -1),
            },
            };
        }),
    getLastStrokeId: (owner = get().ownerId) => {
        const stack = get().history[owner];
        return stack?.length ? stack[stack.length - 1] : null;
    },

    /** merge updates coming from WebSocket (remote users) */
    mergeStroke: (msg) =>
        set((s) => {
        switch (msg.kind) {
            case 'stroke-start': {
            const { id, ownerId } = msg.stroke;
            return {
                strokes: {
                ...s.strokes,
                [id]: { ...msg.stroke, points: [...msg.first] },
                },
                history: {
                ...s.history,
                [ownerId]: [...(s.history[ownerId] ?? []), id],
                },
            };
            }

            case 'stroke-points': {
            const t = s.strokes[msg.id];
            if (!t) return s;
            return {
                strokes: {
                ...s.strokes,
                [t.id]: { ...t, points: [...t.points, ...msg.pts] },
                },
            };
            }

            case 'stroke-end': {
            const t = s.strokes[msg.id];
            if (!t) return s;
            return {
                strokes: {
                ...s.strokes,
                [t.id]: { ...t, done: true },
                },
            };
            }

            case 'undo': {
                const owner = s.strokes[msg.id]?.ownerId;  
                if (!owner) return s;

                const { [msg.id]: _, ...rest } = s.strokes;

                return {
                    strokes: rest,
                    history: {
                    ...s.history,
                    [owner]: (s.history[owner] ?? []).filter((x) => x !== msg.id),
                    },
                };
            }

            default : 
                return s;
        }
        }),
    }));
