import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { flutterwaveEventSchema, handleFlutterwaveEvent, logPaymentEvent } from '@/features/billing/webhook';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');

  try {
    // 1. Read raw text to allow reading even if invalid
    const rawText = await req.text();
    let rawBody: any = {};
    try {
      rawBody = JSON.parse(rawText);
    } catch {
      rawBody = { raw: rawText };
    }

    // 2. Verify signature
    const signature = req.headers.get('verif-hash');
    
    if (!signature || signature !== config.FLW_SECRET_HASH) {
      await logPaymentEvent({
        source: 'WEBHOOK',
        event: 'signature_verification_failed',
        status: 'unauthorized',
        verified: false,
        ipAddress: ip,
        payload: rawBody,
      });
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // 3. Validate the payload using Zod
    const parsed = flutterwaveEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      await logPaymentEvent({
        source: 'WEBHOOK',
        event: rawBody?.event || 'invalid_schema',
        status: 'schema_error',
        verified: true, // signature passed, but schema malformed
        ipAddress: ip,
        payload: { error: parsed.error.issues, body: rawBody },
      });
      return NextResponse.json({ message: 'Invalid payload schema', errors: parsed.error.issues }, { status: 400 });
    }

    // 4. Handle the event
    await handleFlutterwaveEvent(parsed.data, 'WEBHOOK');

    // Return 200 quickly
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
