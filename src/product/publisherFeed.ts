import type { MatchRiskReport, ScoreConfidence } from '../enrichment/types';
import { COMPLIANCE_TEXT } from './complianceText';
import type { SupportedLanguage } from './complianceText';

export type { SupportedLanguage };
export type FeedFormat = 'json' | 'markdown' | 'html';

export type PublisherFeedOptions = {
  readonly countryCode?: string;
  readonly language: SupportedLanguage;
  readonly format: FeedFormat;
  readonly includeComplianceNote: boolean;
  readonly includeNoBetWarnings: boolean;
};

export type PublisherFeedItem = {
  readonly fixtureId: number;
  readonly matchTitle: string;
  readonly countryCode: string;
  readonly leagueName: string;
  readonly kickoffTime: string;
  readonly homeTeam: string;
  readonly awayTeam: string;
  readonly homeMotivationScore: number | null;
  readonly awayMotivationScore: number | null;
  readonly trapScore: number | null;
  readonly noBetFlag: boolean;
  readonly confidence: ScoreConfidence;
  readonly recommendedAction: string;
  readonly motivationSummary: string;
  readonly trapSummary: string;
  readonly noBetSummary: string;
  readonly readyToPublishMarkdown: string;
  readonly readyToPublishHtml: string;
  readonly jsonPayload: Record<string, unknown>;
};

export type PublisherFeed = {
  readonly generatedAt: string;
  readonly language: SupportedLanguage;
  readonly countryCode: string | null;
  readonly matchCount: number;
  readonly items: readonly PublisherFeedItem[];
};

// ---- Internal helpers ----

function lowestConfidence(report: MatchRiskReport): ScoreConfidence {
  const levels: ScoreConfidence[] = [];
  if (report.motivation) levels.push(report.motivation.confidence);
  if (report.trapScore) levels.push(report.trapScore.confidence);
  if (report.noBetFlag) levels.push(report.noBetFlag.confidence);
  if (levels.includes('low')) return 'low';
  if (levels.includes('medium')) return 'medium';
  return levels.length > 0 ? 'high' : 'low';
}

function getAction(noBet: boolean, trap: number | null, lang: SupportedLanguage): string {
  const t = {
    en: { avoid: 'Avoid', caution: 'Use caution', watch: 'Monitor' },
    sr: { avoid: 'Izbegavaj', caution: 'Oprez', watch: 'Prati' },
    hr: { avoid: 'Izbjegavaj', caution: 'Oprez', watch: 'Prati' },
    bs: { avoid: 'Izbjegavaj', caution: 'Oprez', watch: 'Prati' },
    de: { avoid: 'Meiden', caution: 'Vorsicht', watch: 'Beobachten' },
  }[lang];
  if (noBet) return t.avoid;
  if ((trap ?? 0) >= 50) return t.caution;
  return t.watch;
}

function buildMotivationSummary(report: MatchRiskReport): string {
  if (!report.motivation) return 'Motivation data unavailable.';
  const { homeMotivationScore: h, awayMotivationScore: a, motivationGap: gap } = report.motivation;
  const gapLabel = gap > 30 ? 'significant' : gap > 15 ? 'moderate' : 'similar';
  return (
    `${report.homeTeamName} motivation: ${h}/100. ` +
    `${report.awayTeamName} motivation: ${a}/100. ` +
    `Motivation gap is ${gapLabel} (${gap} points).`
  );
}

function buildTrapSummary(report: MatchRiskReport): string {
  if (!report.trapScore) return 'Trap analysis unavailable — odds data not provided.';
  const s = report.trapScore.score;
  if (s >= 65) return `High trap signal (${s}/100). Market odds may not reflect recent form.`;
  if (s >= 40) return `Moderate trap signal (${s}/100). Worth monitoring odds movement.`;
  return `Low trap signal (${s}/100). Odds appear consistent with recent form.`;
}

function buildNoBetSummary(report: MatchRiskReport): string {
  if (!report.noBetFlag?.flagged) return 'No major risk flags triggered.';
  const topReasons = report.noBetFlag.reasons.slice(0, 2);
  return `Risk flag active: ${topReasons.join('; ')}.`;
}

type BaseItem = Omit<PublisherFeedItem, 'readyToPublishMarkdown' | 'readyToPublishHtml' | 'jsonPayload'>;

