import { NextResponse } from 'next/server'
import dynamic from 'next/dynamic'

export const runtime = 'edge'

let os = null

try {
  os = require('node:os')
} catch {}

export async function GET (request) {
  return NextResponse.json({ hello: 'world' })
}
