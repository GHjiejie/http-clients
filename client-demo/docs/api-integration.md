# API 集成与类型使用说明

## 1. 类型来源与生成
- 来源：`protocols/gen/swagger/pb/**/api.swagger.openapi3.json`（OpenAPI 3.0 规范，需要显式传入目录）。
- 生成脚本：`client-demo/tools/gen-types.sh`（输出 `client-demo/src/api/generated`）。
- 快捷命令（需联网安装依赖）：
  ```bash
  cd client-demo
  npm install
  npm run gen:types      # 默认读取 client-demo/.gen-types.env 的 SRC（可用 ENV_FILE 覆盖）
  # 或: npm run gen:types -- --src ../protocols/gen/swagger/pb 覆盖默认
  # 远程示例: npm run gen:types -- --src "https://code.qianshi.cn/archer/protocols/src/branch/v0.12-kps/gen/swagger/pb"
  ```
- 脚本默认使用 `npx openapi-typescript` 将每个服务的 spec 转为 TypeScript 类型；可通过环境变量覆盖：
  - `DEST=...` 更改输出目录
  - `GENERATOR="pnpm dlx openapi-typescript"` 替换执行器
  - `SRC` 可通过 env/参数/默认值提供；不指定则使用 env 中的默认路径
  - 若 `SRC` 是 Git 仓库且落后上游，会提示先手动 `git pull` 后再生成
  - 默认从 `client-demo/.gen-types.env` 读取 `SRC`（可用 `ENV_FILE` 覆盖）
  - 修改 `client-demo/tools/gen-types.sh` 的 `SERVICES` 数组增删服务

生成后，每个服务会对应一个 `.ts` 类型文件，例如 `client-demo/src/api/generated/console.ts`，其中导出了 `paths`/`components` 等类型映射。

## 2. 请求与响应类型绑定
- 示例接口 `/v1/auth/login`（console 服务）：
  - 请求体类型：`paths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"]`
  - 响应体类型：`paths["/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"]`
- 在服务层进行显式别名，避免在业务层书写深层索引：
  ```ts
  // client-demo/src/api/services/console.ts
  import type { paths as ConsolePaths } from "../generated/console";

  export type LoginRequest = ConsolePaths["/v1/auth/login"]["post"]["requestBody"]["content"]["application/json"];
  export type LoginResponse = ConsolePaths["/v1/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];
  ```

## 3. 请求封装（HttpClient）
- 位置：`client-demo/src/api/httpClient.ts`
- 能力：统一请求 ID、可选重复请求取消、鉴权头注入、响应解包、生命周期回调（请求/响应/错误/结束）、标准化错误 `HttpError`。
- 使用：服务层通过 `httpClient.request<TResponse, TBody>(config)` 发起请求，泛型参数直接使用生成的请求/响应类型。

## 4. 客户端实例配置
- 位置：`client-demo/src/api/client.ts`
- 主要配置：
  - `baseURL`（从 `VITE_API_BASE_URL` 读取，默认 `http://localhost:8080`）
  - `unwrapResponse`：将后端 `{ data: ... }` 结构解包为裸数据
  - `getAuthToken`：示例从 `localStorage` 获取 token
  - 生命周期回调：控制台埋点请求/响应/错误

## 5. 组件层使用示例
- 位置：`client-demo/src/App.vue`
- 过程：表单收集 `LoginRequest` 字段 -> 调用 `consoleApi.login(form)` -> 收到 `LoginResponse` 显示结果；加载/错误状态由组件自身管理。

## 6. 目录速览
- `client-demo/tools/gen-types.sh`：类型生成脚本（读取 specs，调用 openapi-typescript）。
- `client-demo/src/api/generated/`：自动生成的请求/响应类型（勿手改）。
- `client-demo/src/api/httpClient.ts`：请求封装（Axios 实例）。
- `client-demo/src/api/client.ts`：HttpClient 单例配置。
- `client-demo/src/api/services/`：按业务/服务划分的 API 方法与类型别名：
  - `console.ts`（登录/验证码/注销）
  - `llmApps.ts`（无状态与会话对话）
  - `doclibManage.ts`（知识库/文件管理）
  - `dataProcess.ts`（解析任务 CRUD）
  - `doclibRetrieveWorker.ts`（知识库检索）
  - `embeddings.ts`（Embedding/Rerank）
  - `fineTuningJob.ts`（微调任务）
- `client-demo/src/App.vue`：页面示例。

## 7. 自定义与扩展
- 新增接口：仅需在服务层引入对应 `paths` 类型并封装方法，无需手写 DTO。
- 新增服务：在 `client-demo/tools/gen-types.sh` 的 `SERVICES` 中添加服务子目录，重新运行 `npm run gen:types`。
- 运行时校验：如需数据校验，可在 `unwrapResponse` 后接入 Zod/自定义校验，保持类型与数据一致性。

## 8. 仅提供远程协议仓库/接口文档时的处理方式
- 场景：后端只提供远程协议仓库（如 `https://code.qianshi.cn/archer/protocols`）或线上 OpenAPI 地址，没有本地文件。
- 方法 A（推荐，便于版本固定）：拉取/下载仓库到本地任意路径，生成时指定源目录：
  ```bash
  # 假设克隆到 ../protocols-remote
  SRC=../protocols-remote/gen/swagger/pb DEST=./src/api/generated bash ../client-demo/tools/gen-types.sh
  ```
  或直接把远程仓库作为 git submodule，挂在 `protocols` 目录，脚本无需改动。
- 方法 B（直接用线上 OpenAPI URL，适用于单个接口文档已发布的情况）：
  ```bash
  npx openapi-typescript "https://example.com/openapi.json" -o src/api/generated/remote.ts
  ```
  如需携带鉴权头（私有文档）：`openapi-typescript --headers 'Authorization: Bearer <token>' <url> -o ...`。
- 建议：无论哪种方式，尽量把生成时使用的 spec 固化（下载到仓库或存储在制品仓库），避免线上文档变更导致构建不可重现。
