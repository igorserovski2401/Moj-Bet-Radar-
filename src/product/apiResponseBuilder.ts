export type ApiError = {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
};

export type ApiMeta = {
  readonly generatedAt: string;
  readonly version: string;
  readonly source: 'moj-bet-radar-enrichment';
};

export type ApiResponse<T> = {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: ApiError | null;
  readonly meta: ApiMeta;
};

function makeMeta(): ApiMeta {
  return {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    source: 'moj-bet-radar-enrichment',
  };
}

export function ok<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: makeMeta(),
  };
}

export function fail(
  code: string,
  message: string,
  details?: unknown
): ApiResponse<never> {
  return {
    success: false,
    data: null,
    error: { code, message, details },
    meta: makeMeta(),
  };
}
