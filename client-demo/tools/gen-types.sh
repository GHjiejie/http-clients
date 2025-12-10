#!/usr/bin/env bash
set -euo pipefail

# 批量从 OpenAPI 文档生成 TS 类型，默认写入 client-demo/src/api/generated。
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"       # client-demo/tools
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"         # 仓库根
PROTO_ROOT="${PROTO_ROOT:-"${REPO_ROOT}/protocols"}"
SRC="${SRC:-"${PROTO_ROOT}/gen/swagger/pb"}"
DEST="${DEST:-"${REPO_ROOT}/client-demo/src/api/generated"}"
GENERATOR="${GENERATOR:-npx openapi-typescript}"

# 当前仓库内存在的可用 openapi3 规格文件列表，可按需增删。
SERVICES=(
  console
  embeddings-service
  data-process-service
  doclib-retrieve-worker
  fine-tuning-job-service
  "llm-apps/chatbot"
  doclib-manager-service
)

mkdir -p "$DEST"

for service in "${SERVICES[@]}"; do
  spec="${SRC}/${service}/api.swagger.openapi3.json"
  if [[ ! -f "$spec" ]]; then
    echo "skip ${service}: spec not found at ${spec}" >&2
    continue
  fi

  # 将路径中的 / 转成 _，避免多级目录。
  outfile="${DEST}/$(echo "$service" | tr '/ ' '_').ts"
  echo "generate ${outfile} from ${spec}"

  # 允许通过环境变量替换生成器命令，如: GENERATOR=\"pnpm dlx openapi-typescript\".
  IFS=' ' read -r -a generator_cmd <<< "$GENERATOR"
  "${generator_cmd[@]}" "$spec" -o "$outfile"
done
