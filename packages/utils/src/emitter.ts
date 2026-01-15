import type { Logger } from '@my-cashier/types';

type EventCallback<T> = (payload: T) => void;

export class Emitter<EventMap extends Record<string, any>> {
  // 存储监听器：Map<事件名, Set<回调函数>>
  private tasks: Map<keyof EventMap, Set<EventCallback<any>>> = new Map();

  constructor(protected logger?: Logger) {}

  /**
   * 订阅事件
   * @param event 事件名 (自动提示)
   * @param callback 回调函数 (参数自动推导)
   */
  on<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    if (!this.tasks.has(event)) {
      this.tasks.set(event, new Set());
    }
    this.tasks.get(event)!.add(callback);
  }

  /**
   * 订阅一次性事件
   */
  once<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const wrapper = (payload: EventMap[K]) => {
      callback(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * 取消订阅
   */
  off<K extends keyof EventMap>(event: K, callback: EventCallback<EventMap[K]>): void {
    const callbacks = this.tasks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.tasks.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const callbacks = this.tasks.get(event);
    if (callbacks) {
      callbacks.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          this.logger?.error(`[TypedEventEmitter] Error in listener for "${String(event)}":`, err);
        }
      });
    }
  }

  /**
   * 清空所有事件
   */
  clear(): void {
    this.tasks.clear();
  }
}
