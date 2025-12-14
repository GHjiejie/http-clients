# Vue3 + TS + Axios Demo

演示如何将 `protocols/gen/swagger/pb/**/api.swagger.openapi3.json` 自动生成 TypeScript 类型，并在封装的请求库中使用。

## 生成类型

```bash
cd protocols
npm install openapi-typescript -D      # 需要联网
bash ../client-demo/tools/gen-types.sh # 默认读取 client-demo/.gen-types.env 的 SRC，输出到 client-demo/src/api/generated
# 自定义目录示例（覆盖 env）：
# bash ../client-demo/tools/gen-types.sh --src ../protocols/gen/swagger/pb
# 其他源目录示例：
# bash ../client-demo/tools/gen-types.sh --src ../protocols-remote/gen/swagger/pb
# bash ../client-demo/tools/gen-types.sh --src "https://code.qianshi.cn/archer/protocols/src/branch/v0.12-kps/gen/swagger/pb"
```

如需指定生成器，可用 `GENERATOR="pnpm dlx openapi-typescript"` 或 `DEST=...` 覆盖默认目录。
脚本会自动加载 `client-demo/.gen-types.env`（可用 `ENV_FILE` 覆盖），当前默认 `SRC=/Users/jie/WorkSpace/protocols/gen/swagger/pb`。若 `SRC` 为 Git 仓库且落后上游，脚本会提示先手动 `git pull` 后再执行。

## 开发

```bash
cd client-demo
npm install                             # 需要联网
npm run dev                             # 默认 5173
```

### 前端要点

- `src/api/httpClient.ts`：拦截器插入请求 ID、鉴权头，支持重复请求取消、统一错误包装、生命周期回调（开始/成功/失败/结束）。  
- `src/api/client.ts`：实例化 HttpClient，配置 unwrapResponse、埋点。  
- `src/api/services/`：按服务封装 API 方法。  
- `src/App.vue`：企业级聊天界面，支持会话列表、消息记录、模型/知识库参数，可配置 proxy/baseURL/token。
