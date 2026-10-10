import { NextRequest, NextResponse } from 'next/server';
import { deleteEvidence, updateEvidence } from '@/lib/server/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();
    const updated = updateEvidence(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, evidence: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = deleteEvidence(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Evidence not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Evidence ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
