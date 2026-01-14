import type { HttpClient, PaymentContextState, PaymentPlugin, PaymentState, PayParams, PayPlatformType, PayResult, SDKConfig } from '@my-cashier/types';
import { PayErrorCode } from '@my-cashier/types';
import { createDefaultFetcher, createLogger, ScriptLoader, Store } from '@my-cashier/utils';
import { EventBus } from './event-bus';
import { InvokerFactory } from './invoker-factory';
import { PayError } from './payment-error';
import { PluginDriver } from './plugin-driver';
import { EventBridgePlugin } from './plugins/event-bridge-plugin';
import { PollingManager } from './polling-manager';
import type { BaseStrategy } from './strategies/base-strategy';

// 9. 状态管理 (PaymentState definition)

export class PaymentContext extends EventBus {
  // 1. 策略池
  private strategies: Map<string, BaseStrategy> = new Map();

  // 2. 插件池
  private plugins: PaymentPlugin[] = [];

  // 3. HTTP 客户端 (依赖注入)
  public readonly http: HttpClient;

  // 4. 轮询管理器
  private poller: PollingManager;
  // private logger: Logger; // Inherited from EventBus

  // 5. 插件驱动器
  public driver: PluginDriver;

  // 6. 执行环境
  public readonly invokerType: SDKConfig['invokerType'];

  // 7. 状态管理 (Store)
  public readonly store: Store<PaymentState>;

  // 8. 实例是否被销毁
  private _isDestroyed = false;

  constructor(config: SDKConfig = {}) {
    const logger = config.logger ?? createLogger({ debug: false, ...config });
    super(logger);

    const { http, invokerType, plugins = [], enableDefaultPlugins = true } = config;

    this.http = http ?? createDefaultFetcher();
    this.invokerType = invokerType;
    this.poller = new PollingManager(logger);
    this.plugins = [...plugins];

    // ！！！ 全局共享数据池 Store
    this.store = new Store<PaymentState>({ status: 'idle', loading: false });

    // 处理插件
    if (enableDefaultPlugins) {
      const hasEventBridge = this.plugins.some((p) => p.name === 'EventBridgePlugin');
      if (!hasEventBridge) this.use(EventBridgePlugin);
    }

    this.driver = new PluginDriver(this.plugins || []);
  }

  /**
   * 注册策略 (use Strategy)
   */
  register(strategy: BaseStrategy): this {
    strategy.context = this;
    strategy.logger = this.logger;
    if (this.strategies.has(strategy.name)) {
      this.logger.warn(`Strategy "${strategy.name}" overwritten.`);
    }
    this.strategies.set(strategy.name, strategy);
    this.logger.debug(`Strategy "${strategy.name}" registered.`);
    return this;
  }

  /**
   * 注册插件 (use Plugin)
   */
  use(plugin: PaymentPlugin): this {
    if (plugin.enforce === 'pre') {
      this.plugins.unshift(plugin);
    } else {
      this.plugins.push(plugin);
    }
    this.driver = new PluginDriver(this.plugins, this.logger);
    return this;
  }

