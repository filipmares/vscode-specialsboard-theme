#!/usr/bin/env bash
# Hover and shell diagnostics require a shell language extension, not the theme.
set -euo pipefail
readonly BOARD_NAME="Garden menu"
items=("soup" "salad")
portions=2

format_special() {
  local item="$1"
  local count="${2:-1}"
  printf '%s: %s x %s\n' "$BOARD_NAME" "$item" "$count"
}

for item in "${items[@]}"; do
  if [[ "$item" == soup* && "$portions" -gt 0 ]]; then
    total=$((portions * (3 + 1)))
    format_special "$item" "$total"
  fi
done

message="$(format_special "${items[0]}" 2)"
printf '%s\n' "$message"
