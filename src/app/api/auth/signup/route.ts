import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir } from '@/lib/data-path';

const usersPath = path.join(getDataDir(), 'users.json');

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const users: any[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

  if (users.find((u) => u.username === username)) {
    return NextResponse.json({ error: 'auth/email-already-in-use' }, { status: 400 });
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'auth/weak-password' }, { status: 400 });
  }

  const uid = crypto.randomUUID();
  const isFirstUser = users.length === 0;

  const newUser = {
    uid,
    email: `${username}@dusakawi.audit.app`,
    username,
    fullName: username,
    role: isFirstUser ? 'admin' : 'user',
    cargo: isFirstUser ? 'Administrador' : 'Auditor',
    password,
  };

  users.push(newUser);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  const { password: _, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword);
}
