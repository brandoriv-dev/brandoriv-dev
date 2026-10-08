#!/usr/bin/env bash
set -euo pipefail
# PowerShell's native stdin uses CRLF; Bash read removes only LF.
IFS= read -r token
token=${token%$'\r'}
group=()
if [ -n "${4:-}" ]; then group=(--runnergroup "$4"); fi
./config.sh --unattended --ephemeral \
  --url "${2:?GitHub repository or organization URL required}" \
  --labels "${3:-brandoriv-dev}" --name "$1" --work _work --token "$token" "${group[@]}"
touch .configured
