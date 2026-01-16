import { NextResponse } from 'next/server';

// This endpoint is no longer used.
export async function POST() {
  return NextResponse.json({ message: 'Authentication is disabled.' }, { status: 404 });
}
