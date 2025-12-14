export interface RequestContext {
  requestId: string;
  startedAt: number;
  config: EnrichedRequestConfig;
}

export interface HttpClientOptions {
  baseURL?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => string | Promise<string | null | undefined>;
  cancelDuplicate?: boolean;
  unwrapResponse?: (payload: unknown) => unknown;
  onRequest?: (context: RequestContext) => void;
  onResponse?: (response: HttpResponse, context: RequestContext) => void;
  onError?: (error: HttpError, context: RequestContext) => void;
  onFinally?: (context: RequestContext, outcome: "success" | "error") => void;
}

export interface RequestConfig<TBody = unknown> extends RequestInit {
  url: string;
  baseURL?: string;
  params?:
    | Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>
    | URLSearchParams;
  data?: TBody;
  requestId?: string;
  timeout?: number;
}

export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  data: T;
  config: EnrichedRequestConfig;
  raw: Response;
}

export class HttpError<T = unknown> extends Error {
  status?: number;
  data?: T;
  config: RequestConfig;

  constructor(message: string, config: RequestConfig, status?: number, data?: T) {
    super(message);
    this.name = "HttpError";
    this.config = config;
    this.status = status;
    this.data = data;
  }
}

export class HttpClient {
  static readonly metadataKey = "metadata";
  private pending = new Map<string, AbortController>();
  private options: HttpClientOptions;

  constructor(options: HttpClientOptions) {
    this.options = options;
  }

