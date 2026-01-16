
import 'server-only';
import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, type SessionData } from './session-options';

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}
