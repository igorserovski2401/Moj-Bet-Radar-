// Sportmonks API client skeleton.
// Expand per-feature in V1.5+ after coverage audit confirms availability.
// IMPORTANT: never log or print the API token.

import axios from 'axios';
import type { AxiosInstance } from 'axios';

export type SportmonksClientConfig = {
  readonly baseUrl: string;
  readonly token: string; // read from SPORTMONKS_API_TOKEN env var — never logged
};

export type ProbeResult = {
  readonly available: boolean;
  readonly summary?: unknown;
  readonly error?: string;
};

export class SportmonksClient {
  private readonly http: AxiosInstance;

  constructor(config: SportmonksClientConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: { Authorization: `Bearer ${config.token}` },
      timeout: 10_000,
    });
  }

  static fromEnv(): SportmonksClient {
    const token = process.env['SPORTMONKS_API_TOKEN'];
    const baseUrl =
      process.env['SPORTMONKS_BASE_URL'] ?? 'https://api.sportmonks.com/v3/football';
    if (!token) {
      throw new Error('SPORTMONKS_API_TOKEN environment variable is not set');
    }
    return new SportmonksClient({ baseUrl, token });
  }

  // Probe a path and return availability + first-item summary (used by coverage audit)
  async probe(path: string): Promise<ProbeResult> {
    try {
      const res = await this.http.get<{ data: unknown[] }>(path, {
        params: { per_page: 1 },
      });
      const data = res.data?.data;
      const available = Array.isArray(data) && data.length > 0;
      return { available, summary: data?.[0] ?? null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { available: false, error: message };
    }
  }

  // TODO V1: implement typed fetchers per feature after coverage audit
  async getFixtures(seasonId: number): Promise<unknown> {
    const res = await this.http.get(`/fixtures/seasons/${seasonId}`);
    return res.data;
  }

  async getStandings(seasonId: number): Promise<unknown> {
    const res = await this.http.get(`/standings/seasons/${seasonId}`);
    return res.data;
  }

  async getOdds(fixtureId: number): Promise<unknown> {
    const res = await this.http.get(`/odds/pre-match/fixtures/${fixtureId}`);
    return res.data;
  }
}
