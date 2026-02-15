import EventEmitter from 'eventemitter3';
import type { BusEvent } from './types';

class ModuleBusImpl extends EventEmitter {
  publish(event: BusEvent) {
    this.emit(event.type, event);
    this.emit('*', event); // wildcard listener
  }

  subscribe(type: string, handler: (event: BusEvent) => void) {
    this.on(type, handler);
    return () => this.off(type, handler);
  }

  subscribeAll(handler: (event: BusEvent) => void) {
    this.on('*', handler);
    return () => this.off('*', handler);
  }

  send(type: string, source: string, data?: unknown) {
    this.publish({ type, source, data, timestamp: Date.now() });
  }
}

export const ModuleBus = new ModuleBusImpl();
