export type FeatureTier = 'requiredForV1' | 'optionalForV1' | 'plannedForV15' | 'plannedForV2';

export type SportmonksFeatureKey =
  | 'fixtures'
  | 'standings'
  | 'teams'
  | 'live_standings'
  | 'odds'
  | 'predictions'
  | 'xg_match'
  | 'xg_player'
  | 'team_recent_form'
  | 'team_season_statistics'
  | 'head_to_head'
  | 'referee_statistics'
  | 'lineups'
  | 'injuries_suspensions'
  | 'pressure_index'
  | 'events_timeline'
  | 'schedules'
  | 'commentaries'
  | 'news';

export const FEATURE_TIERS: Record<SportmonksFeatureKey, FeatureTier> = {
  // V1 required — noBetFlag hard-fails if these are missing from enrichment context
  fixtures:               'requiredForV1',
  teams:                  'requiredForV1',
  standings:              'requiredForV1',
  // V1 optional — used when available, gracefully degraded when not
  odds:                   'optionalForV1',
  team_recent_form:       'optionalForV1',
  team_season_statistics: 'optionalForV1',
  schedules:              'optionalForV1',
  // V1.5 planned
  referee_statistics:     'plannedForV15',
  lineups:                'plannedForV15',
  injuries_suspensions:   'plannedForV15',
  xg_match:               'plannedForV15',
  head_to_head:           'plannedForV15',
  // V2 planned
  pressure_index:         'plannedForV2',
  events_timeline:        'plannedForV2',
  commentaries:           'plannedForV2',
  news:                   'plannedForV2',
  live_standings:         'plannedForV2',
  predictions:            'plannedForV2',
  xg_player:              'plannedForV2',
};

export function isRequiredForV1(key: SportmonksFeatureKey): boolean {
  return FEATURE_TIERS[key] === 'requiredForV1';
}

export function isAvailableInV1(key: SportmonksFeatureKey): boolean {
  const tier = FEATURE_TIERS[key];
  return tier === 'requiredForV1' || tier === 'optionalForV1';
}

export function getFeaturesByTier(tier: FeatureTier): SportmonksFeatureKey[] {
  return (Object.keys(FEATURE_TIERS) as SportmonksFeatureKey[]).filter(
    (k) => FEATURE_TIERS[k] === tier
  );
}
