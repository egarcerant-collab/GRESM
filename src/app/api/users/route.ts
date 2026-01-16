import { NextResponse } from 'next/server';

// This endpoint is no longer used.
export async function GET() {
    return NextResponse.json([], { status: 404 });
}

export async function POST() {
    return NextResponse.json({ message: 'User management is disabled.' }, { status: 404 });
}