  /**
   * 核心执行器
   */
  async execute(strategyName: PayPlatformType, params: PayParams): Promise<PayResult> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new PayError(PayErrorCode.INVALID_CONFIG, `Strategy "${strategyName}" not registered.`);
    }

    // 0. 初始化运行时上下文
    this.updateState({ loading: true, error: undefined, status: 'idle', result: undefined });

    const ctx: PaymentContextState = { context: this, params, state: {} };

    try {
      // --- Stage 1: 准备 (Bootstrap) ---
      // 场景：参数校验、权限检查、Loading 开启
      await this.driver.implant('onBeforePay', ctx);

      // --- Stage 2: 交互 (Negotiation) ---
      // 场景：Token 注入、URL 修改、签名
      await this.driver.implant('onBeforeSign', ctx);

      // 注意：Strategy 内部此时会调用 this.context.request 去请求后端
      await this.driver.implant('onAfterSign', ctx);

      // --- Stage 3: 适配 (Adaptation) ---
      // 场景：埋点上报、动态加载 JS-SDK 脚本
      await this.driver.implant('onBeforeInvoke', ctx);

      // --- Stage 4: 执行 (Execution) ---
      // 4.1 准备数据 (Prepare)
      const signedPayload = await strategy.prepare(ctx.params, this.http);
      ctx.apiResponse = signedPayload; // 存一份到上下文，供插件使用

      // 4.2 获取执行器 (IoC: 由 Context 决定使用哪个 Invoker)
      const invoker = InvokerFactory.create(strategyName, this.invokerType, this.logger);

      // 4.3 唤起支付 (Invoke)
      const rawResult = await invoker.invoke(signedPayload);

      // 4.4 归一化结果 (Process)
      const result = strategy.process(rawResult);
      ctx.result = result;

      // Stage 5: Settlement
      await this.settle(ctx, result);

      // 自动轮询编排
      // 如果 Strategy 返回 pending (如获取到了二维码)，且参数指定了 autoPoll，则自动托管

      if (result.status === 'pending' && ctx.params.autoPoll) {
        // 使用 nextTick 或 确保异步不阻塞当前返回
        setTimeout(() => {
          // 确保有 OrderId，通常 Strategy 会透传回来，如果没有则降级使用 params 中的
          const orderId = result.transactionId || ctx.params.orderId;
          this.logger.info(`[PaymentContext] Auto start polling for order: ${orderId}`);
          this.startPolling(strategyName, orderId);
        }, 3000);
      }

      return result;
    } catch (error: any) {
      // 归一化错误
      const errResult = error instanceof PayError ? error : new PayError(PayErrorCode.UNKNOWN, error.message || 'Unknown Error');

      await this.driver.implant('onFail', ctx, errResult);
      this.updateState({ status: 'fail', error: errResult, loading: false, preData: ctx.state });

      throw errResult;
    } finally {
      await this.driver.implant('onCompleted', ctx);
    }
  }

  // --- 轮询代理方法 (Delegation) ---

  /**
   * 手动开启轮询
   * 实际逻辑委托给 pollingManager
   */
  /**
   * 手动开启轮询
   * 这里负责“组装”任务和上下文
   */
  public startPolling(strategyName: string, orderId: string) {
    // 1. 获取策略 (依然由 Context 负责)
    const strategy = this.strategies.get(strategyName);

    if (!strategy) return;

    // 2. 上下文 (Context Restoration)
    const ctx = this.createPollingContext(orderId);

    // 3. task 定义查单任务 (闭包)
    const task = async () => await strategy.getPaySt(orderId);

    // 4. 定义回调 (连接 EventBus 和 PluginDriver)
    this.poller.start(task, this.createPollingCallbacks(ctx), 3000);
  }

  public stopPolling() {
    this.poller.stop();
  }

  // --- 暴露给 PollingManager 的内部能力 (Internal APIs) ---

  /**
   * 获取指定策略
   */
  public getStrategy(name: string): BaseStrategy | undefined {
    return this.strategies.get(name);
  }

  // 创建轮询时的上下文快照
  private createPollingContext(orderId: string): PaymentContextState {
    const { preData = {} } = this.store.getState();
    return {
      context: this,
      params: { orderId, amount: 0 },
      state: { ...preData },
      currentStatus: 'pending',
    };
  }

  //  轮询回调函数（Event, Plugin）收敛在这里，不污染主逻辑
  private createPollingCallbacks(ctx: PaymentContextState) {
    return {
      onStatusChange: async (res: PayResult) => {
        // Merge with previous result to preserve QR code (Action) if polling response is partial
        const prev = this.store.getState().result;
        const merged = { ...prev, ...res };
        await this.settle(ctx, merged);
      },
      onSuccess: async (res: PayResult) => {
        await this.settle(ctx, res);
      },
      onFail: async (res: PayResult) => {
        await this.settle(ctx, res);
      },
      onFinished: async () => {
        await this.driver.implant('onCompleted', ctx);
        this.updateState({ loading: false });
      },
    };
  }

  /**
   * 统一结算
   */
  private async settle(ctx: PaymentContextState, result: PayResult) {
    ctx.result = result;
    ctx.currentStatus = result.status;

    if (result.status === 'success') {
      await this.driver.implant('onSuccess', ctx, result);
      this.emit('success', result);
    } else if (result.status === 'pending' || result.status === 'processing') {
      await this.driver.implant('onStateChange', ctx, result.status);
      this.emit('statusChange', { status: result.status, result });
    } else {
      await this.driver.implant('onFail', ctx, result);
      this.emit('fail', result);
    }

    this.updateState({ status: result.status, loading: false, result, preData: ctx.state });
  }

  /**
   * 内部状态更新助手
   */
  private updateState(patch: Partial<PaymentState>) {
    this.store.setState(patch);
  }

  public destroy(): void {
    if (this._isDestroyed) return;

    // 1. 停止一切正在进行的异步任务 (轮询)
    this.stopPolling();

    // 2. 清空事件总线 (EventBus)
    this.clear();

    // 3. 清空策略
    this.strategies.clear();

    // 4. 清空插件列表
    this.plugins = [];

    ScriptLoader.clear();

    // 5. 清空标识位
    this._isDestroyed = true;
  }
}
