import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir } from '@/lib/data-path';

const usersPath = path.join(getDataDir(), 'users.json');

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const users: any[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'auth/invalid-credential' }, { status: 401 });
  }
  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}
