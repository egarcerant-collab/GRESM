import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir, getPublicDir } from '@/lib/data-path';

const usersPath = path.join(getDataDir(), 'users.json');

function saveSignatureFile(uid: string, base64DataUrl: string): string {
  const sigDir = path.join(getPublicDir(), 'signatures');
  if (!fs.existsSync(sigDir)) fs.mkdirSync(sigDir, { recursive: true });
  const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
  const filePath = path.join(sigDir, `${uid}.png`);
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  return `/signatures/${uid}.png`;
}

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
  if (body.signature && body.signature.startsWith('data:')) {
    body.signature = saveSignatureFile(uid, body.signature);
  }
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
