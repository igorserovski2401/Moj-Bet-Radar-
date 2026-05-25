export type SupportedLanguage = 'en' | 'sr' | 'hr' | 'bs' | 'de';

export type ComplianceTextEntry = {
  readonly short: string;
  readonly full: string;
};

// Minimum meaning: match-risk analysis, not a guarantee, not financial advice, not a bet request.
// Avoid moralizing. Keep professional. No gambling-harm language in the short form.
export const COMPLIANCE_TEXT: Record<SupportedLanguage, ComplianceTextEntry> = {
  en: {
    short:
      'This is football match-risk analysis, not a betting recommendation. No outcome is guaranteed.',
    full:
      'Moj Bet Radar provides match-risk intelligence based on available football data. ' +
      'This analysis is not financial advice, not a guarantee of any outcome, and is not a ' +
      'request to place a bet. All sports outcomes are uncertain. Customers are responsible ' +
      'for compliance with local gambling advertising regulations. A final legal review is ' +
      'required before any commercial use of this data.',
  },
  sr: {
    short:
      'Ovo je analiza rizika fudbalskog meča, a ne preporuka za klađenje. Nijedan ishod nije zagarantovan.',
    full:
      'Moj Bet Radar pruža obaveštajne podatke o riziku meča zasnovane na dostupnim fudbalskim ' +
      'podacima. Ova analiza nije finansijski savet, nije garancija ishoda, niti poziv na klađenje. ' +
      'Svi sportski ishodi su neizvesni. Korisnici su odgovorni za usklađenost sa lokalnim propisima ' +
      'o oglašavanju igara na sreću.',
  },
  hr: {
    short:
      'Ovo je analiza rizika nogometne utakmice, a ne preporuka za klađenje. Nijedan ishod nije zajamčen.',
    full:
      'Moj Bet Radar pruža obavještajne podatke o riziku utakmice temeljene na dostupnim nogometnim ' +
      'podacima. Ova analiza nije financijski savjet, nije jamstvo ishoda niti poziv na klađenje. ' +
      'Svi sportski ishodi su neizvjesni. Korisnici su odgovorni za usklađenost s lokalnim propisima.',
  },
  bs: {
    short:
      'Ovo je analiza rizika fudbalskog meča, a ne preporuka za klađenje. Nijedan ishod nije zagarantiran.',
    full:
      'Moj Bet Radar pruža obavještajne podatke o riziku meča zasnovane na dostupnim fudbalskim ' +
      'podacima. Ova analiza nije finansijski savjet, nije garancija ishoda, niti poziv na klađenje. ' +
      'Svi sportski ishodi su neizvjesni.',
  },
  de: {
    short:
      'Dies ist eine Spielrisiko-Analyse, keine Wettempfehlung. Kein Ergebnis ist garantiert.',
    full:
      'Moj Bet Radar liefert Spielrisiko-Intelligence basierend auf verfügbaren Fußballdaten. ' +
      'Diese Analyse ist kein Finanzrat, keine Ergebnisgarantie und keine Aufforderung, eine Wette ' +
      'zu platzieren. Alle Sportergebnisse sind ungewiss. Kunden sind für die Einhaltung der lokalen ' +
      'Glücksspielwerbevorschriften verantwortlich.',
  },
};
