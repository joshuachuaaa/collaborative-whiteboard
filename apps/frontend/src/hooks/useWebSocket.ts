import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseWebSocket {
  connected: boolean;
  send: (data: unknown) => void;
}

export default function useWebSocket(url: string): UseWebSocket {
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

    ws.onopen    = () => setConnected(true);console.log('connected')
    ws.onclose   = () => setConnected(false);
    ws.onerror   = e  => console.error('WebSocket error', e);
    ws.onmessage = e  => console.log('Message from server', e.data);

    return () => ws.close();
  }, [url]);

  return { connected, send };
}