function toMarkdown(item: BaseItem, opts: PublisherFeedOptions): string {
  const compliance = COMPLIANCE_TEXT[opts.language];
  const lines: string[] = [
    `## ${item.matchTitle}`,
    `**${item.leagueName}** | ${item.kickoffTime}`,
    '',
    '| Score | Value |',
    '|-------|-------|',
    `| Home Motivation | ${item.homeMotivationScore ?? '—'}/100 |`,
    `| Away Motivation | ${item.awayMotivationScore ?? '—'}/100 |`,
    `| Trap Score | ${item.trapScore ?? '—'}/100 |`,
    `| Risk Flag | ${item.noBetFlag ? '⚠️ Yes' : 'No'} |`,
    '',
    `**Motivation:** ${item.motivationSummary}`,
    '',
    `**Trap Analysis:** ${item.trapSummary}`,
    '',
    `**Recommended Action:** ${item.recommendedAction}`,
  ];
  if (opts.includeNoBetWarnings && item.noBetFlag) {
    lines.push('', `> ⚠️ ${item.noBetSummary}`);
  }
  if (opts.includeComplianceNote) {
    lines.push('', '---', `*${compliance.short}*`);
  }
  return lines.join('\n');
}

function toHtml(item: BaseItem, opts: PublisherFeedOptions): string {
  const compliance = COMPLIANCE_TEXT[opts.language];
  const flag = item.noBetFlag ? '<span class="mbr-flag-active">⚠️</span>' : 'None';
  const disclaimer = opts.includeComplianceNote
    ? `\n  <p class="mbr-disclaimer">${compliance.short}</p>`
    : '';
  return [
    '<article class="mbr-match-card">',
    `  <h2>${item.matchTitle}</h2>`,
    `  <p class="mbr-meta">${item.leagueName} &bull; ${item.kickoffTime}</p>`,
    '  <table class="mbr-scores">',
    `    <tr><th>Home Motivation</th><td>${item.homeMotivationScore ?? '—'}/100</td></tr>`,
    `    <tr><th>Away Motivation</th><td>${item.awayMotivationScore ?? '—'}/100</td></tr>`,
    `    <tr><th>Trap Score</th><td>${item.trapScore ?? '—'}/100</td></tr>`,
    `    <tr><th>Risk Flag</th><td>${flag}</td></tr>`,
    '  </table>',
    `  <p class="mbr-motivation">${item.motivationSummary}</p>`,
    `  <p class="mbr-trap">${item.trapSummary}</p>`,
    `  <p class="mbr-action"><strong>${item.recommendedAction}</strong></p>${disclaimer}`,
    '</article>',
  ].join('\n');
}

// ---- Main builder ----

export function buildPublisherFeed(
  matches: MatchRiskReport[],
  options: PublisherFeedOptions
): PublisherFeed {
  const items: PublisherFeedItem[] = matches.map((report) => {
    const homeMotivationScore = report.motivation?.homeMotivationScore ?? null;
    const awayMotivationScore = report.motivation?.awayMotivationScore ?? null;
    const trapScore = report.trapScore?.score ?? null;
    const noBetFlag = report.noBetFlag?.flagged ?? false;
    const confidence = lowestConfidence(report);
    const recommendedAction = getAction(noBetFlag, trapScore, options.language);
    const motivationSummary = buildMotivationSummary(report);
    const trapSummary = buildTrapSummary(report);
    const noBetSummary = buildNoBetSummary(report);

    const base: BaseItem = {
      fixtureId: report.fixtureId,
      matchTitle: `${report.homeTeamName} vs ${report.awayTeamName}`,
      countryCode: report.countryCode,
      leagueName: report.leagueName,
      kickoffTime: report.kickoffAt,
      homeTeam: report.homeTeamName,
      awayTeam: report.awayTeamName,
      homeMotivationScore,
      awayMotivationScore,
      trapScore,
      noBetFlag,
      confidence,
      recommendedAction,
      motivationSummary,
      trapSummary,
      noBetSummary,
    };

    return {
      ...base,
      readyToPublishMarkdown: toMarkdown(base, options),
      readyToPublishHtml: toHtml(base, options),
      jsonPayload: {
        fixtureId: report.fixtureId,
        matchTitle: base.matchTitle,
        homeTeam: report.homeTeamName,
        awayTeam: report.awayTeamName,
        countryCode: report.countryCode,
        leagueName: report.leagueName,
        kickoffTime: report.kickoffAt,
        scores: { homeMotivation: homeMotivationScore, awayMotivation: awayMotivationScore, trap: trapScore },
        flags: { noBet: noBetFlag },
        action: recommendedAction,
        confidence,
      },
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    language: options.language,
    countryCode: options.countryCode ?? null,
    matchCount: items.length,
    items,
  };
}
