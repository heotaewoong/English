import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Lightweight health check — tells the client whether GROQ_API_KEY is configured. */
export async function GET() {
  return NextResponse.json({
    groqConfigured: !!process.env.GROQ_API_KEY,
    ok: true,
  });
}
