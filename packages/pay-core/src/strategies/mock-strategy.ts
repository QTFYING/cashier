import type { HttpClient, PayParams, PayResult } from '@cashier/types';
import { BaseStrategy } from './base-strategy';

// 定义 Mock 特有的配置接口
export interface MockStrategyConfig {
  latency?: number; // 模拟网络延时
  scenario?: 'success' | 'fail' | 'timeout' | 'cancel'; // 模拟场景
  mockTransactionId?: string; // 指定返回的流水号
}

/**
 * Mock 策略
 * 继承 BaseStrategy 以复用 success/fail/validateParams 能力
 */
export class MockStrategy extends BaseStrategy<MockStrategyConfig> {
  // 必须实现抽象属性 name
  public readonly name = 'mock';

  constructor(config: MockStrategyConfig = {}) {
    // 这里的第二个参数是通用 StrategyOptions，根据需要传
    super({ latency: 1000, scenario: 'success', ...config }, {});
  }

  /**
   * 阶段1：准备支付
   * Mock策略直接返回参数作为 Payload，模拟后端签名过程
   */
  async prepare(params: PayParams, _http: HttpClient): Promise<any> {
    console.log(`[Mock Strategy] Prepare:`, params);
    // 模拟网络延时
    if (this.config.latency) {
      await new Promise((resolve) => setTimeout(resolve, this.config.latency));
    }
    return { ...params, _mock_sign: 'signed_by_mock', _scenario: this.config.scenario };
  }

  /**
   * 阶段3：处理结果
   * Mock策略直接根据配置返回成功或失败
   */
  process(rawResult: any): PayResult {
    console.log(`[Mock Strategy] Process:`, rawResult);
    const scenario = this.config.scenario || 'success';

    switch (scenario) {
      case 'success':
        return this.success(this.config.mockTransactionId || `MOCK_${Date.now()}`, rawResult);
      case 'fail':
        return this.fail('模拟支付失败', rawResult);
      case 'cancel':
        return this.fail('用户取消支付', { ...rawResult, code: 'USER_CANCEL' });
      default:
        return this.success(`MOCK_${Date.now()}`, rawResult);
    }
  }

  /**
   * 实现查单逻辑
   */
  async getPaySt(orderId: string): Promise<PayResult> {
    console.log(`[Mock Strategy] 查询订单状态: ${orderId}`);

    // 简单模拟：如果策略配置是 success，查单也返回 success
    if (this.config.scenario === 'success') {
      return this.success(`MOCK_TRX_${orderId}`, { status: 'paid' });
    } else {
      return this.fail('订单未支付或不存在');
    }
  }
}
