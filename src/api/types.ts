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

export type ApiDocsEndpoint = {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  readonly description: string;
  readonly params?: Record<string, string>;
  readonly exampleResponse?: string;
};

export type ApiDocsPayload = {
  readonly title: string;
  readonly version: string;
  readonly baseUrl: string;
  readonly endpoints: readonly ApiDocsEndpoint[];
  readonly responseEnvelope: string;
  readonly complianceNote: string;
};
