import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET (request) {
  return NextResponse.json({ hello: 'world' })
}
