import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('users').select('uid, email, username, fullName, role, cargo, signature');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data: existing } = await supabase
    .from('users')
    .select('uid')
    .eq('username', body.username)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'auth/email-already-in-use' }, { status: 400 });
  }

  if (body.password && body.password.length < 6) {
    return NextResponse.json({ error: 'auth/weak-password' }, { status: 400 });
  }

  const uid = crypto.randomUUID();
  const newUser = {
    uid,
    email: `${body.username}@dusakawi.audit.app`,
    ...body,
  };

  const { error } = await supabase.from('users').insert(newUser);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { password, ...userWithoutPassword } = newUser;
  return NextResponse.json(userWithoutPassword);
}
