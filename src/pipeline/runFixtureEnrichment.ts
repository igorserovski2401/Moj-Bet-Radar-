import type { SupabaseClient } from '@supabase/supabase-js';
import type { MatchRiskReport } from '../enrichment/types';
import { runEnrichment } from '../enrichment/scoreRegistry';
import { buildMatchEnrichmentContext } from './buildMatchContext';
import { getSupabaseClient } from '../lib/supabaseClient';

export async function runFixtureEnrichment(
  fixtureId: number,
  dbOverride?: SupabaseClient,
): Promise<MatchRiskReport> {
  const db = dbOverride ?? getSupabaseClient();
  const startMs = Date.now();

  // Create enrichment_run row
  const { data: runRow, error: runErr } = await db
    .from('enrichment_runs')
    .insert({
      fixture_id: fixtureId,
      triggered_at: new Date().toISOString(),
      status: 'running',
      features_used: null,
      error_message: null,
      duration_ms: null,
    })
    .select('id')
    .single();
  if (runErr) throw new Error(`enrichment_run insert failed: ${runErr.message}`);
  const runId: string = runRow.id;

  try {
    const { ctx, missingRequired, warnings } = await buildMatchEnrichmentContext(fixtureId, db);

    const report = runEnrichment(ctx);

    const durationMs = Date.now() - startMs;
    const featuresUsed = [
      ctx.standings ? 'standings' : null,
      ctx.form ? 'team_recent_form' : null,
      ctx.odds ? 'odds' : null,
    ].filter(Boolean);

    // Upsert match_intelligence (conflict on fixture_id — one row per fixture)
    const { error: miErr } = await db.from('match_intelligence').upsert(
      {
        fixture_id: fixtureId,
        motivation_home: report.motivation?.homeMotivationScore ?? null,
        motivation_away: report.motivation?.awayMotivationScore ?? null,
        motivation_gap: report.motivation?.motivationGap ?? null,
        motivation_confidence: report.motivation?.confidence ?? null,
        trap_score: report.trapScore?.score ?? null,
        trap_confidence: report.trapScore?.confidence ?? null,
        no_bet_flag: report.noBetFlag?.flagged ?? false,
        no_bet_reasons: report.noBetFlag?.reasons ?? null,
        referee_risk_score: (report.stubs['refereeRiskScore']?.score ?? null) as number | null,
        rotation_risk_score: (report.stubs['rotationRiskScore']?.score ?? null) as number | null,
        injury_suspension_risk_score: (report.stubs['injurySuspensionRiskScore']?.score ?? null) as number | null,
        xg_reality_check_score: (report.stubs['xgRealityCheckScore']?.score ?? null) as number | null,
        fatigue_congestion_score: (report.stubs['fatigueCongestionScore']?.score ?? null) as number | null,
        market_movement_score: (report.stubs['marketMovementScore']?.score ?? null) as number | null,
        overall_confidence: report.noBetFlag?.confidence ?? null,
        generated_at: report.generatedAt,
        enrichment_run_id: runId,
      },
      { onConflict: 'fixture_id' },
    );
    if (miErr) throw new Error(`match_intelligence upsert failed: ${miErr.message}`);

    // Mark run completed
    await db.from('enrichment_runs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      features_used: featuresUsed,
    }).eq('id', runId);

    // Surface context quality issues in the report's warnings
    const augmentedReport: MatchRiskReport = {
      ...report,
      missingRequiredFeatures: [
        ...report.missingRequiredFeatures,
        ...missingRequired,
      ],
      dataQualityWarnings: [
        ...report.dataQualityWarnings,
        ...warnings,
      ],
    };

    return augmentedReport;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.from('enrichment_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startMs,
      error_message: msg,
    }).eq('id', runId);
    throw err;
  }
}
