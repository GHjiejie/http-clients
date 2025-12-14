#!/usr/bin/env bash
set -euo pipefail

# 批量从 OpenAPI 文档生成 TS 类型，默认写入 client-demo/src/api/generated。
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"       # client-demo/tools
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"         # 仓库根
ENV_FILE="${ENV_FILE:-"${REPO_ROOT}/client-demo/.gen-types.env"}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

DEFAULT_SRC="${DEFAULT_SRC:-"/Users/jie/WorkSpace/protocols/gen/swagger/pb"}"
SRC="${SRC:-"$DEFAULT_SRC"}"
DEST="${DEST:-"${REPO_ROOT}/src/api/generated"}"
GENERATOR="${GENERATOR:-npx openapi-typescript}"
SRC_IS_REMOTE=false
TMP_SRC=""

print_usage() {
  cat <<'EOF'
用法: bash tools/gen-types.sh --src <openapi根目录>

选项:
  --src <path>   指定接口文档根目录（必填，可用环境变量 SRC 代替）
  -h, --help     显示本帮助
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --src)
      if [[ -z "${2:-}" ]]; then
        echo "缺少 --src 参数值" >&2
        exit 1
      fi
      SRC="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      print_usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$SRC" ]]; then
  echo "未找到接口文档目录，请通过 .gen-types.env/DEFAULT_SRC/SRC 或 --src 提供路径" >&2
  print_usage >&2
  exit 1
fi
if [[ "$SRC" =~ ^https?:// ]]; then
  SRC_IS_REMOTE=true
fi
SRC_CLEAN="${SRC%/}"

if [[ "$SRC_IS_REMOTE" = false ]]; then
  if git -C "$SRC" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git -C "$SRC" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
      git -C "$SRC" fetch --quiet
      read -r ahead_count behind_count <<<"$(git -C "$SRC" rev-list --left-right --count 'HEAD...@{u}')"
      if [[ "${behind_count:-0}" -gt 0 ]]; then
        echo "检测到源码仓库落后上游 ${behind_count} 个提交，请先手动 git -C \"$SRC\" pull 后再执行生成。" >&2
        exit 1
      fi
    fi
  fi
fi

if [[ "$SRC_IS_REMOTE" = true ]]; then
  TMP_SRC="$(mktemp -d "${TMPDIR:-/tmp}/gen-types.XXXX")"
  cleanup() {
    rm -rf "$TMP_SRC"
  }
  trap cleanup EXIT
fi

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
  source_spec="${SRC_CLEAN}/${service}/api.swagger.openapi3.json"
  spec="$source_spec"
  if [[ "$SRC_IS_REMOTE" = false ]]; then
    if [[ ! -f "$spec" ]]; then
      echo "skip ${service}: spec not found at ${spec}" >&2
      continue
    fi
  else
    outfile_basename="$(echo "$service" | tr '/ ' '_')"
    spec="${TMP_SRC}/${outfile_basename}.json"
    echo "download ${source_spec} -> ${spec}"
    if ! curl -fL -o "$spec" "$source_spec"; then
      echo "skip ${service}: download failed from ${source_spec}" >&2
      continue
    fi
  fi

  # 将路径中的 / 转成 _，避免多级目录。
  outfile="${DEST}/$(echo "$service" | tr '/ ' '_').ts"
  echo "generate ${outfile} from ${spec}"

  # 允许通过环境变量替换生成器命令，如: GENERATOR=\"pnpm dlx openapi-typescript\".
  IFS=' ' read -r -a generator_cmd <<< "$GENERATOR"
  "${generator_cmd[@]}" "$spec" -o "$outfile"
done
