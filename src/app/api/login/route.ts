
import {NextResponse} from 'next/server';
import {getIronSession} from 'iron-session';
import {cookies} from 'next/headers';
import {sessionOptions, type SessionData} from '@/lib/session';
import {findUserByUsernameForLogin} from '@/lib/data/users';
import {loginSchema} from '@/lib/schema';
import {z} from 'zod';

export async function POST(request: Request) {
  const body = await request.json();
  const validatedFields = loginSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json({error: 'Datos inválidos.'}, {status: 400});
  }

  const {username, password} = validatedFields.data;

  try {
    const user = await findUserByUsernameForLogin(username);

    if (!user || user.password !== password) {
      return NextResponse.json(
        {error: 'Nombre de usuario o contraseña incorrectos.'},
        {status: 401}
      );
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {password: _, signature: __, ...userWithoutPassword} = user;
    session.user = userWithoutPassword;
    await session.save();

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {error: 'Ocurrió un error en el servidor.'},
      {status: 500}
    );
  }
}
