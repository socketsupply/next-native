#!/usr/bin/env node
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ssc = path.resolve(__dirname, '../node_modules/@socketsupply/socket/bin/ssc.js')
const pkg = JSON.parse(await fs.promises.readFile(path.join(__dirname, '..', 'package.json')))

function run (args) {
  const p = spawn(ssc, args)

  p.stdout.on('data', data => {
    const str = data.toString().replace(/ssc/g, 'next-native')
    console.log(str)
  })

  p.on('error', err => {
    console.error(`Failed to run peer binary: ${err}`)
    process.exit(1)
  })

  p.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`Peer binary exited with code ${code} and signal ${signal}`)
      process.exit(1)
    }
  })
}

function main (args) {
  run(args) // TODO(@heapwolf): set up specific next use cases for running ssc
}

main(process.argv.slice(2))
