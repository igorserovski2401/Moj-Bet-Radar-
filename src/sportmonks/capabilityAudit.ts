import type { CoverageStatus, FeatureCoverageRecord } from '../enrichment/types';
import { SPORTMONKS_FEATURES } from '../config/sportmonksFeatures';
import type { SportmonksFeatureKey, FeatureTier } from '../config/features';
import { FEATURE_TIERS } from '../config/features';

export type AuditOptions = {
  readonly countryCode: string;
  readonly leagueId: number;
  readonly seasonId?: number;
  readonly mockMode: boolean;
  readonly saveToDb?: boolean;
};

export type FeatureCoverageResult = {
  readonly featureKey: string;
  readonly coverageStatus: CoverageStatus;
  readonly tier: FeatureTier;
  readonly sampleFixtureId?: number;
  readonly notes?: string;
};

export type AuditSummary = {
  readonly totalFeatures: number;
  readonly available: number;
  readonly partial: number;
  readonly missing: number;
  readonly unknown: number;
  readonly v1RequiredTotal: number;
  readonly v1RequiredAvailable: number;
  readonly v1RequiredPartial: number;
  readonly v1OptionalTotal: number;
  readonly v1OptionalAvailable: number;
};

export type AuditResult = {
  readonly options: AuditOptions;
  readonly records: readonly FeatureCoverageResult[];
  readonly summary: AuditSummary;
};

// ---- Mock data: Serbia SuperLiga 2024/25 (league_id=271) ----
const MOCK_COVERAGE: Partial<Record<SportmonksFeatureKey, CoverageStatus>> = {
  fixtures:               'available',
  teams:                  'available',
  standings:              'available',
  team_recent_form:       'available',
  team_season_statistics: 'available',
  schedules:              'available',
  odds:                   'partial',
  head_to_head:           'available',
  events_timeline:        'available',
  xg_match:               'partial',
  referee_statistics:     'unknown',
  lineups:                'missing',
  injuries_suspensions:   'missing',
  pressure_index:         'missing',
  predictions:            'missing',
  live_standings:         'unknown',
  commentaries:           'unknown',
  news:                   'unknown',
  xg_player:              'missing',
};

function buildSummary(
  records: FeatureCoverageResult[]
): AuditSummary {
  const v1Required = records.filter((r) => r.tier === 'requiredForV1');
  const v1Optional = records.filter((r) => r.tier === 'optionalForV1');
  return {
    totalFeatures: records.length,
    available:     records.filter((r) => r.coverageStatus === 'available').length,
    partial:       records.filter((r) => r.coverageStatus === 'partial').length,
    missing:       records.filter((r) => r.coverageStatus === 'missing').length,
    unknown:       records.filter((r) => r.coverageStatus === 'unknown').length,
    v1RequiredTotal:     v1Required.length,
    v1RequiredAvailable: v1Required.filter((r) => r.coverageStatus === 'available').length,
    v1RequiredPartial:   v1Required.filter((r) => r.coverageStatus === 'partial').length,
    v1OptionalTotal:     v1Optional.length,
    v1OptionalAvailable: v1Optional.filter(
      (r) => r.coverageStatus === 'available' || r.coverageStatus === 'partial'
    ).length,
  };
}

export async function auditLeagueCoverage(
  options: AuditOptions
): Promise<AuditResult> {
  const { countryCode, leagueId, seasonId, mockMode } = options;
  const checkedAt = new Date().toISOString();

  if (!mockMode) {
    // Real mode: TODO implement per-feature API probes using SportmonksClient
    // For now throw to make the limitation explicit
    throw new Error(
      'Real audit mode not yet implemented — use --mock for now. ' +
      'Each feature needs a dedicated probe in SportmonksClient.'
    );
  }

  const records: FeatureCoverageResult[] = SPORTMONKS_FEATURES.map((feature) => {
    const coverageStatus: CoverageStatus = MOCK_COVERAGE[feature.featureKey] ?? 'unknown';
    return {
      featureKey: feature.featureKey,
      coverageStatus,
      tier: FEATURE_TIERS[feature.featureKey],
      notes: `Mock data — Serbia SuperLiga 2024/25 reference (checked: ${checkedAt})`,
    };
  });

  // If saveToDb is requested, would upsert to sportmonks_feature_coverage here
  // TODO: wire Supabase client and implement upsert
  if (options.saveToDb) {
    console.warn('[capabilityAudit] saveToDb=true but Supabase client not yet wired — skipping');
  }

  // Build typed FeatureCoverageRecord array (for Supabase shape compatibility)
  const _dbRecords: FeatureCoverageRecord[] = records.map((r) => ({
    countryCode,
    leagueId,
    seasonId,
    featureKey: r.featureKey,
    coverageStatus: r.coverageStatus,
    checkedAt,
    notes: r.notes,
  }));

  return {
    options,
    records,
    summary: buildSummary(records),
  };
}

const ICONS: Record<CoverageStatus, string> = {
  available: '✓',
  partial:   '~',
  missing:   '✗',
  unknown:   '?',
  error:     '!',
};

export function printCoverageReport(result: AuditResult): void {
  const { options, records, summary } = result;
  const mode = options.mockMode ? ' [MOCK MODE]' : '';
  const season = options.seasonId ? ` — season ${options.seasonId}` : '';

  console.log(`\n${options.countryCode} League (id=${options.leagueId})${season} Coverage Audit${mode}:`);
  console.log('─'.repeat(60));

  const tiers: FeatureTier[] = ['requiredForV1', 'optionalForV1', 'plannedForV15', 'plannedForV2'];
  const tierLabels: Record<FeatureTier, string> = {
    requiredForV1:  '[V1 Required]',
    optionalForV1:  '[V1 Optional]',
    plannedForV15:  '[V1.5 Planned]',
    plannedForV2:   '[V2 Planned]',
  };

  for (const tier of tiers) {
    const tierRecords = records.filter((r) => r.tier === tier);
    if (tierRecords.length === 0) continue;
    console.log(`\n  ${tierLabels[tier]}`);
    for (const r of tierRecords) {
      const icon = ICONS[r.coverageStatus];
      console.log(`  ${icon} ${r.featureKey}: ${r.coverageStatus}`);
    }
  }

  console.log('');
  console.log(`V1 Required: ${summary.v1RequiredAvailable}/${summary.v1RequiredTotal} available` +
    (summary.v1RequiredPartial > 0 ? `, ${summary.v1RequiredPartial} partial` : ''));
  console.log(`V1 Optional: ${summary.v1OptionalAvailable}/${summary.v1OptionalTotal} available/partial`);
  console.log(
    `Overall: ${summary.available}/${summary.totalFeatures} confirmed available, ` +
    `${summary.partial} partial, ${summary.missing} missing, ${summary.unknown} unknown`
  );
  console.log('');
}
