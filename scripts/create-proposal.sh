#!/usr/bin/env bash
# create-proposal.sh — Create a Canton governance proposal via the JSON API.
set -euo pipefail

CANTON_HOST="${CANTON_HOST:-localhost}"
CANTON_PORT="${CANTON_PORT:-7575}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
PROPOSER="${PROPOSER:-}"

usage() {
  echo "Usage: $0 --title <title> --payload <payload> --quorum <pct> --voters <p1,p2,...>"
  echo ""
  echo "Env vars:"
  echo "  CANTON_HOST   Canton JSON API host (default: localhost)"
  echo "  CANTON_PORT   Canton JSON API port (default: 7575)"
  echo "  AUTH_TOKEN    JWT for the Canton JSON API"
  echo "  PROPOSER      Proposer party ID"
  exit 1
}

TITLE="" PAYLOAD="" QUORUM=66 VOTERS_CSV=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)   TITLE="$2";       shift 2 ;;
    --payload) PAYLOAD="$2";     shift 2 ;;
    --quorum)  QUORUM="$2";      shift 2 ;;
    --voters)  VOTERS_CSV="$2";  shift 2 ;;
    *) usage ;;
  esac
done

[[ -z "$TITLE"       ]] && { echo "Error: --title required";   usage; }
[[ -z "$PAYLOAD"     ]] && { echo "Error: --payload required"; usage; }
[[ -z "$VOTERS_CSV"  ]] && { echo "Error: --voters required";  usage; }
[[ -z "$PROPOSER"    ]] && { echo "Error: PROPOSER env required"; usage; }

VOTERS_JSON=$(echo "$VOTERS_CSV" | python3 -c "
import sys, json
voters = [v.strip() for v in sys.stdin.read().split(',')]
print(json.dumps(voters))
")

DEADLINE=$(date -u -d "+7 days" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null            || date -u -v+7d +"%Y-%m-%dT%H:%M:%SZ")

echo "Creating governance proposal..."
echo "  Title   : $TITLE"
echo "  Quorum  : $QUORUM%"
echo "  Deadline: $DEADLINE"
echo "  Voters  : $VOTERS_CSV"
echo ""

curl -sf   -H "Authorization: Bearer $AUTH_TOKEN"   -H "Content-Type: application/json"   "http://${CANTON_HOST}:${CANTON_PORT}/v1/create"   -d @- << JSON
{
  "templateId": "Governance:Proposal:Proposal",
  "payload": {
    "proposer":       "$PROPOSER",
    "title":          "$TITLE",
    "description":    "$TITLE",
    "voters":         $VOTERS_JSON,
    "quorumPct":      $QUORUM,
    "votingDeadline": "$DEADLINE",
    "payload":        "$PAYLOAD",
    "guardian":       null
  }
}
JSON

echo ""
echo "Proposal created successfully."
