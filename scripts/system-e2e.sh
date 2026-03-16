#!/usr/bin/env bash

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:3000}"
PROJECT_KEY="${PROJECT_KEY:-system-e2e}"
TEXT_SAMPLE="${TEXT_SAMPLE:-내부 기획 문서 초안: 시스템 e2e 검증 범위는 health, ingest, query 전체 흐름이다.}"
FILE_ONE="${FILE_ONE:-data/sample_docs/sample_notes.txt}"
FILE_TWO="${FILE_TWO:-data/sample_docs/sample_overview.md}"

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

request() {
  local method="$1"
  local url="$2"
  local body_file="$3"
  shift 3

  local http_code
  : >"$body_file"
  if ! http_code="$(curl -sS -o "$body_file" -w '%{http_code}' -X "$method" "$url" "$@")"; then
    printf '000'
    return 0
  fi
  printf '%s' "$http_code"
}

validate_json() {
  local file="$1"
  local expression="$2"

  node -e "
    const fs = require('node:fs');
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const ok = (() => { return ${expression}; })();
    if (!ok) {
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
  " "$file"
}

json_string() {
  node -pe 'JSON.stringify(process.argv[1])' "$1"
}

require_command curl
require_command node

if [[ ! -f "$FILE_ONE" ]]; then
  echo "Sample file not found: $FILE_ONE" >&2
  exit 1
fi

if [[ ! -f "$FILE_TWO" ]]; then
  echo "Sample file not found: $FILE_TWO" >&2
  exit 1
fi

echo "[1/4] Checking health endpoint"
HEALTH_BODY="$WORK_DIR/health.json"
HEALTH_CODE="$(request GET "$API_BASE_URL/health" "$HEALTH_BODY")"
if [[ "$HEALTH_CODE" != "200" ]]; then
  echo "Health check failed with HTTP $HEALTH_CODE" >&2
  cat "$HEALTH_BODY" >&2
  exit 1
fi
validate_json "$HEALTH_BODY" "data.status === 'ok' && data.chroma === 'ok' && data.ollama === 'ok'"

echo "[2/4] Ingesting inline text"
TEXT_BODY="$WORK_DIR/ingest-text.json"
TEXT_SAMPLE_JSON="$(json_string "$TEXT_SAMPLE")"
PROJECT_KEY_JSON="$(json_string "$PROJECT_KEY")"
TEXT_CODE="$(request POST "$API_BASE_URL/ingest/text" "$TEXT_BODY" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":$TEXT_SAMPLE_JSON,\"metadata\":{\"project\":$PROJECT_KEY_JSON,\"docType\":\"memo\",\"source\":\"system-e2e-inline\"}}")"
if [[ "$TEXT_CODE" != "201" && "$TEXT_CODE" != "200" ]]; then
  echo "Text ingest failed with HTTP $TEXT_CODE" >&2
  cat "$TEXT_BODY" >&2
  exit 1
fi
validate_json "$TEXT_BODY" "Number.isInteger(data.ingested) && data.ingested > 0 && typeof data.collection === 'string' && data.collection.length > 0"

echo "[3/4] Ingesting sample files"
FILES_BODY="$WORK_DIR/ingest-files.json"
FILES_CODE="$(request POST "$API_BASE_URL/ingest/files" "$FILES_BODY" \
  -F "project=$PROJECT_KEY" \
  -F 'docType=planning' \
  -F "files=@$FILE_ONE" \
  -F "files=@$FILE_TWO")"
if [[ "$FILES_CODE" != "201" && "$FILES_CODE" != "200" ]]; then
  echo "File ingest failed with HTTP $FILES_CODE" >&2
  cat "$FILES_BODY" >&2
  exit 1
fi
validate_json "$FILES_BODY" "Array.isArray(data.files) && data.files.length >= 1 && data.files.some((file) => file.status === 'ok' && Number.isInteger(file.ingested) && file.ingested > 0)"

echo "[4/4] Querying grounded response"
QUERY_BODY="$WORK_DIR/query.json"
QUERY_TEXT_JSON="$(json_string "$PROJECT_KEY 프로젝트 문서의 핵심 범위를 요약해줘")"
QUERY_CODE="$(request POST "$API_BASE_URL/query" "$QUERY_BODY" \
  -H 'Content-Type: application/json' \
  -d "{\"question\":$QUERY_TEXT_JSON,\"topK\":6,\"filters\":{\"project\":$PROJECT_KEY_JSON}}")"
if [[ "$QUERY_CODE" != "201" && "$QUERY_CODE" != "200" ]]; then
  echo "Query failed with HTTP $QUERY_CODE" >&2
  cat "$QUERY_BODY" >&2
  exit 1
fi
validate_json "$QUERY_BODY" "typeof data.answer === 'string' && data.answer.trim().length > 0 && Array.isArray(data.citations) && data.citations.length > 0 && Array.isArray(data.retrieved) && data.retrieved.length > 0"

echo "System e2e passed"
