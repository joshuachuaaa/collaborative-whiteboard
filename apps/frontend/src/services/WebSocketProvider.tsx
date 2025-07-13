// src/services/WebSocketProvider.tsx
import { useEffect, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket.ts';
import { bus } from '../bus.ts';
import { useBoard } from '../store/store.ts';
import type { StrokeMsg } from '../types.ts';

export default function WebSocketProvider({ children }: { children: React.ReactNode }) {
  
  const handleInbound = useCallback((msg: StrokeMsg) => {
    bus.emit('inbound', msg);
  }, []);
  
  /* open the socket once */
  const { send, connected } = useWebSocket('ws://localhost:8000/ws', handleInbound);

  /* sync connection status into Zustand */
  useEffect(() => {
    useBoard.setState({ connected });
  }, [connected]);

  /* wire outbound bus → socket */
  useEffect(() => {
    const handler = (msg: StrokeMsg) => send(msg);
    bus.on('outbound', handler);
    return () => bus.off('outbound', handler);
  }, [send]);

  /* wire inbound bus → store reducer */
  useEffect(() => {
    const { mergeStroke } = useBoard.getState();
    bus.on('inbound', mergeStroke);
    return () => bus.off('inbound', mergeStroke);
  }, []);

  return <>{children}</>;
}
