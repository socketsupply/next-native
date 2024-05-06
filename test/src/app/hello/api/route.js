import { NextResponse } from 'next/server'
import dynamic from 'next/dynamic'
import fs from 'socket:fs/promises'

export const runtime = 'edge'

export async function GET (request) {
  const entries = await fs.readdir('.')
  return NextResponse.json({ entries, hello: 'world' })
}
