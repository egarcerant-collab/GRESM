import type { IronSessionOptions, IronSessionData } from 'iron-session';
import type { User } from './types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_dev';

if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    throw new Error('SESSION_SECRET environment variable must be set and be at least 32 characters long in production.');
}

export const sessionOptions: IronSessionOptions = {
    password: SESSION_SECRET,
    cookieName: 'audit-logger-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

export interface SessionData extends IronSessionData {
  user?: Omit<User, 'password' | 'signature'>;
}
