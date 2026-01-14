import { IronSession, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { User } from './types';

// This is the secret used to encrypt the session cookie.
// It should be a long, random string.
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD as string || 'complex_password_at_least_32_characters_long',
  cookieName: 'audit-logger-session',
  cookieOptions: {
    // secure: process.env.NODE_ENV === 'production',
    secure: false, // Use true in production with HTTPS
  },
};

export async function getSession(): Promise<IronSession<{ user?: Omit<User, 'password'> }>> {
  const session = await getIronSession<{ user?: Omit<User, 'password'> }>(cookies(), sessionOptions);
  return session;
}