  async request<TResponse = unknown, TBody = unknown>(config: RequestConfig<TBody>): Promise<TResponse> {
    const prepared = await this.prepareRequest(config);
    const { normalized, controller, timeoutId, ctx, abortHandler } = prepared;
    const { [HttpClient.metadataKey]: _meta, ...restConfig } = normalized;
    const {
      url,
      data: _data,
      params: _params,
      baseURL: _baseURL,
      requestId: _requestId,
      timeout: _timeout,
      ...init
    } = restConfig;

    this.options.onRequest?.(ctx);
    const cleanConfig = this.stripMetadata(normalized);
    ctx.config = cleanConfig;

    try {
      const response = await fetch(url, init);
      const body = await this.readResponseBody(response);

      if (!response.ok) {
        throw this.buildHttpError(
          response.statusText || `HTTP ${response.status}`,
          cleanConfig,
          response.status,
          body
        );
      }

      const payload = this.options.unwrapResponse ? this.options.unwrapResponse(body) : body;
      const responseLike: HttpResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: this.headersToRecord(response.headers),
        url: response.url,
        data: payload,
        config: cleanConfig,
        raw: response
      };

      this.options.onResponse?.(responseLike, ctx);
      this.options.onFinally?.(ctx, "success");
      return payload as TResponse;
    } catch (error) {
      const httpError = error instanceof HttpError ? error : this.normalizeError(error, cleanConfig);
      this.options.onError?.(httpError, ctx);
      this.options.onFinally?.(ctx, "error");
      throw httpError;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      this.clearPending(normalized);
      // 确保外部 signal 仍可响应 abort
      if (abortHandler && config.signal) {
        config.signal.removeEventListener("abort", abortHandler);
      }
    }
  }

  private async prepareRequest<TBody>(config: RequestConfig<TBody>) {
    const headers = {
      ...(this.options.defaultHeaders ? this.toHeaderRecord(this.options.defaultHeaders) : {}),
      ...this.toHeaderRecord(config.headers)
    };

    const requestId = config.requestId ?? headers["x-request-id"] ?? this.createRequestId();
    headers["x-request-id"] = requestId;

    if (this.options.getAuthToken) {
      const token = await this.options.getAuthToken();
      if (token && !headers.authorization) {
        headers.authorization = `Bearer ${token}`;
      }
    }

    const method = (config.method ?? "GET").toUpperCase();
    const timeoutMs = config.timeout ?? this.options.timeout ?? 10000;
    const url = this.buildURL(config);

    const controller = new AbortController();
    let abortHandler: (() => void) | undefined;
    if (config.signal) {
      if (config.signal.aborted) {
        controller.abort((config.signal as AbortSignal).reason);
      } else {
        abortHandler = () => controller.abort((config.signal as AbortSignal).reason);
        config.signal.addEventListener("abort", abortHandler);
      }
    }

    const normalized: EnrichedRequestConfig = {
      ...config,
      method,
      headers,
      signal: controller.signal,
      url
    };

    normalized.body = this.prepareBody(config.data, headers, method);

    if (this.options.cancelDuplicate) {
      this.cancelIfPending(normalized);
      this.pending.set(this.buildKey(normalized), controller);
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutReason =
      typeof DOMException !== "undefined"
        ? new DOMException("Request timed out", "AbortError")
        : ("Request timed out" as unknown);
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => controller.abort(timeoutReason as any), timeoutMs);
    }

    const ctx: RequestContext = {
      requestId,
      startedAt: Date.now(),
      config: normalized
    };

    normalized[HttpClient.metadataKey] = ctx;

    return { normalized, controller, timeoutId, ctx, abortHandler };
  }

  private prepareBody(data: unknown, headers: Record<string, string>, method: string) {
    if (data === undefined || data === null) {
      return undefined;
    }

    const isBodyAllowed = method !== "GET" && method !== "HEAD";
    if (!isBodyAllowed) {
      return undefined;
    }

    if (typeof FormData !== "undefined" && data instanceof FormData) return data;
    if (typeof Blob !== "undefined" && data instanceof Blob) return data;
    if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) return data;
    if (typeof URLSearchParams !== "undefined" && data instanceof URLSearchParams) return data;
    if (typeof ReadableStream !== "undefined" && data instanceof ReadableStream) return data;

    if (typeof data === "string") return data;

    headers["content-type"] = headers["content-type"] ?? "application/json";
    return JSON.stringify(data);
  }

  private async readResponseBody(response: Response) {
    const contentType = response.headers.get("content-type") || "";
    if (response.status === 204 || response.status === 205) return null;

    const text = await response.text();
    if (!text) return null;

    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch {
        // fall through to return raw text
      }
    }
    return text;
  }

  private normalizeError(error: unknown, config: EnrichedRequestConfig) {
    const message =
      error instanceof DOMException && error.name === "AbortError"
        ? error.message || "Request aborted"
        : error instanceof Error
          ? error.message
          : "Unknown network error";
    return this.buildHttpError(message, config);
  }

  private buildHttpError(message: string, config: EnrichedRequestConfig, status?: number, data?: unknown) {
    const sanitizedConfig = this.stripMetadata(config);
    return new HttpError(message, sanitizedConfig, status, data);
  }

  private stripMetadata(config: EnrichedRequestConfig) {
    if (HttpClient.metadataKey in config) {
      const cloned = { ...config };
      delete (cloned as Record<string, unknown>)[HttpClient.metadataKey];
      return cloned;
    }
    return config;
  }

  private cancelIfPending(config: RequestConfig) {
    const key = this.buildKey(config);
    const pending = this.pending.get(key);
    pending?.abort();
    this.pending.delete(key);
  }

  private clearPending(config?: RequestConfig) {
    if (!config) return;
    const key = this.buildKey(config);
    this.pending.delete(key);
  }

  private buildKey(config: RequestConfig) {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();
    const params = config.params ? "[params]" : "";
    const data = config.data ? "[data]" : "";
    return `${method}:${url}?${params}&${data}`;
  }

  private buildURL(config: RequestConfig) {
    const base = config.baseURL ?? this.options.baseURL ?? "";
    const rawUrl = config.url;

    const absolute = /^https?:\/\//i.test(rawUrl);
    const combined = absolute
      ? rawUrl
      : base
        ? `${base.replace(/\/+$/, "")}/${rawUrl.replace(/^\/+/, "")}`
        : rawUrl;

    return this.appendQuery(combined, config.params);
  }

  private appendQuery(url: string, params?: RequestConfig["params"]) {
    if (!params) return url;

    const [pathAndQuery, hash] = url.split("#");
    const [path, existingQuery] = pathAndQuery.split("?");
    const search = new URLSearchParams(existingQuery || "");

    const incoming = params instanceof URLSearchParams ? params : this.objectToSearchParams(params);
    incoming.forEach((value, key) => search.append(key, value));

    const queryString = search.toString();
    const base = queryString ? `${path}?${queryString}` : path;
    return hash ? `${base}#${hash}` : base;
  }

  private objectToSearchParams(
    params: Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>
  ) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => search.append(key, String(v)));
      } else {
        search.append(key, String(value));
      }
    });
    return search;
  }

  private headersToRecord(headers: Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  private toHeaderRecord(headers?: HeadersInit) {
    const record: Record<string, string> = {};
    if (!headers) return record;

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        record[key.toLowerCase()] = value;
      });
      return record;
    }

    if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        record[key.toLowerCase()] = value;
      });
      return record;
    }

    Object.entries(headers).forEach(([key, value]) => {
      record[key.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
    });

    return record;
  }

  private createRequestId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

type EnrichedRequestConfig = RequestConfig & {
  headers: Record<string, string>;
  signal?: AbortSignal;
  [HttpClient.metadataKey]?: RequestContext;
};
