import { NextResponse } from 'next/server';

// This endpoint is no longer used.
export async function PUT() {
  return NextResponse.json({ message: 'User management is disabled.' }, { status: 404 });
}
