import { describe, expect, it, vi } from 'vitest';
import { Store } from '../store';

describe('Store', () => {
  it('should initialize with default state', () => {
    const store = new Store({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it('should update state with object partial', () => {
    const store = new Store({ count: 0, name: 'test' });
    store.setState({ count: 1 });
    expect(store.getState()).toEqual({ count: 1, name: 'test' });
  });

  it('should update state with function', () => {
    const store = new Store({ count: 0 });
    store.setState((prev) => ({ count: prev.count + 1 }));
    expect(store.getState()).toEqual({ count: 1 });
  });

  it('should notify listeners on state change', () => {
    const store = new Store({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 });
  });

  it('should unsubscribe listeners', () => {
    const store = new Store({ count: 0 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState({ count: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it('should clear listeners on destroy', () => {
    const store = new Store({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);

    store.destroy();
    store.setState({ count: 1 });
    // Assuming implementation allows setState after destroy but doesn't notify,
    // or maybe destroy just clears listeners.
    expect(listener).not.toHaveBeenCalled();
  });
});
