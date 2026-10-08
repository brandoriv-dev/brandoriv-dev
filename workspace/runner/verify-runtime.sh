#!/usr/bin/env bash
# Run inside a disposable private runner sharing its fresh daemon's network.
set -euo pipefail
test "$(id -u)" -ne 0
test "${DOCKER_HOST:-}" = tcp://127.0.0.1:2375
docker info --format '{{json .SecurityOptions}}' | grep -q 'name=rootless'
test -w "$RUNNER_TOOL_CACHE"
node --version
bun --version
gh --version | head -1
az version --output json
az bicep version
dotnet --version
probe=$(mktemp -d)
sql_started=false
cleanup() {
  if $sql_started; then docker rm --force device-runtime-sql-probe >/dev/null; fi
  docker image rm device-runtime-probe >/dev/null 2>&1 || true
  rm -rf "$probe"
}
trap cleanup EXIT
printf 'runner probe\n' > "$probe/marker"
printf 'FROM scratch\nCOPY marker /marker\n' > "$probe/Dockerfile"
docker build --tag device-runtime-probe "$probe"
docker image inspect device-runtime-probe >/dev/null
printf "param name string = 'runner'\noutput result string = name\n" > "$probe/main.bicep"
az bicep build --file "$probe/main.bicep" --stdout >/dev/null
dotnet new console --output "$probe/console" --no-restore >/dev/null
dotnet run --project "$probe/console" | grep -q 'Hello, World!'
python3 -m venv "$probe/venv"
chromium=$(find /ms-playwright -path '*/chrome-linux64/chrome' -type f | head -1)
"$chromium" --headless --no-sandbox --disable-gpu --dump-dom 'data:text/html,runner-browser-probe' 2>/dev/null | grep -q runner-browser-probe
if [ "${1:-}" = --sql ]; then
  export MSSQL_SA_PASSWORD="$(openssl rand -hex 24)Aa1_"
  export SQLCMDPASSWORD="$MSSQL_SA_PASSWORD"
  docker run --detach --name device-runtime-sql-probe \
    --publish 127.0.0.1:1433:1433 --env ACCEPT_EULA=Y --env MSSQL_PID=Developer --env MSSQL_SA_PASSWORD \
    mcr.microsoft.com/mssql/server@sha256:4402d880dd4c34bfa7d8705e56a86cd6c88da80a1f6bbbe741f999e76264a090 >/dev/null
  sql_started=true
  ready=false
  for attempt in $(seq 1 90); do
    if docker exec --env SQLCMDPASSWORD device-runtime-sql-probe /opt/mssql-tools18/bin/sqlcmd -C -l 5 -S 127.0.0.1 -U sa -b \
      -Q 'CREATE DATABASE DeviceRunnerProbe; SELECT COUNT(*) FROM sys.databases WHERE name = '\''DeviceRunnerProbe'\''' >/dev/null 2>&1; then
      ready=true
      break
    fi
    sleep 2
  done
  $ready
  node -e 'const socket=require("node:net").connect(1433,"127.0.0.1"); socket.setTimeout(5000); socket.on("connect",()=>socket.end()); socket.on("error",()=>process.exit(1)); socket.on("timeout",()=>process.exit(1));'
fi
echo 'Device runner runtime checks passed.'
