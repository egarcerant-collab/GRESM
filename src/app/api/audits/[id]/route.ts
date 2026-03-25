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

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const audits = readAudits();
  const audit = audits.find((a) => a.id === params.id);
  if (!audit) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(audit);
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const audits = readAudits();
  const filtered = audits.filter((a) => a.id !== params.id);
  fs.writeFileSync(auditsPath, JSON.stringify(filtered, null, 2));
  return NextResponse.json({ success: true });
}
