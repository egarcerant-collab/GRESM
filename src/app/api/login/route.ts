import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session-options';
import { findUserByUsernameForLogin } from '@/lib/data/users';
import { cookies } from 'next/headers';
import { loginSchema } from '@/lib/schema';

export async function POST(request: Request) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  const body = await request.json();

  const validatedFields = loginSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      { error: "Nombre de usuario y contraseña son requeridos." },
      { status: 400 }
    );
  }

  const { username, password } = validatedFields.data;

  try {
    const user = await findUserByUsernameForLogin(username);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, signature: __, ...userWithoutPassword } = user;
    session.user = userWithoutPassword;
    await session.save();

    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor." },
      { status: 500 }
    );
  }
}
