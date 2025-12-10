# Vue3 + TS + Axios Demo

演示如何将 `protocols/gen/swagger/pb/**/api.swagger.openapi3.json` 自动生成 TypeScript 类型，并在封装的请求库中使用。

## 生成类型

```bash
cd protocols
npm install openapi-typescript -D      # 需要联网
bash ../client-demo/tools/gen-types.sh # 输出到 client-demo/src/api/generated
```

如需指定生成器，可用 `GENERATOR="pnpm dlx openapi-typescript"` 或 `DEST=...` 覆盖默认目录。

## 开发

```bash
cd client-demo
npm install                             # 需要联网
npm run dev                             # 默认 5173
```

### 请求封装要点

- `src/api/httpClient.ts`：拦截器插入请求 ID、鉴权头，支持重复请求取消、统一错误包装、生命周期回调（开始/成功/失败/结束）。  
- `src/api/client.ts`：实例化 HttpClient，配置 unwrapResponse、埋点。  
- `src/api/services/console.ts`：示例接口，直接使用生成的 OpenAPI 类型。  
- `src/App.vue`：演示登录表单调用 `/v1/auth/login`。
