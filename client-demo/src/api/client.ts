import { HttpClient } from "./httpClient";

type Outcome = "success" | "error";

interface Trace {
  id: string;
  url?: string;
  method?: string;
  startedAt: number;
}

interface Stats {
  started: number;
  succeeded: number;
  failed: number;
  lastError?: {
    id: string;
    url?: string;
    method?: string;
    status?: number;
    message: string;
  };
}

const defaultUnwrap = (payload: unknown) => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as Record<string, unknown>)["data"];
  }
  return payload;
};

const defaultBaseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://10.166.81.57:30099/";
const defaultToken = (import.meta as any).env?.VITE_API_TOKEN;

// 轻量级请求跟踪，用于统一统计与外部事件通知
const pending = new Map<string, Trace>();
const stats: Stats = { started: 0, succeeded: 0, failed: 0 };

const dispatchLifecycleEvent = (type: string, detail: Record<string, unknown>) => {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(`httpClient:${type}`, { detail }));
  }
};

const startTrace = (trace: Trace) => {
  pending.set(trace.id, trace);
  stats.started += 1;
  dispatchLifecycleEvent("request", trace);
};

const finishTrace = (id: string, outcome: Outcome, extra: Record<string, unknown> = {}) => {
  const trace = pending.get(id);
  if (trace) {
    pending.delete(id);
  }
  const duration = trace ? Date.now() - trace.startedAt : undefined;

  if (outcome === "success") {
    stats.succeeded += 1;
  } else {
    stats.failed += 1;
    stats.lastError = {
      id,
      url: trace?.url,
      method: trace?.method,
      status: extra.status as number | undefined,
      message: (extra.message as string) || "unknown error"
    };
  }

  dispatchLifecycleEvent("complete", {
    id,
    outcome,
    duration,
    ...trace,
    ...extra
  });
};

export const httpClient = new HttpClient({
  baseURL: defaultBaseURL,
  timeout: 12000,
  cancelDuplicate: false,
  unwrapResponse: defaultUnwrap,
  getAuthToken: () => {
    return defaultToken || undefined;
  },
  onRequest: (ctx) => {
    startTrace({
      id: ctx.requestId,
      url: ctx.config.url,
      method: ctx.config.method,
      startedAt: ctx.startedAt
    });
  },
  onResponse: (response, ctx) => {
    finishTrace(ctx.requestId, "success", {
      status: response.status,
      duration: Date.now() - ctx.startedAt
    });
  },
  onError: (error, ctx) => {
    finishTrace(ctx.requestId, "error", {
      status: error.status,
      message: error.message
    });
  },
  onFinally: (ctx, outcome) => {
    // 对外曝光当前统计，便于 UI 或调试工具订阅
    dispatchLifecycleEvent("stats", {
      current: {
        pending: pending.size,
        ...stats
      },
      lastRequestId: ctx.requestId,
      outcome
    });
  }
});
