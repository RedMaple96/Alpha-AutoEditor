#!/usr/bin/env bash
set -euo pipefail

APP_NAME="alpha-auto-editor-dev"
PID_FILE="/tmp/${APP_NAME}.pid"
LOG_FILE="/tmp/${APP_NAME}.log"
LOCK_DIR="/tmp/${APP_NAME}.lock"
WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 进入项目根目录
enter_workdir() {
  cd "$WORKDIR"
}

# 获取正在运行的 PID
get_running_pid() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
    return 0
  fi
  return 1
}

# 判断 PID 是否存活
is_pid_alive() {
  local pid="$1"
  if kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# 清理过期 PID 文件
clear_stale_pid() {
  if [[ ! -f "$PID_FILE" ]]; then
    return 0
  fi
  local pid
  pid="$(cat "$PID_FILE" || true)"
  if [[ -z "${pid:-}" ]]; then
    rm -f "$PID_FILE"
    return 0
  fi
  if ! is_pid_alive "$pid"; then
    rm -f "$PID_FILE"
  fi
}

# 获取启动锁
acquire_lock() {
  if mkdir "$LOCK_DIR" >/dev/null 2>&1; then
    return 0
  fi
  echo "启动操作正在进行中，请稍后再试"
  return 1
}

# 释放启动锁
release_lock() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

main() {
  if ! acquire_lock; then
    exit 1
  fi
  trap release_lock EXIT

  clear_stale_pid

  local existing_pid=""
  if existing_pid="$(get_running_pid 2>/dev/null || true)"; then
    if [[ -n "$existing_pid" ]] && is_pid_alive "$existing_pid"; then
      echo "服务已在后台运行，PID: $existing_pid"
      exit 0
    fi
  fi

  enter_workdir

  nohup npm run dev >"$LOG_FILE" 2>&1 &
  local new_pid="$!"
  echo "$new_pid" >"$PID_FILE"
  echo "已启动后台服务，PID: $new_pid"
  echo "日志文件: $LOG_FILE"
}

main "$@"
