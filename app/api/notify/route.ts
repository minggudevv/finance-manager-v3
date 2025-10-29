import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();
    if (!phone || !message) return NextResponse.json({ error: 'phone and message required' }, { status: 400 });
    const result = await sendWhatsAppMessage(phone, message);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unexpected error' }, { status: 500 });
  }
}
