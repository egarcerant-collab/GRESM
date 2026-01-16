
import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    {error: 'Login is disabled.'},
    {status: 404}
  );
}
