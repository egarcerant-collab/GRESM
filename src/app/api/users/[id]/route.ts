import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('users')
    .select('uid, email, username, fullName, role, cargo, signature')
    .eq('uid', params.id)
    .single();

  if (error || !data) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { merge, ...data } = body;

  const { data: existing } = await supabase
    .from('users')
    .select('uid')
    .eq('uid', params.id)
    .single();

  if (!existing) {
    const { error } = await supabase.from('users').insert({ uid: params.id, ...data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from('users').update(data).eq('uid', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updated } = await supabase
    .from('users')
    .select('uid, email, username, fullName, role, cargo, signature')
    .eq('uid', params.id)
    .single();

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('users').delete().eq('uid', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
