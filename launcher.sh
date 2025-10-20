#!/bin/bash

# Get the directory where the launcher is located
DIR="$(dirname "$(readlink -f "$0")")"

# Look for AppImage in the same directory
APPIMAGE=$(find "$DIR" -maxdepth 1 -type f -name "INTO-CPS APP-*.AppImage" | head -n 1)

# Look for linux-unpacked binary
UNPACKED_BIN="$DIR/into-cps-app"

# Determine which binary to run
if [ -f "$UNPACKED_BIN" ]; then
    APP_PATH="$UNPACKED_BIN"
elif [ -n "$APPIMAGE" ]; then
    APP_PATH="$APPIMAGE"
else
    echo "[Launcher] Error: no app binary found!"
    exit 1
fi

# Detect VirtualBox
IS_VM=0
if [ -f /sys/devices/virtual/dmi/id/product_name ]; then
    if grep -qi virtualbox /sys/devices/virtual/dmi/id/product_name; then
        IS_VM=1
    fi
fi

# Launch app with --no-sandbox if in VM
if [ $IS_VM -eq 1 ]; then
    echo "[Launcher] VirtualBox detected, using --no-sandbox"
    exec "$APP_PATH" --no-sandbox
else
    exec "$APP_PATH"
fi