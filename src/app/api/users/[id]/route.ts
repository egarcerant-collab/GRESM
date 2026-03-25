import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir } from '@/lib/data-path';

const usersPath = path.join(getDataDir(), 'users.json');

function readUsers(): any[] {
  return JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const users = readUsers();
  const user = users.find((u) => u.uid === params.id);
  if (!user) return NextResponse.json(null, { status: 404 });
  const { password, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const users = readUsers();
  const index = users.findIndex((u) => u.uid === params.id);

  if (index === -1) {
    // User not found - create it (used by signup flow)
    const newUser = { ...body };
    users.push(newUser);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    const { password, ...withoutPassword } = newUser;
    return NextResponse.json(withoutPassword);
  }

  const { merge, ...data } = body;
  if (merge) {
    users[index] = { ...users[index], ...data };
  } else {
    users[index] = { ...users[index], ...data };
  }

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  const { password, ...userWithoutPassword } = users[index];
  return NextResponse.json(userWithoutPassword);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const users = readUsers();
  const filtered = users.filter((u) => u.uid !== params.id);
  fs.writeFileSync(usersPath, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
