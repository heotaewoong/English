import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

/* ─────────────────────── Sentence splitter ─────────────────────── */

function splitSentences(text: string): string[] {
  // Use a manual split instead of lookbehind to avoid es2018 target requirement
  const parts: string[] = [];
  const raw = text
    .replace(/\r\n/g, '\n')
    .replace(/^#+\s+/gm, '')
    .replace(/^[-*]\s+/gm, '');

  // Split on sentence-ending punctuation followed by whitespace + capital
  let buf = '';
  for (let i = 0; i < raw.length; i++) {
    buf += raw[i];
    if (/[.!?]/.test(raw[i]) && i + 2 < raw.length && /\s/.test(raw[i + 1]) && /[A-Z"'(["]/.test(raw[i + 2])) {
      parts.push(buf.trim());
      buf = '';
      i++; // skip the whitespace
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  return parts
    .flatMap((chunk) => chunk.split(/\n{2,}/))
    .map((s) => s.replace(/\n/g, ' ').trim())
    .filter((s) => s.length > 8 && /[a-zA-Z]/.test(s));
}

/* ─────────────────────── PDF parser ─────────────────────── */

async function parsePDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import('pdf-parse') as any).default;
  const result = await pdfParse(buffer);
  return result.text ?? '';
}

/* ─────────────────────── POST handler ─────────────────────── */

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '파일을 읽을 수 없어요.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'file field required' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const name = file.name.toLowerCase();

  let rawText = '';
  try {
    if (name.endsWith('.pdf')) {
      rawText = await parsePDF(buffer);
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? '';
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      rawText = wb.SheetNames.map((sheetName) => {
        const ws = wb.Sheets[sheetName];
        // sheet_to_json with header:1 gives rows as arrays → join as CSV
        const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
        return rows.map(row => (Array.isArray(row) ? row.join('\t') : String(row))).join('\n');
      }).join('\n');
    } else {
      rawText = buffer.toString('utf-8');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: `파일 파싱 오류: ${msg}` }, { status: 500 });
  }

  // Strip SRT/VTT timing lines
  rawText = rawText
    .replace(/^\d+\s*$/gm, '')
    .replace(/\d{2}:\d{2}:\d{2}[,.:]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,.:]\d{3}/gm, '')
    .replace(/^WEBVTT.*$/m, '');

  const sentences = splitSentences(rawText);
  return NextResponse.json({ sentences, rawText: rawText.trim() });
}
