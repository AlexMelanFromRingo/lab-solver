#!/bin/bash
# sbx.sh 'PowerShell-код'   або   sbx.sh -f файл.ps1  [-t секунд]
# Кладе команду агентові пісочниці й друкує результат.
B=/mnt/c/Users/user/LobeSandbox/io
t=60
if [[ $1 == -f ]]; then code=$(cat "$2"); shift 2; else code=$1; shift; fi
[[ $1 == -t ]] && t=$2
id=$(date +%s%N)
printf '%s' "$code" > "$B/cmd/$id.tmp" && mv "$B/cmd/$id.tmp" "$B/cmd/$id.ps1"
for ((i = 0; i < t * 4; i++)); do
  [[ -f $B/out/$id.txt ]] && { cat "$B/out/$id.txt"; rm -f "$B/out/$id.txt"; exit 0; }
  sleep 0.25
done
echo "немає відповіді за $t с (агент живий: $(cat $B/alive.txt 2>/dev/null))" >&2; exit 1
