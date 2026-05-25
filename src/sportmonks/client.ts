// Sportmonks API v3 Football client.
//
// Auth modes (SPORTMONKS_AUTH_MODE env var):
//   query  (default) — sends api_token as a query parameter, never in logs
//   header           — sends Authorization: Bearer header instead
//
// Token is NEVER logged, printed, or included in error messages.
// Debug mode (SPORTMONKS_DEBUG=true) logs paths and status codes;
//   redacts token in any logged URL to last-4 chars only.

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

export type SportmonksAuthMode = 'query' | 'header';

export type SportmonksClientConfig = {
  readonly baseUrl: string;
  readonly token: string;
  readonly authMode?: SportmonksAuthMode;
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

// Redact api_token value for safe logging
function redactToken(url: string): string {
  return url.replace(/([?&]api_token=)[^&]+/, '$1[REDACTED]');
}

export class SportmonksClient {
  private readonly http: AxiosInstance;
  private readonly token: string;
  private readonly authMode: SportmonksAuthMode;
  private readonly debug: boolean;

  constructor(config: SportmonksClientConfig) {
    this.token = config.token;
    this.authMode = config.authMode ?? 'query';
    this.debug = config.debug ?? process.env['SPORTMONKS_DEBUG'] === 'true';

    const headers: Record<string, string> = {};
    if (this.authMode === 'header') {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    this.http = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: 15_000,
    });
  }

  static fromEnv(): SportmonksClient {
    const token = process.env['SPORTMONKS_API_TOKEN'];
    if (!token) throw new Error('SPORTMONKS_API_TOKEN environment variable is not set');
    const baseUrl =
      process.env['SPORTMONKS_BASE_URL'] ?? 'https://api.sportmonks.com/v3/football';
    const rawMode = (process.env['SPORTMONKS_AUTH_MODE'] ?? 'query').toLowerCase();
    const authMode: SportmonksAuthMode = rawMode === 'header' ? 'header' : 'query';
    return new SportmonksClient({ baseUrl, token, authMode });
  }

  private log(msg: string): void {
    if (this.debug) console.log(`[sportmonks] ${msg}`);
  }

  private addAuth(params: Record<string, unknown>): Record<string, unknown> {
    if (this.authMode === 'query') {
      return { ...params, api_token: this.token };
    }
    return params;
  }

  // Single GET with retry (no pagination).
  async get<T>(path: string, params: Record<string, unknown> = {}): Promise<SportmonksResponse<T>> {
    const fullParams = this.addAuth(params);
    let delay = 1000;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        this.log(`GET ${path}`);
        const res = await this.http.get<SportmonksResponse<T>>(path, { params: fullParams });
        this.log(`${res.status} ${path}`);
        return res.data;
      } catch (err: unknown) {
        const axErr = err as AxiosError;
        const status = axErr.response?.status;

        if (status === 401 && this.authMode === 'header') {
          throw new SportmonksError(
            'HTTP 401 Unauthorized — if using header auth, try SPORTMONKS_AUTH_MODE=query',
            401,
            path,
          );
        }

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

        // Build safe error message — strip any URL that might contain token
        const rawMsg = axErr.response?.statusText ?? axErr.message;
        const safeMsg = redactToken(rawMsg);
        throw new SportmonksError(
          `Sportmonks ${status ?? 'network error'}: ${safeMsg}`,
          status,
          path,
        );
      }
    }
    throw new SportmonksError('Max retries exceeded', undefined, path);
  }

  // Paginated GET — collects all pages, stops at maxPages to prevent runaway.
  // If the cap is reached, logs a visible truncation warning — never hides it silently.
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
      if (page === maxPages) {
        console.warn(
          `[sportmonks] WARNING: pagination truncated at ${maxPages} pages for ${path} — results may be incomplete`
        );
        break;
      }
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
      const message = err instanceof SportmonksError
        ? `${err.message} (HTTP ${err.statusCode ?? 'network'})`
        : err instanceof Error ? err.message : String(err);
      return { available: false, error: message };
    }
  }

  // ---- Typed V1 fetchers ----

  async getLeague(leagueId: number): Promise<unknown> {
    // Try fetching league with seasons include for season resolution
    try {
      const res = await this.get<unknown>(`/leagues/${leagueId}`, {
        include: 'currentSeason;seasons',
      });
      return res.data;
    } catch {
      // Include may not be available on all plans — fall back to plain league fetch
      const res = await this.get<unknown>(`/leagues/${leagueId}`);
      return res.data;
    }
  }

  // Fetches a single season by ID directly.
  async getSeason(seasonId: number): Promise<unknown> {
    const res = await this.get<unknown>(`/seasons/${seasonId}`);
    return res.data;
  }

  // Extracts seasons from a league object that includes them, or falls back to getSeason().
  async resolveSeasons(leagueId: number, fallbackSeasonId?: number): Promise<unknown[]> {
    try {
      const leagueRaw = await this.getLeague(leagueId);
      const league = leagueRaw as Record<string, unknown>;
      // If the include worked, seasons may be embedded
      const embedded = league['seasons'] as unknown[] | undefined;
      if (Array.isArray(embedded) && embedded.length > 0) return embedded;
      const current = league['currentSeason'];
      if (current != null) return [current];
    } catch {
      // fall through
    }

    if (fallbackSeasonId) {
      try {
        const s = await this.getSeason(fallbackSeasonId);
        return s != null ? [s] : [];
      } catch {
        // fall through
      }
    }

    return [];
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
