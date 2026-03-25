import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir } from '@/lib/data-path';

const usersPath = path.join(getDataDir(), 'users.json');

function readUsers(): any[] {
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

export async function GET() {
  const users = readUsers();
  return NextResponse.json(users.map(({ password, ...u }: any) => u));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const users = readUsers();

  if (users.find((u) => u.username === body.username)) {
    return NextResponse.json({ error: 'auth/email-already-in-use' }, { status: 400 });
  }

  if (body.password && body.password.length < 6) {
    return NextResponse.json({ error: 'auth/weak-password' }, { status: 400 });
  }

  const uid = crypto.randomUUID();
  const newUser = {
    uid,
    email: `${body.username}@dusakawi.audit.app`,
    ...body,
  };

  users.push(newUser);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  const { password, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword);
}
