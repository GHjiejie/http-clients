# HttpClient 设计与实现拆解

## 思路是什么
- **职责单一**：封装 Axios，统一请求 ID、鉴权头、重复请求取消、响应解包和生命周期事件，避免在业务层分散实现。
- **可配置**：通过 `HttpClientOptions` 注入 baseURL/timeout/默认头/鉴权获取函数/取消重复/响应解包/生命周期回调，遵循开闭原则，对调用方暴露扩展点。
- **类型安全**：`request<TResponse, TBody>` 泛型与自动生成的 OpenAPI 类型组合使用，贯穿请求与响应。
- **可观测**：请求/响应/错误/最终态回调，便于埋点和调试。

## 怎么实现
1. **实例化**（`client-demo/src/api/httpClient.ts:34`）：构造函数接受 `HttpClientOptions`，创建 Axios 实例并设置默认 timeout、baseURL、headers。
2. **请求拦截器**（`client-demo/src/api/httpClient.ts:46`）：
   - 生成或复用 `X-Request-Id`。
   - 调用 `getAuthToken` 注入 `Authorization` 头。
   - 若开启 `cancelDuplicate`，按 `method:url?params&data` 组合键管理 `AbortController`，发送前取消未完成的重复请求。
   - 将请求上下文（ID、开始时间、配置）挂到自定义 metadata 供响应阶段使用，并触发 `onRequest`。
3. **响应拦截器**（`client-demo/src/api/httpClient.ts:70`）：
   - 取出上下文，清理 pending map。
   - 可选 `unwrapResponse` 对 payload 解包后返回，同时触发 `onResponse` 与 `onFinally(success)`。
4. **错误拦截器**（`client-demo/src/api/httpClient.ts:80`）：
   - 把 AxiosError 转换为自定义 `HttpError`（携带 status、data、config），清理 pending，触发 `onError` 与 `onFinally(error)`，再抛出。
5. **公共能力**：
   - `buildKey/cancelIfPending/clearPending`（`client-demo/src/api/httpClient.ts:97`）保证重复请求控制。
   - `createRequestId`（`client-demo/src/api/httpClient.ts:113`）兼容浏览器 `crypto.randomUUID` 或时间戳退化。
   - `resolveContext`（`client-demo/src/api/httpClient.ts:119`）确保异常路径也有上下文。
6. **用法示例**（`client-demo/src/api/client.ts`）：
   - 配置 baseURL、超时、取消重复、默认解包、token 提取，以及 console 日志回调。
   - 业务服务层直接调用 `httpClient.request<TResponse, TBody>(config)`。

## 为什么要这么实现
- **KISS**：把所有横切关注点集中在 HttpClient 内，业务侧只描述 URL/Method/Body，不再关心埋点、鉴权、重复取消等细节。
- **YAGNI**：只保留当前用到的可配置项（鉴权、解包、重复取消、回调），未引入缓存/重试等未需求功能，保持轻量。
- **DRY**：去除每个服务重复注入 token、解包 `{ data }`、打印日志的样板代码。
- **SOLID**：
  - **S**：HttpClient 只负责 HTTP 生命周期，鉴权/解包/埋点均以可选回调注入，不耦合业务。
  - **O**：通过选项和回调开放扩展，不修改内部主流程即可定制。
  - **L/I/D**：对外依赖 Axios 接口与自定义抽象 `HttpError`/回调签名，服务层只依赖抽象方法 `request`，可替换实现。
- **可观测/可调试**：标准化上下文与日志钩子，便于快速排查接口问题；重复请求取消防止用户频繁操作导致的竞态。
