#!/usr/bin/env sh
set -eu

APP_NAME="alpha-auto-editor-dev"
PID_FILE="/tmp/${APP_NAME}.pid"
LOCK_DIR="/tmp/${APP_NAME}.lock"

# 获取停止锁
acquire_lock() {
  if mkdir "$LOCK_DIR" >/dev/null 2>&1; then
    return 0
  fi
  echo "停止操作正在进行中，请稍后再试"
  return 1
}

# 释放停止锁
release_lock() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

# 判断 PID 是否存活
is_pid_alive() {
  pid="$1"
  if kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# 平滑停止进程
terminate_pid() {
  pid="$1"
  if ! is_pid_alive "$pid"; then
    return 0
  fi
  kill "$pid" >/dev/null 2>&1 || true
  waited=0
  while is_pid_alive "$pid"; do
    if [ "$waited" -ge 10 ]; then
      kill -9 "$pid" >/dev/null 2>&1 || true
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
}

main() {
  if ! acquire_lock; then
    exit 1
  fi
  trap release_lock EXIT

  if [ ! -f "$PID_FILE" ]; then
    echo "未找到运行中的后台服务"
    exit 0
  fi

  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -z "${pid:-}" ]; then
    rm -f "$PID_FILE"
    echo "PID 文件为空，已清理"
    exit 0
  fi

  if ! is_pid_alive "$pid"; then
    rm -f "$PID_FILE"
    echo "服务未在运行，已清理 PID 文件"
    exit 0
  fi

  terminate_pid "$pid"
  rm -f "$PID_FILE"
  echo "已停止后台服务，PID: $pid"
}

main "$@"
