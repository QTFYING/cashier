import { describe, expect, it, vi } from 'vitest';
import { PaymentContext } from '../packages/core/src';

describe('Logger System', () => {
  it('should not log debug messages when debug mode is OFF', () => {
    const debugSpy = vi.spyOn(console, 'debug');

    // Default debug=false
    const context = new PaymentContext({});

    // Trigger a potential debug log (e.g. strategy registration)
    context.register({
      name: 'test-strategy-1',
      prepare: async () => {},
      process: () => ({ status: 'success' }),
      getPaySt: async () => ({ status: 'success' }),
    } as any);

    // Expect NO debug logs
    expect(debugSpy).not.toHaveBeenCalledWith(expect.stringContaining('Strategy "test-strategy-1" registered'));

    vi.restoreAllMocks();
  });

  it('should log debug messages when debug mode is ON', () => {
    const debugSpy = vi.spyOn(console, 'debug');

    const context = new PaymentContext({ debug: true });

    context.register({
      name: 'test-strategy-2',
      prepare: async () => {},
      process: () => ({ status: 'success' }),
      getPaySt: async () => ({ status: 'success' }),
    } as any);

    expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Strategy "test-strategy-2" registered.'));

    vi.restoreAllMocks();
  });

  it('should use custom logger if provided', () => {
    const customLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    const context = new PaymentContext({ logger: customLogger });

    context.register({
      name: 'test-strategy-3',
      prepare: async () => {},
      process: () => ({ status: 'success' }),
      getPaySt: async () => ({ status: 'success' }),
    } as any);

    expect(customLogger.debug).toHaveBeenCalledWith('Strategy "test-strategy-3" registered.');
  });
});
