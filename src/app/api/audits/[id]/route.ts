import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('audits')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !data) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('audits').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
