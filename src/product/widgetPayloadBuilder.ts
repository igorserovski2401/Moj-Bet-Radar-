import type { MatchRiskReport, ScoreConfidence } from '../enrichment/types';
import type { RiskLevel } from './matchCardBuilder';
import { buildMatchCard } from './matchCardBuilder';
import { COMPLIANCE_TEXT } from './complianceText';
import type { SupportedLanguage } from './complianceText';

export type WidgetScores = {
  readonly motivationHome: number | null;
  readonly motivationAway: number | null;
  readonly trap: number | null;
  readonly confidence: ScoreConfidence;
};

export type WidgetFlags = {
  readonly noBet: boolean;
  readonly riskLevel: RiskLevel;
};

export type WidgetText = {
  readonly headline: string;
  readonly shortReason: string;
  readonly disclaimer: string;
};

export type WidgetMeta = {
  readonly generatedAt: string;
  readonly countryCode: string;
  readonly leagueName: string;
};

export type WidgetPayload = {
  readonly version: string;
  readonly fixtureId: number;
  readonly title: string;
  readonly scores: WidgetScores;
  readonly flags: WidgetFlags;
  readonly text: WidgetText;
  readonly meta: WidgetMeta;
};

function deriveHeadline(
  homeTeam: string,
  awayTeam: string,
  riskLevel: RiskLevel
): string {
  switch (riskLevel) {
    case 'avoid':
      return `${homeTeam} vs ${awayTeam} — High Risk Match`;
    case 'high':
      return `${homeTeam} vs ${awayTeam} — Elevated Trap Signal`;
    case 'medium':
      return `${homeTeam} vs ${awayTeam} — Monitor Closely`;
    case 'low':
      return `${homeTeam} vs ${awayTeam} — Low Risk Profile`;
  }
}

export function buildWidgetPayload(
  report: MatchRiskReport,
  language: SupportedLanguage = 'en'
): WidgetPayload {
  const card = buildMatchCard(report);
  const compliance = COMPLIANCE_TEXT[language];

  return {
    version: '1.0',
    fixtureId: report.fixtureId,
    title: card.matchTitle,
    scores: {
      motivationHome: card.homeMotivationScore,
      motivationAway: card.awayMotivationScore,
      trap: card.trapScore,
      confidence: card.confidence,
    },
    flags: {
      noBet: card.noBetFlag,
      riskLevel: card.riskLevel,
    },
    text: {
      headline: deriveHeadline(report.homeTeamName, report.awayTeamName, card.riskLevel),
      shortReason: card.shortReason,
      disclaimer: compliance.short,
    },
    meta: {
      generatedAt: report.generatedAt,
      countryCode: report.countryCode,
      leagueName: report.leagueName,
    },
  };
}
