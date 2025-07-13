import mitt from 'mitt';
import type { StrokeMsg } from './types.ts';

type Events = {
  outbound: StrokeMsg;  // frames to server
  inbound:  StrokeMsg;  // frames from server
};

export const bus = mitt<Events>();
