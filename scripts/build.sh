#!/bin/sh
# Build script to be used locally for now

build_production () {
  npm install
  mkdir -p lib
  npm run build
}

# run tests before building
echo 'Running tests...'

# builds
echo 'Building libs...'
build_production

echo 'Done!'