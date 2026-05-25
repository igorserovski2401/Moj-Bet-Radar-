import type { MatchRiskReport, ScoreConfidence } from '../enrichment/types';

export type RiskLevel = 'low' | 'medium' | 'high' | 'avoid';

export type MatchCardPayload = {
  readonly fixtureId: number;
  readonly matchTitle: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly kickoffTime: string;
  readonly countryCode: string;
  readonly leagueName: string;
  readonly homeMotivationScore: number | null;
  readonly awayMotivationScore: number | null;
  readonly motivationGap: number | null;
  readonly trapScore: number | null;
  readonly noBetFlag: boolean;
  readonly riskLevel: RiskLevel;
  readonly recommendedAction: string;
  readonly shortReason: string;
  readonly confidence: ScoreConfidence;
  readonly generatedAt: string;
};

function deriveRiskLevel(
  noBetFlagged: boolean,
  trapScore: number | null
): RiskLevel {
  if (noBetFlagged && (trapScore ?? 0) > 65) return 'avoid';
  if ((trapScore ?? 0) >= 70) return 'high';
  if ((trapScore ?? 0) >= 40) return 'medium';
  return 'low';
}

function deriveAction(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'avoid':  return 'Avoid';
    case 'high':   return 'Use caution';
    case 'medium': return 'Monitor';
    case 'low':    return 'Monitor';
  }
}

function deriveShortReason(report: MatchRiskReport, riskLevel: RiskLevel): string {
  if (report.noBetFlag?.flagged && report.noBetFlag.reasons.length > 0) {
    // Take the first reason, trim internal prefixes
    const raw = report.noBetFlag.reasons[0] ?? '';
    return raw.split(':').slice(1).join(':').trim() || raw;
  }
  if (riskLevel === 'high' || riskLevel === 'avoid') {
    return 'High trap signal — odds may not reflect current form';
  }
  if (!report.trapScore) {
    return 'Odds unavailable — trap analysis skipped';
  }
  return 'Low trap signal — odds consistent with recent form';
}

function deriveConfidence(report: MatchRiskReport): ScoreConfidence {
  const levels: ScoreConfidence[] = [];
  if (report.motivation) levels.push(report.motivation.confidence);
  if (report.trapScore) levels.push(report.trapScore.confidence);
  if (report.noBetFlag) levels.push(report.noBetFlag.confidence);
  if (levels.includes('low')) return 'low';
  if (levels.includes('medium')) return 'medium';
  return levels.length > 0 ? 'high' : 'low';
}

export function buildMatchCard(report: MatchRiskReport): MatchCardPayload {
  const noBetFlagged = report.noBetFlag?.flagged ?? false;
  const trapScore = report.trapScore?.score ?? null;
  const riskLevel = deriveRiskLevel(noBetFlagged, trapScore);

  return {
    fixtureId: report.fixtureId,
    matchTitle: `${report.homeTeamName} vs ${report.awayTeamName}`,
    homeTeam: report.homeTeamName,
    awayTeam: report.awayTeamName,
    kickoffTime: report.kickoffAt,
    countryCode: report.countryCode,
    leagueName: report.leagueName,
    homeMotivationScore: report.motivation?.homeMotivationScore ?? null,
    awayMotivationScore: report.motivation?.awayMotivationScore ?? null,
    motivationGap: report.motivation?.motivationGap ?? null,
    trapScore,
    noBetFlag: noBetFlagged,
    riskLevel,
    recommendedAction: deriveAction(riskLevel),
    shortReason: deriveShortReason(report, riskLevel),
    confidence: deriveConfidence(report),
    generatedAt: report.generatedAt,
  };
}
