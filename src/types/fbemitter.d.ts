declare module 'fbemitter' {
  export class EventEmitter {
    addListener(eventType: string, listener: (...args: any[]) => void): { remove: () => void };
    once(eventType: string, listener: (...args: any[]) => void): void;
    removeAllListeners(eventType?: string): void;
    emit(eventType: string, ...args: any[]): void;
  }
}
