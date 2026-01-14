import { NextResponse } from 'next/server';
import { findUser } from '@/lib/data/users';
import { getSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const user = await findUser(username);

    if (!user || user.password !== password) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;

    const session = await getSession();
    session.user = userWithoutPassword;
    await session.save();
    
    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
