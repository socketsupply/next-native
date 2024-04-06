#!/usr/bin/env node
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ssc = path.resolve(__dirname, '../node_modules/@socketsupply/socket/bin/ssc.js')
const pkg = JSON.parse(await fs.promises.readFile(path.join(__dirname, '..', 'package.json'), 'utf8'))

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
