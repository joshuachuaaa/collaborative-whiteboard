import { useEffect, useRef, useState, useCallback } from 'react';
import type { StrokeMsg } from '../types.ts';

export interface UseWebSocket {
  connected: boolean;
  send: (data: unknown) => void;
}

export default function useWebSocket(url: string, onMessage?: (data: StrokeMsg) => void): UseWebSocket {
  const socketRef = useRef<WebSocket>(null);
  const [connected, setConnected] = useState(false);
  

  //send helper
  const send = useCallback(
    (data: unknown) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      } else {
        console.warn('WebSocket not open; skipped send');
      }
    },
    [],
  );

  useEffect(() => {
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };
    ws.onclose   = () => {
      setConnected(false);
    }
    ws.onerror   = e  => console.error('WebSocket error', e);
    ws.onmessage = e => {
    try {
      const msg = JSON.parse(e.data);
      onMessage?.(msg);
      console.log(msg)
    } catch (err) {
      console.warn('Bad WS payload', err);
    }
  };

    return () => ws.close();
  }, [url, onMessage]);

  return { connected, send };
}
