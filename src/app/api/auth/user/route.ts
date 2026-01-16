import { NextResponse } from 'next/server';

// This endpoint is no longer used.
export async function GET() {
  return NextResponse.json({ user: null }, { status: 404 });
}
