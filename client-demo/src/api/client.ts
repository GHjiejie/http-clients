import { HttpClient } from "./httpClient";

const defaultUnwrap = (payload: unknown) => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as Record<string, unknown>)["data"];
  }
  return payload;
};

const defaultBaseURL = (import.meta as any).env?.VITE_API_BASE_URL ?? "http://10.166.81.57:30099/";
const defaultToken = (import.meta as any).env?.VITE_API_TOKEN;

export const httpClient = new HttpClient({
  baseURL: defaultBaseURL,
  timeout: 12000,
  cancelDuplicate: false,
  unwrapResponse: defaultUnwrap,
  getAuthToken: () => {
    return defaultToken || undefined;
  },
  onRequest: (ctx) => {
    console.debug(`[request] ${ctx.requestId}`, ctx.config.method, ctx.config.url);
  },
  onResponse: (response, ctx) => {
    console.debug(`[response] ${ctx.requestId}`, response.status, `${Date.now() - ctx.startedAt}ms`);
  },
  onError: (error, ctx) => {
    console.error(`[error] ${ctx.requestId}`, error.status, error.message);
  },
  onFinally: (ctx, outcome) => {
    console.debug(`[finally] ${ctx.requestId} -> ${outcome}`);
  }
});
