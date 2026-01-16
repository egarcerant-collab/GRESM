import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session-options';
import { cookies } from 'next/headers';

export async function POST() {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.destroy();
    return NextResponse.json({ success: true });
}
