#!/bin/bash
# Bumps the cache-buster version in builder/index.html.
# Usage: ./bump-version.sh           - bump by 1
#        ./bump-version.sh 42        - set to specific version

set -e
cd "$(dirname "$0")"

FILE="builder/index.html"
if [ ! -f "$FILE" ]; then
  echo "Error: $FILE not found. Run this script from the project root." >&2
  exit 1
fi

CURRENT=$(grep -o '?v=[0-9]*' "$FILE" | head -1 | sed 's/?v=//')
if [ -z "$CURRENT" ]; then
  echo "No ?v=N pattern found in $FILE. Nothing to bump." >&2
  exit 1
fi

if [ -n "$1" ]; then
  NEW="$1"
else
  NEW=$((CURRENT + 1))
fi

# Use sed -i with empty arg for macOS, no arg for GNU. We use a non-greedy-friendly regex
# without word-boundaries (BSD sed doesn't support \b).
PATTERN="?v=${CURRENT}\""
REPLACE="?v=${NEW}\""
if sed --version >/dev/null 2>&1; then
  sed -i "s|${PATTERN}|${REPLACE}|g" "$FILE"
else
  sed -i '' "s|${PATTERN}|${REPLACE}|g" "$FILE"
fi

COUNT=$(grep -c "?v=${NEW}\"" "$FILE")
echo "Bumped cache-buster: v=${CURRENT} -> v=${NEW} (${COUNT} references in ${FILE})"
