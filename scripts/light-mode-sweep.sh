#!/usr/bin/env bash
# Sweep hardcoded dark hex values + `text-white` to light-mode equivalents
# across .tsx/.ts/.css files under src/.
#
# Run from repo root or kadant-admin/. Idempotent — re-runs are no-ops.
# Recommend committing all current work BEFORE running so you can diff/revert.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -d src ]; then
  echo "Run from kadant-admin/ — could not find src/."
  exit 1
fi

echo "Files that will be modified:"
grep -rlE "#0a0a0a|#0d0d0d|#171717|#1a1a1a|#262626|#2a2a2a|#404040|#1f2a44|text-white|#f3f4f6|#e7e9ea|#a1a1a1|#737373|#525252|#99A1AF|#6a7282|#d4d4d4|#0f1419|#16202a|#1c2732|#38444d" \
  --include="*.tsx" --include="*.ts" --include="*.css" src \
  | sort -u

read -p "Proceed? [y/N] " ans
[[ "$ans" =~ ^[Yy]$ ]] || { echo "aborted"; exit 0; }

find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) -exec sed -i '' \
  -e 's/#0a0a0a/#ffffff/g' \
  -e 's/#0d0d0d/#ffffff/g' \
  -e 's/#171717/#ffffff/g' \
  -e 's/#1a1a1a/#f9fafb/g' \
  -e 's/#262626/#e5e7eb/g' \
  -e 's/#2a2a2a/#f1f5f9/g' \
  -e 's/#404040/#d1d5db/g' \
  -e 's/#1f2a44/#e5e7eb/g' \
  -e 's/#0f1419/#ffffff/g' \
  -e 's/#16202a/#ffffff/g' \
  -e 's/#1c2732/#f9fafb/g' \
  -e 's/#38444d/#e5e7eb/g' \
  -e 's/#f3f4f6/#1f2937/g' \
  -e 's/#e7e9ea/#1f2937/g' \
  -e 's/#a1a1a1/#6b7280/g' \
  -e 's/#737373/#6b7280/g' \
  -e 's/#525252/#4b5563/g' \
  -e 's/#99A1AF/#6b7280/g' \
  -e 's/#6a7282/#6b7280/g' \
  -e 's/#d4d4d4/#6b7280/g' \
  -e 's/text-white/text-gray-900/g' \
  {} +

echo "Done."
