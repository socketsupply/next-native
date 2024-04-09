import { NextResponse } from 'next/server'
import dynamic from 'next/dynamic'

export const runtime = 'edge'

export async function GET (request) {
  return NextResponse.json({ hello: 'world' })
}
