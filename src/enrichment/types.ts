// Core shared types for the enrichment pipeline.
// All scorers, the registry, the audit system, and the product layer share these.

export type MatchResult = 'W' | 'D' | 'L';
export type ScoreConfidence = 'low' | 'medium' | 'high';
export type CoverageStatus = 'unknown' | 'available' | 'missing' | 'partial' | 'error';
export type FormRecord = readonly MatchResult[];

// ---- Motivation scorer output (separate home/away) ----

export type MotivationScoreOutput = {
  readonly homeMotivationScore: number;
  readonly awayMotivationScore: number;
  readonly overallMotivationScore: number;
  readonly motivationGap: number;
  readonly keyReasons: readonly string[];
  readonly confidence: ScoreConfidence;
};

// ---- Standard scorer output ----

export type ScoreResult = {
  readonly score: number;
  readonly confidence: ScoreConfidence;
  readonly metadata: Record<string, unknown>;
  readonly warnings: readonly string[];
};

// ---- NoBetFlag output ----

export type NoBetFlagResult = {
  readonly flagged: boolean;
  readonly reasons: readonly string[];
  readonly confidence: ScoreConfidence;
  readonly metadata: Record<string, unknown>;
};

// ---- Match enrichment context (input to the registry) ----

export type StandingsContext = {
  readonly homeTeamPosition: number;
  readonly awayTeamPosition: number;
  readonly totalTeamsInLeague: number;
  readonly leaderPoints: number;
  readonly relegationCutoffPoints: number;
  readonly homePoints: number;
  readonly awayPoints: number;
};

export type SeasonContext = {
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly seasonId: number;
  readonly leagueId: number;
  readonly countryCode: string;
  readonly leagueName: string;
};

export type FormContext = {
  readonly homeRecentForm: FormRecord;
  readonly awayRecentForm: FormRecord;
  readonly homeGoalsScoredLast5: number | null;
  readonly homeGoalsConcededLast5: number | null;
  readonly awayGoalsScoredLast5: number | null;
  readonly awayGoalsConcededLast5: number | null;
};

export type OddsContext = {
  readonly homeOdds: number;
  readonly awayOdds: number;
  readonly drawOdds: number;
  readonly oddsMovement?: number;
  readonly publicNarrativeWeight?: number;
};

export type FixtureContext = {
  readonly fixtureId: number;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly kickoffAt: string;
};

export type MatchEnrichmentContext = {
  readonly fixture: FixtureContext;
  readonly season: SeasonContext;
  readonly standings?: StandingsContext;
  readonly form?: FormContext;
  readonly odds?: OddsContext;
};

// ---- Final report (output of the registry) ----

export type MatchRiskReport = {
  readonly fixtureId: number;
  readonly homeTeamName: string;
  readonly awayTeamName: string;
  readonly kickoffAt: string;
  readonly countryCode: string;
  readonly leagueName: string;
  readonly generatedAt: string;
  readonly motivation: MotivationScoreOutput | null;
  readonly trapScore: ScoreResult | null;
  readonly noBetFlag: NoBetFlagResult | null;
  readonly stubs: Partial<Record<string, ScoreResult>>;
  readonly missingRequiredFeatures: readonly string[];
  readonly dataQualityWarnings: readonly string[];
};

// ---- Audit types ----

export type FeatureCoverageRecord = {
  readonly countryCode: string;
  readonly leagueId: number;
  readonly seasonId?: number;
  readonly featureKey: string;
  readonly coverageStatus: CoverageStatus;
  readonly sampleFixtureId?: number;
  readonly sampleResponseSummary?: Record<string, unknown>;
  readonly checkedAt: string;
  readonly notes?: string;
};

export type MatchFeatureSnapshot = {
  readonly fixtureId: number;
  readonly featureKey: string;
  readonly rawPayload: unknown;
  readonly normalizedPayload?: Record<string, unknown>;
  readonly provider: string;
  readonly fetchedAt: string;
  readonly status: 'success' | 'error' | 'partial' | 'skipped';
  readonly errorMessage?: string;
};
