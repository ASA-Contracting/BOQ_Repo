export const CORRELATION_ID_HEADER = "x-correlation-id";

export function readCorrelationIdHeader(
  headers: Headers,
): string | undefined {
  return headers.get(CORRELATION_ID_HEADER) ?? undefined;
}
