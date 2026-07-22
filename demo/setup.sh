#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

DIR="demo-repo"
rm -rf "$DIR"
mkdir "$DIR"
cd "$DIR"

git init -q -b main
cp ../before/server.js .
git add server.js
git commit -q -m "Initial task API"

git checkout -q -b feature/complete-task
cp ../after/server.js .
git add server.js
git commit -q -m "Add mark-task-complete endpoint"

echo "Demo repo ready at $(pwd), checked out on feature/complete-task."
echo "Run: git diff main..HEAD"
