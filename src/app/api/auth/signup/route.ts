import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'auth/weak-password' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('uid')
    .eq('username', username)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'auth/email-already-in-use' }, { status: 400 });
  }

  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
  const isFirstUser = count === 0;

  const uid = crypto.randomUUID();
  const newUser = {
    uid,
    email: `${username}@dusakawi.audit.app`,
    username,
    fullName: username,
    role: isFirstUser ? 'admin' : 'user',
    cargo: isFirstUser ? 'Administrador' : 'Auditor',
    password,
  };

  const { error } = await supabase.from('users').insert(newUser);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { password: _, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword);
}
