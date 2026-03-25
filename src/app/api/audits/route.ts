import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDataDir } from '@/lib/data-path';

const auditsPath = path.join(getDataDir(), 'audits.json');

function readAudits(): any[] {
  try {
    return JSON.parse(fs.readFileSync(auditsPath, 'utf-8'));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let audits = readAudits();

  // Apply filters if any query params exist
  searchParams.forEach((value, key) => {
    if (!key.endsWith('_op')) {
      const op = searchParams.get(`${key}_op`) || '==';
      if (op === '==') {
        audits = audits.filter((a) => String(a[key]) === String(value));
      }
    }
  });

  return NextResponse.json(audits);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const audits = readAudits();

  const id = crypto.randomUUID();
  const newAudit = { id, ...body };
  audits.push(newAudit);

  fs.writeFileSync(auditsPath, JSON.stringify(audits, null, 2));
  return NextResponse.json({ id });
}
