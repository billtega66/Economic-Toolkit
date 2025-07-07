#!/usr/bin/env bash
# Check for missing npm packages

npm ls >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Some npm packages are missing. Run './scripts/setup.sh' to install them."
  exit 1
else
  echo "All npm packages are installed."
fi