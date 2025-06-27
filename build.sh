#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install FFmpeg
apt-get update && apt-get install -y ffmpeg

# Install Node.js dependencies
npm install
