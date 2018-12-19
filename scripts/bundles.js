#!/bin/env

const { statSync, existsSync } = require('fs')

function printSize(folder) {
  if (existsSync(`dist/${folder}/mycache.js`)) {
    const size = statSync(`dist/${folder}/mycache.js`).size
    console.log(`${folder.toUpperCase()}: ${size} kb`)
  }
}

console.log('Minified Bundle Sizes')
printSize('cjs')
printSize('esm')
printSize('umd')
