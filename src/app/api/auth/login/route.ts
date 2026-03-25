import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'auth/invalid-credential' }, { status: 401 });
  }

  const { password: _, ...userWithoutPassword } = data;
  return NextResponse.json(userWithoutPassword);
}
