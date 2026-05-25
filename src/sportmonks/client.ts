// Sportmonks API v3 Football client.
// Auth: Authorization: Bearer {token} header only — token never in query string, never logged.
// Debug mode (SPORTMONKS_DEBUG=true): logs paths and status codes, redacts token to last 4 chars.

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

export type SportmonksClientConfig = {
  readonly baseUrl: string;
  readonly token: string;
  readonly debug?: boolean;
};

export type SportmonksResponse<T> = {
  readonly data: T;
  readonly pagination?: {
    readonly count: number;
    readonly per_page: number;
    readonly current_page: number;
    readonly next_page: string | null;
    readonly has_more: boolean;
  };
};

export type ProbeResult = {
  readonly available: boolean;
  readonly summary?: unknown;
  readonly error?: string;
};

export class SportmonksError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | undefined,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'SportmonksError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(status: number | undefined): boolean {
  return status === 429 || (status !== undefined && status >= 500);
}

export class SportmonksClient {
  private readonly http: AxiosInstance;
  private readonly debug: boolean;

  constructor(config: SportmonksClientConfig) {
    this.debug = config.debug ?? process.env['SPORTMONKS_DEBUG'] === 'true';
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: { Authorization: `Bearer ${config.token}` },
      timeout: 15_000,
    });
  }

  static fromEnv(): SportmonksClient {
    const token = process.env['SPORTMONKS_API_TOKEN'];
    const baseUrl =
      process.env['SPORTMONKS_BASE_URL'] ?? 'https://api.sportmonks.com/v3/football';
    if (!token) throw new Error('SPORTMONKS_API_TOKEN environment variable is not set');
    return new SportmonksClient({ baseUrl, token });
  }

  private log(msg: string): void {
    if (this.debug) console.log(`[sportmonks] ${msg}`);
  }

  // Single GET with retry (no pagination).
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<SportmonksResponse<T>> {
    let delay = 1000;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        this.log(`GET ${path}`);
        const res = await this.http.get<SportmonksResponse<T>>(path, { params });
        this.log(`${res.status} ${path}`);
        return res.data;
      } catch (err: unknown) {
        const axErr = err as AxiosError;
        const status = axErr.response?.status;
        if (attempt < 3 && isRetryable(status)) {
          const retryAfter =
            status === 429
              ? parseInt(String(axErr.response?.headers?.['retry-after'] ?? '60'), 10) * 1000
              : delay;
          this.log(`retryable ${status ?? 'network'} — waiting ${retryAfter}ms`);
          await sleep(retryAfter);
          delay *= 2;
          continue;
        }
        const message = axErr.response?.statusText ?? axErr.message;
        throw new SportmonksError(
          `Sportmonks ${status ?? 'network error'}: ${message}`,
          status,
          path,
        );
      }
    }
    throw new SportmonksError('Max retries exceeded', undefined, path);
  }

  // Paginated GET — collects all pages, stops at maxPages to prevent runaway.
  async getAll<T>(
    path: string,
    params: Record<string, unknown> = {},
    maxPages = 10,
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await this.get<T[]>(path, { ...params, page, per_page: 50 });
      const items = Array.isArray(res.data) ? res.data : [];
      results.push(...items);
      if (!res.pagination?.has_more) break;
      page++;
    }
    return results;
  }

  // Probe a path for coverage audits — never throws.
  async probe(path: string): Promise<ProbeResult> {
    try {
      const res = await this.get<unknown[]>(path, { per_page: 1 });
      const data = Array.isArray(res.data) ? res.data : res.data != null ? [res.data] : [];
      return { available: data.length > 0, summary: data[0] ?? null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { available: false, error: message };
    }
  }

  // ---- Typed V1 fetchers ----

  async getLeague(leagueId: number): Promise<unknown> {
    const res = await this.get<unknown>(`/leagues/${leagueId}`);
    return res.data;
  }

  async getSeasons(leagueId: number): Promise<unknown[]> {
    return this.getAll<unknown>(`/seasons/leagues/${leagueId}`);
  }

  async getTeams(seasonId: number): Promise<unknown[]> {
    return this.getAll<unknown>(`/teams/seasons/${seasonId}`);
  }

  async getFixtures(seasonId: number, include?: string): Promise<unknown[]> {
    const params: Record<string, unknown> = {};
    if (include) params['include'] = include;
    return this.getAll<unknown>(`/fixtures/seasons/${seasonId}`, params);
  }

  async getStandings(seasonId: number): Promise<unknown> {
    const res = await this.get<unknown>(`/standings/seasons/${seasonId}`, {
      include: 'participant',
    });
    return res.data;
  }

  async getOdds(fixtureId: number): Promise<unknown> {
    const res = await this.get<unknown>(`/odds/pre-match/fixtures/${fixtureId}`);
    return res.data;
  }
}
