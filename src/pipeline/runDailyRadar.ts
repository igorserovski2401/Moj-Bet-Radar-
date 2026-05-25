import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchRiskReport } from '../enrichment/types';
import { runFixtureEnrichment } from './runFixtureEnrichment';
import { getSupabaseClient } from '../lib/supabaseClient';

export type DailyRadarOptions = {
  readonly seasonId: number;
  readonly daysAhead?: number;   // default 3
  readonly daysBack?: number;    // default 0
  readonly db?: SupabaseClient;
};

export async function runDailyRadar(options: DailyRadarOptions): Promise<MatchRiskReport[]> {
  const db = options.db ?? getSupabaseClient();
  const daysAhead = options.daysAhead ?? 3;
  const daysBack = options.daysBack ?? 0;

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - daysBack);
  const to = new Date(now);
  to.setDate(to.getDate() + daysAhead);

  const { data: fixtures, error } = await db
    .from('fixtures')
    .select('id, kickoff_at')
    .eq('season_id', options.seasonId)
    .in('status', ['scheduled', 'live'])
    .gte('kickoff_at', from.toISOString())
    .lte('kickoff_at', to.toISOString())
    .order('kickoff_at', { ascending: true });

  if (error) throw new Error(`runDailyRadar: fixture query failed: ${error.message}`);
  if (!fixtures || fixtures.length === 0) {
    console.log('[runDailyRadar] no upcoming fixtures in window');
    return [];
  }

  console.log(`[runDailyRadar] enriching ${fixtures.length} fixture(s)`);

  const reports: MatchRiskReport[] = [];
  for (const f of fixtures) {
    try {
      const report = await runFixtureEnrichment(f.id, db);
      reports.push(report);
    } catch (err) {
      console.warn(`[runDailyRadar] fixture ${f.id} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Sort: noBetFlag first, then trapScore desc, then kickoff asc
  reports.sort((a, b) => {
    const aFlag = a.noBetFlag?.flagged ? 1 : 0;
    const bFlag = b.noBetFlag?.flagged ? 1 : 0;
    if (bFlag !== aFlag) return bFlag - aFlag;
    const aTrap = a.trapScore?.score ?? 0;
    const bTrap = b.trapScore?.score ?? 0;
    if (bTrap !== aTrap) return bTrap - aTrap;
    return a.kickoffAt.localeCompare(b.kickoffAt);
  });

  return reports;
}
