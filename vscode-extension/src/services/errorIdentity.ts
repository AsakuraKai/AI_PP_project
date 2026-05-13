import * as crypto from 'crypto';
import { ErrorItem } from '../types';

export interface DiagnosticIdentityInput {
  filePath: string;
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
  message: string;
  source?: string;
  code?: unknown;
}

export function normalizeDiagnosticCode(code: unknown): string {
  if (typeof code === 'string') {
    return code;
  }

  if (typeof code === 'number') {
    return code.toString();
  }

  if (code && typeof code === 'object' && 'value' in (code as Record<string, unknown>)) {
    const value = (code as { value?: unknown }).value;
    return value == null ? '' : value.toString();
  }

  return '';
}

export function buildDiagnosticIdentity(input: DiagnosticIdentityInput): string {
  const identity = [
    input.filePath,
    input.startLine,
    input.startCharacter,
    input.endLine,
    input.endCharacter,
    input.message,
    input.source ?? '',
    normalizeDiagnosticCode(input.code)
  ].join('|');

  return crypto.createHash('sha256').update(identity).digest('hex').slice(0, 32);
}

export function buildErrorItemIdentity(error: ErrorItem): string {
  const metadata = error.metadata ?? {};

  const endLineRaw = metadata.endLine;
  const endCharacterRaw = metadata.endCharacter;

  const endLine = typeof endLineRaw === 'number' ? endLineRaw : error.line;
  const endCharacter = typeof endCharacterRaw === 'number' ? endCharacterRaw : (error.column ?? 0);

  return buildDiagnosticIdentity({
    filePath: error.filePath,
    startLine: error.line,
    startCharacter: error.column ?? 0,
    endLine,
    endCharacter,
    message: error.message,
    source: metadata.source?.toString() ?? '',
    code: metadata.code
  });
}
