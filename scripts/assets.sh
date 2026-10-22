#!/usr/bin/env bash
set -euo pipefail

osrs-sdk-assets build "$@"
npm run --silent item-icons -- "$@"
