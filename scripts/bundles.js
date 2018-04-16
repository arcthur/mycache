#!/bin/env

const { statSync, existsSync } = require('fs')
const { join } = require('path')

const printSize = (folder) => {
  const prod = statSync(`dist/${folder}/mycache.prod.min.js`).size
  let diff = '--'
  if (existsSync(`dist/${folder}/mycache.dev.js`)) {
    const dev = statSync(`dist/${folder}/mycache.dev.js`).size
    diff = ((prod / dev) * 100).toFixed(2)
  }
  console.log(`${folder.toUpperCase()}: ${prod} kb (${diff}%)`)
}

console.log('Minified Bundle Sizes')
printSize('cjs')
printSize('esm')
printSize('umd')
