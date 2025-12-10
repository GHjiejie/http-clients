# gen-types.sh 脚本说明（client-demo/tools/gen-types.sh）

## 脚本作用
- 批量读取 `protocols/gen/swagger/pb/**/api.swagger.openapi3.json` 的 OpenAPI 3 规格，生成对应的 TypeScript 类型定义。
- 输出文件位于 `client-demo/src/api/generated`（默认），供服务封装和组件直接复用类型。

## 工作流程
1. 计算路径：`SCRIPT_DIR`（脚本所在目录）、`REPO_ROOT`（仓库根）、`PROTO_ROOT`（协议目录，默认为 `../protocols`）、`SRC`（规格根目录）、`DEST`（输出目录）。
2. 预设服务列表 `SERVICES`：
   - `console`
   - `embeddings-service`
   - `data-process-service`
   - `doclib-retrieve-worker`
   - `fine-tuning-job-service`
   - `llm-apps/chatbot`
   - `doclib-manager-service`
3. 逐个服务处理：
   - 拼接规格文件路径 `${SRC}/${service}/api.swagger.openapi3.json`，不存在则跳过并提示。
   - 将服务名中的 `/` 转为 `_`，生成输出文件名（如 `llm-apps/chatbot` → `llm-apps_chatbot.ts`）。
   - 调用生成器命令（默认 `npx openapi-typescript`）将 OpenAPI 转为 TS 类型。

## 可配置项（环境变量）
- `PROTO_ROOT`：协议仓库根目录，默认 `./protocols`。
- `SRC`：OpenAPI 规格所在目录，默认 `${PROTO_ROOT}/gen/swagger/pb`。
- `DEST`：类型输出目录，默认 `client-demo/src/api/generated`。
- `GENERATOR`：生成器命令，默认 `npx openapi-typescript`，可设为 `pnpm dlx openapi-typescript` 等。
- `SERVICES` 需在脚本内修改：增/删服务时编辑数组即可。

## 使用示例
```bash
cd client-demo
# 首次需要安装依赖（需联网）：
npm install
# 生成类型（使用默认路径和 npx openapi-typescript）
bash tools/gen-types.sh
# 生成到自定义目录并使用 pnpm：
DEST=./tmp/generated GENERATOR="pnpm dlx openapi-typescript" bash tools/gen-types.sh
```

## 设计取舍
- **KISS/DRY**：集中定义服务列表、统一输出命名规约，避免为每个服务写单独命令。
- **YAGNI**：只做类型生成，不掺杂构建/发布等额外逻辑，保持脚本简洁。
- **鲁棒性**：缺失的规格文件会提示并跳过，不会中断整个批量流程。***
