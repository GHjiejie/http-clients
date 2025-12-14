import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export interface RequestContext {
  requestId: string;
  startedAt: number;
  config: InternalAxiosRequestConfig;
}
/**
 * HTTP 客户端配置选项
 * @param baseURL 基础 URL
 * @param timeout 请求超时时间，单位毫秒
 * @param defaultHeaders 默认请求头
 * @param getAuthToken 获取认证令牌的函数
 * @param cancelDuplicate 是否取消重复请求
 * @param unwrapResponse 解包响应数据的函数
 * @param onRequest 请求发送前的回调
 * @param onResponse 响应接收后的回调
 * @param onError 请求出错时的回调
 * @param onFinally 请求完成后的回调
 */

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | Promise<string | null | undefined>;
  cancelDuplicate?: boolean;
  unwrapResponse?: (payload: unknown) => unknown;
  onRequest?: (context: RequestContext) => void;
  onResponse?: (response: AxiosResponse, context: RequestContext) => void;
  onError?: (error: HttpError, context: RequestContext) => void;
  onFinally?: (context: RequestContext, outcome: "success" | "error") => void;
}

export interface RequestConfig<TBody = unknown>
  extends AxiosRequestConfig<TBody> {
  requestId?: string;
}

export class HttpError<T = unknown> extends Error {
  status?: number;
  data?: T;
  config: AxiosRequestConfig;

  constructor(
    message: string,
    config: AxiosRequestConfig,
    status?: number,
    data?: T
  ) {
    super(message);
    this.name = "HttpError";
    this.config = config;
    this.status = status;
    this.data = data;
  }
}

export class HttpClient {
  private instance: AxiosInstance;
  private pending = new Map<string, AbortController>();
  private options: HttpClientOptions;
  static readonly metadataKey = "metadata";

  constructor(options: HttpClientOptions) {
    this.options = options;
    this.instance = axios.create({
      baseURL: options.baseURL,
      timeout: options.timeout ?? 10000,
      headers: options.defaultHeaders,
    });

    this.setupInterceptors();
  }

  async request<TResponse = unknown, TBody = unknown>(
    config: RequestConfig<TBody>
  ): Promise<TResponse> {
    const response = await this.instance.request<TResponse>(config);
    return response.data;
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(async (config) => {
      const manualRequestId = (config as RequestConfig).requestId;
      const requestId =
        manualRequestId ??
        config.headers?.["x-request-id"]?.toString() ??
        config.headers?.["X-Request-Id"]?.toString();
      const normalized: EnrichedRequestConfig = {
        ...config,
        headers: {
          ...(config.headers || {}),
        },
      };

      const ctx: RequestContext = {
        requestId: requestId ?? this.createRequestId(),
        startedAt: Date.now(),
        config: normalized,
      };

      normalized.headers["X-Request-Id"] = ctx.requestId;
      if (this.options.getAuthToken) {
        const token = await this.options.getAuthToken();
        if (token) {
          normalized.headers.Authorization = `Bearer ${token}`;
        }
      }

      if (this.options.cancelDuplicate) {
        this.cancelIfPending(normalized);
        const controller = new AbortController();
        normalized.signal = normalized.signal ?? controller.signal;
        this.pending.set(this.buildKey(normalized), controller);
      }

      normalized[HttpClient.metadataKey] = ctx;
      this.options.onRequest?.(ctx);
      return normalized;
    });

    this.instance.interceptors.response.use(
      (response) => {
        const ctx = this.resolveContext(
          response.config as EnrichedRequestConfig
        );
        this.clearPending(response.config);

        const payload = this.options.unwrapResponse
          ? this.options.unwrapResponse(response.data)
          : response.data;
        const normalized = { ...response, data: payload };
        this.options.onResponse?.(normalized, ctx);
        this.options.onFinally?.(ctx, "success");
        return normalized;
      },
      (error: AxiosError) => {
        const config = error.config as EnrichedRequestConfig;
        const ctx = this.resolveContext(config);
        this.clearPending(config);

        const sanitizedConfig = { ...(config || {}) };
        // 避免循环引用导致的堆栈溢出
        if (HttpClient.metadataKey in sanitizedConfig) {
          delete (sanitizedConfig as Record<string, unknown>)[
            HttpClient.metadataKey
          ];
        }

        const httpError = new HttpError(
          error.message,
          sanitizedConfig,
          error.response?.status,
          error.response?.data
        );

        this.options.onError?.(httpError, ctx);
        this.options.onFinally?.(ctx, "error");
        return Promise.reject(httpError);
      }
    );
  }

  private cancelIfPending(config: InternalAxiosRequestConfig) {
    const key = this.buildKey(config);
    const pending = this.pending.get(key);
    pending?.abort();
    this.pending.delete(key);
  }

  private clearPending(config?: AxiosRequestConfig) {
    if (!config) return;
    const key = this.buildKey(config);
    this.pending.delete(key);
  }

  private buildKey(config: AxiosRequestConfig) {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();
    // 避免循环结构导致的堆栈溢出，直接跳过复杂序列化
    const params = config.params ? "[params]" : "";
    const data = config.data ? "[data]" : "";
    return `${method}:${url}?${params}&${data}`;
  }

  private createRequestId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private resolveContext(config?: EnrichedRequestConfig): RequestContext {
    const fallback: RequestContext = {
      requestId: this.createRequestId(),
      startedAt: Date.now(),
      config:
        (config as InternalAxiosRequestConfig) ||
        ({} as InternalAxiosRequestConfig),
    };

    const ctx = config?.[HttpClient.metadataKey];
    if (ctx) {
      // 避免后续引用产生循环
      delete (config as Record<string, unknown>)[HttpClient.metadataKey];
      return ctx;
    }
    return fallback;
  }
}

type EnrichedRequestConfig = InternalAxiosRequestConfig & {
  [HttpClient.metadataKey]?: RequestContext;
};
