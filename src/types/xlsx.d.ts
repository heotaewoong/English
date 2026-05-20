/**
 * Minimal type declaration for the 'xlsx' package.
 * Allows TypeScript to compile even when xlsx is not installed.
 * If xlsx is installed at runtime, the full implementation is used.
 */
declare module 'xlsx' {
  interface Sheet {}

  interface Workbook {
    SheetNames: string[];
    Sheets: Record<string, Sheet>;
  }

  export function read(
    data: Uint8Array | ArrayBuffer | Buffer | string,
    opts?: { type?: 'array' | 'buffer' | 'binary' | 'string' | 'base64' }
  ): Workbook;

  export const utils: {
    sheet_to_json<T = unknown>(
      worksheet: Sheet,
      opts?: { header?: number | string[] | 'A'; defval?: unknown; raw?: boolean }
    ): T[];
  };
}
