import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let query = supabase.from('audits').select('*');

  searchParams.forEach((value, key) => {
    if (!key.endsWith('_op')) {
      query = query.eq(key, value) as any;
    }
  });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const newAudit = { id, ...body };

  const { error } = await supabase.from('audits').insert(newAudit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id });
}
