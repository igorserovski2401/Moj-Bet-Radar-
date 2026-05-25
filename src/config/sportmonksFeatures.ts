import type { CoverageStatus } from '../enrichment/types';
import type { SportmonksFeatureKey, FeatureTier } from './features';
import { FEATURE_TIERS } from './features';

export type SportmonksFeatureDefinition = {
  readonly featureKey: SportmonksFeatureKey;
  readonly sportmonksEndpointGroup: string;
  readonly tier: FeatureTier;
  readonly enrichmentUsage: string;
  readonly expectedScoreOutput: string;
  readonly defaultCoverageStatus: CoverageStatus;
  readonly notes: string;
};

export const SPORTMONKS_FEATURES: readonly SportmonksFeatureDefinition[] = [
  {
    featureKey: 'fixtures',
    sportmonksEndpointGroup: 'football/fixtures',
    tier: FEATURE_TIERS.fixtures,
    enrichmentUsage: 'Base fixture metadata: teams, round, season, state',
    expectedScoreOutput: 'motivationScore, trapScore, noBetFlag',
    defaultCoverageStatus: 'unknown',
    notes: 'Core dependency. All other features are keyed off fixture_id.',
  },
  {
    featureKey: 'teams',
    sportmonksEndpointGroup: 'football/teams',
    tier: FEATURE_TIERS.teams,
    enrichmentUsage: 'Team identity, country, and basic metadata',
    expectedScoreOutput: 'motivationScore, matchCard',
    defaultCoverageStatus: 'unknown',
    notes: 'Required for team name resolution in all output formats.',
  },
  {
    featureKey: 'standings',
    sportmonksEndpointGroup: 'football/standings/seasons',
    tier: FEATURE_TIERS.standings,
    enrichmentUsage: 'Position, points, total teams — feeds motivationScore',
    expectedScoreOutput: 'motivationScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Required for relegation pressure and title race detection.',
  },
  {
    featureKey: 'live_standings',
    sportmonksEndpointGroup: 'football/standings/live',
    tier: FEATURE_TIERS.live_standings,
    enrichmentUsage: 'Intra-round standing changes — future live enrichment',
    expectedScoreOutput: 'motivationScore (live variant)',
    defaultCoverageStatus: 'unknown',
    notes: 'Not needed for pre-match pipeline. V2 consideration.',
  },
  {
    featureKey: 'odds',
    sportmonksEndpointGroup: 'football/odds/pre-match',
    tier: FEATURE_TIERS.odds,
    enrichmentUsage: 'Decimal odds for home/draw/away — feeds trapScore',
    expectedScoreOutput: 'trapScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Pre-match 1X2 market. Check bookmaker availability per league.',
  },
  {
    featureKey: 'predictions',
    sportmonksEndpointGroup: 'football/predictions/probabilities',
    tier: FEATURE_TIERS.predictions,
    enrichmentUsage: 'Sportmonks own probability model for cross-validation',
    expectedScoreOutput: 'trapScore cross-check',
    defaultCoverageStatus: 'unknown',
    notes: 'Not all leagues covered. Treat as supplementary signal only.',
  },
  {
    featureKey: 'xg_match',
    sportmonksEndpointGroup: 'football/statistics/seasons/xg',
    tier: FEATURE_TIERS.xg_match,
    enrichmentUsage: 'Team xG for/against last N matches',
    expectedScoreOutput: 'xgRealityCheckScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Coverage highly variable in Balkan leagues. Audit before enabling.',
  },
  {
    featureKey: 'xg_player',
    sportmonksEndpointGroup: 'football/statistics/players/xg',
    tier: FEATURE_TIERS.xg_player,
    enrichmentUsage: 'Player-level xG contribution for rotation risk',
    expectedScoreOutput: 'xgRealityCheckScore, rotationRiskScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Rarely available below top 5 leagues. Audit aggressively.',
  },
  {
    featureKey: 'team_recent_form',
    sportmonksEndpointGroup: 'football/standings/seasons (form field)',
    tier: FEATURE_TIERS.team_recent_form,
    enrichmentUsage: 'Last 5 match W/D/L per team — feeds motivation + trapScore',
    expectedScoreOutput: 'motivationScore, trapScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Often embedded in standings response. Verify form field depth.',
  },
  {
    featureKey: 'team_season_statistics',
    sportmonksEndpointGroup: 'football/statistics/seasons/teams',
    tier: FEATURE_TIERS.team_season_statistics,
    enrichmentUsage: 'Goals scored/conceded season totals — feeds trapScore',
    expectedScoreOutput: 'trapScore, fatigueCongestionScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Check if endpoint returns both home and away splits.',
  },
  {
    featureKey: 'head_to_head',
    sportmonksEndpointGroup: 'football/fixtures/head-to-head',
    tier: FEATURE_TIERS.head_to_head,
    enrichmentUsage: 'Historical H2H results for pattern detection',
    expectedScoreOutput: 'motivationScore (contextual bonus)',
    defaultCoverageStatus: 'unknown',
    notes: 'Useful for derby/rivalry detection. Lower confidence data.',
  },
  {
    featureKey: 'referee_statistics',
    sportmonksEndpointGroup: 'football/referees',
    tier: FEATURE_TIERS.referee_statistics,
    enrichmentUsage: 'Referee card and foul rates per league',
    expectedScoreOutput: 'refereeRiskScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Highly variable coverage. Many Balkan leagues lack referee stats.',
  },
  {
    featureKey: 'lineups',
    sportmonksEndpointGroup: 'football/lineups',
    tier: FEATURE_TIERS.lineups,
    enrichmentUsage: 'Starting XI and formation for rotation detection',
    expectedScoreOutput: 'rotationRiskScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Only available post-lineup announcement (~1h before kickoff).',
  },
  {
    featureKey: 'injuries_suspensions',
    sportmonksEndpointGroup: 'football/squads/seasons/teams (sidelined)',
    tier: FEATURE_TIERS.injuries_suspensions,
    enrichmentUsage: 'Absent key players by name and role',
    expectedScoreOutput: 'injurySuspensionRiskScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Data quality and timeliness are the main risks.',
  },
  {
    featureKey: 'pressure_index',
    sportmonksEndpointGroup: 'football/statistics/pressure',
    tier: FEATURE_TIERS.pressure_index,
    enrichmentUsage: 'Sportmonks pressure metric cross-validation',
    expectedScoreOutput: 'motivationScore (supplementary)',
    defaultCoverageStatus: 'unknown',
    notes: 'Proprietary Sportmonks metric. Availability very limited.',
  },
  {
    featureKey: 'events_timeline',
    sportmonksEndpointGroup: 'football/events',
    tier: FEATURE_TIERS.events_timeline,
    enrichmentUsage: 'In-match events for post-match pattern analysis',
    expectedScoreOutput: 'future post-match scoring',
    defaultCoverageStatus: 'unknown',
    notes: 'Not used in pre-match pipeline. Reserved for V2 retrospective.',
  },
  {
    featureKey: 'schedules',
    sportmonksEndpointGroup: 'football/schedules/seasons',
    tier: FEATURE_TIERS.schedules,
    enrichmentUsage: 'Upcoming fixture density for fatigue/congestion scoring',
    expectedScoreOutput: 'fatigueCongestionScore, rotationRiskScore',
    defaultCoverageStatus: 'unknown',
    notes: 'Needed to compute days-between-matches for rotation risk.',
  },
  {
    featureKey: 'commentaries',
    sportmonksEndpointGroup: 'football/commentaries',
    tier: FEATURE_TIERS.commentaries,
    enrichmentUsage: 'NLP-ready match narrative data — future sentiment feature',
    expectedScoreOutput: 'future narrative score',
    defaultCoverageStatus: 'unknown',
    notes: 'Not used in V1 pipeline. Exploratory.',
  },
  {
    featureKey: 'news',
    sportmonksEndpointGroup: 'football/news',
    tier: FEATURE_TIERS.news,
    enrichmentUsage: 'Pre-match news signal for sentiment or injury hints',
    expectedScoreOutput: 'future news sentiment score',
    defaultCoverageStatus: 'unknown',
    notes: 'Very limited Balkan coverage. Low priority.',
  },
] as const;

export function getFeatureByKey(
  key: SportmonksFeatureKey
): SportmonksFeatureDefinition | undefined {
  return SPORTMONKS_FEATURES.find((f) => f.featureKey === key);
}

export function getV1Features(): SportmonksFeatureDefinition[] {
  return SPORTMONKS_FEATURES.filter(
    (f) => f.tier === 'requiredForV1' || f.tier === 'optionalForV1'
  );
}
