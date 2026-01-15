import { describe, expect, it, vi } from 'vitest';
import { Emitter } from '../emitter';

describe('Emitter', () => {
  interface TestEvents {
    foo: string;
    bar: { count: number };
  }

  it('should subscribe and emit events', () => {
    const emitter = new Emitter<TestEvents>();
    const callback = vi.fn();

    emitter.on('foo', callback);
    emitter.emit('foo', 'test payload');

    expect(callback).toHaveBeenCalledWith('test payload');
  });

  it('should handle multiple listeners', () => {
    const emitter = new Emitter<TestEvents>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    emitter.on('foo', cb1);
    emitter.on('foo', cb2);

    emitter.emit('foo', 'payload');

    expect(cb1).toHaveBeenCalledWith('payload');
    expect(cb2).toHaveBeenCalledWith('payload');
  });

  it('should unsubscribe correctly', () => {
    const emitter = new Emitter<TestEvents>();
    const callback = vi.fn();

    emitter.on('foo', callback);
    emitter.off('foo', callback);
    emitter.emit('foo', 'payload');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle once subscription', () => {
    const emitter = new Emitter<TestEvents>();
    const callback = vi.fn();

    emitter.once('foo', callback);
    emitter.emit('foo', 'first');
    emitter.emit('foo', 'second');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('should clear all listeners', () => {
    const emitter = new Emitter<TestEvents>();
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    emitter.on('foo', cb1);
    emitter.on('bar', cb2);

    emitter.clear();
    emitter.emit('foo', 'payload');
    emitter.emit('bar', { count: 1 });

    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });
});
